import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  useDirectoryListings,
} from "../../../hooks/api/directory"
import { PaymentFailureBadge } from "../directory-detail/payment-status"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  approved: "green",
  pending: "orange",
  rejected: "red",
}

const tierColors: Record<string, "green" | "orange" | "purple" | "grey"> = {
  enterprise: "purple",
  featured: "orange",
  verified: "green",
}

const PAGE_SIZE = 50

export const DirectoryList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""
  const qParam = searchParams.get("q") || ""
  // "?billing=failed" — the listings Stripe couldn't charge and hasn't since
  // recovered (Matteo 8/18). Server-side filter on the new payment_failed_at
  // column, backed by a partial index, so this stays one cheap query rather
  // than pulling every listing and filtering in the browser.
  const billingFilter = searchParams.get("billing") || ""
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)

  /**
   * Build the URL params for a state change, preserving every filter the
   * caller isn't changing. The old setPage/setStatus each rebuilt the params
   * from scratch and listed the ones they knew about, so adding a third filter
   * that way would have made paging silently drop it.
   */
  const buildParams = (
    overrides: Partial<{
      status: string
      q: string
      billing: string
      offset: number
    }>
  ) => {
    const next = {
      status: statusFilter,
      q: qParam,
      billing: billingFilter,
      offset,
      ...overrides,
    }
    const params: Record<string, string> = {}
    if (next.status) params.status = next.status
    if (next.q?.trim()) params.q = next.q.trim()
    if (next.billing) params.billing = next.billing
    if (next.offset > 0) params.offset = String(next.offset)
    return params
  }

  // Debounced search input — committed to URL after 300ms of inactivity
  // so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      // A new search resets to page 0 — the old offset points into a
      // different result set.
      setSearchParams(buildParams({ q: searchInput, offset: 0 }))
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query: Record<string, string | number> = {
    offset,
    limit: PAGE_SIZE,
  }
  if (statusFilter) query.verification_status = statusFilter
  if (qParam) query.q = qParam
  if (billingFilter === "failed") query.payment_failed = "true"
  const { listings, count, isLoading } = useDirectoryListings(query)

  const total = count ?? 0
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    setSearchParams(buildParams({ offset: nextOffset }))
  }
  const setStatus = (next: string) => {
    // Reset to page 0 when a filter changes — the row counts differ.
    setSearchParams(buildParams({ status: next, offset: 0 }))
  }
  const setBilling = (next: string) => {
    setSearchParams(buildParams({ billing: next, offset: 0 }))
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Directory Listings</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Showing {start}–{end} of {total} listings
            </Text>
          </div>
          <Input
            type="search"
            placeholder="Search business name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-72"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!statusFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setStatus("")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "primary" : "secondary"}
            size="small"
            onClick={() => setStatus("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "approved" ? "primary" : "secondary"}
            size="small"
            onClick={() => setStatus("approved")}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "primary" : "secondary"}
            size="small"
            onClick={() => setStatus("rejected")}
          >
            Rejected
          </Button>

          {/* Separate axis from the verification-status filter above: a
              listing can be approved AND failing to pay. Kept as its own
              toggle so the two compose instead of overwriting each other. */}
          <div className="ml-2 pl-2 border-l flex gap-2">
            <Button
              variant={billingFilter === "failed" ? "danger" : "secondary"}
              size="small"
              onClick={() =>
                setBilling(billingFilter === "failed" ? "" : "failed")
              }
              data-testid="filter-payment-failed"
            >
              Payment failed
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          {billingFilter === "failed"
            ? "No listings have a failed payment right now."
            : "No listings found"}
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(listings as any[]).map((listing: any) => (
              // role/tabIndex/keydown so the row is reachable by keyboard and
              // exposed to the accessibility tree — as a bare <div onClick> it
              // was invisible to screen readers and to UI automation.
              <div
                key={listing.id}
                role="button"
                tabIndex={0}
                aria-label={`Open ${listing.business_name || listing.id}`}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer focus:outline-none focus:bg-ui-bg-subtle focus-visible:ring-2 focus-visible:ring-ui-border-interactive"
                onClick={() => navigate(`/directory/${listing.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigate(`/directory/${listing.id}`)
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  {listing.logo_url ? (
                    <img
                      src={listing.logo_url}
                      alt={listing.business_name}
                      className="w-10 h-10 rounded object-contain border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-ui-bg-subtle flex items-center justify-center text-ui-fg-subtle">
                      {listing.business_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <Text className="font-medium">{listing.business_name}</Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      {listing.contact_email}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Visible on every row, not just under the filter, so a
                      failing member is obvious while browsing normally. */}
                  <PaymentFailureBadge listing={listing} />
                  <Badge
                    color={
                      tierColors[listing.subscription_tier] || "grey"
                    }
                  >
                    {listing.subscription_tier}
                  </Badge>
                  <Badge
                    color={
                      statusColors[listing.verification_status] || "grey"
                    }
                  >
                    {listing.verification_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <Text className="text-ui-fg-subtle text-sm">
              Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
              {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={!canPrev}
                onClick={() => setPage(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!canNext}
                onClick={() => setPage(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  )
}

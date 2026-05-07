import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  useDirectoryListings,
} from "../../../hooks/api/directory"

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
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)

  // Debounced search input — committed to URL after 300ms of inactivity
  // so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (searchInput.trim()) params.q = searchInput.trim()
      setSearchParams(params)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query: Record<string, string | number> = {
    offset,
    limit: PAGE_SIZE,
  }
  if (statusFilter) query.verification_status = statusFilter
  if (qParam) query.q = qParam
  const { listings, count, isLoading } = useDirectoryListings(query)

  const total = count ?? 0
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (qParam) params.q = qParam
    if (nextOffset > 0) params.offset = String(nextOffset)
    setSearchParams(params)
  }
  const setStatus = (next: string) => {
    // Reset to page 0 when status filter changes — the row counts differ.
    const params: Record<string, string> = {}
    if (next) params.status = next
    if (qParam) params.q = qParam
    setSearchParams(params)
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
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No listings found
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(listings as any[]).map((listing: any) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/directory/${listing.id}`)}
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

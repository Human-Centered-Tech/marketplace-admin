import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useBusinessOwners } from "../../../hooks/api/directory"

const PAGE_SIZE = 50

/**
 * "Business Owners" — the PEOPLE view for Brooke's account taxonomy (7/7):
 *   Business Owner = customer who owns a directory listing, no storefront
 *                    (the correct, complete state for service businesses)
 *   Merchant       = listing owner who also has a marketplace storefront
 * One row per owner with their listings; filter tabs split the two. Rows
 * click through to the owner's first listing (where linking/editing lives).
 */
export const BusinessOwnersList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFilter = searchParams.get("type") || ""
  const qParam = searchParams.get("q") || ""
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)

  // Debounced search input — committed to URL after 300ms of inactivity.
  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      const params: Record<string, string> = {}
      if (typeFilter) params.type = typeFilter
      if (searchInput.trim()) params.q = searchInput.trim()
      setSearchParams(params)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const query: Record<string, string | number> = { offset, limit: PAGE_SIZE }
  if (typeFilter) query.type = typeFilter
  if (qParam) query.q = qParam
  const { owners, count, isLoading } = useBusinessOwners(query)

  const total = count ?? 0
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    const params: Record<string, string> = {}
    if (typeFilter) params.type = typeFilter
    if (qParam) params.q = qParam
    if (nextOffset > 0) params.offset = String(nextOffset)
    setSearchParams(params)
  }
  const setType = (next: string) => {
    const params: Record<string, string> = {}
    if (next) params.type = next
    if (qParam) params.q = qParam
    setSearchParams(params)
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Business Owners</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Showing {start}–{end} of {total} listing owners
            </Text>
          </div>
          <Input
            type="search"
            placeholder="Search name, email, or business…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-72"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!typeFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setType("")}
          >
            All
          </Button>
          <Button
            variant={typeFilter === "owners_only" ? "primary" : "secondary"}
            size="small"
            onClick={() => setType("owners_only")}
          >
            Business Owners
          </Button>
          <Button
            variant={typeFilter === "merchants" ? "primary" : "secondary"}
            size="small"
            onClick={() => setType("merchants")}
          >
            Merchants
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !owners?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No listing owners found
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(owners as any[]).map((owner: any) => {
              const name =
                [owner.first_name, owner.last_name].filter(Boolean).join(" ") ||
                owner.email
              const listings: any[] = owner.listings ?? []
              return (
                <div
                  key={owner.id}
                  className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                  onClick={() => {
                    if (listings[0]?.id) navigate(`/directory/${listings[0].id}`)
                  }}
                >
                  <div>
                    <Text className="font-medium">{name}</Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      {owner.email}
                    </Text>
                    <Text className="text-ui-fg-subtle text-xs mt-0.5">
                      {listings
                        .map((l) => l.business_name)
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    {owner.listing_count > 1 && (
                      <Badge color="grey">{owner.listing_count} listings</Badge>
                    )}
                    <Badge color={owner.is_merchant ? "purple" : "blue"}>
                      {owner.is_merchant ? "Merchant" : "Business Owner"}
                    </Badge>
                  </div>
                </div>
              )
            })}
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

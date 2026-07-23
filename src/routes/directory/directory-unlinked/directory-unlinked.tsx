import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useUnlinkedMemberships } from "../../../hooks/api/directory"

const PAGE_SIZE = 100

/**
 * "Memberships to Link" — grandfathered members whose listing is claimed +
 * published (subscription active, bubble_paid=yes) but has NO Stripe
 * subscription linked yet. Grandfathered claims publish for free (their
 * Bubble-era membership carries over), so if the member never emails Brooke,
 * their existing Stripe sub never gets linked and falls off her radar. This is
 * that follow-up queue. Rows click through to the listing (where the "Link
 * existing membership" tool lives).
 */
export const DirectoryUnlinkedList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get("q") || ""
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)

  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => setSearchInput(qParam), [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      const params: Record<string, string> = {}
      if (searchInput.trim()) params.q = searchInput.trim()
      setSearchParams(params)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const query: Record<string, string | number> = { offset, limit: PAGE_SIZE }
  if (qParam) query.q = qParam
  const { listings, count, isLoading } = useUnlinkedMemberships(query)

  const total = count ?? 0
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    const params: Record<string, string> = {}
    if (qParam) params.q = qParam
    if (nextOffset > 0) params.offset = String(nextOffset)
    setSearchParams(params)
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Memberships to Link</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Grandfathered members who claimed &amp; published without a Stripe
              subscription linked — {total} to follow up on
            </Text>
          </div>
          <Input
            type="search"
            placeholder="Search business or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-72"
          />
        </div>
        <Text className="text-ui-fg-subtle text-xs">
          Open a row to use “Link existing membership” and attach their prior
          Stripe subscription.
        </Text>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          🎉 Nothing to link — every claimed grandfathered listing has a
          subscription attached.
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(listings as any[]).map((l: any) => {
              const name =
                [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                l.owner_email
              const claimed = l.claimed_at
                ? new Date(l.claimed_at).toLocaleDateString()
                : ""
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                  onClick={() => navigate(`/directory/${l.id}`)}
                >
                  <div>
                    <Text className="font-medium">{l.business_name}</Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      {name} · {l.owner_email}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    {claimed && (
                      <Text className="text-ui-fg-subtle text-xs">
                        claimed {claimed}
                      </Text>
                    )}
                    <Badge color="orange">No sub linked</Badge>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <Text className="text-ui-fg-subtle text-sm">
              Showing {start}–{end} of {total}
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

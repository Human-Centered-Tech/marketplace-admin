import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useUnlinkedMemberships } from "../../../hooks/api/directory"

const PAGE_SIZE = 100

// Two follow-up queues on one page. They're different failures with the same
// remedy (open the row, use the link tools), so they share the list rather than
// getting a second nav entry.
const MODES = [
  {
    value: "stripe",
    label: "No Stripe sub",
    subtitle:
      "Grandfathered members who claimed & published without a Stripe subscription linked",
    hint: "Open a row to use “Link existing membership” and attach their prior Stripe subscription.",
    empty:
      "🎉 Nothing to link — every claimed grandfathered listing has a subscription attached.",
    badge: "No sub linked",
  },
  {
    value: "shop",
    label: "No shop attached",
    subtitle:
      "Listings whose owner now has a shop, but the listing was linked before it existed — vendor_id is still empty",
    hint: "vendor_id is resolved once, at link time. These were linked too early, so their dashboard still treats them as a new signup. Open a row and click Link again with the same email — the row clears itself.",
    empty:
      "🎉 Nothing to re-link — every owner with a shop has it attached to their listing.",
    badge: "No shop linked",
  },
] as const

/**
 * "Memberships to Link" — Brooke's two follow-up queues.
 *
 * mode=stripe (default): grandfathered members whose listing is claimed +
 * published (subscription active, bubble_paid=yes) but has NO Stripe
 * subscription linked yet. Grandfathered claims publish for free (their
 * Bubble-era membership carries over), so if the member never emails Brooke,
 * their existing Stripe sub never gets linked and falls off her radar.
 *
 * mode=shop (7/31): listings linked to an owner BEFORE that owner's seller
 * existed, so vendor_id was never filled in and nothing re-runs it. Re-clicking
 * Link fixes them — the queue exists because nothing else made them visible
 * (see context/admin-link-vendor-sync-decision-2026-07-31.md).
 *
 * Rows click through to the listing, where both link tools live.
 */
export const DirectoryUnlinkedList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get("q") || ""
  const modeParam = searchParams.get("mode") === "shop" ? "shop" : "stripe"
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)
  const modeCopy = MODES.find((m) => m.value === modeParam)!

  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => setSearchInput(qParam), [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      const params: Record<string, string> = {}
      if (modeParam !== "stripe") params.mode = modeParam
      if (searchInput.trim()) params.q = searchInput.trim()
      setSearchParams(params)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const query: Record<string, string | number> = { offset, limit: PAGE_SIZE }
  if (qParam) query.q = qParam
  // Only sent when non-default, so the existing queue keeps its exact request
  // shape (and its cached query key).
  if (modeParam !== "stripe") query.mode = modeParam
  const { listings, count, isLoading } = useUnlinkedMemberships(query)

  const total = count ?? 0
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    const params: Record<string, string> = {}
    if (modeParam !== "stripe") params.mode = modeParam
    if (qParam) params.q = qParam
    if (nextOffset > 0) params.offset = String(nextOffset)
    setSearchParams(params)
  }
  // Switching tabs drops the offset — the two queues have unrelated row counts,
  // so page 3 of one is rarely page 3 of the other.
  const setMode = (next: string) => {
    const params: Record<string, string> = {}
    if (next !== "stripe") params.mode = next
    if (qParam) params.q = qParam
    setSearchParams(params)
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Memberships to Link</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {modeCopy.subtitle} — {total} to follow up on
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
        <div className="flex gap-2">
          {MODES.map((m) => (
            <Button
              key={m.value}
              variant={modeParam === m.value ? "primary" : "secondary"}
              size="small"
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
        <Text className="text-ui-fg-subtle text-xs">{modeCopy.hint}</Text>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          {modeCopy.empty}
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
                    <Badge color="orange">{modeCopy.badge}</Badge>
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

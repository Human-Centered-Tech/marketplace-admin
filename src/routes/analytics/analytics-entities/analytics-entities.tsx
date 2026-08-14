import { Badge, Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  useAnalyticsEntities,
  useAnalyticsEntity,
} from "../../../hooks/api/analytics"

const PAGE_SIZE = 25

const TYPES: { key: string; label: string }[] = [
  { key: "directory_listing", label: "Listings" },
  { key: "seller", label: "Shops" },
  { key: "product", label: "Products" },
  { key: "gift_guide", label: "Guides" },
]

const RANGES: { days: number; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "All time" },
]

/**
 * "Listings & Shops" analytics (punchlist carry-admin-analytics): per-entity
 * numbers Brooke can read without logging in as the vendor. Top lists by page
 * views with clicks / cart-adds / favorites, and a per-row daily breakdown.
 * Web events only — the mobile app doesn't emit analytics yet.
 */
export const AnalyticsEntities = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const entityType = searchParams.get("type") || "directory_listing"
  const days = parseInt(searchParams.get("days") || "30", 10)
  const qParam = searchParams.get("q") || ""
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      updateParams({ q: searchInput.trim(), offset: 0 })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const updateParams = (
    changes: Partial<{ type: string; days: number; q: string; offset: number }>
  ) => {
    const next = {
      type: changes.type ?? entityType,
      days: changes.days ?? days,
      q: changes.q !== undefined ? changes.q : qParam,
      offset: changes.offset ?? offset,
    }
    const params: Record<string, string> = {}
    if (next.type !== "directory_listing") params.type = next.type
    if (next.days !== 30) params.days = String(next.days)
    if (next.q) params.q = next.q
    if (next.offset > 0) params.offset = String(next.offset)
    setSearchParams(params)
    setExpandedId(null)
  }

  const query: Record<string, string | number> = {
    entity_type: entityType,
    days,
    limit: PAGE_SIZE,
    offset,
  }
  if (qParam) query.q = qParam
  const { entities, count, isLoading } = useAnalyticsEntities(query)

  const total = count ?? 0
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const showCommerce = entityType === "product"

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Listings &amp; Shops</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Page views per listing, shop, and product — no vendor login
              needed. Web traffic only (the app doesn&rsquo;t report yet);
              favorites &amp; purchases tracked since Jul 31.
            </Text>
          </div>
          <Input
            type="search"
            placeholder="Search by name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <Button
                key={t.key}
                variant={entityType === t.key ? "primary" : "secondary"}
                size="small"
                onClick={() => updateParams({ type: t.key, offset: 0 })}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                variant={days === r.days ? "primary" : "secondary"}
                size="small"
                onClick={() => updateParams({ days: r.days, offset: 0 })}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !entities?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No traffic recorded for this selection.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_repeat(4,72px)] gap-x-2 px-4 py-2 border-b text-ui-fg-subtle text-xs">
            <span>Name</span>
            <span className="text-right">Views</span>
            <span className="text-right">Clicks</span>
            <span className="text-right">{showCommerce ? "Cart adds" : "—"}</span>
            <span className="text-right">{showCommerce ? "Favorites" : "—"}</span>
          </div>
          <div className="divide-y">
            {entities.map((e) => (
              <div key={e.id}>
                <div
                  className="grid grid-cols-[1fr_repeat(4,72px)] gap-x-2 items-center px-4 py-3 hover:bg-ui-bg-subtle cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === e.id ? null : e.id)
                  }
                >
                  <div className="min-w-0">
                    <Text className="font-medium truncate">{e.name}</Text>
                    <Text className="text-ui-fg-muted text-xs truncate">
                      {e.id}
                      {e.unresolved && entityType !== "gift_guide" && (
                        <Badge color="grey" className="ml-2">
                          not found — deleted?
                        </Badge>
                      )}
                    </Text>
                  </div>
                  <Text className="text-right tabular-nums">{e.views}</Text>
                  <Text className="text-right tabular-nums text-ui-fg-subtle">
                    {e.clicks || "–"}
                  </Text>
                  <Text className="text-right tabular-nums text-ui-fg-subtle">
                    {showCommerce ? e.cart_adds || "–" : ""}
                  </Text>
                  <Text className="text-right tabular-nums text-ui-fg-subtle">
                    {showCommerce ? e.favorites || "–" : ""}
                  </Text>
                </div>
                {expandedId === e.id && (
                  <EntityDaily id={e.id} entityType={entityType} days={days} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <Text className="text-ui-fg-subtle text-sm">
              Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
              {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} total
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={!canPrev}
                onClick={() =>
                  updateParams({ offset: Math.max(0, offset - PAGE_SIZE) })
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!canNext}
                onClick={() => updateParams({ offset: offset + PAGE_SIZE })}
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

// Inline daily breakdown: one row per day with a single-hue bar (views) plus
// the exact number — the bar reinforces magnitude, the text carries the value,
// so this doubles as the accessible table view. Secondary events appear as
// text only when nonzero.
const EntityDaily = ({
  id,
  entityType,
  days,
}: {
  id: string
  entityType: string
  days: number
}) => {
  const { entity, isLoading } = useAnalyticsEntity(id, {
    entity_type: entityType,
    days,
  })

  if (isLoading) {
    return (
      <div className="px-4 py-3 bg-ui-bg-subtle text-ui-fg-subtle text-sm">
        Loading daily breakdown…
      </div>
    )
  }
  if (!entity?.daily?.length) {
    return (
      <div className="px-4 py-3 bg-ui-bg-subtle text-ui-fg-subtle text-sm">
        No daily data in this range.
      </div>
    )
  }

  const maxViews = Math.max(...entity.daily.map((d) => d.views), 1)

  return (
    <div className="px-4 py-3 bg-ui-bg-subtle">
      <Text className="text-ui-fg-subtle text-xs mb-2">
        Daily page views · {entity.totals.views} total
        {entity.totals.clicks > 0 && ` · ${entity.totals.clicks} clicks`}
        {entity.totals.cart_adds > 0 && ` · ${entity.totals.cart_adds} cart adds`}
        {entity.totals.favorites > 0 && ` · ${entity.totals.favorites} favorites`}
      </Text>
      <div className="flex flex-col gap-0.5">
        {entity.daily.map((d) => (
          <div
            key={d.date}
            className="grid grid-cols-[76px_1fr_40px] items-center gap-x-2 text-xs"
            title={`${d.date}: ${d.views} views${d.clicks ? `, ${d.clicks} clicks` : ""}${d.cart_adds ? `, ${d.cart_adds} cart adds` : ""}`}
          >
            <span className="text-ui-fg-muted tabular-nums">
              {new Date(d.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="h-2 rounded-sm bg-ui-bg-base overflow-hidden">
              <div
                className="h-full rounded-sm bg-ui-bg-interactive"
                style={{ width: `${Math.max((d.views / maxViews) * 100, d.views > 0 ? 2 : 0)}%` }}
              />
            </div>
            <span className="text-right text-ui-fg-subtle tabular-nums">
              {d.views}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

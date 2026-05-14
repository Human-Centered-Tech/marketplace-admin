import { Container, Heading, Text } from "@medusajs/ui"
import { useAnalyticsOverview } from "../../../hooks/api/analytics"

export const AnalyticsOverview = () => {
  const { overview, isLoading } = useAnalyticsOverview()

  const data = overview as any

  if (isLoading) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      </Container>
    )
  }

  const events = data?.events || []
  const totalEvents = data?.total_events ?? events.reduce(
    (sum: number, e: any) => sum + (e.count || 0),
    0
  )
  const period = data?.period

  const tx = data?.transactions as
    | { count: number; total_usd: number; currency: string; status_filter: string }
    | undefined
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  // Funnel: fixed 4-step order so visitors → buyers reads left-to-right.
  // Each step shows its count plus the conversion rate from the prior
  // step ("X% of cart_adds become purchases"). When the prior step is
  // 0 we skip the rate (avoid /0 noise).
  const funnel = data?.funnel as
    | {
        product_views: number
        favorites: number
        cart_adds: number
        purchases: number
      }
    | undefined
  const funnelSteps: { key: string; label: string; count: number }[] = funnel
    ? [
        { key: "product_views", label: "Product Views", count: funnel.product_views },
        { key: "favorites", label: "Favorites", count: funnel.favorites },
        { key: "cart_adds", label: "Cart Adds", count: funnel.cart_adds },
        { key: "purchases", label: "Purchases", count: funnel.purchases },
      ]
    : []

  // Event-type counts: turn { product_view: 12, cart_add: 3 } into a
  // descending list of cards so the most-fired event surfaces first.
  const counts = (data?.counts || {}) as Record<string, number>
  const countEntries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  const customers = data?.customers as
    | { total: number; email_verified: number; last_7d: number; last_30d: number }
    | undefined
  const vendorFunnel = data?.vendor_funnel as
    | {
        signed_up: number
        stripe_active: number
        subscription_active: number
        with_published_product: number
      }
    | undefined
  const directorySubs = data?.directory_subscriptions as
    | {
        active_by_tier: Record<string, number>
        estimated_arr_usd: number
        pending_verification: number
        unclaimed_imports: number
      }
    | undefined
  const tierEntries = Object.entries(directorySubs?.active_by_tier ?? {}).sort(
    (a, b) => b[1] - a[1]
  )

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="mb-4">
          <Heading level="h1">Analytics Overview</Heading>
          {period && (
            <Text className="text-ui-fg-subtle mt-1">
              Period: {period.start ? new Date(period.start).toLocaleDateString() : "—"}{" "}
              to {period.end ? new Date(period.end).toLocaleDateString() : "—"}
            </Text>
          )}
          <Text className="text-ui-fg-subtle mt-1">
            Total events: {totalEvents}
          </Text>
        </div>
      </Container>

      {tx && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Container>
            <div className="text-center">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Total Transactions
              </Text>
              <Heading level="h2">{tx.count}</Heading>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Completed orders, USD only
              </Text>
            </div>
          </Container>
          <Container>
            <div className="text-center">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Total Transaction Value
              </Text>
              <Heading level="h2">
                {usdFormatter.format(tx.total_usd ?? 0)}
              </Heading>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Completed orders, USD only
              </Text>
            </div>
          </Container>
        </div>
      )}

      {/* Customers */}
      {customers && (
        <Container>
          <Heading level="h2" className="mb-4">
            Customers
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">Total</Text>
              <Heading level="h2">{customers.total}</Heading>
            </div>
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Email Verified
              </Text>
              <Heading level="h2">{customers.email_verified}</Heading>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                {customers.total > 0
                  ? `${((customers.email_verified / customers.total) * 100).toFixed(0)}% verified`
                  : "—"}
              </Text>
            </div>
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">Signups (7d)</Text>
              <Heading level="h2">{customers.last_7d}</Heading>
            </div>
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">Signups (30d)</Text>
              <Heading level="h2">{customers.last_30d}</Heading>
            </div>
          </div>
        </Container>
      )}

      {/* Vendor funnel — sign up → Stripe → subscription → published product */}
      {vendorFunnel && (
        <Container>
          <Heading level="h2" className="mb-4">
            Vendor Funnel
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                { key: "signed_up", label: "Signed up" },
                { key: "stripe_active", label: "Stripe Connect active" },
                { key: "subscription_active", label: "Directory subscription" },
                {
                  key: "with_published_product",
                  label: "Published a product",
                },
              ] as const
            ).map((step, i, arr) => {
              const count = vendorFunnel[step.key as keyof typeof vendorFunnel]
              const prevCount =
                i > 0 ? vendorFunnel[arr[i - 1].key as keyof typeof vendorFunnel] : 0
              const conversion =
                i > 0 && prevCount > 0
                  ? `${((count / prevCount) * 100).toFixed(0)}% of prior`
                  : null
              return (
                <div key={step.key} className="text-center border rounded-md p-4">
                  <Text className="text-ui-fg-subtle text-sm mb-1">
                    {step.label}
                  </Text>
                  <Heading level="h2">{count}</Heading>
                  {conversion && (
                    <Text className="text-ui-fg-subtle text-xs mt-1">
                      {conversion}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        </Container>
      )}

      {/* Directory subscriptions — paying subscribers + projected ARR */}
      {directorySubs && (
        <Container>
          <div className="flex items-baseline justify-between mb-4">
            <Heading level="h2">Directory Subscriptions</Heading>
            <Text className="text-ui-fg-subtle text-xs">
              Excludes unclaimed Bubble imports
            </Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Projected ARR
              </Text>
              <Heading level="h2">
                {usdFormatter.format(directorySubs.estimated_arr_usd ?? 0)}
              </Heading>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Sum of annual tier prices × active claimed subscriptions
              </Text>
            </div>
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Pending verification
              </Text>
              <Heading level="h2">{directorySubs.pending_verification}</Heading>
            </div>
            <div className="text-center border rounded-md p-4">
              <Text className="text-ui-fg-subtle text-sm mb-1">
                Unclaimed imports
              </Text>
              <Heading level="h2">{directorySubs.unclaimed_imports}</Heading>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Pool available to be claimed
              </Text>
            </div>
          </div>
          {tierEntries.length > 0 ? (
            <div>
              <Text className="text-ui-fg-subtle text-xs uppercase tracking-wider mb-2">
                Active by tier
              </Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tierEntries.map(([tier, count]) => (
                  <div
                    key={tier}
                    className="text-center border rounded-md p-3"
                  >
                    <Text className="text-ui-fg-subtle text-xs mb-1">
                      {tier}
                    </Text>
                    <Heading level="h3">{count}</Heading>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Text className="text-ui-fg-subtle text-sm">
              No active paid subscriptions yet.
            </Text>
          )}
        </Container>
      )}

      {/* Funnel: ordered conversion view with rate between each step */}
      {funnelSteps.length > 0 && (
        <Container>
          <Heading level="h2" className="mb-4">
            Funnel
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {funnelSteps.map((step, i) => {
              const prev = i > 0 ? funnelSteps[i - 1].count : 0
              const conversion =
                i > 0 && prev > 0
                  ? `${((step.count / prev) * 100).toFixed(1)}% of ${
                      funnelSteps[i - 1].label.toLowerCase()
                    }`
                  : null
              return (
                <div
                  key={step.key}
                  className="text-center border rounded-md p-4"
                >
                  <Text className="text-ui-fg-subtle text-sm mb-1">
                    {step.label}
                  </Text>
                  <Heading level="h2">{step.count}</Heading>
                  {conversion && (
                    <Text className="text-ui-fg-subtle text-xs mt-1">
                      {conversion}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        </Container>
      )}

      {/* Event-type breakdown, sorted by count descending */}
      {countEntries.length > 0 && (
        <Container>
          <Heading level="h2" className="mb-4">
            Events by Type
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {countEntries.map(([type, count]) => (
              <div
                key={type}
                className="text-center border rounded-md p-4"
              >
                <Text className="text-ui-fg-subtle text-sm mb-1">
                  {type.replace(/_/g, " ")}
                </Text>
                <Heading level="h2">{count}</Heading>
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Event type counts as cards */}
      {events.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {events.map((item: any, idx: number) => (
            <Container key={idx}>
              <div className="text-center">
                <Text className="text-ui-fg-subtle text-sm mb-1">
                  {item.event_type || item.type || "Unknown"}
                </Text>
                <Heading level="h2">{item.count ?? 0}</Heading>
              </div>
            </Container>
          ))}
        </div>
      ) : (
        <Container>
          <div className="p-6 text-center text-ui-fg-subtle">
            No analytics data available
          </div>
        </Container>
      )}

      {/* Scalar metrics from the overview response. Skip nested objects
          (counts, funnel, top_entities, daily_active, transactions) —
          those are rendered in their own dedicated cards/sections, and
          calling String() on them would print "[object Object]". */}
      {!events.length && data && typeof data === "object" && (
        <Container>
          <Heading level="h2" className="mb-4">
            Metrics
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data)
              .filter(([key, value]) => {
                if (
                  key === "events" ||
                  key === "period" ||
                  key === "total_events" ||
                  key === "period_start" ||
                  key === "period_end"
                ) {
                  return false
                }
                return (
                  value === null ||
                  typeof value === "string" ||
                  typeof value === "number" ||
                  typeof value === "boolean"
                )
              })
              .map(([key, value]) => (
                <div key={key}>
                  <Text className="font-medium text-sm">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text className="text-ui-fg-subtle text-lg">
                    {value === null ? "—" : String(value)}
                  </Text>
                </div>
              ))}
          </div>
        </Container>
      )}
    </div>
  )
}

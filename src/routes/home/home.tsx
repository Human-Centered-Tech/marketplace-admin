import { useQuery } from "@tanstack/react-query"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
} from "@medusajs/ui"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/client"

/**
 * Admin home — a unified dashboard showing pending actions and
 * top-line metrics across all modules (PRD §4.2.6).
 *
 * Kept intentionally dense and scannable — each tile links to the
 * full module page for deeper work.
 */
export const Home = () => {
  const { data: overview } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () =>
      sdk.client
        .fetch<{
          total_events: number
          dau: number
          wau: number
          mau: number
          funnel: {
            product_views: number
            favorites: number
            cart_adds: number
            purchases: number
          }
        }>("/admin/analytics/overview", { query: { days: 30 } })
        .catch(() => null),
  })

  const { data: pendingDirectory } = useQuery({
    queryKey: ["directory-pending"],
    queryFn: () =>
      sdk.client
        .fetch<{ count: number }>("/admin/directory/pending", {
          query: { limit: 1 },
        })
        .catch(() => ({ count: 0 })),
  })

  const { data: pendingBarter } = useQuery({
    queryKey: ["barter-pending"],
    queryFn: () =>
      sdk.client
        .fetch<{ count: number }>("/admin/barter/listings", {
          query: { moderation_status: "pending", limit: 1 },
        })
        .catch(() => ({ count: 0 })),
  })

  return (
    <Container className="p-0">
      <div className="p-6 border-b">
        <Heading level="h1">Admin Dashboard</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Overview of Catholic Owned activity and pending actions
        </Text>
      </div>

      {/* Pending actions */}
      <div className="p-6 border-b">
        <Heading level="h2" className="mb-4">
          Pending Actions
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PendingTile
            label="Directory verifications"
            count={pendingDirectory?.count ?? 0}
            to="/directory/pending"
            description="Business listings awaiting verification"
          />
          <PendingTile
            label="Barter moderation"
            count={pendingBarter?.count ?? 0}
            to="/barter"
            description="Community listings awaiting moderation"
          />
          <PendingTile
            label="Vendor applications"
            count={0}
            to="/sellers"
            description="New seller accounts to review"
          />
        </div>
      </div>

      {/* Activity snapshot */}
      <div className="p-6 border-b">
        <Heading level="h2" className="mb-4">
          Activity (last 30 days)
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricTile label="DAU" value={overview?.dau ?? "—"} />
          <MetricTile label="WAU" value={overview?.wau ?? "—"} />
          <MetricTile label="MAU" value={overview?.mau ?? "—"} />
          <MetricTile
            label="Total events"
            value={overview?.total_events ?? "—"}
          />
        </div>
        <Link to="/analytics" className="text-ui-fg-interactive text-sm underline">
          Open full analytics →
        </Link>
      </div>

      {/* Conversion funnel */}
      <div className="p-6 border-b">
        <Heading level="h2" className="mb-4">
          Conversion Funnel (last 30 days)
        </Heading>
        <div className="space-y-2">
          <FunnelRow
            label="Product views"
            value={overview?.funnel.product_views ?? 0}
            of={overview?.funnel.product_views || 1}
          />
          <FunnelRow
            label="Favorites"
            value={overview?.funnel.favorites ?? 0}
            of={overview?.funnel.product_views || 1}
          />
          <FunnelRow
            label="Cart adds"
            value={overview?.funnel.cart_adds ?? 0}
            of={overview?.funnel.product_views || 1}
          />
          <FunnelRow
            label="Purchases"
            value={overview?.funnel.purchases ?? 0}
            of={overview?.funnel.product_views || 1}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="p-6">
        <Heading level="h2" className="mb-4">
          Manage
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink to="/orders" label="Orders" />
          <QuickLink to="/customers" label="Users" />
          <QuickLink to="/directory" label="Directory" />
          <QuickLink to="/networking" label="Networking" />
          <QuickLink to="/barter" label="Barter" />
          <QuickLink to="/registry" label="Registries" />
          <QuickLink to="/platform-credits" label="Platform Credits" />
          <QuickLink to="/campaigns" label="Campaigns" />
        </div>
      </div>
    </Container>
  )
}

const PendingTile = ({
  label,
  count,
  to,
  description,
}: {
  label: string
  count: number
  to: string
  description: string
}) => (
  <Link
    to={to}
    className="block p-4 border rounded-md hover:bg-ui-bg-subtle transition-colors"
  >
    <div className="flex items-center justify-between mb-1">
      <Text weight="plus">{label}</Text>
      {count > 0 && <Badge color="orange">{count}</Badge>}
    </div>
    <Text size="small" className="text-ui-fg-subtle">
      {description}
    </Text>
  </Link>
)

const MetricTile = ({
  label,
  value,
}: {
  label: string
  value: number | string
}) => (
  <div className="p-4 border rounded-md">
    <Text size="small" className="text-ui-fg-subtle uppercase tracking-wider">
      {label}
    </Text>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
)

const FunnelRow = ({
  label,
  value,
  of,
}: {
  label: string
  value: number
  of: number
}) => {
  const pct = Math.round((value / of) * 100)
  return (
    <div className="flex items-center gap-4">
      <div className="w-36 text-sm">{label}</div>
      <div className="flex-1 bg-ui-bg-subtle rounded h-4 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-ui-fg-interactive"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="w-24 text-sm text-right text-ui-fg-subtle">
        {value.toLocaleString()} ({pct}%)
      </div>
    </div>
  )
}

const QuickLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to}>
    <Button variant="secondary" size="small" className="w-full">
      {label}
    </Button>
  </Link>
)

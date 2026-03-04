import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useSearchParams } from "react-router-dom"
import { useNetworkingSubscriptions } from "../../../hooks/api/networking"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  pending: "orange",
  cancelled: "red",
  expired: "grey",
}

export const NetworkingSubscribers = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""

  const { subscriptions, count, isLoading } = useNetworkingSubscriptions(
    statusFilter ? { status: statusFilter } : undefined
  )

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <Heading level="h1">Networking Subscribers</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {count ?? 0} subscribers total
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!statusFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setSearchParams({})}
          >
            All
          </Button>
          {["active", "pending", "cancelled", "expired"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "primary" : "secondary"}
              size="small"
              onClick={() => setSearchParams({ status: s })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !subscriptions?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No subscribers found
        </div>
      ) : (
        <div className="divide-y">
          {(subscriptions as any[]).map((sub: any) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <Text className="font-medium text-sm">{sub.customer_id}</Text>
                <Text className="text-ui-fg-subtle text-xs">
                  Plan: {sub.plan || "—"}
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Text className="text-ui-fg-subtle text-xs">
                    {sub.starts_at
                      ? new Date(sub.starts_at).toLocaleDateString()
                      : "—"}{" "}
                    -{" "}
                    {sub.ends_at
                      ? new Date(sub.ends_at).toLocaleDateString()
                      : "—"}
                  </Text>
                </div>
                <Badge color={statusColors[sub.status] || "grey"}>
                  {sub.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

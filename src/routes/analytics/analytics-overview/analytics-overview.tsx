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

      {/* Fallback: if overview returns a flat object with counts */}
      {!events.length && data && typeof data === "object" && (
        <Container>
          <Heading level="h2" className="mb-4">
            Metrics
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data)
              .filter(
                ([key]) =>
                  key !== "events" &&
                  key !== "period" &&
                  key !== "total_events"
              )
              .map(([key, value]) => (
                <div key={key}>
                  <Text className="font-medium text-sm">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text className="text-ui-fg-subtle text-lg">
                    {String(value)}
                  </Text>
                </div>
              ))}
          </div>
        </Container>
      )}
    </div>
  )
}

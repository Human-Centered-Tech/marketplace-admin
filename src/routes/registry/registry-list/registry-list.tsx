import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useRegistries } from "../../../hooks/api/registry"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  closed: "orange",
  archived: "grey",
}

const sacramentLabels: Record<string, string> = {
  baptism: "Baptism",
  first_communion: "First Communion",
  confirmation: "Confirmation",
  wedding: "Wedding",
  ordination: "Ordination",
  other: "Other",
}

export const RegistryList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""
  const sacramentFilter = searchParams.get("sacrament_type") || ""

  const query: Record<string, string> = {}
  if (statusFilter) query.status = statusFilter
  if (sacramentFilter) query.sacrament_type = sacramentFilter

  const { registries, count, isLoading } = useRegistries(
    Object.keys(query).length ? query : undefined
  )

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <Heading level="h1">Gift Registries</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {count ?? 0} registries total
            </Text>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 p-4 border-b flex-wrap">
          <Text className="text-ui-fg-subtle text-sm font-medium mr-2 self-center">
            Status:
          </Text>
          <Button
            variant={!statusFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("status", "")}
          >
            All
          </Button>
          {["active", "closed", "archived"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "primary" : "secondary"}
              size="small"
              onClick={() => setFilter("status", s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}

          <div className="w-px bg-ui-border-base mx-2" />

          <Text className="text-ui-fg-subtle text-sm font-medium mr-2 self-center">
            Sacrament:
          </Text>
          <Button
            variant={!sacramentFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setFilter("sacrament_type", "")}
          >
            All
          </Button>
          {Object.entries(sacramentLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={sacramentFilter === key ? "primary" : "secondary"}
              size="small"
              onClick={() => setFilter("sacrament_type", key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
        ) : !registries?.length ? (
          <div className="p-6 text-center text-ui-fg-subtle">
            No registries found
          </div>
        ) : (
          <div className="divide-y">
            {(registries as any[]).map((registry: any) => (
              <div
                key={registry.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/registry/${registry.id}`)}
              >
                <div>
                  <Text className="font-medium">{registry.title}</Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    {registry.event_date
                      ? new Date(registry.event_date).toLocaleDateString()
                      : "No date set"}
                    {registry.sacrament_type &&
                      ` \u00B7 ${sacramentLabels[registry.sacrament_type] || registry.sacrament_type}`}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text className="text-ui-fg-subtle text-xs">
                    {registry.items?.length ?? 0} items
                  </Text>
                  <Badge color={statusColors[registry.status] || "grey"}>
                    {registry.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}

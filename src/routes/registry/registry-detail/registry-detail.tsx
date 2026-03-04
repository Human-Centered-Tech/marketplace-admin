import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useRegistry, useDeleteRegistry } from "../../../hooks/api/registry"

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

export const RegistryDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useRegistry(id!)
  const deleteMutation = useDeleteRegistry()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const registry = (data as any)?.registry

  if (isLoading) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      </Container>
    )
  }

  if (!registry) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">
          Registry not found
        </div>
      </Container>
    )
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id!)
    navigate("/registry")
  }

  const items = registry.items || []

  return (
    <div className="flex flex-col gap-4">
      {/* Registry Info */}
      <Container>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Heading level="h1">{registry.title}</Heading>
            <Text className="text-ui-fg-subtle">
              {registry.event_date
                ? new Date(registry.event_date).toLocaleDateString()
                : "No date set"}
            </Text>
          </div>
          <Badge color={statusColors[registry.status] || "grey"}>
            {registry.status}
          </Badge>
        </div>

        {registry.description && (
          <div className="mb-4">
            <Text className="font-medium mb-1">Description</Text>
            <Text className="text-ui-fg-subtle">{registry.description}</Text>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Text className="font-medium mb-1">Sacrament Type</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {sacramentLabels[registry.sacrament_type] ||
                registry.sacrament_type ||
                "\u2014"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Event Date</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {registry.event_date
                ? new Date(registry.event_date).toLocaleDateString()
                : "\u2014"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Sharing Token</Text>
            <Text className="text-ui-fg-subtle text-sm font-mono">
              {registry.sharing_token || "\u2014"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Customer</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {registry.customer_id || "\u2014"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Created</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {registry.created_at
                ? new Date(registry.created_at).toLocaleString()
                : "\u2014"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Items</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {items.length} items
            </Text>
          </div>
        </div>

        <div className="flex gap-2">
          {!showDeleteConfirm ? (
            <Button
              variant="danger"
              size="small"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Registry
            </Button>
          ) : (
            <>
              <Button
                variant="danger"
                size="small"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                Confirm Delete
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </Container>

      {/* Items Table */}
      <Container className="p-0">
        <div className="p-6 border-b">
          <Heading level="h2">Registry Items</Heading>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-ui-fg-subtle">
            No items in this registry
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-ui-bg-subtle">
                  <th className="text-left p-3 font-medium text-ui-fg-subtle">
                    Product
                  </th>
                  <th className="text-right p-3 font-medium text-ui-fg-subtle">
                    Desired
                  </th>
                  <th className="text-right p-3 font-medium text-ui-fg-subtle">
                    Purchased
                  </th>
                  <th className="text-right p-3 font-medium text-ui-fg-subtle">
                    Fulfillment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(items as any[]).map((item: any) => {
                  const desired = item.quantity_desired || 0
                  const purchased = item.quantity_purchased || 0
                  const percentage =
                    desired > 0
                      ? Math.min(
                          Math.round((purchased / desired) * 100),
                          100
                        )
                      : 0

                  return (
                    <tr key={item.id} className="hover:bg-ui-bg-subtle">
                      <td className="p-3">
                        <Text className="font-medium">
                          {item.product_title || item.variant_id || "\u2014"}
                        </Text>
                      </td>
                      <td className="p-3 text-right">
                        <Text className="text-ui-fg-subtle">{desired}</Text>
                      </td>
                      <td className="p-3 text-right">
                        <Text className="text-ui-fg-subtle">{purchased}</Text>
                      </td>
                      <td className="p-3 text-right">
                        <Badge
                          color={
                            percentage >= 100
                              ? "green"
                              : percentage > 0
                                ? "orange"
                                : "grey"
                          }
                        >
                          {percentage}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  )
}

import { Container, Heading, Text, Badge, Button, Textarea } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  useBarterListing,
  useModerateBarterListing,
} from "../../../hooks/api/barter"

const moderationColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  approved: "green",
  pending: "orange",
  rejected: "red",
}

export const BarterDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useBarterListing(id!)
  const moderateMutation = useModerateBarterListing()
  const [notes, setNotes] = useState("")

  const listing = (data as any)?.listing

  if (isLoading) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      </Container>
    )
  }

  if (!listing) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">
          Listing not found
        </div>
      </Container>
    )
  }

  const handleModerate = async (action: "approve" | "reject") => {
    await moderateMutation.mutateAsync({
      id: id!,
      action,
      notes: notes || undefined,
    })
    navigate("/barter")
  }

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Heading level="h1">{listing.title}</Heading>
            <Text className="text-ui-fg-subtle">{listing.type}</Text>
          </div>
          <div className="flex gap-2">
            <Badge color={moderationColors[listing.moderation_status] || "grey"}>
              {listing.moderation_status}
            </Badge>
            <Badge>{listing.status}</Badge>
          </div>
        </div>

        {listing.description && (
          <div className="mb-4">
            <Text className="font-medium mb-1">Description</Text>
            <Text className="text-ui-fg-subtle">{listing.description}</Text>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text className="font-medium mb-1">Type</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.type || "—"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Condition</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.condition || "—"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Owner</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.customer_id || listing.owner_id || "—"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Created</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.created_at
                ? new Date(listing.created_at).toLocaleString()
                : "—"}
            </Text>
          </div>
          {listing.estimated_value && (
            <div>
              <Text className="font-medium mb-1">Estimated Value</Text>
              <Text className="text-ui-fg-subtle text-sm">
                ${listing.estimated_value}
              </Text>
            </div>
          )}
          {listing.looking_for && (
            <div>
              <Text className="font-medium mb-1">Looking For</Text>
              <Text className="text-ui-fg-subtle text-sm">
                {listing.looking_for}
              </Text>
            </div>
          )}
        </div>
      </Container>

      {/* Moderation controls */}
      {listing.moderation_status === "pending" && (
        <Container>
          <Heading level="h2" className="mb-4">
            Moderation
          </Heading>
          <div className="mb-4">
            <Textarea
              placeholder="Add moderation notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => handleModerate("approve")}
              isLoading={moderateMutation.isPending}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => handleModerate("reject")}
              isLoading={moderateMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </Container>
      )}
    </div>
  )
}

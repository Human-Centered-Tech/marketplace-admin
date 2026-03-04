import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  useBarterListings,
  useModerateBarterListing,
} from "../../../hooks/api/barter"

const moderationColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  approved: "green",
  pending: "orange",
  rejected: "red",
}

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  draft: "orange",
  closed: "grey",
  traded: "green",
}

export const BarterList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const moderationFilter = searchParams.get("moderation_status") || ""

  const { listings, count, isLoading } = useBarterListings(
    moderationFilter ? { moderation_status: moderationFilter } : undefined
  )

  const moderateMutation = useModerateBarterListing()

  const handleModerate = async (
    e: React.MouseEvent,
    id: string,
    action: "approve" | "reject"
  ) => {
    e.stopPropagation()
    await moderateMutation.mutateAsync({ id, action })
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <Heading level="h1">Barter Listings</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {count ?? 0} listings total
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!moderationFilter ? "primary" : "secondary"}
            size="small"
            onClick={() => setSearchParams({})}
          >
            All
          </Button>
          {["pending", "approved", "rejected"].map((s) => (
            <Button
              key={s}
              variant={moderationFilter === s ? "primary" : "secondary"}
              size="small"
              onClick={() => setSearchParams({ moderation_status: s })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No listings found
        </div>
      ) : (
        <div className="divide-y">
          {(listings as any[]).map((listing: any) => (
            <div
              key={listing.id}
              className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
              onClick={() => navigate(`/barter/${listing.id}`)}
            >
              <div>
                <Text className="font-medium">{listing.title}</Text>
                <Text className="text-ui-fg-subtle text-xs">
                  Type: {listing.type || "—"} | Condition:{" "}
                  {listing.condition || "—"}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusColors[listing.status] || "grey"}>
                  {listing.status}
                </Badge>
                <Badge
                  color={
                    moderationColors[listing.moderation_status] || "grey"
                  }
                >
                  {listing.moderation_status}
                </Badge>
                {listing.moderation_status === "pending" && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="primary"
                      size="small"
                      onClick={(e) => handleModerate(e, listing.id, "approve")}
                      isLoading={moderateMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={(e) => handleModerate(e, listing.id, "reject")}
                      isLoading={moderateMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

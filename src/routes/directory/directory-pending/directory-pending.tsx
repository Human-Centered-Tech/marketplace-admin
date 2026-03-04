import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import {
  usePendingListings,
  useVerifyDirectoryListing,
} from "../../../hooks/api/directory"

export const DirectoryPending = () => {
  const navigate = useNavigate()
  const { listings, count, isLoading } = usePendingListings()
  const verifyMutation = useVerifyDirectoryListing()

  const handleQuickAction = async (
    e: React.MouseEvent,
    id: string,
    action: "approve" | "reject"
  ) => {
    e.stopPropagation()
    await verifyMutation.mutateAsync({ id, action })
  }

  return (
    <Container className="p-0">
      <div className="p-6 border-b">
        <Heading level="h1">Verification Queue</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          {count ?? 0} listings awaiting verification
        </Text>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !listings?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No listings pending verification
        </div>
      ) : (
        <div className="divide-y">
          {(listings as any[]).map((listing: any) => (
            <div
              key={listing.id}
              className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
              onClick={() => navigate(`/directory/${listing.id}`)}
            >
              <div className="flex items-center gap-4">
                {listing.logo_url ? (
                  <img
                    src={listing.logo_url}
                    alt={listing.business_name}
                    className="w-10 h-10 rounded object-contain border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-ui-bg-subtle flex items-center justify-center text-ui-fg-subtle">
                    {listing.business_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <Text className="font-medium">{listing.business_name}</Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    {listing.contact_email} | Tier: {listing.subscription_tier}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="small"
                  onClick={(e) => handleQuickAction(e, listing.id, "approve")}
                  isLoading={verifyMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={(e) => handleQuickAction(e, listing.id, "reject")}
                  isLoading={verifyMutation.isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

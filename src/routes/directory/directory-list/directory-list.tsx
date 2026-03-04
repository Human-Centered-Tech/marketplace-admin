import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  useDirectoryListings,
} from "../../../hooks/api/directory"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  approved: "green",
  pending: "orange",
  rejected: "red",
}

const tierColors: Record<string, "green" | "orange" | "purple" | "grey"> = {
  enterprise: "purple",
  featured: "orange",
  verified: "green",
}

export const DirectoryList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""

  const { listings, count, isLoading } = useDirectoryListings(
    statusFilter
      ? { verification_status: statusFilter }
      : undefined
  )

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <Heading level="h1">Directory Listings</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {count ?? 0} listings total
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
          <Button
            variant={statusFilter === "pending" ? "primary" : "secondary"}
            size="small"
            onClick={() => setSearchParams({ status: "pending" })}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "approved" ? "primary" : "secondary"}
            size="small"
            onClick={() => setSearchParams({ status: "approved" })}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "primary" : "secondary"}
            size="small"
            onClick={() => setSearchParams({ status: "rejected" })}
          >
            Rejected
          </Button>
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
                    {listing.contact_email}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  color={
                    tierColors[listing.subscription_tier] || "grey"
                  }
                >
                  {listing.subscription_tier}
                </Badge>
                <Badge
                  color={
                    statusColors[listing.verification_status] || "grey"
                  }
                >
                  {listing.verification_status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

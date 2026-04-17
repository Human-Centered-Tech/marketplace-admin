import { Container, Heading, Text, Badge, Button, Textarea, Input } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  useDirectoryListing,
  useVerifyDirectoryListing,
  useUpdateDirectoryListing,
} from "../../../hooks/api/directory"
import { BadgeAssignment } from "./badge-assignment"
import { ExtendedFieldsEditor } from "./extended-fields"

export const DirectoryDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useDirectoryListing(id!)
  const verifyMutation = useVerifyDirectoryListing()
  const updateMutation = useUpdateDirectoryListing()
  const [notes, setNotes] = useState("")
  const [vendorId, setVendorId] = useState("")

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

  const handleVerify = async (action: "approve" | "reject") => {
    await verifyMutation.mutateAsync({ id: id!, action, notes: notes || undefined })
    navigate("/directory")
  }

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {listing.logo_url && (
              <img
                src={listing.logo_url}
                alt={listing.business_name}
                className="w-16 h-16 rounded object-contain border"
              />
            )}
            <div>
              <Heading level="h1">{listing.business_name}</Heading>
              <Text className="text-ui-fg-subtle">{listing.slug}</Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              color={
                listing.verification_status === "approved"
                  ? "green"
                  : listing.verification_status === "rejected"
                    ? "red"
                    : "orange"
              }
            >
              {listing.verification_status}
            </Badge>
            <Badge>{listing.subscription_tier}</Badge>
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
            <Text className="font-medium mb-1">Contact</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.contact_email}
            </Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.contact_phone}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Website</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.website_url || "—"}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Subscription</Text>
            <Text className="text-ui-fg-subtle text-sm">
              Tier: {listing.subscription_tier} | Status:{" "}
              {listing.subscription_status}
            </Text>
          </div>
          <div>
            <Text className="font-medium mb-1">Owner ID</Text>
            <Text className="text-ui-fg-subtle text-sm">
              {listing.owner_id}
            </Text>
          </div>
        </div>
      </Container>

      {/* Parish Affiliations */}
      {listing.affiliations?.length > 0 && (
        <Container>
          <Heading level="h2" className="mb-4">
            Parish Affiliations
          </Heading>
          <div className="divide-y">
            {listing.affiliations.map((aff: any) => (
              <div key={aff.id} className="py-2">
                <Text className="font-medium">{aff.parish?.name}</Text>
                <Text className="text-ui-fg-subtle text-sm">
                  {aff.parish?.diocese} — {aff.parish?.city}, {aff.parish?.state}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Marketplace Storefront Link */}
      <Container>
        <Heading level="h2" className="mb-4">
          Marketplace Link
        </Heading>
        {listing.vendor_id ? (
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm">
                Linked to vendor: <span className="font-medium">{listing.vendor_id}</span>
              </Text>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={async () => {
                await updateMutation.mutateAsync({
                  id: id!,
                  vendor_id: null,
                })
              }}
              isLoading={updateMutation.isPending}
            >
              Unlink
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter vendor/seller ID..."
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="small"
              disabled={!vendorId.trim()}
              onClick={async () => {
                await updateMutation.mutateAsync({
                  id: id!,
                  vendor_id: vendorId.trim(),
                })
                setVendorId("")
              }}
              isLoading={updateMutation.isPending}
            >
              Link
            </Button>
          </div>
        )}
        <Text className="text-ui-fg-subtle text-xs mt-2">
          Links this directory listing to a marketplace vendor storefront.
        </Text>
      </Container>

      {/* Verification controls */}
      {listing.verification_status === "pending" && (
        <Container>
          <Heading level="h2" className="mb-4">
            Verification
          </Heading>
          <div className="mb-4">
            <Textarea
              placeholder="Add notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => handleVerify("approve")}
              isLoading={verifyMutation.isPending}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => handleVerify("reject")}
              isLoading={verifyMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </Container>
      )}

      {/* Custom badge assignments — available for all listings */}
      <BadgeAssignment listingId={id!} />

      {/* 4/1 extended fields editor — owner interview, devotional, CTA */}
      <ExtendedFieldsEditor listing={listing} />
    </div>
  )
}

import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Textarea,
  Input,
  usePrompt,
  toast,
} from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  useDirectoryListing,
  useVerifyDirectoryListing,
  useUpdateDirectoryListing,
  useLinkDirectoryListing,
  useDeleteDirectoryListing,
} from "../../../hooks/api/directory"
import { useSeller } from "../../../hooks/api/sellers"
import { BadgeAssignment } from "./badge-assignment"
import { CategoryEditor } from "./category-editor"
import { ExtendedFieldsEditor } from "./extended-fields"
import { PremiumStatesEditor } from "./premium-states"
import { ServicedStatesEditor } from "./serviced-states"
import { FeaturedHomepageSection } from "./featured-homepage-section"

export const DirectoryDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useDirectoryListing(id!)
  const verifyMutation = useVerifyDirectoryListing()
  const updateMutation = useUpdateDirectoryListing()
  const linkMutation = useLinkDirectoryListing()
  const deleteMutation = useDeleteDirectoryListing()
  const prompt = usePrompt()
  const [notes, setNotes] = useState("")
  const [email, setEmail] = useState("")

  const listing = (data as any)?.listing

  // Resolve the linked vendor's name + email so Brooke can confirm she's
  // looking at / linking the right shop (the listing detail endpoint only
  // returns the raw seller id). Reuses the existing admin seller query;
  // disabled when nothing is linked yet.
  const { data: sellerData } = useSeller(listing?.vendor_id || "")
  const linkedSeller = sellerData?.seller

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
              {linkedSeller && (
                <Text className="text-sm">
                  <span className="font-medium">
                    {linkedSeller.name || "Unnamed vendor"}
                  </span>
                  {linkedSeller.email ? ` — ${linkedSeller.email}` : ""}
                </Text>
              )}
              <Text className="text-ui-fg-subtle text-xs">
                Linked to vendor:{" "}
                <span className="font-medium">{listing.vendor_id}</span>
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
              placeholder="Enter the user's account email..."
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="small"
              disabled={!email.trim()}
              onClick={async () => {
                try {
                  const res = await linkMutation.mutateAsync({
                    id: id!,
                    email: email.trim(),
                  })
                  setEmail("")
                  if (res.seller_linked) {
                    toast.success("Linked the listing to the user's shop.")
                  } else {
                    toast.warning(
                      "Linked to the customer, but they aren't a merchant yet — no shop to attach."
                    )
                  }
                } catch (e: any) {
                  toast.error(e?.message || "Could not link — check the email.")
                }
              }}
              isLoading={linkMutation.isPending}
            >
              Link
            </Button>
          </div>
        )}
        <Text className="text-ui-fg-subtle text-xs mt-2">
          Link by the user's account email — sets the owner and, if they're a
          merchant, attaches their shop.
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

      {/* Delete (admin cleanup) — Brooke 6/26 */}
      <Container>
        <Heading level="h2" className="mb-4">
          Delete listing
        </Heading>
        <Text className="text-ui-fg-subtle text-sm mb-4">
          Permanently removes this listing — e.g. to free a slug taken by a
          stale imported row that&rsquo;s blocking a vendor. This can&rsquo;t be
          undone.
        </Text>
        <Button
          variant="danger"
          size="small"
          isLoading={deleteMutation.isPending}
          onClick={async () => {
            const ok = await prompt({
              title: "Delete listing",
              description: `Permanently delete "${listing.business_name}"? This frees its slug and can't be undone.`,
              confirmText: "Delete",
              cancelText: "Cancel",
            })
            if (!ok) return
            try {
              await deleteMutation.mutateAsync(id!)
              toast.success("Listing deleted.")
              navigate("/directory")
            } catch (e: any) {
              toast.error(e?.message || "Could not delete the listing.")
            }
          }}
        >
          Delete listing
        </Button>
      </Container>

      {/* Category assignment — change which directory category this
          listing appears under. */}
      <CategoryEditor listing={listing} />

      {/* Homepage Featured Services toggle */}
      <FeaturedHomepageSection listingId={id!} />

      {/* Custom badge assignments — available for all listings */}
      <BadgeAssignment listingId={id!} />

      {/* 4/1 extended fields editor — owner interview, devotional, CTA */}
      <ExtendedFieldsEditor listing={listing} />

      {/* Service area — which states this listing serves; drives the
          /us/directory state filter. Available for all tiers. */}
      <ServicedStatesEditor listing={listing} />

      {/* Per-state premium banner placement — enterprise tier only,
          since the storefront banner query filters by subscription_tier. */}
      {listing.subscription_tier === "enterprise" && (
        <PremiumStatesEditor listing={listing} />
      )}
    </div>
  )
}

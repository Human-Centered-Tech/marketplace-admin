import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Textarea,
  Input,
  Label,
  FocusModal,
  usePrompt,
  toast,
} from "@medusajs/ui"
import { Link } from "@medusajs/icons"
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
import { GalleryEditor } from "./gallery-editor"
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

  // "Link existing membership" migration dialog — links a grandfathered
  // member's EXISTING Stripe subscription to this claimed listing and marks
  // it active. Local state for the modal + its form fields.
  const [migrateOpen, setMigrateOpen] = useState(false)
  const [migrateEmail, setMigrateEmail] = useState("")
  const [migrateSubId, setMigrateSubId] = useState("")
  const [migrateCustId, setMigrateCustId] = useState("")

  const handleMigrateLink = async () => {
    try {
      const res = await linkMutation.mutateAsync({
        id: id!,
        email: migrateEmail.trim(),
        subscription_status: "active",
        stripe_subscription_id: migrateSubId.trim() || undefined,
        stripe_customer_id: migrateCustId.trim() || undefined,
      })
      setMigrateOpen(false)
      setMigrateEmail("")
      setMigrateSubId("")
      setMigrateCustId("")
      if (res.seller_linked) {
        toast.success(
          "Membership linked — listing marked active and tied to the member's shop."
        )
      } else {
        toast.warning(
          "Membership linked and marked active, but this account isn't a merchant yet — no shop to attach."
        )
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not link — check the email.")
    }
  }

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

        {/* Grandfathered-membership migration (Brooke): link an existing
            member's PRIOR Stripe subscription to this claimed listing and
            mark it active — no new checkout. */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="font-medium text-sm">
                Link existing membership
              </Text>
              <Text className="text-ui-fg-subtle text-xs">
                Migration: tie a grandfathered member's prior Stripe
                subscription to this listing and mark it active.
              </Text>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                // Prefill the email from the inline field if Brooke typed one.
                setMigrateEmail(email.trim())
                setMigrateOpen(true)
              }}
            >
              <Link />
              Link existing membership
            </Button>
          </div>
        </div>

        <FocusModal open={migrateOpen} onOpenChange={setMigrateOpen}>
          <FocusModal.Content>
            <FocusModal.Header>
              <Heading level="h2">Link existing membership</Heading>
            </FocusModal.Header>
            <FocusModal.Body className="flex flex-col items-center py-16">
              <div className="flex w-full max-w-lg flex-col gap-4">
                <Text className="text-ui-fg-subtle text-sm">
                  Links a grandfathered member's prior Stripe subscription to
                  this listing and marks it <strong>active</strong>. Use the
                  member's account email plus the Stripe subscription ID from
                  their existing subscription.
                </Text>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="migrate-email" size="small">
                    Member email
                  </Label>
                  <Input
                    id="migrate-email"
                    type="email"
                    placeholder="member@example.com"
                    value={migrateEmail}
                    onChange={(e) => setMigrateEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="migrate-sub" size="small">
                    Stripe subscription ID
                  </Label>
                  <Input
                    id="migrate-sub"
                    placeholder="sub_..."
                    value={migrateSubId}
                    onChange={(e) => setMigrateSubId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="migrate-cust" size="small">
                    Stripe customer ID{" "}
                    <span className="text-ui-fg-muted">(optional)</span>
                  </Label>
                  <Input
                    id="migrate-cust"
                    placeholder="cus_..."
                    value={migrateCustId}
                    onChange={(e) => setMigrateCustId(e.target.value)}
                  />
                </div>
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <Button
                variant="secondary"
                onClick={() => setMigrateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!migrateEmail.trim()}
                isLoading={linkMutation.isPending}
                onClick={handleMigrateLink}
              >
                Link membership
              </Button>
            </FocusModal.Footer>
          </FocusModal.Content>
        </FocusModal>
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

      {/* Photo gallery — up to 8 listing photos (gallery_urls). Vendors upload
          these from their dashboard; admins can now add/replace them too. */}
      <GalleryEditor listing={listing} />

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

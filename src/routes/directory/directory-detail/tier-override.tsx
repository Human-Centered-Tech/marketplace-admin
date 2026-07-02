import { Text, Badge, Button, toast } from "@medusajs/ui"
import { useState } from "react"
import { useUpdateDirectoryListing } from "../../../hooks/api/directory"

// Visibility tiers (directory_listing.subscription_tier). Kept in sync with the
// backend SubscriptionTier enum + the PUT route's validation set.
const TIERS = ["verified", "featured", "enterprise"] as const

/**
 * Admin control to manually set a listing's visibility tier and optionally
 * "pin" it so the Stripe directory webhook won't overwrite it on the seller's
 * next checkout (backend guards on `tier_locked`).
 */
export const TierOverrideSection = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing()
  const [tier, setTier] = useState<string>(
    listing.subscription_tier || "verified"
  )
  const [locked, setLocked] = useState<boolean>(!!listing.tier_locked)

  const dirty =
    tier !== listing.subscription_tier || locked !== !!listing.tier_locked

  const save = async () => {
    try {
      await update.mutateAsync({
        id: listing.id,
        subscription_tier: tier,
        tier_locked: locked,
      })
      toast.success(
        locked
          ? `Tier pinned to "${tier}" — Stripe won't change it on checkout.`
          : `Tier set to "${tier}".`
      )
    } catch (e: any) {
      toast.error(e?.message || "Could not update tier")
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 mb-1">
        <Text className="font-medium">Tier override</Text>
        {listing.tier_locked && <Badge color="orange">Pinned</Badge>}
      </div>
      <Text className="text-ui-fg-subtle text-xs mb-3">
        Manually set this listing's visibility tier. Pin it to stop the Stripe
        webhook from changing it on the seller's next checkout.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <Button
            key={t}
            size="small"
            variant={tier === t ? "primary" : "secondary"}
            onClick={() => setTier(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
        <div className="w-px h-6 bg-ui-border-base mx-1" />
        <Button
          size="small"
          variant={locked ? "primary" : "secondary"}
          onClick={() => setLocked((v) => !v)}
        >
          {locked ? "Pinned" : "Pin tier"}
        </Button>
        <Button
          size="small"
          variant="primary"
          onClick={save}
          isLoading={update.isPending}
          disabled={!dirty}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

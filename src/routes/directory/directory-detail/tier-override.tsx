import { Text, Badge, Button, toast } from "@medusajs/ui"
import { useState } from "react"
import { useUpdateDirectoryListing } from "../../../hooks/api/directory"

// Visibility tiers (directory_listing.subscription_tier). Kept in sync with the
// backend SubscriptionTier enum + the PUT route's validation set. These drive
// search ranking, parish-affiliation limits, and the Featured/Enterprise
// badges. "verified" is the internal name for the base tier — it renders as
// "Essential" on the public site.
const TIERS = ["verified", "featured", "enterprise"] as const
const TIER_LABELS: Record<string, string> = {
  verified: "Verified (base)",
  featured: "Featured",
  enterprise: "Enterprise",
}

// Membership plans (directory_listing.pricing_tier). For base-visibility
// listings this decides the public badge — Local / Essential / Marketplace —
// plus the merchant-vs-service business type and the CRM membership label
// (Matteo 8/18: the override was missing these three entirely). The tier2/3/4
// paid plans are set by Stripe checkout and aren't offered here; use the
// visibility row for Featured/Enterprise comps instead.
const PLANS = [
  { value: null, label: "— none —" },
  { value: "local", label: "Local" },
  { value: "essential", label: "Essential" },
  { value: "merchant", label: "Marketplace (merchant)" },
] as const

/**
 * Admin control to manually set a listing's visibility tier + membership plan
 * and optionally "pin" it so the Stripe directory webhook won't overwrite it
 * on the seller's next checkout (backend guards on `tier_locked`).
 *
 * Both saves go through the same PUT, which re-emits directory-listing.updated
 * — so Algolia rank, badges, parish limits, and business type all take effect
 * immediately, no extra sync step.
 */
export const TierOverrideSection = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing()
  const [tier, setTier] = useState<string>(
    listing.subscription_tier || "verified"
  )
  const [plan, setPlan] = useState<string | null>(listing.pricing_tier ?? null)
  const [locked, setLocked] = useState<boolean>(!!listing.tier_locked)

  const dirty =
    tier !== (listing.subscription_tier || "verified") ||
    plan !== (listing.pricing_tier ?? null) ||
    locked !== !!listing.tier_locked

  const save = async () => {
    try {
      await update.mutateAsync({
        id: listing.id,
        subscription_tier: tier,
        pricing_tier: plan,
        tier_locked: locked,
      })
      toast.success(
        locked
          ? `Tier pinned to "${tier}"${plan ? ` / plan "${plan}"` : ""} — Stripe won't change it on checkout.`
          : `Tier set to "${tier}"${plan ? ` / plan "${plan}"` : ""}.`
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
        Visibility tier drives ranking, parish limits, and the
        Featured/Enterprise badges. Pin it to stop the Stripe webhook from
        changing it on the seller's next checkout.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <Button
            key={t}
            size="small"
            variant={tier === t ? "primary" : "secondary"}
            onClick={() => setTier(t)}
          >
            {TIER_LABELS[t]}
          </Button>
        ))}
      </div>
      <Text className="text-ui-fg-subtle text-xs mt-4 mb-2">
        Membership plan — for base-visibility listings this picks the public
        badge (Local / Essential / Marketplace) and whether the account gets
        the merchant experience. "Marketplace (merchant)" makes this a
        product-selling account.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        {PLANS.map((p) => (
          <Button
            key={p.value ?? "none"}
            size="small"
            variant={plan === p.value ? "primary" : "secondary"}
            onClick={() => setPlan(p.value)}
          >
            {p.label}
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

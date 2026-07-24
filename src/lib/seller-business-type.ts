/**
 * Account taxonomy, admin-side (decision record 2026-07-14 §1.3).
 *
 * A Mercur `seller` row is NOT proof that somebody sells anything. Every path
 * that takes a directory listing live (Stripe webhook, admin grandfather-link,
 * the claim flow, POST /store/account/become-merchant) creates a seller for the
 * owner, because the seller row doubles as their MESSAGING INBOX and their
 * VENDOR-DASHBOARD LOGIN. So the platform has two account shapes sharing one
 * table:
 *
 *   Business Owner — pays for a directory listing, sells no products. Has a
 *                    seller row purely for messaging + listing editing.
 *   Merchant       — actually sells: has products, and (once published +
 *                    ACTIVE) a real shop page.
 *
 * DO NOT "clean up" a Business Owner's seller row. Deleting it kills their
 * Message button and locks them out of editing their own listing. The fix is
 * presentation only — which is what this file exists for.
 *
 * ---------------------------------------------------------------------------
 * WHICH SIGNAL
 *
 * The backend's authoritative *intent* signal is the onboarding tier
 * (`src/lib/business-type.ts`: listing.pricing_tier ?? customer.metadata
 * .recommended_tier; "merchant" => product, anything else => service). That
 * signal is NOT reachable from the admin API: directory_listing links to a
 * seller by a plain `vendor_id` text column (no module link), so there is no
 * graph path seller -> listing -> pricing_tier, and no admin endpoint returns
 * it per seller.
 *
 * What IS reachable through GET /admin/sellers (it runs query.graph over the
 * seller entity with caller-supplied `fields`) is the seller's own commerce
 * footprint, via the real module links seller->product and seller->payout
 * account. So we use the *behavioural* signal, which is also exactly the one
 * the public site already ships:
 *
 *   has_live_shop  (store/directory/listings/[id]/route.ts)
 *       = store_status === "ACTIVE" AND >= 1 PUBLISHED product
 *   — the flag that decides whether the "Visit Our Shop" CTA renders. It is
 *     the same question Brooke is asking: "why does this non-seller have a
 *     storefront?"
 *
 * `is_merchant` on the Business Owners list means something different and
 * weaker — "this customer has a member/seller row at all" — which is true of
 * every Business Owner and is precisely the mislabel we are correcting here.
 * Don't reuse it for storefronts.
 *
 * Classification is deliberately GENEROUS toward merchants: any product at all
 * (draft included) or a Stripe payout account counts as a merchant, so a real
 * merchant who is mid-onboarding is never hidden from the Storefronts tab. A
 * seller with zero products, no payout account and nothing published is a
 * Business Owner — there is no shop to show.
 */

export type SellerBusinessType = "merchant" | "business_owner";

export type ClassifiableSeller = {
  store_status?: string | null;
  products?: { id?: string; status?: string | null }[] | null;
  payout_account?: { id?: string } | null;
};

export const getProductCount = (seller: ClassifiableSeller): number =>
  seller.products?.length ?? 0;

export const getPublishedProductCount = (seller: ClassifiableSeller): number =>
  (seller.products ?? []).filter((p) => p?.status === "published").length;

/** Parity with the storefront's `has_live_shop`: ACTIVE store + >=1 published. */
export const hasLiveShop = (seller: ClassifiableSeller): boolean =>
  seller.store_status === "ACTIVE" && getPublishedProductCount(seller) > 0;

export const getSellerBusinessType = (
  seller: ClassifiableSeller
): SellerBusinessType => {
  if (getProductCount(seller) > 0) {
    return "merchant";
  }
  if (seller.payout_account?.id) {
    return "merchant";
  }
  return "business_owner";
};

export const BUSINESS_TYPE_LABEL: Record<SellerBusinessType, string> = {
  merchant: "Merchant",
  business_owner: "Business Owner",
};

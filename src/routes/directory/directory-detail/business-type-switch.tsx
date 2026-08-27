import { Text, Button, Badge, toast, Prompt } from "@medusajs/ui"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../lib/client"
import { directoryListingQueryKeys } from "../../../hooks/api/directory"

// Admin role switch (Matteo 8/18): flip the account behind a listing between
// merchant (sells products) and plain business owner (listing only).
//
// to_merchant is safe and immediate (sets pricing_tier + recommended_tier —
// business type is derived, so the vendor portal shows the product path on
// next load). to_business_owner is DESTRUCTIVE (soft-deletes the storefront,
// members, and products), so the backend returns a dry-run summary first and
// we show it in a confirm dialog before sending confirm:true.
export const BusinessTypeSwitch = ({ listing }: { listing: any }) => {
  const queryClient = useQueryClient()
  const [pendingRemoval, setPendingRemoval] = useState<{
    seller: string
    members: number
    products: number
  } | null>(null)

  const mutate = useMutation({
    mutationFn: (body: { direction: string; confirm?: boolean }) =>
      sdk.client.fetch(`/admin/directory/listings/${listing.id}/business-type`, {
        method: "POST",
        body,
      }) as Promise<any>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directoryListingQueryKeys.all })
    },
  })

  const isMerchant = listing.pricing_tier === "merchant"

  const toMerchant = async () => {
    try {
      const r = await mutate.mutateAsync({ direction: "to_merchant" })
      toast.success(`Switched to merchant. ${r?.note ?? ""}`)
    } catch (e: any) {
      toast.error(e?.message || "Switch failed")
    }
  }

  const askToBusinessOwner = async () => {
    try {
      const r = await mutate.mutateAsync({ direction: "to_business_owner" })
      if (r?.requires_confirm) {
        setPendingRemoval(r.would_remove)
      } else {
        toast.success("Already a plain business owner.")
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not inspect the linked storefront")
    }
  }

  const confirmToBusinessOwner = async () => {
    try {
      const r = await mutate.mutateAsync({
        direction: "to_business_owner",
        confirm: true,
      })
      setPendingRemoval(null)
      toast.success(
        `Converted to business owner — storefront "${r?.removed?.seller}" removed (${r?.removed?.products} product(s)).`
      )
    } catch (e: any) {
      toast.error(e?.message || "Conversion failed")
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 mb-1">
        <Text className="font-medium">Business type</Text>
        <Badge color={isMerchant ? "green" : "grey"}>
          {isMerchant ? "Merchant" : "Business owner"}
        </Badge>
      </div>
      <Text className="text-ui-fg-subtle text-xs mb-3">
        Merchants get the product-selling portal (products, shipping, payouts);
        business owners have the directory listing only. Switching to merchant
        is safe — the owner still completes vendor setup (incl. Stripe)
        themselves. Switching to business owner removes their storefront and
        products.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="small"
          variant="secondary"
          onClick={toMerchant}
          isLoading={mutate.isPending && !pendingRemoval}
          disabled={isMerchant}
        >
          Switch to merchant
        </Button>
        <Button
          size="small"
          variant="danger"
          onClick={askToBusinessOwner}
          isLoading={mutate.isPending && !pendingRemoval}
          disabled={!listing.vendor_id}
        >
          Switch to business owner…
        </Button>
      </div>

      <Prompt
        open={!!pendingRemoval}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Remove this storefront?</Prompt.Title>
            <Prompt.Description>
              Converting to business owner will remove the storefront "
              {pendingRemoval?.seller}" — {pendingRemoval?.products} product(s)
              and {pendingRemoval?.members} vendor login(s) go with it. The
              directory listing, customer account, and web login are kept.
              Order history is preserved. This is not easily reversible.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setPendingRemoval(null)}>
              Cancel
            </Prompt.Cancel>
            <Prompt.Action onClick={confirmToBusinessOwner}>
              Remove storefront
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </div>
  )
}

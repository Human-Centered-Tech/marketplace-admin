import { Text, Badge, Button, Input, toast, Prompt } from "@medusajs/ui"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../lib/client"
import { directoryListingQueryKeys } from "../../../hooks/api/directory"

// Comp a listing — active membership with no Stripe subscription, for
// nonprofits and other complimentary memberships (Brooke 8/28). One click
// replaces "pin the tier, then Link with the Stripe boxes empty", and records
// metadata.comped so the Memberships-to-Link queue stops flagging it.
const TIERS = [
  { value: "verified", label: "Verified (base)" },
  { value: "featured", label: "Featured" },
  { value: "enterprise", label: "Enterprise" },
] as const
const PLANS = [
  { value: null, label: "— none —" },
  { value: "local", label: "Local" },
  { value: "essential", label: "Essential" },
  { value: "merchant", label: "Marketplace" },
] as const

export const CompListingSection = ({ listing }: { listing: any }) => {
  const queryClient = useQueryClient()
  const comped = (listing.metadata as any)?.comped
  const [tier, setTier] = useState<string>(listing.subscription_tier || "verified")
  const [plan, setPlan] = useState<string | null>(listing.pricing_tier ?? null)
  const [reason, setReason] = useState("")
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const mutate = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch(`/admin/directory/listings/${listing.id}/comp`, {
        method: "POST",
        body,
      }) as Promise<any>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directoryListingQueryKeys.all })
    },
  })

  const grant = async () => {
    try {
      await mutate.mutateAsync({ tier, plan, reason })
      toast.success(
        `Comped — listing is active as ${tier}${plan ? ` / ${plan}` : ""}, no Stripe subscription.`
      )
      setReason("")
    } catch (e: any) {
      toast.error(e?.message || "Could not comp this listing")
    }
  }

  const revoke = async () => {
    try {
      await mutate.mutateAsync({ revoke: true })
      setConfirmRevoke(false)
      toast.success("Comp revoked — listing is back to pending.")
    } catch (e: any) {
      toast.error(e?.message || "Could not revoke the comp")
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 mb-1">
        <Text className="font-medium">Complimentary membership</Text>
        {comped && <Badge color="green">Comped</Badge>}
      </div>

      {comped ? (
        <>
          <Text className="text-ui-fg-subtle text-xs mb-3">
            Comped {new Date(comped.at).toLocaleDateString()}
            {comped.reason ? ` — ${comped.reason}` : ""}. Active with no Stripe
            subscription; it won't expire on its own and is hidden from
            Memberships to Link.
          </Text>
          <Button
            size="small"
            variant="danger"
            onClick={() => setConfirmRevoke(true)}
            isLoading={mutate.isPending}
          >
            Revoke comp…
          </Button>
        </>
      ) : (
        <>
          <Text className="text-ui-fg-subtle text-xs mb-3">
            Marks this listing active with no Stripe subscription — for
            nonprofits and other comps. Pins the tier so a later checkout can't
            change it. Reversible.
          </Text>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {TIERS.map((t) => (
              <Button
                key={t.value}
                size="small"
                variant={tier === t.value ? "primary" : "secondary"}
                onClick={() => setTier(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              size="small"
              placeholder="Reason (e.g. nonprofit partner)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="small"
              variant="primary"
              onClick={grant}
              isLoading={mutate.isPending}
            >
              Comp this listing
            </Button>
          </div>
        </>
      )}

      <Prompt open={confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(false)}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Revoke this comp?</Prompt.Title>
            <Prompt.Description>
              The listing goes back to pending — it will drop out of the public
              directory, and if the owner has a shop it will be hidden too.
              They'd need to pay (or be comped again) to return.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Prompt.Cancel>
            <Prompt.Action onClick={revoke}>Revoke comp</Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </div>
  )
}

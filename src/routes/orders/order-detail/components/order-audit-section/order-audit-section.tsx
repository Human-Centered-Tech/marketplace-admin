import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import {
  OrderAuditEntry,
  useOrderAuditLog,
} from "../../../../../hooks/api/order-audit"

type OrderAuditSectionProps = {
  order: HttpTypes.AdminOrder
}

const ACTION_LABEL: Record<OrderAuditEntry["action"], string> = {
  cancel: "Canceled",
  refund: "Refunded",
  return_confirmed: "Return received",
}

const ACTION_COLOR: Record<
  OrderAuditEntry["action"],
  "red" | "orange" | "blue"
> = {
  cancel: "red",
  refund: "orange",
  return_confirmed: "blue",
}

const formatAmount = (amount: number | null, currency: string | null) => {
  if (amount == null) return null
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amount)
  } catch {
    return `${amount} ${(currency || "").toUpperCase()}`.trim()
  }
}

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

/**
 * "Audit Log" — who canceled/refunded this order and when. Backed by the
 * order-audit backend module (Medusa/Mercur don't persist the actor for these
 * actions). Named distinctly from the existing OrderActivitySection, which is
 * the Medusa event timeline. Read-only; no actions.
 */
export const OrderAuditSection = ({ order }: OrderAuditSectionProps) => {
  const { entries, isLoading } = useOrderAuditLog(order.id)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Audit Log</Heading>
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Loading…
          </Text>
        </div>
      ) : !entries?.length ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            No cancel or refund actions recorded for this order.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {entries.map((e) => {
            const amount = formatAmount(e.amount, e.currency_code)
            return (
              <div key={e.id} className="flex flex-col gap-y-1 px-6 py-4">
                <div className="flex items-center gap-x-2">
                  <Badge size="2xsmall" color={ACTION_COLOR[e.action]}>
                    {ACTION_LABEL[e.action] ?? e.action}
                  </Badge>
                  {amount ? (
                    <Text size="small" weight="plus">
                      {amount}
                    </Text>
                  ) : null}
                  <Badge size="2xsmall" className="capitalize">
                    {e.source}
                  </Badge>
                </div>
                <Text size="small">
                  {e.actor_label ? (
                    <span className="text-ui-fg-base">{e.actor_label}</span>
                  ) : (
                    <span className="text-ui-fg-subtle">
                      {e.actor_id
                        ? `${e.actor_type ?? "actor"} ${e.actor_id}`
                        : "Unknown actor"}
                    </span>
                  )}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {formatWhen(e.created_at)}
                </Text>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}

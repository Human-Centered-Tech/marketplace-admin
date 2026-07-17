import { useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export type OrderAuditEntry = {
  id: string
  action: "cancel" | "refund" | "return_confirmed"
  source: "admin" | "vendor"
  actor_type: "user" | "seller" | null
  actor_id: string | null
  actor_label: string | null
  amount: number | null
  currency_code: string | null
  created_at: string
}

export const orderAuditQueryKeys = queryKeysFactory("order-audit")

// Who canceled/refunded this order — see the backend order-audit module.
export const useOrderAuditLog = (orderId: string) => {
  const { data, ...rest } = useQuery({
    queryKey: orderAuditQueryKeys.detail(orderId),
    queryFn: () =>
      sdk.client.fetch<{ entries: OrderAuditEntry[] }>(
        `/admin/orders/${orderId}/audit`,
        { method: "GET" }
      ),
    enabled: !!orderId,
  })

  return { entries: data?.entries, ...rest }
}

import {
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const analyticsQueryKeys = queryKeysFactory("analytics")

// Per-listing / per-shop analytics (punchlist carry-admin-analytics, 8/13):
// name-resolved top lists + a per-entity daily drill-down. Web events only —
// the mobile app emits nothing yet.

export const useAnalyticsEntities = (
  query?: Record<string, string | number | undefined>
) => {
  const { data, ...other } = useQuery({
    queryKey: [...analyticsQueryKeys.list(query), "entities"],
    queryFn: () =>
      sdk.client.fetch<{
        entities: {
          id: string
          name: string
          unresolved: boolean
          views: number
          clicks: number
          cart_adds: number
          favorites: number
          registry_adds: number
        }[]
        count: number
        entity_type: string
        days: number
      }>("/admin/analytics/entities", { method: "GET", query }),
  })
  return {
    entities: data?.entities,
    count: data?.count,
    ...other,
  }
}

export const useAnalyticsEntity = (
  id: string,
  query?: Record<string, string | number | undefined>
) => {
  const { data, ...other } = useQuery({
    queryKey: [...analyticsQueryKeys.detail(id), query],
    queryFn: () =>
      sdk.client.fetch<{
        id: string
        entity_type: string
        name: string
        days: number
        daily: {
          date: string
          views: number
          clicks: number
          cart_adds: number
          favorites: number
          registry_adds: number
        }[]
        totals: {
          views: number
          clicks: number
          cart_adds: number
          favorites: number
          registry_adds: number
        }
      }>(`/admin/analytics/entities/${id}`, { method: "GET", query }),
    enabled: !!id,
  })
  return { entity: data, ...other }
}

export const useAnalyticsOverview = (
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: analyticsQueryKeys.list(),
    queryFn: () =>
      sdk.client.fetch("/admin/analytics/overview", {
        method: "GET",
      }),
    ...options,
  })

  return {
    overview: data,
    ...other,
  }
}

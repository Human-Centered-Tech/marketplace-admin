import {
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const analyticsQueryKeys = queryKeysFactory("analytics")

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

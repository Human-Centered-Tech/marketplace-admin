import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const barterListingQueryKeys = queryKeysFactory("barter-listing")

// Listings

export const useBarterListings = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: barterListingQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/barter/listings", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    listings: data?.listings,
    count: data?.count,
    ...other,
  }
}

export const useBarterListing = (id: string) => {
  return useQuery({
    queryKey: barterListingQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/barter/listings/${id}`, {
        method: "GET",
      }),
  })
}

export const useModerateBarterListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string
      action: "approve" | "reject"
      notes?: string
    }) =>
      sdk.client.fetch(`/admin/barter/listings/${id}/moderate`, {
        method: "POST",
        body: { action, notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: barterListingQueryKeys.all,
      })
    },
  })
}

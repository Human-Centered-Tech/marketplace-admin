import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const featuredListingQueryKeys = queryKeysFactory("featured-listings")

export type FeaturedListingRow = {
  id: string
  listing_id: string
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const useFeaturedListings = (
  query?: Record<string, string | number | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: featuredListingQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/featured-listings", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    featured_listings: (data as any)?.featured_listings as
      | FeaturedListingRow[]
      | undefined,
    count: (data as any)?.count as number | undefined,
    ...other,
  }
}

export const useListingFeaturedState = (listingId: string) => {
  return useQuery({
    queryKey: featuredListingQueryKeys.detail(listingId),
    queryFn: async () => {
      try {
        return await sdk.client.fetch(
          `/admin/featured-listings/${listingId}`,
          { method: "GET" }
        )
      } catch (e: any) {
        if (e?.status === 404 || /404/.test(e?.message ?? "")) {
          return { featured_listing: null }
        }
        throw e
      }
    },
    enabled: !!listingId,
  })
}

export const useUpsertListingFeatured = (listingId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { featured?: boolean; sort_order?: number }) =>
      sdk.client.fetch(`/admin/featured-listings/${listingId}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: featuredListingQueryKeys.detail(listingId),
      })
      queryClient.invalidateQueries({
        queryKey: featuredListingQueryKeys.lists(),
      })
    },
  })
}

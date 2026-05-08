import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const featuredProductQueryKeys = queryKeysFactory("featured-products")

export type FeaturedProductRow = {
  id: string
  product_id: string
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// List all featured-product rows. Used by the admin if we ever build a
// dedicated "Featured Products" review page; the per-product toggle uses
// useProductFeaturedState below.
export const useFeaturedProducts = (
  query?: Record<string, string | number | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: featuredProductQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/featured-products", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    featured_products: (data as any)?.featured_products as
      | FeaturedProductRow[]
      | undefined,
    count: (data as any)?.count as number | undefined,
    ...other,
  }
}

// Read a single product's featured-state. Returns null if the product has
// never been featured (404 from the backend mapped to null here so the
// toggle component can render "off" without an error state).
export const useProductFeaturedState = (productId: string) => {
  return useQuery({
    queryKey: featuredProductQueryKeys.detail(productId),
    queryFn: async () => {
      try {
        return await sdk.client.fetch(
          `/admin/featured-products/${productId}`,
          { method: "GET" }
        )
      } catch (e: any) {
        // 404 means "not featured" — translate to a synthetic null payload.
        if (e?.status === 404 || /404/.test(e?.message ?? "")) {
          return { featured_product: null }
        }
        throw e
      }
    },
    enabled: !!productId,
  })
}

// Upsert. Body: { featured?: boolean, sort_order?: number }.
export const useUpsertProductFeatured = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { featured?: boolean; sort_order?: number }) =>
      sdk.client.fetch(`/admin/featured-products/${productId}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: featuredProductQueryKeys.detail(productId),
      })
      queryClient.invalidateQueries({
        queryKey: featuredProductQueryKeys.lists(),
      })
    },
  })
}

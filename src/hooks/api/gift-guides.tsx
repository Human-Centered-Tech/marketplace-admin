import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const giftGuideQueryKeys = queryKeysFactory("gift-guides")

export type GiftGuide = {
  id: string
  slug: string
  title: string
  short_name?: string | null
  guide_number?: string | null
  subtitle?: string | null
  lede?: string | null
  hero_image?: string | null
  category_handle?: string | null
  status?: "draft" | "published" | "archived"
  tags?: string[] | null
  sort_order: number
  featured: boolean
  active_from?: string | null
  active_until?: string | null
  created_at: string
  updated_at: string
}

export const useGiftGuides = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giftGuideQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/gift-guides", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    gift_guides: (data as any)?.gift_guides as GiftGuide[] | undefined,
    count: (data as any)?.count as number | undefined,
    ...other,
  }
}

export const useGiftGuide = (id: string) => {
  return useQuery({
    queryKey: giftGuideQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/gift-guides/${id}`, {
        method: "GET",
      }),
  })
}

export const useCreateGiftGuide = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch("/admin/gift-guides", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftGuideQueryKeys.all })
    },
  })
}

export const useUpdateGiftGuide = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch(`/admin/gift-guides/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftGuideQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: giftGuideQueryKeys.detail(id) })
    },
  })
}

export const useDeleteGiftGuide = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/gift-guides/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftGuideQueryKeys.all })
    },
  })
}

export type GiftGuideProductsResponse = {
  products: Array<{
    id: string
    title: string
    handle?: string
    thumbnail?: string | null
    status?: string
    tags?: Array<{ id: string; value: string }>
  }>
  guide_tags: string[]
}

export const useGiftGuideProducts = (id: string) => {
  return useQuery({
    queryKey: [...giftGuideQueryKeys.detail(id), "products"],
    queryFn: () =>
      sdk.client.fetch<GiftGuideProductsResponse>(
        `/admin/gift-guides/${id}/products`,
        { method: "GET" }
      ),
  })
}

export const useAddGiftGuideProduct = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) =>
      sdk.client.fetch(`/admin/gift-guides/${id}/products`, {
        method: "POST",
        body: { product_id: productId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...giftGuideQueryKeys.detail(id), "products"],
      })
    },
  })
}

export const useRemoveGiftGuideProduct = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) =>
      sdk.client.fetch(
        `/admin/gift-guides/${id}/products/${productId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...giftGuideQueryKeys.detail(id), "products"],
      })
    },
  })
}

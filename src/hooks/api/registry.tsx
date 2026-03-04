import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const registryQueryKeys = queryKeysFactory("registry")

export const useRegistries = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: registryQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/registry", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    registries: data?.registries,
    count: data?.count,
    ...other,
  }
}

export const useRegistry = (id: string) => {
  return useQuery({
    queryKey: registryQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/registry/${id}`, {
        method: "GET",
      }),
  })
}

export const useDeleteRegistry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/registry/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registryQueryKeys.all,
      })
    },
  })
}

import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const networkingEventQueryKeys = queryKeysFactory("networking-event")
export const networkingSubscriptionQueryKeys = queryKeysFactory("networking-subscription")

// Events

export const useNetworkingEvents = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: networkingEventQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/networking/events", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    events: data?.events,
    count: data?.count,
    ...other,
  }
}

export const useNetworkingEvent = (id: string) => {
  return useQuery({
    queryKey: networkingEventQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/networking/events/${id}`, {
        method: "GET",
      }),
  })
}

export const useCreateNetworkingEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch("/admin/networking/events", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: networkingEventQueryKeys.all,
      })
    },
  })
}

export const useUpdateNetworkingEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      sdk.client.fetch(`/admin/networking/events/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: networkingEventQueryKeys.all,
      })
    },
  })
}

export const useDeleteNetworkingEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/networking/events/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: networkingEventQueryKeys.all,
      })
    },
  })
}

// Subscriptions

export const useNetworkingSubscriptions = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: networkingSubscriptionQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/networking/subscriptions", {
        method: "GET",
        query,
      }),
    ...options,
  })

  return {
    subscriptions: data?.subscriptions,
    count: data?.count,
    ...other,
  }
}

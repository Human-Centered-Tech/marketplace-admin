import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export const directoryListingQueryKeys = queryKeysFactory("directory-listing")
export const directoryCategoryQueryKeys = queryKeysFactory("directory-category")
export const directoryParishQueryKeys = queryKeysFactory("directory-parish")

// Listings

export const useDirectoryListings = (
  query?: Record<string, string | number | string[] | undefined>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: directoryListingQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/directory/listings", {
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

export const useDirectoryListing = (id: string) => {
  return useQuery({
    queryKey: directoryListingQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/directory/listings/${id}`, {
        method: "GET",
      }),
  })
}

export const usePendingListings = (
  query?: Record<string, string | number | string[] | undefined>
) => {
  const { data, ...other } = useQuery({
    queryKey: [...directoryListingQueryKeys.list(query), "pending"],
    queryFn: () =>
      sdk.client.fetch<{ listings: any[]; count: number }>(
        "/admin/directory/pending",
        {
          method: "GET",
          query,
        }
      ),
  })

  return {
    listings: data?.listings,
    count: data?.count,
    ...other,
  }
}

export const useUpdateDirectoryListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      sdk.client.fetch(`/admin/directory/listings/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryListingQueryKeys.all,
      })
    },
  })
}

export const useVerifyDirectoryListing = () => {
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
      sdk.client.fetch(`/admin/directory/listings/${id}/verify`, {
        method: "POST",
        body: { action, notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryListingQueryKeys.all,
      })
    },
  })
}

// Categories

export const useDirectoryCategories = (
  query?: Record<string, string | number | string[] | undefined>
) => {
  const { data, ...other } = useQuery({
    queryKey: directoryCategoryQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch<{ categories: any[]; count: number }>(
        "/admin/directory/categories",
        {
          method: "GET",
          query,
        }
      ),
  })

  return {
    categories: data?.categories,
    count: data?.count,
    ...other,
  }
}

export const useCreateDirectoryCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch("/admin/directory/categories", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryCategoryQueryKeys.all,
      })
    },
  })
}

export const useUpdateDirectoryCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      sdk.client.fetch(`/admin/directory/categories/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryCategoryQueryKeys.all,
      })
    },
  })
}

export const useDeleteDirectoryCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/directory/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryCategoryQueryKeys.all,
      })
    },
  })
}

// Parishes

export const useDirectoryParishes = (
  query?: Record<string, string | number | string[] | undefined>
) => {
  const { data, ...other } = useQuery({
    queryKey: directoryParishQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch<{ parishes: any[]; count: number }>(
        "/admin/directory/parishes",
        {
          method: "GET",
          query,
        }
      ),
  })

  return {
    parishes: data?.parishes,
    count: data?.count,
    ...other,
  }
}

export const useCreateDirectoryParish = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch("/admin/directory/parishes", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryParishQueryKeys.all,
      })
    },
  })
}

export const useUpdateDirectoryParish = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      sdk.client.fetch(`/admin/directory/parishes/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryParishQueryKeys.all,
      })
    },
  })
}

export const useDeleteDirectoryParish = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/directory/parishes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: directoryParishQueryKeys.all,
      })
    },
  })
}

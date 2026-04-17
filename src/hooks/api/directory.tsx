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
export const directoryBadgeQueryKeys = queryKeysFactory("directory-badge")
export const directoryListingBadgeQueryKeys = queryKeysFactory(
  "directory-listing-badge"
)

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

// Badges

export const useDirectoryBadges = () => {
  const { data, ...other } = useQuery({
    queryKey: directoryBadgeQueryKeys.list(),
    queryFn: () =>
      sdk.client.fetch<{ badges: any[] }>("/admin/directory/badges", {
        method: "GET",
      }),
  })

  return {
    badges: data?.badges,
    ...other,
  }
}

export const useCreateDirectoryBadge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch("/admin/directory/badges", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directoryBadgeQueryKeys.all })
    },
  })
}

export const useUpdateDirectoryBadge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      sdk.client.fetch(`/admin/directory/badges/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directoryBadgeQueryKeys.all })
    },
  })
}

export const useDeleteDirectoryBadge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/directory/badges/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directoryBadgeQueryKeys.all })
    },
  })
}

// Listing-badge assignments

export const useListingBadges = (listingId: string) => {
  const { data, ...other } = useQuery({
    queryKey: directoryListingBadgeQueryKeys.detail(listingId),
    queryFn: () =>
      sdk.client.fetch<{ badges: any[] }>(
        `/admin/directory/listings/${listingId}/badges`,
        { method: "GET" }
      ),
    enabled: !!listingId,
  })

  return {
    badges: data?.badges,
    ...other,
  }
}

export const useAssignListingBadge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      listingId,
      badgeId,
    }: {
      listingId: string
      badgeId: string
    }) =>
      sdk.client.fetch(`/admin/directory/listings/${listingId}/badges`, {
        method: "POST",
        body: { badge_id: badgeId },
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: directoryListingBadgeQueryKeys.detail(vars.listingId),
      })
      queryClient.invalidateQueries({
        queryKey: directoryListingQueryKeys.detail(vars.listingId),
      })
    },
  })
}

export const useRemoveListingBadge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      listingId,
      badgeId,
    }: {
      listingId: string
      badgeId: string
    }) =>
      sdk.client.fetch(`/admin/directory/listings/${listingId}/badges`, {
        method: "DELETE",
        body: { badge_id: badgeId },
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: directoryListingBadgeQueryKeys.detail(vars.listingId),
      })
      queryClient.invalidateQueries({
        queryKey: directoryListingQueryKeys.detail(vars.listingId),
      })
    },
  })
}

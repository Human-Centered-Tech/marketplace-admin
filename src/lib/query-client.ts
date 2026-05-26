import { QueryClient } from "@tanstack/react-query"

const runtimeConfig =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) || {}

export const MEDUSA_BACKEND_URL =
  runtimeConfig.backendUrl || __BACKEND_URL__ || "/"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 90000,
      retry: 1,
    },
  },
})

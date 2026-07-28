// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDUSA_ADMIN_BACKEND_URL: string
  readonly VITE_MEDUSA_STOREFRONT_URL: string
  readonly VITE_MEDUSA_V2: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot: {
    accept: () => void
  }
}

// True only in a Vite dev build. Guards debug-only globals so they are dead-code
// eliminated from production. Optional because Vite's `define` is not applied by the
// tsup build — always test with `typeof __DEV__ !== "undefined"` first.
declare const __DEV__: boolean | undefined

declare const __BACKEND_URL__: string | undefined
declare const __STOREFRONT_URL__: string | undefined
declare const __BASE__: string

interface Window {
  __RUNTIME_CONFIG__?: {
    backendUrl?: string
  }
}

import Medusa from "@medusajs/js-sdk";

// Runtime config is injected by scripts/launch-admin.js into /runtime-config.js
// at container start, so a static production build still targets the right
// backend. Falls back to the build-time `define` value (used in local dev).
const runtimeConfig =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) || {};

export const backendUrl = runtimeConfig.backendUrl || __BACKEND_URL__ || "/";

export const sdk = new Medusa({
  baseUrl: backendUrl,
});

// Useful when you want to call the BE from the console and try things out quickly.
// DEV ONLY: the previous guard was `typeof window !== "undefined"`, which is true in
// every browser build — so production shipped a preconfigured, session-bound handle to
// the whole `admin` namespace on the admin origin, i.e. a ready-made client for any
// injected script. `__DEV__` is a Vite `define` (vite.config.mts), replaced with a
// literal at build time, so this block is eliminated from the production bundle rather
// than merely skipped. The `typeof` check keeps it safe in the tsup CJS/ESM build,
// where Vite's defines are not applied and a bare `__DEV__` would be a ReferenceError.
if (typeof __DEV__ !== "undefined" && __DEV__ && typeof window !== "undefined") {
  (window as any).__sdk = sdk;
}

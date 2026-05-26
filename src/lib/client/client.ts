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

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  (window as any).__sdk = sdk;
}

import inject from "@medusajs/admin-vite-plugin";

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import inspect from "vite-plugin-inspect";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BASE = env.VITE_MEDUSA_BASE || "/";
  const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000";
  const B2B_PANEL = env.VITE_MEDUSA_B2B_PANEL || "false";
  const PORT = parseInt(env.PORT || env.VITE_PORT || "5173", 10);
  const PUBLIC_BASE_URL = env.VITE_PUBLIC_BASE_URL || "";

  /**
   * Add this to your .env file to specify the project to load admin extensions from.
   */
  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null;
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : [];

  /**
   * Security headers, applied to BOTH the dev server and `vite preview` — the
   * latter is what serves production traffic (scripts/launch-admin.js), so the
   * deployed admin previously sent none of these at all.
   *
   * CSP is deliberately REPORT-ONLY: it blocks nothing yet, it only reports.
   * Promoting it to the enforcing `Content-Security-Policy` header is a
   * follow-up that needs a run through the real app first — watch the console
   * for violations, widen the directives that legitimately fire, then flip it.
   *
   * `connect-src` can only list the BUILD-TIME backend. The deployed backend is
   * injected at container start into dist/runtime-config.js, so it may differ;
   * add that origin (or a wildcard for the deploy host) before enforcing.
   */
  const CSP_REPORT_ONLY = [
    "default-src 'self'",
    "script-src 'self'",
    // Vite and Tailwind both inject inline <style> blocks.
    "style-src 'self' 'unsafe-inline'",
    // Product, seller, and directory media come from arbitrary CDNs.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${BACKEND_URL}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const SECURITY_HEADERS = {
    // Enforcing. The admin is never meant to be framed; this is the real
    // clickjacking control (CSP frame-ancestors above is report-only for now).
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Ignored by browsers over plain HTTP, so local dev is unaffected.
    // No `preload` — that is a one-way door and belongs to whoever owns the domain.
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy-Report-Only": CSP_REPORT_ONLY,
  };

  return {
    plugins: [
      inspect(),
      react(),
      inject({
        sources,
      }),
    ],
    resolve: {
      alias: {
        "@custom-types": path.resolve(__dirname, "./src/types"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@routes": path.resolve(__dirname, "./src/routes"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@lib": path.resolve(__dirname, "./src/lib"),
        "@providers": path.resolve(__dirname, "./src/providers"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Debug-only globals (e.g. window.__sdk) gate on this so they are dead-code
      // eliminated from the production bundle rather than merely skipped at runtime.
      __DEV__: JSON.stringify(mode !== "production"),
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __B2B_PANEL__: JSON.stringify(B2B_PANEL),
    },
    // `server` is for local dev only. Production is served from a static build
    // via `vite preview` (see scripts/launch-admin.js) using the `preview` block
    // below. The earlier raw `vite preview` 502 was a port-binding issue — the
    // launcher fixes it by passing --host 0.0.0.0 --port $PORT.
    server: {
      host: true,
      port: PORT,
      open: false,
      headers: SECURITY_HEADERS,
      allowedHosts: PUBLIC_BASE_URL ? [PUBLIC_BASE_URL.replace('https://', '').replace('http://', '').split('/')[0]] : [],
    },
    preview: {
      host: true,
      port: PORT,
      headers: SECURITY_HEADERS,
      // Allow all hosts. Vite 5.4+ blocks requests whose Host header isn't in
      // allowedHosts with a 403 ("Blocked request"). Deriving the list from
      // PUBLIC_BASE_URL broke Railway deploys: when the env var is unset at
      // build time the list is [] (blocks everything), and even when set it
      // omits Railway's internal healthcheck host — so the deploy healthcheck
      // gets a 403 and fails. The admin is auth-gated and serves only static
      // files (no SSR/proxy), so disabling host-checking carries no
      // DNS-rebinding risk.
      allowedHosts: true,
    },
  };
});

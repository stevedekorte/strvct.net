/**
 * Service worker script (runs in the worker global scope, not the page).
 *
 * Deliberately minimal: NO fetch handler. A service worker with no fetch
 * listener never intercepts requests — it cannot interfere with resource
 * loading, wasm, web workers, or streaming responses by construction (and
 * browsers skip service-worker startup entirely for fetches when no listener
 * is registered, so there is no per-request cost). This registration exists
 * as infrastructure for push notifications; if a caching/loader role is ever
 * added, it must be a deliberate, narrowly-scoped fetch handler — the
 * previous version's catch-all fetch handler answered any failed request
 * (wasm, streamed AI responses, images) with a cached index.html.
 *
 * Push handlers (self.addEventListener("push" | "notificationclick")) get
 * added here when the notifications feature lands.
 */

"use strict";

// Legacy cleanup: the earlier version of this file cached index.html under
// this name; delete it so no stale copy lingers.
const LEGACY_CACHE_NAMES = ["my-service-worker-cache-name"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        Promise.all(LEGACY_CACHE_NAMES.map(name => caches.delete(name)))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (/*event*/) => {
    console.log("[SvServiceWorker] activated");
});

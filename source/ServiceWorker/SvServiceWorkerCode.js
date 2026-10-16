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
 * notificationclick: a tap on a notification the app showed through this
 * worker (SvWebUserInterface.postUserNotification) brings the app forward —
 * an open window is focused and told which notification it was; with none
 * open, one is opened. The page decides what to do with it (the worker stays
 * a dumb terminal: no app knowledge here).
 *
 * The push handler gets added here when push lands.
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

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
            const open = windows.find(w => "focus" in w);
            if (open) {
                open.postMessage({ type: "svNotificationClick", tag: event.notification.tag, data: data });
                return open.focus();
            }
            return self.clients.openWindow(data.url || "/"); // the app passes where to open
        })
    );
});

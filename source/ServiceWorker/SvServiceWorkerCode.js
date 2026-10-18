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
 * push: shows a notification the server composed in full (title, body, tag,
 * url), and keeps the app badge at the number of notifications showing.
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
                // Safari's standalone app can't be navigated from here: the page navigates itself
                open.postMessage({ type: "svNotificationClick", tag: event.notification.tag, data: data });
                return open.focus();
            }
            return self.clients.openWindow(data.url || "/"); // the app passes where to open
        }).then(() => syncBadgeToNotifications())
    );
});

// push: the server sends a complete notification ({ title, body, tag, url,
// data }); the worker shows it as-is. One notification per tag: a newer one
// replaces it. The badge counts the notifications still showing (one per
// session and kind), so it is right even while the app is closed.
self.addEventListener("push", (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = { title: event.data ? event.data.text() : "" };
    }
    const options = {
        body: payload.body || "",
        tag: payload.tag || undefined,
        renotify: !!payload.tag,
        icon: payload.icon || "/apple-touch-icon.png",
        badge: payload.badgeIcon || undefined,
        data: Object.assign({ url: payload.url || "/" }, payload.data || {})
    };
    event.waitUntil(
        self.registration.showNotification(payload.title || "UndreamedOf", options).then(() => syncBadgeToNotifications())
    );
});

// the browser replaced this device's subscription: subscribe again with the
// same options; the app registers the new endpoint the next time it opens,
// and the server drops the old one when a send to it fails
self.addEventListener("pushsubscriptionchange", (event) => {
    const options = event.oldSubscription ? event.oldSubscription.options : null;
    if (!options) {
        return;
    }
    event.waitUntil(self.registration.pushManager.subscribe(options).catch(() => null));
});

function syncBadgeToNotifications () {
    if (!self.navigator || typeof self.navigator.setAppBadge !== "function") {
        return Promise.resolve();
    }
    return self.registration.getNotifications().then((list) => {
        return list.length ? self.navigator.setAppBadge(list.length) : self.navigator.clearAppBadge();
    }).catch(() => null);
}

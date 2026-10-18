"use strict";

/**
 * @class SvServiceWorker
 * @extends Object
 * @classdesc Page-side registration wrapper for the framework service worker
 * (SvServiceWorkerCode.js — which is deliberately fetch-handler-free; see the
 * comments there). Registration is idempotent and failure is non-fatal: the
 * app runs identically without a service worker; the registration exists as
 * infrastructure for push notifications.
 *
 * NOTE: the worker script's default scope is its own directory
 * (strvct/source/ServiceWorker/), which does NOT control the app's pages.
 * That is fine for push (subscriptions hang off the registration, and
 * notification clicks can reach pages via clients.matchAll with
 * includeUncontrolled) and means the worker can never affect page requests.
 * A future loader/caching role would require serving the script from the
 * site root (or a Service-Worker-Allowed header) — a deliberate change.
 */
class SvServiceWorker extends Object {

    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            obj.init();
            this._shared = obj;
        }
        return this._shared;
    }

    static register () {
        const worker = this.shared();
        worker.registerServiceWorker(); // async; deliberately not awaited
        return worker;
    }

    svType () {
        return "SvServiceWorker";
    }

    logPrefix () {
        return "[" + this.svType() + "]";
    }

    init () {
        this._isRegistered = false;
        this._registration = null;
        this._registrationPromise = null;
        return this;
    }

    /**
     * @description The active registration, if any (push subscription point).
     * @returns {ServiceWorkerRegistration|null}
     * @category Service Worker Registration
     */
    registration () {
        return this._registration;
    }

    /**
     * @description Registers the framework service worker. Idempotent;
     * failure is logged and swallowed (the app must run identically without
     * a service worker).
     * @category Service Worker Registration
     */
    async registerServiceWorker () {
        if (!SvPlatform.isBrowserPlatform()) {
            return;
        }

        if (!("serviceWorker" in navigator)) {
            console.log(this.logPrefix(), "serviceWorker unsupported in this browser — skipping");
            return;
        }

        if (this._isRegistered) {
            return;
        }
        this._isRegistered = true;

        const path = "strvct/source/ServiceWorker/SvServiceWorkerCode.js";
        if (!this._isListeningForMessages) {
            this._isListeningForMessages = true;
            navigator.serviceWorker.addEventListener("message", (event) => this.onWorkerMessage(event.data));
        }
        this._registrationPromise = navigator.serviceWorker.register(path);

        try {
            this._registration = await this._registrationPromise;
            this.onRegistered();
        } catch (error) {
            this._isRegistered = false; // allow a later retry
            this._registrationPromise = null;
            this.onError(error);
        }
    }

    /**
     * @description The registration once registering has settled; null where
     * there is no service worker, or registering failed.
     * @returns {Promise<ServiceWorkerRegistration|null>}
     * @category Service Worker Registration
     */
    async asyncRegistration () {
        if (this._registration) {
            return this._registration;
        }
        if (!this._registrationPromise) {
            return null;
        }
        try {
            return await this._registrationPromise;
        } catch (e) {
            return null;
        }
    }

    /**
     * @description A message posted by the worker (a tapped notification) is
     * announced as onServiceWorkerMessage, for the UI layer to act on.
     * @param {Object} data
     * @category Messages
     */
    onWorkerMessage (data) {
        SvNotificationCenter.shared().newNote().setSender(this).setName("onServiceWorkerMessage").setInfo(data || {}).post();
    }

    /**
     * @category Service Worker Registration
     */
    onRegistered () {
        console.log(this.logPrefix(), "registered with scope", this._registration.scope);
    }

    /**
     * @category Error Handling
     */
    onError (error) {
        console.warn(this.logPrefix(), "registration failed (app runs normally without it):", error.message);
    }

}

SvGlobals.set("SvServiceWorker", SvServiceWorker);

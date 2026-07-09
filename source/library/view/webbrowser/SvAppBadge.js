/**
 * @module library.view.webbrowser
 */

"use strict";

/**
 * @class SvAppBadge
 * @extends ProtoClass
 * @classdesc Renders an app-level attention count on every badge surface the
 * platform offers, from one setCount(n) call:
 *
 * - OS app badge (navigator.setAppBadge) — shows on the dock/taskbar/home
 *   screen icon when the app is installed; calling it uninstalled is a
 *   harmless no-op. Count rendering (shape, color, clamping) is entirely
 *   platform-determined, by design.
 * - Favicon overlay — the count composited onto the site icon via canvas;
 *   the only surface with styling control. Works in any tab, no install,
 *   no permission.
 * - Tab title prefix — "(3) …"; the cross-browser floor.
 *
 * Generic view-layer machinery: knows nothing about what the count means.
 * The UI layer (SvWebUserInterface.setAttentionCount) is the intended caller.
 */
(class SvAppBadge extends ProtoClass {

    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            this._shared = this.clone();
        }
        return this._shared;
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("count", 0);
            slot.setSlotType("Number");
        }
        {
            // original favicon href, captured before the first overlay so
            // clear() can restore it
            const slot = this.newSlot("originalFaviconHref", null);
            slot.setSlotType("String");
        }
    }

    initPrototype () {
    }

    /**
     * @description Sets the attention count on all surfaces. 0 clears.
     * @param {number} n
     * @category Rendering
     */
    setCount (n) {
        n = Math.max(0, Math.floor(Number(n) || 0));
        if (n === this._count) {
            return this;
        }
        this._count = n;

        if (!SvPlatform.isBrowserPlatform()) {
            return this;
        }

        this.applyOsBadge();
        this.applyTitle();
        this.applyFavicon();
        return this;
    }

    clear () {
        return this.setCount(0);
    }

    // --- surfaces ---

    applyOsBadge () {
        try {
            if (navigator.setAppBadge) {
                if (this.count() > 0) {
                    navigator.setAppBadge(this.count());
                } else if (navigator.clearAppBadge) {
                    navigator.clearAppBadge();
                }
            }
        } catch (e) {
            // badge surfaces are best-effort, never break the app
        }
    }

    applyTitle () {
        try {
            // stateless: strip any existing prefix off the live title (the app
            // may have retitled since the last update), then re-prefix
            const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
            document.title = this.count() > 0 ? "(" + this.count() + ") " + base : base;
        } catch (e) {
            // best-effort
        }
    }

    faviconLinkElement () {
        return document.querySelector("link[rel~='icon']");
    }

    applyFavicon () {
        try {
            const link = this.faviconLinkElement();
            if (!link) {
                return;
            }

            if (this.originalFaviconHref() === null) {
                this.setOriginalFaviconHref(link.href);
            }

            if (this.count() === 0) {
                link.href = this.originalFaviconHref();
                return;
            }

            const img = new Image();
            img.onload = () => this.drawFaviconBadge(img);
            img.onerror = () => this.drawFaviconBadge(null); // badge-only fallback
            img.src = this.originalFaviconHref();
        } catch (e) {
            // best-effort
        }
    }

    drawFaviconBadge (baseImage) {
        try {
            if (this.count() === 0) {
                return; // cleared while the image was loading
            }
            const size = 64;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            if (baseImage) {
                ctx.drawImage(baseImage, 0, 0, size, size);
            }

            // count bubble, bottom-right
            const label = this.count() > 99 ? "99+" : String(this.count());
            const r = 20;
            const cx = size - r - 2;
            const cy = size - r - 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = "#c0392b";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + (label.length > 2 ? 20 : 26) + "px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, cx, cy + 1);

            const link = this.faviconLinkElement();
            if (link) {
                link.href = canvas.toDataURL("image/png");
            }
        } catch (e) {
            // best-effort
        }
    }

}.initThisClass());

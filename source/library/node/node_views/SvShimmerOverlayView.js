"use strict";

/**
 * @module library.node.node_views
 */

/**
 * @class SvShimmerOverlayView
 * @extends SvFlexDomView
 * @classdesc The shared "working on it" shimmer: an absolute overlay whose
 * oversized diagonal sheen band sweeps (and gently reverses) across its
 * parent, reading as flowing light. Extracted from SvImageWellView's
 * progressive-loading effect so every loading surface (image wells, tile
 * thumbnails, ...) uses literally the same affordance. Add it as a subview
 * of a position:relative container; remove it when done. Ignores pointer
 * events; the sheen animation runs on the compositor (translateX, not
 * background-position) so it never forces per-frame paints.
 */
(class SvShimmerOverlayView extends SvFlexDomView {

    /**
     * @description Installs the shimmer stylesheet once at class-init time
     * (initPrototype runs once per class). addStyleSheetString is a no-op
     * off-browser, so this is safe headlessly.
     * @category Initialization
     */
    initPrototype () {
        this.setupCss();
    }

    /**
     * @description Injects the shimmer @keyframes and sheen class.
     * @returns {SvShimmerOverlayView}
     * @category Styling
     */
    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            @keyframes SvShimmerOverlaySweep {
                0%   { transform: translateX(-55%); }
                100% { transform: translateX(55%); }
            }
            .SvShimmerOverlaySheen {
                position: absolute;
                top: 0;
                bottom: 0;
                left: -50%;
                right: -50%;
                background-image: linear-gradient(115deg,
                    rgba(255,255,255,0) 0%,
                    rgba(255,255,255,0) 34%,
                    rgba(255,255,255,0.07) 44%,
                    rgba(255,255,255,0.13) 50%,
                    rgba(255,255,255,0.07) 56%,
                    rgba(255,255,255,0) 66%,
                    rgba(255,255,255,0) 100%);
                animation: SvShimmerOverlaySweep 3.4s ease-in-out infinite alternate;
                will-change: transform;
            }
            .SvShimmerOverlaySheenDelayed {
                animation-delay: 300ms;
            }
        `);
        return this;
    }

    init () {
        super.init();
        this.setPosition("absolute");
        this.setInset("0px");
        this.setZIndex(2);
        this.setOverflow("hidden"); // clips the oversized sheen band
        this.setPointerEvents("none");
        this.turnOffUserSelect();
        const sheen = SvFlexDomView.clone();
        sheen.setElementClassName("SvShimmerOverlaySheen");
        this.addSubview(sheen);
        this.addTimeout(() => this.reportIfStillSweeping(), 20000, "reportIfStillSweeping");
        return this;
    }

    /**
     * @description A tripwire: a shimmer still on screen after 20 s is a
     * loading state nobody ended. Names who holds it — the views above it,
     * their nodes, and the owner's state — so the stuck case can be found.
     * Reads no geometry (isConnected and the view tree only).
     * @category Debugging
     */
    reportIfStillSweeping () {
        if (!this.element().isConnected) {
            return;
        }
        const owner = this.parentView();
        const chain = [];
        for (let v = owner; v && chain.length < 6; v = v.parentView()) {
            const node = v.node ? v.node() : null;
            chain.push(v.svType() + (node ? "(" + node.svType() + ")" : ""));
        }
        const state = {
            renderState: owner && owner.renderState ? owner.renderState() : undefined,
            isWorking: owner && owner.isWorking ? owner.isWorking() : undefined,
            isDepressed: owner && owner.isDepressed ? owner.isDepressed() : undefined
        };
        const message = "[SvShimmerOverlayView] still sweeping after 20s: " + chain.join(" < ") + " " + JSON.stringify(state);
        console.warn(message);
        if (state.isWorking !== true) { // a slow generation is still working: only a shimmer nobody owns any more is reported
            SvErrorReport.asyncSend(new Error(message), { kind: "stuckShimmer", chain: chain, state: state }); // to the server's log, for a case seen only on someone else's screen
        }
    }

    /**
     * @description Hold the sheen still for 300ms so a fast action never
     * shows motion. The delay is CSS (compositor), so it still elapses
     * while the main thread is blocked after this overlay is on screen.
     * @returns {SvShimmerOverlayView}
     */
    useStartDelay () {
        const sheen = this.subviews().first();
        if (sheen) {
            sheen.appendElementClassName("SvShimmerOverlaySheenDelayed");
        }
        return this;
    }

}.initThisClass());

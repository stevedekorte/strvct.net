"use strict";

/**
 * @module library.node.node_views.browser.stack.SvEdgeHandle
 * @class SvCollapsibleRegionProtocol
 * @extends Protocol
 * @classdesc Protocol for a collapsible region controlled by an SvEdgeHandleView
 * — the thin "edge pill" affordance on the boundary between a persistent region
 * and a collapsible one (a companion panel, a header band, a chat input row).
 *
 * The handle never knows WHAT it toggles: it talks only to this protocol, so
 * the same view serves a framework companion panel and any app-defined region.
 * Implementors may be model nodes (per-device presentation state in non-stored
 * slots) or views (pure view state) — the handle does not care which.
 *
 * Three OPTIONAL methods are consulted when present (not part of conformance):
 *   - showsEdgeHandle() -> Boolean — false hides the handle entirely (e.g. a
 *     band with no content yet has no boundary to mark).
 *   - collapsibleRegionLabel() -> String — the handle's accessible name.
 *   - expandedRegionBackgroundCss() -> String — a CSS color the whole column
 *     is painted while the region is expanded (e.g. a theatre's near-black),
 *     so sub-pixel rounding seams can never show the page through it.
 */
(class SvCollapsibleRegionProtocol extends Protocol {

    /**
     * @description Whether the region is currently expanded. Drives the
     * handle's aria-expanded state and boundary rule.
     * @returns {Boolean}
     * @category State
     */
    isExpanded () {}

    /**
     * @description Toggles the region between expanded and collapsed — what a
     * click on the handle's pill does.
     * @category Actions
     */
    toggleExpanded () {}

    /**
     * @description The axis along which the region grows when expanding:
     * "vertical" (a header band or footer row) or "horizontal" (a side panel).
     * @returns {String}
     * @category Layout
     */
    collapsibleAxis () {}

}.initThisClass());

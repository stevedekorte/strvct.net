"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTile
 */

/**
 * @class SvInlineSectionTile
 * @extends SvTile
 * @classdesc A section of an inline document (Plans/Inline Navigation): a
 * subnode shown in place rather than as a tile that opens the next column.
 * A heading from the node's title, then a nested tiles view of its subnodes
 * — each an ordinary tile, or a section of its own while the document's
 * inline depth allows.
 *
 * The nested tiles view is the same SvTilesView a column uses, told it is
 * nested: it does not scroll, select or navigate, and it keeps its rows in
 * sync with the node as any column does (adds, removes, reorders).
 *
 * A section takes no gestures in version 1: no slide-to-delete, no
 * long-press drag (reordering between sections is a later milestone).
 */
(class SvInlineSectionTile extends SvTile {

    /**
     * @description Adds the stylesheet rules for inline documents, once:
     * the columns, the sections, their headings and compact rows. Nothing
     * transitions and nothing is measured.
     * @category Inline
     */
    static initClass () {
        this.newClassSlot("hasAddedInlineCss", false);
    }

    static ensureInlineCss () {
        if (SvInlineSectionTile.hasAddedInlineCss()) {
            return;
        }
        SvInlineSectionTile.setHasAddedInlineCss(true);
        SvWebDocument.shared().addStyleSheetString(`
            .SvInlineDocument {
                display: block !important;
                column-width: var(--inline-column-width);
                column-gap: var(--sv-inline-column-gap);
                padding: var(--sv-inline-document-padding);
                box-sizing: border-box;
                height: auto !important;
            }
            .SvInlineDocument > * {
                break-inside: avoid;
            }
            .SvInlineSection {
                display: block !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                white-space: normal !important;
                margin-bottom: var(--sv-inline-section-gap);
                cursor: default;
            }
            .SvInlineSection.SvInlineSpans {
                column-span: all;
            }
            .SvInlineSection > .TileContentView {
                display: flex !important;
                flex-direction: column !important;
                float: none !important;
                min-height: 0 !important;
                height: auto !important;
                background-color: transparent !important;
                padding: 0 !important;
            }
            .SvInlineSectionHeading {
                font-size: var(--sv-inline-heading-font-size);
                letter-spacing: var(--sv-inline-heading-tracking);
                text-transform: uppercase;
                font-weight: 500;
                color: var(--sv-inline-heading-color);
                padding: 0 0 8px 0;
                border-bottom: 1px solid var(--sv-inline-heading-rule);
                white-space: normal;
            }
            .SvInlineNested .SvInlineSection {
                margin-bottom: 4px;
            }
            .SvInlineNested .SvInlineSectionHeading {
                border-bottom: none;
                color: var(--sv-inline-group-heading-color);
                font-size: calc(var(--sv-inline-heading-font-size) - 1px);
                padding: 14px 0 2px 0;
            }
            .SvInlineNested {
                display: flex !important;
                flex-direction: column !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
                width: 100% !important;
            }
            .SvInlineNested > :not(.SvInlineSection) {
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                white-space: normal !important;
                border-bottom: 1px solid var(--sv-inline-row-rule);
            }
            .SvInlineNested > :not(.SvInlineSection) > .TileContentView {
                min-height: 0 !important;
                height: auto !important;
            }
            /* a field in a document reads as a line — key, then value at the
               right — and shows its editing border only when pointed at or
               being edited, so editing in place stays possible but quiet */
            .SvInlineNested .KvSection {
                flex-direction: row !important;
                align-items: baseline !important;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
            }
            .SvInlineNested .KeyViewContainer {
                flex: 1 1 auto;
                min-width: 0;
            }
            .SvInlineNested .ValueViewContainer {
                flex: 0 1 auto;
                align-items: flex-end !important;
                max-width: 60%;
            }
            .SvInlineNested .ValueViewContainer > * {
                width: auto !important;
                min-width: 2em;
                justify-content: flex-end;
                text-align: right !important;
                border-color: transparent !important;
            }
            .SvInlineNested .ValueViewContainer:hover > [contenteditable="true"],
            .SvInlineNested .ValueViewContainer > :focus {
                border-color: var(--sv-inline-row-rule) !important;
            }
            /* a row's description reads in full: it wraps rather than trailing off */
            .SvInlineNested .SvTileSubtitleView {
                white-space: normal !important;
                text-overflow: clip !important;
                overflow: visible !important;
            }
        `);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("headingView", null);
            slot.setSlotType("SvTextView");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("sectionTilesView", null); // the section's subnodes, in place
            slot.setSlotType("SvTilesView");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        SvInlineSectionTile.ensureInlineCss();
        this.removeAllGestureRecognizers(); // version 1: a section is read, not slid, dragged or selected
        this.element().classList.add("SvInlineSection");
        this.setAriaRole("group");
        this.setupHeadingView();
        this.setupSectionTilesView();
        return this;
    }

    setupHeadingView () {
        const heading = SvTextView.clone();
        heading.element().classList.add("SvInlineSectionHeading");
        heading.setAriaRole("heading");
        this.setHeadingView(heading);
        this.addContentSubview(heading);
        return this;
    }

    setupSectionTilesView () {
        const tiles = SvTilesView.clone();
        tiles.setIsInlineNested(true);
        this.setSectionTilesView(tiles);
        this.addContentSubview(tiles);
        return this;
    }

    /**
     * @description How many more levels the section's own subnodes may be
     * shown in place: one fewer than the tiles view this section sits in.
     * @returns {Number}
     * @category Inline
     */
    nestedDepth () {
        const parent = this.tilesView();
        return (parent && parent.inlineDepth) ? Math.max(0, parent.inlineDepth() - 1) : 0;
    }

    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        if (!node) {
            return this;
        }
        this.headingView().setString(node.translatedValueOfSlotNamed ? node.translatedValueOfSlotNamed("title") : node.title());
        this.element().classList.toggle("SvInlineSpans", !!(node.nodeSpansInlineColumns && node.nodeSpansInlineColumns()));
        this.syncSectionTilesView();
        return this;
    }

    syncSectionTilesView () {
        const tiles = this.sectionTilesView();
        tiles.setNestedInlineDepth(this.nestedDepth());
        if (tiles.node() !== this.node()) {
            tiles.setNode(this.node());
        }
        return this;
    }

}.initThisClass());

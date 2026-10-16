"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTile
 */

/**
 * @class SvInlineSectionTile
 * @extends SvTile
 * @classdesc A section of an inline document (Plans/Inline Navigation): a
 * subnode shown in place rather than as a tile that opens the next column.
 * A heading from the node's title (with the node's nodeInlineHeadingNote at
 * its right, if any), then a nested tiles view of its subnodes
 * — each an ordinary tile, or a section of its own while the document's
 * inline depth allows.
 *
 * The nested tiles view is the same SvTilesView a column uses, told it is
 * nested: it does not scroll, select or navigate, and it keeps its rows in
 * sync with the node as any column does (adds, removes, reorders).
 *
 * A section takes no gestures but a tap on its heading: no slide-to-delete,
 * no long-press drag (reordering between sections is a later milestone).
 * When its node asks (nodeInlineCollapse), the heading folds the section
 * away to just the heading and its note; which sections are folded is view
 * state, kept on the section's element like an open row. A fold the player
 * makes is told to the node (didChangeInlineCollapse, if it answers it), so
 * a node that remembers it can start the section that way next time.
 *
 * With Option/Alt or Shift held, a tap (or Enter) on any section's heading
 * opens or closes everything inside at once (toggleAllInside): the nearest
 * rows and sections inside that open, looking through groups that do not.
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

    /**
     * @description What a subnode shows in place: the node it links to (a
     * pointer field's object, as a column would open it) or the subnode
     * itself.
     * @param {SvNode} aSubnode
     * @returns {SvNode}
     * @category Inline
     */
    static inlineTargetOf (aSubnode) {
        const link = aSubnode.nodeTileLink ? aSubnode.nodeTileLink() : null;
        return link || aSubnode;
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
                column-count: var(--inline-max-columns); /* with a width, a count is the most columns */
                column-gap: var(--sv-inline-column-gap);
                padding: var(--sv-inline-document-padding);
                box-sizing: border-box;
                height: auto !important;
            }
            .SvInlineDocument > * {
                break-inside: avoid;
            }
            /* a section that folds (nodeInlineCollapse): its heading is the
               control, with a chevron after the note — down open, right
               folded; folded, only the heading shows */
            .SvInlineCollapsible > .TileContentView > .SvInlineSectionHead {
                cursor: pointer;
            }
            .SvInlineCollapsible > .TileContentView > .SvInlineSectionHead:focus-visible {
                outline: 2px solid var(--sv-inline-disclosure-color);
                outline-offset: 3px;
            }
            .SvInlineCollapsible > .TileContentView > .SvInlineSectionHead::after {
                content: ""; /* decoration: the fold mark */
                flex: none;
                align-self: center;
                width: 7px;
                height: 7px;
                margin-right: 4px;
                border-right: 1px solid currentColor;
                border-bottom: 1px solid currentColor;
                color: var(--sv-inline-heading-color);
                transform: translateY(-2px) rotate(45deg);
            }
            .SvInlineCollapsed > .TileContentView > .SvInlineSectionHead::after {
                transform: rotate(-45deg);
            }
            .SvInlineCollapsed > .TileContentView > .SvInlineNested {
                display: none !important;
            }
            /* rows (nodeInlineFlow "rows"): a grid of as many columns of at
               least the column width as fit, at most the node's maximum;
               sections run left to right and keep their places */
            .SvInlineDocument.SvInlineRows {
                display: grid !important;
                column-count: auto;
                column-width: auto;
                grid-template-columns: repeat(auto-fill, minmax(min(100%, max(var(--inline-column-width), calc((100% - (var(--inline-max-columns) - 1) * var(--sv-inline-column-gap)) / var(--inline-max-columns)))), 1fr));
                column-gap: var(--sv-inline-column-gap);
                align-items: start;
            }
            .SvInlineDocument.SvInlineRows > .SvInlineSpans {
                grid-column: 1 / -1;
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
            .SvInlineSectionHead:has(> .SvInlineSectionHeading:empty) {
                display: none !important; /* an untitled group: its rows follow the section's own heading */
            }
            .SvInlineSectionHead {
                user-select: none; /* a heading is a control: Shift-click opens everything inside, not a text selection */
                display: flex !important;
                flex-direction: row !important;
                align-items: baseline !important;
                justify-content: space-between;
                gap: 12px;
                padding: 0 0 8px 0;
                border-bottom: 1px solid var(--sv-inline-heading-rule);
            }
            .SvInlineSectionHeading {
                flex: 1 1 auto;
                min-width: 0;
                font-size: var(--sv-inline-heading-font-size);
                letter-spacing: var(--sv-inline-heading-tracking);
                text-transform: uppercase;
                font-weight: 500;
                color: var(--sv-inline-heading-color);
                white-space: normal;
            }
            .SvInlineSectionNote:empty {
                display: none;
            }
            .SvInlineSectionNote {
                flex: 0 1 auto;
                text-align: right;
                white-space: nowrap;
                font-size: var(--sv-inline-heading-font-size);
                color: var(--sv-inline-heading-color);
            }
            .SvInlineNested .SvInlineSectionNote {
                color: var(--sv-inline-group-heading-color);
            }
            .SvInlineNested .SvInlineSection {
                margin-bottom: 4px;
            }
            .SvInlineNested .SvInlineSectionHead {
                border-bottom: none;
                padding: 14px 0 2px 0;
            }
            .SvInlineNested .SvInlineSectionHeading {
                color: var(--sv-inline-group-heading-color);
                font-size: calc(var(--sv-inline-heading-font-size) - 1px);
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
            /* an image value (a portrait) fills its row instead of sitting at the right */
            .SvInlineNested .ValueViewContainer:has(img) {
                flex: 1 1 auto;
                max-width: 100%;
                align-items: stretch !important;
            }
            .SvInlineNested .ValueViewContainer:has(img) > * {
                width: 100% !important;
                justify-content: center;
            }
            .SvInlineNested .ValueViewContainer:hover > [contenteditable="true"],
            .SvInlineNested .ValueViewContainer > :focus {
                border-color: var(--sv-inline-row-rule) !important;
            }
            /* an empty list is left out of a document (SvTile marks it) */
            .SvInlineNested > .SvTileEmptyCollection,
            .SvInlineDocument > .SvTileEmptyCollection {
                display: none !important;
            }
            /* a short summary reads as a value: at the right of the title, on its line */
            .SvInlineNested > :not(.SvTileLongSubtitle):not(.SvInlineSection) :has(> .SvTileTitleView) {
                flex-direction: row !important;
                align-items: baseline !important;
                justify-content: space-between !important;
                gap: 12px;
            }
            .SvInlineNested > :not(.SvTileLongSubtitle):not(.SvInlineSection) .SvTileSubtitleView {
                width: auto !important;
                flex: 0 1 auto;
                text-align: right !important;
                margin: 0 !important;
            }
            /* a row's title and note read in full: side by side when they
               fit, else the note drops whole onto the next line, at the
               right — never squeezed beside the title into a word per line,
               and never clipping it. A title keeps its longest word whole. */
            .SvInlineNested > :not(.SvInlineSection) :has(> * > .SvTileNoteView) {
                flex-wrap: wrap !important;
            }
            .SvInlineNested > :not(.SvInlineSection) :has(> .SvTileTitleView) {
                flex: 1 1 auto !important;
                min-width: min-content !important;
            }
            .SvInlineNested > :not(.SvInlineSection) .SvTileTitleView {
                width: auto !important;
                min-width: min-content !important;
                white-space: normal !important;
                overflow: visible !important;
                text-overflow: clip !important;
            }
            .SvInlineNested > :not(.SvTileLongSubtitle):not(.SvInlineSection) .SvTileTitleView {
                flex: 1 1 auto; /* a short summary at its right takes what the title leaves */
            }
            .SvInlineNested > :not(.SvInlineSection) :has(> .SvTileNoteView) {
                flex: 0 0 auto !important; /* its whole width, or the next line */
                min-width: 0 !important;
                max-width: 100%; /* longer than the row: it wraps there */
                margin-left: auto;
                padding-left: 12px;
            }
            .SvInlineNested > :not(.SvInlineSection) .SvTileNoteView {
                white-space: normal !important;
                text-align: right !important;
            }
            /* a row's description reads in full: it wraps rather than trailing off */
            .SvInlineNested .SvTileSubtitleView {
                white-space: normal !important;
                text-overflow: clip !important;
                overflow: visible !important;
            }
            /* a row with a description opens and closes (SvTilesView_inline
               didTapInlineItem): closed, only its title shows, after a
               diamond — an outline closed, filled open. A short summary
               shows as it is (SvTitledTile marks the long ones). */
            .SvInlineNested > .SvTileLongSubtitle:not(.SvInlineSection) {
                cursor: pointer;
            }
            .SvInlineNested > .SvTileLongSubtitle:not(.SvInlineSection):not(.SvInlineOpen) .SvTileSubtitleView {
                display: none !important;
            }
            .SvInlineNested > .SvTileLongSubtitle:not(.SvInlineSection) .SvTileTitleView::before {
                content: ""; /* decoration: the disclosure mark */
                display: inline-block;
                width: 6px;
                height: 6px;
                margin: 0 12px 0 1px;
                vertical-align: 0.2em;
                border: 1px solid var(--sv-inline-disclosure-color);
                transform: rotate(45deg);
                margin-left: -20px; /* hangs left of the title, so a wrapped title's lines start together */
            }
            .SvInlineNested > .SvTileLongSubtitle:not(.SvInlineSection) .SvTileTitleView {
                padding-left: 21px !important;
            }
            .SvInlineNested > .SvInlineOpen:not(.SvInlineSection) .SvTileTitleView::before {
                background-color: var(--sv-inline-disclosure-color);
            }
            .SvInlineNested > .SvTileLongSubtitle:not(.SvInlineSection) .SvTileSubtitleView {
                padding-left: 20px !important; /* under the title, past the diamond (over the view's inline padding) */
                width: 0 !important; /* fills the title's column without widening it, so an open */
                min-width: 100% !important; /* description never pushes the note off its title's line */
                box-sizing: border-box;
            }
            /* an open row's note stays on its title's line, not centered
               beside the description under it */
            .SvInlineNested > .SvInlineOpen:not(.SvInlineSection) :has(> .SvTileNoteView) {
                align-self: flex-start !important;
                align-items: flex-start !important;
            }
        `);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("headView", null); // the heading and its note; the fold control when the section folds
            slot.setSlotType("SvDomView");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("collapseNode", null); // the node whose starting fold was applied, so it is applied once per node
            slot.setSlotType("SvNode");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("headingView", null);
            slot.setSlotType("SvTextView");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("headingNoteView", null); // the node's nodeInlineHeadingNote, at the heading's right
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
        this.addDefaultTapGesture(); // a tap on its heading folds it (rows inside take their own taps first)
        this.element().classList.add("SvInlineSection");
        this.setAriaRole("group");
        this.setupHeadingView();
        this.setupSectionTilesView();
        return this;
    }

    setupHeadingView () {
        const head = SvDomView.clone();
        head.element().classList.add("SvInlineSectionHead");
        const heading = SvTextView.clone();
        heading.element().classList.add("SvInlineSectionHeading");
        heading.setAriaRole("heading");
        const note = SvTextView.clone();
        note.element().classList.add("SvInlineSectionNote");
        head.addSubview(heading);
        head.addSubview(note);
        this.setHeadView(head);
        this.setHeadingView(heading);
        this.setHeadingNoteView(note);
        this.addContentSubview(head);
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
        this.headingNoteView().setString((node.nodeInlineHeadingNote && node.nodeInlineHeadingNote()) || "");
        this.element().classList.toggle("SvInlineSpans", !!(node.nodeSpansInlineColumns && node.nodeSpansInlineColumns()));
        this.syncCollapse();
        this.syncSectionTilesView();
        return this;
    }

    /**
     * @description The nested tiles view shows the node this section stands
     * for: the object a pointer field links to, or the node itself. The
     * heading keeps the field's title ("Ability Scores").
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    syncSectionTilesView () {
        const tiles = this.sectionTilesView();
        const target = SvInlineSectionTile.inlineTargetOf(this.node());
        tiles.setNestedInlineDepth(this.nestedDepth());
        if (tiles.node() !== target) {
            tiles.setNode(target);
        }
        return this;
    }

    // --- folding ---

    /**
     * @description What the node asks of the section's fold: null (it does
     * not fold), "open" or "closed" (how it starts).
     * @returns {String|null}
     * @category Inline
     */
    collapseRequest () {
        const node = this.node();
        return (node && node.nodeInlineCollapse) ? node.nodeInlineCollapse() : null;
    }

    isCollapsible () {
        return this.collapseRequest() !== null;
    }

    isCollapsed () {
        return this.element().classList.contains("SvInlineCollapsed"); // a class, not a measurement
    }

    /**
     * @description Makes the heading the fold control when the node asks for
     * one, and starts the section open or folded as the node asks — once per
     * node, so a re-sync keeps what the player folded.
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    syncCollapse () {
        const isCollapsible = this.isCollapsible();
        this.element().classList.toggle("SvInlineCollapsible", isCollapsible);
        this.syncHeadControl(isCollapsible);
        if (this.collapseNode() !== this.node()) {
            this.setCollapseNode(this.node());
            this.setIsCollapsed(this.collapseRequest() === "closed");
        } else if (!isCollapsible) {
            this.setIsCollapsed(false);
        }
        return this;
    }

    /**
     * @description A heading that folds is a button, reached with Tab; one
     * that does not is only a heading.
     * @param {Boolean} isCollapsible
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    syncHeadControl (isCollapsible) {
        const head = this.headView();
        if (isCollapsible) {
            head.setAriaRole("button");
            head.setAttribute("tabindex", "0");
            head.setAttribute("title", "Option- or Shift-click to open or close everything inside");
        } else {
            head.setAriaRole(null);
            head.removeAttribute("tabindex");
            head.removeAttribute("aria-expanded");
            head.removeAttribute("title");
        }
        return this;
    }

    setIsCollapsed (aBool) {
        this.element().classList.toggle("SvInlineCollapsed", aBool);
        if (this.isCollapsible()) {
            this.headView().setAttribute("aria-expanded", aBool ? "false" : "true");
        }
        return this;
    }

    /**
     * @description The player folds or opens the section: the view changes,
     * and the node hears which way ("open" / "closed").
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    toggleCollapsed () {
        this.setIsCollapsed(!this.isCollapsed());
        const node = this.node();
        if (node && node.didChangeInlineCollapse) {
            node.didChangeInlineCollapse(this.isCollapsed() ? "closed" : "open");
        }
        return this;
    }

    /**
     * @description Whether a pointer or key event happened on the heading
     * of a section that folds (not on a row inside it).
     * @param {Event} event
     * @returns {Boolean}
     * @category Inline
     */
    isFoldEvent (event) {
        return !!(event && this.isCollapsible() && this.isHeadEvent(event));
    }

    isHeadEvent (event) {
        return this.headView().element().contains(event.target);
    }

    /**
     * @description Whether an event on the heading asks for everything
     * inside (Option/Alt or Shift held) — on any section's heading, so a
     * group that does not fold (a spell level) still opens its rows.
     * @param {Event} event
     * @returns {Boolean}
     * @category Inline
     */
    isFoldAllEvent (event) {
        return !!(event && (event.altKey || event.shiftKey) && this.isHeadEvent(event));
    }

    /**
     * @description A tap or Enter on the heading: with Option/Alt or Shift,
     * everything inside opens or closes; else the section folds or opens.
     * @param {Event} event
     * @returns {Boolean} whether the event was the heading's
     * @category Inline
     */
    handleHeadEvent (event) {
        if (this.isFoldAllEvent(event)) {
            this.toggleAllInside();
            return true;
        }
        if (this.isFoldEvent(event)) {
            this.toggleCollapsed();
            return true;
        }
        return false;
    }

    // --- everything inside ---

    /**
     * @description Opens or closes everything inside at once: a folded
     * section opens with all of it open; an open one stays open and sets
     * all of it to the opposite of the first, so a second time undoes it.
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    toggleAllInside () {
        const targets = this.innerFoldTargets();
        const open = this.isCollapsed() || (targets.length > 0 && !targets[0].isInlineOpen());
        this.setIsInlineOpen(true);
        targets.forEach(target => target.setIsInlineOpen(open));
        return this;
    }

    innerFoldTargets () {
        return this.sectionTilesView().inlineFoldTargets();
    }

    /**
     * @description As something inside another section: a section that
     * folds opens and closes itself; one that does not is looked through.
     * @returns {Array<SvTile>}
     * @category Inline
     */
    inlineFoldTargets () {
        return this.isCollapsible() ? [this] : this.innerFoldTargets();
    }

    isInlineOpenable () {
        return this.isCollapsible();
    }

    isInlineOpen () {
        return !this.isCollapsed();
    }

    /**
     * @description Opens or folds the section as the player would, so a
     * node that remembers its fold hears of it.
     * @param {Boolean} aBool
     * @returns {SvInlineSectionTile}
     * @category Inline
     */
    setIsInlineOpen (aBool) {
        if (this.isCollapsible() && aBool !== this.isInlineOpen()) {
            this.toggleCollapsed();
        }
        return this;
    }

    onTapComplete (aGesture) {
        this.handleHeadEvent(aGesture.downEvent());
        return this;
    }

    onEnterKeyUp (event) {
        return !this.handleHeadEvent(event); // false stops propagation
    }

    onAlternateEnterKeyUp (event) {
        return this.onEnterKeyUp(event); // Option+Enter: everything inside
    }

    onShiftEnterKeyUp (event) {
        return this.onEnterKeyUp(event);
    }

    onSpaceKeyUp (event) {
        return this.onEnterKeyUp(event);
    }

    onSpaceKeyDown (event) {
        if (this.isFoldEvent(event)) {
            event.preventDefault(); // Space on a button presses it rather than scrolling the page
            return false;
        }
        return true;
    }

}.initThisClass());

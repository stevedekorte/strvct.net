"use strict";

/** * @module library.node.node_views.browser.stack.SvTile
 */

/** * @class SvStatusBarTile
 * @extends SvTitledTile
 * @classdesc A tile displaying a labeled value within a range as a thin
 * horizontal bar (e.g. health, capacity, progress, remaining uses).
 *
 * Layout:
 *
 *     [ title                    value / max ]
 *     [ ──────────────bar────────────       ]
 *     [ subtitle (optional)                 ]
 *
 * The tile reads an optional protocol from its node (via getFromNodeDelegate):
 *
 *   - barValue() → Number — the current value
 *   - barMaxValue() → Number — the maximum value
 *   - barRoleName() → String — a semantic color role, one of:
 *     "neutral" | "info" | "success" | "warning" | "danger" | "accent"
 *     The node expresses domain semantics (e.g. "danger" when low), never CSS;
 *     the role maps to a CSS class here, and colors can be themed via:
 *
 *     --SvStatusBarTile-color-neutral … --SvStatusBarTile-color-accent
 *
 * The node's subtitle(), if present, renders below the bar.
 * When the value decreases, the bar fill plays a brief brightness flash while
 * the width transition animates the shrink.
 *
 * Nodes select this tile with setNodeTileClassName("SvStatusBarTile").
 */

(class SvStatusBarTile extends SvTitledTile {

    initPrototypeSlots () {
        /**
         * @member {SvDomView} barRowView - full-width row holding the track
         * @category UI
         */
        {
            const slot = this.newSlot("barRowView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} barTrackView - the bar background track
         * @category UI
         */
        {
            const slot = this.newSlot("barTrackView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} barFillView - the filled portion of the bar
         * @category UI
         */
        {
            const slot = this.newSlot("barFillView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} barSubtitleView - optional text row below the bar
         * @category UI
         */
        {
            const slot = this.newSlot("barSubtitleView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {String} currentBarRoleName - the role class currently applied to the fill
         * @category State
         */
        {
            const slot = this.newSlot("currentBarRoleName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Number} lastBarValue - previous value, used to detect decreases
         * @category State
         */
        {
            const slot = this.newSlot("lastBarValue", null);
            slot.setSlotType("Number");
        }
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvStatusBarTileContent {
                /* center the wrapped rows (title/value, bar, subtitle) as a
                   group within the tile — as a class so the theme's style
                   pass can't overwrite it */
                align-content: center;
            }

            .SvStatusBarTileRow {
                /* the tile contentView already carries the theme's horizontal
                   padding, so the bar aligns flush with the label above it;
                   label→bar spacing matches a tile's title→subtitle rhythm */
                flex-basis: 100%;
                box-sizing: border-box;
                margin-top: 0.75em;
            }

            .SvStatusBarTileTrack {
                width: 100%;
                height: 3px;
                background-color: rgba(255, 255, 255, 0.08);
            }

            .SvStatusBarTileFill {
                height: 100%;
                background-color: var(--SvStatusBarTile-color-neutral, rgba(255, 255, 255, 0.6));
                transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
            }

            .SvStatusBarTileFill.role-info { background-color: var(--SvStatusBarTile-color-info, rgb(0, 100, 181)); }
            .SvStatusBarTileFill.role-success { background-color: var(--SvStatusBarTile-color-success, rgb(0, 181, 0)); }
            .SvStatusBarTileFill.role-warning { background-color: var(--SvStatusBarTile-color-warning, rgb(240, 192, 0)); }
            .SvStatusBarTileFill.role-danger { background-color: var(--SvStatusBarTile-color-danger, rgb(181, 0, 0)); }
            .SvStatusBarTileFill.role-accent { background-color: var(--SvStatusBarTile-color-accent, rgb(59, 78, 255)); }

            .SvStatusBarTileFill.flashDecrease {
                animation: SvStatusBarTileFlash 0.6s ease-in-out 1;
            }

            @keyframes SvStatusBarTileFlash {
                0% { filter: brightness(1); }
                25% { filter: brightness(2.4); }
                100% { filter: brightness(1); }
            }

            .SvStatusBarTileSubtitle {
                flex-basis: 100%;
                font-size: 80%;
                line-height: 1.3;
                opacity: 0.6;
                padding-top: 6px;
                box-sizing: border-box;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `);
    }

    /**
     * @description Initializes the SvStatusBarTile, adding the bar and subtitle rows.
     * @returns {SvStatusBarTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        const cv = this.contentView();
        cv.setFlexWrap("wrap");
        cv.appendElementClassName("SvStatusBarTileContent");

        const row = SvDomView.clone().setElementClassName("SvStatusBarTileRow");
        this.setBarRowView(row);
        cv.addSubview(row);

        const track = SvDomView.clone().setElementClassName("SvStatusBarTileTrack");
        this.setBarTrackView(track);
        row.addSubview(track);

        const fill = SvDomView.clone().setElementClassName("SvStatusBarTileFill");
        fill.setWidthPercentage(0);
        this.setBarFillView(fill);
        track.addSubview(fill);

        const sub = SvTextView.clone();
        sub.setElementClassName("SvStatusBarTileSubtitle");
        sub.hideDisplay();
        this.setBarSubtitleView(sub);
        cv.addSubview(sub);

        // the bar is labeled through a single composed string ("Health: 8 / 40")
        // rendered by the note view, which every sync path re-asserts — the
        // separate title view proved unreliable (translation sync can blank it)
        this.topContentArea().hideDisplay();
        const noteArea = this.bottomContentArea();
        noteArea.setFlexGrow(1);
        noteArea.setJustifyContent("flex-start");
        this.noteView().setTextAlign("left");

        return this;
    }

    /**
     * @description The inherited subtitle row never shows; the node's subtitle
     * renders below the bar via barSubtitleView instead.
     * @returns {boolean}
     * @category State
     */
    hasSubtitle () {
        return false;
    }

    /**
     * @description Suppress the inherited right-side thumbnail; status bars don't show one.
     * @returns {SvStatusBarTile} The current instance.
     * @category UI
     */
    async asyncUpdateThumbnailView () {
        return this;
    }

    /**
     * @description Reads the bar protocol from the node and updates the bar,
     * note text, role color, and subtitle. Plays a flash when the value decreases.
     * @returns {SvStatusBarTile} The current instance.
     * @category Data
     */
    syncFromNode () {
        super.syncFromNode();

        const node = this.node();
        if (!node) {
            return this;
        }

        const rawValue = this.getFromNodeDelegate("barValue");
        const rawMax = this.getFromNodeDelegate("barMaxValue");
        const value = typeof (rawValue) === "number" ? rawValue : 0;
        const max = typeof (rawMax) === "number" ? rawMax : 0;
        const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

        this.barFillView().setWidthPercentage(percent);
        this.showNoteView();

        this.syncBarRole();
        this.syncBarSubtitle();

        if (this.lastBarValue() !== null && value < this.lastBarValue()) {
            this.flashBarDecrease();
        }
        this.setLastBarValue(value);

        return this;
    }

    /**
     * @description The "value / max" note. Composed here (not written
     * imperatively in syncFromNode) so the framework's updateSubviews →
     * showNoteView path — which runs on selection changes — never wipes it.
     * @category UI
     */
    showNoteView () {
        super.showNoteView();
        const nodeNote = this.getFromNodeDelegate("note");
        if (nodeNote === null || nodeNote === undefined || nodeNote === "") {
            const rawValue = this.getFromNodeDelegate("barValue");
            const rawMax = this.getFromNodeDelegate("barMaxValue");
            const value = typeof (rawValue) === "number" ? rawValue : 0;
            const max = typeof (rawMax) === "number" ? rawMax : 0;
            const node = this.node();
            const label = (node && node.title && node.title()) ? node.title() + ": " : "";
            this.noteView().setString(label + Math.round(value) + " / " + Math.round(max));
        }
    }

    /**
     * @description Maps the node's semantic role name onto a role-* CSS class on the fill.
     * @returns {SvStatusBarTile} The current instance.
     * @category Styling
     */
    syncBarRole () {
        let roleName = this.getFromNodeDelegate("barRoleName");
        if (typeof (roleName) !== "string" || roleName === "neutral") {
            roleName = null;
        }

        const oldRole = this.currentBarRoleName();
        if (oldRole !== roleName) {
            const fill = this.barFillView();
            if (oldRole) {
                fill.removeElementClassName("role-" + oldRole);
            }
            if (roleName) {
                fill.appendElementClassName("role-" + roleName);
            }
            this.setCurrentBarRoleName(roleName);
        }
        return this;
    }

    /**
     * @description Shows the node's subtitle below the bar, or hides the row if empty.
     * @returns {SvStatusBarTile} The current instance.
     * @category UI
     */
    syncBarSubtitle () {
        const node = this.node();
        const subtitle = node.subtitle ? node.subtitle() : null;
        const sub = this.barSubtitleView();
        if (subtitle !== null && subtitle !== "") {
            sub.setString(subtitle);
            sub.unhideDisplay();
        } else {
            sub.hideDisplay();
        }
        return this;
    }

    /**
     * @description Plays a brief brightness flash on the bar fill (e.g. on damage).
     * Restarts the animation if one is already in flight.
     * @returns {SvStatusBarTile} The current instance.
     * @category Styling
     */
    flashBarDecrease () {
        const fill = this.barFillView();
        if (fill.elementClassNames().includes("flashDecrease")) {
            fill.removeElementClassName("flashDecrease");
            fill.element().getBoundingClientRect(); // force reflow so the animation restarts
        }
        fill.appendElementClassName("flashDecrease");
        this.addWeakTimeout(() => {
            fill.removeElementClassName("flashDecrease");
        }, 700);
        return this;
    }

}.initThisClass());

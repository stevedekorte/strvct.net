"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvAnchoredTabsLayout
 * @extends ProtoClass
 * @classdesc The rules of anchored tabs (Plans/Anchor Tabs § Layout rules),
 * with no DOM: given the tabs (in subnode order), each tab's width needs, its
 * availability and pin preference, the container width and the player's
 * gestures, it keeps which tabs are open, pinned and evicted, and answers the
 * pane widths. The view renders that state; it makes no layout decisions.
 *
 * A tab spec: { id, minWidth, comfortableWidth?, isAvailable?, pinPreference? }
 * where pinPreference is "pinned", "open" or null (the node's suggestion,
 * nodeTabPinPreference()). The player's own pin or unpin of a tab overrides
 * its preference and is remembered (playerPinOverrides).
 *
 * Rules:
 * - Panes open while the sum of their minimum widths (plus dividers) fits.
 * - Opening a tab that doesn't fit: unpinned panes give way first (leftmost
 *   first), then pinned ones (rightmost first). Narrowing: the rightmost
 *   unpinned pane goes first, then the rightmost pinned one.
 * - The current pane (the one with focus) counts as pinned and goes last.
 * - A pinned pane closed for room is evicted with a sequence number; as
 *   width grows, evicted pins return most recently evicted first. Unpinned
 *   panes closed for room are not restored.
 * - A tab that stops being available closes; if it was pinned it is
 *   remembered as evicted, so it returns when it is available again.
 * - At least one pane is open whenever any tab is available.
 */
(class SvAnchoredTabsLayout extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("tabSpecs", null); // Array, in subnode order
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("containerWidth", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("dividerWidth", 1);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("openIds", null); // Set of tab ids
            slot.setSlotType("Set");
        }
        {
            const slot = this.newSlot("playerPinOverrides", null); // Map id -> Boolean (the player's own pin / unpin)
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("modelPinnedIds", null); // Set: tabs whose preference is "pinned"
            slot.setSlotType("Set");
        }
        {
            const slot = this.newSlot("evictionSeqs", null); // Map id -> sequence number
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("evictionCounter", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("dividerSplits", null); // Map leftId -> { rightId, leftWidth }: dragged dividers
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("dividerSplitsOpenKey", null); // the open set the splits were dragged for
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("currentTabId", null); // the pane with focus
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        this.setTabSpecs([]);
        this.setOpenIds(new Set());
        this.setPlayerPinOverrides(new Map());
        this.setModelPinnedIds(new Set());
        this.setEvictionSeqs(new Map());
        this.setDividerSplits(new Map());
        return this;
    }

    // --- inputs ---

    /**
     * @description Updates the tabs (order, widths, availability, preferences)
     * and re-applies the rules. A preference turning to "pinned" pins and
     * opens the tab if there is room, else records it as evicted; turning
     * away unpins it (unless the player pinned it); "open" opens it if there
     * is room.
     * @param {Array<Object>} specs
     * @returns {SvAnchoredTabsLayout}
     * @category Inputs
     */
    updateTabs (specs) {
        const before = new Map(this.tabSpecs().map(t => [t.id, t]));
        this.setTabSpecs(specs.map(s => this.normalizedSpec(s)));
        this.tabSpecs().forEach(t => this.applyPreferenceChange(before.get(t.id) || null, t));
        return this.reconcile();
    }

    normalizedSpec (spec) {
        return {
            id: spec.id,
            minWidth: spec.minWidth || 0,
            comfortableWidth: spec.comfortableWidth || spec.minWidth || 1,
            isAvailable: spec.isAvailable !== false,
            pinPreference: spec.pinPreference || null
        };
    }

    applyPreferenceChange (before, tab) {
        const was = before ? before.pinPreference : null;
        if (tab.pinPreference === was) {
            return this;
        }
        if (was === "pinned") {
            this.modelPinnedIds().delete(tab.id);
            if (!this.playerPinOverrides().has(tab.id)) {
                this.evictionSeqs().delete(tab.id);
            }
        }
        if (tab.pinPreference === "pinned") {
            this.modelPinnedIds().add(tab.id);
        }
        if (tab.pinPreference && tab.isAvailable && !this.playerPinOverrides().has(tab.id)) {
            this.openOrRememberForPreference(tab);
        }
        return this;
    }

    openOrRememberForPreference (tab) {
        if (this.fitsWith(tab.id)) {
            this.openIds().add(tab.id);
        } else if (tab.pinPreference === "pinned") {
            this.recordEviction(tab.id);
        }
        return this;
    }

    /**
     * @description The container's width changed (from the view's cached
     * ResizeObserver width — never measured during a sync).
     * @param {Number} width
     * @returns {SvAnchoredTabsLayout}
     * @category Inputs
     */
    updateContainerWidth (width) {
        this.setContainerWidth(width);
        return this.reconcile();
    }

    // --- gestures ---

    /**
     * @description Tap / click: a closed tab opens (pinned panes stay,
     * unpinned ones are replaced by it); an open unpinned tab closes (unless
     * it is the last pane); an open pinned tab does nothing.
     * @param {String} id
     * @returns {SvAnchoredTabsLayout}
     * @category Gestures
     */
    tapTab (id) {
        if (!this.isAvailable(id)) {
            return this;
        }
        if (this.isOpen(id)) {
            return this.isPinned(id) ? this : this.closeByHand(id);
        }
        this.openIdsInOrder().filter(open => !this.isPinned(open)).forEach(open => this.openIds().delete(open));
        return this.openByHand(id);
    }

    /**
     * @description Pin (the pin control, shift/option-click, long-press): a
     * closed tab is pinned and opened without closing anything (room is made
     * by the opening rule); an open unpinned tab is pinned; an open pinned
     * tab is unpinned and closed (unless it is the last pane).
     * @param {String} id
     * @returns {SvAnchoredTabsLayout}
     * @category Gestures
     */
    pinTab (id) {
        if (!this.isAvailable(id)) {
            return this;
        }
        const wasPinned = this.isPinned(id);
        this.playerPinOverrides().set(id, !(this.isOpen(id) && wasPinned));
        if (!this.isOpen(id)) {
            return this.openByHand(id);
        }
        this.evictionSeqs().delete(id);
        return wasPinned ? this.closeByHand(id) : this;
    }

    /**
     * @description Pins or unpins an open tab without opening or closing
     * anything — the pane's pin control (the pin gesture on an open pinned
     * tab also closes it; a button labeled "pin" should not).
     * @param {String} id
     * @param {Boolean} pinned
     * @returns {SvAnchoredTabsLayout}
     * @category Gestures
     */
    setTabPinned (id, pinned) {
        if (this.isAvailable(id)) {
            this.playerPinOverrides().set(id, pinned);
            this.evictionSeqs().delete(id);
        }
        return this;
    }

    /**
     * @description The divider between two adjacent open panes was dragged:
     * the left pane wants this width. It tracks the pointer, neither side
     * goes below its minimum (paneWidths clamps), and it is remembered for
     * that pair until the set of open panes changes.
     * @param {String} leftId
     * @param {String} rightId
     * @param {Number} leftWidth
     * @returns {SvAnchoredTabsLayout}
     * @category Gestures
     */
    dragDivider (leftId, rightId, leftWidth) {
        this.forgetSplitsIfPaneSetChanged();
        this.dividerSplits().set(leftId, { rightId: rightId, leftWidth: leftWidth });
        this.setDividerSplitsOpenKey(this.openIdsInOrder().join(","));
        return this;
    }

    forgetSplitsIfPaneSetChanged () {
        if (this.dividerSplitsOpenKey() !== this.openIdsInOrder().join(",")) {
            this.dividerSplits().clear();
        }
        return this;
    }

    /**
     * @description The open pane immediately left of this one, or null.
     * @param {String} id
     * @returns {String|null}
     * @category Answers
     */
    leftNeighborOf (id) {
        const open = this.openIdsInOrder();
        const i = open.indexOf(id);
        return i > 0 ? open[i - 1] : null;
    }

    openByHand (id) {
        this.evictionSeqs().delete(id);
        this.openIds().add(id);
        this.setCurrentTabId(id);
        return this.makeRoom("opening", id);
    }

    closeByHand (id) {
        if (this.openIds().size > 1) {
            this.openIds().delete(id);
            this.evictionSeqs().delete(id);
        }
        return this;
    }

    // --- answers ---

    isAvailable (id) {
        const tab = this.tabWithId(id);
        return !!(tab && tab.isAvailable);
    }

    isOpen (id) {
        return this.openIds().has(id);
    }

    /**
     * @description Pinned: the player's own pin or unpin wins; otherwise the
     * tab's pin preference.
     * @param {String} id
     * @returns {Boolean}
     * @category Answers
     */
    isPinned (id) {
        const override = this.playerPinOverrides().get(id);
        return override !== undefined ? override : this.modelPinnedIds().has(id);
    }

    isEvicted (id) {
        return this.evictionSeqs().has(id);
    }

    /**
     * @description The open tabs' ids in tab (subnode) order.
     * @returns {Array<String>}
     * @category Answers
     */
    openIdsInOrder () {
        return this.tabSpecs().filter(t => this.openIds().has(t.id)).map(t => t.id);
    }

    /**
     * @description Each open pane's width: the container (less dividers)
     * shared in proportion to comfortable widths, never below a pane's
     * minimum. Whole pixels; the last pane takes the rounding remainder. A
     * lone pane takes the whole container, even when that is below its
     * minimum (a phone narrower than the tab's comfortable width).
     * @returns {Map<String, Number>}
     * @category Answers
     */
    paneWidths () {
        const ids = this.openIdsInOrder();
        const room = this.containerWidth() - this.dividerWidth() * Math.max(0, ids.length - 1);
        if (ids.length === 1) {
            return new Map([[ids[0], Math.max(0, room)]]); // a lone pane takes the container, even below its minimum (a phone)
        }
        const exact = this.withDividerSplits(this.proportionalWidths(ids, room));
        const widths = new Map(ids.map(id => [id, Math.floor(exact.get(id))]));
        const used = ids.reduce((sum, id) => sum + widths.get(id), 0);
        if (ids.length > 0 && used < room) {
            widths.set(ids.last(), widths.get(ids.last()) + (room - used));
        }
        return widths;
    }

    /**
     * @description Exact (fractional) widths: shares in proportion to
     * comfortable width, with any pane whose share falls below its minimum
     * pinned at the minimum and the rest re-shared, until none falls below.
     * @param {Array<String>} ids
     * @param {Number} room - the container less dividers
     * @returns {Map<String, Number>}
     * @category Answers
     */
    proportionalWidths (ids, room) {
        const atMinimum = new Map();
        for (;;) {
            const shares = this.sharesOf(ids.filter(id => !atMinimum.has(id)), room - this.sumOf(atMinimum));
            const short = [...shares.entries()].filter(([id, w]) => w < this.tabWithId(id).minWidth);
            if (short.length === 0) {
                return new Map(ids.map(id => [id, atMinimum.has(id) ? atMinimum.get(id) : shares.get(id)]));
            }
            short.forEach(([id]) => atMinimum.set(id, this.tabWithId(id).minWidth));
        }
    }

    /**
     * @description Applies dragged dividers to the proportional widths: each
     * dragged pair keeps its combined width, split where it was dragged,
     * neither side below its minimum. Forgotten once the open set changes.
     * @param {Map<String, Number>} widths
     * @returns {Map<String, Number>}
     * @category Answers
     */
    withDividerSplits (widths) {
        this.forgetSplitsIfPaneSetChanged();
        this.dividerSplits().forEach((split, leftId) => {
            if (!widths.has(leftId) || !widths.has(split.rightId)) {
                return;
            }
            const pair = widths.get(leftId) + widths.get(split.rightId);
            const minLeft = this.tabWithId(leftId).minWidth;
            const maxLeft = pair - this.tabWithId(split.rightId).minWidth;
            const left = Math.max(minLeft, Math.min(maxLeft, split.leftWidth));
            widths.set(leftId, left);
            widths.set(split.rightId, pair - left);
        });
        return widths;
    }

    sharesOf (ids, room) {
        const weight = ids.reduce((sum, id) => sum + this.tabWithId(id).comfortableWidth, 0);
        return new Map(ids.map(id => [id, weight > 0 ? room * this.tabWithId(id).comfortableWidth / weight : 0]));
    }

    sumOf (widthsMap) {
        return [...widthsMap.values()].reduce((a, b) => a + b, 0);
    }

    // --- the rules ---

    /**
     * @description Re-applies the rules after any input: unavailable tabs
     * close, panes give way until they fit, evicted pins come back while they
     * fit, and one pane stays open.
     * @returns {SvAnchoredTabsLayout}
     * @category Rules
     */
    reconcile () {
        this.closeUnavailable();
        this.makeRoom("narrowing", null);
        this.restoreEvicted();
        this.ensureOnePane();
        return this;
    }

    closeUnavailable () {
        this.openIdsInOrder().filter(id => !this.isAvailable(id)).forEach(id => this.closeForRoom(id));
        [...this.openIds()].filter(id => !this.tabWithId(id)).forEach(id => this.openIds().delete(id));
        return this;
    }

    /**
     * @description Closes panes until the open set fits, in the order the
     * situation calls for ("opening": unpinned leftmost first; "narrowing":
     * unpinned rightmost first; pinned rightmost first either way). The
     * current pane and the one being opened go last / never.
     * @param {String} why - "opening" or "narrowing"
     * @param {String|null} keepId - the tab being opened, never closed here
     * @returns {SvAnchoredTabsLayout}
     * @category Rules
     */
    makeRoom (why, keepId) {
        while (!this.fits(this.openIdsInOrder()) && this.openIds().size > 1) {
            const victim = this.nextToGiveWay(why, keepId);
            if (!victim) {
                break;
            }
            this.closeForRoom(victim);
        }
        return this;
    }

    nextToGiveWay (why, keepId) {
        const candidates = this.openIdsInOrder().filter(id => id !== keepId);
        const holds = (id) => this.isPinned(id) || id === this.currentTabId();
        const unpinned = candidates.filter(id => !holds(id));
        const pinned = candidates.filter(id => this.isPinned(id) && id !== this.currentTabId());
        if (unpinned.length > 0) {
            return why === "opening" ? unpinned.first() : unpinned.last();
        }
        if (pinned.length > 0) {
            return pinned.last();
        }
        return candidates.find(id => id === this.currentTabId()) || null;
    }

    closeForRoom (id) {
        if (this.isPinned(id)) {
            this.recordEviction(id);
        }
        this.openIds().delete(id);
        return this;
    }

    recordEviction (id) {
        this.setEvictionCounter(this.evictionCounter() + 1);
        this.evictionSeqs().set(id, this.evictionCounter());
        return this;
    }

    restoreEvicted () {
        let next = this.mostRecentlyEvictedAvailable();
        while (next && this.fitsWith(next)) {
            this.evictionSeqs().delete(next);
            this.openIds().add(next);
            next = this.mostRecentlyEvictedAvailable();
        }
        return this;
    }

    mostRecentlyEvictedAvailable () {
        const waiting = [...this.evictionSeqs().entries()].filter(([id]) => this.isAvailable(id) && !this.isOpen(id));
        waiting.sort((a, b) => b[1] - a[1]);
        return waiting.length > 0 ? waiting[0][0] : null;
    }

    ensureOnePane () {
        if (this.openIds().size > 0) {
            return this;
        }
        const available = this.tabSpecs().filter(t => t.isAvailable);
        const first = available.find(t => this.isPinned(t.id)) || available.first();
        if (first) {
            this.evictionSeqs().delete(first.id);
            this.openIds().add(first.id);
        }
        return this;
    }

    // --- widths ---

    tabWithId (id) {
        return this.tabSpecs().find(t => t.id === id) || null;
    }

    requiredWidth (ids) {
        const minimums = ids.reduce((sum, id) => sum + (this.tabWithId(id) ? this.tabWithId(id).minWidth : 0), 0);
        return minimums + this.dividerWidth() * Math.max(0, ids.length - 1);
    }

    fits (ids) {
        return this.requiredWidth(ids) <= this.containerWidth();
    }

    fitsWith (id) {
        return this.fits(this.openIdsInOrder().concat(this.isOpen(id) ? [] : [id]));
    }

}.initThisClass());

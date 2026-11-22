"use strict";

/**
 * @module library.node.node_views.browser.stack
 */

/**
 * @class SvLayerAllocation
 * @extends ProtoClass
 * @classdesc Which columns of one browser's chain are shown, and which width
 * rule each takes, with no DOM and no views (Plans/Compaction Coordinator,
 * part C). Each level of the chain states a claim, a small record of plain
 * values; this is given the claims in order and two widths, and answers for
 * each level. The line it keeps: a view knows what it needs, this decides who
 * gets what. It sees numbers and never asks where they came from.
 *
 * A claim: {
 *   axis,                 "horizontal" (a column beside its detail) or
 *                         "vertical" (a level laid out downward)
 *   targetWidth,          the width the column asks for, BEFORE the cap at
 *                         the fitting width (not a number: asks for none)
 *   fills,                the column takes whatever width is left
 *   fillsWhenShown,       the column takes whatever width is left while it
 *                         is shown, and is hidden like any other (an inline
 *                         document)
 *   companionReservation, the width its side companion holds, as the
 *                         companion worked it out for this pass (0 for none)
 *   anchoredReservation,  the width its anchored panes hold (0 for none)
 *   anchoredWantsRootWidth  the anchored level holds the whole root width
 * }
 *
 * An answer: {
 *   isHidden,     the column is hidden to make room
 *   widthRule,    "fill" (flex into the leftover width), "full" (all the
 *                 room it has), "target" (exactly its target), or "none"
 *                 (a vertical level: its width is not this function's)
 *   targetWidth,  the column's target after the cap
 *   fitWidth      the fitting width of the pass (a column holds its own
 *                 minimum to it)
 *   trailingWidth the width everything after this column asks for, for
 *                 a column that fills before the end of its chain (its own
 *                 companion's reservation and the levels after it); null
 *                 for any other
 *   trailingFlexes whether what follows such a column takes a share of the
 *                 width left over (something after it fills, or is laid
 *                 out downward) or is exactly trailingWidth
 * }
 *
 * The rules (each is a line in tests/headless/TestLayerAllocation.js):
 * - A target is capped at the fitting width less one pixel. A capped target
 *   of zero or less, or no target, is the default target width.
 * - A level's sum is itself and every level after it: the targets of the
 *   horizontal levels, the companion reservations and the anchored
 *   reservations. A vertical level adds no target, but its reservations
 *   count, in its own sum and in every earlier level's.
 * - A horizontal column that does not fill is shown when its sum is less
 *   than the fitting width, and hidden when equal or more. A fill column is
 *   always shown. A vertical level is never hidden.
 * - A shown or hidden column's width rule does not depend on the others: a
 *   fill column fills; a column whose target is at least the fitting width,
 *   or the last level with less than twice its target to fit in, takes all
 *   the room; any other is exactly its target.
 * - Columns give way from the root end: the earliest levels have the
 *   largest sums.
 * - A column that fills when shown (an inline document) is hidden or shown
 *   by the same test as any other, with its target as its least. Shown,
 *   it fills. With only plain columns after it (horizontal, not filling)
 *   they are exactly their targets, the last one too, and it has the rest.
 *   With something after it that takes what it is given (a column that
 *   fills, another document, a level laid out downward), the width left
 *   over is shared evenly between the column and what follows it.
 *
 * The two widths differ only while a root has no width yet (an embedded
 * browser before its container is laid out): the root width is as reported
 * (0 then), the fitting width falls back to the window's.
 */
(class SvLayerAllocation extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("rootWidth", 0); // the root's width as reported; 0 when it has none yet
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("fitWidth", 0); // the width the columns must fit in
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("defaultTargetWidth", 270); // for a column that asks for no width
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("claims", null); // Array of claims, root first
            slot.setSlotType("Array");
        }
    }

    init () {
        super.init();
        this.setClaims([]);
        return this;
    }

    // --- one level's numbers ---

    /**
     * @description A claim's target width after the cap at the fitting width
     * less one pixel. That pixel keeps a lone column from being hidden by
     * the equality in the shown test. No target, or a cap of zero or less,
     * gives the default.
     * @param {Object} claim
     * @returns {Number}
     * @category Allocation
     */
    cappedTargetOf (claim) {
        const capped = Math.min(claim.targetWidth, this.fitWidth() - 1);
        return capped ? capped : this.defaultTargetWidth(); // NaN and 0 are "no answer"
    }

    /**
     * @description The width a level's anchored panes hold in this pass.
     * @param {Object} claim
     * @returns {Number}
     * @category Allocation
     */
    anchoredReservationOf (claim) {
        if (claim.anchoredWantsRootWidth) {
            return this.rootWidth() || 0;
        }
        return claim.anchoredReservation || 0;
    }

    /**
     * @description What one level adds to a sum: its target if it is a
     * column, and whatever it reserves.
     * @param {Object} claim
     * @returns {Number}
     * @category Allocation
     */
    weightOf (claim) {
        const target = claim.axis === "horizontal" ? this.cappedTargetOf(claim) : 0;
        return target + (claim.companionReservation || 0) + this.anchoredReservationOf(claim);
    }

    /**
     * @description A level's sum: itself and every level after it.
     * @param {Number} index
     * @returns {Number}
     * @category Allocation
     */
    sumFrom (index) {
        return this.claims().slice(index).reduce((sum, claim) => sum + this.weightOf(claim), 0);
    }

    // --- answers ---

    /**
     * @description Whether the level at an index is hidden to make room.
     * @param {Number} index
     * @returns {Boolean}
     * @category Allocation
     */
    isHiddenAt (index) {
        const claim = this.claims()[index];
        if (claim.axis !== "horizontal" || claim.fills) {
            return false;
        }
        return !(this.sumFrom(index) < this.fitWidth());
    }

    /**
     * @description The width rule of the level at an index.
     * @param {Number} index
     * @returns {String} "fill", "full", "target" or "none"
     * @category Allocation
     */
    widthRuleAt (index) {
        const claim = this.claims()[index];
        if (claim.axis !== "horizontal") {
            return "none";
        }
        if (claim.fills) {
            return "fill";
        }
        if (this.fillsBeforeTheEndAt(index)) {
            return "fill";
        }
        const target = this.cappedTargetOf(claim);
        const isLast = index === this.claims().length - 1;
        const takesTheSlack = isLast && !this.hasFillBefore(index) && this.fitWidth() < target * 2;
        if (target >= this.fitWidth() || takesTheSlack) {
            return "full";
        }
        return "target";
    }

    /**
     * @description Whether a claim is a column of a fixed width: horizontal
     * and not filling in either way.
     * @param {Object} claim
     * @returns {Boolean}
     * @category Allocation
     */
    isPlainColumn (claim) {
        return claim.axis === "horizontal" && !claim.fills && !claim.fillsWhenShown;
    }

    /**
     * @description Whether the level at an index fills with levels after
     * it: it fills when shown, and it is shown.
     * @param {Number} index
     * @returns {Boolean}
     * @category Allocation
     */
    fillsBeforeTheEndAt (index) {
        const claim = this.claims()[index];
        const isLast = index === this.claims().length - 1;
        if (!claim.fillsWhenShown || claim.fills || claim.axis !== "horizontal" || isLast) {
            return false;
        }
        return !this.isHiddenAt(index);
    }

    /**
     * @description Whether what follows a column that fills before the end
     * takes a share of the width left over: something after it is not a
     * plain column.
     * @param {Number} index
     * @returns {Boolean}
     * @category Allocation
     */
    trailingFlexesAt (index) {
        return this.fillsBeforeTheEndAt(index) && !this.claims().slice(index + 1).every((c) => this.isPlainColumn(c));
    }

    hasFillBefore (index) {
        return this.claims().some((claim, i) => i < index && this.fillsBeforeTheEndAt(i));
    }

    /**
     * @description The width everything after a column asks for, when that
     * column fills before the end: its own companion's reservation and the
     * sum of the levels after it. null for any other level.
     * @param {Number} index
     * @returns {Number|null}
     * @category Allocation
     */
    trailingWidthAt (index) {
        if (!this.fillsBeforeTheEndAt(index)) {
            return null;
        }
        return (this.claims()[index].companionReservation || 0) + this.sumFrom(index + 1);
    }

    /**
     * @description The answer for the level at an index.
     * @param {Number} index
     * @returns {Object} { isHidden, widthRule, targetWidth, fitWidth, trailingWidth, trailingFlexes }
     * @category Allocation
     */
    answerAt (index) {
        return {
            isHidden: this.isHiddenAt(index),
            widthRule: this.widthRuleAt(index),
            targetWidth: this.cappedTargetOf(this.claims()[index]),
            fitWidth: this.fitWidth(),
            trailingWidth: this.trailingWidthAt(index),
            trailingFlexes: this.trailingFlexesAt(index)
        };
    }

    /**
     * @description The answers for every level, root first.
     * @returns {Array<Object>}
     * @category Allocation
     */
    answers () {
        return this.claims().map((claim, index) => this.answerAt(index));
    }

}.initThisClass());

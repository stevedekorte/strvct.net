"use strict";

/*
    @class SvMeterNode
    @extends SvSummaryNode
    @classdesc A labeled value/max meter — renders as a titled tile with a
    thin horizontal bar (SvMeterNodeTile) filled to value/maxValue, and its
    numbers beside it.

    Generic by design: label (title) + numbers only. Owners either push
    values into it (setValue/setMaxValue from their own observation) or
    subclass to compute. The view contract is duck-typed: any node
    implementing fillFraction() (and, for the numbers, meterLabel()) renders
    as a meter.

    Transient view-model — never stored or synced; owners recompute it
    from live state.
*/

(class SvMeterNode extends SvSummaryNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("value", 0);
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }
        {
            const slot = this.newSlot("maxValue", 1);
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanEditTitle(false);
        this.setNoteIsSubnodeCount(false);
    }

    /**
     * @description The meter's numbers, shown beside its bar: "23 / 35".
     * @returns {String}
     * @category Meter
     */
    meterLabel () {
        return this.value() + " / " + this.maxValue();
    }

    /**
     * @description Fill fraction, clamped to [0, 1]. Zero max → 0.
     * @returns {Number}
     * @category Meter
     */
    fillFraction () {
        const max = this.maxValue();
        if (!max || max <= 0) {
            return 0;
        }
        return Math.max(0, Math.min(1, this.value() / max));
    }

}.initThisClass());

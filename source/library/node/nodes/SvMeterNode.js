"use strict";

/*
    @class SvMeterNode
    @extends SvSummaryNode
    @classdesc A labeled value/max meter — renders as a titled tile with a
    filled horizontal bar (SvMeterNodeTile) whose fill fraction is
    value/maxValue and whose color follows the fraction (green → amber → red).

    Generic by design: label (title) + numbers only. Owners either push
    values into it (setValue/setMaxValue from their own observation) or
    subclass to compute. The view contract is duck-typed: any node
    implementing fillFraction() and fillColor() renders as a meter.

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

    subtitle () {
        return this.value() + "/" + this.maxValue();
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

    /**
     * @description Bar color for the current fraction: healthy green above
     * 50%, warning amber from 20-50%, alarm red below 20%. Muted tones for
     * the dark theme.
     * @returns {String}
     * @category Meter
     */
    fillColor () {
        const f = this.fillFraction();
        if (f > 0.5) {
            return "#5a9e6f"; // muted green
        }
        if (f > 0.2) {
            return "#c2a14d"; // muted amber
        }
        return "#c05b5b"; // muted red
    }

}.initThisClass());

"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/**
 * @class SvSliderFieldTile
 * @extends SvFieldTile
 * @classdesc The tile for an SvSliderField: its key, then a slider
 * (SvRangeView) across the tile. Moving it writes the value to the node as
 * it moves.
 */
(class SvSliderFieldTile extends SvFieldTile {

    createValueView () {
        return SvRangeView.clone();
    }

    syncValueFromNode () {
        const node = this.node();
        const range = this.valueView();
        if (node && node.minValue) {
            range.setMinValue(node.minValue());
            range.setMaxValue(node.maxValue());
            range.setStepValue(node.stepValue());
        }
        return super.syncValueFromNode();
    }

}.initThisClass());

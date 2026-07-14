"use strict";

/*
    @class SvMeterNodeTile
    @extends SvTitledTile
    @classdesc Tile for SvMeterNode: title + "value/max" subtitle from the
    base tile, plus a filled horizontal bar under them whose width is the
    node's fillFraction and whose color follows it (green → amber → red).
    Resolved from the node by the standard <Type>Tile naming convention.
*/

(class SvMeterNodeTile extends SvTitledTile {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("barTrackView", null);
            slot.setSlotType("SvDomView");
        }
        {
            const slot = this.newSlot("barFillView", null);
            slot.setSlotType("SvDomView");
        }
    }

    init () {
        super.init();

        // The bar sits under the title/subtitle column (topContentArea lays
        // out its children vertically).
        const track = SvDomView.clone();
        track.setDisplay("block");
        track.setWidth("100%");
        track.setHeight("6px");
        track.setBorderRadius("3px");
        track.setBackgroundColor("rgba(255, 255, 255, 0.12)");
        track.setMarginTop("0.4em");
        track.setOverflow("hidden");

        const fill = SvDomView.clone();
        fill.setDisplay("block");
        fill.setHeight("100%");
        fill.setBorderRadius("3px");
        fill.setWidth("0%");
        // width changes animate so damage/healing reads as movement
        fill.setTransition("width 0.35s ease-out, background-color 0.35s ease-out");
        track.addSubview(fill);

        this.topContentArea().addSubview(track);
        this.setBarTrackView(track);
        this.setBarFillView(fill);
        return this;
    }

    updateSubviews () {
        super.updateSubviews();
        const node = this.node();
        const fill = this.barFillView();
        if (node && fill && node.fillFraction) {
            fill.setWidth((node.fillFraction() * 100).toFixed(1) + "%");
            fill.setBackgroundColor(node.fillColor());
        }
        return this;
    }

}.initThisClass());

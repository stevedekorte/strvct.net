"use strict";

/*
    @class SvMeterNodeTile
    @extends SvTitledTile
    @classdesc A titled tile with a meter under its title and subtitle: a
    thin bar filled to the node's fillFraction (a notch marks its half), and
    beside it the node's meterLabel ("23 / 35"), when it has one. The view
    contract is duck-typed: any node implementing fillFraction() renders as
    a meter. The look is the theme's (--sv-meter-*); the tile sets only the
    fill's width.
    Resolved from the node by the standard <Type>Tile naming convention.
*/

(class SvMeterNodeTile extends SvTitledTile {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("barFillView", null);
            slot.setSlotType("SvDomView");
        }
        {
            const slot = this.newSlot("meterLabelView", null);
            slot.setSlotType("SvDomView");
        }
    }

    init () {
        super.init();

        // The meter sits under the title/subtitle column (topContentArea lays
        // out its children vertically): the bar, then its numbers.
        const meter = SvDomView.clone().setElementClassName("SvMeterView");
        const bar = meter.addSubview(SvDomView.clone().setElementClassName("SvMeterBarView"));
        bar.setAttribute("aria-hidden", "true"); // decoration: the numbers beside it are the value
        this.setBarFillView(bar.addSubview(SvDomView.clone().setElementClassName("SvMeterFillView")));
        this.setMeterLabelView(meter.addSubview(SvDomView.clone().setElementClassName("SvMeterLabelView")));
        this.topContentArea().addSubview(meter);
        return this;
    }

    updateSubviews () {
        super.updateSubviews();
        const node = this.node();
        const fill = this.barFillView();
        if (node && fill && node.fillFraction) {
            fill.setWidth((node.fillFraction() * 100).toFixed(1) + "%");
            const label = node.meterLabel ? node.meterLabel() : null;
            this.meterLabelView().setString(label || "");
            this.meterLabelView().setIsDisplayHidden(!label);
        }
        return this;
    }

}.initThisClass());

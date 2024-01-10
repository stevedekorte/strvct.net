"use strict";

/*

    BMTextAreaFieldTile

    
*/

(class BMTextAreaFieldTile extends BMFieldTile {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("valueButton", null);
        }
    }

    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");

        this.setupValueViewButton();
        return this
    }

    createValueView () {
        /* old css:
        .BMTextAreaFieldValueView {
            display: flex;
            position: relative;
            padding: 0;
            margin: 0;
            width: auto;
            min-height: auto;

            word-break: break-all;
            unicode-bidi: embed;
            white-space: pre-wrap;

            font-weight: normal;
            text-align: left;
        }
        */

        const v = TextField.clone().setElementClassName("BMTextAreaFieldValueView");
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setOverflowY("scroll");
        //v.setFontFamily("Mono");
        //v.setDoesHoldFocusOnReturn(true);
        v.setDoesInput(false);
        v.setIsMultiline(true);
        return v;
    }

    setupValueViewButton () {
        this.valueViewContainer().setGap("1em");

        //const v = ButtonView.clone().setTitle("STT").setHasOutline(true);
        const bv = ButtonView.clone().setElementClassName("BMActionFieldView");
        bv.setBorderRadius("0.4em");
        //bv.setTitle("x");
        bv.setMaxHeight("2.1em");
        bv.setHeight("2.1em");
        bv.setMinHeight(null);
        bv.setWidth("2.3em");
	    bv.setTarget(this).setAction("onClickValueButton");
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");
        bv.setPadding("0px");
        bv.setMarginTop("1px");
        //bv.setDisplay("none");
        bv.setIconName("Mic Off");
        bv.titleView().setIsDisplayHidden(true);

        this.setValueButton(bv);
        //this.valueViewContainer().addSubview(bv);
    }

    onClickValueButton () {
        const node = this.node();
        if (node && node.onClickValueButton) {
            node.onClickValueButton();
        }
    }
    
    syncValueFromNode () {
        super.syncValueFromNode();
        const node = this.node();
        if (node) {
            if (node.hasValueButton) {
                const show = node.hasValueButton && node.hasValueButton();
                //const shouldDisplay = show ? "block" : "none";
                //this.valueButton().setDisplay(shouldDisplay);
                //this.valueButton().setDisplay("block");
                this.valueButton().setParentViewIfTrue(this.valueViewContainer(), show);
                if (node.valueButtonIconName) {
                    const name = node.valueButtonIconName();
                    this.valueButton().setIconName(name);
                }
            }
        }
    }

    /*
    setParentViewIfTrue (parentView, aBool) {
        if (aBool) {
            this.addToParentViewIfNeeded(parentView);
        } else {
            this.removeFromParentView();
        }
        return this;
    }

    addToParentViewIfNeeded (parentView) {
        if (this.parentView() !== parentView) {
            parentView.addSubview(this);
        }
        return this;
    }
    */

    /*
    updateSubviews () {   
        super.updateSubviews()
        return this
    }
    */

    /*
	
    fillBottomOfColumnIfAvailable () {
        if (this.column().tiles().last() === this) {
            //this.debugLog(" update height")
            this.setMinAndMaxHeightPercentage(100)
            this.setFlexGrow(100)
            this.setBorderBottom("0em")

            this.valueView().setHeight("100%")
        } else {
            this.setFlexGrow(1)
            this.setBorderBottom("1px solid rgba(125, 125, 125, 0.5)")
        }
        return this
    }
    */
    
}.initThisClass());

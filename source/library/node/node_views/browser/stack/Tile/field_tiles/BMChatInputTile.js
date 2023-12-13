"use strict";

/*

    BMChatInputTile

    
*/

(class BMChatInputTile extends BMTextAreaFieldTile {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.keyView().hideDisplay()
        this.setValueUneditableBorder("none")
        this.setValueEditableBorder("none")
        //this.setWidth("-webkit-fill-available")
        return this
    }

    createValueView () {
     //   debugger;

        const v = TextField.clone().setElementClassName("BMChatInputTileValueView");
        v.setIsMergeable(true);
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0em")
        v.setOverflowX("hidden")
        v.setOverflowY("scroll")
        v.setBackgroundColor("rgba(255, 255, 255, 0.05)")
        v.setBorder("1px solid rgba(255, 255, 255, 0.02)")
        v.setBorderRadius("0.4em")
        v.setPaddingTop("0.4em")
        v.setPaddingLeft("0.4em")
        v.setPaddingRight("0.4em")
        v.setPaddingBottom("0.4em")
        v.setAllowsHtml(true)
        
        v.setIsMultiline(true)
        v.setDoesInput(true)
        
        // hack to disable theme application
        v.setPaddingTop = () => { return this }
        v.setPaddingLeft = () => { return this }
        v.setPaddingRight = () => { return this }
        v.setPaddingBottom = () => { return this }
        
        v.setBackgroundColor = () => { return this }
        v.setBorder = () => {
            //debugger;
            return this
        }
        v.syncBorder = () => {
            // avoiding changing border
            return this
        }
        
       /*
        v.setValueEditableBorder("1px solid white")
        v.setValueUneditableBorder("1px solid white")
        */
        //v.setFontFamily("Mono")
        v.setDoesHoldFocusOnReturn(true)
        v.setDoesInput(true)
        v.setDoesClearOnReturn(true)
        return v
    }

    /*
    setWidth (w) {
        debugger;
        super.setWidth(w)
        return this
    }
    */

    onUpdatedNode (aNote) {
        //debugger
        return super.onUpdatedNode(aNote)
    }

    syncFromNode () {
        const node = this.node();
        if (node) {
            if (node.isComplete) {
                if (node.isComplete()) {
                    //this.addDots();
                    this.removeDots();
                } else {
                    this.addDots();
                }
            }
        }

        return super.syncFromNode()
    }

    // Support for animated trailing dots using CSS "after" style and CSS animation.
    // It's toggled using CSS variables "--div-after-display" and "--div-after-animation".
    // See CSS BMChatInputTileValueView class settings.

    addDots () {
        const view = this.valueView(); // this is a TextField
        view.setCssProperty("--div-after-display", "inline-block");
        view.setCssProperty("--div-after-animation", "dotty steps(1,end) 1s infinite");
        return this;
    }

    removeDots () {
        const view = this.valueView();
        view.setCssProperty("--div-after-display", "none");
        view.setCssProperty("--div-after-animation", "none");
        return this;
    }

    /*
    centerDotsHtml () {
        return `<span class="dots"><span class="dot dot3">.</span><span class="dot dot2">.</span><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
    }
    */
    
}.initThisClass());

"use strict";

/*
    
    HeaderRowView
    
*/

(class HeaderRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("path", null)
        this.newSlot("textView", null)
    }

    init () {
        super.init()
        this.setPaddingLeft("1.5em") // BrowserTitledRow.titleLeftPadding()
        this.setWidth("100%")
       // this.updateSubviews()
        this.setIsSelectable(true)
        //this.setBorder("1px dashed rgba(255, 255, 0, .1)")
        return this
    }


    setHeight (v) {
        if (v === "100%") {
            debugger;
        }
        return super.setHeight(v)
    }

}.initThisClass());

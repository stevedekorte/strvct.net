"use strict"

/*

    HeaderFooterView

*/

window.HeaderFooterView = class HeaderFooterView extends NodeView {
    
    initPrototype () {
        this.newSlot("headerClass", null)
        this.newSlot("headerView", null)

        this.newSlot("middleClass", null)
        this.newSlot("middleView", null)

        this.newSlot("footerClass", null)
        this.newSlot("footerView", null)
    }

    init () {
        super.init()
        return this
    } 
    
    setupHeaderMiddleFooterViews () {

        if (this.headerClass()) {
            const v = this.headerClass().clone()
            v.setOrder(0)
            this.setHeaderView(v)
            this.addSubview(v)
        }

        if (this.middleClass()) {
            const v = this.middleClass().clone()
            v.setOrder(1)
            this.setMiddleView(v)
            this.addSubview(v)
        }

        if (this.footerClass()) {
            const v = this.footerClass().clone()
            v.setOrder(2)
            this.setFooterView(v)
            this.addSubview(v)
        }

        return this
    }

    /*
    setHeaderView (aView) {
        if (this.headerView()) {
            this.replaceSubviewwith(this.headerView(), aView)
        } else {
            this.addSubview(aView)
        }

        aView.setOrder(0)
        return this
    }
    */
    
}.initThisClass()

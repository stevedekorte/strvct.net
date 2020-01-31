"use strict"

/*
    DomFlexView


*/

window.DomView = class DomFlexView extends DomView {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setDisplay("flex")
        return this
    }

    canSplit () {
        return this.subviews().length === 0
    }

    addSubviewCount (count) {
        for (let i = 0; i < count; i++) {
            this.newFlexSubview()     
        }
        return this
    }

    newFlexSubview () {
        let v = DomFlexView.clone()
        v.setMinHeight("0px")
        v.setMinWidth("0px")
        const order = this.subviews().length
        v.setOrder(order)
        this.addSubview(v) 
        return v
    }

    makeSubviewsOrdered () {
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(i)
        })
    }

    makeSubviewsReverseOrdered () {
        const count = this.subviews().length
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(count - 1 - i)
        })
    }

    flexSplitIntoRows (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("column")
        this.addSubviewCount(count)
        this.debugBorders()
        return this
    }

    flexSplitIntoColumns (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("row")
        this.addSubviewCount(count)
        this.debugBorders()
        return this
    }

    centerContent () {
        this.setJustifyContent("center")
        this.setAlignItems("center")
        return this
    }

    debugBorders () {
        this.subviews().forEach(sv => sv.setBorder("1px solid rgba(255, 255, 255, 0.2)"))
    }

}.initThisClass()

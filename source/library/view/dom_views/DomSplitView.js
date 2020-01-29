"use strict"

/*
    DomSplitView


*/

window.DomView = class DomSplitView extends DomView {
    
    initPrototype () {
    }

    init () {
        super.init()
        return this
    }

    canSplit () {
        return this.subviews().length === 0
    }

    addSubviewCount (count) {
        for (let i = 0; i < count; i++) {
            let v = DomSplitView.clone()
            v.setMinHeight("0px")
            v.setMinWidth("0px")
            this.addSubview(v)       
        }
    }

    flexSplitIntoRows (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("column")
        this.addSubviewCount(count)
        //this.debugBorders()
        return this
    }

    flexSplitIntoColumns (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("row")
        this.addSubviewCount(count)
        //this.debugBorders()
        return this
    }

    debugBorders () {
        this.subviews().forEach(sv => sv.setBorder("1px solid rgba(255, 255, 255, 0.2)"))
    }

}.initThisClass()

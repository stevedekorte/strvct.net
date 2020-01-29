"use strict"

/*
    DomSplitView


*/

window.DomView = class DomSplitView extends DomView {
    
    initPrototype () {
        this.newSlot("topView", null)
        this.newSlot("bottomView", null)

        this.newSlot("leftView", null)
        this.newSlot("rightView", null)
    }

    init () {
        super.init()
        return this
    }

    isSplit() {
        return this.topView() || this.bottomView() || this.leftView() || this.rightView()
    }

    canSplit () {
        return !this.isSplit() && this.subviews().length === 0
    }

    splitTopBottom () {
        assert(this.canSplit())

        this.setTopView(DomView.clone())
        this.addSubview(this.topView())

        this.setBottomView(DomView.clone())
        this.addSubview(this.bottomView())

        this.debugSplitViews()
        return this
    }

    splitLeftRight () {
        assert(this.canSplit())
        this.setDisplay("flex")

        let lv = DomView.clone()
        this.setLeftView(lv)
        this.addSubview(lv)
        //lv.setFloat("left")
        //lv.setWidthPercentage(50)
        //lv.setWidth("max-content")
        //lv.setHeightPercentage(100)
        //lv.setMinHeight("100%")

        let rv = DomView.clone()
        this.setRightView(rv)
        this.addSubview(rv)
        //rv.setFloat("right")
        //rv.setWidthPercentage(50)
        //rv.setWidth("max-content")
        //rv.setHeightPercentage(100)
        //rv.setMinHeight("100%")

        //this.debugSplitViews()
        return this
    }

    debugSplitViews () {
        this.splitViews().forEach(sv => sv.setBorder("1px solid rgba(255, 255, 255, 0.2)"))
    }

    splitViews () {
        return [this.leftView(), this.rightView(), this.topView(), this.bottomView()].select(v => !Type.isNull(v))
    }

    isSplitLeftRight () {
        return !Type.isNull(this.leftView())
    }

    isSplitTopBottom () {
        return !Type.isNull(this.topView())
    }

}.initThisClass()

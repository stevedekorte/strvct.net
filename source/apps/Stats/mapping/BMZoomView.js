"use strict";

/*
    
    BMZoomView

    Container to allow scroll and zoom (translate and scale?) on subview.

*/

(class BMZoomView extends DomView {
    
    initPrototype () {
        this.newSlot("offsetPos", null)
        this.newSlot("dragStartPos", null)
        this.newSlot("zoomScale", 1)
        //this.newSlot("zoomTransform", null)
    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setOverflow("visible")
        this.setOffsetPos(Point.clone())
        this.setTopPx(null)
        this.setup()
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+ 
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox 
        this.setBackgroundColor("transparent")
        //this.setBorder("1px solid purple")
        //this.setZoomTransform(Transform.clone())

        // events 

        this.listenerNamed("WheelListener").start()

        this.addDefaultTapGesture()

        const pan = this.addDefaultPanGesture()
        pan.setMinDistToBegin(0)

        return this
    }


    setup () {
        this.setWidth("100%")
        this.setHeight("auto")
        this.setOverflowY("scroll") 
        this.setOverflowX("scroll")
        return this
    }

    onDoubleTapComplete (aGesture) {
        //console.log("onDoubleTapComplete")
    }

    onTapBegin (aGesture) {
        console.log("onTapBegin")
    }

    onPanBegin (aGesture) {
        this.setDragStartPos(this.offsetPos().duplicate())
    }

    onPanMove (aGesture) {
        const np = this.dragStartPos().add(this.defaultPanGesture().diffPos()) 
        this.offsetPos().copyFrom(np)
        this.updateTransform()
    }

    onPanEnd (aGesture) {
    }

    onWheel (event) {
        const dy = -event.deltaY
        let z = this.zoomScale()
        z += dy/1000

        if(z < 1) {
            const f = 1 - Math.abs(dy/1000)
            const po = this.offsetPos()
            po.setX(po.x()*f)
            po.setY(po.y()*f)

            const min = 1
            if (Math.abs(po.x()) < min) {
                po.setX(0)
            }
            if (Math.abs(po.y()) < min) {
                po.setY(0)
            }

            z = 1
        }

        this.setZoomScale(z)
        this.updateTransform()
        event.preventDefault()
    }

    updateTransform () {
        const x = this.offsetPos().x()
        const y = this.offsetPos().y()
        let z = this.zoomScale()
        this.contentView().setTransform("translate(" + x + "px, " + y + "px) scale(" + z + ")")

        if (x !== 0 || y !== 0) {
            this.contentView().setBorder("1px dashed rgba(255, 255, 255, 0.3)")
        } else {
            this.contentView().setBorder(null)
        }
    
    }

    contentView () {
        return this.subviews().first()
    }


}.initThisClass())



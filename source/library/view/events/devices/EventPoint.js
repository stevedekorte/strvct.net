"use strict";

/*

    EventPoint

    Class to represent a 2d or 3d point, optionally with a time.

    NOTES

    Event's positions are set to the document (event.pageX, event.pageY) coordinates.
    To get the viewport coordinates (event.clientX, event.clientY), 
    use the viewportPosition() method.

*/

(class EventPoint extends Point {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("state", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Element");
        }
        {
            const slot = this.newSlot("isDown", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("overView", null);
            slot.setSlotType("DomView");
        }
        {
            const slot = this.newSlot("event", null);
            slot.setSlotType("Event");
        }
    }
   
    /*
    init () {
        super.init()
        return this
    }
    */

    copyFrom (p, copyDict) {
        super.copyFrom(p, copyDict)
        this._id = p._id
        this._state = p._state
        this._target = p._target
        return this
    }

    overView () {
        if (this._overView === null) {
            this._overView = this.findOverview()
        }
        return this._overView
    }

    findOverview () {
        debugger;
        // search up the dom elements until we find one 
        // associated with a DomView instance 

        let e = document.elementFromPoint(this.x(), this.y());


        while (e) {
            const view = e.domView()
            if (view) {
                return view
            }
            e = e.parentElement
        }
        return null
    }

    // viewport helpers

    viewportPosition () {
        const e = this.event()
        const p = Point.clone().set(e.clientX, e.clientY)
        return p
    }

    viewportHeight () {
        return window.innerHeight
    }

    viewportWidth () {
        return window.innerWidth
    }

    distFromTopOfViewport () {
        return this.event().clientY
    }

    distFromBottomOfViewport () {
        return this.viewportHeight() - this.distFromTopOfViewport()
    }

    distFromLeftOfViewport () {
        return this.event().clientX
    }

    distFromRightOfViewport () {
        return this.viewportWidth() - this.distFromLeftOfViewport()
    }
    
}.initThisClass());

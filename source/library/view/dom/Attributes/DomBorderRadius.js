
"use strict";

/*

    DomBorderRadius
         

    // this.titleView().setBorderRadius("8px 8px 0px 8px") // top-left, top-right,  bottom-right, bottom-left
    // TODO: em vs px support?

*/


(class DomBorderRadius extends ProtoClass {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("divView", null);
            slot.setSlotType("DomView");
        }
        {
            const slot = this.newSlot("topLeft", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("topRight", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("bottomRight", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("bottomLeft", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("partNames", ["topLeft", "topRight", "bottomRight", "bottomLeft"]);
            slot.setSlotType("Array");
        }
    }

    /*
    init () {
        super.init()
    }
    */

    clear () {
        this.setAll(0)
        return this
    }

    setAll (v) {
        if (!v) {
            v = 0
        }

        this.partSetters().forEach((setter) => {
            this[setter].apply(this, [v])
        })
        return this
    }

    partSetters () {
        return this.partNames().map(k => k.asSetter())
    }

    partValues () {
        return this.partNames().map(k => this[k].apply(this))
    }

    asString (aString) {
        return this.partValues().map(v => v + "px").join(" ")
    }

    setFromString (aString) {
        const parts = aString.split(" ").select(part => part !== "")

        this.clear()

        if (parts.length === 1) {
            this.setAll(Number(parts[0]))
        }

        let v;

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setTopLeft(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setTopRight(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setBottomRight(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setBottomLeft(Number(v))
        }

        return this
    }

    syncToDomView () {
        this.divView().setBorderRadius(this.asString())
        return this
    }

    syncFromDomView () {
        const s = this.divView().borderRadius()

        if (s) {
            this.setFromString(s)
        } else {
            this.clear()
        }

        return this
    }
}.initThisClass());


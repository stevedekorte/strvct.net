
"use strict";

/*

    DivTransform
    
*/

(class Transform extends ProtoClass {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("position", null);
            slot.setComment("in px units");
            slot.setSlotType("Point");
        }
        {
            const slot = this.newSlot("rotation", null);
            slot.setComment("in degrees units");
            slot.setSlotType("Point");
        }
        {
            const slot = this.newSlot("scale", null);
            slot.setSlotType("Point");
        }
    }

    init () {
        super.init();
        this.setPosition(Point.clone());
        this.setRotation(Point.clone());
        this.setScale(Point.clone().setX(1).setY(1).setZ(1));
        return this;
    }

    // css

    cssString () {
        // NOTE: multiple transform one line directives are applied from right to left
        const s = 
          this.scale().asCssScale3dString() + " " 
        + this.position().asCssTranslate3dString() + " " 
        + this.rotation().asCssRotate3dDegreesString(); // is this the expected order?
        return s
    }

    // operations

    copy () {
        const t = Transform.clone()
        t.position().copy(this.position())
        t.rotation().copy(this.rotation())
        t.scale().copy(this.scale())
        return t
    }


    addInPlace (otherTransform) {
        this.position().addInPlace(otherTransform.position())
        this.rotation().addInPlace(otherTransform.rotation())
        this.scale().addInPlace(otherTransform.scale())
        return this
    }

    /*
    add (aTransform) {
        const t = this.copy()
        t.position().addInPlace(aTransform.position())
        t.rotation().addInPlace(aTransform.rotation())
        t.scale().addInPlace(aTransform.scale())
        return t
    }


    subtract (aTransform) {
        const t = this.copy()
        t.position().subtractInPlace(aTransform.position())
        t.rotation().subtractInPlace(aTransform.rotation())
        t.scale().subtractInPlace(aTransform.scale())
        return t
    }
    */
   
}.initThisClass());
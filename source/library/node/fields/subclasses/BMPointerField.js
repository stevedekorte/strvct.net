"use strict";

/*

    BMPointerField

    A field that's a pointer to another node.
    (sometimes the other node is used as a list of items, but not always)

*/
        
(class BMPointerField extends BMField {
    
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("fieldSlotName", null)
            slot.setCanInspect(true)
            slot.setInspectorPath("Node/Field/Pointer")
        }
        */
    }

    init () {
        super.init()
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        this.setKeyIsVisible(true)
        this.setValueIsVisible(true)
        this.setNodeTileIsSelectable(true)
    }

    /*
    setValue (v) {
        console.warn("WARNING: BMPointerField setValue '" + v + "'")
        return this
    }
    */

    proxyGetter(methodName, defaultReturnValue = "") {
        const v = this.value()
        return v ? v[methodName].apply(v) : defaultReturnValue
    }

    title () {
        const title = this.proxyGetter("title")
        return title
        //return title ? title : this.fieldSlotName()
    }
	
    subtitle () {
        return this.proxyGetter("subtitle")
    }
	
    note () {
        return this.proxyGetter("note")
    }
	
    nodeTileLink () {
        return this.value()
    }

    jsonArchive () {
        if (this.value() && this.value().jsonArchive) {
            return this.value().jsonArchive()
        }
        return undefined;
    }

}.initThisClass());

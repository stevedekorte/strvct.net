"use strict";

/*

    BMJsonField


*/
        
(class BMJsonField extends BMField {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("nodeTileLink", null);
        }
    }

    initPrototype () {
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        this.setKeyIsVisible(true)
        this.setValueIsVisible(true)
        this.setNodeTileIsSelectable(true)
    }

    setValue (v) {
        console.warn("WARNING: BMJsonField setValue '" + v + "'")
        const node = BMJsonNode.nodeForJson(v)
        this.setNodeTileLink(node)
        return this
    }

    value () {
        const node = this.nodeTileLink()
        if (node) {
            return node.jsonArchive()
        }
        return undefined
    }

    proxyGetter(methodName, defaultReturnValue = "") {
        const v = this.value()
        return v ? v[methodName].apply(v) : defaultReturnValue
    }

    title () {
        return this.proxyGetter("title")
    }
	
    subtitle () {
        return this.proxyGetter("subtitle")
    }
	
    note () {
        return this.proxyGetter("note")
    }

}.initThisClass());


"use strict";

/*

    BMApplet

*/

(class BMApplet extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setShouldStore(true)
        return this
    } 

    sharedStoredInstance () {
        return this.defaultStore().rootSubnodeWithTitleForProto(this.type(), this)
    }

    handleAppMsg (aMessage) {
        // override
    }
	
    allIdentitiesMap () { // only uses valid remote identities
        return new Map()
    }

}.initThisClass());


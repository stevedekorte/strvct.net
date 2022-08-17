"use strict";

/*

    BMBuys

*/

(class BMBuys extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setTitle("Buys")
        this.setActions(["add"])
        this.setSubnodeProto(BMBuy)
        this.setSubtitleIsSubnodeCount(true)
    }

}.initThisClass());

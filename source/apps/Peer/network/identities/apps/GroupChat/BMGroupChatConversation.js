"use strict";

/*

    BMGroupConversation

*/

(class BMGroupConversation extends BMApplet {
    
    initPrototypeSlots () {
        this.newSlot("remoteIdentity", null)
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    title () {
        this.remoteIdentity().title()
    }

    messages () {
        return this.subnodes()
    }

}.initThisClass());


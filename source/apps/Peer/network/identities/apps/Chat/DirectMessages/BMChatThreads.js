"use strict";

/*

    BMChatThreads

*/

(class BMChatThreads extends BMContactLinks {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setLinkProto(BMChatThread)
    }

    didInit () {
        super.didInit()
        this.setTitle("direct messages")
    }
	
    shelfIconName () {
        return "chat/direct_messages"
	    //return "mail-white"
    }
    
}.initThisClass());
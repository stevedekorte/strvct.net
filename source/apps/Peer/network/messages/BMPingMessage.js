"use strict";

/*

    BMPingMessage
    
*/

(class BMPingMessage extends BMMessage {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setMsgType("ping")
    }
        
    msgDict () {
        return {
            msgType: this.msgType()
        }
    }

}.initThisClass());

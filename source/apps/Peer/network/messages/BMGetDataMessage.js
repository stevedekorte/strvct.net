"use strict";

/*

    BMGetDataMessage

*/

(class BMGetDataMessage extends BMMessage {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setMsgType("getData")
        this.setData([])
    }
    
    addHash (aHash) {
        this.data().push(aHash)
        return this
    }
        
    msgDict () {
        return {
            msgType: this.msgType(),
            data: this.data()
        }
    }
    
    send () {
        this.remotePeer().sendMsg(this)
        return this
    }

}.initThisClass());

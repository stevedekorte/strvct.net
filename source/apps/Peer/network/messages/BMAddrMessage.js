"use strict";

/*

    BMAddrMessage

*/

(class BMAddrMessage extends BMMessage {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setMsgType("addr")
        this.setData([])
    }
    
    addAddrDict (dict) {
        this.data().push(dict)
        return this
    }
        
    msgDict () {
        return {
            msgType: this.msgType(),
            data: this.data()
        }
    }
    
}.initThisClass());


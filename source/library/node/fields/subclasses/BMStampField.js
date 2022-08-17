"use strict";

/*

    BMStampField

*/

(class BMStampField extends BMField {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        //this.setKeyIsVisible(false)
        //this.setKey("drop images here")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
    }
    
}.initThisClass());

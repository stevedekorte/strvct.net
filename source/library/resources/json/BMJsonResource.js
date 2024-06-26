"use strict";

/*

    BMImage

*/

(class BMJsonResource extends BMResource {
    
    static supportedExtensions () {
        return ["json"];
    }

    initPrototypeSlots () {
    }

    initPrototype () {
    }

    async asyncDecodeData () {
        const value = JSON.parse(this.data().asString());
        this.setValue(value);
        return this;
    }

}.initThisClass());


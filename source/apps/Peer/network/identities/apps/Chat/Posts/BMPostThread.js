"use strict";

/*

    BMPostThread

*/


(class BMPostThread extends BMAppMessage {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.customizeNodeTileStyles().setToBlackOnWhite()
    }
    
    title () {
        return "post"
    }
    
    findThreadItems () {
        const items = []
        items.push(this.postMessage())
        items.appendItems(this.postMessage().replies())
        return items
    }
    
    update () {
        this.copySubnodes(this.findThreadItems()) // merge?
        return this
    }

}.initThisClass());


"use strict";

/* 

    ShelfNode

    A node where dragged in items are always links, 
    but dragging out acts as if the item has come directly from it's source.

    NOTES

    Do we need to monitor the sources in case the items move?

*/

(class ShelfNode extends BMStorableNode {
    
    initPrototype () {
    }

    init () {
        super.init()
        return this
    }
    
        
}.initThisClass());


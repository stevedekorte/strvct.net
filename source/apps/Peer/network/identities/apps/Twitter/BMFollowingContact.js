
"use strict";

/*

    BMFollowingContact

*/

(class BMFollowingContact extends BMStorableNode {
    
    initPrototypeSlots () {
        this.newSlot("isFollowing", false).setShouldStoreSlot(true)
    }

    init () {
        super.init()
    }

    title () {
        return this.remoteIdentity().title()
    }
    
}.initThisClass());


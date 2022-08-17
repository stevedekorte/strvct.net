"use strict";

/*

    BMBlacklistedPeers

    
*/

(class BMBlacklistedPeers extends BMBlacklist {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()	
        this.setShouldStore(true)        
        this.setTitle("peers")
    }
	
}.initThisClass());

"use strict";


/*

    BMBlacklistedServers

    
*/

getGlobalThis().BMBlacklistedServers = class BMBlacklistedServers extends BMBlacklist {
    
    initPrototype () {
        this.newSlot("ipsDict", null).setShouldStoreSlot(true)
    }

    init () {
        super.init()	
        this.setShouldStore(true)        
        this.setTitle("servers")
    }
	
}.initThisClass()

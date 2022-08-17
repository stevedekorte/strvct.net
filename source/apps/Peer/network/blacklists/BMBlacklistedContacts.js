"use strict";

/*

    BMBlacklistedContacts

*/

(class BMBlacklistedContacts extends BMBlacklist {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()		
        this.setShouldStore(true)        
        this.setTitle("contacts")
    }
	
}.initThisClass());

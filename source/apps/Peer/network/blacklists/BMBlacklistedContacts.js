"use strict";

/*

    BMBlacklistedContacts

*/

(class BMBlacklistedContacts extends BMBlacklist {
    
    initPrototype () {

    }

    init () {
        super.init()		
        this.setShouldStore(true)        
        this.setTitle("contacts")
    }
	
}.initThisClass());

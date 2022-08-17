"use strict";

/*

    BMConnection

*/

(class BMConnection extends BaseNode {
    
    initPrototypeSlots () {
        this.newSlot("connection", null)
        this.newSlot("lastConnectionType", null)
        this.newSlot("lastIsOnline", 0)
    }

    init () {
        if (BMConnection._shared) {
            throw new Error("multiple instances of " + this.type() + " singleton")
        }
        super.init()
				
        this.setTitle("Connection")
        
        const con = navigator.connection || navigator.mozConnection || navigator.webkitConnection

        if (!con) {
            console.warn("Looks like this browser (IE or Safari>) doesn't network connection info (e.g. navigator.connection) -but this is only needed to show wifi etc connection state.")
        }

        if (con) {
            this.setConnection(con)
            this.updateLastState()  
            this.registerForConnectionChange()
        }
    }
    
    connectionType () {
        if (this.isAvailable()) {
            const s = this.connection().effectiveType
            if (s) {
                return s.toUpperCase()
            }
        }
        return "?"
    }
    
    downlink () {
        if (this.isAvailable()) {
            return this.connection().downlink
        }
        return null
    }
    
    rtt () {
        if (this.isAvailable()) {
            return this.connection().rtt
        }
        return null
    }
    
    updateLastConnectionType () {
        this.setLastConnectionType(this.connectionType())
        return this
    }

    updateLastState () {
        this.setLastConnectionType(this.connectionType())
        this.setLastIsOnline(this.isOnline())
        return this
    }

    registerForConnectionChange () {
        this.connection().addEventListener("change", () => { this.onNetworkInformationChange() });
        return this
    }
	
    didComeOnline () {
	    return this.lastIsOnline() === false && this.isOnline() === true
    }
	
    didGoOffline () {
	    return this.lastIsOnline() === true && this.isOnline() === false
    }
	
    onNetworkInformationChange () {
        //this.debugLog("Connection type changed from " + this.lastConnectionType() + " to " +  this.connectionType(), this.connection());	  

        this.postNoteNamed("onNetworkInformationChange")

        
        this.updateLastState()            
        this.didUpdateNode()
        
        if (this.didComeOnline()) {
            this.onNetworkOnline()
        }
        
        if (this.didGoOffline()) {
            this.onNetworkOffline()
        }
    }
	
    onNetworkOnline () {
        this.postNoteNamed("onNetworkOnline")
    }
    
    onNetworkOffline () {
        this.postNoteNamed("onNetworkOffline")
    }
	
    isOnline () {
        if (this.isAvailable()) {
            return this.rtt() !== 0
        }
        return false
    }
    
    connectionDescription () {
        if (!this.isAvailable()) {
            return "status unknown"
        }

        if (!this.isOnline()) {
            return "offline"
        }
        
        return this.connectionType() + " " + this.downlink() + "Mbps " + this.rtt() + "ms"
    }
    
    subtitle () {
        return this.connectionType()
        //return this.connectionDescription()
    }

    isAvailable () {
        if (this.connection()) {
            return true
        }
        return false
    }
	
}.initThisClass());

//getGlobalThis().BMConnection.shared() // setup shared instance, needed?


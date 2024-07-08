"use strict";

/*

    BMJsonCachedNode
    

*/
        
(class BMJsonCachedNode extends BMSummaryNode {

    initPrototypeSlots () {

        {
            // the json that this node represents
            // we update this when the node is edited
            // the node is the truth and the json is derived from it
            const slot = this.newSlot("jsonCache", null);
        }

        {
            // a hash of JSON.stableStrigify(jsonCache)
            const slot = this.newSlot("jsonHash", null);
        }
    }

    // --- json cache ---
    
    updateJsonHash () {
        this.setJsonHash(JSON.stableStringify(this.asJson()).hashCode());
        return this;
    }

    setJsonCache (json) {
        this._jsonCache = json;
        if (json === null) {
            this.setJsonHash(null);
        } else {
            this.setJsonHash(JSON.stableStringify(json).hashCode());
        }
        return this;
    }

    removeJsonCaches () {
        this.setJsonHash(null); 
        this.setJsonCache(null);  
        return this;
    }

    didUpdateNode () {
        super.didUpdateNode();
        this.removeJsonCaches(); 
    }

    doesMatchJson (json) {
        const a = JSON.stableStringify(json); 
        if (this.jsonHash()) {
            return this.jsonHash() === a.hashCode();
        }
        const b = JSON.stableStringify(this.asJson());
        return a === b;
    }

    asJson () {
        if (this.jsonCache() !== null) {
            return this.jsonCache();
        }
        const json = this.calcJson();
        this.setJsonCache(json);
        return json;
    }
    
}.initThisClass());

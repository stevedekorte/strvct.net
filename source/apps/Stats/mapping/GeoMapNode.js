"use strict";

/*
    
    GeoMapNode


*/

(class GeoMapNode extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("selectedState", null)
        this.newSlot("valueDelegate", null)
        this.newSlot("place", null)
    }

    init () {
        super.init()
        this.setTitle("map")
        return this
    }

    features () {
        return this.place().features()
    }

    allParentsFeatures () {
        const f = this.place().allParentsFeatures()
        f.appendItems(this.place().parentSubplaceFeatures())
        return f
    }

    valueForFeature (aFeature) {
        if (this.valueDelegate()) {
            return this.valueDelegate().valueForFeature(aFeature)
        }
        return 0
    }

    
}.initThisClass())

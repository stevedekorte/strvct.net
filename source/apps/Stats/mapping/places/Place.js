"use strict"

/*
    
    Place


*/

window.Place = class Place extends BMNode {
    
    initPrototype () {
        //this.newSlot("path", null) 
        this.newSlot("features", null) // geoJsonFeature
        this.newSlot("featureCollection", null) // geoJsonFeature
        this.newSlot("map", null)
        this.newSlot("subplacesNode", null)
    }

    init () {
        super.init()
        
        this.setMap(GeoMapNode.clone().setPlace(this))
        const mapHolder = BMNode.clone().setTitle("map").setNodeMinWidth(960)
        mapHolder.addSubnode(this.map())
        this.addSubnode(mapHolder)
        
        return this
    }

    name () {
        return this.title()
    }

    setName (s) {
        this.setTitle(s)
        return this
    }

    allFeatures () {
        const results = this.features().shallowCopy()
        const sn = this.subplacesNode()
        if (sn) {
            sn.subnodes().forEach(place => results.appendItems(place.features()))
        }
        return results
    }

    parentNodeChain () { // returns array that starts with root node
        const chain = []
        let p = this.parentNode()
        while (p) {
            chain.push(p)
            p = p.parentNode()
        }
        return chain.reversed()
    }

    parentPlace () {
        const parentPlace = this.parentNodeChain().reversed().detect(p => p.thisClass().isSubclassOf(Place))
        return parentPlace
    }

    thisAndParentFeatures () {
        const f = this.features().shallowCopy()
        const p = this.parentPlace()
        if (p) {
            f.appendItems(p.features())
        }
        return f
    }

    allParentsFeatures () {
        const f = []
        let p = this.parentPlace()
        while (p) {
            f.appendItems(p.features())
            p = p.parentPlace()
        }
        return f
    }

    subplacesFeatures () {
        const f = []
        const sub = this.subplacesNode()
        if (sub) {
            sub.subnodes().forEach( sn => f.appendItems(sn.features()) )
        }
        return f
    }

    parentSubplaceFeatures () {
        const p = this.parentPlace()
        if (p) {
            return p.subplacesFeatures()
        }
        return []
    }

    /*
    placeRoot () {
        const p = this.parentNode()
        if (p && p.placeRoot) {
            return p.placeRoot()
        }
        return this
    }

    placePathNodes () {
        const chain = []
        const p = this
        if (p && p.thisClass().isSubclassOf(Place)) {
            chain.push(p)
            p = p.parentNode()
        }
        return chain.reversed().map(p => p.name())
    }
    */
	
}.initThisClass()

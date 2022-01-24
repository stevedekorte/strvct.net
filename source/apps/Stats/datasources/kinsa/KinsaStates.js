"use strict";

/*

    KinsaStates

*/

(class KinsaStates extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setTitle("States")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        this.watchOnceForNote("appDidInit")
        return this
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupSubnodes()
        this.subnodes().forEach(sn => sn.loadIfCached())
        return this
    }

    setupSubnodes () {
        const states = UnitedStates.shared().states()
        states.subnodes().forEach((state) => {
            const kg = KinsaGroup.clone().setTitle(state.name())
            kg.urlResource().setPath("https://static.kinsahealth.com/" + state.abbreviation() +  "_data.json")
            kg.urlResource().setTitle("data")
            kg.mapNode().setPlace(state)
            kg.setNodeMinWidth(960)
            this.addSubnode(kg)
        })
        return this
    }

}.initThisClass())



"use strict"

/*

    Kinsa

*/

window.Kinsa = class Kinsa extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("states", null)
        this.newSlot("countries", null)
    }

    init () {
        super.init()
        this.setTitle("Kinsa")
        this.setNodeMinWidth(170)
        this.setNoteIsSubnodeCount(false)
        //this.setSubnodeClasses([BMUrlResource])
        this.watchOnceForNote("appDidInit")

        {
            const countries = KinsaCountries.clone()
            this.setCountries(countries)
            this.addSubnode(countries)
        }

        {
            const states = KinsaStates.clone()
            this.setStates(states)
            this.addSubnode(states)
        }

        this.addButtonForMethod("load")
        this.addButtonForMethod("refresh")
        this.addButtonForMethod("clear")
        
        return this
    }

    addButtonForMethod (methodName) {
        const button = BMActionNode.clone().setTitle(methodName.capitalized()).setMethodName(methodName).setTarget(this)
        this.addSubnode(button)
        return this
    }

    allGroups () {
        const groups = []
        groups.appendItems(this.countries().subnodes())
        groups.appendItems(this.states().subnodes())
        return groups
    }

    load () {
        this.allGroups().forEach(g => g.load())
    }

    refresh () {
        this.allGroups().forEach(g => g.refresh())
    }

    clear () {
        this.allGroups().forEach(g => g.clear())
    }


}.initThisClass()



"use strict";

/*

    BMClassifieds

*/

(class BMClassifieds extends BMApplet {
    
    initPrototypeSlots () {
        this.newSlot("regions", null)
        this.newSlot("sells", null)
    }

    init () {
        super.init()
        this.setTitle("Classifieds")
        
        this.setRegions(BMRegions.clone())
        this.addSubnode(this.regions())
        
        //this.setSells(this.defaultStore().rootSubnodeWithTitleForProto("BMClassifieds_sells", BMSells)) // move to pid for classifieds
        this.setSells(BMSells.clone()) // move to pid for classifieds
        this.addSubnode(this.sells())
    }

}.initThisClass());


"use strict";

/*
    
    ChartNode


*/

getGlobalThis().ChartNode = class ChartNode extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("valueDelegate", null)
        this.newSlot("data", null).setDoesHookSetter(true)
        this.newSlot("xColumnName", null)
        this.newSlot("yColumnNames", null)
    }

    init () {
        super.init()
        this.setTitle("chart")
        return this
    }
    
}.initThisClass()

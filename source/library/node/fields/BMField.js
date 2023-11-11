"use strict";

/*

    BMField

    A BMStorageNode that has a key, value, and valueMethod (among other properties),
    that's useful for automatically constructing a UI to interact with properties of a parent Node.
    
*/
        

(class BMField extends BMSummaryNode {
    
    initPrototypeSlots () {

        {
            const slot = this.newSlot("isEnabled", true)
            slot.setSyncsToView(true)
        }

        // key
        {
            const slot = this.newSlot("key", "key")
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("key")
            slot.setInspectorPath("Node/Field/Key")
        }

        {
            const slot = this.newSlot("keyIsVisible", true)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("visible")
            slot.setInspectorPath("Node/Field/Key")
        }

        {
            const slot = this.newSlot("keyIsEditable", false)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("editable")
            slot.setInspectorPath("Node/Field/Key")
        }

        // value
        {
            const slot = this.newSlot("value", null)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
        }

        {
            const slot = this.newSlot("valueIsVisible", true)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("visible")
            slot.setInspectorPath("Node/Field/Value")
        }

        {
            const slot = this.newSlot("valueIsEditable", true)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("editable")
            slot.setInspectorPath("Node/Field/Value")
        }

        this.newSlot("link", null)
        this.newSlot("ownsLink", null)

        {
            const slot = this.newSlot("valuePrefix", null)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
        }

        {
            const slot = this.newSlot("valuePostfix", null)
            slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
        }

        {
            const slot = this.newSlot("valueMethod", null)
            slot.setSyncsToView(true)
            slot.setDuplicateOp("duplicate")
        }
        
        {
            const slot = this.newSlot("noteMethod", null)  // fetches note from a parent node method
            slot.setSyncsToView(true)
        }
        
        {
            const slot = this.newSlot("keyError", null)
            slot.setSyncsToView(true)
        }
        
        {
            const slot = this.newSlot("valueError", null)
            slot.setSyncsToView(true)
        }
        
        {
            const slot = this.newSlot("target", null)
            slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("didUpdateNodeObs", null)
        }
    }

    initPrototype () {
        this.setShouldStore(true)
    }

    init () {
        super.init()
        this.setSummaryFormat("key value")
        this.setHasNewlineAferSummary(true)
    }

    didLoadFromStore () { // move to finalInit?
        super.didLoadFromStore()
        this.validate()
    }

    static nodeCreate () {
        const newNode = super.nodeCreate()

        if (newNode.setKeyIsEditable) {
            newNode.setKeyIsEditable(true)
            newNode.setValueIsEditable(true)
        }

        if (newNode.setIsEditable) {
            newNode.setIsEditable(true)
        }

        newNode.setNodeCanInspect(true)
        newNode.setNodeCanEditTitle(true)
        return newNode
    }

    title () {
        return this.key()
    }

    /*
    target () {
        assert(!Type.isNull(this._target)) 

        if (this._target) {
            return this._target
        }
		
        return this.parentNode() // we can't do this because we want to support free floating Fields
    }
    */

    /*
    setKey (newValue) {
        this._key = newValue
        return this
    }
    */

    didUpdateSlotTarget (oldValue, newValue) {
        if (oldValue) {
            const obs = this.didUpdateNodeObs()
            if (obs) {
                obs.stopWatching()
                this.setDidUpdateNodeObs(null)
            }
        }

        if (newValue) {
            //debugger;
            this.setDidUpdateNodeObs(this.watchForNoteFrom("onUpdatedNode", newValue))
            this.scheduleMethod("syncFromTarget")
        } 
    }

    directDidUpdateNode () {
        super.didUpdateNode()
        return this
    }

    /*
    didUpdateTargetNode (aNote) {
        debugger;
    }
    */

    onUpdatedNode (aNote) {
        assert(aNote);
        // if it has a note, it was a post sent through notification center that the target node changed
        const aNode = aNote.sender()
        if (aNode === this.target()) {
            // refresh
            //debugger;
            //console.log(this.type() + " didUpdateNode " + aNode.typeId())
            this.syncFromTarget()
        }
    }

    syncFromTarget () {
        // up to subclasses to implement
        return this
    }

    didUpdateSlotValue (oldValue, newValue) {  // setValue() is called by View on edit
        if (this.target() && this.valueMethod()) {
            this.setValueOnTarget(newValue)
        } else {
            this.validate()
        }

        this.didUpdateNodeIfInitialized()
    }

    setValueOnTarget (v) { // called by View on edit
        //console.log("setValue '" + v + "'")
        const target = this.target()
        const setter = this.setterNameForSlot(this.valueMethod())

        v = this.normalizeThisValue(v)
        
        if (target[setter]) {
            target[setter].apply(target, [v])

            target.didUpdateNode()
            this.validate()
        } else {
            console.warn(this.type() + " target " + target.type() + " missing slot '" + setter + "'")
            debugger;
        }
		
        return this
    }
	
    normalizeThisValue (v) {
	    return v
    }
	
    value () {
        if (this.target()) {
            this._value = this.getValueFromTarget()
        }
        return this._value
    }

    getValueFromTarget () {
        const target = this.target()
        const slotName = this.valueMethod()

        //console.log("target = " + target.type() + " getter = '" + getter + "'")
        if (target[slotName]) {
            const value = target[slotName].apply(target)
            return value
        } else {
            console.warn(this.type() + " target " + target.type() + " missing slot '" + slotName + "'")
        }

        return null
    }
	
    note () {
        const target = this.target()
        const slotName = this.noteMethod()

        if (target && slotName) {
            if (target[slotName]) {
                return target[slotName].apply(target)
            } else {
                console.warn(this.type() + " target " + target.type() + " missing note getter slot '" + slotName + "'")
            }
        }
        return null
    }
	
    didUpdateView (aFieldView) {  
        debugger;      
        let parentNode = this.parentNode()
        if (!parentNode) {
            parentNode = this.target()
        }

        if (parentNode.didUpdateField) {
            parentNode.didUpdateField(this) // what if it's down a path in an inspector?
        }

        if (this.target() && this.target().didUpdateField) {
            this.target().didUpdateField(this) // what if it's down a path in an inspector?
        }
        
        return this
    }
	
    visibleValue () {
        return this.value()
    }

    validate () {
        // subclasses should override if needed
        return true
    }
	
    nodeTileLink () {
        return null
    }

    summary () {
        if (!this.isVisible()) {
            return ""
        }
        return super.summary()
    }

    summaryKey () {
        return this.key()
    }

    summaryValue () {
        return this.value()
    }

    setNodeSummaryShowsKey () {
    }

    setNodeSummaryShowsValue () {
    }

    jsonArchive () {
        //console.log(this.typeId() + ".jsonArchive()")
        return super.jsonArchive()
    }

    // --- simplified JSON representation ---


    setJson (json) {
        //console.log("Field " + this.key() + " setJson(" + json + ")") 
        this.setValue(json) 
        assert(this.value() === json)
        return this
    }

    asJson () {
        // test used for Character sheet atm
        // separate fron jsonArchive 
        return this.value()
    }

    /*
    setJson (json) {
        this.setKey(json.key) 
        this.setValue(json.value) 
        return this
    }

    asJson () {
        // test used for Character sheet atm
        // separate fron jsonArchive 
        return {
            key: this.key(),
            value: this.value()
        }
    }
    */

    // ----------------
    
    setIsEditable (aBool) {
        this.setValueIsEditable(false)
        return this
    }
    
}.initThisClass());

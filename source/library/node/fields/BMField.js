"use strict"

/*

    BMField

    A BMStorageNode that has a key, value, and valueMethod (among other properties),
    that's useful for automatically constructing a UI to interact with properties of a parent Node.
    
*/
        

window.BMField = class BMField extends BMSummaryNode {
    
    initPrototype () {
        this.newSlot("isVisible", true)
        this.newSlot("isEnabled", true)

        // key
        const keySlot = this.newSlot("key", "key").setShouldStoreSlot(true).setDuplicateOp("duplicate")
        keySlot.setCanInspect(true).setSlotType("String").setLabel("key")
        keySlot.setInspectorPath("Key")


        const keyIsVisibleSlot = this.newSlot("keyIsVisible", true).setShouldStoreSlot(true).setDuplicateOp("duplicate")
        keyIsVisibleSlot.setCanInspect(true).setSlotType("Boolean").setLabel("visible")
        keyIsVisibleSlot.setInspectorPath("Key")

        const keyIsEditable = this.newSlot("keyIsEditable", false).setShouldStoreSlot(true).setDuplicateOp("duplicate")
        keyIsEditable.setCanInspect(true).setSlotType("Boolean").setLabel("editable")
        keyIsEditable.setInspectorPath("Key")

        // value
        this.newSlot("value", null).setShouldStoreSlot(true).setDuplicateOp("duplicate")

        const vivSlot = this.newSlot("valueIsVisible", true).setShouldStoreSlot(true).setDuplicateOp("duplicate")
        vivSlot.setCanInspect(true).setSlotType("Boolean").setLabel("visible")
        vivSlot.setInspectorPath("Value")

        const vieSlot = this.newSlot("valueIsEditable", true).setShouldStoreSlot(true).setDuplicateOp("duplicate")
        vieSlot.setCanInspect(true).setSlotType("Boolean").setLabel("editable")
        vieSlot.setInspectorPath("Value")

        this.newSlot("link", null)
        this.newSlot("ownsLink", null)

        this.newSlot("valuePrefix", null).setShouldStoreSlot(true).setDuplicateOp("duplicate")
        this.newSlot("valuePostfix", null).setShouldStoreSlot(true).setDuplicateOp("duplicate")

        this.newSlot("valueMethod", null).setDuplicateOp("duplicate")
        this.newSlot("noteMethod", null)  // fetches note from a parent node method
        this.newSlot("keyError", null).setSyncsToView(true)
        this.newSlot("valueError", null).setSyncsToView(true)
        this.newSlot("target", null)
    }

    init () {
        super.init()
        this.setShouldStore(true)
        //this.setNodeRowStyles(BMViewStyles.shared().sharedBlackOnWhiteStyle())
        //this.setNodeRowStyles(BMViewStyles.shared().sharedWhiteOnBlackStyle())
        //this.customizeNodeRowStyles().setToBlackOnWhite()
        return this
    }

    static nodeCreate () {
        const newNode = super.nodeCreate()

        if (this._didCreate) {
            throw new Error("attempt to call create twice!")
            return 
        } else {
            this._didCreate = true
        }

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

    didUpdateSlotValue (oldValue, newValue) {  // setValue() is called by View on edit
        if (this.target() && this.valueMethod()) {
            this.setValueOnTarget(newValue)
        } else {
            this.validate()
        }

        this.didUpdateNode()
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
        this.scheduleSyncToStore()
        
        let parentNode = this.parentNode()
        if (!parentNode) {
            parentNode = this.target()
        }

        if (parentNode.didUpdateField) {
            parentNode.didUpdateField(this)
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
	
    nodeRowLink () {
        return null
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
        return this.value()
    }

    setJson (json) {
        this.setValue(json) 
        return this
    }
    
}.initThisClass()

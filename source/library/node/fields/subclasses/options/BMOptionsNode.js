"use strict";

/*

    BMOptionsNode 
    
*/

(class BMOptionsNode extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {

        {
            const picksSlot = this.newSlot("allowsMultiplePicks", false)
            picksSlot.setLabel("Multiple picks").setCanInspect(true).setSlotType("Boolean")
            picksSlot.setShouldStoreSlot(true)
        }

        this.overrideSlot("key", "").setShouldStoreSlot(true)

        //this.newSlot("optionsSource", null).setShouldStoreSlot(false).setDuplicateOp("copyValue")  // this could be stored...
        //this.newSlot("optionsSourceMethod", null).setShouldStoreSlot(false).setDuplicateOp("copyValue") // this could be stored...
        this.newSlot("validValues", null).setShouldStoreSlot(false).setDuplicateOp("copyValue")
        this.newSlot("validValuesClosure", null).setShouldStoreSlot(false).setDuplicateOp("copyValue") // this can't be stored
    }


    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setCanDelete(true)
        this.setNodeCanInspect(true)

        this.setKey("Options")
        this.setKeyIsVisible(true)
        this.setNodeCanEditTitle(true)

        this.setNodeCanReorderSubnodes(true)
    }

    init () {
        super.init()
        this.addAction("add")
        this.setSummaryFormat("value")
        this.setSubnodeProto(BMOptionNode)
        this.setNoteIconName("right-arrow")
    }

    /*
    setValue (v) {
        super.setValue(v)
        return this
    }
    */
    
    title () {
        return this.key()
    }
    
    setTitle (s) {
        this.setKey(s)
        return this
    }

    childrenSummary () {
        const picked = this.pickedSubnodes()
        if (picked.length === 0) {
            return "No selection"
        }
        return picked.map(subnode => subnode.summary()).join("")
    }

    setSubtitle (aString) {
        return this
    }

    didToggleOption (anOptionNode) {
        if (anOptionNode.isPicked() && !this.allowsMultiplePicks()) {
            this.unpickSubnodesExcept(anOptionNode)
        }

        let pickedValues = this.pickedSubnodes().map(s => s.value())
        //this.setValue(pickedValues)
        
        if (pickedValues.length) {
            if (this.allowsMultiplePicks()) {
                this.setValue(pickedValues)
            } else {
                this.setValue(pickedValues.first())
            }
        } else {
            this.setValue(null)
        }

        return this
    }

    unpickSubnodesExcept (anOptionNode) {
        this.subnodes().forEach(subnode => {
            if (subnode !== anOptionNode) { 
                subnode.setIsPicked(false) 
            }
        })
        return this
    }

    pickedSubnodes () {
        return this.subnodes().select(subnode => subnode.isPicked())
    }

    // syncing

    pickSubnodesMatchingValue () {
        const v = this.value()
        this.subnodes().forEach(option => {
            if (Type.isArray(v)) {
                option.justSetIsPicked(v.contains(option.value()))
            } else {
                option.justSetIsPicked(v == option.value())
            }
        })
    }

    acceptedSubnodeTypes () {
        return [BMOptionNode.type()]
    }

    // IMPORTANT: we want to use valid values this way so we can edit the subnodes from the UI
    // to change the valid value set

    /*
    setValidValues (values) {
        if (!this.validValues().equals(values)) {
            this.removeAllSubnodes()     
            const options = values.map(v => {
                const optionNode = BMOptionNode.clone().setTitle(v).setValue(v)
                if (v == this.value()) {
                    optionNode.justSetIsPicked(true)
                }
                //optionNode.setIsPicked(v == this.value())
                optionNode.setNodeCanEditTitle(false)
                return optionNode
            })
            this.addSubnodes(options)
            //this.copySubnodes(options)
        }
        return this
    }
	
    validValues () {
        return this.subnodes().map(sn => sn.value())
    }
    */
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return this
    }

    /*
    prepareForFirstAccess () {
        debugger
        super.prepareForFirstAccess()
        this.setupSubnodes()
    }
    */

    prepareToAccess () {
        //debugger
        super.prepareToAccess()
        if (this.subnodes().length === 0) {
            this.setupSubnodes()
        }
    }

    validValuesFromSource () {
        // as this might be expensive, we should lazy load it first time
        // and maybe 1) have some sort of change timestamp to check next time it's visible
        // and/or 2) have a way of getting notifications for changes when possible?
        const source = this.optionsSource()
        const method = this.optionsSourceMethod()
        if (source && method) {
            const values = source[method].apply(source)
            return values
        }
        return []
    }

    computedValidValues () {
        if (this.validValues()) {
            return this.validValues()
        } else if (this.validValuesClosure()) {
            return this.validValuesClosure()()
        }
        return []
    }

    validValuesFromSubnodes () {
        return this.subnodes().map(sn => sn.value())
    }

    setupSubnodes () {
        const values = this.computedValidValues()
        //debugger
        if (!this.validValuesFromSubnodes().equals(values)) {
            this.removeAllSubnodes()     
            const options = values.map(v => {
                const optionNode = BMOptionNode.clone().setTitle(v).setValue(v)
                if (v == this.value()) {
                    optionNode.justSetIsPicked(true)
                }
                //optionNode.setIsPicked(v == this.value())
                optionNode.setNodeCanEditTitle(false)
                return optionNode
            })
            this.addSubnodes(options)
            //this.copySubnodes(options)
        }
        return this
    }
    
}.initThisClass());

"use strict";

/*

    BMOptionsNode 
    
*/

(class BMOptionsNode extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    initPrototype () {
        const picksSlot = this.newSlot("allowsMultiplePicks", false)
        picksSlot.setLabel("Multiple picks").setCanInspect(true).setSlotType("Boolean")
        picksSlot.setShouldStoreSlot(true)

        this.overrideSlot("key", "").setShouldStoreSlot(true)

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
            return "None"
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

    acceptedSubnodeTypes () {
        return [BMOptionNode.type()]
    }

    setValidValues (values) {        
        const options = values.map(v => BMOptionNode.clone().setTitle(v).setValue(v))
        this.addSubnodes(options)
        //this.copySubnodes(options)
        return this
    }
	
    /*
    validValues () {
        return this.subnodes().map(sn => sn.value())
    }
    */
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return this
    }
    
}.initThisClass());

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
        const picked = this.value()

        if (Type.isArray(picked)) {
            if (picked.length === 0) {
                return "No selection"
            }
            return picked
        } else {
            if (picked === null) {
                return "No selection"
            }
            return [picked]
        }
        /*
        const picked = this.pickedSubnodes()
        if (picked.length === 0) {
            return "No selection"
        }
        return picked.map(subnode => subnode.summary()).join("")
        */
    }

    pickedValues () {
        return this.pickedSubnodes().map(s => s.value())
    }

    setSubtitle (aString) {
        return this
    }

    /*
    subtitle () {
        const s = super.subtitle()
        debugger
        return s
    }
    */

    didToggleOption (anOptionNode) {
        if (anOptionNode.isPicked() && !this.allowsMultiplePicks()) {
            this.unpickSubnodesExcept(anOptionNode)
        }

        const pickedValues = this.pickedValues()
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
        //this.setupSubnodesIfEmpty() // did we need this for loading from store?
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

    didUpdateSlotValidValues (oldValue, newValue) {
        if (newValue) {
            this.setupSubnodes()
        }
    }

    syncFromTarget () {
        super.syncFromTarget()
        this.setupSubnodes()
        this.constrainValue()
        return this
    }

    constrainValue () {
        const v = this.value()
        const validSet = this.validValuesFromSubnodes().asSet()
        let didChange = false
        let newV = null
        if (Type.isArray(v)) {
            newV = v.filter(item => { 
                const isValid = validSet.has(item)
                if (!isValid) {
                    didChange = true
                   // debugger;
                }
                return isValid
            })
        } else {
            if (v !== null && !validSet.has(v)) {
                newV = null
                didChange = true
                //debugger;

            }
        }
        if (didChange) {
            this.setValueOnTarget(newV)
            this.didUpdateNode()
        }
        return this
    }

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

    prepareForFirstAccess () {
        //debugger
        super.prepareForFirstAccess()
        this.setupSubnodesIfEmpty()
    }

    /*
    prepareToAccess () {
        //debugger
        super.prepareToAccess()
        this.setupSubnodesIfEmpty()
    }
    */

    /*
    validValuesFromSource () {
        const source = this.optionsSource()
        const method = this.optionsSourceMethod()
        if (source && method) {
            const values = source[method].apply(source)
            return values
        }
        
        return []
    }
    */

    computedValidValues () {
        if (this.validValues()) {
            return this.validValues()
        } else if (this.validValuesClosure()) {
            return this.validValuesClosure()(this.target())
        } else {
            /*
            const t = this.target()
            if (t) {
                const slotName = this.key()
                return this.target().validValuesForSlotName(slotName)
            }
            */
        }
        return []
    }

    validValuesFromSubnodes () {
        return this.subnodes().map(sn => sn.value())
    }

    setupSubnodesIfEmpty () {
        if (this.subnodes().length === 0) {
            this.setupSubnodes()
        }
        return this
    }

    /*
    didUpdateSlotParentNode (oldValue, newValue) {
        super.didUpdateSlotParentNode(oldValue, newValue) 
        //debugger;
        this.setupSubnodes() // is this needed?
    }
    */

    targetHasPick (v) {
        const value = this.value();

        if (this.allowsMultiplePicks()) {
            const values = Type.isArray(value) ? value : null;
            return values.includes(v)
        } 
        
        return v === value;
    }

    setupSubnodes () {
        const target = this.target();
        if (!target) {
            return this;
        }

        const validValues = this.computedValidValues()
        const validValuesMatch = this.validValuesFromSubnodes().asSet().equals(validValues.asSet());

        const value = target ? this.value() : undefined;
        const pickedValuesSet = this.pickedValues().asSet();
        const pickedValuesMatch = value ? new Set(Type.isArray(value) ? value : [value]).equals(pickedValuesSet) : false; // what about ordering?


        const needsSync = target && !validValuesMatch || !pickedValuesMatch;
        if (needsSync) {
            this.removeAllSubnodes()     
            const options = validValues.map(v => {
                const optionNode = BMOptionNode.clone().setTitle(v).setValue(v)
                const isPicked = this.targetHasPick(v)
                optionNode.justSetIsPicked(isPicked)
                //optionNode.setIsPicked(v == this.value())
                optionNode.setNodeCanEditTitle(false)
                return optionNode
            })
            this.addSubnodes(options)
            //this.copySubnodes(options)
            //this.scheduleSyncToView()

            /*
            if (this.key() === "role") {
                console.log("target = ", this.target());
                console.log("values = ", value);
                console.log("pickedValuesSet = ", pickedValuesSet);
                debugger
                this.setTarget(null);
            }
            */
        }
        return this
    }
    
}.initThisClass());

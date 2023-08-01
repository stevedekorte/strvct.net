"use strict";

/*

    BMOptionsNode 

    valid values format: 

    [
        { 
            label: "", 
            value: valueOrRef,
            subnodes: []
        },
        ...
    ]
    
*/

(class BMOptionsNode extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {

        {
            const slot = this.newSlot("syncedValidItemsJsonString", null)
        }

        {
            const slot = this.newSlot("allowsMultiplePicks", false)
            slot.setLabel("Multiple picks").setCanInspect(true).setSlotType("Boolean")
            slot.setShouldStoreSlot(true)
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
        const picked = this.pickedLeafSubnodes()
        if (picked.length === 0) {
            return "No selection"
        }
        return picked.map(subnode => subnode.summary()).join("")
        */
    }

    // --- picked items ---

    pickedValues () {
        return this.pickedLeafSubnodes().map(s => s.value())
    }

    pickedValuesSet () {
        return this.pickedValues().asSet()
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
            this.unpickLeafSubnodesExcept(anOptionNode)
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

    unpickLeafSubnodesExcept (anOptionNode) {
        this.leafSubnodes().forEach(sn => {
            if (sn !== anOptionNode) { 
                sn.setIsPicked(false) 
            }
        })
        return this
    }

    pickedLeafSubnodes () {
        //this.setupSubnodesIfEmpty() // did we need this for loading from store?
        return this.leafSubnodes().select(sn => sn.isPicked())
    }

    // syncing

    pickLeafSubnodesMatchingValue () {
        const v = this.value()
        this.leafSubnodes().forEach(option => {
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
        const validSet = this.validValuesFromLeafSubnodes().asSet()
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
        return this.leafSubnodes().map(sn => sn.value())
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

    validValuesFromLeafSubnodes () {
        return this.leafSubnodes().map(sn => sn.value())
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

    // --- syncing ---

    onNodeAddItem (parentNode, item) {
        const hasSubnodes = item.options && item.options.length 
        const nodeClass = hasSubnodes ? BMFolderNode : BMOptionNode;
        const sn = nodeClass.clone().setTitle(item.label)
        
        if (!hasSubnodes) {
            sn.setValue(item.value ? item.value : item.label)
            sn.justSetIsPicked(item.isPicked === true)
            sn.setNodeCanEditTitle(false)
        }

        if (item.subtitle) {
            sn.setSubtitle(item.subtitle)
        }

        parentNode.addSubnode(sn)

        if (hasSubnodes) {
            item.options.forEach(subitem => {
                this.onNodeAddItem(sn, subitem)
            })
        }

        return sn
    }

    itemForValue (v) {
        if (Type.isString(v)) {
            const isPicked = this.targetHasPick(v)
            return {
                path: "",
                label: v,
                subtitle: null,
                value: v,
                isPicked: isPicked, // slow - TODO: cache?
                options: null
            }
        }
        assert(Type.isObject(v))
        return v
    }

    setupSubnodes () {
        const target = this.target();
        if (!target) {
            return this;
        }

        const validValues = this.computedValidValues()
        
        const validItemsString = JSON.stableStringify(validValues);
        const validValuesMatch = this.syncedValidItemsJsonString() === validItemsString;

        const value = target ? this.value() : undefined;
        const pickedValuesSet = this.pickedValuesSet();
        const pickedValuesMatch = value ? new Set(Type.isArray(value) ? value : [value]).equals(pickedValuesSet) : false; // what about ordering?


        const needsSync = target && !validValuesMatch || !pickedValuesMatch;
        if (needsSync) {
            //debugger;
            this.removeAllSubnodes()     
            validValues.forEach(v => {
                const item = this.itemForValue(v)
                this.onNodeAddItem(this, item)
            })
            this.didUpdateNode() // needed?
            //this.copySubnodes(options)
            //this.scheduleSyncToView()
            this.setSyncedValidItemsJsonString(validItemsString) 
        }
        return this
    }

    
}.initThisClass());

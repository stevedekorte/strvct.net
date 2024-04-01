"use strict";

/*

    BMOptionsNode 

        Idea:

        have pickedValues() always return an array of the form:

        [
            {
                path: ["path string component A", "path string component B", ...],
                label: "", //?
                subtitle: null, //
                value: aValue, // and value that is valid JSON (no undefined, Maps, non-dict Objects, etc)
            },
            ...
        ]

        and implement pickedValue() to return first item:

            pickedValue () {
                return this.pickedValues().first()
            }

        and have pick action choose which to set on target value depend on this.allowsMultiplePicks()

        Calling value() and setValue() on the target:
        
        - we need to support just putting in value or array (if multi-choice) of raw values,
          as well as an option to store the pickedDicts(), so we need another Slot attribute...
          

*/

//const allSetupOptions = new Set();

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

        {
            //const slot = this.newSlot("isSettingUp", false) // doesn't appear to be needed
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
        this.setCanAdd(true)
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

    debugTypeId () {
        return this.typeId() + "_'" + this.key() + "'"
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

    // --- subtitle ---

    setSubtitle (aString) {
        return this
    }

    subtitle () {
        if (this.usesValidDict()) {
            return this.pickedNodePathStrings().join("\n")
        }
        const s = super.subtitle()
        return s
    }

        
    // --- getting picked items ---

    /*

    fullPickedValues () {
        return this.usesValidDict() ? this.pickedNodeValuePaths() : this.pickedValues()
    }

    pickedNodeValuePaths () {
        return this.pickedNodePaths().map(nodePath => nodePath.map(node => { 
            return node.value ? node.value() : node.title() // string join won't work on non strings!
        }))
    }
    */

    pickedNodePathStrings () {
        return this.pickedNodePaths().map(nodePath => nodePath.map(node => { 
            //return node.value ? node.value() : node.title() // string join won't work on non strings!
            return node.title()
        }).join(" / "))
    }

    pickedNodePaths () {
        return this.pickedLeafSubnodes().map(leafNode => leafNode.parentChainNodeTo(this))
    }

    // ---

    pickedValues () {
        return this.pickedLeafSubnodes().map(s => s.value())
    }

    pickedValuesSet () {
        return this.pickedValues().asSet()
    }

    usesValidDict () {
        const vv = this.validValues()
        return vv && vv.length && Type.isDictionary(vv[0]);
    }

    pickedLeafSubnodes () {
        //this.setupSubnodesIfEmpty() // did we need this for loading from store?
        return this.leafSubnodes().select(sn => sn.isPicked())
    }

    pickedItems () {
        return this.pickedLeafSubnodes().map(sn => {
            return {
                label: sn.label(),
                value: sn.value(),
                path: sn.parentChainNodeTo(this).map(sn => sn.title())
            }
        })
    }

    // --- handle pick event ---

    didToggleOption (anOptionNode) {
        if (anOptionNode.isPicked() && !this.allowsMultiplePicks()) {
            this.unpickLeafSubnodesExcept(anOptionNode)
        }
        
        const v = this.formatedPickedValues()
        this.setValue(v)

        return this
    }

    formatedPickedValues () {
        const pickedValues = this.pickedValues();
        
        let v = null;

        if (pickedValues.length) {
            v = this.allowsMultiplePicks() ? pickedValues : pickedValues.first();
        }
        return v
    }

    setValueOnTarget (v) {
        super.setValueOnTarget(v)
        //this.setOptionsOnTarget()
        return this
    }

    /*
    setOptionsOnTarget () {
        const t = this.target()
        if (t) {
            const setter = this.setterNameForSlot(this.valueMethod() + "Options")
            
            if (t[setter]) {
                t[setter].apply(t, [this.pickedItems()])
                //t.didUpdateNodeIfInitialized()
            } 
        }
        return this
    }
    */

    // --- picking and unpicking items programatically ---

    unpickLeafSubnodesExcept (anOptionNode) {
        this.leafSubnodes().forEach(sn => {
            if (sn !== anOptionNode) { 
                sn.setIsPicked(false) 
            }
        })
        return this
    }

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

    // --- syncing ---

    acceptedSubnodeTypes () {
        return [BMOptionNode.type()] // , BMFolderNode.type()]
    }

    // IMPORTANT: we want to use valid values this way so we can edit the subnodes from the UI
    // to change the valid value set

    didUpdateSlotValidValues (oldValue, newValue) {
        if (newValue) {
            //this.setupSubnodes()
            //this.scheduleMethod("setupSubnodes")
        }
    }

    syncFromTarget () {
        super.syncFromTarget()
        this.setupSubnodes()
        this.constrainValue()
        //this.setOptionsOnTarget()
        return this
    }

    constrainValue () {
        // make sure the target's value is one of the valid options

        /*
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
            this.didUpdateNodeIfInitialized()
        }
        */
        return this
    }
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return this
    }

    prepareForFirstAccess () {
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

    /*
    setValue (v) {
        if (Type.isDictionary(v)) {
            debugger;
        }
        this._value = v;
        return this;
    }
    */

    itemForValue (v) {
        if (Type.isString(v) || Type.isNumber(v)) {
            //const isPicked = this.targetHasPick(v)
            return {
                //path: null,  // returned in picked values?
                label: v,
                subtitle: null,
                value: v,
                //isPicked: isPicked, // slow - TODO: cache?
                options: null
            }
        }
        assert(Type.isDictionary(v))
        return v
    }

    valueAsArray () {
        const target = this.target();
        const value = target ? this.value() : undefined;

        if (value === null || value === undefined) {
            return [];
        } else if (this.allowsMultiplePicks()) {
            return value;
        } else {
            return [value];
        }
    }

    validValuesMatch () {
        const validValues = this.computedValidValues()
        const validItemsString = JSON.stableStringify(validValues);
        const validValuesMatch = this.syncedValidItemsJsonString() === validItemsString; // could check a hash instead but maybe JS interns strings itself?
        return validValuesMatch
    }

    picksMatch () {
        // [""]' != '[]'
        const a = JSON.stableStringify(this.valueAsArray());
        const b = JSON.stableStringify(this.pickedValues());
        if (a === '[""]' && b == '[]') {
            return true // TODO: fix this hack...
        }
        return a === b;
    }

    needsSyncToSubnodes () {
        if (this.target()) {
            const validValuesMatch = this.validValuesMatch()
            const picksMatch = this.picksMatch();
            const needsSync = (!validValuesMatch || !picksMatch);
            return needsSync
        }
        return false
    }

    setupSubnodes () {
        //debugger
        if (this.needsSyncToSubnodes() /*&& !this.isSettingUp()*/) {
            /*
            if (allSetupOptions.has(this)) {
                debugger;
            }
            */
            //this.setIsSettingUp(true)
            //console.log(this.typeId() + " " + this.nodePathString() + " setupSubnodes");
            this.removeAllSubnodes()
            const validValues = this.computedValidValues()

            validValues.forEach(v => {
                const item = this.itemForValue(v)
                this.addOptionNodeForDict(item)
            })
            //this.copySubnodes(options)
            //this.scheduleSyncToView()
            this.setSyncedValidItemsJsonString(JSON.stableStringify(validValues)) 

            this.leafSubnodes().forEach(sn => {
                sn.setIsPicked(this.targetHasPick(sn.value()))
            })

            if (this.needsSyncToSubnodes()) {
                console.log("\nERROR: OptionsNode '" + this.key() + "' not synced with target after sync!")
                console.log("Let's try syncing the picked values to the target:")
                console.log("VALID VALUES:")
                console.log("  computedValidValues: " + JSON.stableStringify(this.computedValidValues()));
                console.log("  syncedValidItemsJsonString(): " +  this.syncedValidItemsJsonString());
                console.log("BEFORE:")
                console.log("  valueAsArray: ", JSON.stableStringify(this.valueAsArray()))
                console.log("  pickedValues: ", JSON.stableStringify(this.pickedValues()))

                //debugger;
                this.valueAsArray()

                this.setValueOnTarget(this.formatedPickedValues())
                
                console.log("AFTER:")
                console.log("  valueAsArray: ", JSON.stableStringify(this.valueAsArray()))
                console.log("  pickedValues: ", JSON.stableStringify(this.pickedValues()))
                //debugger;
                this.valueAsArray()
                assert(!this.needsSyncToSubnodes()) // important sanity check - maybe values aren't in pickable set?
            }
            //this.setIsSettingUp(false)
            this.didUpdateNodeIfInitialized() // needed?
            /*
            allSetupOptions.add(this)
            assert(allSetupOptions.has(this))
            */
        }
        return this
    }
    
}.initThisClass());

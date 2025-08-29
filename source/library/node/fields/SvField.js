"use strict";

/**
 * @module library.node.fields
 */

/**
 * @class SvField
 * @extends SvSummaryNode
 * @classdesc A SvStorageNode that has a key, value, and valueMethod, useful for automatically constructing a UI to interact with properties of a parent Node.
 */

(class SvField extends SvSummaryNode {
    
    initPrototypeSlots () {

        /**
         * @member {boolean} isEnabled - Whether the field is enabled.
         */
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSyncsToView(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {string} key - The key of the field.
         */
        // key
        {
            const slot = this.newSlot("key", "key");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("key");
            slot.setInspectorPath("Node/Field/Key");
        }

        /**
         * @member {boolean} keyIsVisible - Whether the key is visible.
         */
        {
            const slot = this.newSlot("keyIsVisible", true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("visible");
            slot.setInspectorPath("Node/Field/Key");
        }

        /**
         * @member {boolean} keyIsEditable - Whether the key is editable.
         */
        {
            const slot = this.newSlot("keyIsEditable", false);
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setLabel("editable");
            slot.setInspectorPath("Node/Field/Key");
        }

        // value

        /**
         * @member {Object} value - The value of the field.
         */
        {
            const slot = this.newSlot("value", null);
            slot.setCanInspect(true);
            slot.setInspectorPath("Node/Field/Value");
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            //slot.setSlotType("String"); // might be boolean or number, so use overrideSlot() on field types
        }

        /**
         * @member {boolean} valueIsVisible - Whether the value is visible.
         */
        {
            const slot = this.newSlot("valueIsVisible", true);
            slot.setInspectorPath("Node/Field/Value");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("visible");
        }

        /**
         * @member {boolean} valueIsEditable - Whether the value is editable.
         */
        {
            const slot = this.newSlot("valueIsEditable", true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("editable");
            slot.setInspectorPath("Node/Field/Value");
        }

        /**
         * @member {boolean} valueAllowsHtml - Whether the value allows html.
         */
        {
            const slot = this.newSlot("valueAllowsHtml", false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("editable");
            slot.setInspectorPath("Node/Field/Value");
        }

        {
            const slot = this.newSlot("valueWhiteSpace", null);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setInspectorPath("Node/Field/Value");
        }

        /**
         * @member {string} valuePlaceholderText - The placeholder text for the value.
         */
        {
            const slot = this.newSlot("valuePlaceholderText", null);
            slot.setCanInspect(true);
            slot.setDuplicateOp("duplicate");
            slot.setInspectorPath("Node/Field/Value");
            slot.setLabel("placeholder text");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
        }

        /*
        {
            const slot = this.newSlot("valueAllowsNull", true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("editable");
            slot.setInspectorPath("Node/Field/Value");
        }
        */

        /**
         * @member {boolean} valueCanHitEnter - Whether the value can hit enter.
         */
        {
            const slot = this.newSlot("valueCanHitEnter", true);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
         * @member {Object} link - The link of the field.
         */
        {
            const slot = this.newSlot("link", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {boolean} ownsLink - Whether the field owns the link.
         */
        {
            const slot = this.newSlot("ownsLink", null);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {string} valuePrefix - The prefix of the value.
         */
        {
            const slot = this.newSlot("valuePrefix", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        /**
         * @member {string} valuePostfix - The postfix of the value.
         */
        {
            const slot = this.newSlot("valuePostfix", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        /**
         * @member {string} valueMethod - The method of the value.
         */
        {
            const slot = this.newSlot("valueMethod", null);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }
        
        /**
         * @member {string} noteMethod - The method of the note.
         */
        {
            const slot = this.newSlot("noteMethod", null);  // fetches note from a parent node method
            slot.setSlotType("String");
            slot.setSyncsToView(true);
        }
        
        /**
         * @member {string} keyError - The error of the key.
         */
        {
            const slot = this.newSlot("keyError", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
        }
        
        /**
         * @member {string} valueError - The error of the value.
         */
        {
            const slot = this.newSlot("valueError", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
        }
        
        /**
         * @member {SvNode} target - The target of the field.
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("SvNode");
            slot.setSyncsToView(true);
        }

        /**
         * @member {SvObservation} didUpdateNodeObs - The observation of the didUpdateNode.
         */
        {
            const slot = this.newSlot("didUpdateNodeObs", null);
            slot.setSlotType("SvObservation");
        }
    }

    /**
     * @description Initializes the prototype slots for the SvField class.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setSummaryFormat("key value");
        this.setHasNewlineAfterSummary(true);
    }

    /**
     * @description Called when the node is loaded from the store.
     */
    didLoadFromStore () { // move to finalInit?
        super.didLoadFromStore()
        this.validate()
    }

    /**
     * @static
     * @description Creates a new node.
     * @returns {SvField} The new node.
     */
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

    /**
     * @description Returns the title of the field.
     * @returns {string} The title of the field.
     */
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

    /**
     * @description Called when the target of the field is updated.
     * @param {Object} oldValue - The old target.
     * @param {Object} newValue - The new target.
     */
    didUpdateSlotTarget (oldValue, newValue) {
        if (oldValue) {
            const obs = this.didUpdateNodeObs();
            if (obs) {
                obs.stopWatching();
                this.setDidUpdateNodeObs(null);
            }
        }

        if (newValue) {
            //debugger;
            this.setDidUpdateNodeObs(this.watchForNoteFrom("onUpdatedNode", newValue));
            //this.didUpdateNodeObs().setIsDebugging(true);
            this.scheduleMethod("syncFromTarget");
        } 
    }

    /**
     * @description Called when the node is updated.
     */
    directDidUpdateNode () {
        super.didUpdateNode()
        return this
    }

    /*
    didUpdateTargetNode (aNote) {
        debugger;
    }
    */

    /**
     * @description Called when the node is updated.
     * @param {SvSummaryNode} aNote - The note.
     */
    onUpdatedNode (aNote) {
        if (this.isKindOf(SvActionField)) {
            //debugger;
        }

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

    /**
     * @description Syncs the field from the target.
     */
    syncFromTarget () {
        //this.value(); // triggers didUpdateNodeIfInitialized

        // up to subclasses to implement
        //throw new Error("syncFromTarget not implemented for " + this.type());
        return this
    }

    /**
     * @description Called when the value of the field is updated.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    didUpdateSlotValue (oldValue, newValue) {  // setValue() is called by View on edit
        if (this.target() && this.valueMethod()) {
            this.setValueOnTarget(newValue);
        } else {
            this.validate();
        }

        this.didUpdateNodeIfInitialized();
    }

    /**
     * @description Sets the value on the target.
     * @param {Object} v - The value.
     */
    setValueOnTarget (v) { // called by View on edit
        //console.log("setValue '" + v + "'")
        const target = this.target();
        const setter = this.setterNameForSlot(this.valueMethod());

        v = this.normalizeThisValue(v);
        
        if (target[setter]) {
            target[setter].apply(target, [v]);

            target.didUpdateNode(this.valueMethod()); // shouldn't this be done by the setter?
            this.validate();
        } else {
            console.warn(this.type() + " target " + target.type() + " missing slot '" + setter + "'");
            debugger;
        }
		
        return this;
    }
	
    /**
     * @description Normalizes the value.
     * @param {Object} v - The value.
     * @returns {Object} The normalized value.
     */
    normalizeThisValue (v) {
	    return v;
    }
	
    /**
     * @description Gets the value from the target.
     * @returns {Object} The value.
     */
    value () {
        if (this.target()) {
            const newValue = this.getValueFromTarget();
            if (this._value !== newValue) {
                this._value = newValue;
                //this.didUpdateNodeIfInitialized(); // this can cause sync action loops
            }
        }
        return this._value;
    }

    /**
     * @description Gets the value from the target.
     * @returns {Object} The value.
     */
    getValueFromTarget () {
        const target = this.target();
        const slotName = this.valueMethod();

        //console.log("target = " + target.type() + " getter = '" + getter + "'")
        if (target[slotName]) {
            const value = target[slotName].apply(target);
            return value;
        } else {
            console.warn(this.type() + " target " + target.type() + " missing slot '" + slotName + "'");
        }

        return null;
    }
	
    /**
     * @description Gets the note from the target.
     * @returns {Object} The note.
     */
    note () {
        const target = this.target();
        const slotName = this.noteMethod();

        if (target && slotName) {
            if (target[slotName]) {
                return target[slotName].apply(target);
            } else {
                console.warn(this.type() + " target " + target.type() + " missing note getter slot '" + slotName + "'");
            }
        }

       // return null
        return this._note
    }
	
    /**
     * @description Called when the view is updated.
     * @param {Object} aFieldView - The field view.
     */
    didUpdateView (/*aFieldView*/) {  
        debugger;      
        let parentNode = this.parentNode();
        if (!parentNode) {
            parentNode = this.target();
        }

        if (parentNode.didUpdateField) {
            parentNode.didUpdateField(this); // what if it's down a path in an inspector?
        }

        if (this.target() && this.target().didUpdateField) {
            this.target().didUpdateField(this); // what if it's down a path in an inspector?
        }
        
        return this;
    }
	
    /**
     * @description Returns the visible value of the field.
     * @returns {Object} The visible value.
     */
    visibleValue () {
        return this.value();
    }

    /**
     * @description Validates the field.
     * @returns {boolean} Whether the field is valid.
     */
    validate () {
        // subclasses should override if needed
        return true;
    }
	
    /**
     * @description Returns the tile link of the field.
     * @returns {Object} The tile link.
     */
    nodeTileLink () {
        return this;
    }

    /**
     * @description Returns the summary of the field.
     * @returns {string} The summary.
     */
    summary () {
        if (!this.isVisible()) {
            return "";
        }
        return super.summary();
    }

    /**
     * @description Returns the key of the field.
     * @returns {string} The key.
     */
    summaryKey () {
        return this.key();
    }

    /**
     * @description Returns the value of the field.
     * @returns {Object} The value.
     */
    summaryValue () {
        return this.value();
    }

    /**
     * @description Sets the node summary shows key.
     */
    setNodeSummaryShowsKey () {
    }

    /**
     * @description Sets the node summary shows value.
     */
    setNodeSummaryShowsValue () {
    }

    /**
     * @description Returns the JSON archive of the field.
     * @returns {Object} The JSON archive.
     */
    jsonArchive () {
        //console.log(this.typeId() + ".jsonArchive()")
        return super.jsonArchive();
    }

    // --- simplified JSON representation ---

    /**
     * @description Sets the JSON of the field.
     * @param {Object} json - The JSON.
     */
    setJson (json, jsonPathComponents = []) {
        this.setValue(json);
        const didSet = (this.value() === json || (json === null && this.value() === "")); // sanity check
        if (!didSet) {
            if (this.target()) {
                console.warn("Field unable to set value using " + this.target().typeId() + "' '" + this.key() + "' setJson(" + json + ") at path: " + jsonPathComponents.join("/"));
            } else {
                console.warn("Field unable to set value using '" + this.key() + "' setJson(" + json + ") at path: " + jsonPathComponents.join("/"));
            }
            debugger;
            this.setValue(json);
            let v = this.value();
            assert(v === json, "failed to set value");
        }
        assert(didSet);
        return this;
    }

    /**
     * @description Returns the JSON of the field.
     * @returns {Object} The JSON.
     */
    asJson () {
        // test used for Character sheet atm
        // separate fron jsonArchive 
        return this.value();
    }

    // ----------------
    
    /**
     * @description Sets the is editable of the field.
     * @param {boolean} aBool - The is editable.
     */
    setIsEditable (aBool) {
        this.setValueIsEditable(aBool);
        return this;
    }
    
}.initThisClass());

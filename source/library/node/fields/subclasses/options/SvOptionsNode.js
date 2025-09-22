"use strict";

/**
 * @module library.node.fields.subclasses.options
 * @class SvOptionsNode
 * @extends SvField
 * @classdesc SvOptionsNode represents a field for selecting one or multiple options.
 * 
 * NOTES:
 * 
 *  computedValidItems() will use validItemsClosure() if it is set, otherwise it will use validItems().
 * 
 * Idea:
 * 
 * have pickedValues() always return an array of (option leaf nodes) the form:
 * 
 * [
 *     {
 *         path: ["path component A", "path component B", ...], // the UI will construct folders to allow user to browse this options path
 *         label: "", //?
 *         subtitle: null, //
 *         value: aValue, // and value that is valid JSON (no undefined, Maps, non-dict Objects, etc)
 *     },
 *     ...
 * ]
 * 
 * and implement pickedValue() to return first item:
 * 
 *     pickedValue () {
 *         return this.pickedValues().first()
 *     }
 * 
 * and have pick action choose which to set on target value depend on this.allowsMultiplePicks()
 * 
 * Calling value() and setValue() on the target:
 * 
 * - we need to support just putting in value or array (if multi-choice) of raw values,
 *   as well as an option to store the pickedDicts(), so we need another Slot attribute...
 * 
 * Notes:
 * 
 * Sometimes the options dict will have a value key, sometimes it will not.
 * If it doesn't, then the label is used as the value.
 * 
 * Should we support both cases, or require the use of the value key?
 * 
 * SvField.setValueOnTarget() needs to handle both cases.
 * 
 */
(class SvOptionsNode extends SvField {
    
    /**
     * @static
     * @description Indicates if this node is available as a primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvOptionsNode.
     */
    initPrototypeSlots () {

        /**
         * @member {boolean} allowsMultiplePicks
         * @description Determines if multiple options can be selected.
         * When true, pickedValues() returns an array of values.
         */
        {
            const slot = this.newSlot("allowsMultiplePicks", false);
            slot.setLabel("Multiple picks");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {string} key
         * @description The key for the options node.
         */
        {
            const slot = this.overrideSlot("key", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        /**
         * @member {Array} validItems
         * @description An array of valid values for the options.
         */
        {
            const slot = this.newSlot("validItems", null);
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Array");
        }

        /**
         * @member {Function} validItemsClosure
         * @description A function that returns valid values for the options.
         */
        {
            const slot = this.newSlot("validItemsClosure", null);
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Function");
        }
    }

    /**
     * @description Initializes the prototype of the SvOptionsNode.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);

        this.setCanDelete(true);
        this.setNodeCanInspect(true);

        this.setKey("Options");
        this.setKeyIsVisible(true);
        this.setNodeCanEditTitle(true);

        this.setNodeCanReorderSubnodes(true);

        this.setNodeCanAddSubnode(true);
        this.setSummaryFormat("value");
        this.setNoteIconName("right-arrow");
        this.setSubnodeProto(SvOptionNode);
    }
    
    /*
    init () {
        super.init();
        debugger;
    }
    */

    /**
     * @description Gets the title of the options node.
     * @returns {string} The key of the options node.
     */
    title () {
        return this.key();
    }

    /**
     * @description Gets a debug type identifier for the options node.
     * @returns {string} The debug type identifier.
     */
    svDebugId () {
        return this.svTypeId() + "_'" + this.key() + "'";
    }
    
    /**
     * @description Sets the title of the options node.
     * @param {string} s - The new title.
     * @returns {SvOptionsNode} The current instance.
     */
    setTitle (s) {
        this.setKey(s);
        return this;
    }

    /**
     * @description Gets a summary of the children nodes.
     * @returns {string|Array} A summary of the picked values.
     */
    childrenSummary () {
        const picked = this.value();

        if (Type.isArray(picked)) {
            if (picked.length === 0) {
                return "No selection";
            }
            return picked;
        } else {
            if (picked === null) {
                return "No selection";
            }
            return [picked];
        }
    }

    /**
     * @description Sets the subtitle of the options node.
     * @param {string} aString - The subtitle to set.
     * @returns {SvOptionsNode} The current instance.
     */
    setSubtitle (/*aString*/) {
        return this;
    }

    /**
     * @description Gets the subtitle of the options node.
     * @returns {string} The subtitle of the options node.
     */
    subtitle () {
        /*
        if (this.usesValidDict()) {
            return this.pickedNodePathStrings().join("\n");
        }
        */
        const pickedItems = this.pickedItems();
        if (pickedItems.length === 0) {
            return "No Selection";
        }

        return pickedItems.map(item => item.label).join("\n");
        /*
        const s = super.subtitle();
        return s;
        */
    }

    /**
     * @description Gets the picked node path strings.
     * @returns {Array<string>} An array of picked node path strings.
     */
    pickedNodePathStrings () {
        return this.pickedNodePaths().map(nodePath => nodePath.map(node => { 
            return node.title();
        }).join(" / "));
    }

    /**
     * @description Gets the picked node paths.
     * @returns {Array<Array<SvOptionNode>>} An array of picked node paths.
     */
    pickedNodePaths () {
        return this.pickedLeafSubnodes().map(leafNode => leafNode.parentChainNodeTo(this));
    }

    /**
     * @description Gets the selected values as an array.
     * @returns {Array} An array of selected values.
     */
    selectedValues () {
        return this.pickedLeafSubnodes().map(s => s.value());
    }

    /**
     * @description Gets the selected value (first selected item).
     * @returns {*} The selected value or null.
     */
    selectedValue () {
        const values = this.selectedValues();
        return values.length > 0 ? values[0] : null;
    }

    /**
     * @description Gets the picked values (alias for selectedValues).
     * @returns {Array} An array of picked values.
     */
    pickedValues () {
        return this.selectedValues();
    }

    /**
     * @description Gets the picked value (alias for selectedValue).
     * @returns {*} The picked value.
     */
    pickedValue () {
        return this.selectedValue();
    }

    /*
    pickedItems () {
        return this.pickedLeafSubnodes().map(s => s.itemDict());
    }
    */

    /**
     * @description Gets a set of picked values.
     * @returns {Set} A set of picked values.
     */
    pickedValuesSet () {
        return this.pickedValues().asSet();
    }

    /**
     * @description Checks if the options node uses valid dictionaries.
     * @returns {boolean} True if valid dictionaries are used.
     */
    usesValidDict () {
        /*
        const vv = this.validItem();
        return vv && vv.length && Type.isDictionary(vv[0]);
        */
        return true;
    }

    /**
     * @description Gets the picked leaf subnodes.
     * @returns {Array<SvOptionNode>} An array of picked leaf subnodes.
     */
    pickedLeafSubnodes () {
        return this.leafSubnodes().select(sn => sn.isPicked());
    }

    /**
     * @description Gets the picked items.
     * @returns {Array<Object>} An array of picked items with label, value, and path.
     */
    pickedItems () {
        return this.pickedLeafSubnodes().map(sn => {
            return {
                path: sn.parentChainNodeTo(this).map(sn => sn.title()),
                label: sn.label(),
                value: sn.value()
            };
        });
    }


    /**
     * @description Handles the toggling of an option.
     * @param {SvOptionNode} anOptionNode - The option node that was toggled.
     * @returns {SvOptionsNode} The current instance.
     */
    didToggleOption (anOptionNode) {
        // This is called when the user toggles an option
        if (anOptionNode.isPicked() && !this.allowsMultiplePicks()) {
            this.unpickLeafSubnodesExcept(anOptionNode);
        }
        
        this.updateTargetValue();
        return this;
    }

    /**
     * @description Updates the target value based on current selection.
     * Only called from user interactions, not during syncing.
     * @returns {SvOptionsNode} The current instance.
     */
    updateTargetValue () {
        if (this.allowsMultiplePicks()) {
            this.setValue(this.selectedValues());
        } else {
            this.setValue(this.selectedValue());
        }
        return this;
    }

    /**
     * @description Gets the normalized value for the target.
     * @returns {*} Array for multi-pick, single value for single-pick.
     */
    normalizedValue () {
        if (this.allowsMultiplePicks()) {
            return this.selectedValues();
        } else {
            return this.selectedValue();
        }
    }

    /**
     * @description Sets the value on the target.
     * @param {*} v - The value to set.
     * @returns {SvOptionsNode} The current instance.
     */
    setValueOnTarget (v) {
        //debugger;
        if (this.allowsMultiplePicks()) {
            if (!Type.isArray(v)) {
                console.warn(this.svType() + ".setValueOnTarget() called with non array value when allowsMultiplePicks is true");
                debugger;
            }
        } else {
            if (Type.isArray(v)) {
                // this isn't necessarily an error, but it is unexpected
                console.warn(this.svType() + ".setValueOnTarget() called with array when allowsMultiplePicks is true");
                debugger;
            }
        }
        super.setValueOnTarget(v);
        return this;
    }

    /**
     * @description Unpicks all leaf subnodes except the specified one.
     * @param {SvOptionNode} anOptionNode - The option node to exclude from unpicking.
     * @returns {SvOptionsNode} The current instance.
     */
    unpickLeafSubnodesExcept (anOptionNode) {
        this.leafSubnodes().forEach(sn => {
            if (sn !== anOptionNode) { 
                sn.setIsPicked(false);
            }
        });
        return this;
    }

    /**
     * @description Picks leaf subnodes matching the current value.
     */
    pickLeafSubnodesMatchingValue () {
        const v = this.value();
        this.leafSubnodes().forEach(option => {
            if (Type.isArray(v)) {
                option.justSetIsPicked(v.contains(option.value()));
            } else {
                option.justSetIsPicked(v == option.value());
            }
        });
    }

    /**
     * @description Gets the accepted subnode types.
     * @returns {Array<string>} An array of accepted subnode type names.
     */
    acceptedSubnodeTypes () {
        return [SvOptionNode.svType()];
    }

    /**
     * @description Syncs the options node from the target.
     * @returns {SvOptionsNode} The current instance.
     */
    syncFromTarget () {
        super.syncFromTarget();
        this.setupSubnodes();
        this.constrainValue();
        return this;
    }

    /**
     * @description Constrains the value to valid options.
     * @returns {SvOptionsNode} The current instance.
     */
    constrainValue () {
        return this;
    }
    
    /**
     * @description Gets the node tile link.
     * @returns {SvOptionsNode} The current instance.
     */
    nodeTileLink () {
        return this;
    }

    /**
     * @description Prepares the node for first access.
     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess();
        this.setupSubnodesIfEmpty();
    }

    prepareToAccess () {
        super.prepareToAccess();
        if (this.validItemsClosure()) {
            console.log(this.logPrefix() + " prepareToAccess() callingsetupSubnodes () because validItemsClosure is set");
            this.setupSubnodes();
        }
        return this;
    }

    /**
     * @description Computes the valid values for the options.
     * @returns {Array} An array of valid values.
     */
    computedValidValues () {
        debugger;
        return this.computedValidItems().map(item => item.value);
    }

    /**
     * @private
     * @category Valid Items
     * @description Computes the valid items for the slot.
     * @returns {Array|null} The valid items, or null if neither validItems nor validItemsClosure are set.
     */
    computedValidItems () {
        const context = this.target();
        if (this.validItemsClosure()) {
            return this.validItemsClosure()(context);
        } else if (this.validItems()) {
            return this.validItems();
        }
        return null;
    }

    /**
     * @description Sets up subnodes if they are empty.
     * @returns {SvOptionsNode} The current instance.
     */
    setupSubnodesIfEmpty () {
        if (this.subnodes().length === 0) {
            this.setupSubnodes();
        }
        return this;
    }

    /**
     * @description Checks if the target has a specific pick.
     * @param {*} v - The value to check.
     * @returns {boolean} True if the target has the pick.
     */
    targetHasPick (v) {
        const targetValue = this.value();
        
        if (this.allowsMultiplePicks()) {
            // For multi-pick, target value should be an array
            if (!Type.isArray(targetValue)) {
                return false;
            }
            return targetValue.includes(v);
        } else {
            // For single-pick, compare directly
            return v === targetValue;
        }
    }

    /**
     * @private
     * @category Valid Items
     * @description Gets the item for a specific value.
     * @param {*} v - The value to get the item for.
     * @returns {Object} An object representing the item.
     */
    itemForValue (v) {
        if (Type.isDictionary(v)) {
            return v;
        }

        if (Type.isNull(v)) {
            return {
                label: "null",
                subtitle: null,
                value: null,
            };
        }   

        if (Type.isString(v) || Type.isNumber(v)) {
            return {
                label: v,
                subtitle: null,
                value: v,
            };
        }
        
        throw Error.exception(this.svType() + ".itemForValue() called with invalid value: " + v);
    }

    /**
     * @private
     * @category Valid Items
     * @description Checks if the computed valid items match the (local copy of the) valid items. Used to detect if the valid items need to be updated.
     * @returns {boolean} True if the computed valid items match the valid items.
     */
    validItemsMatch () {
        const computedValidItems = this.computedValidItems();
        const validItems = this.validItems();
        return Type.valuesAreEqual(computedValidItems, validItems);
    }

    /**
     * @private
     * @category Valid Items
     * @description Copies an array of items.
     * @param {Array} items - The items to copy.
     * @returns {Array} An array of copied items.
     */
    copyValidItems (items) {
        assert(Type.isArray(items));
        const copiedItems = items.map(item => {
            assert(Type.isDictionary(item));
            return item.shallowCopy();
        });
        return copiedItems;
    }

    /**
     * @description Checks if the picks match.
     * @returns {boolean} True if the picks match.
     */
    /**
     * @description Checks if the selected values match the target value.
     * @returns {boolean} True if they match.
     */
    picksMatch () {
        const targetValue = this.value();
        const selectedVals = this.selectedValues();
        
        if (this.allowsMultiplePicks()) {
            // For multiple picks, compare arrays (order doesn't matter)
            if (!Type.isArray(targetValue)) {
                return selectedVals.length === 0;
            }
            return targetValue.length === selectedVals.length && 
                   targetValue.every(val => selectedVals.includes(val)) &&
                   selectedVals.every(val => targetValue.includes(val));
        } else {
            // For single pick, compare values
            const selectedVal = this.selectedValue();
            return targetValue === selectedVal;
        }
    }

    /**
     * @description Checks if a value is valid for this options node.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is valid.
     */
    isValidValue (value) {
        const validItems = this.computedValidItems();
        const validValues = validItems.map(item => item.value);
        
        if (this.allowsMultiplePicks()) {
            if (!Type.isArray(value)) {
                return false;
            }
            // All values in the array must be valid
            return value.every(v => validValues.includes(v));
        } else {
            // Single value must be in valid values or null
            return value === null || validValues.includes(value);
        }
    }

    /**
     * @description Checks if the node needs to sync to subnodes. Returns true if the valid items or picked values don't match.
     * @returns {boolean} True if sync to subnodes is needed.
     */
    needsSyncToSubnodes () {
        if (this.target()) {
            const validItemsMatch = this.validItemsMatch();
            const picksMatch = this.picksMatch();
            const needsSync = (!validItemsMatch || !picksMatch);
            return needsSync;
        }
        return false;
    }

    /**
     * @description Gets a default value when current value is invalid.
     * @returns {*} A valid default value.
     */
    defaultValue () {
        const validItems = this.computedValidItems();
        
        if (this.allowsMultiplePicks()) {
            return []; // Empty array for multi-pick
        } else {
            // First valid value for single-pick
            return validItems.length > 0 ? validItems.first().value : null;
        }
    }

    syncPicksToSubnodes () {
        // Sync UI to reflect target value without triggering updates back to target
        this.leafSubnodes().forEach(sn => {
            // Use justSetIsPicked to update UI without triggering didToggleOption
            sn.justSetIsPicked(this.targetHasPick(sn.value()));
            // Manually trigger UI update
            sn.didUpdateNodeIfInitialized();
        });
    }

    didUpdateNode () {
        // lets see if this prevents the sync loop
        //super.didUpdateNode();
    }
    
    didChangeSubnodeList () {
        // Only propagate subnode list changes if we're not setting up
        if (!this._isSettingUpSubnodes) {
            super.didChangeSubnodeList();
        }
        return this;
    }

    /**
     * @description Sets up the subnodes.
     * @returns {SvOptionsNode} The current instance.
     */
    setupSubnodes () {
        if (this.needsSyncToSubnodes()) {
            // Prevent notifications during setup
            this._isSettingUpSubnodes = true;
            
            this.removeAllSubnodes();
            const validItems = this.computedValidItems();

            // setup the subnodes
            validItems.forEach(v => {
                const item = this.itemForValue(v);
                const newNode = this.addOptionNodeForDict(item);
                newNode.setCanDelete(false);
                if (Type.isNumber(v)) {
                    assert(Type.isNumber(item.value), "item.value is not a number");
                    assert(Type.isNumber(newNode.value()), "newNode.value() is not a number");
                    assert(newNode.value() === item.value, "newNode.value() !== item.value");
                }
                assert(newNode.optionsNode() === this, "newNode.optionsNode() !== this");
            });

            this.setValidItems(validItems);
            //this.setSyncedValidItemsJsonString(JSON.stableStringifyOnlyJson(validItems));

            this.syncPicksToSubnodes();
            
            // Re-enable notifications
            this._isSettingUpSubnodes = false;

            // No need to force value updates here - just sync the UI
            this.didUpdateNodeIfInitialized();
            this.didUpdateNodeIfInitialized();
        }
        return this;
    }

    show () {
        this.log("--------------------------------");
        this.log("\nERROR: OptionsNode '" + this.key() + "' not synced with target after setupSubnodes!\n");

        // this can happen if the target has a value that is not in the validItems array
        this.log("Let's try syncing the picked values to the target:");

        this.log("VALID VALUES:");
        this.log("  computedValidItems: " + JSON.stableStringifyWithStdOptions(this.computedValidItems()) + "\n");
        this.log("  validItemsMatch: " + this.validItemsMatch() + "\n");

        this.log("PICKS:");
        this.log("  allowsMultiplePicks: " + this.allowsMultiplePicks() + "\n");
        this.log("TARGET VALUE:");
        this.log("  value: ", JSON.stableStringifyWithStdOptions(this.value()) + "\n");
        
        this.log("SELECTED VALUES:");
        this.log("  selectedValues: ", JSON.stableStringifyWithStdOptions(this.selectedValues()) + "\n");
        if (!this.allowsMultiplePicks()) {
            this.log("  selectedValue: ", JSON.stableStringifyWithStdOptions(this.selectedValue()) + "\n");
        }

        this.log("  pickedItems: ", this.pickedItems(), "\n");
        this.log("--------------------------------");
    }
    
}.initThisClass());

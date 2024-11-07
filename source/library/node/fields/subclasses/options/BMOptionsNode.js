"use strict";

/**
 * @module library.node.fields.subclasses.options
 * @class BMOptionsNode
 * @extends BMField
 * @classdesc BMOptionsNode represents a field for selecting one or multiple options.
 * 
 * NOTES:
 * 
 *  computedValidValues() will use validValuesClosure() if it is set, otherwise it will use validValues().
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
 * BMField.setValueOnTarget() needs to handle both cases.
 * 
 */
(class BMOptionsNode extends BMField {
    
    /**
     * @static
     * @description Indicates if this node is available as a primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the BMOptionsNode.
     */
    initPrototypeSlots () {

        /**
         * @member {string} syncedValidItemsJsonString
         * @description Stores the JSON string of synced valid items.
         */
        {
            const slot = this.newSlot("syncedValidItemsJsonString", null);
            slot.setSlotType("String");
        }

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
         * @member {Array} validValues
         * @description An array of valid values for the options.
         */
        {
            const slot = this.newSlot("validValues", null);
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Array");
        }

        /**
         * @member {Function} validValuesClosure
         * @description A function that returns valid values for the options.
         */
        {
            const slot = this.newSlot("validValuesClosure", null);
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Function");
        }
    }

    /**
     * @description Initializes the prototype of the BMOptionsNode.
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
        this.setSubnodeProto(BMOptionNode);

    }
    
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
    debugTypeId () {
        return this.typeId() + "_'" + this.key() + "'";
    }
    
    /**
     * @description Sets the title of the options node.
     * @param {string} s - The new title.
     * @returns {BMOptionsNode} The current instance.
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
     * @returns {BMOptionsNode} The current instance.
     */
    setSubtitle (aString) {
        return this;
    }

    /**
     * @description Gets the subtitle of the options node.
     * @returns {string} The subtitle of the options node.
     */
    subtitle () {
        if (this.usesValidDict()) {
            return this.pickedNodePathStrings().join("\n");
        }
        const s = super.subtitle();
        return s;
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
     * @returns {Array<Array<BMOptionNode>>} An array of picked node paths.
     */
    pickedNodePaths () {
        return this.pickedLeafSubnodes().map(leafNode => leafNode.parentChainNodeTo(this));
    }

    /**
     * @description Gets the picked values.
     * @returns {Array} An array of picked values.
     */
    pickedValues () {
        return this.pickedLeafSubnodes().map(s => s.value());
    }

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
        const vv = this.validValues();
        return vv && vv.length && Type.isDictionary(vv[0]);
    }

    /**
     * @description Gets the picked leaf subnodes.
     * @returns {Array<BMOptionNode>} An array of picked leaf subnodes.
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

    pickedValue () {
        assert(!this.allowsMultiplePicks());
        const pickedValues = this.pickedValues();
        if (pickedValues.length === 0) {
            return null;
        } else if (pickedValues.length === 1) {
            return pickedValues.first();
        }
        throw Error.exception("BMOptionsNode.pickedValue() called with multiple picks");
    }

    /**
     * @description Handles the toggling of an option.
     * @param {BMOptionNode} anOptionNode - The option node that was toggled.
     * @returns {BMOptionsNode} The current instance.
     */
    didToggleOption (anOptionNode) {
        if (anOptionNode.isPicked() && !this.allowsMultiplePicks()) {
            this.unpickLeafSubnodesExcept(anOptionNode);
        }
        
        if (this.allowsMultiplePicks()) {
            this.setValue(this.formatedPickedValues());
        } else {
            this.setValue(this.pickedValue());
        }

        return this;
    }

    /**
     * @description Formats the picked values.
     * @returns {*} The formatted picked values.
     */
    formatedPickedValues () {
        const pickedValues = this.pickedValues(); // always an array
        return pickedValues;
    }

    /**
     * @description Sets the value on the target.
     * @param {*} v - The value to set.
     * @returns {BMOptionsNode} The current instance.
     */
    setValueOnTarget (v) {
        debugger;
        if (this.allowsMultiplePicks()) {
            if (!Type.isArray(v)) {
                console.warn("ERROR: BMOptionsNode.setValueOnTarget() called with non array value when allowsMultiplePicks is true");
                debugger;
            }
        } else {
            if (Type.isArray(v)) {
                // this isn't necessarily an error, but it is unexpected
                console.warn("WARNING: BMOptionsNode.setValueOnTarget() called with array when allowsMultiplePicks is true");
                debugger;
            }
        }
        super.setValueOnTarget(v);
        return this;
    }

    /**
     * @description Unpicks all leaf subnodes except the specified one.
     * @param {BMOptionNode} anOptionNode - The option node to exclude from unpicking.
     * @returns {BMOptionsNode} The current instance.
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
        return [BMOptionNode.type()];
    }

    /**
     * @description Handles the update of the validValues slot.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     */
    didUpdateSlotValidValues (oldValue, newValue) {
        if (newValue) {
            // No action needed
        }
    }

    /**
     * @description Syncs the options node from the target.
     * @returns {BMOptionsNode} The current instance.
     */
    syncFromTarget () {
        super.syncFromTarget();
        this.setupSubnodes();
        this.constrainValue();
        return this;
    }

    /**
     * @description Constrains the value to valid options.
     * @returns {BMOptionsNode} The current instance.
     */
    constrainValue () {
        return this;
    }
    
    /**
     * @description Gets the node tile link.
     * @returns {BMOptionsNode} The current instance.
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

    /**
     * @description Computes the valid values for the options.
     * @returns {Array} An array of valid values.
     */
    computedValidValues () {
        if (this.validValues()) {
            return this.validValues();
        } else if (this.validValuesClosure()) {
            return this.validValuesClosure()(this.target());
        }
        return [];
    }

    /**
     * @description Gets the valid values from leaf subnodes.
     * @returns {Array} An array of valid values.
     */
    validValuesFromLeafSubnodes () {
        return this.leafSubnodes().map(sn => sn.value());
    }

    /**
     * @description Sets up subnodes if they are empty.
     * @returns {BMOptionsNode} The current instance.
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
        if (this.allowsMultiplePicks()) {
            const values = this.value();
            assert(Type.isArray(values));
            return values.includes(v); // should we check for identity or equality?
        } else {
            return v === this.value();
        }
    }

    /**
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
                options: null
            };
        }   

        if (Type.isString(v) || Type.isNumber(v)) {
            return {
                label: v,
                subtitle: null,
                value: v,
                options: null
            };
        }
        
        throw Error.exception("BMOptionsNode.itemForValue() called with invalid value: " + v);
    }

    /**
     * @description Checks if the valid values match.
     * @returns {boolean} True if the valid values match.
     */
    validValuesMatch () {
        //console.log("testing validValuesMatch");
        //return false;

        const validValues = this.computedValidValues();
        const validItemsString = JSON.stableStringify(validValues);
        const validValuesMatch = this.syncedValidItemsJsonString() === validItemsString;
        /*
        //if (!validValuesMatch) {
            console.log("          validItemsString: " + validItemsString);
            console.log("syncedValidItemsJsonString: " + this.syncedValidItemsJsonString());
            console.log("          validValuesMatch: " + validValuesMatch);
        //}
        */
        return validValuesMatch;

        //const syncedValidItems = JSON.parse(this.syncedValidItemsJsonString());
        //return Type.hashCode64(this.computedValidValues()) === Type.hashCode64(syncedValidItems);
    }

    /**
     * @description Checks if the picks match.
     * @returns {boolean} True if the picks match.
     */
    picksMatch () {
        if (this.allowsMultiplePicks()) {
            return Type.valuesAreEqual(this.value(), this.pickedValues());
        } else {
            return Type.valuesAreEqual(this.value(), this.pickedValue());
        }
    }

    /**
     * @description Checks if the node needs to sync to subnodes. Returns true if the validValues or picked values don't match.
     * @returns {boolean} True if sync to subnodes is needed.
     */
    needsSyncToSubnodes () {
        if (this.target()) {
            const validValuesMatch = this.validValuesMatch();
            const picksMatch = this.picksMatch();
            const needsSync = (!validValuesMatch || !picksMatch);
            return needsSync;
        }
        return false;
    }

    /**
     * @description Sets up the subnodes.
     * @returns {BMOptionsNode} The current instance.
     */
    setupSubnodes () {
        if (this.needsSyncToSubnodes()) {
            this.removeAllSubnodes();
            const validItems = this.computedValidValues();

            validItems.forEach(v => {
                const item = this.itemForValue(v);
                this.addOptionNodeForDict(item);
            });
            this.setSyncedValidItemsJsonString(JSON.stableStringifyOnlyJson(validItems));

            this.leafSubnodes().forEach(sn => {
                sn.setIsPicked(this.targetHasPick(sn.value()));
            });

            if (this.needsSyncToSubnodes()) {
                console.log("\nERROR: OptionsNode '" + this.key() + "' not synced with target after setupSubnodes!");

                /*
                if (this.allowsMultiplePicks()) {
                    console.log("  value: ", JSON.stableStringify(this.value()));
                    console.log("  pickedValues: ", JSON.stableStringify(this.pickedValues()));
                    debugger;
                } else {
                    console.log("  value: ", JSON.stableStringify(this.value()));
                    console.log("  pickedValues: ", JSON.stableStringify(this.pickedValues()));
                }
                */

                // this can happen if the target has a value that is not in the validItems array
                //debugger;
                console.log("\nERROR: OptionsNode '" + this.key() + "' not synced with target after sync!");
                console.log("Let's try syncing the picked values to the target:");
                console.log("VALID VALUES:");
                console.log("  computedValidValues: " + JSON.stableStringify(this.computedValidValues()));
                console.log("  validValuesMatch: " + this.validValuesMatch());
                console.log("  picksMatch: " + this.picksMatch());

                console.log("  syncedValidItemsJsonString(): " +  this.syncedValidItemsJsonString());
                console.log("BEFORE:");
                console.log("  value: ", JSON.stableStringify(this.value()));
                
                if (this.allowsMultiplePicks()) {
                    console.log("  pickedValues: ", JSON.stableStringify(this.pickedValues()));
                } else {
                    console.log("  pickedValue: ", JSON.stableStringify(this.pickedValue()));
                }

                // In this case, let's set it to the first valid value.

                let resolvedValue = undefined;

                if (this.allowsMultiplePicks()) {
                    resolvedValue = this.pickedValues();
                    console.log("  allowsMultiplePicks so using pickedValues: ", resolvedValue);
                } else {
                    if (!this.pickedValue()) {
                        if (validItems.length > 0) {
                            resolvedValue = validItems.first().value;
                            assert(!Type.isUndefined(resolvedValue));
                            console.log("  no pickedValue so using first valid value: ", resolvedValue);
                        } else {
                            console.warn("  no validItems so no valid values to use!");
                            debugger;
                        }
                    } else {
                        resolvedValue = this.pickedValue();
                        console.log("  has pickedValue so using it: ", resolvedValue);
                    }
                }
                this.setValueOnTarget(resolvedValue);

                console.log("AFTER:");
                console.log("  value: ", this.value());

                Error.warn(!this.needsSyncToSubnodes(), "OptionsNode '" + this.key() + "' not synced with target after sync!");
                debugger;
            }
            this.didUpdateNodeIfInitialized();
        }
        return this;
    }
    
}.initThisClass());

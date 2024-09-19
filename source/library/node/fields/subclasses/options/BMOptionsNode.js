"use strict";

/**
 * @module library.node.fields.subclasses.options
 * @class BMOptionsNode
 * @extends BMField
 * @classdesc BMOptionsNode 

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
    
    /**
     * @static
     * @returns {boolean}
     * @description Indicates if the node is available as a primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initializes the prototype slots for the BMOptionsNode.
     */
    initPrototypeSlots () {

        /**
         * @property {string} syncedValidItemsJsonString
         */
        {
            const slot = this.newSlot("syncedValidItemsJsonString", null);
            slot.setSlotType("String");
        }

        /**
         * @property {boolean} allowsMultiplePicks
         */
        {
            const slot = this.newSlot("allowsMultiplePicks", false);
            slot.setLabel("Multiple picks");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @property {string} key
         */
        {
            const slot = this.overrideSlot("key", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        /**
         * @property {Array} validValues
         */
        {
            const slot = this.newSlot("validValues", null);
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Array");
        }

        /**
         * @property {Function} validValuesClosure
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
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setCanDelete(true)
        this.setNodeCanInspect(true)

        this.setKey("Options")
        this.setKeyIsVisible(true)
        this.setNodeCanEditTitle(true)

        this.setNodeCanReorderSubnodes(true)

        this.setNodeCanAddSubnode(true);
        this.setSummaryFormat("value");
        this.setNoteIconName("right-arrow");
        this.setSubnodeProto(BMOptionNode);
    }
    
    /**
     * @returns {string}
     * @description Returns the title of the node.
     */
    title () {
        return this.key()
    }

    /**
     * @returns {string}
     * @description Returns a debug type identifier for the node.
     */
    debugTypeId () {
        return this.typeId() + "_'" + this.key() + "'"
    }
    
    /**
     * @param {string} s
     * @returns {BMOptionsNode}
     * @description Sets the title of the node.
     */
    setTitle (s) {
        this.setKey(s)
        return this
    }

    /**
     * @returns {string|Array}
     * @description Returns a summary of the children nodes.
     */
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
    }

    /**
     * @param {string} aString
     * @returns {BMOptionsNode}
     * @description Sets the subtitle of the node (no-op in this class).
     */
    setSubtitle (aString) {
        return this
    }

    /**
     * @returns {string}
     * @description Returns the subtitle of the node.
     */
    subtitle () {
        if (this.usesValidDict()) {
            return this.pickedNodePathStrings().join("\n")
        }
        const s = super.subtitle()
        return s
    }

    // ... (rest of the methods)

}.initThisClass());

"use strict";

/** * @module library.node.fields.json
 */

/**
 * @class SvJsonNullField
 * @extends SvField
 * @classdesc Represents a JSON null field in the application.
 */

/**

 */
(class SvJsonNullField extends SvField {

    /**
     * @description Initializes prototype slots for the class.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values and settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
        //this.setNoteIconName("right-arrow")

        this.setKeyIsVisible(false);
        this.setValue("NULL");
        //this.setValueIsEditable(false)
        //this.overrideSlot("valueIsEditable", false).setInitValue(false)
    }

    serializeToJson (/*filterName, pathComponents = []*/) {
        return null;
    }

    deserializeFromJson (json, filterName, pathComponents = []) {
        // this might never be called as null is a special case
        assert(json === null, "Expected null for JSON path: " + pathComponents.join("/"));
        return this;
    }

    /**
     * @description Overrides the setValueIsEditable method to always set it to false.
     * @param {boolean} aBool - The boolean value (ignored in this implementation).
     * @returns {SvJsonNullField} Returns this instance for method chaining.
     * @category Configuration
     */
    setValueIsEditable (/*aBool*/) {
        /*
        if (aBool) {
            console.log(this.logPrefix(), ".setValueIsEditable true")
        }
        */
        return super.setValueIsEditable(false);
    }

}.initThisClass());

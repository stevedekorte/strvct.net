"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvActionField
 * @extends SvField
 * @classdesc An abstraction of a UI visible action that can be performed on an object.
 * The value is the action method name, the target is the field owner.
 */
(class SvActionField extends SvField {
    
    /**
     * @static
     * @returns {boolean} True if the class is available as a node primitive
     * @category Availability
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for the class
     * @category Initialization
     */
    initPrototypeSlots () {

        /**
         * @member {string} title - The title of the action field
         * @category Configuration
         */
        {
            const slot = this.overrideSlot("title", null);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("Title");
        }

        /**
         * @member {string} methodName - The name of the method to be called
         * @category Configuration
         */
        {
            const slot = this.newSlot("methodName", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        /**
         * @member {Object} info - Additional information for the action field
         * @category Configuration
         */
        {
            const slot = this.newSlot("info", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("JSON Object");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        // inherits isEnabled and isEditable slots from Field
        this.setShouldStore(true)
        this.setNodeTileIsSelectable(true)
        this.setNodeCanInspect(true)
        this.setKeyIsVisible(false)
        this.setValueIsVisible(false)
    }

    /**
     * @description Sets the title of the action field
     * @param {string} s - The title to set
     * @returns {SvActionField} This instance
     * @category Configuration
     */
    setTitle (s) {
        super.setTitle(s)
        return this
    }
    
    /**
     * @description Returns a summary of the action field
     * @returns {string} An empty string
     * @category Information
     */
    summary () {
        return ""
    }

    /**
     * @description Gets the target of the action
     * @returns {Object} The target object
     * @category Action
     */
    target () {
        const t = this._target;
        return t ? t : this.parentNode()
    }

    /**
     * @description Checks if the action can be performed
     * @returns {boolean} True if the action can be performed
     * @category Action
     */
    canDoAction () {
        const t = this.target()
        const m = this.methodName()
        return t && t[m]
    }

    /**
     * @description Performs the action
     * @returns {SvActionField} This instance
     * @category Action
     */
    doAction () {
        if (this.canDoAction()) {
            const func = this.target()[this.methodName()]
            
            if (Type.isFunction(func)) {
                func.call(this.target(), this)
            } else {
                console.warn("no method with this name")
            }
        } else {
            this.debugLog(" can't perform action ", this.methodName(), " on ", this.target())
        }
	    
	    return this
    }

    /**
     * @description Synchronizes the action field with its target
     * @category Synchronization
     */
    syncFromTarget () {
        super.syncFromTarget()
    
        const t = this.target()
        if (t) {
            const infoMethodName = this.methodName() + "ActionInfo"
            const method = t[infoMethodName];
            if (method) {
                const infoDict = method.apply(t, [])
                this.setActionInfo(infoDict)
            }
        }
    }

    /**
     * @description Prepares the action field for access
     * @returns {SvActionField} This instance
     * @category Lifecycle
     */
    prepareToAccess () {
        super.prepareToAccess()
        this.syncFromTarget()
        return this
    }
    
    /**
     * @description Sets the action info
     * @param {Object} infoDict - The action info dictionary
     * @returns {SvActionField} This instance
     * @category Configuration
     */
    setActionInfo (infoDict) {
        {
            const v = infoDict.isEnabled;
            if (v !== undefined) {
                if (!Type.isBoolean(v)) {
                    const methodName = this.methodName() + "ActionInfo";
                    console.warn(this.target().typeId() + "." + methodName + "() returned invalid value of '" + v + "' for isEnabled. Boolean value is required.")
                }
                assert(Type.isBoolean(v));
                this.setIsEnabled(v);
            }
        }

        {
            const v = infoDict.title
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v));
                this.setTitle(v);
            }
        }

        {
            const v = infoDict.subtitle
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v));
                this.setSubtitle(v);
            }
        }

        {
            const v = infoDict.isVisible 
            if (v !== undefined) {
                assert(Type.isBoolean(v));
                this.setIsVisible(v)
            }
        }

        return this
    }

    /**
     * @description Gets the action info
     * @returns {Object} The action info dictionary
     * @category Information
     */
    actionInfo () {
        return {
            isEnabled: this.isEnabled(),
            title: this.title(),
            subtitle: subthis.title(),
            isVisible: this.isVisible()
        }
    }

}.initThisClass());
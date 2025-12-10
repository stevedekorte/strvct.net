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
        return true;
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

        // should confirm
        {
            const slot = this.newSlot("shouldConfirm", false);
            slot.setDescription("If true, the action will be confirmed by the user.");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setLabel("Should Confirm");
        }

        // confirm title
        {
            const slot = this.newSlot("confirmTitle", null);
            slot.setDescription("The text to display in the confirmation panel title.");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        // confirm subtitle
        {
            const slot = this.newSlot("confirmSubtitle", null);
            slot.setDescription("The text to display in the confirmation panel subtitle.");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        // inherits isEnabled and isEditable slots from Field
        this.setShouldStore(true);
        this.setNodeTileIsSelectable(true);
        this.setNodeCanInspect(true);
        this.setKeyIsVisible(false);
        this.setValueIsVisible(false);
    }

    /**
     * @description Sets the title of the action field
     * @param {string} s - The title to set
     * @returns {SvActionField} This instance
     * @category Configuration
     */
    setTitle (s) {
        super.setTitle(s);
        return this;
    }

    /**
     * @description Returns a summary of the action field
     * @returns {string} An empty string
     * @category Information
     */
    summary () {
        return "";
    }

    /**
     * @description Gets the target of the action
     * @returns {Object} The target object
     * @category Action
     */
    target () {
        const t = this._target;
        return t ? t : this.parentNode();
    }

    /**
     * @description Checks if the action can be performed
     * @returns {boolean} True if the action can be performed
     * @category Action
     */
    canDoAction () {
        const t = this.target();
        const m = this.methodName();
        return t && t[m];
    }

    /**
     * @description Performs the action
     * @returns {SvActionField} This instance
     * @category Action
     */
    doAction () {
        this.asyncDoAction();
    }

    async asyncConfirmAction () {
        if (!SvPlatform.isBrowserPlatform()) {
            // we don't have an abstraction for this yet
            return true;
        }

        const actionName = this.title();
        const title = this.confirmTitle();
        const subtitle = this.confirmSubtitle() ? this.confirmSubtitle() : "Are you sure you want to '" + actionName + "'?";
        const panel = SvPanelView.clone().setTitle(title).setSubtitle(subtitle).setOptionDicts([
            { label: "Cancel", value: false },
            { label: actionName, value: true }
        ]);
        const result = await panel.asyncOpen();
        return result.value;
    }

    async asyncDoAction () {
        let canDoAction = this.canDoAction();

        if (this.shouldConfirm()) {
            canDoAction = await this.asyncConfirmAction();
        }

        if (canDoAction) {
            this.applyActionToTarget();
        }

        return this;
    }

    applyActionToTarget () {
        if (this.canDoAction()) {
            const func = this.target()[this.methodName()];

            if (Type.isFunction(func)) {
                const target = this.target();
                const result = func.call(target, this);
                if (result === this) {
                    throw new Error("doAction() returned this action field. Looks like you used the field name instead of the method name.");
                }
            } else {
                console.warn(this.logPrefix(), "no method with this name");
            }
        } else {
            console.warn(this.logPrefix(), " can't perform action ", this.methodName(), " on ", this.target());
        }
        return this;
    }

    /**
     * @description Synchronizes the action field with its target
     * @category Synchronization
     */
    syncFromTarget () {
        super.syncFromTarget();

        const t = this.target();
        if (t) {
            const infoMethodName = this.methodName() + "ActionInfo";
            const method = t[infoMethodName];
            if (method) {
                const infoDict = method.apply(t, []);
                this.setActionInfo(infoDict);
            } else {
                //console.warn(this.logPrefix(), "ActionField missing method with this name: ", infoMethodName);
            }
        }
    }

    /**
     * @description Prepares the action field for access
     * @returns {SvActionField} This instance
     * @category Lifecycle
     */
    prepareToAccess () {
        super.prepareToAccess();
        this.syncFromTarget();
        return this;
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
                    console.warn(this.target().svTypeId() + "." + methodName + "() returned invalid value of '" + v + "' for isEnabled. Boolean value is required.");
                }
                assert(Type.isBoolean(v), "isEnabled must be a boolean");
                this.setIsEnabled(v);
            }
        }

        {
            const v = infoDict.title;
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v), "title must be a string or null");
                this.setTitle(v);
            }
        }

        {
            const v = infoDict.subtitle;
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v), "subtitle must be a string or null");
                this.setSubtitle(v);
            }
        }

        {
            const v = infoDict.isVisible;
            if (v !== undefined) {
                assert(Type.isBoolean(v), "isVisible must be a boolean");
                this.setIsVisible(v);
            }
        }

        {
            const v = infoDict.shouldConfirm;
            if (v !== undefined) {
                assert(Type.isBoolean(v), "shouldConfirm must be a boolean");
                this.setShouldConfirm(v);
            }
        }

        {
            const v = infoDict.confirmTitle;
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v), "confirmTitle must be a string or null");
                this.setConfirmTitle(v);
            }
        }

        {
            const v = infoDict.confirmSubtitle;
            if (v !== undefined) {
                assert(Type.isString(v) || Type.isNull(v), "confirmSubtitle must be a string or null");
                this.setConfirmSubtitle(v);
            }
        }

        return this;
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
            subtitle: this.title(),
            isVisible: this.isVisible()
        };
    }

}.initThisClass());

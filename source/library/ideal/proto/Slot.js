/**
 * @module library.ideal.proto
 * @category Core
 */

"use strict";

/**
 * @class Slot
 * @extends Object
 * @classdesc Abstraction for a slot on a prototype.
 *
 * An array of these are stored in each prototype.
 *
 * - stores slot related data, such as:
 *   - default value
 *   - cloning policy
 *   - persistent policy
 *   - comment
 *   - whether slot can be:
 *   - edited
 *   - inspected
 *   - isPrivate
 *   - slotType
 * - handles auto generating getter/setter
 *
 * NOTE:
 *
 * TODO: hooks code is a mess, need to cleanup and modularize
 */

if (!SvGlobals.globals().ideal) {
    SvGlobals.globals().ideal = {};
}

SvGlobals.globals().ideal.Slot = (class Slot extends Object {

    /**
     * @category Initialization
     */
    initPrototypeSlots () {
        Object.defineSlot(this, "_slotNames", new Set());

        this.simpleNewSlot("owner", null); // typically a reference to a .prototype
        this.simpleNewSlot("name", false);
        this.simpleNewSlot("privateName", null);
        this.simpleNewSlot("setterName", null);
        this.simpleNewSlot("directSetterName", null);
        this.simpleNewSlot("initValue", null); // needed?

        // slot hook names
        this.simpleNewSlot("methodForWillGet", null);
        this.simpleNewSlot("methodForWillUpdate", null);
        this.simpleNewSlot("methodForDidUpdate", null);
        this.simpleNewSlot("methodForUndefinedGet", null);
        this.simpleNewSlot("methodForOnFinalized", null);
        this.simpleNewSlot("methodForShouldStoreSlot", null);
        //this.simpleNewSlot("methodNameCache", null)

        // getter
        this.simpleNewSlot("ownsGetter", true);
        this.simpleNewSlot("doesHookGetter", false);
        //this.simpleNewSlot("hookedGetterIsOneShot", false)
        //this.simpleNewSlot("isInGetterHook", false)

        // setter
        this.simpleNewSlot("ownsSetter", true); // if true, we'll create the setter
        this.simpleNewSlot("doesHookSetter", false); // if shouldStore, then auto post isDirty?
        this.simpleNewSlot("ownsValue", false); // if true, and the owner instance gets (for example) a shutdown method, it propogates to the slot value
        //this.simpleNewSlot("doesPostSetter", false); // posts a didUpdateSlot<SlotName> notification

        // storage related
        this.simpleNewSlot("shouldStoreSlot", false); // should hook setter
        this.simpleNewSlot("initProto", null); // clone this proto in init
        this.simpleNewSlot("finalInitProto", null); // if not set (e.g. by deserialization), clone this proto in finalInit
        //this.simpleNewSlot("shouldFinalInitAsSubnode", false); // if final init is used, it will add the init instance as a subnode use "isSubnode" instead
        this.simpleNewSlot("isSubnode", null); // in finalInit, add value as subnode if not already present
        this.simpleNewSlot("isSubnodeField", null); // in finalInit, create a field for the slot and add as subnode
        this.simpleNewSlot("isSubnodeFieldVisible", true); // sets isVisible on Field when created
        this.simpleNewSlot("fieldInspectorClassName", null);

        this.simpleNewSlot("valueClass", null); // declare the value should be a kind of valueClass
        //this.simpleNewSlot("field", null);
        this.simpleNewSlot("isLazy", false); // should hook getter
        this.simpleNewSlot("isWeak", false); // should hook getter

        // debugging
        //this.simpleNewSlot("doesBreakInGetter", false) // uses debugger
        //this.simpleNewSlot("doesBreakInSetter", false) // uses debugger

        // copying behavior
        //this.simpleNewSlot("initOp", "copyValue")
        //this.simpleNewSlot("validInitOps", new Set(["null", "lazy", "proto", "nop", "copyValue", "duplicate"]))
        this.simpleNewSlot("duplicateOp", "nop");
        this.simpleNewSlot("validDuplicateOps", new Set(["nop", "copyValue", "duplicate"]));
        this.simpleNewSlot("comment", null);
        this.simpleNewSlot("isPrivate", false);

        // inspector related
        // slotType is a string value, eg: "Boolean", "String", "Number", "Action" - can be used to find a class
        // to create an inspector node for the slotValue
        this.simpleNewSlot("slotType", null);
        this.simpleNewSlot("slotTypeDict", null); // a dictionary with kind (instance, class, primitive (null or undefined)), and name (class name if instance or class, or the primitive name if primitive)
        this.simpleNewSlot("canInspect", false);
        this.simpleNewSlot("canEditInspection", true);
        this.simpleNewSlot("label", null); // visible label on inspector
        this.simpleNewSlot("allowsNullValue", false); // used for validation
        this.simpleNewSlot("allowsUndefinedValue", false); // used for validation

        // valid values
        this.simpleNewSlot("validValues", null); // used for options field and validation
        this.simpleNewSlot("validValuesClosure", null);

        this.simpleNewSlot("validValuesArePermissive", false); // present valid values in UI but allow any value of correct type

        this.simpleNewSlot("validItems", null); // array of dictionaries with label, subtitle, value
        this.simpleNewSlot("validItemsClosure", null);


        this.simpleNewSlot("validatesOnSet", true);
        this.simpleNewSlot("allowsMultiplePicks", false);
        this.simpleNewSlot("inspectorPath", null); // if non-null, uses to create a path for the slot inspector
        this.simpleNewSlot("summaryFormat", "none"); // passed into slot inspector node

        this.simpleNewSlot("syncsToView", false); // if true, will hook slot setter to call this.scheduleSyncToView() on slotValue change (implemented by ViewableNode)
        this.simpleNewSlot("syncsToNode", false); // if true, will hook slot setter to call this.scheduleSyncToNode() on slotValue change (implemented by NodeView)

        this.simpleNewSlot("actionMethodName", null); // used by slots that will be represented by ActionFields to store the methodName
        //this.simpleNewSlot("actionShouldConfirm", false); // used by slots that will be represented by ActionFields to store whether the action should be confirmed - do with action info instead
        this.simpleNewSlot("annotations", null);

        this.simpleNewSlot("isVisible", null); // only set on finalInitProto if true or false, ignore if null

        // promise wrapper
        this.simpleNewSlot("isPromiseWrapped", false);
        this.simpleNewSlot("promiseResetsOnChangeOfSlotName", null);
    }

    setSlotType (s) {
        assert(Type.isString(s), "Slot.setSlotType called with non-string: " + s);
        this.setSlotTypeDict({
            kind: "instance",
            name: s
        });
        return this;
    }

    slotType () {
        // compose the slotType string from the dictionary
        const dict = this.slotTypeDict();
        if (dict) {
            assert(Type.isString(dict.name));
            return dict.name;
        }
        return null;
    }

    setIsLazy (aBool) {
        this._isLazy = aBool;
        if (aBool) {
            this.setAllowsUndefinedValue(true); // we use undefined to indicate that the value is not yet loaded
        }
        return this;
    }

    /**
     * @private
     * @category Valid Items
     * @description Converts a value into an item.
     * @param {*} v - The value to convert.
     * @returns {Object} An item.
     */
    itemForValue (v) {
        if (Type.isDictionary(v)) {
            // make sure value is set
            if (Type.isUndefined(v.value)) {
                v.value = v.label;
            }
            return v;
        }

        if (Type.isNull(v)) {
            return {
                label: "null",
                subtitle: null,
                value: null
            };
        }

        if (Type.isString(v) || Type.isNumber(v)) {
            return {
                label: v.toString(),
                subtitle: null,
                value: v
            };
        }

        throw Error.exception(this.svType() + ".itemForValue() called with invalid value: " + v);
    }

    /**
     * @private
     * @category Valid Items
     * @description Converts an array of values into an array of dictionaries with label and value
     */
    itemsForValues (values) {
        return values.map(v => {
            return this.itemForValue(v);
        });
    }

    /**
     * @category Valid Items
     * @description returns an array of dictionaries with label and value.
     * If _validItems is available, returns that, otherwise uses validValues if available, otherwise uses validValuesClosure if available, otherwise returns null.
     */
    validItems () {
        if (this._validItems) {
            return this._validItems;
        } else if (this._validValues) {
            return this.itemsForValues(this._validValues);
        }
        return null;
    }

    /**
     * @category Valid Items
     * @description returns a closure which returns an array of dictionaries with label, subtitle and value.
     * If _validItemsClosure is available, returns that, otherwise if validValuesClosure is available, uses that to convert values to items, otherwise returns null.
     */
    validItemsClosure () {
        if (this._validItemsClosure) {
            return this._validItemsClosure;
        } else if (this._validValuesClosure) {
            const self = this;
            return (context) => {
                return self.itemsForValues(self._validValuesClosure(context));
            };
        }
        return null;
    }


    /**
     * @category Validation
     * @description Sets the valid values array.
     * @param {Array} v - The valid values array.
     * @returns {Slot} The slot instance.
     */
    setValidValues (v) {
        if (this.thisClass().valueIsItems(v)) {
            throw new Error("Slot.setValidValues: called with items instead of values. Use setValidItems for dictionary items.");
        }

        this._validValues = v;

        // sanity check
        if (v) {
            const initValue = this.initValue();
            const isValid = this.validateValue(initValue);
            if (!isValid) {
                const errorMessage = "Slot '" + this.name() + "' initValue of: " + Type.typeDescription(initValue) + " is not in valid values: " + JSON.stableStringifyWithStdOptions(this._validValues);
                this.validateValue(initValue);
                throw new Error(errorMessage);
            }
        }
        return this;
    }

    static assertValidItems (items) {
        assert(items);
        assert(Type.isArray(items));
        assert(items.length);
        assert(items.every(item => Type.isDictionary(item)));
        assert(items.every(item => Type.isString(item.label)));
        assert(items.every(item => Type.isString(item.value) || Type.isNumber(item.value)));
    }

    static fixValidItems (items) {
        items.forEach(item => {
            assert(Type.isDictionary(item));
            assert(Type.isString(item.label));
            if (item.value === undefined) {
                item.value = item.label;
            }
        });
        return items;
    }

    static valueIsItems (v) {
        return v && Type.isArray(v) && v.length && Type.isDictionary(v.first());
    }

    setValidItems (items) {
        items = this.thisClass().fixValidItems(items); // should this be done on a copy?
        try {
            this.thisClass().assertValidItems(items);
        } catch (e) {
            console.warn("Slot '" + this.name() + "' assertValidItems failed: " + e);
            items = this.thisClass().fixValidItems(items);
            this.thisClass().assertValidItems(items);
        }
        this._validItems = items;
        return this;
    }

    valueIsValid (v) {
        if (this.thisClass().valueIsItems(v)) {
            return this.validItems().some(dv => dv.value === v);
        }
        return this._validValues.includes(v);
    }

    /**
     * @category Value Storage
     */
    setShouldStore (/*aBool*/) {
        throw new Error("Slot.setShouldStore should not be called on Slot");
    }

    /**
     * @category Value Storage
     */
    shouldStore () {
        throw new Error("Slot.shouldStore should not be called on Slot");
    }

    /**
     * @category Slot Creation
     */
    simpleNewSlot (slotName, initialValue) {
        // TODO: unify with Object.newSlot by separating out bit that creates a Slot instance
        const privateName = "_" + slotName;
        Object.defineSlot(this, privateName, initialValue);

        if (!this[slotName]) {
            const simpleGetter = function () {
                return this[privateName];
            };

            Object.defineSlot(this, slotName, simpleGetter);
        }

        const setterName = "set" + slotName.capitalized();

        if (!this[setterName]) {
            const simpleSetter = function (newValue) {
                this[privateName] = newValue;
                return this;
            };

            Object.defineSlot(this, setterName, simpleSetter);
        }

        this._slotNames.add(slotName);

        return this;
    }

    /**
     * @category Initialization
     */
    setFinalInitProto (aProto) {
        this._finalInitProto = aProto;
        if (aProto) {
            this.setOwnsValue(true); // if we instantiate the object for the slot, we assume we own it
            // note: this also causes setOwnerNode() to be set all values set on the slot -
            // including deserialization (as we set it on the prototype slot during initPrototypeSlots)

            if (this.slotType() === null) {
                if (aProto.svType() === "String") {
                    // if slotType is a string, set it to the proto type
                    this.setSlotType(aProto);
                } else {
                    // otherwise set it to the proto type
                    this.setSlotType(aProto.svType()); // hack
                }
            }
        }
        //this.setSyncsToView(true); // TODO: this ok? (added to make sure fields get updated when we call the slot setter)
        return this;
    }

    /**
     * @category Labels & Display
     */
    setLabelToCapitalizedSlotName () {
        let s = this.name().capitalized();
        // If the name was camel case, we want to split it into words.
        s = s.replace(/([A-Z])/g, " $1").trim();
        this.setLabel(s);
        return this;
    }


    /**
     * @category Annotations
     */
    annotations () {
        if (!this._annotations) {
            this._annotations = new Map();
        }
        return this._annotations;
    }

    /**
     * @category Annotations
     */
    setAnnotation (key, value) {
        this.annotations().set(key, value);
        return this;
    }

    /**
     * @category Annotations
     */
    hasAnnotation (key) {
        return this.annotations().has(key);
    }

    /**
     * @category Annotations
     */
    getAnnotation (key) {
        return this.annotations().get(key);
    }

    /**
     * @category Annotations
     */
    removeAnnotation () {
        this.annotations().delete(key);
        return this;
    }

    /**
     * @category Appearance
     */
    setValueWhiteSpace (s) {
        this.setAnnotation("valueWhiteSpace", s);
        return this;
    }

    /**
     * @category Appearance
     */
    setValueAllowsHtml (aBool) {
        this.setAnnotation("valueAllowsHtml", aBool);
        return this;
    }

    /**
     * @category Appearance
     */
    valueAllowsHtml () {
        return this.getAnnotation("valueAllowsHtml");
    }

    /**
     * @category Appearance
     */
    valueWhiteSpace () {
        return this.getAnnotation("valueWhiteSpace");
    }

    /**
     * @category Value Placeholders
     */
    setValuePlaceholder (s) {
        this.setAnnotation("valuePlaceholder", s);
        return this;
    }

    /**
     * @category Value Placeholders
     */
    valuePlaceholder () {
        return this.getAnnotation("valuePlaceholder");
    }

    /**
     * @category Subnode Configuration
     */
    setNodeFillsRemainingWidth (aBool) {
        this.setAnnotation("nodeFillsRemainingWidth", aBool);
        return this;
    }

    /**
     * @category Subnode Configuration
     */
    nodeFillsRemainingWidth () {
        return this.getAnnotation("nodeFillsRemainingWidth") === true;
    }

    /**
     * @category Subnode Configuration
     */
    setKeyIsVisible (aBool) {
        this.setAnnotation("keyIsVisible", aBool);
        return this;
    }

    /**
     * @category Subnode Configuration
     */
    keyIsVisible () {
        return this.getAnnotation("keyIsVisible") !== false;
    }

    /**
     * @category Standard Annotations
     */
    setShouldJsonArchive (aBool) {
        this.setAnnotation("shouldJsonArchive", aBool);
        return this;
    }

    /**
     * @category Standard Annotations
     */
    shouldJsonArchive () {
        return this.getAnnotation("shouldJsonArchive");
    }

    /**
     * @category Standard Annotations
     */
    setDescription (s) {
        this.setAnnotation("description", s);
        return this;
    }

    /**
     * @category Standard Annotations
     */
    description () {
        return this.getAnnotation("description");
    }

    /**
     * @category Standard Annotations
     */
    setDescriptionAndPlaceholder (s) {
        this.setDescription(s);
        this.setValuePlaceholder(s);
        return this;
    }

    /**
     * @category Examples
     */
    setExamples (anArray) {
        this.setAnnotation("examples", anArray);
        return this;
    }

    /**
     * @category Examples
     */
    examples () {
        return this.getAnnotation("examples");
    }

    /**
     * @category Read Only
     */
    setIsReadOnly (aBool) {
        this.setAnnotation("readOnly", aBool);
        return this;
    }

    /**
     * @category Read Only
     */
    isReadOnly () {
        return this.getAnnotation("readOnly");
    }

    /**
     * @category Required
     */
    setIsRequired (b) {
        this.setAnnotation("isRequired", b);
        return this;
    }

    /**
     * @category Required
     */
    isRequired () {
        const b = this.getAnnotation("isRequired");
        if (b === undefined) {
            return true; //  default to true
        }
        return b;
    }

    /**
     * @category JSON Schema (to set directly) if value is raw json
     */
    setJsonSchema (schema) {
        this.setAnnotation("jsonSchema", schema);
        return this;
    }

    /**
     * @category JSON Schema (to set directly) if value is raw json
     */
    jsonSchema () {
        return this.getAnnotation("jsonSchema");
    }

    /**
     * @category Items Type
     */
    validJsonSchemaItemsTypes () {
        const validItemsTypes = ["null", "boolean", "object", "array", "number", "string", "integer"];
        return validItemsTypes;
    }

    /**
     * @category Items Type
     */
    setJsonSchemaItemsType (s) {
        assert(Type.isString("string"));
        //assert(this.validJsonSchemaItemsTypes().contains(s));
        this.setAnnotation("jsonSchemaItemsType", s);
        return this;
    }

    /**
     * @category Items Type
     */
    jsonSchemaItemsType () {
        return this.getAnnotation("jsonSchemaItemsType");
    }

    /**
     * @category Items Description
     */
    setJsonSchemaItemsDescription (s) {
        this.setAnnotation("jsonSchemaItemsDescription", s);
        return this;
    }

    /**
     * @category Items Description
     */
    jsonSchemaItemsDescription () {
        return this.getAnnotation("jsonSchemaItemsDescription");
    }

    /**
     * @category Items Ref
     */
    setJsonSchemaItemsRef (s) {
        this.setAnnotation("jsonSchemaItemsRef", s);
        return this;
    }

    /**
     * @category Items Ref
     */
    jsonSchemaItemsRef () {
        return this.getAnnotation("jsonSchemaItemsRef");
    }

    /**
     * @category Items Is Unique
     */
    setJsonSchemaItemsIsUnique (b) {
        this.setAnnotation("jsonSchemaItemsIsUnique", b);
        return this;
    }

    /**
     * @category Items Is Unique
     */
    jsonSchemaItemsIsUnique () {
        return this.getAnnotation("jsonSchemaItemsIsUnique");
    }

    /**
     * @category Is In JSON Schema
     */
    setIsInJsonSchema (b) {
        this.setAnnotation("isInJsonSchema", b);
        return this;
    }

    /**
     * @category Is In JSON Schema
     */
    isInJsonSchema () {
        return this.getAnnotation("isInJsonSchema");
    }

    setJsonSchemaPattern (s) {
        this.setAnnotation("jsonSchemaPattern", s);
        return this;
    }

    jsonSchemaPattern () {
        return this.getAnnotation("jsonSchemaPattern");
    }

    /**
     * @category Inspector
     */
    fieldInspectorClassName () {
        if (Type.isString(this._fieldInspectorClassName)) {
            return this._fieldInspectorClassName;
        }
        return this.defaultFieldInspectorClassName();
    }

    /**
     * @category Inspector
     */
    defaultFieldInspectorClassName () {
        const slotType = this.slotType();
        assert(!Type.isNull(slotType), "slotType is null for slot: " + this.name());
        let fieldName = "Sv" + slotType + "Field";

        if (this.validValues() || this.validValuesClosure() || this.validItems() || this.validItemsClosure()) {
            fieldName = "SvOptionsNode";
        }

        return fieldName;
    }

    /**
     * @category Inspector
     */
    newInspectorField () {
        const slotType = this.slotType();
        if (slotType /*&& this.canInspect()*/) {
            const fieldName = this.fieldInspectorClassName();
            let proto = SvGlobals.globals()[fieldName];

            if (!proto) {
                //let nodeName = "Sv" + slotType + "Node";
                const nodeName = "SvPointerField";
                proto = SvGlobals.globals()[nodeName];
            }

            if (proto) {
                const field = proto.clone();
                field.setKey(this.name());
                field.setKeyIsEditable(false);
                field.setValueMethod(this.name());
                field.setValueIsEditable(this.canEditInspection());
                field.setCanDelete(false);

                if (Type.isString(this.valueWhiteSpace())) {
                    field.setValueWhiteSpace(this.valueWhiteSpace());
                }


                if (Type.isBoolean(this.valueAllowsHtml())) {

                    field.setValueAllowsHtml(this.valueAllowsHtml());
                }

                if (field.setValuePlaceholderText) {
                    const p = this.valuePlaceholder();
                    if (p) {
                        field.setValuePlaceholderText(this.valuePlaceholder());
                    }
                }
                //assert(!field.nodeCanAddSubnode());

                if (this.label()) {
                    if (slotType === "Action") { // TODO: hack - find a uniform way to handle this
                        field.setTitle(this.label());
                        field.setMethodName(this.actionMethodName());
                        //field.setShouldConfirm(this.actionShouldConfirm());
                    } else {
                        field.setKey(this.label());
                    }
                }

                if (this.validItems()) {
                    if (field.setValidItems === undefined) {
                        throw new Error("field " + field.svType() + " does not support setValidItems.");
                    }
                    field.setValidItems(this.validItems());
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks());
                    field.setNodeSubtitleIsChildrenSummary(true);
                } else if (this.validItemsClosure()) {
                    field.setValidItemsClosure(this.validItemsClosure());
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks());
                    field.setNodeSubtitleIsChildrenSummary(true);
                }
                return field;
            }
        }
        return null;
    }

    /**
     * @private
     * @category Valid Items
     * @description Computes the valid items for the slot.
     * @returns {Array|null} The valid items, or null if neither validItems nor validItemsClosure are set.
     */
    computedValidItems () {
        if (this.validItems()) {
            return this.validItems();
        } else if (this.validItemsClosure()) {
            return this.validItemsClosure()();
        }
        return null;
    }

    /**
     * @category Value Validation
     */
    validDuplicateOps () {
        return new Set(["nop", "copyValue", "duplicate"]);
    }

    /**
     * @category Value Validation
     */
    setDuplicateOp (aString) {
        assert(this.validDuplicateOps().has(aString));
        this._duplicateOp = aString;
        return this;
    }

    /**
     * @category Initialization
     */
    setName (aName) {
        assert(Type.isString(aName) && aName.trim().length > 0);
        this._name = aName;
        const n = this.name().capitalized();
        this.setPrivateName("_" + aName);
        this.setSetterName("set" + n);

        //this.updateCachedMethodNames();

        this.setDirectSetterName("directSet" + n); // -> getCachedMethodNameFor("directSet")
        this.setMethodForWillGet("willGetSlot" + n);
        this.setMethodForDidUpdate("didUpdateSlot" + n);
        this.setMethodForWillUpdate("willUpdateSlot" + n);
        this.setMethodForUndefinedGet("onUndefinedGet" + n); // for lazy slots
        this.setMethodForOnFinalized("onFinalizedSlot" + n); // for weak slots
        this.setMethodForShouldStoreSlot("shouldStoreSlot" + n); // for weak slots
        return this;
    }

    /**
     * @category Method Name Cache
     */
    copyFrom (aSlot) {
        // This is used by overrideSlot().
        // Need to be careful about non json slot values.

        this._slotNames.forEach(slotName => {
            const privateName = "_" + slotName;
            let value = aSlot[privateName];

            if (slotName === "owner") {
                if (value.isPrototype()) {
                    // assume this gets set after the copy if needed
                }
            } else if (slotName === "initProto") {
                // ok to copy this
            //} else if (!Type.isDeepJsonType(value)) {
            } else {
                if (Type.isDeepJsonType(value)) {
                    value = Type.deepCopyForValue(value);
                } else {
                    // we'll use the value - but this may be dangerous!
                    if (Type.isClass(value)) {
                        // ok to copy value
                    } else if (!Type.isUndefined(value)) {
                        throw new Error("copyFrom received a value that is not a class or undefined: " + Type.typeDescription(value));
                    }
                }
            }

            this[privateName] = value;
            /*
            const setterName = "set" + slotName.capitalized()
            const v = aSlot[slotName].apply(aSlot)
            this[setterName].call(this, v)
            */
        });
        return this;
    }

    /**
     * @category Initialization
     */
    autoSetGetterSetterOwnership () {
        this.setOwnsGetter(!this.alreadyHasGetter());
        this.setOwnsSetter(!this.alreadyHasSetter());
        return this;
    }

    /**
     * @category Hooks
     */
    hookNames () {
        const hookMethodNames = this._slotNames.filter(n => n.beginsWith("methodFor"));
        const hookNames = hookMethodNames.map(n => this[n].apply(this));
        return hookNames;
    }

    /**
     * @category Hooks
     */
    ownerImplemnentsdHooks () {
        return true;
    }

    /**
     * @category Hooks
     */
    setDoesHookSetter (aBool) {
        if (this._doesHookSetter !== aBool) {
            this._doesHookSetter = aBool;
            if (aBool) {
                if (this.alreadyHasSetter() && !this.ownsSetter()) {
                    const msg = this.owner().svType() + "." + this.setterName() + "() exists, so we can't hook it - fix by calling slot.setOwnsSetter(true)";
                    console.log(msg);
                    throw new Error(msg);
                }
                // this.setOwnsSetter(true);
            }
            //this.setupSetter();
        }
        return this;
    }

    /**
     * @category Setup
     */
    setupInOwner () {
        this.autoSetGetterSetterOwnership();
        this.setupValue();
        this.setupGetter();
        this.setupSetter();
        return this;
    }

    /**
     * @category Setup
     */
    setupValue () {
        let v = this.initValue();
        if (Type.isMutable(v) && !Type.isClass(v)) {
            v = v.deepCopy(); // not sure this is always correct...
        }
        Object.defineSlot(this.owner(), this.privateName(), v);
        return this;
    }

    /**
     * @category Getter
     */
    alreadyHasGetter () {
        return Object.hasOwn(this.owner(), this.getterName()); // TODO: hasOwnProperty?
    }

    /**
     * @category Setup
     */
    setupGetter () {
        if (this.ownsGetter()) {
            Object.defineSlot(this.owner(), this.getterName(), this.autoGetter());
            this.setupPromiseWrapperIfNeeded();
        }
        return this;
    }

    /**
     * @category Getter
     */
    alreadyHasSetter () {
        return Object.hasOwn(this.owner(), this.setterName());  // TODO: hasOwnProperty?
    }

    /**
     * @category Setup
     */
    setupSetter () {
        if (this.ownsSetter()) {
            Object.defineSlot(this.owner(), this.setterName(), this.autoSetter());
        }
        return this;
    }

    /**
     * @category Getter
     */
    getterName () {
        return this.name();
    }

    /**
     * @category Getter
     */
    makeDirectGetter () {
        Object.defineSlot(this.owner(), this.getterName(), this.directGetter());
        return this;
    }

    /**
     * @category Getter
     */
    directGetter () {
        const privateName = this.privateName();
        const func = function (arg) {
            assert(arg === undefined, "getter should not be called with arguments");
            return this[privateName];
        };
        return func;
    }

    /**
     * @category Getter
     */
    makeDirectGetterOnInstance (anInstance) {
        Object.defineSlot(anInstance, this.getterName(), this.directGetter());
        return this;
    }

    /**
     * @category Getter
     */
    autoGetter () {
        const slot = this;
        return function (arg) {
            assert(arg === undefined, "getter should not be called with arguments");
            return this.getSlotValue(slot);
        };
    }

    autoLazyGetter () {
        const slot = this;
        return async function (arg) {
            assert(arg === undefined, "getter should not be called with arguments");
            const pid = this[slot.privateNameLazyPid()];
            if (pid) {
                const obj = await this.defaultStore().asyncObjectForPid(pid);
                return obj;
            }
            return undefined;
        };
    }

    /**
     * @category Value Validation
     * @description Validates a value against the slot's valid items and type.
     * @param {any} v - The value to validate.
     * @returns {boolean} True if the value is valid, false otherwise.
     */
    validateValue (v) {
        if (v === undefined) {
            return this.allowsUndefinedValue();
        }

        if (v === null) {
            return this.allowsNullValue();
        }

        if (v.shouldStore === undefined) {
            if (this.shouldStoreSlot() === true) {
                const errorMsg = "slot '" + this.name() + "'value (" + v.svDebugId() + ") shouldStore is undefined but slot shouldStoreSlot is true";
                console.warn(errorMsg);
                //throw new Error(errorMsg);
                return false;
            }
        } else if (this.shouldStoreSlot() && !v.shouldStore()) {
            //const errorMsg = "slot '" + this.name() + "' value (" + v.svDebugId() + ") shouldStore (" + v.shouldStore() + ") does not match slot shouldStoreSlot (" + this.shouldStoreSlot() + ")";
            //console.warn(errorMsg);
            //throw new Error(errorMsg);
            //return false;
        }

        // type validation
        const slotType = this.slotType();
        if (slotType) {
            if (!this.validateValueTypeOnly(v)) {
                return false;
            }
        }

        if (this.validValuesArePermissive()) {
            return true;
        }

        const validItems = this.validItems();
        // TODO: fix computedValidItems
        //const validItems = this.computedValidItems(); // closure may reference unloaded classes...

        if (validItems !== null) {
            const valueIsInValidItems = function (v) {
                return validItems.detect(item => {
                    return Type.valuesAreEqual(item.value, v);
                });
            };


            if (this.allowsMultiplePicks()) {
                if (!Type.isArray(v)) {
                    assert(!Type.isArray(v));
                    console.warn("slot '" + this.name() + "' allows multiple picks, but value is not an array: " + Type.typeDescription(v));
                    return false;
                }
                return v.every(value => valueIsInValidItems(value));
            }

            return valueIsInValidItems(v);
        }

        return true;
    }

    validateValueTypeOnly (v) {
        // type validation
        const slotType = this.slotType();
        if (slotType) {
            // NOTE: need to handle special cases like:
            // -"Classname class" (indicates it's a class reference)
            // - "JSON Object" (indicates it's a JSON object type)

            if (slotType === "JSON Object") {
                return Type.isDeepJsonType(v);
            } else {
                // FAST BUT INCOMPLETE CHECK
                let slotTypeClass = this.slotTypeClass();
                if (Type.valueIsInstanceOfClass(v, slotTypeClass)) {
                    return true;
                }

                // SLOW FULL CHECK
                let result = Type.typeNameIsKindOf(Type.typeName(v), slotType);
                //let result = Type.typeNameIsKindOf(Type.typeName(v), Type.instanceNameForClassName(slotType));
                if (result) {
                    return true;
                }
                console.log("Slot '" + this.name() + "' validateValue: invalid value type '" + Type.typeName(v) + "' for slot type '" + slotType + "'");
                Type.typeNameIsKindOf(Type.typeName(v), Type.instanceNameForClassName(slotType));
                return false;
            }
        }

        // if no slot type, it's valid
        return true;
    }

    slotTypeClass () {
        if (!this._slotTypeClass) {
            this._slotTypeClass = Type.classForClassTypeName(this.slotType());
        }
        return this._slotTypeClass;
    }

    /**
     * @category Setter
     */
    autoSetter () {
        const slot = this;
        return function (newValue, invalidSecondArgumentCatcher) {
            assert(invalidSecondArgumentCatcher === undefined, "autoSetter() should not be called with a 2nd argument");
            const valueDescription = function (v) {
                let vString = String(v);
                vString = vString.length < 20 ? vString : (vString.slice(0, 20) + "...");
                if (Type.isString(v)) {
                    vString = "'" + vString + "'";
                }
                return Type.typeName(v) + " " + vString;
            };

            if (slot.validatesOnSet()) {
                const isValid = slot.validateValue(newValue);
                if (!isValid) {
                    const errorMsg = "WARNING: " + this.logPrefix() + "." + slot.setterName() +  "() called with " + valueDescription(newValue) + " expected type '" + slot.slotType() + "'";
                    console.warn(errorMsg);
                    //throw new Error(errorMsg);
                    slot.validateValue(newValue);


                    const initValue = slot.initValue();
                    if (initValue) {
                        if (!slot.validateValue(initValue)) {
                            const errorMsg = "WARNING: " + this.logPrefix() + "." + slot.setterName() +  "() called with " + valueDescription(newValue) + " expected type '" + slot.slotType() + "'";
                            console.warn(errorMsg);
                            throw new Error(errorMsg);
                        }
                    }

                    // Type Checking and Conversion

                    if (slot.slotType() === "String" && Type.isNumber(newValue)) {
                        console.log("RESOLUTION: converting number to string");
                        newValue = String(newValue);
                    } else if (slot.slotType() === "String" && Type.isError(newValue)) {
                        console.log("RESOLUTION: converting error to string");
                        newValue = String(newValue.message);
                    } else if (slot.slotType() === "Number" && Type.isString(newValue)) {
                        console.log("RESOLUTION: converting string to number");
                        newValue = Number(newValue);
                    } else { // It's not just a type conversion issue...
                        slot.validateValue(newValue); // so we can step into it

                        console.log("RESOLUTION: setting value to initValue: ", initValue);
                        let resolvedValue = initValue;
                        if (!slot.validateValue(resolvedValue)) { // try valid items next
                            console.log("RESOLUTION: setting value to initValue: ", resolvedValue);
                            const validItems = slot.validItems();
                            if (!Type.isNull(validItems)) {
                                resolvedValue = validItems.first();
                                if (!slot.validateValue(resolvedValue)) {
                                    console.log("RESOLUTION: setting value to validItems.first(): ", resolvedValue);
                                    throw new Error(errorMsg);
                                }
                            }
                        }
                        newValue = resolvedValue;
                    }
                    //this.scheduleMethod("didMutate", slot.name()); // got a stack overflow for this
                    if (this.shouldStore()) {
                        const store = this.defaultStore();
                        if (store.hasActiveObject(this)) {

                            store.forceAddDirtyObject(this); // not ideal, but let's see if it works
                        }
                    }

                    console.log("RESOLUTION: setting value to " + valueDescription(newValue) + "\n\n");
                }
            }

            if (slot.ownsValue()) {
                if (Type.isNullOrUndefined(newValue)) {
                    const oldValue = slot.onInstanceRawGetValue(this);
                    if (oldValue && oldValue.setOwnerNode) {
                        if (oldValue.ownerNode() === this) { // safety check
                            oldValue.setOwnerNode(null);
                        }
                    }
                } else if (newValue.setOwnerNode) {
                    // this is a Node specific feature so might not belong here
                    // but it's fundamental enough that we might want to support it elsewhere
                    newValue.setOwnerNode(this); // this is the instance
                }
            }

            return this.setSlotValue(slot, newValue);
        };
    }

    /**
     * @category Setter
     */
    makeDirectSetter () {
        Object.defineSlot(this.owner(), this.setterName(), this.directSetter());
        return this;
    }

    /**
     * @category Setter
     */
    directSetter () {
        const privateName = this.privateName();
        const func = function (newValue) {
            this[privateName] = newValue;
            return this;
        };
        return func;
    }

    /**
     * @category Call Helpers
     */
    onInstanceRawGetValue (anInstance) {
        return anInstance[this.privateName()];
    }

    /**
     * @category Call Helpers
     */
    onInstanceGetValue (anInstance) {
        return anInstance[this.getterName()].apply(anInstance);
    }

    /**
     * @category Call Helpers
     */
    onInstanceSetValue (anInstance, aValue) {
        const m = anInstance[this._setterName];
        if (Type.isUndefined(m)) {
            throw new Error(anInstance.svType() + " is missing setter '" + this._setterName + "'");
        }
        return m.call(anInstance, aValue); // not consistent with rawset to return this...
    }

    /**
     * @category Call Helpers
     */
    onInstanceRawSetValue (anInstance, aValue) {
        anInstance[this._privateName] = aValue;
        return this;
    }

    /**
     * @category StoreRefs for lazy slots
     */
    onInstanceSetValueRef (anInstance, aRef) {
        anInstance.lazyRefsMap().set(this.name(), aRef);
        return this;
    }

    /**
     * @category StoreRefs for lazy slots
     */
    onInstanceGetValueRef (anInstance) {
        return anInstance.lazyRefsMap().get(this.name());
    }

    privateNameLazyPid () {
        return this.privateName() + "LazyPid"; // privateName begins with _
    }

    /**
     * @category Call Helpers
     */
    copyValueFromInstanceTo (anInstance, otherInstance) {
        if (this.isLazy()) {
            const k = this.privateNameLazyPid();
            otherInstance[k] = anInstance[k];
        }

        const v = this.onInstanceGetValue(anInstance);
        if (v !== undefined) {
            this.onInstanceSetValue(otherInstance, v);
        }
        return this;
    }

    /**
     * @category Initialization
     */
    finalInitProtoClass () {
        let finalInitProto = this._finalInitProto;
        if (typeof(finalInitProto) === "string") {
            const finalInitClass = SvGlobals.globals()[finalInitProto];
            assert(finalInitClass, "missing finalInitProto class '" + finalInitProto + "'");
            finalInitProto = finalInitClass;
        }
        return finalInitProto;
    }

    /**
     * @category Initialization
     */
    onInstanceFinalInitSlot (anInstance) {
        assert(this.slotType() !== null, " slotType is null for " + anInstance.svType() + "." + this.name());

        const finalInitProto = this.finalInitProtoClass(); //this._finalInitProto;

        if (finalInitProto) {

            let oldValue = this.onInstanceGetValue(anInstance);

            if (oldValue && oldValue.svType() !== finalInitProto.svType()) {
                const warning = "slot '" + this.name() + "' finalInitProto type (" + finalInitProto.svType() + ") does not match existing value (" + oldValue.svType() + ") from Store";
                console.warn(warning);
                //throw new Error(warning);
                oldValue = null; // let the code below override it
            }

            if (Type.isNullOrUndefined(oldValue)) {
            //if (oldValue === null) {

                /*
                let newValue;
                if (this.isSubnode()) { // see if it's already a subnode
                    const oldSubnode = anInstance.firstSubnodeOfType(finalInitProto);
                    if (oldSubnode) {
                        newValue = oldSubnode;
                    } else {
                        const newSubnode = finalInitProto.clone();
                        this.addSubnode(newSubnode);
                        newValue = newSubnode;
                    }
                } else {
                    newValue = finalInitProto.clone();
                }
                */

                /*
                if (typeof(finalInitProto) === "string") {
                    const finalInitClass = SvGlobals.globals()[finalInitProto];
                    assert(finalInitClass, "missing finalInitProto class '" + finalInitProto + "'");
                    finalInitProto = finalInitClass;
                }
                    */

                const newValue = finalInitProto.clone();

                if (Type.isBoolean(this.isVisible()) && Type.isFunction(newValue.setIsVisible)) {
                    newValue.setIsVisible(this.isVisible());
                }

                this.onInstanceSetValue(anInstance, newValue);

                if (newValue.setOwnerNode) { // it might not be a SvNode
                    newValue.setOwnerNode(anInstance); // should this be inside the setter? Maybe if slot.doesOwnValue(true)?
                }

                /*
                if (this.shouldFinalInitAsSubnode()) {
                    anInstance.addSubnode(newValue);

                    const title = this.finalInitTitle();
                    if (title) {
                        newValue.setTitle(title);
                        anInstance.subnodeWithTitleIfAbsentInsertProto(title, finalInitProto);
                    } else {
                        anInstance.addSubnode(newValue);
                    }
                }
                */
            }
        }

        if (this.isSubnode()) {
            // sanity check - we don't typically want to add it automatically if subnodes are stored
            assert(anInstance.shouldStoreSubnodes() === false);
            const value = this.onInstanceGetValue(anInstance);
            assert(!Type.isNullOrUndefined(value), anInstance.svType() + "." + this.name() + " ivar is undefined for *subnode* slot - maybe you meant to use setIsSubnodeField(true)?");
            anInstance.assertValidSubnodeType(value); // tmp - this is also done in addSubnode
            anInstance.addSubnode(value);
        }

        if (this.isSubnodeField()) {
            assert(anInstance.shouldStoreSubnodes() === false, "error on slot definition '" + this.name() + "' subnode fields are not supported with shouldStoreSubnodes");
            anInstance.addSubnodeFieldForSlot(this);
        }
    }

    /**
     * @category Initialization
     */
    onInstanceInitSlot (anInstance) {
        //assert(Reflect.has(anInstance, this.privateName())) // make sure slot is defined - this is true even if it's value is undefined
        //let defaultValue = anInstance[this._privateName];

        /*
        const op = this.initOp();
        assert(this.validInitOps().contains(op)); // TODO: put on setter instead

        const opMethods = {
            "null" : () => {
                this.onInstanceSetValue(anInstance, null);
            },

            "lazy" : () => {
                const obj = this.initProto().clone();
                anInstance[this.privateName()] = obj;
            },

            "proto" : () => {
                const obj = this.initProto().clone();
                this.onInstanceSetValue(anInstance, obj);
            },

            "nop" : () => {
            },

            "copyValue" : () => {
                this.onInstanceSetValue(anInstance, defaultValue);
            },

            "duplicate" : () => {
                if (defaultValue) {
                    const obj = defaultValue.duplicate();
                    this.onInstanceSetValue(anInstance, obj);
                }
            },
        }

        opMethods[op].apply(this);
        */

        const initProto = this._initProto;


        if (this.isLazy()) {
            anInstance[this.privateNameLazyPid()] = undefined; // undefined indicates that the value is not yet loaded
        }

        if (initProto) {
            assert(!this.isLazy(), "isLazy is true for slot '" + this.name() + "' but initProto is set");
            const obj = initProto.clone();
            this.onInstanceSetValue(anInstance, obj);
        } /*
        else if (this._initValue) {
            this.onInstanceSetValue(anInstance, this._initValue);
        }
        */

        /*
        if (this.field()) {
            // duplicate the field instance owned by the slot,
            // add it as a subnode to the instance,
            // and sync it to the instance's slot value
            const newField = this.field().duplicate();
            anInstance.addSubnode(newField);
            newField.getValueFromTarget();
        }
        */
    }

    /**
     * @category Call Helpers
     */
    onInstanceLoadRef (anInstance) {
        const storeRef = this.onInstanceGetValueRef(anInstance);
        if (storeRef) {

            //console.warn(anInstance.svTypeId() + "." + this.name() + " [" + anInstance.title() + "] - loading storeRef");
            //console.warn(anInstance.title() + " loading storeRef for " + this.name());
            const obj = storeRef.unref();
            /*
            //console.warn("   loaded: " + obj.svType());
            anInstance[this.privateName()] = obj; // is this safe? what about initialization?
            //this.onInstanceSetValue(anInstance, obj);
            this.onInstanceSetValueRef(anInstance, null);
            */

            const setter = anInstance[this.setterName()];
            setter.apply(anInstance, [obj]); // WARNING: this may mark objects as dirty

        } else {
            //console.warn(anInstance.svTypeId() + " unable to load storeRef - not found");
            //console.warn(anInstance.svTypeId() + ".shouldStoreSubnodes() = " + anInstance.shouldStoreSubnodes());
            //throw new Error("");
        }
    }

    /**
     * @category Call Helpers
     */
    hasSetterOnInstance (anInstance) {
        return Type.isFunction(anInstance[this.setterName()]);
    }

    /**
     * @category Should Store On Instance
     */
    shouldStoreSlotOnInstance (anInstance) {
        const methodName = this.methodForShouldStoreSlot();
        const method = anInstance[methodName];
        if (method) {
            const v = method.apply(anInstance);
            if (Type.isBoolean(v)) { // allows instance to result null to use slot's own value
                return v;
            }
        }
        return this.shouldStoreSlot();
    }

    /**
     * @category Should Store On Instance
     */
    setShouldStoreSlotOnInstance (anInstance, aBool) {
        const k = this.shouldStoreSlotOnInstancePrivateName();
        Object.defineSlot(anInstance, k, aBool);
        return aBool;
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaType () {
        //const validJsonTypeValues = ["null", "boolean", "object", "array", "number", "string", "integer"];

        let type = this.slotType();

        // what about integer?

        const passThroughTypes = new Set(["String", "Number", "Boolean", "Array"]);

        if (passThroughTypes.has(type)) {
            return type.toLowerCase();
        }

        if (type === "Action") {
            return null;
        }

        return "object";
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaTitle () {
        return this.name(); // slot name
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaDescription () {
        return this.description();
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaExamples () {
        return this.examples();
    }

    /**
     * @category JSON Schema
     */
    jsonSchemeAddRanges (schema) {
        const a = this.jsonSchemaEnum();
        if (a) {
            const enumArray = a.shallowCopy();

            if (schema.type === "number") {
                enumArray.sort((a, b) => a - b);

                const hasANonInteger = enumArray.filter(v => { return !Type.isInteger(v); }).length > 0;
                if (!hasANonInteger) {
                    schema.type = "integer";
                }

                const isContiguous = enumArray.length > 1 && enumArray.every((v, i, a) => { return i === 0 || v === a[i - 1] + 1; });
                if (isContiguous) {
                    // items were sorted, so we can just grab the first and last
                    const min = enumArray.first();
                    const max = enumArray.last();
                    schema.minimum = min;
                    schema.maximum = max;
                } else {
                    schema.enum = enumArray;
                }
            } else {
                schema.enum = enumArray;
            }
        }
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaEnum () {
        const enumArray = [];

        const validItems = this.computedValidItems();
        if (validItems) {
            validItems.forEach(v => {
                assert(Type.isDeepJsonType(v));
                if (!Type.isNull(v) && v.value !== undefined) {
                    enumArray.push(v.value);
                } else {
                    enumArray.push(v);
                }
            });

            if (this.allowsNullValue() && !validItems.detect(item => Type.isNull(item.value))) {
                enumArray.push(null);
            }
        }

        return enumArray.length ? enumArray : undefined;
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaProperties (refSet) {
        assert(refSet);
        const proto = this.finalInitProtoClass();
        if (proto) {
            if (Type.isString(proto)) {
                return {
                    "$ref": SvNode.jsonSchemaRefForTypeName(proto, refSet)
                };
            } else {
                return {
                    "$ref": proto.jsonSchemaRef(refSet)
                };
            }
            //return proto.jsonSchemaProperties(refSet);
        }
        return undefined;
    }

    /**
     * @category JSON Schema
     */
    jsonSchemaRequired () {
        const proto = this.finalInitProto();
        if (proto) {
            return proto.jsonSchemaRequired();
        }
        return undefined;
    }

    /**
     * @category JSON Schema
     */
    asJsonSchema (refSet) {
        assert(refSet);
        if (this.jsonSchema()) {
            // has a direct json schema
            const schema = this.jsonSchema();
            // need to recursively decend into the schema to find refs
            // and add them to the refSet

            return schema;
        }

        //otherwise, compose one from the slot meta info

        assert(refSet);

        const properties = this.jsonSchemaProperties(refSet);

        if (properties !== undefined && properties["$ref"] !== undefined) {
            // it's a reference, so just return the properties
            return properties;
        }

        //const type = this.jsonSchemaType();

        // it's probably a base type
        const schema = {
            type: this.jsonSchemaType(),
            description: this.jsonSchemaDescription(),
            //enum: this.jsonSchemaEnum(), // use jsonSchemeAddRanges instead
            readOnly: this.isReadOnly()
        };

        // Only add properties if they exist (for object types)
        // Already declared above, so reuse the same variable
        if (properties !== undefined) {
            schema.properties = properties;
        }

        if (this.initValue() !== undefined) {
            schema.default = this.initValue();
        }

        const title = this.jsonSchemaTitle();

        if (this.name() !== title) {
            schema.title = title;
        }

        if (this.jsonSchemaExamples()) {
            schema.examples = this.jsonSchemaExamples();
        }

        const pattern = this.jsonSchemaPattern();
        if (pattern) {
            schema.pattern = pattern;
        }

        this.jsonSchemeAddRanges(schema);

        // handle array type
        const itemsType = this.jsonSchemaItemsType();

        if (itemsType) {
            schema.items = {
                "description": this.jsonSchemaItemsDescription(),
                "uniqueItems": this.jsonSchemaItemsIsUnique()
            };

            if (this.validJsonSchemaItemsTypes().contains(itemsType)) {
                schema.items.type = itemsType; // it's a json type
            } else {
                // it's a class
                const aClass = SvGlobals.globals()[itemsType];
                assert(aClass && aClass.isClass());
                schema.items["$ref"] = aClass.jsonSchemaRef(refSet);
            }

        }

        if (this.allowsMultiplePicks()) {
            assert(schema.type === "array"); // sanity check
            assert(schema.properties === undefined); // sanity check
        }

        return schema;
    }

    /**
     * @category Value Validation
     */
    acceptsValue (v) {
        const valueType = Type.typeName(v);
        const slotType = this.slotType();

        if (slotType === valueType) {
            return true;
        }

        if (Type.isNull(v)) {
            if (slot.allowsNullValue()) {
                return true;
            }
        }

        if (slotType === "JSON Object") {
            // ?

        }


        if (slotType.hasSuffix(" Class")) {
            // ?
        }

        if (slotType === "Action") {
            return true;
        }

        const slotTypeClass = SvGlobals.globals()[slotType];

        /*
        if (v.thisClass().classNameSet().has(slotType)) {
            return true;
        }
        */

        if (v.thisClass().isKindOf(slotTypeClass)) {
            return true;
        }

        /*

        if (this.slotType() === "String") {
            if (Type.isString(v)) {
                return true;
            }
        }

        if (this.slotType() === "Number") {
            if (Type.isNumber(v)) {
                return true;
            }
        }

        if (this.slotType() === "Boolean") {
            if (Type.isBoolean(v)) {
                return true;
            }
        }


        if (this.slotType() === "Array") {
            if (Type.isArray(v)) {
                return true;
            }
        }
        */

        return false;
    }

    /**
     * @category Value Validation
     */
    onInstanceSetValueWithJsonSchemaTypeCheck (anInstance, v) {
        const slot = this;
        const value = slot.valueFromJson(jsonValue);

        if (slot.finalInitProto()) {
            const obj = slot.onInstanceGetValue(anInstance);
            obj.fromJsonSchema(v); // this will do a type check?
            return this;
        }

        if (slot.acceptsValue(value)) {
            slot.onInstanceSetValue(anInstance, value);
        } else {
            throw new Error("fromJsonSchema type mismatch for key '" + this.name() + "'");
        }

        return this;
    }

    /**
     * @category Value Validation
     */
    assertValidValueOnInstance (anInstance) {
        assert(this.slotType() !== null, "slotType is null for slot: " + this.name());
        const v = this.onInstanceGetValue(anInstance);
        if (v !== null) {
            assert(this.acceptsValue(v), "slot value type mismatch for key '" + this.name() + "'");
        }
        return this;
    }

}.initThisClass());


// --- slot methods on Function -------------------------------------------------

/*
Object.defineSlots(Function.prototype, {
    slot: function () {
        return this._slot
    },

    setSlot: function (aSlot) {
        this._slot = aSlot
        return this
    },

})
*/

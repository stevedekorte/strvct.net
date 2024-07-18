"use strict";

/*

    Slot

    Abstraction for a slot on a prototype. 
    An array of these are stored in each prototype.
    
    - stores slot related data, such as:
        - default value
        - cloning policy 
        - persistent policy
        - comment
        - whether slot can be:
            - edited
            - inspected
        - isPrivate
        - slotType
    - handles auto generating getter/setter

    NOTE:

        TODO: hooks code is a mess, need to cleanup and modularize
*/

if (!getGlobalThis().ideal) {
    getGlobalThis().ideal = {} 
}

getGlobalThis().ideal.Slot = (class Slot extends Object { 

    setShouldStore (aBool) {
        throw new Error("Slot.setShouldStore should not be called on Slot");
    }

    shouldStore () {
        throw new Error("Slot.shouldStore should not be called on Slot");
    }

    simpleNewSlot (slotName, initialValue) {  
        // TODO: unify with Object.newSlot by separating out bit that creates a Slot instance
        const privateName = "_" + slotName;
        Object.defineSlot(this, privateName, initialValue);

        if (!this[slotName]) {
            const simpleGetter = function () {
                return this[privateName];
            }

            Object.defineSlot(this, slotName, simpleGetter);
        }

        const setterName = "set" + slotName.capitalized();

        if (!this[setterName]) {
            const simpleSetter = function (newValue) {
                this[privateName] = newValue;
                return this;
            }

            Object.defineSlot(this, setterName, simpleSetter);
        }

        this._slotNames.add(slotName);
        
        return this;
    }

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

        this.simpleNewSlot("valueClass", null); // declare the value should be a kind of valueClass
        //this.simpleNewSlot("field", null);
        //this.simpleNewSlot("isLazy", false); // should hook getter
        this.simpleNewSlot("isWeak", false); // should hook getter

        // debugging 
        //this.simpleNewSlot("doesBreakInGetter", false) // uses "debugger;"
        //this.simpleNewSlot("doesBreakInSetter", false) // uses "debugger;"

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
        this.simpleNewSlot("canInspect", false);
        this.simpleNewSlot("canEditInspection", true);
        this.simpleNewSlot("label", null); // visible label on inspector
        this.simpleNewSlot("allowsNullValue", false); // used for validation
        this.simpleNewSlot("validValues", null); // used for options field and validation
        this.simpleNewSlot("validValuesClosure", null);
        this.simpleNewSlot("validatesOnSet", true);
        this.simpleNewSlot("allowsMultiplePicks", false);
        this.simpleNewSlot("inspectorPath", null); // if non-null, uses to create a path for the slot inspector
        this.simpleNewSlot("summaryFormat", "none"); // passed into slot inspector node

        this.simpleNewSlot("syncsToView", false); // if true, will hook slot setter to call this.scheduleSyncToView() on slotValue change (implemented by ViewableNode)
        this.simpleNewSlot("syncsToNode", false); // if true, will hook slot setter to call this.scheduleSyncToNode() on slotValue change (implemented by NodeView)

        this.simpleNewSlot("actionMethodName", null); // used by slots that will be represented by ActionFields to store the methodName
        this.simpleNewSlot("annotations", null);
        this.simpleNewSlot("fieldInspectorClassName", null);
    }

    setFinalInitProto (aProto) {
        this._finalInitProto = aProto;
        if (aProto && this.slotType() === null) {
            this.setSlotType(aProto.type()); // hack
        }
        return this;
    }
    // --- label ---

    setLabelToCapitalizedSlotName () {
        let s = this.name().capitalized();
        // If the name was camel case, we want to split it into words.
        s = s.replace(/([A-Z])/g, ' $1').trim();
        this.setLabel(s);
        return this;
    }

    // --- annotations ---

    setValidValues (v) {
        this._validValues = v;

        // sanity check
        if (v) {
            const isValid = this._validValues.includes(this.initValue());
            if (!isValid) {
                const isOptionsDict = Type.isArray(v) && v.length && v.first().label;
                if (!isOptionsDict) {
                    console.log("ERROR Slot.setValidValues:")
                    const s = "this._validValues: " + JSON.stableStringify(this._validValues) + " doesn't contain '" + this.initValue() + "'";
                    console.log(s)
                    debugger;
                    //throw new Error("valid values constraint not met: " + s)
                }
            }
        }
        return this
    }

    // --- annotations ---

    annotations () {
        if (!this._annotations) {
            this._annotations = new Map()
        }
        return this._annotations
    }

    setAnnotation (key, value) {
        this.annotations().set(key, value);
        return this
    }

    hasAnnotation (key) {
        return this.annotations().has(key);
    }

    getAnnotation (key) {
        return this.annotations().get(key);
    }

    removeAnnotation () {
        this.annotations().delete(key);
        return this
    }

    // --- value placeholder ---

    setValuePlaceholder (s) {
        this.setAnnotation("valuePlaceholder", s);
        return this;
    }

    valuePlaceholder () {
        return this.getAnnotation("valuePlaceholder");
    }

    // --- subnode field helpers ---

    setNodeFillsRemainingWidth (aBool) {
        this.setAnnotation("nodeFillsRemainingWidth", aBool);
        return this;
    }

    nodeFillsRemainingWidth () {
        return this.getAnnotation("nodeFillsRemainingWidth") === true;
    }

    setKeyIsVisible (aBool) {
        this.setAnnotation("keyIsVisible", aBool);
        return this
    }

    keyIsVisible () {
        return this.getAnnotation("keyIsVisible") !== false;
    }

    // --- standard annotations ---

    setShouldJsonArchive (aBool) {
        this.setAnnotation("shouldJsonArchive", aBool);
        return this
    }

    shouldJsonArchive () {
        return this.getAnnotation("shouldJsonArchive");
    }

    // --- description ---

    setDescription (s) {
        this.setAnnotation("description", s);
        return this;
    }

    description () {
        return this.getAnnotation("description");
    }

    setDescriptionAndPlaceholder (s) {
        this.setDescription(s);
        this.setValuePlaceholder(s);
        return this;
    }

    // --- examples ---

    setExamples (anArray) {
        this.setAnnotation("examples", anArray);
        return this;
    }

    examples () {
        return this.getAnnotation("examples");
    }

    // --- read only ---

    setIsReadOnly (aBool) {
        this.setAnnotation("readOnly", aBool);
        return this;
    }

    isReadOnly () {
        return this.getAnnotation("readOnly");
    }
    
    // --- required ---

    setIsRequired (b) {
        this.setAnnotation("isRequired", b);
        return this;
    }

    isRequired () {
        const b = this.getAnnotation("isRequired");
        if (b === undefined) {
            return true; //  default to true
        }
        return b;
    }

    // --- json schema (to set directly) if value is raw json ---

    setJsonSchema (schema) {
        this.setAnnotation("jsonSchema", schema);
        return this;
    }

    jsonSchema () {
        return this.getAnnotation("jsonSchema");
    }

    // --- items type ---

    validJsonSchemaItemsTypes () {
        const validItemsTypes = ["null", "boolean", "object", "array", "number", "string", "integer"];
        return validItemsTypes;
    }

    setJsonSchemaItemsType (s) {
        assert(Type.isString("string"));
        //assert(this.validJsonSchemaItemsTypes().contains(s));
        this.setAnnotation("jsonSchemaItemsType", s);
        return this;
    }

    jsonSchemaItemsType () {
        return this.getAnnotation("jsonSchemaItemsType");
    }

    // --- items description ---

    setJsonSchemaItemsDescription (s) {
        this.setAnnotation("jsonSchemaItemsDescription", s);
        return this;
    }

    jsonSchemaItemsDescription () {
        return this.getAnnotation("jsonSchemaItemsDescription");
    }

    // --- items ref ---

    setJsonSchemaItemsRef (s) {
        this.setAnnotation("jsonSchemaItemsRef", s);
        return this;
    }

    jsonSchemaItemsRef () {
        return this.getAnnotation("jsonSchemaItemsRef");
    }

    // --- items is unique ---

    setJsonSchemaItemsIsUnique (b) {
        this.setAnnotation("jsonSchemaItemsIsUnique", b);
        return this;
    }

    jsonSchemaItemsIsUnique () {
        return this.getAnnotation("jsonSchemaItemsIsUnique");
    }

    // --- is in json schema ---

    setIsInJsonSchema (b) {
        this.setAnnotation("isInJsonSchema", b);
        return this;
    }

    isInJsonSchema () {
        return this.getAnnotation("isInJsonSchema");
    }

    // --- inspector ---

    fieldInspectorClassName () {
        if (Type.isString(this._fieldInspectorClassName)) {
            return this._fieldInspectorClassName;
        }
        return this.defaultFieldInspectorClassName();
    }

    defaultFieldInspectorClassName () {
        const slotType = this.slotType();
        assert(!Type.isNull(slotType), "slotType is null for slot: " + this.name());
        let fieldName = "BM" + slotType + "Field";

        if (this.validValues() || this.validValuesClosure()) {
            fieldName = "BMOptionsNode";
        }
        
        return fieldName;
    }

    newInspectorField () {
        const slotType = this.slotType();
        if (slotType /*&& this.canInspect()*/) {
            const fieldName = this.fieldInspectorClassName();
            let proto = getGlobalThis()[fieldName];

            if (!proto) {
                //let nodeName = "BM" + slotType + "Node";
                const nodeName = "BMPointerField";
                proto = getGlobalThis()[nodeName];
            }

            if (proto) {
                const field = proto.clone();

                field.setKey(this.name());
                field.setKeyIsEditable(false);
                field.setValueMethod(this.name());
                field.setValueIsEditable(this.canEditInspection());
                field.setCanDelete(false);

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
                    } else {
                        field.setKey(this.label());
                    }
                }

                if (this.validValues()) {
                    field.setValidValues(this.validValues());
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks());
                    field.setNodeSubtitleIsChildrenSummary(true);
                } else if (this.validValuesClosure()) {
                    field.setValidValuesClosure(this.validValuesClosure());
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks());
                    field.setNodeSubtitleIsChildrenSummary(true);
                }
                return field;
            }
        }
        return null;
    }

    computedValidValues () {
        if (this.validValues()) {
            return this.validValues();
        } else if (this.validValuesClosure()) {
            return this.validValuesClosure()();
        }
        return null;
    }

    validDuplicateOps () {
        return new Set(["nop", "copyValue", "duplicate"])
    }
    
    setDuplicateOp (aString) {
        assert(this.validDuplicateOps().has(aString))
        this._duplicateOp = aString
        return this
    }

    /*
    onInstanceGetDuplicateValue (anInstance) {
        const v = this.onInstanceGetValue(anInstance)
        const dop = this.duplicateOp()

        if (v === null) {
            return null
        } else if (dop === "nop") {
            return v
        } else if (dop === "copyValue") {
            return v
        } else if (dop === "duplicate" && v && v.duplicate) {
            return v.duplicate()
        }

        throw new Error("unable to duplicate")
    }
    */

    setName (aName) {
        assert(Type.isString(aName) && aName.trim().length > 0)
        this._name = aName
        const n = this.name().capitalized()
        this.setPrivateName("_" + aName)
        this.setSetterName("set" + n)

        //this.updateCachedMethodNames()

        this.setDirectSetterName("directSet" + n) // -> getCachedMethodNameFor("directSet")
        this.setMethodForWillGet("willGetSlot" + n)
        this.setMethodForDidUpdate("didUpdateSlot" + n)
        this.setMethodForWillUpdate("willUpdateSlot" + n)
        this.setMethodForUndefinedGet("onUndefinedGet" + n) // for lazy slots
        this.setMethodForOnFinalized("onFinalizedSlot" + n) // for weak slots
        this.setMethodForShouldStoreSlot("shouldStoreSlot" + n) // for weak slots
        return this 
    }

    // --- method name cache ---

    /*
    addCachedMethodName (k) {
        this.methodNameCache().set(k, k + this.name().capitalized())
        return this
    }

    updateCachedMethodNames () {
        this.addCachedMethodName("directSet" )
        this.addCachedMethodName("willGetSlot")
        this.addCachedMethodName("didUpdateSlot")
        this.addCachedMethodName("willUpdateSlot")
        this.addCachedMethodName("onUndefinedGet") // for lazy slots
        this.addCachedMethodName("onFinalizedSlot") // for weak slots
        this.addCachedMethodName("shouldStoreSlot") // for weak slots
    }

    getCachedMethodNameFor (k) {
        const result = this.methodNameCache().set(k, v)
        if(typeof(result) === "string") {
            throw new Error("missing method name cache for '" + k + "'")
        }
        return result
    }
    */

    // ---

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
            //} else if (!Type.isJsonType(value)) {
            } else {
                value = Type.deepCopyForValue(value);
            }
            
            this[privateName] = value;
            /*
            const setterName = "set" + slotName.capitalized()
            const v = aSlot[slotName].apply(aSlot)
            this[setterName].call(this, v)
            */
        })
        return this
    }

    autoSetGetterSetterOwnership () {
        this.setOwnsGetter(!this.alreadyHasGetter())
        this.setOwnsSetter(!this.alreadyHasSetter())
        return this
    }

    hookNames () {
        const hookMethodNames = this._slotNames.filter(n => n.beginsWith("methodFor"))
        const hookNames = hookMethodNames.map(n => this[n].apply(this))
        return hookNames
    }

    ownerImplemnentsdHooks () {
        return true
        /*
        const slotsMap = this.owner().slotsMap() // TODO: this is slow
        return this.hookNames().canDetect(hookName => slotsMap.has(hookName)) 
        */
    }

    setDoesHookSetter (aBool) {
        if (this._doesHookSetter !== aBool) {
            this._doesHookSetter = aBool
            if (aBool) {
                if (this.alreadyHasSetter() && !this.ownsSetter()) {
                    const msg = this.owner().type() + "." + this.setterName() + "() exists, so we can't hook it - fix by calling slot.setOwnsSetter(true)"
                    console.log(msg)
                    throw new Error(msg)
                } 
                // this.setOwnsSetter(true)
            }
            //this.setupSetter()
        }
        return this 
    }

    // setup

    setupInOwner () {
        this.autoSetGetterSetterOwnership()
        this.setupValue()
        this.setupGetter()
        this.setupSetter()
        return this
    }

    setupValue () {
        Object.defineSlot(this.owner(), this.privateName(), this.initValue());
        return this;
    }

    // getter

    alreadyHasGetter () {
        return this.owner().hasOwnProperty(this.getterName()); // TODO: hasOwnProperty? 
    }

    setupGetter () {
        if (this.ownsGetter()) {
            if (this.ownerImplemnentsdHooks()) {
                Object.defineSlot(this.owner(), this.getterName(), this.autoGetter())
            } else {
                this.makeDirectGetter()
            }
        }
        return this
    }

    alreadyHasSetter () {
        return this.owner().hasOwnProperty(this.setterName())  // TODO: hasOwnProperty? 
    }

    setupSetter () {
        if (this.ownsSetter()) {
            if (this.ownerImplemnentsdHooks()) {
                Object.defineSlot(this.owner(), this.setterName(), this.autoSetter())
            } else {
                this.makeDirectSetter()
            }
            //Object.defineSlot(this.owner(), this.directSetterName(), this.directSetter())
        }
    }

    // --- getter ---

    getterName () {
        return this.name()
    }

    // direct getter

    makeDirectGetter () {
        Object.defineSlot(this.owner(), this.getterName(), this.directGetter())
        return this
    }

    directGetter () {
        assert(arguments.length === 0);
        const privateName = this.privateName();
        const func = function () {
            return this[privateName];
        }
        return func;
    }

    // hooked getter

    makeDirectGetterOnInstance (anInstance) {
        Object.defineSlot(anInstance, this.getterName(), this.directGetter());
        return this;
    }

    // ----------------------------------------

    autoGetter () {
        const slot = this;
        return function (arg) { 
           // assert(Type.isUndefined(arg)); // TODO: remove this
            return this.getSlotValue(slot);
        }
    }

    validateValue (v) {
        if (v === null && this.allowsNullValue() === true) {
            return true;
        }

        //const validValues = this.computedValidValues(); // closure may reference unloaded classes...
        const validValues = this.validValues();
        
        if (validValues === null) {
            return true;
        }
        
        if (validValues.includes(v)) {
            return true;
        }

        function ValidValue_hasLabel (self, label) {
            if (self.label === label) {
                return true;
            }
            if (self.options) {
                return ValidValues_haveLabel(self.options, label);
            }
            return false;
        }

        function ValidValues_haveLabel (validValues, label) {
            return validValues.detect(vv => ValidValue_hasLabel(vv, v));
        }

        if (ValidValues_haveLabel(validValues, v)) {
            return true;
        }

        return false;
    }

    autoSetter () {
        const slot = this;
        return function (newValue) {
            if (slot.validatesOnSet()) {
                const isValid = slot.validateValue(newValue);
                if (!isValid) {
                    const validValues = slot.validValues();
                    const errorMsg = "WARNING: " + this.type() + "." + slot.setterName() +  "() called with invalid argument value (" + Type.typeName(newValue) + ") '" + newValue + "' not in valid values: " + validValues;
                    console.log(errorMsg);
                    let initValue = slot.initValue();
                    //assert(initValue);
                    console.log("RESOLUTION: setting value to initValue: ", initValue);
                    //debugger;
                    newValue = initValue; //validValues.first(); // not safe
                    //throw new Error(errorMsg);
                }
            }

            return this.setSlotValue(slot, newValue);
        };
    }

    // --- setter ---

    makeDirectSetter () {
        Object.defineSlot(this.owner(), this.setterName(), this.directSetter());
        return this;
    }

    directSetter () {
        const privateName = this.privateName()
        const func = function (newValue) {
            this[privateName] = newValue
            return this
        }
        return func
    }

    // call helpers

    onInstanceRawGetValue (anInstance) {
        return anInstance[this.privateName()]
    }

    onInstanceGetValue (anInstance) {
        return anInstance[this.getterName()].apply(anInstance)
    }

    onInstanceSetValue (anInstance, aValue) {
        const m = anInstance[this._setterName];
        if (Type.isUndefined(m)) {
            throw new Error(anInstance.type() + " is missing setter '" + this._setterName + "'")
        }
        return m.call(anInstance, aValue) // not consistent with rawset to return this...
    }

    onInstanceRawSetValue (anInstance, aValue) {
        anInstance[this._privateName] = aValue;
        return this
    }

    // --- StoreRefs for lazy slots ---

    onInstanceSetValueRef (anInstance, aRef) {
        anInstance.lazyRefsMap().set(this.name(), aRef) 
        return this
    }

    onInstanceGetValueRef (anInstance, aRef) {
        return anInstance.lazyRefsMap().get(this.name()) 
    }

    copyValueFromInstanceTo (anInstance, otherInstance) {
        /*
        if (this.isLazy()) {
            const valueRef = this.onInstanceGetValueRef(anInstance)
            if (valueRef) {
                this.onInstanceSetValueRef(otherInstance, valueRef)
                return this
            }
        }
        */

        const v = this.onInstanceGetValue(anInstance)
        this.onInstanceSetValue(otherInstance, v)
        return this
    }

    // -----------------------------------------------------

    finalInitProtoClass () {
        let finalInitProto = this._finalInitProto;
        if (typeof(finalInitProto) === "string") {
            const finalInitClass = getGlobalThis()[finalInitProto];
            assert(finalInitClass, "missing finalInitProto class '" + finalInitProto + "'");
            finalInitProto = finalInitClass;
        }
        return finalInitProto;
    }

    onInstanceFinalInitSlot (anInstance) {
        assert(this.slotType() !== null, " slotType is null for " + anInstance.type() + "." + this.name());

        const finalInitProto = this.finalInitProtoClass(); //this._finalInitProto;
        if (finalInitProto) {
            let oldValue = this.onInstanceGetValue(anInstance);

            if (oldValue && oldValue.type() !== finalInitProto.type()) {
                const warning = "slot '" + this.name() + "' finalInitProto type (" + finalInitProto.type() + ") does not match existing value (" + oldValue.type() + ") from Store";
                console.warn(warning)
                debugger;
                //throw new Error(warning)
                oldValue = null; // let the code below override it
            }

            if (Type.isNullOrUndefined(oldValue)) {
            //if (oldValue === null) {

                /*
                let newValue;
                if (this.isSubnode()) { // see if it's already a subnode
                    const oldSubnode = anInstance.firstSubnodeOfType(finalInitProto)
                    if (oldSubnode) {
                        newValue = oldSubnode
                    } else {
                        const newSubnode = finalInitProto.clone();
                        this.addSubnode(newSubnode);
                        newValue = newSubnode
                    }
                } else {
                    newValue = finalInitProto.clone()
                }
                */

                /*
                if (typeof(finalInitProto) === "string") {
                    const finalInitClass = getGlobalThis()[finalInitProto];
                    assert(finalInitClass, "missing finalInitProto class '" + finalInitProto + "'");
                    finalInitProto = finalInitClass;
                }
                    */

                const newValue = finalInitProto.clone()
                this.onInstanceSetValue(anInstance, newValue)

                /*
                if (this.shouldFinalInitAsSubnode()) {
                    anInstance.addSubnode(newValue)
                    
                    const title = this.finalInitTitle()
                    if (title) {
                        newValue.setTitle(title)
                        anInstance.subnodeWithTitleIfAbsentInsertProto(title, finalInitProto)
                    } else {
                        anInstance.addSubnode(newValue)
                    }
                }
                */
            } 
        }

        if (this.isSubnode()) { 
            // sanity check - we don't typically want to add it automatically if subnodes are stored
            assert(anInstance.shouldStoreSubnodes() === false);
            const value = this.onInstanceGetValue(anInstance);
            assert(value);
            anInstance.assertValidSubnodeType(value); // tmp - this is also done in addSubnode
            anInstance.addSubnode(value);
        }

        if (this.isSubnodeField()) {
            assert(anInstance.shouldStoreSubnodes() === false, "error on slot definition '" + this.name() + "' subnode fields are not supported with shouldStoreSubnodes");
            anInstance.addSubnodeFieldForSlot(this);
        }
    }

    onInstanceInitSlot (anInstance) {
        //assert(Reflect.has(anInstance, this.privateName())) // make sure slot is defined - this is true even if it's value is undefined
        let defaultValue = anInstance[this._privateName]

        /*
        const op = this.initOp()
        assert(this.validInitOps().contains(op)) // TODO: put on setter instead

        const opMethods = {
            "null" : () => { 
                this.onInstanceSetValue(anInstance, null)
            },

            "lazy" : () => { 
                const obj = this.initProto().clone()
                anInstance[this.privateName()] = obj
            },

            "proto" : () => { 
                const obj = this.initProto().clone()
                this.onInstanceSetValue(anInstance, obj)
            },

            "nop" : () => { 
            },

            "copyValue" : () => { 
                this.onInstanceSetValue(anInstance, defaultValue)
            },
    
            "duplicate" : () => { 
                if (defaultValue) {
                    const obj = defaultValue.duplicate()
                    this.onInstanceSetValue(anInstance, obj)
                }
            },
        }

        opMethods[op].apply(this)
        */

        const initProto = this._initProto
        /*
        if (this.isLazy()) {
            const obj = initProto.clone()
            anInstance[this._privateName] = obj
        } else */ 
        if (initProto) {
            const obj = initProto.clone()
            this.onInstanceSetValue(anInstance, obj)
        } /*
        else if (this._initValue) {
            this.onInstanceSetValue(anInstance, this._initValue)
        }
        */

        /*
        if (this.field()) {
            // duplicate the field instance owned by the slot,
            // add it as a subnode to the instance,
            // and sync it to the instance's slot value
            const newField = this.field().duplicate()
            anInstance.addSubnode(newField)
            newField.getValueFromTarget()
        }
        */
    }

    onInstanceLoadRef (anInstance) {
        const storeRef = this.onInstanceGetValueRef(anInstance)
        if (storeRef) {
            
            //console.warn(anInstance.typeId() + "." + this.name() + " [" + anInstance.title() + "] - loading storeRef")
            //console.warn(anInstance.title() + " loading storeRef for " + this.name())
            const obj = storeRef.unref()
            /*
            //console.warn("   loaded: " + obj.type())
            anInstance[this.privateName()] = obj // is this safe? what about initialization?
            //this.onInstanceSetValue(anInstance, obj)
            this.onInstanceSetValueRef(anInstance, null)
            */

            const setter = anInstance[this.setterName()]
            setter.apply(anInstance, [obj]) // WARNING: this may mark objects as dirty

        } else {
            //console.warn(anInstance.typeId() + " unable to load storeRef - not found")
            //console.warn(anInstance.typeId() + ".shouldStoreSubnodes() = " + anInstance.shouldStoreSubnodes())
            //throw new Error("")
        }
    }

    hasSetterOnInstance (anInstance) {
        return Type.isFunction(anInstance[this.setterName()])
    }

    // --- should store on instance ---

    shouldStoreSlotOnInstance (anInstance) {
        const methodName = this.methodForShouldStoreSlot()
        const method = anInstance[methodName]
        if (method) {
            const v = method.apply(anInstance)
            if (Type.isBoolean(v)) { // allows instance to result null to use slot's own value
                return v
            }
        }
        return this.shouldStoreSlot()
    }

    /*
    setShouldStoreSlotOnInstance (anInstance, aBool) {
        const k = this.shouldStoreSlotOnInstancePrivateName()
        Object.defineSlot(anInstance, k, aBool)
        return aBool
    }
    */

    // --- JSON schema ---

    /*
        Valid JSON schema properties:

        [
        "$id",
        "$schema",
        "$ref",
        "$comment",
        "title",
        "description",
        "type",
        "properties",
        "items",
        "required",
        "additionalProperties",
        "definitions",
        "pattern",
        "minLength",
        "maxLength",
        "minimum",
        "maximum",
        "enum",
        "format",
        "default",
        "examples",
        "dependencies",
        "patternProperties",
        "minItems",
        "maxItems",
        "uniqueItems",
        "multipleOf"
    ]
    */

    jsonSchemaType () {
        //const validJsonTypeValues = ["null", "boolean", "object", "array", "number", "string", "integer"];

        let type = this.slotType();

        // what about integer?

        const passThroughTypes = new Set(["String", "Number", "Boolean", "Array"])

        if (passThroughTypes.has(type)) {
            return type.toLowerCase();
        }

        if (type === "Action") {
            return null;
        }

        return "object";
    }

    jsonSchemaTitle () {
        return this.name(); // slot name
    }

    jsonSchemaDescription () {
        return this.description();
    }

    jsonSchemaExamples () {
        return this.examples();
    }

    jsonSchemeAddRanges (schema) {
        const a = this.jsonSchemaEnum()
        if (a) {
            const enumArray = a.shallowCopy();

            if (schema.type === "number") {
                enumArray.sort((a, b) => a - b)

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

    jsonSchemaEnum () {
        const enumArray = [];

        const validValues = this.computedValidValues();
        if (validValues) {
            validValues.forEach(v => {
                assert(Type.isJsonType(v));
                if (!Type.isNull(v) && v.label) {
                    enumArray.push(v.label);
                } else {
                    enumArray.push(v);
                }
            });

            if (this.allowsNullValue() && !validValues.includes(null)) {
                enumArray.push(null);
            }
        }

        return enumArray.length ? enumArray : undefined;
    }

    jsonSchemaProperties (refSet) {
        assert(refSet);
        const proto = this.finalInitProtoClass();
        if (proto) {
            if (Type.isString(proto)) {
                return {
                    "$ref": BMNode.jsonSchemaRefForTypeName(proto, refSet)
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

    jsonSchemaRequired () {
        const proto = this.finalInitProto();
        if (proto) {
            return proto.jsonSchemaRequired();
        }
        return undefined;
    }

    /*
    setJsonSchemaTitle (title) {
        debugger;
        this.setName(title); // can't do this after initPrototype
        return this;
    }

    setJsonSchema (schema) {
        this.setJsonSchemaTitle(schema.description);
        this.setJsonSchemaDescription(schema.description);
        this.setJsonSchemaExamples(schema.examples);
        this.setJsonSchemaEnum(schema.enum);
        assert(!schema.properties); // only definitions schemas should have properties

        //this.setSlotType(schema.type);
        return this;
    }
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

        const type = this.jsonSchemaType();

        // it's probably a base type
        const schema = {
            type: this.jsonSchemaType(),
            description: this.jsonSchemaDescription(),
            //enum: this.jsonSchemaEnum(), // use jsonSchemeAddRanges instead
            properties: this.jsonSchemaProperties(refSet),
            readOnly: this.isReadOnly()
        };

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

        this.jsonSchemeAddRanges(schema);

        // handle array type
        const itemsType = this.jsonSchemaItemsType();

        if (itemsType) {
            schema.items = {
                "description": this.jsonSchemaItemsDescription(),
                "uniqueItems": this.jsonSchemaItemsIsUnique()
            }

           if (this.validJsonSchemaItemsTypes().contains(itemsType)) {
                schema.items.type = itemsType; // it's a json type
           } else {
                // it's a class 
                const aClass = getGlobalThis()[itemsType];
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

    // ----------------------------------------------------------

    acceptsValue (v) {
        //const typeNames = Type.typeNamesForValue(value);


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

        if (Type.isNull(v)) {
            if (slot.allowsNullValue()) {
                return true;
            }
        }

        if (this.slotType() === "Array") {
            if (Type.isArray(v)) {
                return true;
            }
        }
 
        return false;
    }

    onInstanceSetValueWithJsonSchemaTypeCheck (anInstance, v) {
        const slot = this;
        const value = slot.valueFromJson(jsonValue);

        if (slot.finalInitProto()) {
            const obj = slot.onInstanceGetValue(anInstance)
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
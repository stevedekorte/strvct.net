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
        throw new Error("Slot.setShouldStore should not be called on Slot")
    }

    shouldStore () {
        throw new Error("Slot.shouldStore should not be called on Slot")
    }

    simpleNewSlot (slotName, initialValue) { 
        // TODO: unify with Object.newSlot by separating out bit that creates a Slot instance
        const privateName = "_" + slotName;
        Object.defineSlot(this, privateName, initialValue)

        if (!this[slotName]) {
            const simpleGetter = function () {
                return this[privateName];
            }

            Object.defineSlot(this, slotName, simpleGetter)
        }

        const setterName = "set" + slotName.capitalized()

        if (!this[setterName]) {
            const simpleSetter = function (newValue) {
                this[privateName] = newValue;
                return this;
            }

            Object.defineSlot(this, setterName, simpleSetter)
        }

        this._slotNames.add(slotName)
        
        return this;
    }

    initPrototypeSlots () {
        Object.defineSlot(this, "_slotNames", new Set())
        
        this.simpleNewSlot("owner", null) // typically a reference to a .prototype
        this.simpleNewSlot("name", false)
        this.simpleNewSlot("privateName", null)
        this.simpleNewSlot("setterName", null)
        this.simpleNewSlot("directSetterName", null)
        this.simpleNewSlot("initValue", null) // needed?

        // slot hook names
        this.simpleNewSlot("methodForWillGet", null)
        this.simpleNewSlot("methodForWillUpdate", null)
        this.simpleNewSlot("methodForDidUpdate", null)
        this.simpleNewSlot("methodForUndefinedGet", null)
        this.simpleNewSlot("methodForOnFinalized", null)
        this.simpleNewSlot("methodForShouldStoreSlot", null)
        //this.simpleNewSlot("methodNameCache", null)

        // getter
        this.simpleNewSlot("ownsGetter", true)
        this.simpleNewSlot("doesHookGetter", false)
        //this.simpleNewSlot("hookedGetterIsOneShot", false) 
        //this.simpleNewSlot("isInGetterHook", false)

        // setter
        this.simpleNewSlot("ownsSetter", true) // if true, we'll create the setter
        this.simpleNewSlot("doesHookSetter", false) // if shouldStore, then auto post isDirty?
        //this.simpleNewSlot("doesPostSetter", false) // posts a didUpdateSlot<SlotName> notification

        // storage related
        this.simpleNewSlot("shouldStoreSlot", false) // should hook setter
        this.simpleNewSlot("initProto", null) // clone this proto in init
        this.simpleNewSlot("finalInitProto", null) // if not set (e.g. by deserialization), clone this proto in finalInit and add as subnode
        //this.simpleNewSlot("shouldFinalInitAsSubnode", false) // if final init is used, it will add the init instance as a subnode use "isSubnode" instead
        this.simpleNewSlot("isSubnode", null) // in finalInit, add value as subnode if not already present
        this.simpleNewSlot("isSubnodeField", null) // in finalInit, create a field for the slot and add as subnode

        this.simpleNewSlot("valueClass", null) // declare the value should be a kind of valueClass
        //this.simpleNewSlot("field", null)
        //this.simpleNewSlot("isLazy", false) // should hook getter
        this.simpleNewSlot("isWeak", false) // should hook getter

        // debugging 
        //this.simpleNewSlot("doesBreakInGetter", false) // uses "debugger;"
        //this.simpleNewSlot("doesBreakInSetter", false) // uses "debugger;"

        // copying behavior
        //this.simpleNewSlot("initOp", "copyValue")
        //this.simpleNewSlot("validInitOps", new Set(["null", "lazy", "proto", "nop", "copyValue", "duplicate"])) 
        this.simpleNewSlot("duplicateOp", "nop")
        this.simpleNewSlot("validDuplicateOps", new Set(["nop", "copyValue", "duplicate"])) 
        this.simpleNewSlot("comment", null)
        this.simpleNewSlot("isPrivate", false)

        // inspector related
        // slotType is a string value, eg: "Boolean", "String", "Number", "Action" - can be used to find a class 
        // to create an inspector node for the slotValue
        this.simpleNewSlot("slotType", null)
        this.simpleNewSlot("canInspect", false)
        this.simpleNewSlot("canEditInspection", true)
        this.simpleNewSlot("label", null) // visible label on inspector
        this.simpleNewSlot("validValues", null) // used for options field and validation
        this.simpleNewSlot("validValuesClosure", null) 
        this.simpleNewSlot("allowsMultiplePicks", false)
        this.simpleNewSlot("inspectorPath", null) // if non-null, uses to create a path for the slot inspector
        this.simpleNewSlot("summaryFormat", "none") // passed into slot inspector node

        this.simpleNewSlot("syncsToView", false) // if true, will hook slot setter to call this.scheduleSyncToView() on slotValue change
        //this.simpleNewSlot("isDeserializing", false) // need to add it here as we don't inherit it

        this.simpleNewSlot("actionMethodName", null) // used by slots that will be represented by ActionFields to store the methodName
    }

    fieldInspectorClassName () {
        const slotType = this.slotType() 
        let fieldName = "BM" + slotType + "Field"

        if (this.validValues() || this.validValuesClosure()) {
            fieldName = "BMOptionsNode"
        }
        
        return fieldName
    }

    newInspectorField () {
        const slotType = this.slotType() 
        if (slotType /*&& this.canInspect()*/) {
            const fieldName = this.fieldInspectorClassName()
            let proto = getGlobalThis()[fieldName]

            /*
            if (!proto) {
                let nodeName = "BM" + slotType + "Node"
                proto = getGlobalThis()[nodeName]
            }
            */

            if (proto) {
                const field = proto.clone()

                field.setKey(this.name())
                field.setKeyIsEditable(false)
                field.setValueMethod(this.name())
                field.setValueIsEditable(this.canEditInspection())
                field.setCanDelete(false)
                //assert(!field.canSelfAddSubnode())

                if (this.label()) {
                    if (slotType === "Action") { // TODO: hack - find a uniform way to handle this
                        field.setTitle(this.label())
                        field.setMethodName(this.actionMethodName())
                    } else {
                        field.setKey(this.label())
                    }
                }

                if (this.validValues()) {
                    field.setValidValues(this.validValues())
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks())
                    field.setNodeSubtitleIsChildrenSummary(true)
                } else if (this.validValuesClosure()) {
                    field.setValidValuesClosure(this.validValuesClosure())
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks())
                    field.setNodeSubtitleIsChildrenSummary(true)
                }
                return field
            }
        }
        return null
    }

    computedValidValues () {
        if (this.validValues()) {
            return this.validValues()
        } else if (this.validValuesClosure()) {
            return this.validValuesClosure()()
        }
        return null
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
        this._slotNames.forEach(slotName => {
            const privateName = "_" + slotName;
            this[privateName] = aSlot[privateName]
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
        return this.hookNames().detect(hookName => slotsMap.has(hookName)) ? true : false
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
        Object.defineSlot(this.owner(), this.privateName(), this.initValue())
        return this
    }

    // getter

    alreadyHasGetter () {
        return this.owner().hasOwnProperty(this.getterName()) // TODO: hasOwnProperty? 
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
        const privateName = this.privateName()
        const func = function () {
            return this[privateName]
        }
        return func
    }

    // hooked getter

    makeDirectGetterOnInstance (anInstance) {
        Object.defineSlot(anInstance, this.getterName(), this.directGetter())
        return this   
    }

    // ----------------------------------------

    autoGetter () {
        const slot = this
        return function () { 
            return this.getSlotValue(slot) 
        }
    }

    autoSetter () {
        const slot = this
        return function (newValue) { 
            return this.setSlotValue(slot, newValue) 
        }
    }

    // --- setter ---

    makeDirectSetter () {
        Object.defineSlot(this.owner(), this.setterName(), this.directSetter())
        return this
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
        return m.call(anInstance, aValue)
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

    onInstanceFinalInitSlot (anInstance) {
        const finalInitProto = this._finalInitProto
        if (finalInitProto) {
            const oldValue = this.onInstanceGetValue(anInstance)
            if (oldValue === null) {

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
            } else if (oldValue.type() !== finalInitProto.type()) {
                debugger;
                const warning = "finalInitProto type does not match existing value from Store";
                console.warn(warning)
                //throw new Error(warning)
            }
        }

        if (this.isSubnode()) { 
            // sanity check - we don't typically want to add it automatically if subnodes are stored
            assert(anInstance.shouldStoreSubnodes() === false)
            const value = this.onInstanceGetValue(anInstance)
            anInstance.addSubnode(value)
        }

        if (this.isSubnodeField()) {   
            assert(anInstance.shouldStoreSubnodes() === false)
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
        } else if (this._initValue) {
            this.onInstanceSetValue(anInstance, this._initValue)
        }

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
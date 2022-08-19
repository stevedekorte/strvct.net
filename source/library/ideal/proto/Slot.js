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
        this.simpleNewSlot("initValue", null) // needed?

        // getter
        this.simpleNewSlot("ownsGetter", true)
        this.simpleNewSlot("doesHookGetter", false)
        //this.simpleNewSlot("hookedGetterIsOneShot", false) 
        //this.simpleNewSlot("isInGetterHook", false)

        // setter
        this.simpleNewSlot("ownsSetter", true) 
        this.simpleNewSlot("doesHookSetter", false) // if shouldStore, then auto post isDirty?
        //this.simpleNewSlot("doesPostSetter", false) // posts a didUpdateSlot<SlotName> notification

        // storage related
        this.simpleNewSlot("shouldStoreSlot", false) // should hook setter
        this.simpleNewSlot("initProto", null) // clone this proto on init and set to initial value
        this.simpleNewSlot("valueClass", null) // declare the value should be a kind of valueClass
        this.simpleNewSlot("field", null)
        this.simpleNewSlot("isLazy", false) // should hook getter
        this.simpleNewSlot("isWeak", false) // should hook getter

        // slot hook names
        this.simpleNewSlot("methodForWillGet", null)
        this.simpleNewSlot("methodForWillUpdate", null)
        this.simpleNewSlot("methodForDidUpdate", null)
        this.simpleNewSlot("methodForUndefinedGet", null)
        this.simpleNewSlot("methodForOnFinalized", null)
        this.simpleNewSlot("privateName", null)

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
        // slotType is a string value, eg: "Boolean", "String", "Number", Action - can be used to find a class 
        // to create an inspector node for the slotValue
        this.simpleNewSlot("slotType", null)
        this.simpleNewSlot("canInspect", false)
        this.simpleNewSlot("canEditInspection", true)
        this.simpleNewSlot("label", null) // visible label on inspector
        this.simpleNewSlot("validValues", null) // used for options field and validation
        this.simpleNewSlot("validValuesClosure", null) 
        this.simpleNewSlot("allowsMultiplePicks", false)
        this.simpleNewSlot("inspectorPath", null) // if non-null, uses to create a path for the slot inspector

        this.simpleNewSlot("syncsToView", false) // if true, will hook slot setter to call this.scheduleSyncToView() on slotValue change
    }

    newInspectorField () {
        const slotType = this.slotType() 
        if (slotType && this.canInspect()) {
            let fieldName = "BM" + slotType + "Field"
            if (this.validValues() || this.validValuesClosure()) {
                fieldName = "BMOptionsNode"
            }
            const proto = getGlobalThis()[fieldName]
            if (proto) {
                const field = proto.clone()

                field.setKey(this.name())
                field.setKeyIsEditable(false)
                field.setValueMethod(this.name())
                field.setValueIsEditable(this.canEditInspection())
                field.setCanDelete(false)

                if (this.label()) {
                    field.setKey(this.label())
                }

                if (this.validValues()) {
                    field.setValidValues(this.validValues())
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks())
                } else if (this.validValuesClosure()) {
                    const vv = this.validValuesClosure()()
                    field.setValidValues(vv)
                    field.setAllowsMultiplePicks(this.allowsMultiplePicks())
                }
                return field
            }
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
        this.setMethodForWillGet("willGetSlot" + n)
        this.setMethodForDidUpdate("didUpdateSlot" + n)
        this.setMethodForWillUpdate("willUpdateSlot" + n)
        this.setMethodForUndefinedGet("onUndefinedGet" + n) // for lazy slots
        this.setMethodForOnFinalized("onFinalizedSlot" + n) // for weak slots
        return this 
    }

    copyFrom (aSlot) {
        this._slotNames.forEach(slotName => {
            const privateName = "_" + slotName;
            this[privateName] = aSlot[privateName]
            /*
            const setterName = "set" + slotName.capitalized()
            const v = aSlot[slotName].apply(aSlot)
            this[setterName].apply(this, [v])
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
            this.setupSetter()
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

    setterName () {
        return "set" + this.name().capitalized()
    }

    directSetterName () {
        return "directSet" + this.name().capitalized()
    }

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
        return anInstance[this.setterName()].apply(anInstance, [aValue])
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
        if (this.isLazy()) {
            const valueRef = this.onInstanceGetValueRef(anInstance)
            if (valueRef) {
                this.onInstanceSetValueRef(otherInstance, valueRef)
                return this
            }
        }

        const v = this.onInstanceGetValue(anInstance)
        this.onInstanceSetValue(otherInstance, v)
        return this
    }

    // -----------------------------------------------------

    onInstanceInitSlot (anInstance) {
        assert(Reflect.has(anInstance, this.privateName())) // make sure slot is defined - this is true even if it's value is undefined
        let defaultValue = anInstance[this.privateName()]

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


        if (this.isLazy()) {
            const obj = this.initProto().clone()
            anInstance[this.privateName()] = obj
        } else if (this.initProto()) {
            const obj = this.initProto().clone()
            this.onInstanceSetValue(anInstance, obj)
        } else if (this.initValue()) {
            this.onInstanceSetValue(anInstance,this.initValue() )
        }

        if (this.field()) {
            // duplicate the field instance owned by the slot,
            // add it as a subnode to the instance,
            // and sync it to the instance's slot value
            const newField = this.field().duplicate()
            anInstance.addSubnode(newField)
            newField.getValueFromTarget()
        }
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

    shouldStoreSlotOnInstancePrivateName () {
        return "_shouldStoreSlot" + this.name().capitalized()
    }

    shouldStoreSlotOnInstance (anInstance) {
        const k = this.shouldStoreSlotOnInstancePrivateName()
        const v = anInstance[k]
        if (Type.isUndefined(v)) {
            return this.shouldStoreSlot()
        }
        return v === true
    }

    setShouldStoreSlotOnInstance (anInstance, aBool) {
        const k = this.shouldStoreSlotOnInstancePrivateName()
        Object.defineSlot(anInstance, k, aBool)
        return aBool
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

    super: function () {
        return this
    },

})
*/
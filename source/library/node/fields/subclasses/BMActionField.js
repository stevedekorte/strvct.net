"use strict";

/*

    BMActionField
    
    An abstraction of a UI visible action that can be performed on an object.
    the value is the action method name, the target is the field owner.

*/

(class BMActionField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototypeSlots () {

        {
            const slot = this.overrideSlot("title", null)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("Title")
        }

        {
            const slot = this.newSlot("methodName", null)
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("info", null)
            slot.setShouldStoreSlot(true)
        }

        // inherits isEnabled and isEditable slots from Field

        //this.newSlot("target", null)
    }

    initPrototype () {
        this.setShouldStore(true)
        this.setNodeTileIsSelectable(true)
        this.setNodeCanInspect(true)
        this.setKeyIsVisible(false)
        this.setValueIsVisible(false)
    }

    init () {
        super.init()
    }

    finalInit () {
        super.finalInit()
        this.initPrototype()
    }

    setTitle (s) {
        super.setTitle(s)
        return this
    }
    
    summary () {
        return ""
    }

    target () {
        const t = this._target;
        return t ? t : this.parentNode()
    }

    canDoAction () {
        const t = this.target()
        const m = this.methodName()
        return t && t[m]
    }

    doAction () {
        if (this.canDoAction()) {
            const func = this.target()[this.methodName()]
            
            if (Type.isFunction(func)) {
                func.call(this.target(), this)
            } else {
                //this.setValueError("no method with this name")
                console.warn("no method with this name")
            }
        } else {
            this.debugLog(" can't perform action ", this.methodName(), " on ", this.target())
        }
	    
	    return this
    }

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

    prepareToAccess () {
        //debugger
        super.prepareToAccess()
        this.syncFromTarget()
        return this
    }
    
    setActionInfo (infoDict) {
        //if (JSON.stableStringify(infoDict) != JSON.stableStringify(this.actionInfo())) {

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

        // this.didUpdateNodeIfInitialized();
        // }

        return this
    }

    actionInfo () {
        return {
            isEnabled: this.isEnabled(),
            title: this.title(),
            subtitle: subthis.title(),
            isVisible: this.isVisible()
        }
    }

}.initThisClass());

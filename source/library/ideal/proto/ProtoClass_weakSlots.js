"use strict";

/*

    Slot_weak
    
    Weak slots related methods

*/

(class ProtoClass_weakSlots extends ProtoClass {

    // this.newSlot("slotFinReg", null)

    slotsFinReg () {
        if (!this._slotsFinReg) {
            this._slotsFinReg = new FinalizationRegistry(aClosure => { 
                debugger;
                aClosure() 
            });
        }
        return this._slotsFinReg
    }

    // --- weak slots --- TODO: move to Object or Prototype

    onFinalizeWeakRefNamed (slotName, privateName) {
        debugger;
        const eventName = "onFinalize" + slotName.capitalized()
        if (this[eventName]) {
            this[eventName].apply(this, [])
            this[privateName] = null
        }
    }

    newSimpleWeakSlot (slotName, initialValue) {
        // TODO: use a single finalization registery on Object class for all weak slots and pass heldValue of slot name?
        const privateName = "_" + slotName + "WeakRef";

        Object.defineSlot(this, privateName, initialValue)

        if (!this[slotName]) {
            const simpleGetter = function () {
                const ref = this[privateName]
                return ref ? ref.deref() : null //returns undefined if sender was collected
            }

            Object.defineSlot(this, slotName, simpleGetter)
        }

        const setterName = "set" + slotName.capitalized()

        if (!this[setterName]) {
            const simpleSetter = function (newValue) {
                const ref = this[privateName]
                const oldValue = ref ? ref.deref() : null

                if (oldValue) {
                    globalFinReg.unregister(oldValue)
                }

                this[privateName] = new WeakRef(newValue);

                if (newValue) {
                    globalFinReg.register(newValue, () => { 
                        debugger; 
                        this.onFinalizeWeakRefNamed(slotName, privateName) 
                    }, newValue)
                }

                return this;
            }

            Object.defineSlot(this, setterName, simpleSetter)
        }

        //this._slotNames.add(slotName)
        
        return this;
    }
 

}.initThisCategory());




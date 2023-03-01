"use strict";


(class ProtoClass_store extends ProtoClass {

    recordForStore (aStore) { // should only be called by Store
        const aRecord = {
            type: this.type(), 
            entries: [], 
        }

        this.forEachSlotKV((slotName, slot) => {
            //if (slot.shouldStoreSlot()) {
            if (slot.shouldStoreSlotOnInstance(this)) {
                const v = slot.onInstanceGetValue(this)
                //assert(!Type.isUndefined(v))
                aRecord.entries.push([slotName, aStore.refValue(v)])
            }
        })

        return aRecord
    }

    lazyPids (puuids = new Set()) {
        // when doing Store.collect() will need to check for lazy slot pids on active objects
        this.allSlotsMap().forEachV(slot => {
            // only need to do this on unloaded store refs in instances
            const storeRef = slot.onInstanceGetValueRef(this)
            if (storeRef) {
                puuids.add(storeRef.pid())
            }
        })
        return puuids
    }

    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const k = entry[0]
            const v = entry[1]

            const slot = this.thisPrototype().slotNamed(k)
            // TODO: replace with slot.onInstanceSetValueFromEntry(this, entry, aStore)

            if (slot) {
                    if (!slot.hasSetterOnInstance(this)) {
                    // looks like the schema has changed 
                    // TODO: add something the schedule a didMutate?
                    console.warn("no setter for slot?")
                    debugger;
                } else {
                    /*if (slot.isLazy()) {
                        const pid = v["*"]
                        assert(pid)
                        const storeRef = StoreRef.clone().setPid(pid).setStore(aStore)
                        //console.log(this.typeId() + "." + slot.name() + " [" + this.title() + "] - setting up storeRef ")
                        slot.onInstanceSetValueRef(this, storeRef)
                    } else */
                    {
                        const unrefValue = aStore.unrefValue(v)
                        slot.onInstanceSetValue(this, unrefValue)
                    }
                }
            } else {
                console.warn("loadFromRecord found missing slot '" + k + "' - did schema change?")
                this.scheduleMethod("didMutate", 1000) // to force it to save - use high priorty number to cause it to be done after mutations on loading objects are being ignored e.g. before scheduled didInitLoadingPids is complete 
                //debugger;
            }
        })

        return this
    }

    /*
    didLoadFromStore (aStore) {
        // called by ObjectPool.didInitLoadingPids() after all objects are deserialized
        super.didLoadFromStore(aStore)
    }
    */

}).initThisCategory();

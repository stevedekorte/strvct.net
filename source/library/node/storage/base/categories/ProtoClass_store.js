/** * @module library.node.storage.base.categories
 */

/** * @class ProtoClass_store
 * @extends ProtoClass
 * @classdesc This class extends ProtoClass and provides methods for storing and loading object data.
 
 
 */

/**

 */
"use strict";

(class ProtoClass_store extends ProtoClass {

    static logPrefix () {
        return "[" + this.svType() + " Class] ";
    }

    /**
     * @static
     * @description Creates an instance from a record in the store. Should only be called by Store.
     * @param {Object} aRecord - The record to create the instance from.
     * @param {Object} aStore - The store object.
     * @returns {Object|null} The created instance or null if shouldStore is false.
     * @category Initialization
     */
    static instanceFromRecordInStore (/*aRecord, aStore*/) {

        if (!this.shouldStore()) {
            console.warn(this.logPrefix() + " instanceFromRecordInStore() attempting to load a record for an object (of type '" + this.svType() + ") with shouldStore set to false - returning null");
            return null;
        }

        const isSingleton = this.isSingleton();

        if (isSingleton && this._shared) {
            //console.warn(this.logPrefix() + "WARNING: instanceFromRecordInStore() on an allocated singleton.");
            //finalInit and afterInit should be skipped by the caller in this case
            return this._shared;
        }

        const instance = this.preClone ? this.preClone() : new this();
        instance.init();

        if (isSingleton && !this._shared) {
            this._shared = instance;
        }

        // caller needs to call finalInit and afterInit
        return instance;
    }

    /**
     * @description Creates a record for storing the object's data
     * @param {Object} aStore - The store object
     * @returns {Object} The record object containing the object's data
     * @category Storage
     */
    recordForStore (aStore) { // should only be called by Store
        const aRecord = {
            type: this.svType(),
            entries: []
        };

        this.allSlotsMap().forEachKV((slotName, slot) => {
            if (slot.shouldStoreSlotOnInstance(this)) {
                const v = slot.onInstanceGetValue(this);
                if (Type.isPromise(v)) {
                    throw new Error(this.svType() + " '" + slotName + "' slot is set to shouldStore, but contains a Promise value which cannot be stored");
                }
                assert(!Type.isUndefined(v), this.svType() + " slot '" + slotName + "' is set to shouldStore, but is undefined");

                let valueToRecord;
                if (slot.slotType() === "JSON Object") {
                    valueToRecord = JSON.stableStringify(v);
                } else {
                    valueToRecord = aStore.refValue(v);
                }

                aRecord.entries.push([slotName, valueToRecord]);
            }
        });

        return aRecord;
    }

    /*
    lazyPids (puuids = new Set()) {
        // when doing Store.collect() will need to check for lazy slot pids on active objects
        this.allSlotsMap().forEachV(slot => {
            // only need to do this on unloaded store refs in instances
            const storeRef = slot.onInstanceGetValueRef(this);
            if (storeRef) {
                puuids.add(storeRef.pid());
            }
        });
        return puuids;
    }
    */

    /**
     * @description Loads object data from a record
     * @param {Object} aRecord - The record containing the object's data
     * @param {Object} aStore - The store object
     * @returns {Object} The current object instance
     * @category Storage
     */
    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const k = entry[0];
            const v = entry[1];

            const slot = this.thisPrototype().slotNamed(k);
            // TODO: replace with slot.onInstanceSetValueFromEntry(this, entry, aStore)

            if (slot) {
                if (!slot.hasSetterOnInstance(this)) {
                    // looks like the schema has changed
                    // TODO: add something the schedule a didMutate?
                    console.warn("no setter for slot '" + slot.name() + "'?");
                } else {
                    if (slot.isLazy()) {
                        // store the pid in _privateNameLazyPid for use on asyncGetter call
                        const pid = v["*"];
                        assert(pid);
                        this[slot.privateNameLazyPid()] = pid;
                        //const storeRef = StoreRef.clone().setPid(pid).setStore(aStore);
                        //console.log(this.svTypeId() + "." + slot.name() + " [" + this.title() + "] - setting up storeRef ");
                        //slot.onInstanceSetValueRef(this, storeRef);
                    } else if (slot.slotType() === "JSON Object") {
                        const unrefedValue = JSON.parse(v);
                        slot.onInstanceSetValue(this, unrefedValue);
                    } else {
                        const unrefedValue = aStore.unrefValue(v);
                        try {
                            slot.onInstanceSetValue(this, unrefedValue);
                        } catch (error) {
                            console.error(this.svType() + " loadFromRecord() error setting value for slot '" + slot.name() + "'", error);
                            console.error("RESOLUTION: since this was during loadFromRecord(), we will leave the existing value in the slot");
                            //debugger;
                        }
                    }
                }
            } else {
                console.warn("loadFromRecord(aRecord), aRecord has slot '" + k + "' but '" + this.svType() + "' does not. Did schema change?");

                this.scheduleMethod("didMutate", 1000); // to force it to save - use high priorty number to cause it to be done after mutations on loading objects are being ignored e.g. before scheduled didInitLoadingPids is complete

            }
        });

        return this;
    }

    /*
    didLoadFromStore (aStore) {
        // called by ObjectPool.didInitLoadingPids() after all objects are deserialized
        super.didLoadFromStore(aStore);
    }
    */

}).initThisCategory();

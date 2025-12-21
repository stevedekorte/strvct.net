"use strict";

/** * @module library.ideal.object
 */

/** * @class Object_init
 * @extends Object
 * @classdesc Initialization related behavior.
 *
 * Notes:
 *
 * Init outside of deserialization looks like this:
 *
 *     static clone () {
        const obj = this.preClone();
        obj.init();
        obj.finalInit();
        obj.afterInit(); // calls didInit, which sets _hasDoneInit to true
        //this.allInstancesWeakSet().add(obj)
        return obj;
    }

 * Init inside of deserialization looks like this (within ObjectPool):
 *
       obj.loadFromRecord(aRecord, this)

        this.loadingPids().delete(obj.puuid()) // need to do this to get object to ber marked as dirty if it's slots are updated in finalInit

        assert(!obj._hasDoneInit);
        if (obj.finalInit) {
            obj.finalInit();
        }
        if(!obj._hasDoneInit) {
            obj.finalInit();
        }

        if (obj.afterInit) {
            obj.afterInit(); // calls didInit, which sets _hasDoneInit to true
        }

    And didInit (which sets _hasDoneInit to true) is called from Object_init.afterInit.

 *
 * Some initialization may have to wait until other objects have initialized.
 *
 * These are some states the object may need to wait for,
 * and how to handle completing initialization at those points:
 *
 * - initAfterEventLoop() (end of current event loop)
 *   In your class's init() method, call this.setShouldScheduleDidInit(true) and implement didInit()
 *   This will cause the didInit method called after Object.init() inside Object.clone() to
 *   be scheduled for the end of the current event loop.
 *
 * - initAfterDeserialization of the ObjectPool that created the object is complete (similar to awakeFromNib:)
 *   Implement a didLoadFromStore(aStore) method.
 *   This will be called (on the deserialized objects) after the ObjectPool has finished deserializing.
 *   Deserialization currently takes place synchronously within a single event loop.
 *
 * - appDidInit (when the Application posts an appDidInit notification)
 *   Implement an appDidInit() method, and in init() call this.listenForAppDidInit().
 *
 
 
 */

/**

 */

(class Object_init extends Object {

    /**
     * Sets whether didInit should be scheduled.
     * @param {boolean} aBool - Whether to schedule didInit.
     * @returns {Object_init} This object.
     * @category Initialization
     */
    setShouldScheduleDidInit (aBool) {
        this._shouldScheduleDidInit = aBool;
        return this;
    }

    /**
     * Checks if didInit should be scheduled.
     * @returns {boolean} Whether didInit should be scheduled.
     * @category Initialization
     */
    shouldScheduleDidInit () {
        return this._shouldScheduleDidInit;
    }

    /**
     * Initializes the object. Called by Object.clone().
     * @returns {Object_init} This object.
     * @category Initialization
     */
    init () {
        return this;
    }

    /**
     * Performs final initialization. Called after deserialization or after init().
     * @returns {Object_init} This object.
     * @category Initialization
     */
    finalInit () {
        return this;
    }

    isSingleton () {
        const aClass = this.thisClass();
        assert(aClass !== this);
        return aClass._isSingleton === true;
    }

    /**
     * Performs actions after initialization.
     * @category Initialization
     */
    afterInit () {
        if (this.isSingleton()) {
            if (this.hasDoneInit()) {
                return; // no need to call didInit again (but what if we updated slots when reading from the store?)
            }
        } else {
            assert(!this.hasDoneInit()); // sanity check
        }

        if (this.shouldScheduleDidInit()) {
            this.scheduleDidInit();
        } else {
            this.didInit();
        }
    }

    /**
     * Called when initialization is complete.
     * @category Initialization
     */
    didInit () {
        if (!this.isSingleton()) {
            assert(!this.hasDoneInit());
        }
        this.setHasDoneInit(true);
    }

    /**
     * Checks if initialization has been completed.
     * @returns {boolean} Whether initialization has been completed.
     * @category State
     */
    hasDoneInit () {
        return this._hasDoneInit === true; // hasDoneInit only set after serialization
    }

    /**
     * Sets whether initialization has been completed.
     * @param {boolean} aBool - Whether initialization has been completed.
     * @returns {Object_init} This object.
     * @category State
     */
    setHasDoneInit (aBool) {
        this._hasDoneInit = aBool;
        return this;
    }

    /**
     * Schedules the didInit method to be called.
     * @category Initialization
     */
    scheduleDidInit () {
        assert(this.shouldScheduleDidInit());
        assert(!this.hasDoneInit());
        this.scheduleMethod("didInit");
    }

}).initThisCategory();

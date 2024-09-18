"use strict";

/**
 * Initialization related behavior, and some important notes related to initialization.
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
 * @module library.ideal.object
 * @class Object_init
 * @extends Object
 */

(class Object_init extends Object {

    /**
     * Sets whether didInit should be scheduled.
     * @param {boolean} aBool - Whether to schedule didInit.
     * @returns {Object_init} This object.
     */
    setShouldScheduleDidInit (aBool) {
        this._shouldScheduleDidInit = aBool
        return this
    }

    /**
     * Checks if didInit should be scheduled.
     * @returns {boolean} Whether didInit should be scheduled.
     */
    shouldScheduleDidInit () {
        return this._shouldScheduleDidInit
    }

    /**
     * Initializes the object. Called by Object.clone().
     * @returns {Object_init} This object.
     */
    init () { 
        return this
    }

    /**
     * Performs final initialization. Called after deserialization or after init().
     * @returns {Object_init} This object.
     */
    finalInit () {
        return this
    }

    /**
     * Performs actions after initialization.
     */
    afterInit () {
        if (this.thisClass().isSingleton === undefined || !this.thisClass().isSingleton()) {
            assert(!this.hasDoneInit()) // sanity check
        }

        if (this.shouldScheduleDidInit()) {
            this.scheduleDidInit()
        } else {
            this.didInit()
        }
    }

    /**
     * Called when initialization is complete.
     */
    didInit () {
        if (this.thisClass().isSingleton === undefined || !this.thisClass().isSingleton()) {
            assert(!this.hasDoneInit()); 
        }
        this.setHasDoneInit(true)
    }

    /**
     * Checks if initialization has been completed.
     * @returns {boolean} Whether initialization has been completed.
     */
    hasDoneInit () {
        return this._hasDoneInit === true // hasDoneInit only set after serialization
    }
    
    /**
     * Sets whether initialization has been completed.
     * @param {boolean} aBool - Whether initialization has been completed.
     * @returns {Object_init} This object.
     */
    setHasDoneInit (aBool) {
        this._hasDoneInit = aBool;
        return this
    }
    
    /**
     * Schedules the didInit method to be called.
     */
    scheduleDidInit () {
        assert(this.shouldScheduleDidInit())
        assert(!this.hasDoneInit())
        this.scheduleMethod("didInit") 
    }

}).initThisCategory();

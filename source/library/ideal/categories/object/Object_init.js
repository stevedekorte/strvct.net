"use strict";


/* 

    Object_init

    Initialization related behavior, and some important notes related to initialization.
    
    Some initialization may have to wait until other objects have initialized. 
    
    These are some states the object may need to wait for, 
    and how to handle completing initialization at those points:

    - initAfterEventLoop() (end of current event loop)

        In your class's init() method, call this.setShouldScheduleDidInit(true) and implement didInit()
        This will cause the didInit method called after Object.init() inside Object.clone() to 
        be scheduled for the end of the current event loop.

    - initAfterDeserialization of the ObjectPool that created the object is complete (similar to awakeFromNib:)

        Implement a didLoadFromStore(aStore) method. 
        This will be called (on the deserialized objects) after the ObjectPool has finished deserializing.
        Deserialization currently takes place synchonously within a single event loop.

    - appDidInit (when the Application posts an appDidInit notification)

        Implement an appDidInit() method, and in init() call this.listenForAppdidInit().


*/

(class Object_init extends Object {

    setShouldScheduleDidInit (aBool) {
        this._shouldScheduleDidInit = aBool
        return this
    }

    shouldScheduleDidInit () {
        return this._shouldScheduleDidInit
    }

    init () { 
        // this is called by Object.clone()
        // here to be overridden by subclasses
        return this
    }

    afterInit () {
        assert(!this.hasDoneInit()) // sanity check
        if (this.shouldScheduleDidInit()) {
            this.scheduleDidInit() // implemented in Object_init.js
        } else {
            this.didInit()
        }
    }

    didInit () {
        assert(!this.hasDoneInit())
        this.setHasDoneInit(true)
    }

    hasDoneInit () {
        return this._hasDoneInit === true
    }
    
    setHasDoneInit (aBool) {
        this._hasDoneInit = aBool
        return this
    }
    
    scheduleDidInit () {
        assert(this.shouldScheduleDidInit())
        console.log("Object " + this.debugTypeId() + " scheduleDidInit")
        this.scheduleMethod("didInit") 
    }

    // -------------------------

    listenForAppdidInit () {
        this.watchOnceForNote("appDidInit")
    }

}).initThisCategory();
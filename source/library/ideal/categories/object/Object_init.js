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

        Implement an appDidInit() method, and in init() call this.listenForAppDidInit().


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
        /*

        In normal object creation, we call clone() and it calls:
            obj.init()
            obj.finalInit()
            obj.afterInit()

        But for deserialization:
        */

        return this
    }

    finalInit () {
        // if deserializing, called after (loadFromRecord) deserialization 
        // otherwise, called after init()
        return this
    }

    afterInit () {
        //console.log(this.type() + ".afterInit")

        if (this.thisClass().isSingleton === undefined || !this.thisClass().isSingleton()) { // temporary hack to avoid singleton getting multiple didInits
            assert(!this.hasDoneInit()) // sanity check
        }

        if (this.shouldScheduleDidInit()) {
            this.scheduleDidInit() // implemented in Object_init.js
        } else {
            this.didInit()
        }
    }

    didInit () {
        if (this.thisClass().isSingleton === undefined || !this.thisClass().isSingleton()) { // temporary hack to avoid singleton getting multiple didInits
            assert(!this.hasDoneInit()); 
        }
        this.setHasDoneInit(true)
    }

    hasDoneInit () {
        return this._hasDoneInit === true // hasDoneInit only set after serialization
    }
    
    setHasDoneInit (aBool) {
        //assert(this._hasDoneInit === false)
        this._hasDoneInit = aBool; // NOTE: if shouldScheduleDidInit (e.g. in StorableNode), then this gets called at *end* of event loop
        return this
    }
    
    scheduleDidInit () {
        //console.log(this.typeId() + " " + this.debugTypeId() + " scheduleDidInit")
        assert(this.shouldScheduleDidInit())
        assert(!this.hasDoneInit())
        this.scheduleMethod("didInit") 
    }

    // -------------------------

    /*
    listenForAppDidInit () {
        this.watchOnceForNote("appDidInit")
    }
    */

}).initThisCategory();

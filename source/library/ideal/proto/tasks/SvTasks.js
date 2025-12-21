"use strict";

/** * @module library.ideal.proto
 */

/** * @class ProtoClass
 * @extends Object
 * @classdesc A place for adding Smalltalk-like features to the base object
 * that we don't want to add to all Object (and Object descendants) yet,
 * as I'm not sure how they might affect the rest of the system.
 
 
 */

/**

 */

(class SvTasks extends ProtoClass {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setTitle("Tasks");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvTask]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeCanDelete(false);
    }

}.initThisClass());

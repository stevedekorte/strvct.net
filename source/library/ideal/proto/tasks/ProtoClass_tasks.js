"use strict";

/**
 * @module library.ideal.proto
 * @class ProtoClass_tasks
 * @extends ProtoClass
 * @classdesc 
 */

(class ProtoClass_tasks extends ProtoClass {

    async asyncRunTaskMethod (methodName, methodArgs) {
        const task = new SvTask();
        task.setTarget(this);
        task.setMethodName(methodName);
        task.setMethodArgs(methodArgs);
        this.tasks().addSubnode(task);
        return await task.begin();
    }

    // TODO: need to add a task slot to ProtoClass and set it to be stored

    tasks () {
        // create tasks object only when needed
        // might need to be careful if this is called during deserialization?
        if (this._tasks === undefined) {
            this._tasks = new SvTasks();
        }
        return this._tasks;
    }

    manageTasksAfterDeserialization () {
        this.tasks().forEachSubnode(task => {
            task.awakeFromDeserialization();
        });
    }

}.initThisClass());

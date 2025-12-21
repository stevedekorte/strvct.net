"use strict";

/** * @module library.ideal.misc
 */

/** * @class Documentation
 * @extends ProtoClass
 * @classdesc An simple in-memory documentation system.
 *
 * TODO: Rename to something more unique.
 
 
 */

/**

 */
(class Documentation extends ProtoClass {
    initPrototypeSlots () {
    }

    initPrototype () {
    }

    /**
     * @description Returns an array of all the classes.
     * @returns {Array} An array of all the classes.
     * @category Data Retrieval
     */
    classes () {
        return ProtoClass.allClassesSet().asArray();
    }

    /**
     * @description Returns an array of objects containing information about the methods of the given class.
     * @param {ProtoClass} aClass - The class for which to get the method documentation.
     * @returns {Array} An array of objects containing information about the methods of the given class.
     * @category Data Retrieval
     */
    methodsDocsForClass (aClass) {
        const methods = [];
        Object.getOwnPropertyNames(aClass).forEach((methodName) => {
            const v = aClass[methodName];
            if (Type.isFunction(v) && methodName !== "constructor") {
                const source = v.toString();
                let argNames = source.after("(").before(")").split(",").map(s => s.trim());
                if (argNames[0] === "") {
                    argNames = [];
                }
                methods.push({ name: methodName, argNames: argNames, comments: v.extractComments() });
            }
        });
        return methods;
    }

    /**
     * @description Returns a JSON representation of the documentation for all classes and their methods.
     * @returns {Object} A JSON representation of the documentation for all classes and their methods.
     * @category Data Representation
     */
    asJson () {
        const classes = [];
        this.classes().forEach((aClass) => {
            const classDict = {};
            classDict.name = aClass.svType();
            const superclass = aClass.superClass();
            if (Type.isFunction(superclass.svType)) {
                classDict.superClass = superclass.svType();
            }
            classes.push(classDict);
            classDict.methods = this.methodsDocsForClass(aClass);
        });
        return classes;
    }

    /**
     * @description Logs a summary of the documentation for all classes and their methods to the console.
     * @category Output
     */
    show () {
        const classes = this.asJson();
        const lines = [];
        classes.forEach((aClass) => {
            lines.push(aClass.name + " : " + aClass.superClass);
        });
        console.log("DOCUMENTATION:\n\n", lines.join("\n"));
    }
}.initThisClass());

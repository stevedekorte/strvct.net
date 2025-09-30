"use strict";

/**
 * @module library.ideal.json.JsonSchema
 * @class JsonSchema
 * @classdesc This class provides utility methods for working with JSON schemas.
 * @extends Object
 */

SvGlobals.globals().JsonSchema = (class JsonSchema extends Object {

    /**
     * @description Finds all definition references in a given JSON schema.
     * @static
     * @param {Object} schema - The JSON schema to search for definition references.
     * @returns {Set} A set of all the definition references found in the schema.
     * @category Schema Analysis
     */
    static definitionRefsInJsonSchema (schema) {
        const refs = new Set();
        const addRef = (ref) => {
            if (ref) {
                refs.add(ref);
            }
        };

        const addRefs = (obj) => {
            if (Type.isArray(obj)) {
                obj.forEach(v => {
                    addRefs(v);
                });
            } else if (Type.isObject(obj)) {
                Object.keys(obj).forEach(k => {
                    const v = obj[k];
                    if (k === "$ref") {
                        addRef(v);
                    } else {
                        addRefs(v);
                    }
                });
            }
        };

        addRefs(schema);
        return refs;
    }

    /**
     * @description Finds classes for a given set of definition references.
     * @static
     * @param {Set} definitionRefs - A set of definition references to find classes for.
     * @returns {Set} A set of classes corresponding to the given definition references.
     * @throws {Error} If a class is not found for any of the given definition references.
     * @category Class Resolution
     */
    static classesForRefs (definitionRefs) {
        const classes = new Set();
        definitionRefs.forEach(ref => {
            const cls = this.classForRef(ref);
            if (cls) {
                classes.add(cls);
            } else {
                throw new Error("no class found for ref " + ref);
            }
        });
        return classes;
    }

    /**
     * @description Finds the class for a given definition reference.
     * @static
     * @param {string} ref - The definition reference to find the class for.
     * @returns {Class|undefined} The class corresponding to the given definition reference, or undefined if no class is found.
     * @category Class Resolution
     */
    static classForRef (ref) {
        const className = this.classNameForRef(ref);
        const cls = this.classForClassName(className);
        return cls;
    }

    /**
     * @description Extracts the class name from a given definition reference.
     * @static
     * @private
     * @param {string} ref - The definition reference to extract the class name from.
     * @returns {string} The class name extracted from the definition reference.
     * @category Utility
     */
    static classNameForRef (ref) {
        const parts = ref.split("/");
        const className = parts[parts.length - 1];
        return className;
    }

    /**
     * @description Finds the class for a given class name.
     * @static
     * @private
     * @param {string} className - The name of the class to find.
     * @returns {Class|undefined} The class corresponding to the given class name, or undefined if no class is found.
     * @category Class Resolution
     */
    static classForClassName (className) {
        const aClass = SvGlobals.globals()[className];
        return aClass;
    }

});

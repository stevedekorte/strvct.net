"use strict";


getGlobalThis().JsonSchema = (class JsonSchema extends Object {

    static definitionRefsInJsonSchema (schema) {
        const refs = new Set();
        const addRef = (ref) => {
            if (ref) {
                refs.add(ref);
            }
        }

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
        }

        addRefs(schema);
        return refs;
    }

    static classesForRefs (definitionRefs) {
        const classes = new Set();
        refs.forEach(ref => {
            const cls = this.classForRef(ref);
            if (cls) {
                classes.add(cls);
            } else {
                throw new Error("no class found for ref " + ref);
            }
        });
        return classes;
    }

    static classForRef (ref) {
        const className = this.classNameForRef(ref);
        const cls = this.classForClassName(className);
        return cls;
    }

    static classNameForRef (ref) {
        const parts = ref.split("/");
        const className = parts[parts.length - 1];
        return className;      
    }

    static classForClassName (className) {
        const aClass = getGlobalThis()[className];
        return aClass;
    }

});

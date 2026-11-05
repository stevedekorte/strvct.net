"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_json
 * @extends SvNode
 * @classdesc JSON: the JSON archive (asJsonArchive / fromJsonArchive), JSON schema properties, and the class's JSON schema. asRootJsonSchema and asJsonSchema stay in SvNode.js: they override ProtoClass's, which a category cannot do.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_json extends SvNode {

    // --- jsonArchive ---

    /**

     * @description Set the JSON archive for this instance.
     * @param {object} json - The JSON object to set.
     * @returns {SvNode} This instance.
     */
    setJsonArchive (json) {
        // NOTE: use slot.setShouldJsonArchive(true) to set a slot to be json archived

        //console.log(this.logPrefix(), ".setJsonArchive(" + JSON.stableStringifyWithStdOptions(json, null, 2) + ")");

        //const keys = Object.keys(json).select(key => key !== "type");
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
        //assert(keys.length === jsonArchiveSlots.length); // or should we assume a diff if missing?

        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName();
            const v = json[k];
            if (Object.hasOwn(json, k)) {
                slot.onInstanceSetValue(this, v);
            } else {
                console.warn("no dict key '" + k + "' for archive slot " + k);
            }
        });

        /*
        keys.forEach(key => {
            if (key !== "type") {
            const slot = this.thisPrototype().slotNamed(key);
            assert(slot);
            const value = json[key];
            slot.onInstanceSetValue(this, value);
            }
        })
        */

        return this;
    }


    /**

     * @description Get the JSON archive for this instance.
     * @returns {object} The JSON archive.
     */
    jsonArchive () {
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
        const dict = {
            type: this.svType()
        };

        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName();
            const v = slot.onInstanceGetValue(this);
            assert(Type.isJsonType(v), "value is not a JSON type, it's a '" + Type.typeName(v) + "'");
            dict[k] = v;
        });

        //console.log(this.logPrefix(), ".jsonArchive() = " + JSON.stableStringifyWithStdOptions(dict, null, 2));

        return dict;
    }

    /**

     * @description Create an instance from a JSON archive.
     * @param {object} json - The JSON object to create the instance from.
     * @returns {SvNode} The new instance.
     */
    static fromJsonArchive (json) {
        const className = json.type;
        assert(className); // sanity check

        const aClass = SvGlobals.globals()[className];
        assert(aClass.isKindOf(this)); // sanity check

        const instance = aClass.clone().setJsonArchive(json);
        return instance;
    }

    // --- JSON schema properties ---

    /**

     * @description Get the JSON schema string for this instance.
     * @returns {string} The JSON schema string.
     */
    static jsonSchemaString () {
        const schema = this.asRootJsonSchema();
        const s = JSON.stableStringifyWithStdOptions(schema, null, 2);
        return s;
    }

    /*
     * @description Get the tagged JSON schema string for this instance inside a <json-schema> tag.
     * @returns {string} The tagged JSON schema string.
     */
    static taggedJsonSchemaString () {
        return "<json-schema>\n" + this.jsonSchemaString() + "\n</json-schema>";
    }

    /**

     * @description Get the JSON schema title for this instance.
     * @returns {string} The JSON schema title.
     */
    static jsonSchemaTitle () {
        return this.svType();
    }

    /**

     * @description Get the JSON schema slots for this instance.
     * @returns {Array} The JSON schema slots.
     */
    static jsonSchemaSlots () {
        const jsonArchiveSlots = this.prototype.slotsWithAnnotation("isInJsonSchema", true);
        return jsonArchiveSlots;
    }

    /**
     * @description Get the cloud JSON schema slots for this instance.
     * Returns slots where isInCloudJson() returns true.
     * @returns {Array} The cloud JSON schema slots.
     */
    static cloudJsonSchemaSlots () {
        // Get all slots and filter by isInCloudJson()
        // Note: isInCloudJson() defaults to isInJsonSchema() if not explicitly set
        const allSlots = this.prototype.allSlotsMap().valuesArray();
        return allSlots.filter(slot => slot.isInCloudJson());
    }

    /**

     * @description Get the JSON schema properties for this instance.
     * @param {Set} refSet - The reference set.
     * @returns {object} The JSON schema properties.
     */
    static jsonSchemaProperties (refSet) {
        assert(refSet);
        assert(this.asJsonSchema); // sanity check - we'll need this
        refSet.add(this);

        const slots = this.jsonSchemaSlots();

        if (slots.length === 0) {
            return {}; // Return empty object instead of undefined
        }

        const properties = {};

        slots.forEach(slot => {
            properties[slot.getterName()] = slot.asJsonSchema(refSet);
        });

        return properties;
    }

    /**

     * @description Get the JSON schema required for this instance.
     * @returns {Array} The JSON schema required.
     */
    static jsonSchemaRequired () {
        const slots = this.jsonSchemaSlots();

        if (slots.length === 0) {
            return undefined;
        }

        const required = [];

        slots.forEach(slot => {
            //if (!slot.allowsNullValue()) {
            if (slot.isRequired()) {
                required.push(slot.getterName());
            }
        });

        return required;
    }

    // --- json schema ---

    /**

     * @description Get the root JSON schema string for this instance.
     * @param {boolean} definitionsOnly - Whether to include only the definitions.
     * @returns {string} The root JSON schema string.
     */
    static asRootJsonSchemaString (definitionsOnly = false) {
        const json = this.asRootJsonSchema(definitionsOnly);
        const s = JSON.stableStringifyWithStdOptions(json, null, 4);
        return s;
    }

    asRootJsonSchemaString () {
        return this.thisClass().asRootJsonSchemaString();
    }

    /**

     * @description Get the JSON schema definitions for a reference set.
     * @param {Set} refSet - The reference set.
     * @returns {object} The JSON schema definitions.
     */
    static jsonSchemaDefinitionsForRefSet (refSet) {
        assert(refSet);
        const definitions = {};

        // iterate to grab all the definitions - simple but a bit inefficient. Not used in tight loops, so no problem.
        let done = false;
        const classNameToSchemaMap = new Map();
        while (!done) {
            done = true;
            Array.from(refSet).forEach(aClass => {
                const className = aClass.svType();
                if (!classNameToSchemaMap.has(className)) {
                    classNameToSchemaMap.set(className, aClass.asJsonSchema(refSet));
                    done = false;
                }
            });
        }

        // let's define them in alphabetical order to (possibly) make looking at the JSON easier (AI needs to look at this)
        const orderedClassNames = classNameToSchemaMap.keysArray().sort();
        orderedClassNames.forEach((className) => {
            const jsonSchema = classNameToSchemaMap.get(className);
            definitions[className] = jsonSchema;
        });

        /*
        // as we write out the definitions, we'll get encounter more refs,
        // so we need to queue them to be added too

        const definedClasses = new Set();
        let undefinedClasses = new Set(refSet);

        while (undefinedClasses.size) {
            const newRefSet = new Set();
            undefinedClasses.forEach(aClass => {
                const schemaDef = aClass.asJsonSchema(newRefSet);
                assert(!Type.isNullOrUndefined(schemaDef), "missing schemaDef for " + aClass.svType());
                definitions[aClass.svType()] = schemaDef;
                definedClasses.add(aClass);
            });
            undefinedClasses = newRefSet.difference(definedClasses); // returns set with items in newRefSet but not in definedClasses
        }
        const definedClassNames = Array.from(definedClasses).map(c => c.svType());
        console.log(this.logPrefix(), "definedClasses: [" + definedClassNames.join(", ") + "]");
        console.log(this.logPrefix(), "definitions: [" + Object.keys(definitions).join(", ") + "]");
        */
        return definitions;
    }

    static jsonSchemaIsReadOnly () {
        return false;
    }

    /**

     * @description Get the JSON schema reference for this instance.
     * @param {Set} refSet - The reference set.
     * @returns {string} The JSON schema reference.
     */
    static jsonSchemaRef (refSet) {
        assert(refSet);
        return this.jsonSchemaRefForTypeName(this.svType(), refSet);
    }

    /**

     * @description Get the JSON schema reference for a type name.
     * @param {string} typeName - The type name.
     * @param {Set} refSet - The reference set.
     * @returns {string} The JSON schema reference.
     */
    static jsonSchemaRefForTypeName (typeName, refSet) {
        if (!refSet.has(this)) {
            this.asJsonSchema(refSet); // so we add references within the referenced type
        }
        assert(Type.isSet(refSet));
        assert(this.asJsonSchema); // sanity check - we'll need this
        assert(this.jsonSchemaDescription(), "missing jsonSchemaDescription for " + this.svType());
        refSet.add(this); // all classes in this set will be added to the "definitions" section of the root schema
        return "#/definitions/" + typeName;
    }

    /**

     * @description Create an instance from a JSON object.
     * @param {object} json - The JSON object.
     * @returns {SvNode} The new instance.
     */
    static instanceFromJson (json) {
        const properties = json.properties;
        assert(properties, "missing properties in json");

        const className = properties.className;
        assert(className, "missing className in json");

        const aClass = SvGlobals.globals()[className];
        assert(aClass, "missing class for className '" + className + "'");
        const instance = aClass.fromJsonSchema(json);

        return instance;
    }

    /**

     * @description Set the instance from a JSON object.
     * @param {object} json - The JSON object.
     * @returns {SvNode} This instance.
     */
    fromJsonSchema (json) {
        const slots = this.slotsWithAnnotation("isInJsonSchema", true);

        const requiredSlots = slots.filter(slot => slot.isRequired());
        const requiredSlotNamesSet = new Set(requiredSlots.map(slot => slot.getterName()));

        Object.keys(json).forEach(key => {
            const slot = slots.getSlot(key);
            if (slot) {
                assert(slot.isInJsonSchema(), "attempt to set slot not in json schema");

                if (slot.name() === "subnodes") { // special case subnodes for now?
                    //console.log(this.logPrefix(), "fromJsonSchema setting subnodes");
                    const subnodes = json[key];
                    this.removeAllSubnodes();
                    subnodes.forEach(subnodeJson => {
                        const subnode = SvNode.instanceFromJson(subnodeJson);
                        if (this.acceptsSubnodeClass(subnode.thisClass())) {
                            this.addSubnode(subnode);
                        } else {
                            console.warn("fromJsonSchema subnode class '" + subnode.svType() + "' not in subnodeClasses " + JSON.stableStringifyWithStdOptions(this.subnodeClasses().map(c => c.svType())));
                        }
                    });
                } else {
                    const value = json[key];
                    slot.onInstanceSetValueWithJsonSchemaTypeCheck(this, value);
                }
            } else {
                console.warn("fromJsonSchema missing slot for key '" + key + "'");
            }
            requiredSlotNamesSet.delete(key);
        });

        if (requiredSlotNamesSet.size > 0) {
            // verify all required slots were set
            console.warn("fromJsonSchema missing required slots: " + Array.from(requiredSlotNamesSet).join(", "));
        }

        return this;
    }

}.initThisCategory());

"use strict";

/*
    @module app/json
    @class JsonGroup
    @extends SvJsonIdNode
    @classdesc A JsonGroup is a node that supports importing and exporting itself as JSON dictionary data.

*/

(class JsonGroup extends SvJsonIdNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("lastJson", null); // used for top level of json patches
            slot.setSlotType("JSON Object");
        }

    /*
    {
      const slot = this.newSlot("hasBeenLoaded", null);
      slot.setSlotType("Boolean");
      slot.setIsInJsonSchema(false);
      slot.setCanInspect(true);
    }
    */
    }

    initPrototype () {
        this.setNoteIconName("right-arrow");
        this.setSummaryFormat("key value");
        this.setHasNewlineAfterSummary(true);
        this.setHasNewLineSeparator(true);
        this.setNodeSubtitleIsChildrenSummary(true);
        this.setShouldStoreSubnodes(false); //default to just slots.  Subclasses can override.
        this.setNodeCanEditTitle(false);
    }

    // --- lazy loading support ---

    static alwaysLoadedSlotNames () { // override on large json objects like Character, Location, etc.
        return []; // subclasses should override if they support lazy loading
    // NOTE: they should include "hasBeenLoaded" slot name if they support lazy loading
    }

    static supportsHasBeenLoaded () {
        return this.alwaysLoadedSlotNames().length > 0;
    }

    /*
  markAsLoaded () {
    this.setHasBeenLoaded(true);
    return this;
  }

  markAsUnloaded () {
    this.setHasBeenLoaded(false);
    return this;
  }

  isLoaded () {
    return this.hasBeenLoaded() !== false;
  }

  isUnloaded () {
    return this.hasBeenLoaded() === false;
  }
  */

    shouldIncludeSlot (/*slotName*/) {
        return true;
    /*
    if (slotName === "hasBeenLoaded") {
      return this.thisClass().supportsHasBeenLoaded();
    }
    if (this.isLoaded()) {
      return true; // include all slots when loaded
    }
    return this.constructor.alwaysLoadedSlotNames().includes(slotName);
    */
    }

    // ------------------

    asJson () {
        const json = this.calcJson();
        /*
    if (this.thisClass().supportsHasBeenLoaded()) {
      json.hasBeenLoaded = this.isLoaded();
    } else {
      delete json.hasBeenLoaded;
    }
    */
        return json;
    }

    setJsonArchive () {
        throw new Error("don't use this");
    }

    jsonArchive () {
        throw new Error("don't use this");
    }

    json () {
        throw new Error("don't use this");
    }

    // -----------------------

    jsonString () {
    //return JSON.stableStringifyWithStdOptions(this.asJson(), null, 2) // hard to read and no formatting
        return JSON.stableStringifyWithStdOptions(this.asJson(), null, 2);
    }

    updateJson (/*json, jsonPathComponents = []*/) {
        throw new Error(this.svType() + ".updateJson() is no longer implemented. applyJsonPatches() is the new method to use.");
    /*
    this.setJson(json, jsonPathComponents)
    return this
    */
    }

    jsonSubnodes () {
        return this.subnodes().select(sn => sn.respondsTo("asJson"));
    }

    setJson (dict, jsonPathComponents = []) {
        if (this.shouldStoreSubnodes()) {
            this.setSubnodesJson(dict, jsonPathComponents);
        } else {
            this.setSlotsJson(dict, jsonPathComponents);
        }
        return this;
    }

    setSubnodesJson (dict, jsonPathComponents = []) {
        let keys = Object.keys(dict);

        //console.log("keys: ", keys);
        //let localKeys = this.jsonSubnodes().map(sn => sn.title());
        //console.log("localKeys: ", localKeys);

        // first remove missing keys
        const subnodesToRemove = this.jsonSubnodes().select(sn => {
            const notFound = !keys.includes(sn.title());
            if (notFound) {
                console.warn(this.svType() + ".setJson() did not find key: ", sn.title(), " at path: " + jsonPathComponents.join("/"));

            }
            return notFound;
        });
        subnodesToRemove.forEach(sn => this.removeSubnode(sn));

        // now merge matching keys and add missing keys
        keys.forEach(k => {
            const v = dict[k];
            const sn = this.firstSubnodeWithTitle(k);

            if (sn) {
                sn.setJson(v, jsonPathComponents.concat(k));
            } else {
                // we don't actually add keys here... that's for flex
            }
        });
        return this;
    }

    setSlotsJson (dict, jsonPathComponents = []) {
        const keys = Object.keys(dict);
        keys.forEach(k => {
            const v = dict[k];
            const slot = this.getSlot(k);
            if (slot) {
                if (slot.isSubnode()) {
                    const node = slot.onInstanceGetValue(this);
                    if  (node) {
                        if (node.setJson) {
                            node.setJson(v, jsonPathComponents.concat(k));
                        } else {
                            console.warn(this.svTypeId() + ".setJson() found slot with no setJson(): ", k, " at path: " + jsonPathComponents.concat(k).join("/"));
                        }
                    }
                    else {
                        console.warn(this.svTypeId() + ".setJson() found slot with no node: ", k, " at path: " + jsonPathComponents.concat(k).join("/"));
                    }
                }
                else {
                    if (slot.finalInitProto()) {
                        const node = slot.onInstanceGetValue(this);

                        if (node) {
                            if (Type.isPrimitiveJsonType(v)) {
                                // just set the slot if it's a primitive
                                slot.onInstanceSetValue(this, v);
                            } else if (node.jsonId() === v.jsonId || node.jsonId() === undefined) {
                                // otherwise, make sure jsonId's match
                                node.setJson(v, jsonPathComponents.concat(k));
                            } else {
                                // if not, something is wrong

                                // since jsonId is created on finalInit, this could be set even if it really should be null
                                //console.warn(this.svType() + ".setJson() found slot with jsonId mismatch: " + node.jsonId() + " !== " + v.jsonId, " at path: " + jsonPathComponents.concat(k).join("/"));

                                node.setJson(v, jsonPathComponents.concat(k));
                            }
                        } else {
                            if (Type.isNull(v) && (slot.allowsNullValue() || slot.isRequired() === false)) {
                                // no problemo
                            } else {
                                const newNode = slot.finalInitProto().clone().setJson(v, jsonPathComponents.concat(k));
                                slot.onInstanceSetValue(this, newNode);
                            }
                        }
                    } else {
                        if (Type.isNull(v)) {
                            if (slot.allowsNullValue()) {
                                // no problemo - set the null value
                                slot.onInstanceSetValue(this, v);
                            } else {
                                // slot doesn't allow null, use the default/init value
                                const initValue = slot.initValue();
                                console.warn(this.svType() + ".setJson() slot '" + slot.name() + "' doesn't allow null, using initValue: " + initValue);
                                slot.onInstanceSetValue(this, initValue);
                                this.markAsDirty(); // save our type conversion
                            }
                        } else if (slot.slotType() !== Type.typeName(v)) {
                            const errorMessage = this.svTypeId() + ".setJson() slotType mismatch: " + slot.slotType() + " slot type !== " + Type.typeName(v) + " value type at path: " + jsonPathComponents.concat(k).join("/");
                            console.warn(errorMessage);
                            //throw new Error(errorMessage);

                            if (slot.slotType() === "Number" && v && v.asNumber) {
                                console.warn(this.logPrefix() + "WARNING: resolving by converting input value to number using asNumber(): ", v.asNumber());
                                const resolvedValue = v.asNumber();
                                assert(!Type.isNaN(resolvedValue), "resolved value must be a number");
                                slot.onInstanceSetValue(this, resolvedValue);
                                this.markAsDirty(); // save our type conversion
                            } else {
                                const errorMessage = this.svTypeId() + ".setJson() slotType mismatch: " + slot.slotType() + " !== " + Type.typeName(v) + " at path: " + jsonPathComponents.concat(k).join("/");
                                console.warn(errorMessage);
                                if (slot.slotType() === "String" && Type.isNumber(v)) {
                                    console.warn(`converting value from number ${v} to string '${v.asString()}'`);
                                    let newValue = v.asString();
                                    // tmp hack for challenge rating
                                    /*
                    if (v === 1/8) {
                      newValue = "1/8";
                    } else if (v === 1/4) {
                      newValue = "1/4";
                    } else if (v === 1/2) {
                      newValue = "1/2";
                    }
                      */
                                    slot.onInstanceSetValue(this, newValue);
                                    this.markAsDirty(); // save our type conversion
                                } else {
                                    throw new Error(errorMessage);
                                }
                            }
                        } else {
                            slot.onInstanceSetValue(this, v);
                        }
                    }
                }
            } else {
                const errorMessage = "WARNING: " + this.svType() + ".setJson() did not find slot: " + k + " at path: " + jsonPathComponents.concat(k).join("/");
                console.warn(errorMessage);
                // also add the warning to the error log

                throw new Error(errorMessage);

            }
        });
        return this;
    }

    calcJson () {
    // we want to limit to just the slots that are json archivable

        const dict = {};

        // Check if we support lazy loading and are in unloaded state
        //const supportsLazyLoading = this.constructor.supportsHasBeenLoaded();
        //const isUnloaded = supportsLazyLoading && this.isUnloaded();

        if (this.shouldStoreSubnodes()) {
            this.subnodes().filter(sn => sn.title() !== "jsonString").map(sn => {
                if (sn.asJson && sn.asJson() !== undefined) { // skip things like images
                    console.log("calcJson() " + this.svType() + " subnode: " + sn.title());
                    dict[sn.title()] = sn.asJson();
                }
            });
        } else {
            const slots = this.thisClass().jsonSchemaSlots();
            slots.forEach(slot => {
                const slotName = slot.name();

                /*
        // Skip slots that aren't in alwaysLoadedSlotNames when unloaded
        if (isUnloaded && slotName !== "hasBeenLoaded" && !this.shouldIncludeSlot(slotName)) {
          return;
        }
        */

                const value = slot.onInstanceGetValue(this);
                if (value && value.asJson) {
                    dict[slotName] = value.asJson();
                }
                else {
                    dict[slotName] = value;
                }
            });
        }

        // Always include hasBeenLoaded if we support lazy loading
        //if (supportsLazyLoading) {
        //  dict.hasBeenLoaded = this.hasBeenLoaded() || false;
        //}

        return dict;
    }

    // --- editable ---

    setIsEditable (aBool) {
        this.subnodes().forEach(sn => {
            if (sn.setIsEditable) {
                //console.log(sn.title() + " setIsEditable(" + aBool + ")")
                sn.setIsEditable(aBool);
                if (!aBool) {
                    if (sn.setNodeCanAddSubnode) {
                        sn.setNodeCanAddSubnode(false);
                    }
                }
            }
        });
        return this;
    }

    // --- subnode slots ---

    newSubnodeFieldSlot (slotName, finalProto) {
        assert(Type.isString(slotName), this.svType() + "newSubnodeFieldSlot() slotName should be a string, not a " + Type.typeName(slotName));
        assert(Type.isString(finalProto) || Type.isClass(finalProto), this.svType() + "newSubnodeFieldSlot() finalProto should be a class, not a " + finalProto.svType());

        const slot = this.newSlot(slotName, null);
        slot.setLabel(slot.name().humanized());
        slot.setShouldJsonArchive(true);
        slot.setShouldStoreSlot(true);
        slot.setIsInJsonSchema(true);
        slot.setSyncsToView(true);
        slot.setFinalInitProto(finalProto);
        //slot.setIsSubnode(true);
        slot.setIsSubnodeField(true);
        slot.setSlotType(Type.isString(finalProto) ? finalProto : finalProto.svType());
        slot.setSummaryFormat("key: value");

        return slot;
    }

    configureSlotForJsonField (slot) {
        slot.setLabel(slot.name().humanized());
        slot.setIsInJsonSchema(true);
        slot.setShouldJsonArchive(true);
        slot.setShouldStoreSlot(true);
        slot.setDuplicateOp("duplicate");
        if (slot.slotType() === null && slot.initValue() !== null) {
            const defaultType = Type.typeName(slot.initValue());
            if (["String", "Number", "Array", "Boolean", "Map", "Set"].includes(defaultType)) {
                slot.setSlotType(defaultType); // careful with this!
            } else {
                console.warn(this.svType() + ".configureSlotForJsonField('" + slot.name() + "') slotType is null and defaultType is not a JSON type: ", defaultType);
                slot.setSlotType("String");
            }
        }
        slot.setIsSubnodeField(true);
        slot.setSyncsToView(true);
        slot.setCanEditInspection(true);
        slot.setSummaryFormat("key: value");
        slot.setIsRequired(true);
    }

    newJsonFieldSlot (slotName, defaultValue) {
        const slot = this.newSlot(slotName, defaultValue);
        this.configureSlotForJsonField(slot);
        return slot;
    }

    asJsonString () {
        return JSON.stableStringifyWithStdOptions(this.asJson(), null, 2);
    }

    copyJsonToClipboard () {
        JSON.stringify(this.asJson(), null, 2).copyToClipboard();
        return this;
    }

}.initThisClass());

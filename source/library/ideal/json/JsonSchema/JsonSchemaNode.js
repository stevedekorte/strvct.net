"use strict";

/**
 * @module library.ideal.json.JsonSchema
 * @class JsonSchemaNode
 * @extends SvSummaryNode
 * @classdesc JsonSchemaNode is a class that extends SvSummaryNode and is used to manage JSON schema representations and related operations.
 */

(class JsonSchemaNode extends SvSummaryNode {

  /**
   * Initializes the class
   * @static
   * @category Initialization
   */
  static initClass () {
  }

  /**
   * Sets up slots from a given JSON schema
   * @description Sets up slots from a JSON schema object, creating slots for each property and handling nested schemas
   * @param {Object} schema - The JSON schema object to set up slots from
   * @category Schema Management
   */
  setupSlotsFromJsonSchema (schema) {

    const properties = schema.properties;

    if (properties) {
      Object.keys(properties).forEach(key => {
        const propertySchema = properties[key];
        const slot = this.newSlot(key);
        if (slot) {
          slot.setJsonSchema(propertySchema);
        }
      });
    }

    const items = schema.items;

    if (items) {
      assert(items.anyOf);
      const classNames = items.anyOf.map(item => {
        const definition = item["$ref"];
        assert(defintion);
        return JsonSchema.classNameForRef(definition);
      });
      
      // verify that these are all subclasses of JsonGroup
      classNames.forEach(className => {
        const aClass = SvGlobals.globals()[className];
        assert(aClass !== undefined, "missing class '" + className + "'");
        assert(aClass.isClass && aClass.isClass(), "'" + className + "' is not a class");
      });
      this.setSubnodeClasses(classNames);
    }

    const required = schema.required;

    if (required) {
      required.forEach(key => {
        this.slotNamed(key).setIsRequired(true);
      });
    }
  }

  /**
   * Initializes prototype slots
   * @description Sets up the "schemaString" slot on the prototype
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("schemaString", "");
      slot.setInspectorPath("schemaString");
      slot.setShouldJsonArchive(false);
      slot.setCanEditInspection(true);
      slot.setDuplicateOp("duplicate");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setIsSubnodeFieldVisible(true);
      slot.setSummaryFormat("key");
      slot.setSyncsToView(true);
      slot.setNodeFillsRemainingWidth(true);
    }
  }
  
  /**
   * Initializes the prototype
   * @description Sets up the initial state of the prototype
   * @category Initialization
   */
  initPrototype () {
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanEditTitle(false);
    this.setSummaryFormat("key");
    this.setHasNewlineAfterSummary(true);
  }

  /**
   * Performs post-initialization tasks
   * @description Initializes the schemaString slot with the root JSON schema for this class
   * @returns {JsonSchemaNode} This instance
   * @category Initialization
   */
  didInit () {
    super.didInit()
    const json = this.thisClass().asRootJsonSchema(); //TODO
    this.setSchemaString(JSON.stableStringifyWithStdOptions(json, null, 2)); //TODO
    return this;
  }

  /**
   * Sets the JSON archive for this instance
   * @description Sets the JSON archive for this instance
   * @param {Object} json - The JSON object to set as the archive
   * @returns {JsonSchemaNode} This instance
   * @category Data Management
   */
  setJsonArchive (json) {
    debugger;
    this.setJson(json);
    return this;
  }

  /**
   * Updates the JSON for this instance
   * @description Updates the JSON for this instance, applying patches if the input is an array or updating the entire JSON if it's an object
   * @param {Object|Array} json - The JSON object or array of patches to apply
   * @returns {JsonSchemaNode} This instance
   * @category Data Management
   */
  updateJson (/*json*/) {
    throw new Error(this.type() + ".updateJson() is no longer implemented. applyJsonPatches() is the new method to use.");
    /*
    // we assume it's a patch if it's an array
    if (Type.isArray(json)) { 
      this.applyJsonPatches(json);
    } else {
      super.updateJson(json);
    }
    return this;
    */
  }

  /**
   * Sets up this instance as a sample
   * @description Sets up this instance and its subnodes as a sample
   * @returns {JsonSchemaNode} This instance
   * @category Data Management
   */
  setupAsSample () {
    this.subnodes().forEach(sn => {
      if (sn.setupAsSample) {
        sn.setupAsSample();
      }
    })
    return this
  }

  /**
   * Updates the message JSON
   * @description Creates a JSON object containing the necessary information to update the character on the server
   * @returns {Object} The message JSON object
   * @category Data Management
   */
  updateMsgJson () {
    const json = {
      name: "updateCharacter",
      characterId: this.characterId(),
      payload: this.asJson() // special case JSON representation which we also share with AI
    }
    if (this.player()) {
      json.playerId = this.player().playerId()
    }
    return json;
  }

  /**
   * Returns the JSON string representation of this instance
   * @description Returns the JSON string representation of this instance
   * @returns {String} The JSON string representation
   * @category Data Conversion
   */
  jsonString () {
    return JSON.stableStringifyWithStdOptions(this.asJson(), null, 2);
  }

  /**
   * Returns the JSON schema properties for this class
   * @description Returns the JSON schema properties for this class, using the JSON schema properties from the superclass and excluding the "schemaString" property
   * @param {Set} refSet - A set of references to include in the schema
   * @returns {Object} The JSON schema properties
   * @static
   * @category Schema Management
   */
  static jsonSchemaProperties (refSet) {
    assert(refSet);
    const json = super.jsonSchemaProperties(refSet);
    /*
    if (!Type.isUndefined(json)) {
      const s = JSON.stableStringifyWithStdOptions(json, null, 2);
      assert(!s.includes("schemaString"));
    }
    */
    return json;
  }

  /**
   * Returns the JSON representation of this instance
   * @description Returns the JSON representation of this instance, including only the slots that are JSON archivable
   * @returns {Object} The JSON representation
   * @category Data Conversion
   */
  asJson () {
    // we want to limit to just the slots that are json archivable

    const slots = this.thisClass().jsonSchemaSlots();
    const dict = {};

    slots.forEach(slot => {
      const value = slot.onInstanceGetValue(this);
      dict[value.title()] = value.asJson();
    });

    return dict;
  }

}.initThisClass());
"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class ToolDefinition
* @extends BMJsonDictionaryNode
* @classdesc Describes what a tool can do.
*/

(class ToolDefinition extends HwJsonDictionaryNode {

  static jsonSchemaDescription () {
    return "Format for Assistant API call to make an '" + this.type() + "' API call.";
  }
  
  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("toolTarget", null);
      slot.setDescription("Instance of the class whose instance the tool call will be made on.");
      slot.setSlotType("Pointer");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("name", null);
      slot.setDescription("Name of the function to call.");
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("jsonSchemaString", null);
      slot.setLabel("JSON Schema");
      slot.setDescription("JSON Schema for the function to call.");
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
    }

    /*
    {
      const slot = this.newSlot("referencedSpecsString", null);
      slot.setLabel("Referenced Specs");
      slot.setDescription("Stringified JSON Schema for the classes referenced by the tool definition.");
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
    }
    */

    {
      const slot = this.newSlot("referencedSchemas", null);
      slot.setInspectorPath("Referenced Schemas");
      slot.setKeyIsVisible(false);
      //slot.setLabel("completed prompt");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setIsSubnodeField(true);
      slot.setSyncsToView(true);
      slot.setSlotType("BMSummaryNode"); // the node contains the component nodes
      slot.setCanEditInspection(false);
      slot.setFinalInitProto(BMSummaryNode);
      //slot.setValidValues(values);
    };
    


    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);
    this.setNodeCanAddSubnode(false);
    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
  }

  title () {
    let title = "";
    /*
    if (this.toolTarget()) {
      title += this.toolTarget().thisClass().type() + ".";
    } else {
      title += "NULL";
    }
    */
    title += this.name();
    return title;
  }

  subtitle () {
    return this.toolMethod().description();
  }

  toolMethod () {
    return this.toolTarget().methodNamed(this.name());
  }

  validate () {
    const method = this.toolTarget().methodNamed(this.name());
    assert(method, "Method named " + this.name() + " not found in class " + this.toolTarget().type());
  }

  toolSpecJson (refSet = new Set()) {
    this.validate();
    const json = this.toolMethod().toolSpecJson(refSet);
    return json;
  }

  jsonSchemaString () {
    const json = this.toolSpecJson();
    const s = JSON.stableStringifyWithStdOptions(json, null, 2);
    this.setupComponents();
    return s;
  }

  classSetReferencedByDefinition () {
    const refSet = new Set();
    this.toolSpecJson(refSet);
    return refSet;
  }

  // setup components

  componentsRoot () {
    return this.referencedSchemas();
  }

  addPathComponent (name, value) {
    const pathNodes = this.componentsRoot().createNodePath(name);
    const node = BMStringField.clone().setTitle(name).setValue(value);
    node.setKeyIsVisible(false);
    pathNodes.last().setNodeFillsRemainingWidth(true);
    pathNodes.last().addSubnode(node);
  }

  setupComponents () {
    const map = new Map(); 

    const refSet = new Set();
    Array.from(this.classSetReferencedByDefinition()).forEach(c => {
      map.set(c.type(), c.asJsonSchema(refSet));
    });

    // components
    this.componentsRoot().setTitle("referenced schemas");
    this.componentsRoot().removeAllSubnodes();
    map.forEach((value, key) => {
      if (value === null) {
        console.warn("value is null for key: ", key, " using empty string instead");
        value = "";
      }
      
      if (!Type.isString(value)) {
        value = JSON.stringify(value, null, 2);
      }

      if (!Type.isString(key)) {
        console.warn("key: ", key);
        console.warn("value: ", value);
        debugger;
      }
      assert(Type.isString(key));
      assert(Type.isString(value));
      this.addPathComponent(key, value);
    });
  }

}.initThisClass());
"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class ToolDefinition
* @extends SvJsonDictionaryNode
* @classdesc Describes what a tool can do.
*/

(class ToolDefinition extends UoJsonDictionaryNode {

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
      slot.setSlotType("Object");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
      slot.setShouldStoreSlot(true);
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
      slot.setShouldStoreSlot(true);
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
      slot.setShouldStoreSlot(true);

    }

    {
      const slot = this.newSlot("referencedSchemas", null);
      slot.setInspectorPath("Referenced Schemas");
      slot.setKeyIsVisible(false);
      //slot.setLabel("completed prompt");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setIsSubnodeField(true);
      slot.setSyncsToView(true);
      slot.setSlotType("SvSummaryNode"); // the node contains the component nodes
      slot.setCanEditInspection(false);
      slot.setFinalInitProto(SvSummaryNode);
      //slot.setValidValues(values);
    }
    


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
    //const method = this.toolTarget().methodNamed(this.name());

    // we may need to follow the prototype chain to find the method with the tool info on it
    // we check func.isToolable() to see if the method is toolable

    const slotName = this.name();
    const protoChain = this.toolTarget().prototypeChain();

    const method = protoChain.detectAndReturnValue(proto => {
      const method = proto[slotName];
      if (method && Type.isFunction(method) && method.isToolable()) {
        return method;
      }
      return false;
    });

    return method;
  }

  assertMethodExists () {
    const method = this.toolMethod();
    assert(method, "Method named " + this.name() + " not found in class " + this.toolTarget().type());
  }

  toolJsonSchema (refSet = new Set()) {
    this.assertMethodExists();
    const json = this.toolMethod().asJsonSchema(refSet);
    return json;
  }

  jsonSchemaString () {
    const json = this.toolJsonSchema();
    const s = JSON.stableStringifyWithStdOptions(json, null, 2);
    this.setupComponents();
    return s;
  }

  classSetReferencedByDefinition () {
    const refSet = new Set();
    this.toolJsonSchema(refSet);
    return refSet;
  }

  // setup components

  componentsRoot () {
    return this.referencedSchemas();
  }

  addPathComponent (name, value) {
    const pathNodes = this.componentsRoot().createNodePath(name);
    const node = SvStringField.clone().setTitle(name).setValue(value);
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

  description () {
    //return this.toolMethod().name();
    return "- " + this.name();
  }

}.initThisClass());
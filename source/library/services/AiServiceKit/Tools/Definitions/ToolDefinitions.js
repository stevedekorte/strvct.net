"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class ToolDefinitions
* @extends BMSummaryNode
* @classdesc A collection of ToolDefinition instances.
*/

(class ToolDefinitions extends BMSummaryNode {
  /*
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("toolTargetInstances", null);
      slot.setFinalInitProto(Set);
      slot.setShouldJsonArchive(true);
      slot.setCanEditInspection(false);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([ToolDefinition]);

    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);

    this.setShouldStoreSubnodes(true);
    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
   //this.setNoteIsSubnodeCount(true);
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Tool Definitions");
    //this.setNoteIsSubnodeCount(true);
  }

  addToolsForInstance (instance) {
    if (this.toolTargetInstances().has(instance)) {
      throw new Error("Tool definitions already added for instance: " + instance.type());
      return this;
    }

    this.toolTargetInstances().add(instance);

    const methodSet = instance.getInheritedMethodSet();
    for (const method of methodSet) {
      //console.log(instance.type() + " " + method.name + " isToolable: " + method.isToolable());
      if (method.isToolable && method.isToolable()) {
        if (!this.toolDefinitionWithName(method.name)) {
          const toolDef = ToolDefinition.clone();
          toolDef.setToolTarget(instance);
          toolDef.setName(method.name);
          this.addTool(toolDef);
        }
      }
    }
    return this;
  }

  addTool (toolDef) {
    this.addSubnode(toolDef);
    return this;
  }
  
  toolDefinitionWithName (name) {
    return this.toolDefinitions().find(toolDef => toolDef.name() === name);
  }


  toolSpecPrompt () {
    const parts = [];
    parts.push(`
Notes: tool definitions include a "returns" property which is a JSON Schema object describing the expected return value.\n
Some of the referenced type definitions may be defined at the end of this prompt explanation document.

The following tools are available for you to use:
`);
    parts.push("<tools>\n" + JSON.stringify(this.toolSpecsJson(), null, 2) + "\n</tools>"); // includes tools and type definitions
    //parts.push("<tools>\n" + JSON.stableStringify(this.toolSpecsJson()) + "\n</tools>"); // includes tools and type definitions
    return parts.join("\n\n");
  }

  toolSpecsJson () {
    const refSet = new Set();
    const tools = this.toolDefinitions().map(toolDef => toolDef.toolJsonSchema(refSet));
    /*
    const types = refSet.map(type => type.jsonSchemaRef());
    const json = {
      "tools": tools,
      "types": types
    };
    return json;
    */
    return tools;
  }

  toolDefinitions () {
    return this.subnodes();
  }

  classesReferencedByToolTypes () {
    const refSet = new Set();
    const tools = this.toolDefinitions().map(toolDef => toolDef.toolJsonSchema(refSet));
    return refSet;
  }

  description () {
    return this.subnodes().map(toolDef => toolDef.description()).join("\n\n");
  }

}.initThisClass());
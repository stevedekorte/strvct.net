"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class ToolDefinitions
* @extends SvSummaryNode
* @classdesc A collection of ToolDefinition instances.
*/

(class ToolDefinitions extends SvSummaryNode {
  /*
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("toolTargetInstances", null); // is a Set of instances that have tools defined for them
      slot.setFinalInitProto(Set);
      slot.setShouldJsonArchive(true);
      slot.setCanEditInspection(false);
    }
  }

  initPrototype () {
    this.setCanDelete(false);
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([ToolDefinition]);

    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    this.setNodeCanReorderSubnodes(false);
    this.setNoteIsSubnodeCount(true);
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Tool Definitions");
    this.setNoteIsSubnodeCount(true);
    this.setNoteIconName(null);
  }

  addToolsForInstance (instance) {
    // we use this to add tools for other instances besides ourselves. e.g. the Session, Campaign, or Character
    //debugger;
    //const ownerPath = this.ownershipChainPathString();
    //console.log("\n assistant at '" + ownerPath + "' adding tools for " + instance.typeId() + " '" + instance.title() + "'");

    if (this.toolTargetInstances().has(instance)) {
      throw new Error("Tool definitions already added for instance: " + instance.type());
    }

    this.toolTargetInstances().add(instance);

    //console.log(this.typeId() + " addToolsForInstance(" + instance.typeId() + "):");
    const methodSet = instance.getInheritedToolMethodSet();
    for (const method of methodSet) {
        //console.log("  -- adding tool '" + method.name + "'");
      //console.log(instance.type() + " " + method.name + " isToolable: " + method.isToolable());
      assert(!this.toolDefinitionWithName(method.name), "tool definition already exists for " + method.name);
      //if (!this.toolDefinitionWithName(method.name)) {
        const toolDef = ToolDefinition.clone();
        //console.log(" - tool: " + method.name);
        toolDef.setToolTarget(instance);
        toolDef.setName(method.name);
        toolDef.updateJsonSchemaString();
        this.addTool(toolDef);
      //}
    }

    if (this.subnodeCount() === 0) {
      console.warn("no tools found for instance: " + instance.typeId());
    }
    //console.log("--- " + instance.typeId() + " tools ---");
    //console.log(this.description() + "\n");

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

>#> List of Tools
The following tools are available for you to use:
`);
    parts.push("<tools>\n" + JSON.stableStringifyWithStdOptions(this.toolSpecsJson(), null, 2) + "\n</tools>"); // includes tools and type definitions
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
    this.toolDefinitions().map(toolDef => toolDef.toolJsonSchema(refSet));
    return refSet;
  }

  description () {
    return this.subnodes().map(toolDef => toolDef.description()).join("\n");
  }

}.initThisClass());
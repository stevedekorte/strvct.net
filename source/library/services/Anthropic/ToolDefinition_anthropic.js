"use strict";

/*
* @class ToolDefinition_anthropic
* @extends SvJsonDictionaryNode
* @classdesc Describes what a tool can do.
*/

(class ToolDefinition_anthropic extends ToolDefinition {

  /*
  Anthropic tool call schema:
      {
      "name": "get_weather",
      "description": "Get the current weather for a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The unit for temperature"
          }
        },
        "required": ["location"]
      }
    },
*/

 // TODO: move this to TooDefinition_anthropic category
 // define in AnthropicService folder
  asAnthropicToolCallSchema () {
    const schema = this.toolJsonSchema();
    const json = {};
    json.name = schema.toolName;
    json.description = schema.description;
    json.parameters = schema.parameters;
    json.returns = schema.returns;
    json.returnNotes = json.isSilentSuccess ? "This tool call is silent success" : "This tool call is not silent success";

    const returnNotes = this.returnNotes();
    if (returnNotes.length > 0) {
      json.returnNotes = returnNotes;
    }
    return json;
  }

  returnNotes () {
    const notes = [];
    if (this.toolJsonSchema().isSilentSuccess) {
      notes.push("This tool call does not return a result on success.");
    }
    if (this.toolJsonSchema().isSilentError) {
      notes.push("This tool call does not return a result on error.");
    }
    return notes.join("\n");
  }

}.initThisCategory());
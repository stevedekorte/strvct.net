"use strict";

/**
 * @module library.node.fields.json
 * @class JsonGroup_clientState
 * @extends JsonGroup
 * @classdesc Category class that adds client state tool call methods to JsonGroup.
 */
(class JsonGroup_clientState extends JsonGroup {

    // --- Client State Tool Calls ---

    /**
   * @description Gets the current client state as JSON.
   * @param {Object} toolCall - The tool call object.
   * @category Tool Calls
   */
    getClientState (toolCall) { // tool - declared in AssistableJsonGroup
        const json = this.asJson();
        /*
    const locations = json.campaign.locations;
    if (locations.length > 0) {
      const firstLocation = locations[0];
      if (firstLocation) {
        if (firstLocation.activeCreatures) {
          assert(Type.isArray(firstLocation.activeCreatures), "Expected array JSON for " + this.svType());
        }
      }
    }
    */
        toolCall.setCallResult(json);
    }

    /**
   * @description Applies JSON patches to the client state.
   * @param {Object} toolCall - The tool call object.
   * @category Tool Calls
   */
    patchClientState (toolCall) { // tool - declared in AssistableJsonGroup
        const patch = toolCall.parametersDict().patch;
        try {
            this.applyJsonPatches(patch);
            toolCall.setCallResult(null);
        } catch (error) {
            console.log("----------------------------------------------------------");
            console.warn(this.svType() + ".patchClientState() got error '" + error.message + "' applying patch: ", JSON.stringify(patch));

            if (error.patchError) {
                // Enhanced error from native patch system
                toolCall.setCallResult({
                    success: false,
                    error: error.patchError,
                    hint: "Check the path and operation type. Verify that parent nodes exist and have the expected structure."
                });
            } else {
                // Fallback for other errors
                toolCall.setCallResult({
                    success: false,
                    error: error.message,
                    hint: "Unexpected error occurred during patch application."
                });
            }
        }
    }

    /**
   * @description Loads a specific path in the client state.
   * @param {Object} toolCall - The tool call object.
   * @category Tool Calls
   */
    async loadClientStatePath (toolCall) { // tool - declared in AssistableJsonGroup
        const path = toolCall.parametersDict().path;
        const node = this.nodeAtSubpathString(path);

        if (node === null) {
            // TODO: add version of nodeAtSubpathString that throws an more detailed error of where the path lookup failed
            throw new Error("Cannot find node at path: " + path);
        }

        if (node.isLoaded()) {
            toolCall.setCallResult(node.asJson());
            return;
        }

        await node.load(); // this will mark as loaded
        /*
    if (node.markAsLoaded) {
      node.markAsLoaded();
    }
    */
        // do we want to:
        // 1) return the loaded JSON or
        // 2) let the AI request the client state to get it?
        // #2 has the advantage of keeping the client state in sync with the AI's view of the world

        toolCall.setCallResult(null);
    }

    /**
   * @description Unloads a specific path in the client state.
   * @param {Object} toolCall - The tool call object.
   * @category Tool Calls
   */
    async unloadClientStatePath (toolCall) { // tool - declared in AssistableJsonGroup
        const path = toolCall.parametersDict().path;
        const node = this.nodeAtSubpathString(path);

        if (node === null) {
            // TODO: add version of nodeAtSubpathString that throws an more detailed error of where the path lookup failed
            throw new Error("Cannot find node at path: " + path);
        }

        // node.unload() will mark as unloaded
        // Mark the node as unloaded
        if (node.markAsUnloaded) {
            node.markAsUnloaded();
        }

        toolCall.setCallResult(null);
    }

}.initThisCategory());

"use strict";

/*

    @class SvJsonFixer
    @extends SvSummaryNode
    @description A tool for repairing JSON strings.

    Example usage:

    const repairedString = await SvJsonFixer.clone().setBadJsonString("[1, 2, 3,]").repair(); // returns null if repair failed

    If there is an error, the status will be set to the error message.

    Alternatively, you can use the static method:

    const repairedString = await SvJsonFixer.repairJsonString("[1, 2, 3,]"); // throws an error if repair failed

*/


(class SvJsonFixer extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("badJsonString", null);
            slot.setLabel("Bad JSON String");
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            //slot.setIsSubnodeFieldVisible(false);
            slot.setSyncsToView(true);
            slot.setValuePlaceholder("bad JSON string");
            slot.setSummaryFormat("none");
        }

        {
            const slot = this.newSlot("repairedJsonString", null);
            slot.setLabel("Repaired JSON String");
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            //slot.setIsSubnodeFieldVisible(false);
            slot.setSyncsToView(true);
            slot.setValuePlaceholder("repaired JSON string");
            slot.setSummaryFormat("none");
        }


        {
            const slot = this.newSlot("status", "");
            slot.setLabel("Status");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setIsSubnodeFieldVisible(false);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("value");
        }

        {
            const slot = this.newSlot("assistant", null);
            slot.setFinalInitProto("AiConversation");
            slot.setShouldStoreSlot(false);
            slot.setIsInJsonSchema(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setNodeFillsRemainingWidth(true);
        }

        {
            const slot = this.newSlot("repairAction", null);
            slot.setShouldJsonArchive(false);
            slot.setLabel("Repair JSON");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            //slot.setCanInspect(true)
            slot.setActionMethodName("repair");
        }

    }

    initPrototype () {
        this.setShouldStoreSubnodes(false);
        this.setTitle("JSON Fixer");
    }

    subtitle () {
        return this.status();
    }

    finalInit () {
        super.finalInit();
        this.assistant().setTitle("Assistant");
        this.setStatus("");
        return this;
    }

    jsonErrorString () {
        const error = this.jsonError();
        if (error === null) {
            return "";
        }
        return error.message;
    }

    jsonError () {
        if (this.badJsonString().length === 0) {
            return null;
        }

        try {
            json5.parse(this.badJsonString());
            return null;
        } catch (error) {
            return error;
        }
    }

    canRepair () {
        return this.jsonError() !== null;
    }

    repairActionInfo () {
        return {
            isEnabled: true,
            title: "Repair JSON",
            subtitle: this.status(),
            isVisible: true
        };
    }


    async generatePrompt () {
        let prompt = `
<prompt-explanation>
  # TASK

  Your task is to read the JSON string and error message provided below and repair the JSON string so that it is valid JSON.
  Critical: In your response, place the JSON you generate within a <json></json> tag.
  Critical: The JSON you generate must be valid JSON.

  ## JSON

  This is the JSON string that you need to repair:

  <json-string>
  [badJsonString]
  </json-string>

  ## ERROR

  This was the error message that was generated when json5.parse() was called on the string:

  <json-error-message>
  [jsonErrorString]
  </json-error-message>

  Now generate the repaired JSON string.

</prompt-explanation>`;

        try {
            json5.parse(this.badJsonString());
        } catch (error) {
            console.error(this.logPrefix(), "parsing JSON:", error);
            const lineNumber = json5.parseError(error).lineNumber;
            this.setLineNumber(lineNumber);
        }

        prompt = prompt.replaceAll("[badJsonString]", this.badJsonString());
        prompt = prompt.replaceAll("[jsonErrorString]", this.jsonErrorString());
        return prompt;
    }

    async repair () {
        if (!this.jsonError()) {
            this.setRepairedJsonString(this.badJsonString());
            return this.repairedJsonString();
        }

        const conversation = this.assistant();
        conversation.setChatModel(AnthropicService.shared().defaultChatModel());
        const prompt = await this.generatePrompt();
        console.log(this.logPrefix(), "----------------------------------------------");
        console.log(this.logPrefix(), prompt);
        console.log(this.logPrefix(), "----------------------------------------------");
        const responseMessage = conversation.startWithPrompt(prompt);
        this.setStatus("repairing...");
        await responseMessage.completionPromise();
        if (!responseMessage.error()) {
            const content = responseMessage.content();
            const jsonStrings = content.contentOfElementsOfTag("json");
            assert(jsonStrings.length === 1, "expected one json string");
            const jsonString = jsonStrings.first();
            console.log(this.logPrefix(), jsonString);

            this.setRepairedJsonString(jsonString.trim());

            try {
                //const json = json5.parse(jsonString);
                json5.parse(jsonString); // ok, if this doesn't throw an error, the json is valid
                this.setStatus("");
                return jsonString;
            } catch (error) {
                this.setStatus("Repaired JSON parse error: " + error.message);
            }
        } else {
            this.setStatus(responseMessage.error().message);
        }
        console.log(this.logPrefix(), "----------------------------------------------");
        return null;
    }

    static async repairJsonString (badJsonString) {
        const s = await SvJsonFixer.clone().setBadJsonString(badJsonString).repair();
        if (this.status() === "") {
            return s;
        }
        throw new Error(this.status());
    }

}.initThisClass());

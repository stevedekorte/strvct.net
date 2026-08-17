"use strict";

/**
 * @module library.services.AiServiceKit.Music
 * @class SvMusicPrompt
 * @extends SvSummaryNode
 * @classdesc Generic text-to-music prompt. Game code should talk to this
 * interface (prompt, lyrics, generate, resultAudioUrl, …) and not to a
 * vendor class. Provider-specific request composition lives in subclasses
 * such as SvMinimaxMusicPrompt.
 */

(class SvMusicPrompt extends SvSummaryNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("prompt", "");
            slot.setSlotType("String");
            slot.setLabel("Prompt");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setDuplicateOp("duplicate");
            slot.setDescription("Style, mood, instrumentation, arrangement.");
        }
        {
            const slot = this.newSlot("lyrics", "");
            slot.setSlotType("String");
            slot.setLabel("Lyrics");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setDuplicateOp("duplicate");
            slot.setDescription("Sung text. Structure tags like [verse] on their own lines.");
        }
        {
            const slot = this.newSlot("isInstrumental", true);
            slot.setSlotType("Boolean");
            slot.setLabel("Instrumental");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setDescription("No vocals. Lyrics are not required.");
        }
        {
            const slot = this.newSlot("lyricsOptimizer", false);
            slot.setSlotType("Boolean");
            slot.setLabel("Auto Lyrics");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setDescription("Ask the provider to write lyrics from the prompt.");
        }
        {
            const slot = this.newSlot("model", "");
            slot.setSlotType("String");
            slot.setLabel("Model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }
        {
            const slot = this.newSlot("duration", 60);
            slot.setSlotType("Number");
            slot.setLabel("Duration (s)");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setDescription("Hint for providers that accept a duration cap.");
        }
        {
            const slot = this.newSlot("seed", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
            slot.setLabel("Seed");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }
        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
            slot.setLabel("Status");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }
        {
            const slot = this.newSlot("resultAudioUrl", "");
            slot.setSlotType("String");
            slot.setLabel("Result URL");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }
        {
            const slot = this.newSlot("resultDuration", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
            slot.setLabel("Result Duration");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }
        {
            const slot = this.newSlot("xhrRequest", null);
            slot.setSlotType("SvXhrRequest");
            slot.setFinalInitProto(SvXhrRequest);
            slot.setShouldStoreSlot(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(false);
        }
        {
            const slot = this.newSlot("generateAction", null);
            slot.setSlotType("Action");
            slot.setLabel("Generate");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(false);
    }

    title () {
        const p = this.prompt().clipWithEllipsis(20);
        return p ? p : "Music Prompt";
    }

    subtitle () {
        return this.status();
    }

    service () {
        throw new Error(this.svType() + " must implement service()");
    }

    generateEndpoint () {
        throw new Error(this.svType() + " must implement generateEndpoint()");
    }

    async asyncComposeRequestBody () {
        throw new Error(this.svType() + " must implement asyncComposeRequestBody()");
    }

    canGenerate () {
        if (this.prompt().trim().length === 0) {
            return false;
        }
        if (this.isInstrumental() || this.lyricsOptimizer()) {
            return true;
        }
        return this.lyrics().trim().length > 0;
    }

    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    async generate () {
        this.setError(null);
        this.setResultAudioUrl("");
        this.setResultDuration(null);
        this.setStatus("submitting...");
        this.notifyOwners("onMusicPromptStart", [this]);
        try {
            const body = await this.asyncComposeRequestBody();
            const json = await this.asyncSubmitJob(body);
            this.applyGenerationResponse(json);
            this.setStatus("completed");
            this.notifyOwners("onMusicPromptEnd", [this]);
        } catch (error) {
            this.setError(error);
            this.setStatus("Error: " + error.message);
            this.notifyOwners("onMusicPromptError", [this]);
            throw error;
        }
        return this;
    }

    async asyncSubmitJob (bodyJson) {
        const apiKey = await this.service().apiKeyOrUserAuthToken();
        const url = SvProxyServers.shared().defaultServer().proxyUrlForUrl(this.generateEndpoint());
        const request = SvXhrRequest.clone();
        request.setUrl(url);
        request.setMethod("POST");
        request.setHeaders({
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        });
        request.setBody(JSON.stringify(bodyJson));
        this.setXhrRequest(request);
        await request.asyncSend();
        if (request.hasError()) {
            throw request.error();
        }
        return this.parsedResponseJson(request);
    }

    parsedResponseJson (request) {
        try {
            return JSON.parse(request.responseText());
        } catch (error) {
            throw new Error(this.svType() + " response is not JSON: " + error.message);
        }
    }

    applyGenerationResponse (/*json*/) {
        throw new Error(this.svType() + " must implement applyGenerationResponse()");
    }

}.initThisClass());

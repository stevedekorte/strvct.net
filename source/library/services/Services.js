"use strict";

/**
 * @module library.services
 */

/**
 * @class Services
 * @extends SvSummaryNode
 * @classdesc Services class that manages various AI and other services.
 */
(class Services extends SvSummaryNode {

    /**
     * @static
     * @description Initializes the class as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the Services class.
     * @category Initialization
     */
    initPrototypeSlots () {

        // SvImageMosaics

        {
            const slot = this.newSlot("imageMosaics", null);
            slot.setFinalInitProto(SvImageMosaics);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("firebaseService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(FirebaseService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {LeonardoService} leonardoService
         * @category AI Service
         */
        /*
        {
            const slot = this.newSlot("leonardoService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(LeonardoService);
            slot.setIsSubnodeField(true);
            slot.setSlotType("LeonardoService");
        }
        */

        /**
         * @member {AnthropicService} anthropicService
         * @category AI Service
         */
        {
            const slot = this.newSlot("anthropicService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AnthropicService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {GeminiService} geminiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("geminiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GeminiService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {XaiService} xaiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("xaiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(XaiService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {PiApiService} piApiService
         * @category AI Service
         */
        /*
        {
            const slot = this.newSlot("piApiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(PiApiService);
            slot.setIsSubnodeField(true);
            slot.setSlotType("PiApiService");
        }
        */

        /**
         * @member {ImagineProService} imagineProService
         * @category AI Service
         */
        {
            const slot = this.newSlot("imagineProService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(ImagineProService);
            slot.setIsSubnodeField(true);
        }


        /**
         * @member {OpenAiService} openAiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("openAiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(OpenAiService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {DeepSeekService} deepSeekService
         * @category AI Service
         */
        {
            const slot = this.newSlot("deepSeekService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(DeepSeekService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {GroqService} groqService
         * @category AI Service
         */
        {
            const slot = this.newSlot("groqService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GroqService);
            slot.setIsSubnodeField(true);
        }

        /*
        {
            const slot = this.newSlot("midjourneyService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(MJService);
            slot.setIsSubnodeField(true);
        }
        */

        /*
        {
            const slot = this.newSlot("azureService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AzureService);
            slot.setIsSubnodeField(true);
        }
        */

        /**
         * @member {YouTubeService} youtubeService
         * @category Video Service
         */
        {
            const slot = this.newSlot("youtubeService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(YouTubeService);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {PeerService} peerService
         * @category Networking
         */
        /*
        {
            const slot = this.newSlot("peerService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(PeerService);
            slot.setIsSubnodeField(true);
        }
        */

        /**
         * @member {SpeechToTextSessions} speechToTextSessions
         * @category Audio Processing
         */
        {
            const slot = this.newSlot("speechToTextSessions", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SpeechToTextSessions);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {ProxyServers} proxyServers
         * @category Networking
         */
        {
            const slot = this.newSlot("proxyServers", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(ProxyServers);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {HomeAssistants} homeAssistants
         * @category Home Automation
         */
        {
            const slot = this.newSlot("homeAssistants", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(HomeAssistants);
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("defaultChatModel", null);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(false);
            slot.setSlotType("AiChatModel");
        }
    }

    initPrototype () {
        this.setTitle("Services");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.thisPrototype().initPrototype();
        //this.scheduleMethod("markAsMutated", 1000);
        this.setupDefaultChatModel();
    }

    /**
     * @description Returns an array of AI services.
     * @returns {Array} An array of AI service instances.
     * @category AI Service
     */
    aiServices () {
        const values = this.subnodeFields().map(sn => sn.value());
        return values.filter(sn => sn.thisClass().isKindOf(AiService));
    }

    // --- ai model helpers ---

    setupDefaultChatModel () {
        // NOTE: This changes the default AI chat model across the whole system.
        // Please do tests locally or in a branch.
        const defaultChatService = this.geminiService();
        const model = defaultChatService.defaultChatModel();
        this.setDefaultChatModel(model);
        return this;
    }

    /**
     * @description Returns an array of all chat models across all AI services.
     * @returns {Array} An array of chat model instances.
     * @category AI Service
     */
    chatModels () {
        return this.aiServices().map(s => s.models().subnodes()).flat();
    }

    /**
     * @description Returns an array of all chat model names.
     * @returns {Array} An array of chat model names.
     * @category AI Service
     */
    chatModelNames () {
        const names = this.chatModels().map(m => m.modelName());
        return names;
    }

    /**
     * @description Finds and returns a chat model with the given name.
     * @param {string} name - The name of the chat model to find.
     * @returns {Object|undefined} The chat model with the given name, or undefined if not found.
     * @category AI Service
     */
    chatModelWithName (name) {
        const match = this.chatModels().detect(m => m.modelName() === name);
        if (!match) {
            console.log("--------------------------------");
            console.warn(this.logPrefix() + " chat model with name '" + name + "' not found in " + JSON.stringify(this.chatModelNames()));
            console.log("--------------------------------");
            debugger;
        }
        return match;
    }

}.initThisClass());

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
               
        /**
         * @member {AnthropicService} anthropicService
         * @category AI Service
         */
        {
            const slot = this.newSlot("anthropicService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AnthropicService);
            slot.setIsSubnode(true);
            slot.setSlotType("AnthropicService");
        }

        /**
         * @member {GeminiService} geminiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("geminiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GeminiService);
            slot.setIsSubnode(true);
            slot.setSlotType("GeminiService");
        }

        /**
         * @member {XaiService} xaiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("xaiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(XaiService);
            slot.setIsSubnode(true);
            slot.setSlotType("XaiService");
        }

        
        /**
         * @member {OpenAiService} openAiService
         * @category AI Service
         */
        {
            const slot = this.newSlot("openAiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(OpenAiService);
            slot.setIsSubnode(true);
            slot.setSlotType("OpenAiService");
        }

        /**
         * @member {DeepSeekService} deepSeekService
         * @category AI Service
         */  
        {
            const slot = this.newSlot("deepSeekService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(DeepSeekService);
            slot.setIsSubnode(true);
            slot.setSlotType("DeepSeekService");
        }

        /*
        {
            const slot = this.newSlot("midjourneyService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(MJService);
            slot.setIsSubnode(true);
            slot.setSlotType("MJService");
        }
        */

        /*
        {
            const slot = this.newSlot("azureService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AzureService);
            slot.setIsSubnode(true);
            slot.setSlotType("AzureService");
        }
        */

        /**
         * @member {YouTubeService} youtubeService
         * @category Video Service
         */
        {
            const slot = this.newSlot("youtubeService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(YouTubeService);
            slot.setIsSubnode(true);
            slot.setSlotType("YouTubeService");
        }

        /**
         * @member {PeerService} peerService
         * @category Networking
         */
        {
            const slot = this.newSlot("peerService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(PeerService);
            slot.setIsSubnode(true);
            slot.setSlotType("PeerService");
        }

        /**
         * @member {SpeechToTextSessions} speechToTextSessions
         * @category Audio Processing
         */
        {
            const slot = this.newSlot("speechToTextSessions", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SpeechToTextSessions);
            slot.setIsSubnode(true);
            slot.setSlotType("SpeechToTextSessions");
        }

        /**
         * @member {ProxyServers} proxyServers
         * @category Networking
         */
        {
            const slot = this.newSlot("proxyServers", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(ProxyServers);
            slot.setIsSubnode(true);
            slot.setSlotType("ProxyServers");
        }

        /**
         * @member {HomeAssistants} homeAssistants
         * @category Home Automation
         */
        {
            const slot = this.newSlot("homeAssistants", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(HomeAssistants);
            slot.setIsSubnode(true);
            slot.setSlotType("HomeAssistants");
        }
    }

    /**
     * @description Initializes the Services instance.
     * @returns {Services} The initialized Services instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setTitle("Services");
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        return this;
    }

    /**
     * @description Returns an array of AI services.
     * @returns {Array} An array of AI service instances.
     * @category AI Service
     */
    aiServices () {
        return this.subnodes().filter(sn => sn.thisClass().isKindOf(AiService));
    }

    // --- ai model helpers ---

    /**
     * @description Returns the default chat model.
     * @returns {Object} The default chat model.
     * @category AI Service
     */
    defaultChatModel () {
        return this.geminiService().defaultChatModel();
        //return this.anthropicService().defaultChatModel();
        //return this.aiServices().first().defaultChatModel();
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
        return this.chatModels().detect(m => m.modelName() === name);
    }
	
}.initThisClass());
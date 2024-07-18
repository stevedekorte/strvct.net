"use strict";

/*

    Services

*/

(class Services extends BMSummaryNode {
    
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        {
            const slot = this.newSlot("anthropicService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AnthropicService);
            slot.setIsSubnode(true);
            slot.setSlotType("AnthropicService");
        }
        
        {
            const slot = this.newSlot("openAiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(OpenAiService);
            slot.setIsSubnode(true);
            slot.setSlotType("OpenAiService");
        }

        {
            const slot = this.newSlot("groqService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GroqService);
            slot.setIsSubnode(true);
            slot.setSlotType("GroqService");
        }


        {
            const slot = this.newSlot("geminiService", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GeminiService);
            slot.setIsSubnode(true);
            slot.setSlotType("GeminiService");
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

        {
            const slot = this.newSlot("youtubeService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(YouTubeService);
            slot.setIsSubnode(true);
            slot.setSlotType("YouTubeService");
        }

        {
            const slot = this.newSlot("peerService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(PeerService);
            slot.setIsSubnode(true);
            slot.setSlotType("PeerService");
        }

        {
            const slot = this.newSlot("speechToTextSessions", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SpeechToTextSessions);
            slot.setIsSubnode(true);
            slot.setSlotType("SpeechToTextSessions");
        }

        {
            const slot = this.newSlot("proxyServers", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(ProxyServers);
            slot.setIsSubnode(true);
            slot.setSlotType("ProxyServers");
        }

        {
            const slot = this.newSlot("homeAssistants", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(HomeAssistants);
            slot.setIsSubnode(true);
            slot.setSlotType("HomeAssistants");
        }
    }

    init () {
        super.init()
        this.setTitle("Services");
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        return this;
    }

    aiServices () {
        return this.subnodes().filter(sn => sn.thisClass().isKindOf(AiService));
    }

    // --- ai model helpers ---

    defaultChatModel () {
        return this.aiServices().first().defaultChatModel();
    }

    chatModels () {
        return this.aiServices().map(s => s.models().subnodes()).flat();
    }

    chatModelNames () {
        const names = this.chatModels().map(m => m.modelName());
        return names;
    }

    chatModelWithName (name) {
        return this.chatModels().detect(m => m.modelName() === name);
    }
	
}.initThisClass());

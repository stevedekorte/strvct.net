"use strict";

/*

    Services

*/

(class Services extends BMSummaryNode {
    
    initPrototypeSlots () {

        {
            const slot = this.newSlot("anthropicService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AnthropicService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("openAiService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(OpenAiService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("groqService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(GroqService);
            slot.setIsSubnode(true);
        }

        /*
        {
            const slot = this.newSlot("midjourneyService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(MJService);
            slot.setIsSubnode(true);
        }
        */

        {
            const slot = this.newSlot("azureService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AzureService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("youtubeService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(YouTubeService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("peerService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(PeerService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("speechToTextSessions", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SpeechToTextSessions);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("proxyServers", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(ProxyServers);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("homeAssistants", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(HomeAssistants);
            slot.setIsSubnode(true);
        }
    }

    init () {
        super.init()
        this.setTitle("Services");
        this.setNodeCanReorderSubnodes(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        return this
    }
	
}.initThisClass());

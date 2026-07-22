"use strict";

/**
 * @module library.services.AiServiceKit.History
 */

/**
 * @class SvAiConversationHistoryBlock
 * @extends SvJsonGroup
 * @classdesc One filed episode of a conversation: an AI-chosen title and
 * subtitle plus copies of the messages that made up the episode
 * (see SvAiConversation.pushHistory). Blocks are immutable-by-convention
 * snapshots — the record of what happened, not a live view.
 *
 * In the AI-visible message array a superseded block appears only as its
 * handle-dict marker (lensHandleJson); drilling back in is an ordinary
 * getClientState expand-by-id on the block's jsonId.
 */
(class SvAiConversationHistoryBlock extends SvJsonGroup {

    static jsonSchemaDescription () {
        return "A filed conversation-history episode: a titled block of past messages, queryable by id.";
    }

    initPrototypeSlots () {

        /**
         * @member {string} title - The AI-chosen episode title (e.g. the departed location's name).
         * @category Data
         */
        {
            const slot = this.overrideSlot("title", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setIsInJsonSchema(true);
            slot.setIsInCloudJson(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setInspectorPath(this.svType());
        }

        /**
         * @member {string} subtitle - A one-line summary of what happened in the episode.
         * @category Data
         */
        {
            const slot = this.overrideSlot("subtitle", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(false); // optional on pushHistory; absent means no subtitle
            slot.setIsInCloudJson(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setInspectorPath(this.svType());
        }

        /**
         * @member {SvAiConversationHistoryMessages} messages - Copies of the episode's messages.
         * @category Data
         */
        {
            const slot = this.newSlot("messages", null);
            slot.setSlotType("SvAiConversationHistoryMessages");
            slot.setFinalInitProto(SvAiConversationHistoryMessages);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setIsInJsonSchema(true);
            slot.setIsInCloudJson(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);
    }

    /**
     * @description The block's handle dict — also the marker format emitted
     * into the AI-visible message array in place of the block's filed
     * messages. Extends the base handle with subtitle and message count.
     * @returns {Object}
     * @category Lens
     */
    lensHandleJson () {
        const dict = super.lensHandleJson();
        const subtitle = this.subtitle();
        if (subtitle !== null && subtitle !== undefined && subtitle !== "") {
            dict.subtitle = String(subtitle);
        }
        dict.count = this.messages().subnodes().length;
        return dict;
    }

    /**
     * @description Files a copy of a conversation message into this block.
     * @param {SvAiMessage} aMessage - The original message to copy.
     * @returns {SvAiConversationHistoryMessage} The copy.
     * @category Filing
     */
    addCopyOfMessage (aMessage) {
        const copy = SvAiConversationHistoryMessage.clone();
        copy.setSpeakerName(aMessage.speakerName ? aMessage.speakerName() : null);
        copy.setContent(aMessage.content());
        copy.setSourceMessageId(aMessage.messageId ? aMessage.messageId() : null);
        this.messages().addSubnode(copy);
        return copy;
    }

    /**
     * @description How this episode reads in a user-view transcript — the
     * human-memory analog of the AI view's marker dict: a reader keeps
     * recent scenes in detail and earlier ones as a one-line recollection.
     * Used by SvAiConversation.userVisibleTranscript for superseded blocks.
     * @returns {String}
     * @category User Projection
     */
    transcriptSummaryLine () {
        const subtitle = this.subtitle();
        return "EARLIER EPISODE: " + this.title()
            + (Type.isString(subtitle) && subtitle.trim().length > 0 ? " — " + subtitle : "");
    }

}.initThisClass());

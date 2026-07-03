"use strict";

/**
 * @module library.services.AiServiceKit.History
 */

/**
 * @class SvAiConversationHistoryMessage
 * @extends SvJsonGroup
 * @classdesc A lightweight COPY of a conversation message filed into a
 * history block (see SvAiConversationHistoryBlock). Copies, not links:
 * the block is a self-contained snapshot of an episode, immune to whatever
 * later happens to the original message nodes (deletion, compaction,
 * retention pruning). Only what the AI should see on drill-in is copied —
 * speakerName and content — plus a soft provenance link (sourceMessageId)
 * back to the original while it exists.
 */
(class SvAiConversationHistoryMessage extends SvJsonGroup {

    static jsonSchemaDescription () {
        return "A message copied into a filed conversation-history episode: who spoke and what was said.";
    }

    initPrototypeSlots () {

        /**
         * @member {string} speakerName - The display name of the speaker at the time of filing.
         * @category Data
         */
        {
            const slot = this.newSlot("speakerName", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setIsInJsonSchema(true);
            slot.setIsInCloudJson(true);
        }

        /**
         * @member {string} content - The message content as the AI saw it.
         * @category Data
         */
        {
            const slot = this.newSlot("content", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setIsInJsonSchema(true);
            slot.setIsInCloudJson(true);
        }

        /**
         * @member {string} sourceMessageId - messageId of the original message this was copied from.
         * Provenance only — not exposed to the AI, and nothing depends on the original still existing.
         * @category Data
         */
        {
            const slot = this.newSlot("sourceMessageId", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setIsInJsonSchema(false);
            slot.setIsInCloudJson(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);
    }

    title () {
        return this.speakerName();
    }

    subtitle () {
        const c = this.content();
        return c ? c.substring(0, 60) : null;
    }

}.initThisClass());

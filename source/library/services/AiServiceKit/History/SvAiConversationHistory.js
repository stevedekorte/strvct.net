"use strict";

/**
 * @module library.services.AiServiceKit.History
 */

/**
 * @class SvAiConversationHistory
 * @extends SvJsonArrayNode
 * @classdesc The push-ordered stack of filed conversation episodes
 * (SvAiConversationHistoryBlock), owned by SvAiConversation's `history`
 * slot. The AI files episodes with the pushHistory tool; the newest block
 * stays inline in the AI-visible message array (one-episode lookback),
 * older blocks collapse to their handle markers and are re-read via
 * getClientState expand-by-id.
 */
(class SvAiConversationHistory extends SvJsonArrayNode {

    static jsonSchemaDescription () {
        return "The filed episodes of a conversation, oldest first. Each block is expandable by its jsonId.";
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvAiConversationHistoryBlock]);
        this.setTitle("history");
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
     * @description The blocks, oldest first (push order).
     * @returns {Array} The history blocks.
     * @category Data Access
     */
    blocks () {
        return this.subnodes();
    }

    /**
     * @description The most recently pushed block, or null.
     * @returns {SvAiConversationHistoryBlock|null}
     * @category Data Access
     */
    newestBlock () {
        return this.blocks().last() || null;
    }

    /**
     * @description Finds a block by its jsonId.
     * @param {string} aJsonId
     * @returns {SvAiConversationHistoryBlock|null}
     * @category Data Access
     */
    blockWithJsonId (aJsonId) {
        return this.blocks().detect(b => b.jsonId() === aJsonId) || null;
    }

    /**
     * @description Creates, appends, and returns a new block.
     * @param {string} title
     * @param {string} subtitle
     * @returns {SvAiConversationHistoryBlock}
     * @category Filing
     */
    newBlockWithTitleAndSubtitle (title, subtitle) {
        const block = SvAiConversationHistoryBlock.clone();
        block.setTitle(title);
        block.setSubtitle(subtitle ? subtitle : null);
        this.addSubnode(block);
        return block;
    }

}.initThisClass());

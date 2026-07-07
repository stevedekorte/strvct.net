"use strict";

/**
 * @module library.services.AiServiceKit.History
 */

/**
 * @class SvAiConversationHistoryMessages
 * @extends SvJsonArrayNode
 * @classdesc The ordered collection of message copies inside one filed
 * history block. Exists (rather than a bare SvJsonArrayNode) to pin the
 * subnode class for deserialization and patch validation, per the plural
 * collection convention.
 */
(class SvAiConversationHistoryMessages extends SvJsonArrayNode {

    static jsonSchemaDescription () {
        return "The messages of one filed conversation-history episode, in chronological order.";
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvAiConversationHistoryMessage]);
        this.setTitle("messages");
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
    }

}.initThisClass());

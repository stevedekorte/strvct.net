"use strict";

/**
 * @module library.services.AiServiceKit.Parsing
 */

/**
 * @class SvAiResponseParserDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for AI response stream parsing and XML tag extraction callbacks.
 */

(class SvAiResponseParserDelegateProtocol extends Protocol {

    /**
     * @description Handles parsed response chunks during streaming.
     * @param {Object} chunk - Parsed chunk content.
     * @param {Object} responseMessage - The response message instance.
     */
    onParsedResponseChunk (chunk, responseMessage) {
    }

    /**
     * @description Handles orphaned tool call tags during stream parsing.
     * @param {string} orphanTag - Orphaned tag text.
     * @param {Object} responseMessage - The response message instance.
     * @param {string} contextTag - Context tag string.
     */
    onOrphanedToolCallTag (orphanTag, responseMessage, contextTag) {
    }

    /**
     * @description Handles completion of response parsing.
     * @param {Object} responseMessage - The response message instance.
     */
    onParsedResponseComplete (responseMessage) {
    }

}.initThisProtocol());

"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @interface SvConversationMessageDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What a conversation message tells its delegate (its
 * conversation) as it changes, completes or fails. Sent by
 * SvConversationMessage and its subclasses (sendDelegateMessage); every
 * message is optional. Written from the sends in SvConversationMessage and
 * the classes that extend it — when one sends a new message, add it here
 * (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvConversationMessageDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The message's content or state changed (a response streaming in).
     * @param {SvConversationMessage} message - The message.
     * @category Delegation
     */
    onMessageUpdate (message) {
    }

    /**
     * @description The message is complete.
     * @param {SvConversationMessage} message - The message.
     * @category Delegation
     */
    onMessageComplete (message) {
    }

    /**
     * @description The message failed (its error() says how).
     * @param {SvConversationMessage} message - The message.
     * @category Delegation
     */
    onMessageError (message) {
    }

}.initThisProtocol());

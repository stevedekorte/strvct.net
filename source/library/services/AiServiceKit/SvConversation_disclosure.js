"use strict";

/**
 * @class SvConversation_disclosure
 * @extends SvConversation
 * @classdesc Progressive Disclosure at the conversation: while a response is
 * shown only as far as it has been spoken (SvAiParsedResponseMessage
 * _disclosure.js), the messages after it — a roll request, a choice, the
 * next response of the turn — wait to be shown until it finishes, so the
 * voice reaches "roll for initiative" before the roll does. Nothing is
 * hidden from the model: held messages only report themselves not visible
 * (SvConversationMessage.isVisible), and every view that lists messages
 * already leaves those out.
 */

(class SvConversation_disclosure extends SvConversation {

    initPrototypeSlots_disclosure () {
        {
            const slot = this.newSlot("disclosingMessage", null); // the first message disclosing now: those after it wait
            slot.setSlotType("SvNode");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description A message started or stopped disclosing: keeps the first
     * disclosing message, and refreshes the views so held messages appear
     * when it ends.
     * @param {SvConversationMessage} message
     * @category Disclosure
     */
    onMessageDisclosureChanged (message) {
        const current = this.disclosingMessage();
        if (message.isDisclosing() && !current) {
            this.setDisclosingMessage(message);
        } else if (!message.isDisclosing() && current === message) {
            this.setDisclosingMessage(this.messages().find(m => m !== message && m.isDisclosing && m.isDisclosing()) || null);
        }
        this.didUpdateNode();
        return this;
    }

    /**
     * @description Whether a message waits for a response before it that is
     * still being disclosed.
     * @param {SvConversationMessage} message
     * @returns {Boolean}
     * @category Disclosure
     */
    isHeldBehindDisclosure (message) {
        const disclosing = this.disclosingMessage();
        if (!disclosing || disclosing === message) {
            return false;
        }
        const messages = this.messages();
        const at = messages.indexOf(disclosing);
        return at !== -1 && messages.indexOf(message) > at;
    }

    /**
     * @description Shows every disclosing response in full (the setting was
     * turned off, or the session went quiet).
     * @category Disclosure
     */
    revealAllDisclosures () {
        this.messages().forEach(m => {
            if (m.isDisclosing && m.isDisclosing()) {
                m.revealAll();
            }
        });
        return this;
    }

}.initThisCategory());

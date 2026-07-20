"use strict";

/*
 * @class SvSimulatedUserConversation
 * @extends SvAiConversation
 * @classdesc The transient "brain" a SvSimulatedUserController thinks with:
 * given a persona prompt and the user-view transcript of a real conversation
 * (SvAiConversation.userVisibleTranscript), it produces the next turn AS THE
 * USER would — which the controller then feeds into the real conversation.
 *
 * Deliberately a bare SvAiConversation, NOT the observed conversation's
 * class: it must not inherit the observed conversation's tools (the
 * simulated user is a user, not an assistant) and must not inherit any
 * automation hooks (which could recurse).
 *
 * Transient: never stored, never parented into the observed tree. Its chat
 * model is set explicitly by the controller (typically a different model
 * than the observed assistant, to reduce self-collusion).
*/

(class SvSimulatedUserConversation extends SvAiConversation {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setCanDelete(true);
        this.setShouldStore(false); // transient thinking construct — never persist
    }

    /**
     * @description Run one simulated-user turn: persona + transcript in, the
     * user's next utterance (plain text) out. Mirrors the launch pattern used
     * by assistant conversations: startWithPrompt(...) then await the
     * response's completion.
     * @param {String} personaPrompt - who the simulated user is / how they behave
     * @param {String} transcript - the user-view transcript of the observed conversation
     * @returns {Promise<String>} the simulated user's next turn
     * @category Simulated User
     */
    async asyncUserTurnForTranscript (personaPrompt, transcript) {
        const prompt = (Type.isString(personaPrompt) ? personaPrompt : "")
            + "\n\n=== TRANSCRIPT SO FAR ===\n"
            + (Type.isString(transcript) ? transcript : "")
            + "\n=== END TRANSCRIPT ===\n\nYour next turn as the user:";
        const responseMessage = this.startWithPrompt(prompt);
        await responseMessage.completionPromise();
        const content = responseMessage.content ? responseMessage.content() : "";
        return Type.isString(content) ? content.trim() : "";
    }

    // The brain always processes its own (rare) tool calls locally; it has no
    // client-mirror concept.
    shouldProcessToolCalls () {
        return true;
    }

}).initThisClass();

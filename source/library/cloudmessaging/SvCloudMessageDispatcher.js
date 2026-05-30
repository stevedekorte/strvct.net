"use strict";

/**
 * @module library.cloudmessaging
 * @class SvCloudMessageDispatcher
 * @extends ProtoClass
 * @classdesc
 * Receiver-side dispatch for an SvCloudMessage. Resolves the target node by
 * jsonId from a contextual root, authorizes the sender's role against the
 * method's `callableBy` metadata, then invokes the method using the shared
 * call-result protocol (the method fills result/error on the message).
 *
 * Stateless — exposed as a static method.
 *
 * Permission is the gate (not reachability): only methods whose `callableBy()`
 * includes the caller's role are invoked, so arbitrary or inherited functions
 * (toString, constructor, …) are rejected because their `callableBy()` is empty.
 *
 * Argument validation against the method's JSON-Schema is intentionally NOT done
 * yet — a follow-up will add it via the same `paramsSchema` the AI tool path uses.
 *
 * @category Cloud Messaging
 */

(class SvCloudMessageDispatcher extends ProtoClass {

    /**
     * @description Resolves, authorizes, and invokes the message's method. The
     * outcome (result / error / rejection) is recorded on the message, which is
     * also returned.
     * @param {SvJsonIdNode} contextRoot - Root to resolve targetJsonId against (e.g. the session for state, the aiChat for chat).
     * @param {SvCloudMessage} message - The message to dispatch.
     * @param {String} callerRole - The sender's role: "host" | "owningClient" | "anyClient" | "ai".
     * @returns {Promise<SvCloudMessage>} The message with its outcome set.
     * @category Dispatch
     */
    static async dispatch (contextRoot, message, callerRole) {
        assert(contextRoot, "dispatch requires a contextRoot");
        assert(message, "dispatch requires a message");

        const target = contextRoot.anyDescendantWithJsonId(message.targetJsonId());
        if (!target) {
            return message.setRejected("unknown-target");
        }

        const method = target[message.methodName()];
        if (!Type.isFunction(method)) {
            return message.setRejected("unknown-method");
        }

        if (!method.callableBy().includes(callerRole)) {
            return message.setRejected("not-permitted");
        }

        try {
            // The method receives the message and reports via the shared call
            // protocol (setCallResult / setCallError), exactly as an AI tool
            // call would receive an SvToolCall.
            const ret = method.apply(target, [message]);
            if (ret && Type.isFunction(ret.then)) {
                await ret; // support async method bodies
            }
        } catch (error) {
            message.setCallError(error);
        }

        return message;
    }

}.initThisClass());

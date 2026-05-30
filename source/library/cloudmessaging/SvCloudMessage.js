"use strict";

/**
 * @module library.cloudmessaging
 * @class SvCloudMessage
 * @extends SvJsonDictionaryNode
 * @classdesc
 * A typed object-message envelope: an instruction to invoke a declared method
 * on a target node (addressed by jsonId) with JSON arguments. The method's
 * invocation metadata lives on the method itself (see Function_ideal:
 * callableBy / messageMode / canOccurOnClient).
 *
 * The same record represents a message on both sides of a host/client boundary:
 *   - the SENDER builds it with its own senderRequestId (senderId is itself);
 *   - the RECEIVER rebuilds it from the wire payload but stamps senderId from
 *     the channel's *verified* identity (auth.uid), never from the payload — so
 *     a self-declared senderId can't be spoofed.
 *
 * It implements the same call-result protocol as SvToolCall (parametersDict /
 * setCallResult / setCallError / handleCallError) so a single method body can
 * serve both an AI tool call and a cloud message with no signature change. It
 * does NOT depend on SvToolCall — the shared surface is just this protocol plus
 * the method metadata on Function_ideal.
 *
 * @category Cloud Messaging
 */

(class SvCloudMessage extends SvJsonDictionaryNode {

    static jsonSchemaDescription () {
        return "An instruction to invoke a declared method on a target node (by jsonId) with JSON arguments.";
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

        {
            const slot = this.overrideSlot("jsonId", null);
            slot.setIsInJsonSchema(false);
        }

        // --- identity / correlation ---

        {
            // The sender's verified identity (auth uid). NOT part of the wire
            // form: the receiver stamps it from the channel's verified identity
            // at ingestion, so a payload-supplied value can't be forged.
            const slot = this.newSlot("senderId", null);
            slot.setSlotType("String");
            slot.setShouldJsonArchive(false);
            slot.setIsInJsonSchema(false);
        }

        {
            // Sender-assigned correlation id; also the RTDB node key under
            // /requests/{uid}/{senderRequestId}. Echoed on the resulting effect
            // / rejection so the sender can correlate the outcome.
            const slot = this.newSlot("senderRequestId", null);
            slot.setSlotType("String");
            slot.setShouldJsonArchive(true);
        }

        // --- invocation ---

        {
            const slot = this.newSlot("targetJsonId", null);
            slot.setDescription("jsonId of the node to invoke the method on, resolved from a contextual root.");
            slot.setSlotType("String");
            slot.setShouldJsonArchive(true);
        }

        {
            const slot = this.newSlot("methodName", null);
            slot.setDescription("Name of the declared method to invoke on the target.");
            slot.setSlotType("String");
            slot.setShouldJsonArchive(true);
        }

        {
            const slot = this.newSlot("args", null);
            slot.setDescription("JSON arguments for the method (jsonIds may be used as refs).");
            slot.setSlotType("JSON Object"); // type set for the boot requirement
            slot.setValidatesOnSet(false);   // arbitrary JSON value (incl. primitives) — don't type-check on set
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
        }

        // --- outcome (receiver/caller runtime state; not part of the wire form) ---

        {
            const slot = this.newSlot("result", null);
            slot.setSlotType("JSON Object");
            slot.setValidatesOnSet(false); // result may be any JSON value (object, array, number, string, …)
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(false);
        }

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("String"); // setCallError coerces to a message string
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(false);
        }

        {
            // Rejection reason when the receiver declined to dispatch (e.g.
            // "unknown-target", "not-permitted", "host-busy"). Distinct from
            // `error`, which is an exception thrown while executing the method.
            const slot = this.newSlot("reason", null);
            slot.setSlotType("String");
            slot.setShouldJsonArchive(false);
        }

        {
            const slot = this.newSlot("status", "pending"); // "pending" | "completed" | "error" | "rejected"
            slot.setSlotType("String");
            slot.setShouldJsonArchive(false);
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    // --- call-result protocol (compatible with SvToolCall) ---

    /**
     * @description The arguments dict, under the name tool methods expect.
     * @returns {Object} The arguments object (never null).
     * @category Call Protocol
     */
    parametersDict () {
        return this.args() || {};
    }

    /**
     * @description Records a successful result and marks the message completed.
     * @param {*} result - The result value.
     * @returns {SvCloudMessage} This message.
     * @category Call Protocol
     */
    setCallResult (result) {
        this.setResult(result);
        this.setStatus("completed");
        return this;
    }

    /**
     * @description Records an error and marks the message errored.
     * @param {Error|String} error - The error.
     * @returns {SvCloudMessage} This message.
     * @category Call Protocol
     */
    setCallError (error) {
        const message = (error && error.message) ? error.message : (error == null ? null : String(error));
        this.setError(message);
        this.setStatus("error");
        return this;
    }

    /**
     * @description Convenience alias used by some tool method bodies.
     * @param {Error|String} error - The error.
     * @returns {SvCloudMessage} This message.
     * @category Call Protocol
     */
    handleCallError (error) {
        return this.setCallError(error);
    }

    /**
     * @description Records that the receiver declined to dispatch this message,
     * with a machine-readable reason. Distinct from setCallError (an exception
     * during execution); maps to a `requestRejected` outcome on the bus.
     * @param {String} reason - Machine-readable rejection reason.
     * @returns {SvCloudMessage} This message.
     * @category Call Protocol
     */
    setRejected (reason) {
        this.setReason(reason);
        this.setStatus("rejected");
        return this;
    }

    /**
     * @description Whether the receiver declined to dispatch this message.
     * @returns {Boolean}
     * @category Call Protocol
     */
    isRejected () {
        return this.status() === "rejected";
    }

    /**
     * @description Whether the message completed successfully.
     * @returns {Boolean}
     * @category Call Protocol
     */
    isCompleted () {
        return this.status() === "completed";
    }

    /**
     * @description Whether the message errored.
     * @returns {Boolean}
     * @category Call Protocol
     */
    hasError () {
        return this.status() === "error";
    }

}.initThisClass());

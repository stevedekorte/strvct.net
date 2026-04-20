"use strict";

/**
 * @class SvActorNode
 * @extends SvBaseNode
 * @classdesc Queues actorApply() messages and executes them sequentially, awaiting the
 * previous message before sending the next — in contrast to plain async messages which
 * don't guarantee processing order.
 *
 * Persistent: on unserialize any currently-pending message is discarded and processing
 * continues with the remaining unsent messages in order.
 *
 * Example use cases: ensuring one mutator at a time, ordered database transaction
 * requests, ordered patch application.
 *
 * Auto-runs whenever messages are present in the asyncMessageQueue inbox.
 */

(class SvActorNode extends SvBaseNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("messageQueue", null);
            slot.setFinalInitProto(SvActorMessages);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("timeoutPeriodInMs", null);
            slot.setSlotType(Number);
            slot.setAllowsNullValue(true);
        }

        {
            const slot = this.newSlot("doesResumeOnUnserialize", true);
            slot.setSlotType(Boolean);
            slot.setShouldStoreSlot(true);
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    afterUnserializeAndInit () {
        if (this.doesResumeOnUnserialize()) {
            this.messageQueue().removeAnyPendingMessage();
            // resume processing the queue

            this.asyncActorProcessIfNeeded();
        }
    }

    async actorApply (messageName, args, timeoutInMs) {
        const msg = SvActorMessage.clone().setName(messageName).setArgs(args);
        this.messageQueue().addSubnode(msg);
        const promise = msg.resultPromise();

        if (timeoutInMs) {
            promise.setTimoutPeriodInMs(timeoutInMs);
        } else if (this.timeoutPeriodInMs()) {
            promise.setTimoutPeriodInMs(this.timeoutPeriodInMs());
        }

        this.asyncActorProcessIfNeeded(); // don't await as we need to return our promise first
        return promise;
    }

    async asyncActorProcessIfNeeded () {
        const q = this.messageQueue();
        if (!q.hasPendingMessage()) {
            const msg = q.firstUnsentMessage();
            if (msg) {
                try {
                    await msg.asyncSend();
                } catch (error) {
                    // the promise's reject function will be called
                    // so we can ignore and continue
                    console.log(this.logPrefix(), error);
                }
                q.removeSubnode(msg);
                this.asyncActorProcessIfNeeded();
                // TODO: consider stack depth - maybe use this.scheduleMethod("asyncActorProcessIfNeeded") instead?
            }
        }
    }

}.initThisClass());

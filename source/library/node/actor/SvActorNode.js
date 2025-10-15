"use strict";

/*

    @class SvActorNode

    Async messages don't ensure processing order,
    but actors do. This actor class queues actorApply() message
    and executes them sequentially (awaits the last message before sending the next).

    It's also *persistent* so on unserialize:
    - if there's a pending message, it's removed
    - we continue processing unsent messages in order

    Example use cases:
    - ensuring a one mutator at a time
    - ensuring ordered transaction requests on a database
    - ensuring a patch ordering

    NOTES

    - auto runs if any messages are in inbox (the asyncMessageQueue)

*/

(class SvActorNode extends BaseNode {

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
        // TODO: consider stack depth
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
            }
        }
    }

}.initThisClass());

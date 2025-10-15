"use strict";

/*

    @class SvActorMessage

*/

(class SvActorMessage extends BaseNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("target", null);
            this.setSlotType(Object);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType(String);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("arguments", null);
            slot.setFinalInitProto(Array);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("status", "unsent");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setValidValues(["unsent", "pending", "resolved", "rejected"]);
        }

        {
            const slot = this.newSlot("resultPromise", null);
            this.setFinalInitProto(Promise);
            slot.setShouldStoreSlot(true);
            slot.setIsPromiseWrapped(true); // external object's should call asyncResult() to get result
        }

        {
            const slot = this.newSlot("result", null);
            this.setSlotType(Object);
            slot.setShouldStoreSlot(true);
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
    }

    async asyncSend () {
        const promise = this.resultPromise();

        try {
            const target = this.target();
            const method = target[this.methodName()];
            this.setStatus("pending");
            const result = await method.apply(target, this.arguments());
            this.setStatus("resolved");
            promise.callResolveFunc(result);
            return result;
        } catch (error) {
            this.setStatus("rejected");
            promise.callRejectFunc(error);
        }
    }

    isSent () {
        return this.status() !== "unsent";
    }

    isPending () {
        return this.status() === "pending";
    }

    isComplete () {
        return this.status() === "resolved" || this.status() === "rejected";
    }

    rejectAfterShutdown () {
        assert(this.isPending(), "rejectAfterShutdown on non pending message");
    }

}.initThisClass());

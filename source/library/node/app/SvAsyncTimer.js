"use strict";

/**
 * @module library.node
 */

/**
 * @class SvAsyncTimer
 * @extends ProtoClass
 * @classdesc A timer for running asynchronous code.
 * 
 * Example:
 * 
 * // quick call to run a block
 * const timer =  SvAsyncTimer.runBlock(async () => {
 *     await ...
 * }, "foo");
 * 
 * // more detailed call
 * const timer =  SvAsyncTimer.clone();
 * timer.setLabel("foo");
 * timer.setDoesLog(true);
 * timer.setBlock(async () => {
 *     await ...
 * });
 * await timer.run();
 */

(class SvAsyncTimer extends ProtoClass {

    static runBlock (block, label) {
        const timer = SvAsyncTimer.clone();
        timer.setLabel(label);
        timer.setDoesLog(true);
        return timer.runBlock(block);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("label", null);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("startTime", null);
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("endTime", null);
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("doesLog", true);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("block", null);
            slot.setSlotType("Function");
        }
    }

    initPrototype () {
    }

    async run () {
        let caughtError = null;
        this.setStartTime(this.now());
        try {
            await (this.block())();
        } catch (error) {
            caughtError = error;
            console.error(error);
        } finally {
            this.setEndTime(this.now());
            if (this.doesLog()) {
                this.logNow();
            }
        }
        if (caughtError !== null) {
            throw caughtError;
        }
    }

    logNow () {
        console.log(this.logPrefix(), " --- " + this.label() + " " + this.dtInSeconds() + "s --- ");
    }

    dtInMs () {
        return this.endTime() - this.startTime();
    }

    dtInSeconds () {
        return Math.round(this.dtInMs()/100)/10;
    }

    now () {
        return performance.now();
    }

}.initThisClass());
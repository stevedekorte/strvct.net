"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/**
 * @class SvChatSendTiming
 * @extends ProtoClass
 * @classdesc How long one chat send took to reach the screen: from the Enter
 * key's event (its timeStamp is when the browser received it, however long
 * the main thread was busy before handling it) to the first paint after the
 * send. Split into the wait before the key was handled, the handling and
 * the send (the node's sync runs at the end of the event loop), and the
 * paint. A send slower than slowMs() files a "slow-chat-send" error report,
 * with the main thread's long tasks in the window — at most one a minute.
 *
 * Usage (SvChatInputTile.didInput): SvChatSendTiming.clone().setEnterAt(t).setHandledAt(now).setInputNode(node).startWatching()
 */
(class SvChatSendTiming extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("enterAt", 0); // the Enter event's timeStamp (performance.now() clock)
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("handledAt", 0); // when the input view handled it
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("sentAt", 0); // after the frame's script (the send) ran
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("inputNode", null); // the chat input's node (its conversation counts messages)
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description The last slow send reported on this page (performance.now()).
     * @category Throttle
     */
    static lastReportAt () {
        return this._lastReportAt || -Infinity;
    }

    static setLastReportAt (t) {
        this._lastReportAt = t;
        return this;
    }

    /**
     * @description Slower than this from Enter to paint is reported.
     * @returns {Number} ms
     * @category Reporting
     */
    slowMs () {
        return 1000;
    }

    /**
     * @description Waits for the next frame (by then the scheduled send has
     * run) and the paint after it.
     * @returns {SvChatSendTiming}
     * @category Timing
     */
    startWatching () {
        requestAnimationFrame(() => {
            this.setSentAt(performance.now());
            setTimeout(() => this.onPainted(performance.now()), 0);
        });
        return this;
    }

    onPainted (paintedAt) {
        const totalMs = paintedAt - this.enterAt();
        if (totalMs >= this.slowMs() && paintedAt - SvChatSendTiming.lastReportAt() > 60000) {
            SvChatSendTiming.setLastReportAt(paintedAt);
            this.report(paintedAt);
        }
        return this;
    }

    /**
     * @description The report's numbers, in ms.
     * @param {Number} paintedAt
     * @returns {Object}
     * @category Reporting
     */
    reportJson (paintedAt) {
        const longTasks = SvGlobals.has("SvLongTaskMonitor") ? SvLongTaskMonitor.shared().entriesBetween(this.enterAt(), paintedAt) : [];
        return {
            kind: "slow-chat-send",
            totalMs: Math.round(paintedAt - this.enterAt()),
            beforeHandledMs: Math.round(this.handledAt() - this.enterAt()),
            sendMs: Math.round(this.sentAt() - this.handledAt()),
            paintMs: Math.round(paintedAt - this.sentAt()),
            messages: this.messageCount(),
            longTasks: longTasks.map((e) => Math.round(e.at - this.enterAt()) + "+" + e.ms).join(" ")
        };
    }

    messageCount () {
        const node = this.inputNode();
        const conversation = node && node.conversation ? node.conversation() : null;
        return conversation && conversation.messages ? conversation.messages().length : null;
    }

    report (paintedAt) {
        const json = this.reportJson(paintedAt);
        const message = "slow chat send: " + json.totalMs + " ms from Enter to the screen";
        console.warn(message, JSON.stringify(json));
        if (SvGlobals.has("SvErrorReport")) {
            SvErrorReport.asyncSend(new Error(message), json);
        }
        return this;
    }

}.initThisClass());

"use strict";

/**
* @module library.services.AiServiceKit.Tools.Events
* @class SvRuntimeEventReport
* @extends SvSummaryNode
* @classdesc A reified runtime event the engine needs the AI to know about —
* an exception while handling the AI's response, a player-initiated state
* change, a roster change, housekeeping. Reports are the engine→AI analog of
* a needs-sync notification to a view: they carry occurrence and attribution
* (what happened and who did it), never resulting state — the AI reads state
* from its client-state view.
*
* Reports are created via the owning tool kit
* (`assistantToolKit.newRuntimeEventReport()`, which stamps context) and
* queued with `assistantToolKit.addRuntimeEventReport(report)`. The queue
* drains into the same invisible user message as tool-call results — see
* SvAssistantToolKit.sendCompletedToolCallResponses.
*
* The type is data, not a subclass: domain meaning lives in the `info`
* payload plus prompt wording, keeping the engine assistant-agnostic.
*/

(class SvRuntimeEventReport extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("conversation", null); // stamped by the tool kit at creation
            slot.setSlotType("SvConversation");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
        }

        {
            const slot = this.newSlot("type", null); // e.g. "responseProcessingError"
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("info", null); // occurrence + attribution details (the domain payload)
            slot.setSlotType("JSON Object");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
        }

        {
            const slot = this.newSlot("immediacy", "nextTurn"); // "nextTurn" | "wakeAI"
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
        }

        {
            const slot = this.newSlot("timestamp", null); // ms since epoch, stamped at creation (or add, if missing)
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
        }

        {
            const slot = this.newSlot("occurrenceCount", 1); // bumped when a duplicate coalesces into this pending report
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(false);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSummaryFormat("value");
        this.setHasNewlineAfterSummary(true);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
    }

    /**
     * @description Title shown in the inspector.
     * @returns {String}
     * @category UI
     */
    title () {
        return this.type() || "runtime event";
    }

    /**
     * @description Subtitle shown in the inspector.
     * @returns {String}
     * @category UI
     */
    subtitle () {
        const info = this.info();
        const message = (info && info.message) ? String(info.message).clipWithEllipsis(40) : "";
        const count = this.occurrenceCount() > 1 ? " ×" + this.occurrenceCount() : "";
        return this.immediacy() + count + (message ? " — " + message : "");
    }

    /**
     * @description Whether this report may initiate an AI turn when the tool
     * kit is otherwise idle. nextTurn reports only ride messages that are
     * going out anyway.
     * @returns {Boolean}
     * @category State
     */
    isWakeAI () {
        return this.immediacy() === "wakeAI";
    }

    /**
     * @description The key the queue dedupes/batches on. Reports with equal
     * keys coalesce into one pending report (bumping occurrenceCount), and
     * the loop guard counts consecutive sends per key.
     * @returns {String}
     * @category Coalescing
     */
    coalesceKey () {
        return this.type() + ":" + JSON.stableStringifyWithStdOptions(this.info() || {});
    }

    /**
     * @description Called on the pending report when a duplicate (equal
     * coalesceKey) is added while this one is still queued.
     * @param {SvRuntimeEventReport} duplicateReport
     * @returns {SvRuntimeEventReport} this
     * @category Coalescing
     */
    recordCoalescedDuplicate (duplicateReport) {
        this.setOccurrenceCount(this.occurrenceCount() + 1);
        if (duplicateReport.timestamp()) {
            this.setTimestamp(duplicateReport.timestamp());
        }
        return this;
    }

    /**
     * @description The JSON the AI sees for this event.
     * @returns {Object}
     * @category Rendering
     */
    eventJson () {
        const json = {
            type: this.type(),
            time: new Date(this.timestamp() || Date.now()).toISOString(),
            info: this.info()
        };
        if (this.occurrenceCount() > 1) {
            json.occurrences = this.occurrenceCount();
        }
        return json;
    }

    /**
     * @description Renders the block this report becomes inside the invisible
     * user message (alongside any tool-call results).
     * @returns {String}
     * @category Rendering
     */
    composeRuntimeEventBlock () {
        return "<runtime-event>\n" + JSON.stableStringifyWithStdOptions(this.eventJson(), null, 2) + "\n</runtime-event>";
    }

}.initThisClass());

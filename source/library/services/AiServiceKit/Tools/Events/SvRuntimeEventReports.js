"use strict";

/**
* @module library.services.AiServiceKit.Tools.Events
* @class SvRuntimeEventReports
* @extends SvSummaryNode
* @classdesc The pending queue of SvRuntimeEventReport instances on an
* SvAssistantToolKit. Adding coalesces by coalesceKey; the tool kit drains
* the queue into the invisible tool-results message at its send gate.
*/

(class SvRuntimeEventReports extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("assistantToolKit", null);
            slot.setSlotType("SvAssistantToolKit");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvRuntimeEventReport]);
        this.setSummaryFormat("value");
        this.setHasNewlineAfterSummary(true);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(false);
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Runtime Event Reports");
        this.setNoteIsSubnodeCount(true);
    }

    /**
     * @description The queued reports, oldest first.
     * @returns {Array<SvRuntimeEventReport>}
     * @category Queue
     */
    pendingReports () {
        return this.subnodes().slice();
    }

    /**
     * @description Finds a pending report with the given coalesce key.
     * @param {String} key
     * @returns {SvRuntimeEventReport|undefined}
     * @category Queue
     */
    reportWithCoalesceKey (key) {
        return this.subnodes().find(r => r.coalesceKey() === key);
    }

    /**
     * @description Coalesces the report against the queue: a pending report
     * with an equal coalesceKey absorbs it (bumping occurrenceCount);
     * otherwise it is enqueued. Returns the pending report either way.
     * @param {SvRuntimeEventReport} report
     * @returns {SvRuntimeEventReport}
     * @category Queue
     */
    addReport (report) {
        const existing = this.reportWithCoalesceKey(report.coalesceKey());
        if (existing) {
            existing.recordCoalescedDuplicate(report);
            return existing;
        }
        this.addSubnode(report);
        return report;
    }

    /**
     * @description Removes the given reports from the queue (after a drain).
     * @param {Array<SvRuntimeEventReport>} reports
     * @returns {SvRuntimeEventReports} this
     * @category Queue
     */
    removeReports (reports) {
        reports.forEach((report) => {
            if (this.subnodes().includes(report)) {
                this.removeSubnode(report);
            }
        });
        return this;
    }

    /**
     * @description Whether any pending report may initiate an AI turn.
     * @returns {Boolean}
     * @category Queue
     */
    hasWakeReports () {
        return this.subnodes().some(r => r.isWakeAI());
    }

}.initThisClass());

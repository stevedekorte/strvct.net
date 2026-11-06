/**
 * @module library.view.events.listening
 */

"use strict";

/**
 * @class SvLongTaskMonitor
 * @extends ProtoClass
 * @classdesc Safety-net performance probe: a PerformanceObserver on the "longtask"
 * entry type sees every main-thread block ≥50ms regardless of which task produced
 * it — async/await continuations, external SDK tasks, raw rAF work — none of which
 * route through SvEventManager.safeWrapEvent (the funnel probe's blind spot).
 *
 * The browser gives longtask entries almost no attribution, so each report attaches
 * SvEventManager's lastEventStamp: a long task moments after "tap on tile X" is
 * attributable in practice even when the browser won't say so. A negative
 * msFromLastEventEndToTaskStart means the task overlapped the stamped event itself
 * (the block was synchronous funnel work — expect a paired long-event report).
 *
 * Started by SvApp once app init completes (so boot work, which has its own
 * SvBootPerf tracking, doesn't file reports). No-op outside browsers and in
 * browsers without longtask support (e.g. Safari).
 *
 * Example:
 *
 *     SvLongTaskMonitor.shared().startIfSupported();
 */
(class SvLongTaskMonitor extends ProtoClass {

    /**
     * @static
     * @description Initializes the class as a singleton
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {PerformanceObserver|null} observer
         * @category State
         */
        {
            const slot = this.newSlot("observer", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {Number} longTaskThresholdMs - Only tasks at least this long file a
         * "long-task" report. Matches SvEventManager's longEventThresholdMs so the two
         * probes agree on what counts as a freeze.
         * @category Performance Reporting
         */
        {
            const slot = this.newSlot("longTaskThresholdMs", 1000);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("recentEntries", null); // the last long tasks of any length: [{ at, ms }] (performance.now() times)
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Starts observing longtask entries if the platform supports them.
     * Idempotent — safe to call more than once.
     * @returns {SvLongTaskMonitor} The instance of SvLongTaskMonitor
     * @category Lifecycle
     */
    startIfSupported () {
        if (this.observer()) {
            return this;
        }
        if (typeof PerformanceObserver === "undefined") {
            return this;
        }
        const supportedTypes = PerformanceObserver.supportedEntryTypes;
        if (!supportedTypes || !supportedTypes.includes("longtask")) {
            return this;
        }

        const observer = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => this.onLongTaskEntry(entry));
        });
        observer.observe({ entryTypes: ["longtask"] });
        this.setObserver(observer);
        return this;
    }

    /**
     * @description Stops observing. The next startIfSupported() re-arms it.
     * @returns {SvLongTaskMonitor} The instance of SvLongTaskMonitor
     * @category Lifecycle
     */
    stop () {
        if (this.observer()) {
            this.observer().disconnect();
            this.setObserver(null);
        }
        return this;
    }

    /**
     * @description Files a "long-task" report for entries over the threshold,
     * attributed via SvEventManager's last-event stamp.
     * @param {PerformanceEntry} entry - A longtask performance entry
     * @returns {SvLongTaskMonitor} The instance of SvLongTaskMonitor
     * @category Performance Reporting
     */
    onLongTaskEntry (entry) {
        this.rememberEntry(entry);
        if (entry.duration < this.longTaskThresholdMs()) {
            return this;
        }

        const json = {
            durationMs: Math.round(entry.duration),
            taskName: entry.name
        };

        const stamp = SvEventManager.shared().lastEventStamp();
        if (stamp) {
            json.lastEvent = {
                name: stamp.name,
                msFromLastEventEndToTaskStart: Math.round(entry.startTime - stamp.endTime)
            };
            if (stamp.describe) {
                json.lastEvent.handler = stamp.describe();
            }
        }

        SvClientReport.report("long-task", json);
        return this;
    }

    /**
     * @description Keeps the last 50 long tasks (the browser's, 50 ms and up),
     * so a probe can say what held the main thread during its window.
     * @param {PerformanceEntry} entry
     * @returns {SvLongTaskMonitor}
     * @category Recent
     */
    rememberEntry (entry) {
        if (!this.recentEntries()) {
            this.setRecentEntries([]);
        }
        const entries = this.recentEntries();
        entries.push({ at: Math.round(entry.startTime), ms: Math.round(entry.duration) });
        if (entries.length > 50) {
            entries.shift();
        }
        return this;
    }

    /**
     * @description The remembered long tasks that overlap a window.
     * @param {Number} start - performance.now() time
     * @param {Number} end - performance.now() time
     * @returns {Array} [{ at, ms }]
     * @category Recent
     */
    entriesBetween (start, end) {
        return (this.recentEntries() || []).filter((e) => e.at + e.ms >= start && e.at <= end);
    }

}.initThisClass());

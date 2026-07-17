"use strict";

/**
 * @class SvClientReport
 * @extends ProtoClass
 * @classdesc The reporting seam for threshold-gated client diagnostics
 * (performance probes, etc.). Probes compose a full JSON payload and hand it
 * to report(type, json); they never decide where reports go.
 *
 * v1: logs to the console with a stable "REPORT [type]" prefix (grep-able in
 * console dumps, assertable from Playwright).
 *
 * v2 (deferred): this same method grows an asyncSend to POST /log_report
 * (next to SvErrorReport's /log_error) plus client-side throttling — probes
 * won't change.
 *
 * Example:
 *
 *     SvClientReport.report("long-event", { durationMs: 1200, event: "MouseEvent" });
 */

(class SvClientReport extends ProtoClass {

    /**
     * @static
     * @description Files a client report. v1 implementation logs to the console.
     * @param {string} type - Report type slug, e.g. "long-event", "long-task", "dice-roll-performance"
     * @param {Object} json - The full report payload, composed by the caller
     * @category Reporting
     */
    static report (type, json) {
        console.log("REPORT [" + type + "] " + JSON.stringify(json));
    }

}.initThisClass());

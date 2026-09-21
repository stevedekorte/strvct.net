/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvImageWellFieldTile
 * @extends SvFieldTile
 * @classdesc Represents an image well field tile in the browser stack.


 */

"use strict";

/**
    @class SvImageWellFieldTile
    @extends SvFieldTile
    @classdesc Represents an image well field tile in the browser stack.
*/

(class SvImageWellFieldTile extends SvFieldTile {

    /**
     * @description Checks if the given mime type can be opened.
     * @param {string} mimeType - The mime type to check.
     * @returns {boolean} True if the mime type can be opened, false otherwise.
     * @category File Handling
     */
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("image/");
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} progressiveSyncEpoch - Monotonic token bumped at the
         * start of each progressive async sync pass. After awaiting the image
         * data URLs, a pass compares the current epoch to the one it claimed and
         * bails if a newer pass has started — so a stale pass can never re-apply
         * image data over newer state.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("progressiveSyncEpoch", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} imageFetchRetryCount - How many final-image fetch
         * attempts have missed for the CURRENT target hash. Drives the backoff
         * schedule and the "force past the negative caches" decision; reset
         * when the target hash changes and on success.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("imageFetchRetryCount", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} imageFetchFirstMissMs - Timestamp of the first miss
         * for the current target hash, or 0 when none. The retry horizon is
         * measured from here, so the schedule can't run forever.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("imageFetchFirstMissMs", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {String|null} lastFetchedFinalHash - The final-image content
         * hash the retry bookkeeping above belongs to. A different hash is a
         * different blob, so neither the attempt count nor the horizon carries
         * over.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("lastFetchedFinalHash", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Number} lastFetchStallReportMs - When the node was last told
         * its fetch is stalled, so the hook fires at most once per interval.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("lastFetchStallReportMs", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {String|null} lastProgressiveSyncSummary - The last sync summary
         * traced to the console, so unchanged re-syncs (presence storms) stay quiet.
         * @category Debugging
         */
        {
            const slot = this.newSlot("lastProgressiveSyncSummary", null);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the SvImageWellFieldTile.
     * @returns {SvImageWellFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        //this.keyView().setElementClassName("SvImageWellKeyField");
        //this.valueView().setIsEditable(false);
        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        //this.valueViewContainer().setPadding("0px");
        return this;
    }

    /**
     * @description Creates and returns a value view.
     * @returns {SvImageWellView} The created image well view.
     * @category View Creation
     */
    createValueView () {
        /*
            Note: if we drop an image on the SvImageWellView, it will send a didUpdateImageWellView to it's parents
            which we respond to and use to call setValue
        */
        const imageWellView = SvImageWellView.clone();
        //imageWellView.setDelegate(this);
        //imageWellView.setWidth("100%").setHeight("fit-content");
        return imageWellView;
    }

    /**
     * @deprecated Use syncToNode flow instead.
     */
    setDataUrl (dataUrl) {
        this.setValue(dataUrl);
        return this;
    }

    /**
     * @description Returns the image well view.
     * @returns {SvImageWellView} The image well view.
     * @category View Access
     */
    imageWellView () {
        return this.valueView();
    }

    /**
     * @description True if the node opts into progressive rendering. This is a
     * STABLE CAPABILITY check — conformance to SvProgressiveImageSourceProtocol is
     * declared once (via addProtocol) and never changes for a node's lifetime —
     * NOT a check of mutable runtime state. Gating on live state (e.g. "aspect
     * != null || working") re-decides the code path per sync: a well could flip
     * from the progressive path into the destructive single-image path
     * (setImageDataUrl → removeAllSubviews) mid-generation and tear down its own
     * layers. Keying off the protocol keeps a node on exactly one path forever.
     * A node that doesn't conform (a plain SvImageWellField, or a bare
     * SvImageNode acting as its own field) takes the original single-image path.
     * @returns {Boolean}
     * @category Synchronization
     */
    nodeIsProgressive () {
        const field = this.node();
        return !!(field && field.conformsToProtocol && field.conformsToProtocol(SvProgressiveImageSourceProtocol));
    }

    /**
     * @description Synchronizes the tile from the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        const field = this.node();
        this.setMaxWidth("100em"); // get this from node instead?

        this.applyStyles(); // normally this would happen in updateSubviews

        // handle other details (nodeValueIsEditable folds in the editability cascade)
        this.imageWellView().setIsEditable(this.nodeValueIsEditable());

        if (this.nodeIsProgressive()) {
            this.syncProgressiveFromNode();
        } else {
            // ORIGINAL non-progressive path — byte-for-byte as before.
            // Hide the value view if we're still generating (showing dots in key)
            if (field.keyIsComplete && !field.keyIsComplete()) {
                this.valueViewContainer().setDisplay("none");
            } else {
                this.valueViewContainer().setDisplay("");
            }
        }

        // handle image values
        this.asyncSyncFromNode(); // no await

        return this;
    }

    /**
     * @description Progressive-mode sync: feed the reserved-box aspect ratio and
     * working flag into the well, and keep the well visible during work. The
     * base tile / SvFieldTile hides the value view while !keyIsComplete /
     * !valueIsVisible; for a progressive well we want the reserved box shown
     * throughout so it never renders a blank tile.
     *
     * On the FAILED terminal (progressiveImageHasFailed — a cloud-durable flag, unlike
     * the host-only `error` slot, so guests see it too) the well is torn down:
     * shimmer stopped, preview/final layers cleared and the reserved box
     * collapsed, so no permanent blank spacer remains and the field's key/error
     * text lays out normally.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    syncProgressiveFromNode () {
        const field = this.node();
        const well = this.imageWellView();

        if (field.progressiveImageHasFailed && field.progressiveImageHasFailed()) {
            return this.syncFailedProgressiveWell(well);
        }

        this.valueViewContainer().setDisplay("");
        well.setIsDisplayHidden(false);

        const working = !!(field.progressiveImageIsWorking && field.progressiveImageIsWorking());
        this.logProgressiveSyncSummary(well, working);

        // Completed: collapse to natural ONLY for a COLD well (nothing on
        // screen); a well that witnessed progress keeps its box + preview so the
        // final reveals over them. See syncCompletedProgressiveWell().
        if (this.nodeHasImageToFetch() && !working) {
            return this.syncCompletedProgressiveWell(well);
        }

        if (well.setAspectRatioString) {
            well.setAspectRatioString(field.progressiveImageAspectRatio());
        }
        if (well.setIsWorking) {
            well.setIsWorking(working);
        }
        return this;
    }

    /**
     * @description The FAILED terminal: show the container and let the well tear
     * itself down (shimmer stopped, layers cleared, reserved box collapsed).
     * @param {SvImageWellView} well - The image well view.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    syncFailedProgressiveWell (well) {
        this.valueViewContainer().setDisplay("");
        if (well.applyFailedState) {
            well.applyFailedState();
        }
        return this;
    }

    /**
     * @description Applies the completed-image state to the well: the node has a
     * final image and is no longer working.
     *
     * The natural collapse (null aspect) is ONLY for a COLD completed image — a
     * reload or a late join, where nothing is on screen and the padding-top box
     * would just be an empty rectangle (height:0 + 66% padding, no layers).
     *
     * A well that WITNESSED progress is mid-story: it is showing a reserved box
     * (with a blurred preview in it, or just the working fill + shimmer) while
     * the final blob is still downloading. Collapsing it to natural there would
     * tear that down and empty the well for seconds — and to the viewer the
     * image IS still loading, whatever the model says about generation. So it
     * is left exactly as it is until the final lands; the well then reveals the
     * final over the preview (focus-pull) and ends its own working state.
     * @param {SvImageWellView} well - The image well view.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    syncCompletedProgressiveWell (well) {
        const witnessed = !!(well.witnessedProgress && well.witnessedProgress());
        if (witnessed && !(well.finalDataUrl && well.finalDataUrl())) {
            return this; // mid-story: keep box, preview and shimmer until the final lands
        }
        if (well.setIsWorking) {
            well.setIsWorking(false);
        }
        if (well.setAspectRatioString && !witnessed) {
            well.setAspectRatioString(null);
        }
        return this;
    }

    /**
     * @description Traces the sync inputs, but only when they changed since the
     * last trace: syncFromNode runs on every didUpdateNode (presence storms
     * included), and an unchanged line would drown the transitions we're after.
     * @param {SvImageWellView} well - The image well view.
     * @param {Boolean} working - Whether the node reports work in progress.
     * @returns {SvImageWellFieldTile}
     * @category Debugging
     */
    logProgressiveSyncSummary (well, working) {
        const summary = this.progressiveSyncSummary(well, working);
        if (summary !== this.lastProgressiveSyncSummary()) {
            this.setLastProgressiveSyncSummary(summary);
            this.logProgressive(summary);
        }
        return this;
    }

    /**
     * @description One-line summary of a progressive sync pass, for the console
     * trace. Names the well so its own "[ImageWell …]" lines can be matched up.
     * @param {SvImageWellView} well - The image well view.
     * @param {Boolean} working - Whether the node reports work in progress.
     * @returns {String} The summary line.
     * @category Debugging
     */
    progressiveSyncSummary (well, working) {
        const field = this.node();
        return "sync hasLoaded=" + this.nodeHasImageToFetch() +
            " working=" + working +
            " aspect=" + field.progressiveImageAspectRatio() +
            " wellAspect=" + well.aspectRatioString() +
            " witnessed=" + well.witnessedProgress() +
            " well=" + well.svTypeId();
    }

    /**
     * @description The node identity used in the console trace: its jsonId when
     * it has one (the id that rides a sync envelope, so host and guest logs line
     * up), else its debug id.
     * @returns {String}
     * @category Debugging
     */
    progressiveLogId () {
        const field = this.node();
        if (!field) {
            return "no-node";
        }
        const jsonId = field.jsonId ? field.jsonId() : null;
        return jsonId ? jsonId : field.svDebugId();
    }

    /**
     * @description Console trace of a progressive sync step, prefixed with the
     * node identity. Gated by the same switch as the well's own trace
     * (SvImageWellView.isProgressiveLoggingEnabled — developerMode by default,
     * overridable from the console).
     * @param {String} message
     * @returns {SvImageWellFieldTile}
     * @category Debugging
     */
    logProgressive (message) {
        if (SvImageWellView.isProgressiveLoggingEnabled()) {
            console.log("[ImageWellTile " + this.progressiveLogId() + "] " + message);
        }
        return this;
    }

    async asyncSyncFromNode () {
        if (this.nodeIsProgressive()) {
            return await this.asyncSyncProgressiveFromNode();
        }

        const imageWellView = this.imageWellView();
        const field = this.node();
        let value = field.value();
        try {
            if (value === null || value === undefined) {
                value = null;
            } else if (value.asyncDataUrl) {
                value = await value.asyncDataUrl();
            } else {
                assert(typeof value === "string", "value is not a string");
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: Failed to load image data:", error.message);
            value = null;
        }
        imageWellView.setImageDataUrl(value);
        return this;
    }

    /**
     * @description Progressive-mode async sync: resolves the preview + final
     * data URLs and feeds them to the well as one idempotent pass. The base
     * single-image path (setImageDataUrl → removeAllSubviews) is skipped so it
     * can't destroy the stacked layers on every sync.
     *
     * A sequence guard makes overlapping passes safe: each pass claims a fresh
     * epoch up front, and after awaiting the (independent, so Promise.all'd)
     * image data URLs it re-checks the epoch and bails if a newer pass has
     * started — so a completion sync landing inside an earlier pass's await can
     * never let the stale pass re-install a layer over the newer state. The
     * FINAL-before-PREVIEW ordering is no longer load-bearing here: it lives
     * inside well.applyProgressiveImageData().
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    async asyncSyncProgressiveFromNode () {
        const well = this.imageWellView();

        if (this.shouldSkipProgressivePass(well)) {
            return this;
        }

        this.resetImageFetchRetriesIfTargetChanged();

        this.setProgressiveSyncEpoch(this.progressiveSyncEpoch() + 1);
        const epoch = this.progressiveSyncEpoch();
        this.logProgressive("pass#" + epoch + " start");

        const [finalUrl, previewUrl] = await Promise.all([
            this.asyncResolveFinalUrl(),
            this.asyncResolvePreviewUrl()
        ]);

        if (this.progressiveSyncEpoch() !== epoch) {
            this.logProgressive("pass#" + epoch + " bailed (superseded)");
            return this;
        }

        return this.applyResolvedProgressiveUrls(well, epoch, finalUrl, previewUrl);
    }

    /**
     * @description True when this pass must not run at all: the node has failed,
     * or the well already shows a final. A conversation-level didUpdateNode
     * (progress-tag hide, TV band, load hygiene) resyncs every tile and used to
     * bump the epoch, cancelling the blob fetch and leaving the reserved box
     * empty — once this well has a final, later storms must not restart it.
     * @param {SvImageWellView} well - The image well view.
     * @returns {Boolean}
     * @category Synchronization
     */
    shouldSkipProgressivePass (well) {
        const field = this.node();
        if (field.progressiveImageHasFailed && field.progressiveImageHasFailed()) {
            return true;
        }
        return !!(well.finalDataUrl && well.finalDataUrl()); // silent: this is the steady state of every finished tile
    }

    /**
     * @description Feeds the resolved urls of one (non-superseded) pass into the
     * well, or schedules a retry when the node says an image exists but its blob
     * hasn't arrived yet.
     * @param {SvImageWellView} well - The image well view.
     * @param {Number} epoch - The epoch this pass claimed, for the console trace.
     * @param {String|null} finalUrl - The resolved final image data URL.
     * @param {String|null} previewUrl - The resolved preview data URL.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    applyResolvedProgressiveUrls (well, epoch, finalUrl, previewUrl) {
        if (!finalUrl && well.finalDataUrl && well.finalDataUrl()) {
            return this;
        }
        if (!finalUrl && this.nodeHasImageToFetch()) {
            return this.scheduleImageFetchRetry();
        }
        if (finalUrl) {
            this.resetImageFetchRetries();
        }
        this.logProgressive("pass#" + epoch + " apply final=" + !!finalUrl + " preview=" + !!previewUrl);
        if (well.applyProgressiveImageData) {
            well.applyProgressiveImageData(finalUrl, previewUrl);
        }
        return this;
    }

    nodeHasImageToFetch () {
        const field = this.node();
        return !!(field && field.hasLoaded && field.hasLoaded());
    }

    /**
     * @description The delay before fetch attempt `attempt` (1-based): capped
     * exponential backoff — 250, 500, 1000, 2000, 4000, 8000, then 15000 ms
     * repeating. The old 8×(200·n) schedule burned every attempt inside 7s,
     * which is shorter than the 60s negative-cache TTL it was usually racing:
     * a single 404 ended the fetch for good. Pure (no DOM, no state) so the
     * schedule is unit-testable headlessly.
     * @param {Number} attempt - 1-based attempt number.
     * @returns {Number} The delay in ms.
     * @category Synchronization
     */
    imageFetchRetryDelayMs (attempt) {
        const n = Math.max(1, Math.floor(attempt));
        const delayMs = 250 * Math.pow(2, n - 1);
        return Math.min(delayMs, this.imageFetchRetryMaxDelayMs());
    }

    /**
     * @description The ceiling of the backoff schedule: once reached, retries
     * continue at this cadence until the horizon.
     * @returns {Number} ms
     * @category Synchronization
     */
    imageFetchRetryMaxDelayMs () {
        return 15000;
    }

    /**
     * @description How long retries continue, measured from the first miss.
     * Bounded rather than endless, but long enough to outlast the things that
     * actually delay a blob (a cold upload, a 60s negative cache, a host
     * re-publish round trip).
     * @returns {Number} ms
     * @category Synchronization
     */
    imageFetchRetryHorizonMs () {
        return 300000;
    }

    /**
     * @description How often the node is told its fetch is stalled, once the
     * hook has started firing.
     * @returns {Number} ms
     * @category Synchronization
     */
    imageFetchStallReportIntervalMs () {
        return 30000;
    }

    /**
     * @description The node asserts a final image exists but its bytes didn't
     * resolve: schedule another attempt on the backoff schedule, and tell the
     * node it is stalled so it can go get the bytes made available. The well is
     * left exactly as it is — a witnessed well keeps its preview AND its
     * shimmer, because from the viewer's side the image is still loading.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    scheduleImageFetchRetry () {
        const nowMs = Date.now();
        if (this.imageFetchFirstMissMs() === 0) {
            this.setImageFetchFirstMissMs(nowMs);
        }
        if ((nowMs - this.imageFetchFirstMissMs()) >= this.imageFetchRetryHorizonMs()) {
            return this.reportImageFetchFailure();
        }
        const attempt = this.imageFetchRetryCount() + 1;
        this.setImageFetchRetryCount(attempt);
        const delayMs = this.imageFetchRetryDelayMs(attempt);
        this.logProgressive("fetch retry " + attempt + " in " + delayMs + "ms");
        this.notifyNodeOfImageFetchStall(attempt);
        this.addTimeout(() => this.asyncSyncProgressiveFromNode(), delayMs, "imageWellFetchRetry");
        return this;
    }

    /**
     * @description The retry horizon is exhausted: the node asserted an image
     * that never became fetchable. That is a FAILURE, not a give-up, so name
     * the hash in a console error (a field log then identifies the exact blob),
     * stop the shimmer — it would otherwise pulse forever — and KEEP the
     * preview, which is the best image the viewer can be left with. A later
     * didUpdateNode (the blob finally landing, a new hash) still starts a fresh
     * pass.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    reportImageFetchFailure () {
        console.error("SvImageWellFieldTile: final image blob never became fetchable for hash "
            + (this.nodeFinalHash() || "(none)") + " after " + (this.imageFetchRetryHorizonMs() / 1000) + "s of retries");
        const well = this.imageWellView();
        if (well.setIsWorking) {
            well.setIsWorking(false);
        }
        return this;
    }

    /**
     * @description The final image's content hash, when the node's value
     * carries one. Identifies the fetch TARGET, so a changed hash can reset the
     * retry bookkeeping, and names the blob in the stall hook and failure log.
     * @returns {String|null}
     * @category Synchronization
     */
    nodeFinalHash () {
        const field = this.node();
        const value = field ? field.value() : null;
        return (value && value.valueHash) ? value.valueHash() : null;
    }

    /**
     * @description Resets the retry bookkeeping when the fetch target changed
     * since the last pass: a different hash is a different blob, so neither the
     * attempt count nor the horizon (nor the stall-report clock) carries over.
     * Without this, a message whose image is replaced would inherit an
     * exhausted schedule and never fetch the new one.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    resetImageFetchRetriesIfTargetChanged () {
        const hash = this.nodeFinalHash();
        if (hash === this.lastFetchedFinalHash()) {
            return this;
        }
        this.setLastFetchedFinalHash(hash);
        return this.resetImageFetchRetries();
    }

    /**
     * @description Clears the retry bookkeeping (attempt count, horizon start,
     * stall-report clock).
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    resetImageFetchRetries () {
        this.setImageFetchRetryCount(0);
        this.setImageFetchFirstMissMs(0);
        this.setLastFetchStallReportMs(0);
        return this;
    }

    /**
     * @description Whether the final-image resolve should bypass the
     * missing-hash negative caches. True from the second attempt on: the node
     * asserts the hash exists, so a cached miss is stale by definition and
     * re-reading it would just burn the whole schedule against the cache.
     * @returns {Boolean}
     * @category Synchronization
     */
    shouldForceFinalImageFetch () {
        return this.imageFetchRetryCount() >= 1;
    }

    /**
     * @description Optional node hook (see SvProgressiveImageSourceProtocol):
     * tell the node its blob fetch is stalled so it can take model-level
     * recovery action — the view knows the symptom, the node owns the remedy.
     * Fires from the 3rd attempt (by then it isn't a startup race) and at most
     * once per report interval while the fetch keeps failing.
     * @param {Number} attempt - 1-based attempt just scheduled.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    notifyNodeOfImageFetchStall (attempt) {
        const field = this.node();
        if (attempt < 3 || !field || typeof field.onProgressiveImageFetchStalled !== "function") {
            return this;
        }
        const nowMs = Date.now();
        const lastMs = this.lastFetchStallReportMs();
        if (lastMs !== 0 && (nowMs - lastMs) < this.imageFetchStallReportIntervalMs()) {
            return this;
        }
        this.setLastFetchStallReportMs(nowMs);
        this.logProgressive("reporting fetch stall to node (attempt " + attempt + ")");
        field.onProgressiveImageFetchStalled(attempt, this.nodeFinalHash());
        return this;
    }

    /**
     * @description Resolves the FINAL image data URL from the node's value —
     * same value()/asyncDataUrl path as the base single-image sync. Retries
     * (attempt 2 on) pass `force`, so they bypass the missing-hash negative
     * caches instead of re-reading the same stale miss.
     * @returns {Promise<String|null>} The data URL, or null.
     * @category Synchronization
     */
    async asyncResolveFinalUrl () {
        const force = this.shouldForceFinalImageFetch();
        try {
            const value = this.node().value();
            if (value && value.asyncDataUrl) {
                const dataUrl = await value.asyncDataUrl({ force });
                if (dataUrl) {
                    return dataUrl;
                }
            }
            if (typeof value === "string" && value.length > 0) {
                return value;
            }
            const publicUrl = await this.asyncResolvePublicUrl();
            if (publicUrl) {
                return publicUrl;
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load final image:", error.message);
        }
        return null;
    }

    async asyncResolvePublicUrl () {
        const field = this.node();
        const imageNode = field && field.imageNode ? field.imageNode() : null;
        if (!imageNode) {
            return null;
        }
        if (imageNode.publicUrl && imageNode.publicUrl()) {
            return imageNode.publicUrl();
        }
        if (imageNode.asyncPublicUrl) {
            try {
                return await imageNode.asyncPublicUrl();
            } catch {
                return null; // no hash yet / not in cloud — expected while a generation is in flight
            }
        }
        return null;
    }

    /**
     * @description Resolves the PREVIEW (blurred back layer) data URL from the
     * node's progressiveImagePreviewValue().
     * @returns {Promise<String|null>} The data URL, or null.
     * @category Synchronization
     */
    async asyncResolvePreviewUrl () {
        try {
            const field = this.node();
            const previewValue = field.progressiveImagePreviewValue ? field.progressiveImagePreviewValue() : null;
            if (previewValue && previewValue.asyncDataUrl) {
                return await previewValue.asyncDataUrl();
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load preview image:", error.message);
        }
        return null;
    }

    /**
     * @description Syncs the value from the node. For progressive nodes the base
     * path (setValue → setImageDataUrl → removeAllSubviews) is skipped because it
     * would destroy the well's stacked preview/final layers on every sync; the
     * progressive image plumbing flows through asyncSyncProgressiveFromNode()
     * instead. Non-progressive nodes get unchanged base behavior.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncValueFromNode () {
        if (!this.nodeIsProgressive()) {
            return super.syncValueFromNode();
        }
        this.valueView().setIsEditable(this.nodeValueIsEditable());
        return this;
    }

    /**
     * @description Synchronizes the tile to the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncToNode () {
        const field = this.node();

        field.setKey(this.keyView().value());

        if (this.nodeIsProgressive()) {
            // Progressive wells are display-driven FROM the node: finals flow
            // through the front layer, not setImageDataUrl, so the well's
            // imageDataUrl() is null. Writing it back would clobber the node's
            // value. Never write back for progressive nodes (the base
            // removeAllSubviews drop/edit path is likewise inert here — such
            // nodes report valueIsEditable() false, and willRemoveSubview keeps
            // the well's layer slots consistent if a wipe ever happens).
            return this;
        }

        if (this.nodeValueIsEditable()) { // cascade included: read-only-in-context wells never write back
            this.writeWellDataUrlToField(field, this.imageWellView().imageDataUrl());
        }

        return this;
    }

    /**
     * @description Writes a dropped or edited image onto the field. Prefers
     * the blob-node path (create blob, replace Sv blob ref) so wells whose
     * value is an SvImageNode stay on the same storage path as generation.
     * @param {SvImageWellField} field
     * @param {String|null} dataUrl
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    writeWellDataUrlToField (field, dataUrl) {
        const value = field.value();
        if (!dataUrl) {
            if (value && value.clear) {
                value.clear();
            } else {
                field.setValue(null);
            }
            return this;
        }
        if (value && value.asyncSetDataURL) {
            value.asyncSetDataURL(dataUrl).catch((error) => {
                console.error(this.svType() + " failed to replace image blob:", error);
            });
            return this;
        }
        if (value && value.setBlobFromDataURL) {
            value.setBlobFromDataURL(dataUrl);
            return this;
        }
        field.setValue(dataUrl);
        return this;
    }

    /**
     * @description Returns the data URL of the image.
     * @returns {string|null} The data URL of the image.
     * @category Data Access
     */
    dataUrl () {
        return this.imageWellView().imageDataUrl();
    }

    /**
     * @description Checks if the image well is empty.
     * @returns {boolean} True if empty, false otherwise.
     * @category State Check
     */
    isEmpty () {
        return Type.isNull(this.dataUrl());
    }

    /**
     * @description Handles the update of the image well view.
     * @param {SvImageWellView} anImageWell - The updated image well view.
     * @returns {SvImageWellFieldTile} The current instance.
     * @category Event Handling
     */
    didUpdateImageWellView (/*anImageWell*/) {
        //this.logDebug(".didUpdateImageWellView()");
        this.scheduleSyncToNode();
        return this;
    }

}.initThisClass());

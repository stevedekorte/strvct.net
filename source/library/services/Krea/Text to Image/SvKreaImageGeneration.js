/**
 * @module library.services.Krea.Text_to_Image
 */

/**
 * @class SvKreaImageGeneration
 * @extends SvSummaryNode
 * @classdesc A submitted Krea job, polled until it completes.
 *
 * Krea's job lifecycle (GET /jobs/{id}) reports one of:
 *   backlogged | queued | scheduled | processing | sampling
 *   intermediate-complete | completed | failed | cancelled
 *
 * Polling goes through the proxy like every other request. The status endpoint is
 * registered as FREE on the backend service, so a long poll loop cannot multiply
 * the generation's charge.
 *
 * Every terminal path MUST settle completionPromise — a status that stops the
 * poll loop without settling would hang the awaiting generate() chain forever
 * and leave the UI shimmering with no error. (That exact bug was fixed three
 * separate times in the ImaginePro equivalent; the shape is preserved here.)
 */
"use strict";

(class SvKreaImageGeneration extends SvSummaryNode {

    initPrototypeSlots () {

        /**
         * @member {string} promptNote
         * @description The prompt this job was submitted with, for the record.
         * @category Status
         */
        {
            const slot = this.newSlot("promptNote", null);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {string} jobId
         * @description The Krea job id being polled.
         * @category Status
         */
        {
            const slot = this.newSlot("jobId", "");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {string} status
         * @category Status
         */
        {
            const slot = this.newSlot("status", "pending");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {Error} error
         * @category Status
         */
        {
            const slot = this.newSlot("error", null);
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("Error");
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {SvFilesToDownload} images
         * @description The result images, fetched by URL.
         * @category Output
         */
        {
            // Proto named as a STRING so resolution is deferred: this class lives
            // outside the directory that defines SvFilesToDownload, and a direct
            // class reference here would make correctness depend on _imports.json
            // ordering across service directories.
            const slot = this.newSlot("images", null);
            slot.setFinalInitProto("SvFilesToDownload");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("SvFilesToDownload");
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {Object} delegate
         * @category Delegation
         */
        {
            const slot = this.newSlot("delegate", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Object");
            slot.setCanInspect(true);
            slot.setIsInCloudJson(false); // runtime ref; would be circular
        }

        /**
         * @member {number} pollInterval
         * @category Configuration
         */
        {
            const slot = this.newSlot("pollInterval", 2000);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        /**
         * @member {number} initialPollDelay
         * @description Delay before the first poll. Krea creates a durable job
         * before responding, so unlike the ImaginePro path this needs no
         * registration grace period — just enough to avoid a pointless immediate
         * round trip.
         * @category Configuration
         */
        {
            const slot = this.newSlot("initialPollDelay", 1000);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        /**
         * @member {number} maxPollAttempts
         * @description 450 x 2s ≈ 15 minutes.
         *
         * Sized from a measured run, not a guess: a plain generation completed
         * in ~12s, but the first generation WITH a trained style took 163s —
         * loading the style dominates. 5 minutes left too little headroom for a
         * busy queue, and exhausting the budget fails a generation that was
         * still progressing. Polls are free (the job endpoint is registered at
         * zero cost), so a generous ceiling costs nothing but patience.
         * @category Configuration
         */
        {
            const slot = this.newSlot("maxPollAttempts", 450);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        /**
         * @member {number} pollAttempts
         * @category Status
         */
        {
            const slot = this.newSlot("pollAttempts", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        /**
         * @member {Object} pollTimeoutId
         * @category Internal
         */
        {
            const slot = this.newSlot("pollTimeoutId", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Object");
            slot.setCanInspect(true);
        }

        /**
         * @member {boolean} didReportIntermediate
         * @description Guard so the intermediate-preview delegate call fires at
         * most once per job.
         * @category Status
         */
        {
            const slot = this.newSlot("didReportIntermediate", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("completionPromise", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Promise");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    finalInit () {
        super.finalInit();
        // Re-establish delegate relationships after cloud deserialization.
        this.images().subnodes().forEach(image => {
            image.setDelegate(this);
        });
    }

    title () {
        return `Job ${this.jobId().slice(0, 8)}`;
    }

    subtitle () {
        return this.status();
    }

    service () {
        return SvKreaService.shared();
    }

    // --- polling ---

    /**
     * @description Starts polling and resolves when the job reaches a terminal
     * state.
     * @returns {Promise}
     * @category Process
     */
    async asyncStartPolling () {
        this.setCompletionPromise(Promise.clone());
        this.setPollAttempts(0);
        this.setDidReportIntermediate(false);

        this.shareProgress("waiting on image results...");
        this.setStatus("preparing to poll for job status...");
        this.sendDelegateMessage("onImageGenerationStart", [this]);

        const timeoutId = setTimeout(() => {
            this.setStatus("polling for job status...");
            this.pollJobStatus();
        }, this.initialPollDelay());
        this.setPollTimeoutId(timeoutId);

        return this.completionPromise();
    }

    stopPolling () {
        if (this.pollTimeoutId()) {
            clearTimeout(this.pollTimeoutId());
            this.setPollTimeoutId(null);
        }
    }

    /**
     * @description The job status URL for this job.
     * @returns {string}
     * @category Process
     */
    jobStatusEndpoint () {
        return SvKreaService.endpointBase() + "jobs/" + this.jobId();
    }

    /**
     * @description Polls once, then either finishes or schedules the next poll.
     * @category Process
     */
    async pollJobStatus () {
        try {
            const apiKey = await this.service().apiKeyOrUserAuthToken();
            const proxyEndpoint = SvProxyServers.shared().defaultServer().proxyUrlForUrl(this.jobStatusEndpoint());

            const request = SvXhrRequest.clone();
            request.setUrl(proxyEndpoint);
            request.setMethod("GET");
            // No Content-Type on a GET: Firebase returns 400 for a GET that
            // declares a body content type.
            request.setHeaders({
                "Authorization": `Bearer ${apiKey}`
            });

            await request.asyncSend();

            if (request.isSuccess()) {
                this.handlePollResponse(JSON.parse(request.responseText()));
                return;
            }

            console.error(this.logPrefix() + " Krea poll request failed:", request.description());

            // A 404 means this job id will never resolve — stop rather than
            // burning the full attempt budget on a job that does not exist.
            if (request.status() === 404) {
                this.failWithError(new Error("Krea job not found (" + this.jobId() + ") - stopping polling"));
                return;
            }

            // Any other failure may be transient; keep polling.
            this.schedulePoll();
        } catch (error) {
            this.shareProgress("error polling for image results...");
            console.error(this.logPrefix() + " poll error:", error);
            this.schedulePoll();
        }
    }

    /**
     * @description Routes a job status payload to the matching terminal or
     * continuation path. An unrecognized status keeps polling: a new Krea status
     * string should slow us down, not fail a job that is actually progressing
     * (the attempt budget still bounds it).
     * @param {Object} response - The parsed job payload.
     * @category Process
     */
    async handlePollResponse (response) {
        const status = response.status;

        if (status === "completed") {
            this.handlePollDone(response);
            return;
        }

        if (status === "failed" || status === "cancelled") {
            this.handlePollError(response);
            return;
        }

        if (status === "intermediate-complete") {
            this.handlePollIntermediate(response);
            return;
        }

        if (!["backlogged", "queued", "scheduled", "processing", "sampling"].includes(status)) {
            console.warn(this.logPrefix() + " unknown Krea job status:", status);
        }
        this.setStatus(`${status}... (attempt ${this.pollAttempts() + 1}/${this.maxPollAttempts()})`);
        this.schedulePoll();
    }

    /**
     * @description Krea can publish a partial result before finishing. Surfacing
     * it lets the UI show something in the reserved frame early. Best effort: if
     * no urls are attached, this is just another pending tick.
     * @param {Object} response - The parsed job payload.
     * @category Process
     */
    async handlePollIntermediate (response) {
        this.setStatus("intermediate result available...");
        const imageUrls = this.imageUrlsFromResult(response.result);

        if (imageUrls.length > 0 && !this.didReportIntermediate()) {
            this.setDidReportIntermediate(true);
            try {
                await this.downloadImageUrls(imageUrls);
                this.sendDelegateMessage("onImageGenerationIntermediate", [this]);
            } catch (error) {
                // A failed preview must never fail the job — the final result is
                // still coming.
                console.warn(this.logPrefix() + " intermediate preview failed:", error && error.message);
            }
        }
        this.schedulePoll();
    }

    /**
     * @description Normalizes Krea's `result.urls`, which is documented as
     * either an array of url strings or an array of {type, url} objects. For the
     * object form we keep only the actual model output, not the "preview"
     * thumbnail.
     * @param {Object} result - The job's result object.
     * @returns {Array<string>} Image URLs, possibly empty.
     * @category Results
     */
    imageUrlsFromResult (result) {
        const urls = result ? result.urls : null;
        if (!Array.isArray(urls)) {
            return [];
        }
        const modelUrls = [];
        const previewUrls = [];
        urls.forEach(entry => {
            if (typeof entry === "string") {
                modelUrls.push(entry);
            } else if (entry && typeof entry.url === "string") {
                (entry.type === "preview" ? previewUrls : modelUrls).push(entry.url);
            }
        });
        // Fall back to previews only if there is nothing else to show.
        return modelUrls.length > 0 ? modelUrls : previewUrls;
    }

    async handlePollDone (response) {
        this.shareProgress("got image results...");
        this.setStatus("completed");
        this.stopPolling();

        try {
            const imageUrls = this.imageUrlsFromResult(response.result);
            if (imageUrls.length === 0) {
                throw new Error("Krea job completed with no image urls");
            }
            // An intermediate may already have populated images; replace it so
            // the final result is what consumers read.
            this.images().removeAllSubnodes();
            await this.downloadImageUrls(imageUrls);
            this.completionPromise().callResolveFunc(this);
        } catch (error) {
            // handlePollDone is invoked WITHOUT await, so a throw here would
            // otherwise skip the resolve above and leave completionPromise
            // pending forever, hanging the awaiting generate() chain.
            this.failWithError(Error.normalizeError(error));
        }
    }

    async handlePollError (response) {
        const errorInfo = response.error || {};
        const message = errorInfo.message || errorInfo.code || response.status || "Unknown error";
        const details = ["error: " + message];
        if (response.status) {
            details.push("status: " + response.status);
        }
        if (response.job_id) {
            details.push("jobId: " + response.job_id);
        }
        console.error(this.logPrefix() + " Krea job failed:", response);
        this.failWithError(new Error("Image generation failed (" + details.join(", ") + ")"));
    }

    /**
     * @description The single terminal failure path: record the error, stop
     * polling, settle the promise, notify the delegate. Everything that fails
     * routes through here so no path can stop polling without settling.
     * @param {Error} error - The failure.
     * @category Process
     */
    failWithError (error) {
        this.setStatus("failed");
        this.setError(error);
        this.stopPolling();
        this.completionPromise().callRejectFunc(error);
        this.sendDelegateMessage("onImageGenerationError", [this]);
    }

    /**
     * @description Fetches the finished image bytes.
     *
     * VIA THE PROXY, NECESSARILY. Krea serves results from gen.krea.ai, which
     * sends no Access-Control-Allow-Origin, so a direct browser read of the
     * bytes fails with a CORS error. Krea offers no data-URI alternative (no
     * sync_mode parameter, unlike fal). The proxy rewrites every response with
     * `Access-Control-Allow-Origin: *`, so routing the download through it is
     * what makes the bytes readable — the same job the MidJourney gateway used
     * to do for us server-side.
     *
     * The proxy verifies a Firebase ID token, hence the bearer token; it strips
     * that token before forwarding, and the media endpoint is registered
     * `useBearerAuth: false`, so nothing credential-bearing reaches the CDN.
     * The endpoint is also registered free, so re-fetching a generation's own
     * output adds no cost.
     *
     * @param {Array<string>} imageUrls - Krea-hosted image URLs.
     * @category Results
     */
    async downloadImageUrls (imageUrls) {
        const authToken = await this.service().apiKeyOrUserAuthToken();
        const promises = imageUrls.map(async (imageUrl, index) => {
            const image = this.images().add();
            image.setTitle(`image ${index + 1}`);
            image.setUrl(SvProxyServers.shared().defaultServer().proxyUrlForUrl(imageUrl));
            image.setBearerToken(authToken);
            image.setDelegate(this);
            return image.fetch();
        });
        await Promise.all(promises);
    }

    schedulePoll () {
        this.setPollAttempts(this.pollAttempts() + 1);

        if (this.pollAttempts() >= this.maxPollAttempts()) {
            this.setStatus("timeout");
            this.failWithError(new Error("Krea job timed out after " + this.maxPollAttempts() + " attempts"));
            return;
        }

        const timeoutId = setTimeout(() => this.pollJobStatus(), this.pollInterval());
        this.setPollTimeoutId(timeoutId);
    }

    shutdown () {
        this.stopPolling();
        this.images().subnodes().forEach(image => image.shutdown());
        return this;
    }

    didUpdateSlotStatus (oldValue, newValue) {
        this.shareProgress(newValue);
    }

}.initThisClass());

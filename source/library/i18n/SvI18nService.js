"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nService
 * @extends SvNode
 * @classdesc Handles batched translation requests using SvAiRequest.
 * Collects cache misses, debounces, then sends a single batched AI translation request.
 */

(class SvI18nService extends SvBaseNode {

    initPrototypeSlots () {

        /**
         * @member {Array} queue
         * @description Pending translation requests: [{text, context}, ...].
         */
        {
            const slot = this.newSlot("queue", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Number} debounceTimer
         * @description Timer ID for the debounce window.
         */
        {
            const slot = this.newSlot("debounceTimer", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(false);
        }

        /**
         * @member {Number} debounceMs
         * @description Milliseconds to wait before sending a batch.
         */
        {
            const slot = this.newSlot("debounceMs", 200);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {Number} maxBatchSize
         * @description Maximum strings per translation request.
         */
        {
            const slot = this.newSlot("maxBatchSize", 50);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {Number} maxConcurrent
         * @description Maximum simultaneous translation requests.
         */
        {
            const slot = this.newSlot("maxConcurrent", 3);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {Number} activeRequests
         * @description Number of currently in-flight requests.
         */
        {
            const slot = this.newSlot("activeRequests", 0);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {String} systemPrompt
         * @description App-provided system prompt for translation context.
         */
        {
            const slot = this.newSlot("systemPrompt", "");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {SvAiChatModel} chatModel
         * @description Which AI model to use for translation.
         */
        {
            const slot = this.newSlot("chatModel", null);
            slot.setSlotType("SvAiChatModel");
        }
    }

    initPrototype () {
        this.setTitle("i18n Service");
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    init () {
        super.init();
        this.setQueue([]);
        return this;
    }

    subtitle () {
        return this.queuedCount() + " queued, " + this.activeRequests() + " active";
    }

    /**
     * @description Returns the total number of strings awaiting translation
     * (queued + in-flight).
     * @returns {Number}
     * @category Status
     */
    queuedCount () {
        return this.queue().length + this.activeRequests();
    }

    /**
     * @description Adds a string to the translation queue and starts the debounce timer.
     * @param {String} text - Source English text.
     * @param {String} context - Context category.
     * @returns {SvI18nService}
     * @category Queue
     */
    enqueue (text, context) {
        console.log("[i18n] enqueue: '" + text + "' (context: " + context + ", queue size: " + (this.queue().length + 1) + ")");
        this.queue().push({ text: text, context: context });

        if (!this.debounceTimer()) {
            const timer = setTimeout(() => {
                this.setDebounceTimer(null);
                this.flush();
            }, this.debounceMs());
            this.setDebounceTimer(timer);
        }

        return this;
    }

    /**
     * @description Flushes the queue, grouping by context and sending batched requests.
     * @returns {SvI18nService}
     * @category Queue
     */
    flush () {
        if (this.queue().length === 0) {
            return this;
        }

        if (this.activeRequests() >= this.maxConcurrent()) {
            // Re-schedule flush when a slot opens
            const timer = setTimeout(() => {
                this.setDebounceTimer(null);
                this.flush();
            }, this.debounceMs());
            this.setDebounceTimer(timer);
            return this;
        }

        const i18n = SvI18n.shared();
        const language = i18n.currentLanguage();

        // Group by context
        const groups = new Map();
        const items = this.queue().splice(0, this.maxBatchSize());

        items.forEach(item => {
            const ctx = item.context;
            if (!groups.has(ctx)) {
                groups.set(ctx, []);
            }
            groups.get(ctx).push(item.text);
        });

        // Send one request per context group
        groups.forEach((strings, context) => {
            this.sendBatch(strings, language, context);
        });

        // If items remain in the queue, schedule another flush
        if (this.queue().length > 0) {
            const timer = setTimeout(() => {
                this.setDebounceTimer(null);
                this.flush();
            }, this.debounceMs());
            this.setDebounceTimer(timer);
        }

        return this;
    }

    /**
     * @description Sends a batched translation request via SvAiRequest.
     * @param {Array} strings - Array of English strings to translate.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {SvI18nService}
     * @category Requests
     */
    sendBatch (strings, language, context) {
        let model = this.chatModel();

        // Lazy model resolution — SvServices may not be ready at setup time
        if (!model && typeof SvServices !== "undefined") {
            model = SvServices.shared().defaultChatModel();
            if (model) {
                this.setChatModel(model);
            }
        }

        if (!model) {
            console.warn("[i18n] No chatModel available — skipping translation batch");
            return this;
        }

        console.log("[i18n] sendBatch: " + strings.length + " strings to " + language + " (context: " + context + ", model: " + model.modelName() + ")");
        console.log("[i18n]   strings:", strings);

        // Build the translation prompt
        const jsonTemplate = {};
        strings.forEach(s => { jsonTemplate[s] = ""; });

        const userPrompt = "Translate to " + language + ". Context: " + context + " strings.\n" +
            "Return ONLY valid JSON mapping English → translation. No explanation.\n\n" +
            JSON.stringify(jsonTemplate, null, 2);

        const messages = [];
        if (this.systemPrompt()) {
            messages.push({ role: "system", content: this.systemPrompt() });
        }
        messages.push({ role: "user", content: userPrompt });

        // Build bodyJson for SvAiRequest
        const bodyJson = {
            model: model.modelName(),
            messages: messages,
            temperature: 0.1,
            max_tokens: 4096
        };

        const request = model.newChatRequest();
        request.setBodyJson(bodyJson);
        request.setDelegate(this);
        request.setIsStreaming(false);

        // Store context on the request for the callback
        request._i18nContext = context;
        request._i18nLanguage = language;
        request._i18nStrings = strings;

        this.setActiveRequests(this.activeRequests() + 1);
        request.asyncSendAndStreamResponse();

        return this;
    }

    // --- SvAiRequest delegate protocol ---

    /**
     * @description Called when the AI request completes successfully.
     * @param {SvAiRequest} request - The completed request.
     * @category Delegate
     */
    onRequestComplete (request) {
        this.setActiveRequests(Math.max(0, this.activeRequests() - 1));

        const content = request.fullContent();
        //const context = request._i18nContext;
        const language = request._i18nLanguage;

        try {
            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = content.trim();
            if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
            }

            const translations = JSON.parse(jsonStr);
            const i18n = SvI18n.shared();
            const cache = i18n.cache();
            const store = i18n.store();
            const translatedKeys = [];

            Object.keys(translations).forEach(sourceText => {
                const translation = translations[sourceText];
                if (translation && translation.length > 0) {
                    // Store in cache (strong refs, survives GC) and store (IndexedDB persist)
                    cache.store(sourceText, translation);
                    store.storeSync(sourceText, translation);
                    translatedKeys.push(i18n.keyFor(sourceText, language));
                    console.log("[i18n] result: '" + sourceText + "' → '" + translation + "'");
                }
            });

            console.log("[i18n] batch complete: " + translatedKeys.length + " translations stored");

            // Resolve promises for the translated keys
            i18n.resolveTranslations(translatedKeys);
            i18n.didUpdateNode();

        } catch (e) {
            console.warn("[i18n] Failed to parse translation response:", e.message);
            console.warn("[i18n] Raw response:", content);
        }
    }

    /**
     * @description Called when the AI request encounters an error.
     * @param {SvAiRequest} request - The failed request.
     * @param {Error} error - The error.
     * @category Delegate
     */
    onRequestError (request, error) {
        this.setActiveRequests(Math.max(0, this.activeRequests() - 1));
        console.warn("[i18n] Translation request FAILED:", error);

        // Remove pending keys so they can be retried later
        const language = request._i18nLanguage;
        const strings = request._i18nStrings;
        const i18n = SvI18n.shared();
        const failedKeys = [];

        if (strings) {
            strings.forEach(text => {
                const key = i18n.keyFor(text, language);
                failedKeys.push(key);
            });
        }

        // Reject promises for the failed keys
        i18n.rejectTranslations(failedKeys, error);
        i18n.didUpdateNode();
    }

    /**
     * @description No-op delegate methods for SvAiRequest protocol.
     * @category Delegate
     */
    onRequestBegin (/*request*/) {}
    onStreamStart (/*request*/) {}
    onStreamData (/*request, newContent*/) {}
    onStreamEnd (/*request*/) {}

}).initThisClass();

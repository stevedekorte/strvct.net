"use strict";

/**
 * @module library.services.Krea.Text_to_Image
 */

/**
 * @class SvKreaImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents a Krea 2 image generation request.
 *
 * Krea 2's distinguishing feature, and the reason this class exists, is that a
 * single request carries BOTH:
 *   - `styles`                 — our custom trained style (LoRA) by id
 *   - `image_style_references` — up to 10 reference images
 * so a scene can hold a trained art look AND per-subject visual continuity.
 *
 * BILLING (see Servers/Firebase/functions/src/services/KreaService.js): Krea
 * charges a flat price per request chosen by a tier — text-to-image, style
 * references, or moodboards — and one request yields exactly one image (there is
 * no num_images parameter). A `styles` entry does NOT raise the tier, so running
 * our own trained style is free; attaching reference images does raise it.
 *
 * This class implements the duck-typed interface UoImageMessage calls on an
 * image prompt: setPrompt/setAspectRatio/aspectRatio/extraImagesNode/generate/
 * error/status/resultImageNode/asyncFirstResultImageNode/generations/shutdown.
 * It deliberately has NO setVersion — UoImageMessage guards on that to detect
 * Midjourney-only prompts.
 */

(class SvKreaImagePrompt extends SvSummaryNode {

    static initClass () {
        super.initClass();

        // Aspect ratios Krea accepts, as [label, value] with the numeric ratio
        // derived rather than restated (one source of truth for coercion).
        this.newClassSlot("supportedAspectRatios", ["1:1", "4:3", "3:2", "16:9", "2.35:1", "4:5", "2:3", "9:16"]);
    }

    initPrototypeSlots () {

        /**
         * @member {string} prompt
         * @description The prompt text for image generation.
         * @category Input
         */
        {
            const slot = this.newSlot("prompt", "");
            slot.setInspectorPath("");
            slot.setAllowsNullValue(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {string} promptSuffix
         * @description Extra text appended to the prompt.
         * @category Configuration
         */
        {
            const slot = this.newSlot("promptSuffix", "");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setLabel("Prompt Suffix");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanEditInspection(true);
            slot.setDescription("Additional text appended to the prompt");
        }

        /**
         * @member {string} fullPrompt
         * @description The composed prompt actually sent, kept for inspection.
         * @category Input
         */
        {
            const slot = this.newSlot("fullPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Full Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // --- settings ---

        /**
         * @member {string} model
         * @description Which Krea 2 tier to generate with. Selectable in the
         * inspector so tiers can be compared on real generations; the labels
         * carry the text-to-image price so the choice is informed. Prices rise
         * by one step when reference images are attached.
         * @category Configuration
         */
        {
            const validItems = [
                { value: "krea-2/medium-turbo", label: "Krea 2 Medium Turbo ($0.015)" },
                { value: "krea-2/medium", label: "Krea 2 Medium ($0.03)" },
                { value: "krea-2/large", label: "Krea 2 Large ($0.06)" }
            ];
            // Default to medium-turbo: cheapest tier ($0.015 text-to-image,
            // $0.0175 with reference images) and fast, which is what we want
            // while iterating. NOTE: a style trained with Krea's `k2` base is
            // documented against Krea 2 MEDIUM; whether such a style also
            // applies to this distilled turbo checkpoint is unverified. Revisit
            // this default once a trained style exists.
            const slot = this.newSlot("model", "krea-2/medium-turbo");
            slot.setInspectorPath("Settings");
            slot.setLabel("Model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} aspectRatio
         * @description Aspect ratio of the generated image. Krea accepts a fixed
         * enum, so setAspectRatio() coerces an arbitrary request to the nearest
         * supported value (see coercedAspectRatio) and this slot always holds a
         * value Krea will accept.
         * @category Configuration
         */
        {
            const validItems = [
                { value: "1:1", label: "1:1" },
                { value: "4:3", label: "4:3" },
                { value: "3:2", label: "3:2" },
                { value: "16:9", label: "16:9" },
                { value: "2.35:1", label: "2.35:1" },
                { value: "4:5", label: "4:5" },
                { value: "2:3", label: "2:3" },
                { value: "9:16", label: "9:16" }
            ];
            const slot = this.newSlot("aspectRatio", "3:2");
            slot.setInspectorPath("Settings");
            slot.setLabel("Aspect Ratio");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidItems(validItems);
            // PERMISSIVE ON PURPOSE. Callers set ratios Krea doesn't offer (the
            // app's standard scene ratio is 5:3), and didUpdateSlotAspectRatio()
            // coerces them to the nearest supported value. Without this flag the
            // slot's own validation would reject 5:3 and silently substitute the
            // slot's initValue ("1:1") BEFORE the coercion hook ever sees it —
            // a wrong-shaped image, not merely a warning.
            slot.setValidValuesArePermissive(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} resolution
         * @description Resolution scale. Krea currently documents only "1K".
         * @category Configuration
         */
        {
            const slot = this.newSlot("resolution", "1K");
            slot.setInspectorPath("Settings");
            slot.setLabel("Resolution");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("String");
            slot.setValidValues(["1K"]);
            slot.setValidValuesArePermissive(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} creativity
         * @description Prompt-expansion mode. "raw" disables expansion, which is
         * what we want when the prompt is already composed by the GM — an LLM
         * rewriting it would fight our own prompt engineering.
         * @category Configuration
         */
        {
            const validItems = [
                { value: "raw", label: "raw (no prompt expansion)" },
                { value: "low", label: "low (Krea default)" },
                { value: "medium", label: "medium" },
                { value: "high", label: "high" }
            ];
            const slot = this.newSlot("creativity", "raw");
            slot.setInspectorPath("Settings");
            slot.setLabel("Creativity");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} styleId
         * @description Id of a Krea trained style (LoRA) to apply. Empty means
         * send no `styles` entry at all. Trained styles are private to the API
         * key that created them, so this id is useless to a third party.
         * @category Configuration
         */
        {
            const slot = this.newSlot("styleId", "");
            slot.setInspectorPath("Settings");
            slot.setLabel("Style Id");
            slot.setAllowsNullValue(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Krea trained style (LoRA) id. Empty = no style. Costs nothing extra.");
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {number} styleStrength
         * @description How strongly the trained style applies (-2..2, 1 = full).
         * @category Configuration
         */
        {
            const validItems = [
                { value: 0, label: "0 (No influence)" },
                { value: 0.25, label: "0.25" },
                { value: 0.5, label: "0.5" },
                { value: 0.75, label: "0.75" },
                { value: 1, label: "1 (Default)" },
                { value: 1.25, label: "1.25" },
                { value: 1.5, label: "1.5" },
                { value: 2, label: "2 (Maximum)" }
            ];
            // 0.8 is Krea's own recommended starting point: their guidance puts
            // 0.95-1.0 at "maximum style adherence, may reduce prompt
            // responsiveness", which fights the detailed scene descriptions we
            // send. 0.8-0.9 is "strong style application, recommended".
            const slot = this.newSlot("styleStrength", 0.8);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Style Strength");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setValidValuesArePermissive(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {SvImagesNode} extraImagesNode
         * @description Reference images, sent as `image_style_references`. Krea
         * accepts up to 10; see referenceImageLimit(). Attaching any of these
         * moves the request to the more expensive style-references tier.
         * @category Configuration
         */
        {
            const slot = this.newSlot("extraImagesNode", null);
            slot.setInspectorPath("Settings");
            slot.setFinalInitProto("SvImagesNode");
            slot.setLabel("Reference Images");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Krea calls these 'image style references' (max 10).");
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {number} referenceStrength
         * @description How strongly each reference image influences the result
         * (0..1, Krea's default 0.5). Applied to every reference.
         * @category Configuration
         */
        {
            const validItems = [
                { value: 0, label: "0 (No influence)" },
                { value: 0.25, label: "0.25" },
                { value: 0.4, label: "0.4" },
                { value: 0.5, label: "0.5 (Default)" },
                { value: 0.6, label: "0.6" },
                { value: 0.75, label: "0.75" },
                { value: 1, label: "1 (Maximum)" }
            ];
            const slot = this.newSlot("referenceStrength", 0.5);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Reference Strength");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setValidValuesArePermissive(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {number} seed
         * @description Random seed, for reproducible generations.
         * @category Configuration
         */
        {
            const slot = this.newSlot("seed", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Seed");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {SvXhrRequest} xhrRequest
         * @description The submit request, kept for debugging.
         * @category Request
         */
        {
            const slot = this.newSlot("xhrRequest", null);
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("xhr request");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setFinalInitProto(SvXhrRequest);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // --- generation ---

        /**
         * @member {Error} error
         * @category Status
         */
        {
            const slot = this.newSlot("error", null);
            slot.setAllowsNullValue(true);
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Error");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key value");
        }

        /**
         * @member {string} status
         * @category Status
         */
        {
            const slot = this.newSlot("status", "");
            slot.setLabel("Status");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key value");
        }

        /**
         * @member {SvKreaImageGenerations} generations
         * @description Submitted jobs, each polling for its own completion.
         * @category Output
         */
        {
            const slot = this.newSlot("generations", null);
            slot.setFinalInitProto(SvKreaImageGenerations);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("SvKreaImageGenerations");
        }

        /**
         * @member {SvImageNode} resultImageNode
         * @description The generated image. Transient: consumers copy the blob
         * out (UoImageMessage hands it to its own imageNode), so persisting it
         * would duplicate the bytes.
         * @category Output
         */
        {
            const slot = this.newSlot("resultImageNode", null);
            slot.setSlotType("SvImageNode");
            slot.setLabel("Result Image");
            slot.setIsSubnodeField(true);
            slot.setAllowsNullValue(true); // starts null, and clear() resets it to null
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setFieldInspectorClassName("SvImageWellField");
            slot.setCanEditInspection(false);
        }

        /**
         * @member {Object} delegate
         * @category Delegation
         */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {Action} newSeedAction
         * @category Action
         */
        {
            const slot = this.newSlot("newSeedAction", null);
            slot.setInspectorPath("");
            slot.setLabel("New Seed");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("newSeed");
        }

        /**
         * @member {Action} generateAction
         * @category Action
         */
        {
            const slot = this.newSlot("generateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Generate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
        }

        /**
         * @member {Action} clearAction
         * @category Action
         */
        {
            const slot = this.newSlot("clearAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("clear");
        }

        {
            const slot = this.newSlot("completionPromise", null);
            slot.setSlotType("Promise");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setCanDelete(true);
        this.extraImagesNode().setTitle("Reference Images");
        if (this.seed() === null) {
            this.pickRandomSeed();
        }

        // Re-establish delegate relationships after cloud deserialization
        // (delegates are excluded from cloud JSON to avoid circular references).
        this.generations().subnodes().forEach(gen => {
            gen.setDelegate(this);
        });
    }

    title () {
        const p = this.prompt().clipWithEllipsis(15);
        return p ? p : "Image Prompt";
    }

    subtitle () {
        return this.status();
    }

    /**
     * @description The Krea service singleton.
     * @returns {SvKreaService}
     * @category Service
     */
    service () {
        return SvKreaService.shared();
    }

    imagePrompts () {
        return this.parentNode();
    }

    appendStatus (status) {
        this.setStatus(this.status() + "\n" + status);
        this.shareProgress(status);
        return this;
    }

    onDescendantProgress (descendant, status) {
        this.appendStatus(status);
    }

    pickRandomSeed () {
        this.setSeed(Number.randomUint32());
    }

    newSeed () {
        this.pickRandomSeed();
    }

    // --- aspect ratio coercion ---

    /**
     * @description Parses an "w:h" ratio string into a number.
     * @param {string} s - A ratio such as "16:9" or "2.35:1".
     * @returns {number|null} The numeric ratio, or null if unparseable.
     * @category Configuration
     */
    numericAspectRatio (s) {
        const parts = String(s).split(":");
        if (parts.length !== 2) {
            return null;
        }
        const w = parseFloat(parts[0]);
        const h = parseFloat(parts[1]);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
            return null;
        }
        return w / h;
    }

    /**
     * @description Maps an arbitrary aspect ratio to the nearest one Krea
     * accepts. Distance is measured on the LOG of the ratio, which is the
     * scale-invariant comparison for ratios (so 3:2 vs 16:9 is judged by
     * proportional, not absolute, difference). Krea natively offers 3:2, which
     * is what the app asks for, so the common path coerces nothing; a request
     * for e.g. 5:3 would resolve to 16:9.
     * @param {string} requested - The desired ratio.
     * @param {string} fallback - Ratio to use when `requested` is unparseable.
     *   Callers pass the value being replaced; it is itself validated, so a
     *   nonsense fallback can't slip through either.
     * @returns {string} A ratio from supportedAspectRatios().
     * @category Configuration
     */
    coercedAspectRatio (requested, fallback) {
        const supported = this.thisClass().supportedAspectRatios();
        if (supported.includes(requested)) {
            return requested;
        }
        const target = this.numericAspectRatio(requested);
        if (target === null) {
            // Unparseable. Do NOT read the slot back here: the generated setter
            // has already stored `requested`, so the slot would hand us the bad
            // value and we would "coerce" it to itself — leaving a ratio Krea
            // rejects. Fall back to the outgoing value, or the default.
            // Last resort when the outgoing value is unusable too. Keep this in
            // sync with the aspectRatio slot's default.
            return supported.includes(fallback) ? fallback : "3:2";
        }
        let best = supported.first();
        let bestDistance = Infinity;
        supported.forEach(candidate => {
            const value = this.numericAspectRatio(candidate);
            const distance = Math.abs(Math.log(value) - Math.log(target));
            if (distance < bestDistance) {
                bestDistance = distance;
                best = candidate;
            }
        });
        return best;
    }

    /**
     * @description Coerces an out-of-enum aspect ratio to the nearest supported
     * one, right after it is set.
     *
     * WHY A didUpdateSlot HOOK AND NOT A setAspectRatio() OVERRIDE: slots
     * generate their own accessors and install them onto the prototype AFTER the
     * class body is evaluated, so a class-body method named setAspectRatio()
     * would be silently overwritten by the generated setter and never run. The
     * update hook is the supported interception point.
     *
     * Terminates in one extra write: the re-set value is in the supported list,
     * so the second pass through this hook is a no-op.
     * @param {string} oldValue - The previous ratio.
     * @param {string} newValue - The ratio just assigned.
     * @category Configuration
     */
    didUpdateSlotAspectRatio (oldValue, newValue) {
        const coerced = this.coercedAspectRatio(newValue, oldValue);
        if (coerced !== newValue) {
            console.log(this.logPrefix(), "coerced aspect ratio", newValue, "->", coerced);
            this.setAspectRatio(coerced);
        }
    }

    // --- request composition ---

    /**
     * @description Krea accepts at most 10 style references.
     * @returns {number}
     * @category Configuration
     */
    referenceImageLimit () {
        return 10;
    }

    trimmedPromptSuffix () {
        return this.promptSuffix().trim();
    }

    composeFullPrompt () {
        const parts = [this.prompt().trim(), this.trimmedPromptSuffix()];
        const fullPrompt = parts.filter(s => s.length > 0).join(" ");
        this.setFullPrompt(fullPrompt);
        return fullPrompt;
    }

    /**
     * @description Validates that a URL is publicly reachable by Krea's servers.
     * @param {string} url - The URL to check.
     * @param {string} context - What the URL is for, for the error message.
     * @category Validation
     */
    assertPublicUrl (url, context) {
        if (!url) {
            return;
        }
        let parsed = null;
        try {
            parsed = new URL(url);
        } catch {
            throw new Error(context + " is not a valid URL: " + url);
        }
        const hostname = parsed.hostname;
        const isLocal = hostname === "localhost"
            || hostname === "127.0.0.1"
            || hostname === "0.0.0.0"
            || hostname.startsWith("192.168.")
            || hostname.startsWith("10.");
        if (isLocal) {
            throw new Error(context + " URL is not publicly accessible: " + url);
        }
    }

    /**
     * @description Builds the `image_style_references` array from the reference
     * images, resolving each to a public URL.
     * @returns {Promise<Array<Object>>}
     * @category Request
     */
    async asyncComposeStyleReferences () {
        const nodes = this.extraImagesNode().subnodes().slice(0, this.referenceImageLimit());
        const strength = this.referenceStrength();
        return await nodes.promiseParallelMap(async svImageNode => {
            const url = await svImageNode.asyncPublicUrl();
            this.assertPublicUrl(url, "Reference image");
            return { url: url, strength: strength };
        });
    }

    /**
     * @description Builds the `styles` array from the configured trained style.
     * Empty when no style id is set.
     * @returns {Array<Object>}
     * @category Request
     */
    composeStyles () {
        const id = this.styleId().trim();
        if (id.length === 0) {
            return [];
        }
        return [{ id: id, strength: this.styleStrength() }];
    }

    /**
     * @description Builds the full Krea request body. Feature arrays are omitted
     * when empty rather than sent as [] — the backend's billing tier is derived
     * from these fields, and an empty array must not read as "used".
     * @returns {Promise<Object>}
     * @category Request
     */
    async asyncComposeRequestBody () {
        const body = {
            prompt: this.composeFullPrompt(),
            aspect_ratio: this.aspectRatio(),
            resolution: this.resolution(),
            creativity: this.creativity()
        };

        if (this.seed() !== null) {
            body.seed = this.seed();
        }

        const styles = this.composeStyles();
        if (styles.length > 0) {
            body.styles = styles;
        }

        const references = await this.asyncComposeStyleReferences();
        if (references.length > 0) {
            body.image_style_references = references;
        }

        return body;
    }

    /**
     * @description The generation endpoint for the selected model.
     * @returns {string}
     * @category Request
     */
    generateEndpoint () {
        return SvKreaService.endpointBase() + "generate/image/krea/" + this.model();
    }

    // --- generation ---

    canGenerate () {
        return this.prompt().length !== 0;
    }

    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    /**
     * @description Runs a generation to completion.
     * @category Action
     */
    async generate () {
        await this.start();
        this.onPromptEnd();
    }

    /**
     * @description Submits the job and awaits its completion.
     * @category Process
     */
    async start () {
        performance.mark("krea-generation-start");

        this.setCompletionPromise(Promise.clone());
        this.setError(null);
        this.setStatus("submitting job...");
        this.notifyOwners("onImagePromptStart", [this]);

        try {
            const bodyJson = await this.asyncComposeRequestBody();
            console.log(this.logPrefix(), "image prompt:", bodyJson.prompt);
            const jobId = await this.asyncSubmitJob(bodyJson);
            await this.addGenerationForJobId(jobId, bodyJson.prompt);
            await this.asyncCollectResultImage();
        } catch (error) {
            this.setError(error);
            this.setStatus("Error: " + error.message);
            throw error;
        } finally {
            performance.mark("krea-generation-end");
            performance.measure("krea-generation", "krea-generation-start", "krea-generation-end");
        }
    }

    /**
     * @description POSTs the generation request through the proxy and returns
     * the job id.
     *
     * IMPORTANT: always via the proxy — for accounting (usage is billed to the
     * player), authentication (the Krea key stays server-side), and CORS.
     * @param {Object} bodyJson - The composed request body.
     * @returns {Promise<string>} The job id.
     * @category Process
     */
    async asyncSubmitJob (bodyJson) {
        const apiKey = await this.service().apiKeyOrUserAuthToken();
        const proxyEndpoint = SvProxyServers.shared().defaultServer().proxyUrlForUrl(this.generateEndpoint());

        const request = SvXhrRequest.clone();
        request.setDelegate(this);
        request.setUrl(proxyEndpoint);
        request.setMethod("POST");
        request.setHeaders({
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        });
        request.setBody(JSON.stringify(bodyJson));
        this.setXhrRequest(request);

        await request.asyncSend();

        if (request.hasError()) {
            throw request.error();
        }

        const responseJson = this.parsedResponseJson(request);
        const jobId = responseJson.job_id;
        if (!jobId) {
            throw new Error(this.logPrefix() + " no job_id returned from Krea");
        }
        return jobId;
    }

    /**
     * @description Parses a JSON response, reporting the raw body on failure so
     * an HTML error page doesn't surface as an opaque syntax error.
     * @param {SvXhrRequest} request - The completed request.
     * @returns {Object}
     * @category Process
     */
    parsedResponseJson (request) {
        try {
            return JSON.parse(request.responseText());
        } catch (error) {
            throw new Error(this.logPrefix() + " (" + error.message + ") response is not valid JSON: " + request.responseText());
        }
    }

    /**
     * @description Adds a generation for the job and waits for it to finish.
     * @param {string} jobId - The Krea job id.
     * @param {string} fullPrompt - The prompt sent, for the record.
     * @category Process
     */
    async addGenerationForJobId (jobId, fullPrompt) {
        this.setStatus("job submitted, awaiting completion...");
        const generation = this.generations().add();
        generation.setPromptNote(fullPrompt);
        generation.setJobId(jobId);
        generation.setDelegate(this);
        await generation.asyncStartPolling();
    }

    /**
     * @description Fetches the finished image's bytes and publishes it on
     * resultImageNode, which is what consumers read.
     * @category Results
     */
    async asyncCollectResultImage () {
        this.setStatus("fetching image...");
        const node = await this.asyncFirstResultImageNode();
        if (!node) {
            throw new Error(this.logPrefix() + " generation completed with no image");
        }
        this.setResultImageNode(node);
        this.setStatus("completed");
    }

    onPromptEnd () {
        this.notifyOwners("onImagePromptEnd", [this]);
    }

    // --- results ---

    allResultImages () {
        return this.generations().subnodes().map(generation => generation.images().subnodes()).flat();
    }

    /**
     * @description Fetches the file's bytes if needed and returns its image node.
     *
     * Deliberately sets NO referer. The Midjourney path sends one because its
     * CDN wants it; for Krea it would be useless twice over — `Referer` is a
     * browser-forbidden header that XHR silently drops, and were it not
     * forbidden, adding a non-simple header would force a CORS preflight on a
     * request that is already CORS-sensitive. The URL and auth are set up by
     * SvKreaImageGeneration.downloadImageUrls().
     *
     * @param {SvFileToDownload} fileToDownload - The result file.
     * @returns {Promise<SvImageNode>}
     * @category Results
     */
    async asyncImageNodeForResultFile (fileToDownload) {
        await fileToDownload.asyncFetchIfNeeded();
        return fileToDownload.imageNode();
    }

    /**
     * @description The first available result image, fetching bytes if needed.
     * Used both for the final result and for the early preview hook.
     * @returns {Promise<SvImageNode|null>}
     * @category Results
     */
    async asyncFirstResultImageNode () {
        const fileToDownload = this.allResultImages().first();
        if (!fileToDownload) {
            return null;
        }
        return await this.asyncImageNodeForResultFile(fileToDownload);
    }

    async asyncAllResultImageNodes () {
        const imageNodes = [];
        for (const fileToDownload of this.allResultImages()) {
            imageNodes.push(await this.asyncImageNodeForResultFile(fileToDownload));
        }
        return imageNodes;
    }

    /**
     * @description Data-URL fallback for consumers that don't use
     * resultImageNode().
     * @returns {Promise<string|null>}
     * @category Results
     */
    async resultImageUrlData () {
        const fileToDownload = this.allResultImages().last();
        if (fileToDownload) {
            return await fileToDownload.asyncDataUrl();
        }
        return null;
    }

    // --- SvXhrRequest delegate ---

    onRequestProgress (request) {
        this.setStatus(`uploading: ${request.contentByteCount()} bytes`);
    }

    // --- generation delegate ---

    /**
     * @description Best-effort early preview: Krea reports an
     * `intermediate-complete` status, and when that arrives with image urls we
     * surface the partial image so the reserved frame shows something before the
     * final result. Absent intermediates, nothing fires and behavior is
     * unchanged.
     * @param {SvKreaImageGeneration} generation - The reporting generation.
     * @category Progressive Loading
     */
    onImageGenerationIntermediate (generation) {
        this.notifyOwners("onImagePromptFirstImages", [this]);
    }

    // --- lifecycle ---

    shutdown (visited = new Set()) {
        this.nodeShutdown(visited);
        return this;
    }

    clear () {
        this.setStatus("");
        this.setError(null);
        this.shutdown();
        this.generations().removeAllSubnodes();
        this.setResultImageNode(null);
    }

}.initThisClass());

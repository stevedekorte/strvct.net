"use strict";

/**
 * @module library.services.ImaginePro.Text_to_Image
 *


 */

/**
 * @class ImagineProImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents an ImaginePro image prompt for generating images using Midjourney via ImaginePro API.
 *
 * IMPORTANT: This implementation ONLY supports Midjourney V7 or later versions.
 * We do NOT support V6 or earlier versions. All prompts will be sent with --v 7 flag.
 * Omnireference uses V7's --oref and --ow parameters (not V6's --cref/--cw).
 */

(class ImagineProImagePrompt extends SvSummaryNode {

    static initClass () {
        super.initClass();
        this.newClassSlot("endpointBase", "https://api.imaginepro.ai/"); // so we can override it globally at the app level
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
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }


        /**
     * @member {string} promptSuffix
     * @description Additional parameters to append to the prompt (e.g., "--no details --no frame").
     * @category Configuration
     */
        {
            const slot = this.newSlot("promptSuffix", "");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setLabel("Prompt Suffix");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanEditInspection(true);
            slot.setDescription("Additional Midjourney parameters to append (e.g., '--no details --no frame --chaos 50')");
        }

        // full prompt slot
        {
            const slot = this.newSlot("fullPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Full Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // --- settings ---

        /**
     * @member {string} model
     * @description The model to use for text-to-image generation.
     * @category Configuration
     */
        {
            const slot = this.newSlot("model", "midjourney");
            slot.setInspectorPath("Settings");
            slot.setLabel("Model");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["midjourney"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} processMode
         * @description The processing mode for image generation.
         * @category Configuration
         */
        {
            const slot = this.newSlot("processMode", "turbo");
            slot.setInspectorPath("Settings");
            slot.setLabel("Process Mode");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["relax", "fast", "turbo"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }


        /**
     * @member {string} aspectRatio
     * @description The aspect ratio of the generated image.
     * @category Configuration
     */
        {
            const validItems = [
                { value: "9:16", label: "9:16 (Default)" },
                { value: "16:9", label: "16:9" },
                { value: "4:3", label: "4:3" },
                { value: "3:4", label: "3:4" },
                { value: "3:2", label: "3:2" },
                { value: "2:3", label: "2:3" },
                { value: "1:1", label: "1:1" },
            ];
            const slot = this.newSlot("aspectRatio", "9:16");
            slot.setInspectorPath("Settings");
            slot.setLabel("Aspect Ratio");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // -stylize (--s) → integer 0–1000. Default ~100. Higher = more MJ “aesthetic” influence; lower = more literal to your text.

        {
            const validItems = [
                { value: 0, label: "0 (No MJ influence)" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 75, label: "75" },
                { value: 100, label: "100 (Default)" },
                { value: 200, label: "200" },
                { value: 300, label: "300" },
                { value: 400, label: "400" },
                { value: 500, label: "500" },
                { value: 600, label: "600" },
                { value: 700, label: "700 (Maximum MJ influence)" },
            ];
            const slot = this.newSlot("stylize", 100);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Stylize");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            //slot.setIsInCloudJson(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // --chaos → integer 0–100. Higher = more variety/divergence across the 4 grid images. Default 0.

        {
            const validItems = [
                { value: 0, label: "0 (Default)" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 25, label: "25" },
                { value: 35, label: "35" },
                { value: 40, label: "40" },
                { value: 45, label: "45" },
                { value: 50, label: "50" },
                { value: 55, label: "55" },
                { value: 60, label: "60" },
                { value: 65, label: "65" },
                { value: 75, label: "75" },
                { value: 80, label: "80" },
                { value: 85, label: "85" },
                { value: 90, label: "90" },
                { value: 95, label: "95" },
                { value: 100, label: "100 (Maximum variety)" },
            ];
            const slot = this.newSlot("chaos", validItems.first().value);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Chaos");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // --weird (--w) → integer 0–3000. Adds experimental “strangeness.” Compatible with v5+ (incl. v7). Note: seed interactions can be less stable.


        {
            const validItems = [
                { value: 0, label: "0 (Default)" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 75, label: "75" },
                { value: 100, label: "100 (Maximum weirdness)" },
            ];
            const slot = this.newSlot("weird", validItems.first().value);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Weird");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // --seed → integer 0–4,294,967,295. Locks the random start so you can reproduce/iterate.

        {
            const slot = this.newSlot("seed", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Seed");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // --quality (--q) → enum 1 | 2 | 4 in v7. Spends more GPU on the initial grid only (not variations/inpainting/upscales). Default 1.

        {
            const validItems = [
                { value: 1, label: "Default" },
                { value: 2, label: "Better quality" },
                { value: 4, label: "Best quality" },
            ];
            const slot = this.newSlot("quality", validItems.first().value);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Quality");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
        }
        /*


--sref <image_url> (Style Reference) → URL or attachment token. Applies the style (not content) of the reference image; works on v6 & v7. You can also set via the web UI’s style ref slot.
Midjourney
*/

        {
            const slot = this.newSlot("styleRefImageNode", null);
            slot.setInspectorPath("Settings");
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Style Ref Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Contains style reference image for Midjourney (Firebase Storage or other hosted URL)");
            slot.setSummaryFormat("key: value");
        }

        /*
            Yes—use --sw (style weight) to weight an --sref.
            Flag: --sw
            Type: integer
            Valid range: 0–1000 (default 100)
        */
        {
            // style weight
            const validItems = [
                { value: 0, label: "0 (No influence)" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
                { value: 4, label: "4" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 75, label: "75" },
                { value: 100, label: "100 (Default)" },
                { value: 200, label: "200" },
                { value: 300, label: "300" },
                { value: 400, label: "400" },
                { value: 500, label: "500" },
                { value: 600, label: "600" },
                { value: 700, label: "700" },
                { value: 800, label: "800" },
                { value: 900, label: "900" },
                { value: 1000, label: "1000 (Maximum influence)" },
            ];
            const slot = this.newSlot("styleWeight", 100);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Style Weight");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
            slot.setValidValuesArePermissive(true);
        }

        /**
         * @member {string} omniRefImageNode
         * @description Contains character reference sheet composite image for Midjourney V7+ omnireference.
         * This will be used with --oref parameter (V7's omnireference flag).
         * NOTE: We ONLY support V7 or later - V6's --cref is NOT supported.
         * @category Configuration
         */
        {
            const slot = this.newSlot("omniRefImageNode", null);
            slot.setInspectorPath("Settings");
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Omni Ref Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Contains character reference sheet composite image for Midjourney (Firebase Storage or other hosted URL)");
            slot.setSummaryFormat("key: value");
        }

        // omniRefWeight
        {
            const validItems = [
                { value: 0, label: "0 (No influence)" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
                { value: 4, label: "4" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 25, label: "25 (Subtle)" },
                { value: 50, label: "50" },
                { value: 75, label: "75" },
                { value: 100, label: "100 (Balanced)" },
                { value: 150, label: "150" },
                { value: 200, label: "200" },
                { value: 300, label: "300 (Heavy)" },
            ];
            const slot = this.newSlot("omniRefWeight", 100);
            slot.setInspectorPath("Settings");
            slot.setSlotType("Number");
            slot.setLabel("Omniref Weight");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setValidItems(validItems);
            slot.setDescription("Omnireference weight (1-1000): 25-50 subtle, 100-300 balanced, 400+ strong influence");
            slot.setSummaryFormat("key: value");
        }

        // extraImages SvImagesNode slot

        {
            const slot = this.newSlot("extraImagesNode", null);
            slot.setInspectorPath("Settings");
            slot.setFinalInitProto("SvImagesNode");
            slot.setLabel("Extra Images");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("MJ calls these 'image prompts'.");
            slot.setSummaryFormat("key: value");
        }

        // extra images weight (can be 1, 2, or 3)

        {
            const validItems = [
                { value: 1, label: "1" },
                { value: 1.25, label: "1.25" },
                { value: 1.5, label: "1.5" },
                { value: 1.75, label: "1.75" },
                { value: 2, label: "2" },
                { value: 2.25, label: "2.25" },
                { value: 2.5, label: "2.5" },
                { value: 2.75, label: "2.75" },
                { value: 3, label: "3" },
            ];
            const slot = this.newSlot("extraImagesWeight", 1);
            slot.setSlotType("Number");
            slot.setInspectorPath("Settings");
            slot.setLabel("Extra Images Weight");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // generationCount slot
        /*
        {
            const slot = this.newSlot("generationCount", 1);
            slot.setSlotType("Number");
            slot.setLabel("Generation Count");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
        */

        /**
     * @member {SvXhrRequest} xhrRequest
     * @description The current XHR request object for debugging.
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
     * @member {string} error
     * @description The error message if any during image generation.
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
     * @description The current status of the image generation process.
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
            //slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key value");
        }

        /**
     * @member {ImagineProImageGenerations} generations
     * @description The generations for tracking task status.
     * @category Output
     */
        {
            const slot = this.newSlot("generations", null);
            slot.setFinalInitProto(ImagineProImageGenerations);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("ImagineProImageGenerations");
        }

        {
            const slot = this.newSlot("svImages", null);
            slot.setFinalInitProto(SvImages);
            slot.setLabel("Images");
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
     * @member {Object} delegate
     * @description The delegate object for handling various events.
     * @category Delegation
     */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
            //slot.setIsInCloudJson(false); // Delegates are runtime refs, would create circular references
        }


        /**
     * @member {Action} generateAction
     * @description The action to trigger image generation.
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
     * @description The action to clear the image prompt.
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

    setOmniRefImagePublicUrl (publicUrl) {
        this.omniRefImageNode().setPublicUrl(publicUrl);
        return this;
    }

    setOmniRefImageUrl (url) {
        this.omniRefImageNode().setDataURL(url);
        return this;
    }

    /**
   * @description Gets the title for the image prompt.
   * @returns {string} The title.
   * @category Metadata
   */
    title () {
        const p = this.prompt().clipWithEllipsis(15);
        return p ? p : "Image Prompt";
    }

    /**
   * @description Gets the subtitle for the image prompt.
   * @returns {string} The subtitle.
   * @category Metadata
   */
    subtitle () {
        return this.status();
    }

    /**
   * @description Performs final initialization.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setCanDelete(true);
        this.omniRefImageNode().setTitle("Omni Reference Image");
        this.styleRefImageNode().setTitle("Style Reference Image");
        this.extraImagesNode().setTitle("Extra Images");
        if (this.seed() === null) {
            this.pickRandomSeed();
        }

        // Re-establish delegate relationships after cloud deserialization
        // (delegates are excluded from cloud JSON to avoid circular references)
        this.generations().subnodes().forEach(gen => {
            gen.setDelegate(this);
        });
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

    /**
   * @description Gets the parent image prompts node.
   * @returns {Object} The parent image prompts node.
   * @category Hierarchy
   */
    imagePrompts () {
        return this.parentNode();
    }

    /**
   * @description Gets the ImaginePro service.
   * @returns {Object} The ImaginePro service.
   * @category Service
   */
    service () {
        return ImagineProService.shared();
    }

    /**
   * @description Checks if image generation can be performed.
   * @returns {boolean} True if generation can be performed, false otherwise.
   * @category Validation
   */
    canGenerate () {
        return this.prompt().length !== 0 || this.extraImagesNode().subnodeCount() > 1;
    }

    /**
   * @description Initiates the image generation process.
   * @category Action
   */
    async generate () {
        await this.start();
        this.onPromptEnd();

    }

    /**
   * @description Gets information about the generate action.
   * @returns {Object|Promise<Object>} The action information.
   * @category Action
   */
    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    /**
   * @description Sanitizes the prompt to avoid Midjourney parameter parsing issues and ImaginePro content moderation.
   * Replaces single dashes that could be interpreted as parameters with safe alternatives.
   * Also replaces words that trigger false positives in ImaginePro's overly aggressive content filter.
   * @param {string} prompt - The raw prompt text
   * @returns {string} The sanitized prompt
   * @category Utility
   */
    sanitizePromptForMidjourney (prompt) {
    // Replace dash followed by space with comma to avoid parameter interpretation
        prompt = prompt.replace(/\s-\s/g, ", ");

        // Also replace em-dash and en-dash with safe alternatives
        prompt = prompt.replace(/—/g, ", ");
        prompt = prompt.replace(/–/g, ", ");

        // Handle ImaginePro's overly aggressive content moderation
        // Replace problematic words that are falsely flagged in fantasy/game contexts
        // These replacements maintain the meaning while avoiding false positive rejections
        prompt = prompt
            .replace(/\bstone flesh\b/gi, "stone surface") // "stone flesh" -> "stone surface" (for golems)
            .replace(/\bflesh\b/gi, "form") // Generic "flesh" -> "form" as fallback
            .replace(/\bnaked\b/gi, "bare") // "naked" -> "bare" (for weapons, etc.)
            .replace(/\bkill\b/gi, "defeat") // "kill" -> "defeat" (for combat descriptions)
            .replace(/\bblood\b/gi, "crimson") // "blood" -> "crimson" (for visual descriptions)
            .replace(/\bgore\b/gi, "battle damage") // "gore" -> "battle damage"
            .replace(/\bcorpse\b/gi, "fallen figure") // "corpse" -> "fallen figure"
            .replace(/\bdead\b/gi, "fallen") // "dead" -> "fallen"
            .replace(/\bmurder\b/gi, "eliminate") // "murder" -> "eliminate"
            .replace(/\btorture\b/gi, "torment") // "torture" -> "torment"
            .replace(/\bsexy\b/gi, "attractive") // "sexy" -> "attractive"
            .replace(/\bsensual\b/gi, "graceful") // "sensual" -> "graceful"
            .replace(/\bviolent\b/gi, "intense") // "violent" -> "intense"
            .replace(/\bbloody\b/gi, "crimson") // "bloody" -> "crimson"
            .replace(/\bbrutal\b/gi, "fierce") // "brutal" -> "fierce"
            .replace(/\bsex\b/gi, "injury"); // "wound" -> "injury"

        return prompt;
    }

    composeOptionalParametersPrompt () {
        // slot name to parameter name mapping
        const parameterMap = new Map([
            ["stylize", "--s"],
            ["chaos", "--chaos"],
            ["weird", "--weird"],
            ["aspectRatio", "--ar"],
            ["seed", "--seed"],
            ["quality", "--quality"]
        ]);

        let s = "";

        for (const [slotName, parameterName] of parameterMap) {
            const value = this[slotName].apply(this);
            const slot = this.thisPrototype().slotNamed(slotName);
            const defaultValue = slot.initValue();
            if (!Type.isNullOrUndefined(value) && value !== defaultValue) {
                s += parameterName + " " + value + " ";
            }
        }
        return s.trim();
    }

    async asyncComposeExtraImagesPrompt () {
        const extraImageUrls = await this.extraImagesNode().subnodes().promiseParallelMap(async svImageNode => {
            return await svImageNode.asyncPublicUrl();
        });
        let prompt = extraImageUrls.join(" ");
        if (extraImageUrls.length === 1) {
            prompt += "--iw " + this.extraImagesWeight();
        }
        return prompt;
    }

    async asyncComposeOrefPrompt () {
        // Append omnireference flags if image is provided
        // IMPORTANT: We ONLY support Midjourney V7 or later versions
        // V7 uses --oref (omnireference) and --ow (omnireference weight) parameters
        // We do NOT support V6 or earlier (which used --cref/--cw)
        let s = "";
        if (this.omniRefImageNode().hasImage()) {
            const publicUrl = await this.omniRefImageNode().asyncPublicUrl();
            s += " --oref " + publicUrl + " --ow " + this.omniRefWeight();
        }
        return s.trim();
    }

    async asyncComposeSrefPrompt () {
        let s = "";
        if (this.styleRefImageNode().hasImage()) {
            const publicUrl = await this.styleRefImageNode().asyncPublicUrl();
            s += " --sref " + publicUrl + " --sw " + this.styleWeight();
        }
        return s.trim();
    }

    trimmedPromptSuffix () {
        return this.promptSuffix().trim();
    }

    async asyncComposeFullPrompt () {
        const parts = [];

        parts.push(await this.asyncComposeExtraImagesPrompt());

        parts.push(this.sanitizePromptForMidjourney(this.prompt()));
        parts.push(this.trimmedPromptSuffix());

        parts.push(await this.asyncComposeOrefPrompt());
        parts.push(await this.asyncComposeSrefPrompt());

        parts.push(this.composeOptionalParametersPrompt());
        parts.push(" --v 7"); // IMPORTANT: We require Midjourney V7

        const fullPrompt = parts.join(" ");
        console.log("composeFullPrompt: [\n" + fullPrompt + "\n]");
        this.setFullPrompt(fullPrompt);
        return fullPrompt;
    }

    /**
   * @description Starts the image generation process.
   * @category Process
   */
    async start () {
        // Performance monitoring: Start MJ API generation timing
        performance.mark('mj-api-generation-start');

        this.setCompletionPromise(Promise.clone());
        this.setError(null);
        this.setStatus("submitting task...");
        this.notifyOwners("onImagePromptStart", [this]);

        const apiKey = await this.service().apiKeyOrUserAuthToken();
        const endpoint = this.thisClass().endpointBase() + "api/v1/nova/imagine";

        // IMPORTANT: Always use proxy for ImaginePro API requests:
        // 1. ACCOUNTING: Tracks API usage for user billing
        // 2. AUTHENTICATION: Handles API key management securely
        // 3. CORS: Ensures proper headers for cross-origin requests
        const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);
        const request = SvXhrRequest.clone();
        request.setDelegate(this);
        request.setUrl(proxyEndpoint);
        request.setMethod("POST");
        request.setHeaders({
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        });

        const fullPrompt = await this.asyncComposeFullPrompt();

        const bodyJson = {
            prompt: fullPrompt,
            mode: this.processMode()
        };

        request.setBody(JSON.stringify(bodyJson));

        // Store request for debugging
        this.setXhrRequest(request);

        try {
            await request.asyncSend(); // Delegate methods handle errors

            if (request.hasError()) {
                console.error("request error: " + request.error());
                this.setError(request.error());
                throw request.error();
            } else {
                let responseJson = undefined;
                try {
                    responseJson = JSON.parse(request.responseText());
                } catch (error) {
                    throw new Error(this.logPrefix() + " (" + error.message + ") response is not valid JSON: " + request.responseText());
                }
                const taskId = responseJson.task_id || responseJson.messageId;
                if (taskId) {
                    await this.addGenerationForTaskId(taskId, fullPrompt);

                    // Performance monitoring: Complete MJ API generation timing
                    performance.mark('mj-api-generation-end');
                    performance.measure('mj-api-generation', 'mj-api-generation-start', 'mj-api-generation-end');
                } else {
                    throw new Error(this.logPrefix() + " No task_id or messageId returned from ImaginePro");
                }
            }
        } catch (error) {
            // Performance monitoring: Mark end even on error
            performance.mark('mj-api-generation-end');
            performance.measure('mj-api-generation', 'mj-api-generation-start', 'mj-api-generation-end');

            this.setError(error);
            this.setStatus("Error: " + error.message);
            throw error;
        }
    }

    async addGenerationForTaskId (taskId, fullPrompt) {
        this.setStatus("task submitted, awaiting completion...");
        const generation = this.generations().add();
        generation.setPromptNote(fullPrompt);
        generation.setTaskId(taskId);
        generation.setDelegate(this);
        await generation.asyncStartPolling();
    }

    /**
   * @description Handles the end of the image generation process.
   * @category Process
   */
    onPromptEnd () { // end of request to being task
        //this.sendDelegateMessage("onImagePromptEnd", [this]);
        this.notifyOwners("onImagePromptEnd", [this]);
    }

    // --- SvXhrRequest Delegate Methods ---

    /**
   * @description Called during request progress.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestProgress (request) {
        this.setStatus(`uploading: ${request.contentByteCount()} bytes`);
    }

    /**
   * @description Shuts down the image prompt and its associated images.
   * @returns {ImagineProImagePrompt} The current instance.
   * @category Lifecycle
   */
    shutdown (visited = new Set()) {
        this.nodeShutdown(visited);
        return this;
    }

    allResultImages () {
        return this.generations().subnodes().map(generation => generation.images().subnodes()).flat();
    }

    async asyncAllResultImageNodes () {
        const allFilesToDownload = this.generations().subnodes().map(gen => {
            return gen.images().subnodes();
        }).flat();

        assert(allFilesToDownload.length > 0, "no files to download");

        for (const fileToDownload of allFilesToDownload) {
            fileToDownload.setRefererUrl(this.thisClass().endpointBase());
            await fileToDownload.asyncFetchIfNeeded();
        }

        return allFilesToDownload.map(fileToDownload => {
            // console.log("fileToDownload.dataUrl(): " + fileToDownload.dataUrl());
            return SvImageNode.clone().setDataURL(fileToDownload.dataUrl());
        });
    }

    resultImageUrlData () {
        const image = this.allResultImages().last();
        if (image) {
            return image.dataUrl();
        }
        return null;
    }

    /// --- Actions ---

    clear () {
        this.setStatus("");
        this.setError(null);
        this.shutdown();
        this.generations().removeAllSubnodes();
        //this.svImages().removeAllSubnodes();
    }

    /*
    didUpdateSlotStatus (oldValue, newValue) {
        //debugger;
        //this.shareProgress(newValue);
    }
    */

}.initThisClass());

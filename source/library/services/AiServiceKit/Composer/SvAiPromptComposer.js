"use strict";

/** * @module library.services.AiServiceKit.Composer
 */

/** * @classdesc A utility for composing AI prompts.
 * It will replace occurrences of:
 * - {{file$fileName}} with the contents of the file
 * - {{$tableOfContents}} with the table of contents of the prompt.
 * - {{$methodName}} with the result of the method call on the promptTarget.
 
 
 */


/**
 * @class SvAiPromptComposer
 * @extends SvSummaryNode
 * @classdesc A SvSummaryNode that composes an AI prompt.
 *
 * Example:
 *
 * const composer = SvAiPromptComposer.clone();
 * composer.setPromptTarget(targetForMethodReplacements);
 * composer.setInputString(anInputString);
 * composer.compose();
 * const prompt = composer.outputString();
 */

(class SvAiPromptComposer extends SvSummaryNode {

    initPrototypeSlots () {

        /**
     * @member {Object} promptTarget - object on which methods will be called to compose the prompt
     * @category Prompt Target
     */
        {
            const slot = this.newSlot("promptTarget", null);
            slot.setLabel("Prompt Target");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Object");
            slot.setIsSubnodeField(false);
            slot.setAllowsNullValue(true);
        }

        /**
     * @member {Object} promptDictionary - dictionary of key/value replacements
     * @category Prompt Dictionary
     */
        {
            const slot = this.newSlot("promptMap", null);
            slot.setLabel("Prompt Dictionary");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Map");
            slot.setIsSubnodeField(false);
            slot.setAllowsNullValue(true);
            slot.setFinalInitProto(Map);
        }

        /**
     * @member {Object} inputString - string to compose the prompt from
     * @category Input
     */
        {
            const slot = this.newSlot("inputString", "");
            slot.setInspectorPath("prompt template");
            slot.setKeyIsVisible(false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setNodeFillsRemainingWidth(true);
        }

        /**
     * @member {Object} outputString - the composed prompt (used during compose)
     * @category Output
     */
        {
            const slot = this.newSlot("outputString", "");
            slot.setInspectorPath("completed prompt");
            slot.setKeyIsVisible(false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setNodeFillsRemainingWidth(true);
        }

        {
            const slot = this.newSlot("composeAction", null);
            slot.setCanInspect(true);
            slot.setInspectorPath("");
            slot.setLabel("Compose Prompt");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("compose");
        }

        {
            const slot = this.newSlot("copyPromptAction", null);
            slot.setCanInspect(true);
            slot.setInspectorPath("");
            slot.setLabel("Copy Prompt");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("copyPrompt");
        }


        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    title () {
        return "Prompt Composer";
    }

    copyPrompt () {
        this.outputString().asyncCopyToClipboard();
    }

    setInputFileName (fileName) {
        this.setInputString(this.contentsOfFileNamed(fileName));
        return this;
    }

    // --- utility methods ---

    contentsOfFileNamed (fileName) {
        const file = SvFileResources.shared().rootFolder().resourceWithName(fileName);
        assert(file, `File not found: ${fileName}`);

        const contents = file.value();
        assert(contents, `Could not read contents of file: ${fileName}`);
        return contents;
    }

    // --- compose ---

    compose () {
        this.setOutputString(this.inputString());

        this.replaceFiles();
        this.replaceTableOfContents(); // so it's not treated as a method
        this.replaceResources(); // after files (included files may reference resources), before methods
        this.replaceMethods(); // this ordering prevents methods from containing string with {{file$fileName}}

        this.assertValidOutputString();
        return this.outputString();
    }

    // --- replace resources ---

    /**
     * @description Replaces every {{resource$name}} with the promptTarget's
     * nodeInheritedResource(name) — the Inherited Resources walk (null/
     * undeclared resolves to an empty string, so the template reads the same
     * whether or not any level has an opinion). No-op when the target does
     * not participate in the protocol.
     * @category Compose
     */
    replaceResources () {
        const target = this.promptTarget();
        this.setOutputString(this.outputString().replace(/\{\{resource\$([A-Za-z0-9_]+)\}\}/g, (m, name) => {
            const v = (target && target.nodeInheritedResource) ? target.nodeInheritedResource(name) : null;
            return (typeof v === "string") ? v : "";
        }));
    }

    // --- replace files ---

    /**
     * @description Resolves every {{file$name}} include, nesting each part's
     * headings under the heading that encloses the include — see
     * SvMarkdownIncludes for the rule. Roots start at level 1.
     * @category Compose
     */
    replaceFiles () {
        const includes = new SvMarkdownIncludes().setContentsOfFileNamed((name) => this.contentsOfFileNamed(name));
        this.setOutputString(includes.resolve(this.outputString(), 1));
    }

    // --- replace methods ---

    replaceMethods () {
    // next, find all {{$methodName}} and replace them with the result of the method call on the promptTarget
    // repeat on inputString until no more {{$methodName}} are found
    // limit to 1000 iterations
        for (let i = 0; i < 1000; i++) {
            if (!this.replaceNextMethod()) {
                return;
            }
        }
        throw new Error("Too many iterations during replaceMethods");
    }

    replaceNextMethod () {
        const string = this.outputString();
        if (string.includes("{{$")) {
            const matches = string.match(/{{\$([^}]+)}}/);
            if (matches && matches[1]) {
                // call method on promptTarget if it exists
                const methodName = matches[1];
                let method = null;
                if (this.promptTarget()) {
                    method = this.promptTarget()[methodName];
                }
                if (method) {
                    const methodResult = method.apply(this.promptTarget());
                    this.setOutputString(string.replaceAll(`{{$${methodName}}}`, this.formattedValue(methodResult)));
                    return true;
                } else {
                    const map = this.promptMap();
                    // otherwise, use the prompt dictionary
                    if (map && map.has(methodName)) {
                        const value = map.get(methodName);
                        this.setOutputString(string.replaceAll(`{{$${methodName}}}`, this.formattedValue(value)));
                        return true;
                    } else {
                        let dict = {
                            "message": `Method '${methodName}' not found on either of:`,
                            "promptTarget": this.promptTarget() ? this.promptTarget().svType() : "null",
                            "promptDictionary": this.promptMap() ? this.promptMap().keysArray() : "null"
                        };
                        throw new Error(JSON.stringify(dict, null, 2));
                    }
                }
            }
        }
        return false;
    }

    formattedValue (value) {
        if (Type.isString(value) || Type.isNumber(value) || Type.isBoolean(value)) {
            return String(value);
        } else if (Type.isJsonType(value)) {
            return JSON.stringify(value, null, 2);
        } else {
            throw new Error(this.svType() + "Unable to format value: " + value);
        }
    }

    // --- table of contents ---

    tableOfContentsString () {
        const toc = new SvMarkdownToc().setIndentString("      ").setMarkdown(this.outputString()).getTextToc();
        return toc;
    }

    replaceTableOfContents () {
    // find all {{$tableOfContents}} and replace them with the table of contents
        let string = this.outputString();
        if (string.includes("{{$tableOfContents}}")) {
            string = string.replaceAll("{{$tableOfContents}}", this.tableOfContentsString());
            this.setOutputString(string);
        }
    }

    assertValidOutputString () {
        const string = this.outputString();
        const invalidStrings = ["file$", "{{$"];
        invalidStrings.forEach(invalidString => {
            if (string.includes(invalidString)) {
                throw new Error("Found '" + invalidString + "' in output string which looks like a misformatted prompt variable.");
            }
        });
    }

}.initThisClass());

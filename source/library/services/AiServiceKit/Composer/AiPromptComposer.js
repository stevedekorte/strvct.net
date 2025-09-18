"use strict";

/**
 * @module library.services.AiServiceKit.Composer
 * @classdesc A utility for composing AI prompts. 
 * It will replace occurrences of:
 * - {{file$fileName}} with the contents of the file 
 * - {{$tableOfContents}} with the table of contents of the prompt.
 * - {{$methodName}} with the result of the method call on the promptTarget.
 */

/**
 * @class AiPromptComposer
 * @extends SvSummaryNode
 * @classdesc A SvSummaryNode that composes an AI prompt.
 * 
 * Example:
 * 
 * const composer = AiPromptComposer.clone();
 * composer.setPromptTarget(targetForMethodReplacements);
 * composer.setInputString(anInputString);
 * composer.compose(); 
 * const prompt = composer.outputString();
 */

(class AiPromptComposer extends SvSummaryNode {

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
    this.outputString().copyToClipboard();
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
    this.convertToAbsoluteMarkdown();
    this.replaceTableOfContents(); // so it's not treated as a method
    this.replaceMethods(); // this ordering prevents methods from containing string with {{file$fileName}}

    this.assertValidOutputString();
    return this.outputString();
  }

  // --- replace files ---

  replaceFiles () {
    // file all file names of the form {{file$fileName}} and replace them with the contents of the file using .contentsOfFileNamed()
    // repeat on inputString until no more {{file$fileName}} are found
    // limit to 1000 iterations
    for (let i = 0; i < 1000; i++) {
      if (!this.replaceNextFile()) {
        return;
      }
    }
    throw new Error("Too many iterations during replaceFiles");
  }

  replaceNextFile () {
    let string = this.outputString();
    // console.log("\n=== Debug replaceNextFile ===");
    // console.log("Full string:", string);
    
    if (string.includes("{{file$")) {
      // console.log("\nFound {{file$ in string");
      // First find the complete pattern
      const fullPattern = /\{\{file\$([^{}]+?)\}\}/;
      // console.log("Using pattern:", fullPattern);
      const match = string.match(fullPattern);
      // console.log("Match result:", match);
      
      if (!match) {
        // If no match, let's check what parts we do have
        const lines = string.split('\n');
        const problematicLineIndex = lines.findIndex(line => line.includes('{{file$'));
        const lineNumber = problematicLineIndex + 1;
        const problematicLine = lines[problematicLineIndex];
        
        // console.log("\nAnalyzing problematic line:");
        // console.log("Line content:", JSON.stringify(problematicLine));
        // console.log("Line length:", problematicLine.length);
        // console.log("Character codes:", [...problematicLine].map(c => c.charCodeAt(0)));
        
        // Check specific parts of the pattern
        const openingBrace = problematicLine.includes('{{');
        const filePrefix = problematicLine.includes('{{file$');
        const closingBrace = problematicLine.includes('}}');
        
        // console.log("Pattern parts found:");
        // console.log("- Opening braces {{:", openingBrace);
        // console.log("- file$ prefix:", filePrefix);
        // console.log("- Closing braces }}:", closingBrace);
        
        let detailedError = `Invalid file reference format found on line ${lineNumber}:\n` +
                           `  ${problematicLine}\n` +
                           'Pattern analysis:\n';
        
        if (!openingBrace) detailedError += '  - Missing opening braces "{{"\n';
        if (!filePrefix) detailedError += '  - Missing "file$" prefix\n';
        if (!closingBrace) detailedError += '  - Missing closing braces "}}"\n';
        
        detailedError += '\nThe file reference must be in the format {{file$filename.txt}} with matching opening and closing braces.';
        
        throw new Error(detailedError);
      }
      
      const fileName = match[1];
      // console.log("\nExtracted filename:", fileName);
      
      try {
        const fileContents = this.contentsOfFileNamed(fileName);
        // console.log("Successfully read file contents, length:", fileContents.length);
        string = string.replaceAll(`{{file$${fileName}}}`, fileContents);
        this.setOutputString(string);
        return true;
      } catch (error) {
        // console.log("Error reading file:", error);
        const lines = string.split('\n');
        const problematicLineIndex = lines.findIndex(line => line.includes(`{{file$${fileName}}}`));
        const lineNumber = problematicLineIndex + 1;
        
        throw new Error(
          `Error processing file reference on line ${lineNumber}:\n` +
          `  ${lines[problematicLineIndex]}\n` +
          `${error.message}`
        );
      }
    }
    return false;
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

  // --- convert relative to absolute markdown ---

  convertToAbsoluteMarkdown () {
    const absoluteHeaders = new MarkdownRelative().setInputString(this.outputString()).convertRelativeToAbsolute().outputString();
    this.setOutputString(absoluteHeaders);
  }

  // --- table of contents ---

  tableOfContentsString () {
    const toc = new MarkdownToc().setIndentString("      ").setMarkdown(this.outputString()).getTextToc();
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
        throw new Error(`Found '` + invalidString + `' in output string which looks like a misformatted prompt variable.`);
      }
    });
  }

}.initThisClass());
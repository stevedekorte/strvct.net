/** * @module library.ideal.html.SvHtmlStreamReader
 */

/** * @class SvHtmlStreamReader
 * @extends ProtoClass
 * @classdesc Wrapper over htmlparser2 library which:
 *   - deals with TextNodes (instead of just elements)
 *   - constructs virtual DOM during streaming
 *   - virtual DOM also manages a real DOM
 *   IMPORTANT:
 *   Unlike the real DOM, when the virtual DOM node is asked for it's HTML (via asHtml() or innerHtml()), it:
 *   - does not close any (as yet) unclosed elements or text
 *   This ensures that each call to, say:
 *    reader.rootNode().innerHtml()
 *   Will being with the exact value of the last call to it.
 *   This is helpful for doing proper incremental merging.
 */

"use strict";

(class SvHtmlStreamReader extends ProtoClass {

    initPrototypeSlots () {
        {
        /**
         * @member {htmlparser2.Parser}
         * @category Parser
         */
            const slot = this.newSlot("parser", null);
            slot.setSlotType("Parser"); //"htmlparser2.Parser"
        }

        {
        /**
         * @member {SvStreamElementNode}
         * @category DOM
         */
            const slot = this.newSlot("currentNode", null);
            slot.setSlotType("SvStreamNode"); // SvStreamElementNode or SvStreamTextNode
        }

        {
            /**
       * @member {Object}
       * @category Delegation
       */
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }

        {
            /**
       * @member {Error}
       * @category Error Handling
       */
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        {
            /**
       * @member {Boolean} educatesQuotes
       * @description When true, straight quotes in text nodes are converted to
       * curly quotes (see String.withCurlyQuotes). Off by default — only prose
       * readers should turn it on, since it rewrites the text bytes.
       * @category Text
       */
            const slot = this.newSlot("educatesQuotes", false);
            slot.setSlotType("Boolean");
        }

        {
            /**
       * @member {Set} quoteEducationSkipTagNames
       * @description Lowercase tag names whose text is machine data (JSON, code)
       * and must stay byte-exact. Text inside these tags, or any descendant of
       * them, is never quote-educated.
       * @category Text
       */
            const slot = this.newSlot("quoteEducationSkipTagNames", null);
            slot.setSlotType("Set");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setParser(this.newParser());
        this.setQuoteEducationSkipTagNames(this.defaultQuoteEducationSkipTagNames());
    //this.setIsDebugging(true);
    }

    /**
   * @description The tag names whose text must stay byte-exact when quote
   * education is on. tool-call / tool-call-result(s) / ai-request carry JSON
   * that is JSON.parse'd by the tag delegates; request-info, assistant-status,
   * no-op and system-error are machine chrome; code/pre/script/style are
   * verbatim by definition.
   * @returns {Set<string>}
   * @category Text
   */
    defaultQuoteEducationSkipTagNames () {
        return new Set([
            "tool-call",
            "tool-call-results",
            "tool-call-result",
            "ai-request",
            "request-info",
            "assistant-status",
            "no-op",
            "system-error",
            "code",
            "pre",
            "script",
            "style"
        ]);
    }

    /**
   * @description Creates a new htmlparser2 parser instance with custom event handlers
   * @returns {htmlparser2.Parser}
   * @category Parser
   */
    newParser () {
        const self = this;
        const parser = new htmlparser2.Parser(
            {
                /**
         * @description Handler for opening tags
         * @param {string} tagName - The name of the opening tag
         * @param {Object} attributes - The attributes of the opening tag
         */
                onopentag (tagName, attributes) {
                    self.onOpenElement(tagName, attributes);
                },

                /**
         * @description Handler for text nodes
         * @param {string} text - The text content
         */
                ontext (text) {
                    self.onText(text);
                },

                /**
         * @description Handler for closing tags
         * @param {string} tagname - The name of the closing tag
         */
                onclosetag (tagname) {
                    self.onCloseElement(tagname);
                },

                /**
         * @description Handler for the end of the stream
         */
                onend () {
                    self.onEnd();
                }
            },
            {
                decodeEntities: true
            }
        );

        parser._target = this;

        return parser;
    }

    /**
   * @description Shuts down the SvHtmlStreamReader instance
   * @returns {SvHtmlStreamReader}
   * @category Lifecycle
   */
    shutdown () {
        this.setParser(null);
        return this;
    }

    /**
   * @description Creates a new SvStreamElementNode instance
   * @returns {SvStreamElementNode}
   * @category DOM
   */
    newElement () {
        return SvStreamElementNode.clone();
    }

    /**
   * @description Pushes a new top node to the stream
   * @category DOM
   */
    pushTopNode () {
        const topNode = this.newElement().setName("top").onOpen();
        this.setCurrentNode(topNode);
    }

    /**
   * @description Returns the real DOM node of the root element
   * @returns {Node}
   * @category DOM
   */
    rootElement () {
        return this.rootNode().domNode();
    }

    /**
   * @description Starts the HTML stream
   * @category Stream Control
   */
    beginHtmlStream () {
        this.pushTopNode();
        this.sendDelegateMessage("onHtmlStreamReaderStart", [this]);
    }

    /**
   * @description Processes a chunk of HTML stream
   * @param {string} chunk - The HTML chunk
   * @category Stream Control
   */
    onStreamHtml (chunk) {
        this.parser().write(chunk);
    }

    /**
   * @description Checks if the current node is a valid end node
   * @returns {boolean}
   * @category Validation
   */
    isValidEnd () {
        let endNode = this.currentNode();
        if (endNode.thisClass().isKindOf(SvStreamTextNode)) {
            endNode = endNode.parent();
        }
        return endNode === this.rootNode();
    }

    /**
   * @description Ends the HTML stream
   * @category Stream Control
   */
    endHtmlStream () {
    /*
    if (!this.isValidEnd()) {
      // need to pop if its a SvStreamTextNode
      this.setError(new Error("SvHtmlStreamReader.endHtmlStream() ended with unclosed elements"));
      console.warn(this.error().message);
    }
    */
        this.parser().end();
        this.sendDelegateMessage("onHtmlStreamReaderEnd", [this]);
    }

    /**
   * @description Pushes a new node to the stream
   * @param {SvStreamElementNode} newNode - The new node to push
   * @returns {SvStreamElementNode}
   * @category DOM
   */
    pushNode (newNode) {
        const currentNode = this.currentNode();
        //console.log("PUSH " + newNode.asHtml());
        assert(!currentNode.isTextNode());
        currentNode.addChild(newNode);
        this.setCurrentNode(newNode);
        this.sendDelegateMessage("onHtmlStreamReaderPushNode", [this, newNode]);
        return newNode;
    }

    /**
   * @description Pops the current node from the stream
   * @returns {SvStreamElementNode}
   * @category DOM
   */
    popNode () {
        const n = this.currentNode();
        //console.log("POP " + n.asHtml());
        assert(n);
        n.onClose();
        const p = n.parent();
        assert(p); // this can happen on an incomplete tag e.g. [<div class="']
        this.setCurrentNode(p);

        this.sendDelegateMessage("onHtmlStreamReaderPopNode", [this, n]);
        //this.show();
        return n;
    }

    /**
   * @description Returns the root node of the stream
   * @returns {SvStreamElementNode}
   * @category DOM
   */
    rootNode () {
        return this.currentNode().rootNode();
    }

    /**
   * @description Logs the current state of the stream
   * @category Debugging
   */
    show () {
        const line = "-".repeat(20);
        console.log(line + " " + this.svType() + " " + line);
        this.rootNode().show();
        console.log(line + line);

    }

    /**
   * @description Returns the previous tag node
   * @returns {SvStreamElementNode}
   * @category DOM
   */
    previousTag () {
        return this.currentNode().parent();
    }

    /**
   * @description Pops the current node if it is a text node
   * @category DOM
   */
    popIfCurrentNodeIsText () {
        const n = this.currentNode();
        if (n.isTextNode()) {
            this.onCloseText(); // will do pop
        }
    }

    /**
   * @description Handles the opening of an element
   * @param {string} tagName - The name of the opening tag
   * @param {Object} attributes - The attributes of the opening tag
   * @category Parser
   */
    onOpenElement (tagName, attributes) {
    //console.log("onOpenElement(" + tagName + ", " + JSON.stringify(attributes) + ")");

        this.popIfCurrentNodeIsText();

        const e = this.newElement();
        e.setParent(this.currentNode());
        e.setName(tagName);
        e.setAttributes(attributes);
        e.onOpen();
        //console.log("onOpenElement " + e.openTagString());
        this.pushNode(e);
    }

    /**
   * @description Handles the closing of an element
   * @param {string} tagName - The name of the closing tag
   * @category Parser
   */
    onCloseElement (tagName) {
    //console.log("onCloseElement(" + tagName + ")");

        this.popIfCurrentNodeIsText();

        const currentNode = this.currentNode();
        if (currentNode && currentNode.name() === tagName) {
            const e = this.popNode();
            assert(e.name() === tagName);
            //console.log("onCloseElement " + e.asHtml());
        } else {
            console.warn("WARNING:  " + this.svType() + ".onCloseElement(" + tagName + ") doesn't match current node " + currentNode.name() + " so we will ignore it and won't send a callback");
        }
    }

    /**
   * @description Handles text nodes
   * @param {string} text - The text content
   * @category Parser
   */
    onText (text) {
    //console.log("onText '" + text + "'");
        const n = this.currentNode();

        if (this.shouldEducateQuotesInNode(n)) {
            text = text.withCurlyQuotes(this.precedingCharForNode(n));
        }

        if (n.isTextNode()) {
            n.appendText(text);
        } else {
            this.onOpenText(text);
        }
    }

    /**
   * @description Whether the text arriving under the given node should have its
   * straight quotes educated: only when educatesQuotes is on and neither the
   * node nor any ancestor is a skip tag (machine data must stay byte-exact).
   * @param {SvStreamNode} aNode - The node the text will be appended under.
   * @returns {boolean}
   * @category Text
   */
    shouldEducateQuotesInNode (aNode) {
        if (!this.educatesQuotes()) {
            return false;
        }
        const skipSet = this.quoteEducationSkipTagNames();
        if (!skipSet || skipSet.size === 0) {
            return true;
        }
        const skipAncestor = aNode.detectAncestor(node => {
            // text nodes and the unnamed root node have no meaningful tag name
            const name = node.name ? node.name() : null;
            return name ? skipSet.has(name.toLowerCase()) : false;
        });
        return skipAncestor === null;
    }

    /**
   * @description The character to the left of the incoming text, used to decide
   * whether a leading quote opens or closes. Within a text node it is that
   * node's last character; under an element it is the last character of the
   * element's last child (e.g. an `</i>` that just closed), or "" at the start
   * of the element (which reads as an opener).
   * @param {SvStreamNode} aNode - The node the text will be appended under.
   * @returns {string}
   * @category Text
   */
    precedingCharForNode (aNode) {
        let priorText = "";
        if (aNode.isTextNode()) {
            priorText = aNode.text();
        } else {
            const lastChild = aNode.children().last();
            if (lastChild) {
                priorText = lastChild.textContent();
            }
        }
        return priorText.length ? priorText[priorText.length - 1] : "";
    }

    /**
   * @description Opens a new text node
   * @param {string} text - The text content
   * @category Parser
   */
    onOpenText (text) {
    //console.log("onOpenText '" + text + "'");
        const newNode = SvStreamTextNode.clone().setText(text).onOpen();
        this.pushNode(newNode);
    }

    /**
   * @description Closes the current text node
   * @category Parser
   */
    onCloseText () {
        const n = this.currentNode();
        //console.log("onCloseText '" + n.text() + "'");
        assert(n.isTextNode());
        this.popNode();
    }

    /**
   * @description Handles the end of the stream
   * @category Parser
   */
    onEnd () {
        this.popIfCurrentNodeIsText();
    }

}.initThisClass());


/**
 * @description Test function for SvHtmlStreamReader
 * @category Testing
 */
/*
const testSentenceReader = function () {

  console.log(
    "========================================================================="
  );


  const results = [];
  const others = [];
  const htmlResults = [];

  const reader = SvHtmlStreamReader.clone();
  reader.setDelegate({
    onSpokenSentence: (text, html) => {
      results.push(text);
      htmlResults.push(html);
    }
  })

  // Simulate random breaks in the HTML content
  reader.beginHtmlStream();
  reader.onStreamHtml('<div class="session-name">The Lost City\'s Hidden Secrets</div>\n\n<span');
  reader.onStreamHtml('>Welcome, brave souls, to the edge of the <div class=\"location-name\">Sighing Desert</div>.</span>');
  reader.onStreamHtml('<span data-note="speak">Here, amid the dunes that stretch like slumbering golden serpents beneath the relentless sun, lies the enigma of a vanished civilization.</span>\n\n');
  reader.endHtmlStream();

  const expectedSentences = [
    "The Lost City's Hidden Secrets",
    //"\n\n",
    "Welcome, brave souls, to the edge of the Sighing Desert.",
    "Here, amid the dunes that stretch like slumbering golden serpents beneath the relentless sun, lies the enigma of a vanished civilization."
    //"\n\n"
  ];

  const passed = JSON.stringify(results) === JSON.stringify(expectedSentences);

  if (passed) {
    console.log(`Test Passed - Output:` + JSON.stringify(results, null, 2));
  } else {
    console.warn(`Test Failed:`);
    console.warn(`Input: '<div class="session-name">The Lost City's Hidden Secrets</div><span data-note="speak">Welcome, brave souls, to the edge of the <div class=location-name>Sighing Desert</div>.</span><span data-note="speak">Here, amid the dunes that stretch like slumbering golden serpents beneath the relentless sun, lies the enigma of a vanished civilization.</span>'`);
    console.warn("Expected Output: ", JSON.stringify(expectedSentences, null, 2));
    console.warn("  Actual Output: ", JSON.stringify(results, null, 2));
  }

  console.log(
    "========================================================================="
  );

}
*/

//testSentenceReader();

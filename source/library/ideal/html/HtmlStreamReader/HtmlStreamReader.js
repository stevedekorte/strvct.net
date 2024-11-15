/**
 * @module library.ideal.html.HtmlStreamReader
 * @class HtmlStreamReader
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

(class HtmlStreamReader extends ProtoClass { 

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
         * @member {StreamElementNode}
         * @category DOM
         */
        const slot = this.newSlot("currentNode", null);
        slot.setSlotType("StreamNode"); // StreamElementNode or StreamTextNode
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
  }
  
  initPrototype () {
  }

  init () {
    super.init();
    this.setParser(this.newParser());
    //this.setIsDebugging(true);
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
          self.onOpenElement(tagName, attributes)
        },

        /**
         * @description Handler for text nodes
         * @param {string} text - The text content
         */
        ontext (text) {
          self.onText(text)
        },

        /**
         * @description Handler for closing tags
         * @param {string} tagname - The name of the closing tag
         */
        onclosetag (tagname) {
          self.onCloseElement(tagname)
        },

        /**
         * @description Handler for the end of the stream
         */
        onend () {
          self.onEnd()
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
   * @description Shuts down the HtmlStreamReader instance
   * @returns {HtmlStreamReader}
   * @category Lifecycle
   */
  shutdown () {
    this.setParser(null);
    return this;
  }

  /**
   * @description Creates a new StreamElementNode instance
   * @returns {StreamElementNode}
   * @category DOM
   */
  newElement () {
    return StreamElementNode.clone();
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
    this.sendDelegate("onHtmlStreamReaderStart", [this]);
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
    if (endNode.thisClass().isKindOf(StreamTextNode)) {
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
      // need to pop if its a StreamTextNode
      this.setError(new Error("HtmlStreamReader.endHtmlStream() ended with unclosed elements"));
      console.warn(this.error().message);
      debugger;
    }
    */
    this.parser().end();
    this.sendDelegate("onHtmlStreamReaderEnd", [this]);
  }

  /**
   * @description Pushes a new node to the stream
   * @param {StreamElementNode} newNode - The new node to push
   * @returns {StreamElementNode}
   * @category DOM
   */
  pushNode (newNode) {
    const currentNode = this.currentNode();
    //console.log("PUSH " + newNode.asHtml());
    assert(!currentNode.isTextNode());
    currentNode.addChild(newNode);
    this.setCurrentNode(newNode);
    this.sendDelegate("onHtmlStreamReaderPushNode", [this, newNode]);
    return newNode;
  }

  /**
   * @description Pops the current node from the stream
   * @returns {StreamElementNode}
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

    this.sendDelegate("onHtmlStreamReaderPopNode", [this, n]);
    //this.show();
    return n;
  }

  /**
   * @description Returns the root node of the stream
   * @returns {StreamElementNode}
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
    console.log(line + " " + this.type() + " " + line);
    this.rootNode().show();
    console.log(line + line);
    //debugger;
  }

  /**
   * @description Returns the previous tag node
   * @returns {StreamElementNode}
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
      console.warn("WARNING:  " + this.type() + ".onCloseElement(" + tagName + ") doesn't match current node " + currentNode.name() + " so we will ignore it and won't send a callback");
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
    //debugger;
    
    if (n.isTextNode()) {
      n.appendText(text);
    } else {
      this.onOpenText(text);
    }
  }

  /**
   * @description Opens a new text node
   * @param {string} text - The text content
   * @category Parser
   */
  onOpenText (text) {
    //console.log("onOpenText '" + text + "'");
    const newNode = StreamTextNode.clone().setText(text).onOpen();
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

  /**
   * @description Sends a message to the delegate
   * @param {string} methodName - The name of the delegate method
   * @param {Array} [args=[this]] - Additional arguments to pass to the delegate method
   * @returns {boolean} - Returns true if the delegate method was called successfully, false otherwise
   * @category Delegation
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate();

    /*
    if (this.isDebugging()) {
      console.log(this.type() + " --------------- calling delegate " + methodName + "(" + args.join(",") + ")");
    }
    */

    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    } else {
      /*
      const error = this.type() + " delegate missing method '" + methodName + "'";
      console.log(error);
      debugger;
      throw new Error(error);
      */
    }
    return false
  }

}.initThisClass());


/**
 * @description Test function for HtmlStreamReader
 * @category Testing
 */
const testSentenceReader = function () {

  console.log(
    "========================================================================="
  );

  
  const results = [];
  const others = [];
  const htmlResults = [];

  const reader = HtmlStreamReader.clone();
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
    console.log(`Test Passed - Output:` + JSON.stringify(results, 2, 2));
  } else {
    console.warn(`Test Failed:`);
    console.warn(`Input: '<div class="session-name">The Lost City's Hidden Secrets</div><span data-note="speak">Welcome, brave souls, to the edge of the <div class=location-name>Sighing Desert</div>.</span><span data-note="speak">Here, amid the dunes that stretch like slumbering golden serpents beneath the relentless sun, lies the enigma of a vanished civilization.</span>'`);
    console.warn("Expected Output: ", JSON.stringify(expectedSentences, 2, 2));
    console.warn("  Actual Output: ", JSON.stringify(results, 2, 2));
    debugger;
  }

  console.log(
    "========================================================================="
  );
  
}

//testSentenceReader();
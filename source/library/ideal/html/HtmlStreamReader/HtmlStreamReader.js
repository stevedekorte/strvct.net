"use strict";

/*

    HtmlStreamReader

    Wrapper over htmlparser2 library which:
    - deals with TextNodes (instead of just elements)
    - constructs virtual DOM during streaming
    - virtual DOM also manages a real DOM

    IMPORTANT:

    Unlike the real DOM, when the virtual DOM node is asked for it's HTML (via asHtml() or innerHtml()), it:
    - does not close any (as yet) unclosed elements or text
    This ensures that each call to, say:

     reader.rootNode().innerHtml()

    Will being with the exact value of the last call to it. 
    This is helpful for doing proper incremental merging.


    Example use:

    const reader = HtmlStreamReader.clone();
    reader.setDelegate(this);
    reader.beginHtmlStream();
    reader.onStreamHtml(chunk1);
    reader.onStreamHtml(chunk2);
    ...
    reader.onStreamHtml(lastChunk);
    reader.endHtmlStream();

    // delegate protocol

      onHtmlStreamReaderStart (reader)
      onHtmlStreamReaderPushNode (reader, streamNode)
      onHtmlStreamReaderPopNode (reader, streamNode) 
      onHtmlStreamReaderEnd (reader)

*/

(class HtmlStreamReader extends ProtoClass { 

  initPrototypeSlots () {
    {
        const slot = this.newSlot("parser", null);
        slot.setSlotType("htmlparser2.Parser");
    }

    {
        const slot = this.newSlot("currentNode", null);
        slot.setSlotType("StreamElementNode");
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    {
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

  newParser () {
      const self = this;
      const parser = new htmlparser2.Parser(
      {
        onopentag (tagName, attributes) {
          self.onOpenElement(tagName, attributes)
        },

        ontext (text) {
          self.onText(text)
        },

        onclosetag (tagname) {
          self.onCloseElement(tagname)
        },

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

  shutdown () {
    this.setParser(null);
    return this;
  }

  newElement () {
    return StreamElementNode.clone();
  }

  pushTopNode () {
    const topNode = this.newElement().setName("top").onOpen();
    this.setCurrentNode(topNode); 
  }

  rootElement () {
    return this.rootNode().domNode();
  }

  // --- called by owner to input html stream ---

  beginHtmlStream () {
    this.pushTopNode();
    this.sendDelegate("onHtmlStreamReaderStart", [this]);
  }

  onStreamHtml (chunk) {
    this.parser().write(chunk);
  }

  isValidEnd () {
    let endNode = this.currentNode();
    if (endNode.thisClass().isKindOf(StreamTextNode)) {
      endNode = endNode.parent();
    }
    return endNode === this.rootNode();
  }

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

  // --- tags ---

  pushNode (newNode) {
    const currentNode = this.currentNode();
    //console.log("PUSH " + newNode.asHtml());
    assert(!currentNode.isTextNode());
    currentNode.addChild(newNode);
    this.setCurrentNode(newNode);
    this.sendDelegate("onHtmlStreamReaderPushNode", [this, newNode]);
    return newNode;
  }

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

  rootNode () {
    return this.currentNode().rootNode();
  }

  show () {
    const line = "-".repeat(20);
    console.log(line + " " + this.type() + " " + line);
    this.rootNode().show();
    console.log(line + line);
    //debugger;
  }

  previousTag () {
    return this.currentNode().parent();
  }

  // --- htmlparser2 events ---

  popIfCurrentNodeIsText () {
    const n = this.currentNode();
    if (n.isTextNode()) {
      this.onCloseText(); // will do pop
    }
  }

  // --- open and close element ---

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

  // ---------------------------------

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

  onOpenText (text) {
    //console.log("onOpenText '" + text + "'");
    const newNode = StreamTextNode.clone().setText(text).onOpen();
    this.pushNode(newNode);
  }

  onCloseText () {
    const n = this.currentNode();
    //console.log("onCloseText '" + n.text() + "'");
    assert(n.isTextNode());
    this.popNode();
  }

  // --------------------------------

  onEnd () {
    this.popIfCurrentNodeIsText();
  }

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
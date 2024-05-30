"use strict";

/*

    JsonStreamReader

    Wrapper over clarinet library which:
    - constructs JSON while reading stream


    Example use:

      const reader = JsonStreamReader.clone();
      reader.setDelegate(this);
      reader.beginJsonStream();
      reader.onStreamJson(firstChunk);
      ...
      reader.onStreamJson(lastChunk);
      reader.endJsonStream();

    // delegate protocol

      //onJsonStreamReaderStart (reader)
      onJsonStreamReaderPushContainer (reader, json)
      onJsonStreamReaderPopBaseContainer (reader, json) 
      //onJsonStreamReaderEnd (reader)

*/

(class JsonStreamReader extends ProtoClass { 

  initPrototypeSlots () {
    {
        const slot = this.newSlot("parser", null);
    }

    // NOTE: a "container" is a node that can have children (such as Object or Array)

    {
      const slot = this.newSlot("containerStack", null);
    }

    {
      const slot = this.newSlot("currentContainer", null);
    }

    // stack of keys for objects

    {
      const slot = this.newSlot("keyStack", null);
    }

    {
      const slot = this.newSlot("currentKey", null);
    }

    {
      const slot = this.newSlot("delegate", null);
    }
  }

  init () {
    super.init();
    //this.setIsDebugging(true);
  }

  newParser () {
      const parser = clarinet.parser();

      parser.onerror = (e) => {
        // an error happened. e is the error.
        this.onError(e);
      };

      parser.onvalue = (v) => {
        // got some value.  v is the value. can be string, double, bool, or null.
        this.onValue(v);
      };

      parser.onopenobject = (key) => {
        // opened an object. key is the first key.
        this.onOpenObject(key);
      };

      parser.onkey = (key) => {
        // got a subsequent key in an object.
        this.onKey(key);
      };

      parser.oncloseobject = () => {
        this.onCloseObject();
      };

      parser.onopenarray = () => {
        this.onOpenArray();
      };

      parser.onclosearray = () => {
        this.onCloseArray();
      };

      parser.onend = () => {
        // parser stream is done, and ready to have more stuff written to it.
        this.onEnd();
      };

      //parser.write('{"foo": "bar"}').close();
      
      return parser;
  }

  beginJsonStream () {
    this.setParser(this.newParser());
    this.setContainerStack([]);
    this.setKeyStack([]);
    this.pushContainer([]); // root container
  }

  endJsonStream () {
    // check stack is empty?
    //this.popContainer();
    //this.rootContainer(); // should be an array of all the json objects we've read
  }

  onStreamJson (data) {
    assert(Type.isString(data), "data must be a string");
    console.log("onStreamJson('" + data + "')");
    this.parser().write(data);
    return this;
  }

  shutdown () {
    this.setParser(null);
    return this;
  }

  rootContainer () {
    return this.containerStack().first();
  }

  show () {
    const s = JSON.stringify(this.rootContainer());
    console.log("root: ", s);
  }
    
  // --- conatiner stack ---
    
  currentContainer () {
    return this.containerStack().last();
  }

  pushContainer (container) {
    assert(container, "container is null");
    this.containerStack().push(container);
    this.sendDelegate("onJsonStreamReaderPushContainer", [this, container]);

    //this.debugLog("push ", JSON.stringify(container));
    //this.show();
    return this;
  }

  popContainer () {
    assert(this.containerStack().length > 1, "can't close root array");
    const item = this.containerStack().pop();
    this.sendDelegate("onJsonStreamReaderPopContainer", [this, item]);
    return item;
  }

  // --- key stack ---

  currentKey () {
    return this.keyStack().last();
  }

  pushKey (key) {
    assert(Type.isString(key), "key must be a string");
    this.keyStack().push(key);
    return this;
  }

  popKey () {  
    assert(this.keyStack().length > 0, "can't pop empty key stack");
    this.keyStack().pop();
    return this;
  }

  // --- parser events ---

  onError(e) {
    console.log(this.type() + " error: " + e);
    debugger;
    this.sendDelegate("onJsonStreamReaderError", [this, e]);
  }
  
  onKey (key) {
    this.pushKey(key);
    //this.debugLog("k '" + key + "'");
  }

  onValue (v) {
    const container = this.currentContainer();
    assert(container, "no current container");
    if (Type.isArray(container)) {
      container.push(v);
    } else {
      assert(this.currentKey(), "no current key");
      container[this.currentKey()] = v;
      this.popKey();
    }
    //this.debugLog("v " + JSON.stringify(v));
  }

  onOpenObject (key) {    
    const item = {};
    this.onValue(item);
    this.pushContainer(item);
    //this.debugLog("onOpenObject ");
    this.onKey(key);
  }

  onCloseObject () {
    assert(this.containerStack().length > 1, "can't close root object");
    const item = this.popContainer();
    //this.debugLog("onCloseObject ", JSON.stringify(item));
  }

  onOpenArray () {
    const item = [];
    this.onValue(item);
    this.pushContainer(item);
    //this.debugLog("onOpenArray ");
  }

  onCloseArray () {
    assert(this.containerStack().length > 1, "can't close root array");
    const item = this.popContainer();
    //this.debugLog("onCloseArray ", JSON.stringify(item));
  }

  onEnd () {
    this.popIfCurrentNodeIsText();
  }

  // --------------------------------

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

/*
const testJsonReader = function () {

  console.log(
    "========================================================================="
  );
  
  const jsonInput = [{ "a": 1 }, [1, 2, 3], { "b": 2 }];

  const reader = JsonStreamReader.clone();

  // Simulate random breaks in the HTML content
  reader.beginJsonStream();
  const s = JSON.stringify(jsonInput);
  reader.onStreamJson(s);
  reader.endJsonStream();
  //reader.show();

  console.log("input: ", JSON.stringify(jsonInput));
  console.log("output: ", JSON.stringify(reader.rootContainer()));
  debugger;

  console.log(
    "========================================================================="
  );
  
}

testJsonReader();
*/
"use strict";

/**
 * @module library.ideal.json.JsonStreamReader
 * @class JsonStreamReader
 * @extends ProtoClass
 * @classdesc Wrapper over clarinet library which constructs JSON while reading stream.
 *
 * Example use:
 *
 *   const reader = JsonStreamReader.clone();
 *   reader.setDelegate(this);
 *   reader.beginJsonStream();
 *   reader.onStreamJson(firstChunk);
 *   ...
 *   reader.onStreamJson(lastChunk);
 *   reader.endJsonStream();
 *
 * // delegate protocol
 *
 *   //onJsonStreamReaderStart (reader)
 *   onJsonStreamReaderPushContainer (reader, json)
 *   onJsonStreamReaderPopBaseContainer (reader, json)
 *   //onJsonStreamReaderEnd (reader)
 */

(class JsonStreamReader extends ProtoClass {
  initPrototypeSlots() {
    /**
     * @type {clarinet.parser}
     */
    {
      const slot = this.newSlot("parser", null);
      slot.setSlotType("clarinet.parser");
    }

    // NOTE: a "container" is a node that can have children (such as Object or Array)

    /**
     * @type {Array}
     */
    {
      const slot = this.newSlot("containerStack", null);
      slot.setSlotType("Array");
    }

    /**
     * @type {Object}
     */
    {
      const slot = this.newSlot("currentContainer", null);
      slot.setSlotType("Object");
    }

    // stack of keys for objects

    /**
     * @type {Array}
     */
    {
      const slot = this.newSlot("keyStack", null);
      slot.setSlotType("Array");
    }

    /**
     * @type {String}
     */
    {
      const slot = this.newSlot("currentKey", null);
      slot.setSlotType("String");
    }

    /**
     * @type {Object}
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }
  }

  /**
   * @description Creates a new clarinet parser.
   * @returns {clarinet.parser}
   */
  newParser() {
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

  /**
   * @description Begins a new JSON stream.
   */
  beginJsonStream() {
    this.setParser(this.newParser());
    this.setContainerStack([]);
    this.setKeyStack([]);
    this.pushContainer([]); // root container
  }

  /**
   * @description Ends the current JSON stream.
   */
  endJsonStream() {
    // check stack is empty?
    //this.popContainer();
    //this.rootContainer(); // should be an array of all the json objects we've read
  }

  /**
   * @description Processes the given JSON data chunk.
   * @param {string} data - The JSON data chunk to process.
   * @returns {JsonStreamReader} The instance of JsonStreamReader.
   */
  onStreamJson(data) {
    assert(Type.isString(data), "data must be a string");
    console.log("onStreamJson('" + data + "')");
    this.parser().write(data);
    return this;
  }

  /**
   * @description Shuts down the JsonStreamReader.
   * @returns {JsonStreamReader} The instance of JsonStreamReader.
   */
  shutdown() {
    this.setParser(null);
    return this;
  }

  /**
   * @description Gets the root container of the JSON stream.
   * @returns {*} The root container.
   */
  rootContainer() {
    return this.containerStack().first();
  }

  /**
   * @description Logs the root container to the console.
   */
  show() {
    const s = JSON.stableStringify(this.rootContainer());
    console.log("root: ", s);
  }

  // --- container stack ---

  /**
   * @description Gets the current container.
   * @returns {Object|Array|null} The current container, or null if none.
   */
  currentContainer() {
    return this.containerStack().last();
  }

  /**
   * @description Pushes a new container onto the container stack.
   * @param {Object|Array} container - The container to push.
   * @returns {JsonStreamReader} The instance of JsonStreamReader.
   */
  pushContainer(container) {
    assert(container, "container is null");
    this.containerStack().push(container);
    this.sendDelegate("onJsonStreamReaderPushContainer", [this, container]);

    //this.debugLog("push ", JSON.stableStringify(container));
    //this.show();
    return this;
  }

  /**
   * @description Pops the current container from the container stack.
   * @returns {Object|Array} The popped container.
   */
  popContainer() {
    assert(this.containerStack().length > 1, "can't close root array");
    const item = this.containerStack().pop();
    this.sendDelegate("onJsonStreamReaderPopContainer", [this, item]);
    return item;
  }

  // --- key stack ---

  /**
   * @description Gets the current key.
   * @returns {string|null} The current key, or null if none.
   */
  currentKey() {
    return this.keyStack().last();
  }

  /**
   * @description Pushes a new key onto the key stack.
   * @param {string} key - The key to push.
   * @returns {JsonStreamReader} The instance of JsonStreamReader.
   */
  pushKey(key) {
    assert(Type.isString(key), "key must be a string");
    this.keyStack().push(key);
    return this;
  }

  /**
   * @description Pops the current key from the key stack.
   * @returns {JsonStreamReader} The instance of JsonStreamReader.
   */
  popKey() {
    assert(this.keyStack().length > 0, "can't pop empty key stack");
    this.keyStack().pop();
    return this;
  }

  // --- parser events ---

  /**
   * @description Handles an error event from the clarinet parser.
   * @param {Error} e - The error that occurred.
   */
  onError(e) {
    console.log(this.type() + " error: " + e);
    debugger;
    this.sendDelegate("onJsonStreamReaderError", [this, e]);
  }

  /**
   * @description Handles a key event from the clarinet parser.
   * @param {string} key - The key that was encountered.
   */
  onKey(key) {
    this.pushKey(key);
    //this.debugLog("k '" + key + "'");
  }

  /**
   * @description Handles a value event from the clarinet parser.
   * @param {*} v - The value that was encountered.
   */
  onValue(v) {
    const container = this.currentContainer();
    assert(container, "no current container");
    if (Type.isArray(container)) {
      container.push(v);
    } else {
      assert(this.currentKey(), "no current key");
      container[this.currentKey()] = v;
      this.popKey();
    }
    //this.debugLog("v " + JSON.stableStringify(v));
  }

  /**
   * @description Handles an open object event from the clarinet parser.
   * @param {string} key - The key of the opened object.
   */
  onOpenObject(key) {
    const item = {};
    this.onValue(item);
    this.pushContainer(item);
    //this.debugLog("onOpenObject ");
    this.onKey(key);
  }

  /**
   * @description Handles a close object event from the clarinet parser.
   */
  onCloseObject() {
    assert(this.containerStack().length > 1, "can't close root object");
    const item = this.popContainer();
    //this.debugLog("onCloseObject ", JSON.stableStringify(item));
  }

  /**
   * @description Handles an open array event from the clarinet parser.
   */
  onOpenArray() {
    const item = [];
    this.onValue(item);
    this.pushContainer(item);
    //this.debugLog("onOpenArray ");
  }

  /**
   * @description Handles a close array event from the clarinet parser.
   */
  onCloseArray() {
    assert(this.containerStack().length > 1, "can't close root array");
    const item = this.popContainer();
    //this.debugLog("onCloseArray ", JSON.stableStringify(item));
  }

  /**
   * @description Handles an end event from the clarinet parser.
   */
  onEnd() {
    this.popIfCurrentNodeIsText();
  }

  // --------------------------------

  /**
   * @description Sends a message to the delegate object, if one is set.
   * @param {string} methodName - The name of the method to call on the delegate.
   * @param {Array} [args=[this]] - The arguments to pass to the method.
   * @returns {boolean} True if the delegate method was called successfully, false otherwise.
   */
  sendDelegate(methodName, args = [this]) {
    const d = this.delegate();

    /*
    if (this.isDebugging()) {
      console.log(this.type() + " --------------- calling delegate " + methodName + "(" + args.join(",") + ")");
    }
    */

    if (d) {
      const f = d[methodName];
      if (f) {
        f.apply(d, args);
        return true;
      }
    } else {
      /*
      const error = this.type() + " delegate missing method '" + methodName + "'";
      console.log(error);
      debugger;
      throw new Error(error);
      */
    }
    return false;
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
  const s = JSON.stableStringify(jsonInput);
  reader.onStreamJson(s);
  reader.endJsonStream();
  //reader.show();

  console.log("input: ", JSON.stableStringify(jsonInput));
  console.log("output: ", JSON.stableStringify(reader.rootContainer()));
  debugger;

  console.log(
    "========================================================================="
  );
  
}

testJsonReader();
*/
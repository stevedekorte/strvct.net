/*
    @category Collections
    @extends Map
    @class FifoMap
    @classdesc FifoMap is a Map that maintains a linked list of keys 
    in the order of insertion in order to support an efficient pop() operation.
    When a key is set again, it moves to the end of the queue.

    @example
        const lm = new FifoMap();
        lm.set('a', 1).set('b', 2).set('c', 3);
        console.log(lm.pop());      // → 3
        console.log(lm.pop());      // → 2
        lm.set('d', 4);
        console.log([...lm.keys()]); // → ['a','d']
        console.log(lm.pop());      // → 4
        console.log(lm.pop());      // → 1
        console.log(lm.pop());      // → undefined
  */

SvGlobals.globals().FifoMap = class FifoMap extends Map {

    constructor (iterable) {
      super();
      this._nodes = new Map();   // key → node
      this._head = null;          // oldest
      this._tail = null;          // newest
      if (iterable) {
        for (let [k,v] of iterable) {
            this.set(k,v);
        }
      }
    }
  
    // internal node shape
    _createNode (key) {
      return { 
        key, prev: null, 
        next: null 
      };
    }

    // remove node from linked list
    _removeNode (node) {
      if (node.prev) {
        node.prev.next = node.next;
      } else {
        this._head = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      } else {
        this._tail = node.prev;
      }
    }

    // add node to tail of linked list
    _addToTail (node) {
      if (!this._head) {
        this._head = this._tail = node;
      } else {
        node.prev = this._tail;
        this._tail.next = node;
        this._tail = node;
      }
    }
  
    set (key, value) {
      if (this.has(key)) {
        // existing: remove from current position and add to tail
        const node = this._nodes.get(key);
        this._removeNode(node);
        this._addToTail(node);
        super.set(key, value);
        return this;
      }

      // new key: append to tail
      const node = this._createNode(key);
      this._addToTail(node);
      this._nodes.set(key, node);
      super.set(key, value);
      return this;
    }
  
    delete (key) {
      if (!this.has(key)) {
        return false;
      }
      const node = this._nodes.get(key);
      this._removeNode(node);
      this._nodes.delete(key);
      return super.delete(key);
    }

    clear () {
      this._nodes.clear();
      this._head = this._tail = null;
      super.clear();
    }
  
    pop () {
      if (!this._tail) {
        return undefined;
      }
      const key = this._tail.key;
      const value = super.get(key);
      this._removeNode(this._tail);
      this._nodes.delete(key);
      super.delete(key);
      return value;
    }
  }
  
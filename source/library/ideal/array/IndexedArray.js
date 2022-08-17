"use strict";

/*

    IndexedArray

    A subclass of Array that maintains an dictionary index of the 
    elements of the list via a index closure. The index closure should return 
    a string. For this to work, you need to avoid using the Array 
    operations which can't be overridden:
    
        a[i] -> instead use a.at(i) 
        a[i] = b -> instead use a.atPut(i, b)
        delete a[i] -> instead use a.removeAt(i)
    
    Efficiency:

        The index is produced lazily, so there's (practically) no cost if it isn't used.
        TODO: This could be improved by removing didMutate method until needed? 
        Mutations to the array will set needsReindex property to true.
        On accessing the index (e.g. calling itemForIndexKey(key)), the 
        index will be updated, if needed.

        This could be optimized by overloading some of the mutation operations
        and adding and removing the index as needed without setting the needsReindex to true.
    
    Example use:

        const ia = IndexedArray.clone()
        ia.setIndexClosure(item => item.hash())
        ia.push(someItem) // this will trigger reindex
        const hasItem = is.itemForIndexKey(someHash) // this is an O(1) operation

*/

(class IndexedArray extends HookedArray {

    initPrototypeSlots () {
        /*
        this.newSlot("index", null)
        this.newSlot("indexClosure", null)
        this.newSlot("needsReindex", false)
        */

        Object.defineSlot(this, "_index", null)
        Object.defineSlot(this, "_indexClosure", null)
        Object.defineSlot(this, "_needsReindex", false)
    }

    init () {
        super.init()
        this.setIndex(new Map())
    }

    // index

    setIndex (aMap) {
        this._index = aMap
        return this
    }

    index () {
        if (this._needsReindex) {
            this.reindex()
        }
        return this._index
    }

    // index closure

    setIndexClosure (aFunction) {
        if (aFunction !== this._indexClosure) {
            this._indexClosure = aFunction
            this.setNeedsReindex(true)
        }
        return this
    }

    indexClosure () {
        return this._indexClosure
    }

    isIndexed () {
        return Type.isFunction(this._indexClosure)
    }

    // --- lazy reindexing ---

    setNeedsReindex (aBool) {
        this._needsReindex = aBool
        return this
    }

    needsReindex () {
        return this._needsReindex
    }

    reindex () {
        this.setNeedsReindex(false) // do this first to avoid infinite loop
        this._index.clear()
        this.forEach( v => this.addItemToIndex(v) )
        return this
    }

    hasIndexedItem (anObject) {
        const key = this.indexKeyForItem(anObject)
        return !Type.isUndefined(this.itemForIndexKey(key))
    }

    didMutate (slotName, optionalValue) {
        super.didMutate(slotName, optionalValue)

        if (this._indexClosure && !this._needsReindex && optionalValue) {
            // If we don't already need to reindex, 
            // check if we can avoid it.
            // These cover the common use cases.

            /*
            if (slotName === "push") {
                // need to add a way to handle multiple arguments first
                optionalArguments.forEach(v => this.addItemToIndex(v))
                return
            }
            */

            if (slotName === "atPut") {
                // We can just add it, instead of doing a fill reindex.
                this.addItemToIndex(optionalValue)
                return
            }

            if (slotName === "removeAt") {
                if (!this.contains(optionalValue)) {
                    // No copies of this value in the array, 
                    // so we can just remove it from the index.
                    this.removeItemFromIndex(optionalValue)
                    return
                }
            }
        }

        this.setNeedsReindex(true)
    }

    // accessing index - public

    itemForIndexKey (key) { // public
        //if (this.hasIndexKey(key)) {
        return this.index().get(key)
        //}
    }

    indexHasItem (v) { // public
        assert(this.isIndexed()) 
        const key = this.indexClosure()(v)
        return this.hasIndexKey(key)
    }

    // indexing - private

    hasIndexKey (key) { // private
        return this._index.has(key)
    }

    indexKeyForItem (v) { // private
        const key = this.indexClosure()(v)
        return key
    }

    addItemToIndex (v) { // private
        const key = this.indexKeyForItem(v)
        assert(Type.isString(key))
        this._index.set(key, v)
        return this
    }

    removeItemFromIndex (v) { // private
        const key = this.indexKeyForItem(v)
        this._index.delete(key)
        return this
    }

    // --------------------------------

    static selfTest () {
        let ia = IndexedArray.clone()
        ia.setIndexClosure(v => v.toString())
        ia.push(123)
        let result = ia.itemForIndexKey("123")
        assert(result === 123)
        return this
    }

}.initThisClass()); 

//IndexedArray.selfTest()

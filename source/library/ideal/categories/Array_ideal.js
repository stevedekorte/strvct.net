"use strict";

/**
 * @module library.ideal
 * @class
 * @extends Array
 * Extends the native Array with additional utility methods.
 */
(class Array_ideal extends Array {

    /**
     * @returns {string} The JSON type for an Array which is "array".
     */
    static jsonType () {
        return "array";
    }

    /**
     * @returns {Object} The JSON Schema reference for the Array class.
     */
    static jsonSchemaRef (refSet) {
        refSet.add(this);
        return {
            "type": this.jsonType() // is this correct??????????????
        };
    }


    /**
     * Creates a new instance of Array_ideal and copies the elements from the provided array.
     * @param {Array} anArray - The array to copy elements from.
     * @returns {Array_ideal} A new instance of Array_ideal with the copied elements.
     */
    static withArray (anArray) {
        return this.clone().copyFrom(anArray);
    }

    /**
     * Makes the forEach method safe by saving the original method and replacing it with safeForEach.
     * See the safeForEach method for more information.
     */
    static makeForEachSafe () {
        if (this.prototype._forEachMethod === undefined) {
            // save the original method
            this.prototype._forEachMethod = this.prototype.forEach;
        }
        this.prototype.forEach = this.prototype.safeForEach;
    }

    /**
     * Creates a new array from an iterator.
     * @param {Iterator} iterator - The iterator to create the array from.
     * @returns {Array} A new array containing the values from the iterator.
     */
    static fromIterator (iterator) {
        const results = [];
        let entry = iterator.next();
        while (!entry.done) {
            results.push(entry.value);
            entry = iterator.next();
        }
        return results;
    }

    /**
     * Creates a shallow copy of the array.
     * @returns {Array_ideal} A shallow copy of the array.
     */
    duplicate () {
        return this.shallowCopy();
    }

    /**
     * Creates a shallow copy of the array.
     * @returns {Array_ideal} A shallow copy of the array.
     */
    shallowCopy () {
        return this.slice();
    }

    /**
     * Creates a deep copy of the array.
     * @param {Map} [refMap=new Map()] - A map used to handle circular references.
     * @returns {Array_ideal} A deep copy of the array.
     */
    deepCopy (refMap = new Map()) {
        const newArray = new this.constructor();

        this.forEachV(v => {
            newArray.push(Type.deepCopyForValue(v, refMap));
        });

        assert(this.length === newArray.length, "deepCopy failed: new array length is different.");
        return newArray;
    }

    /**
     * Removes all elements from the array.
     * @returns {Array_ideal} The cleared array.
     */
    clear () {
        while (this.length) {
            this.pop();
        }
        return this;
    }

    /**
     * Copies the elements from the provided array into the current array.
     * @param {Array} anArray - The array to copy elements from.
     * @returns {Array_ideal} The current array with the copied elements.
     */
    copyFrom (anArray) {
        this.clear();
        anArray.forEach(v => this.push(v));
        return this;
    }

    /**
     * Iterates over the elements of the array in a safe manner.
     * @param {Function} func - The function to call for each element.
     */
    safeForEach (func) {
        this.shallowCopy().forEach(v => func(v));
    }

    /**
     * Iterates over the elements of the array.
     * @param {Function} func - The function to call for each element.
     */
    forEachV (func) {
        this.forEach(v => func(v));
    }

    /**
     * Iterates over the elements of the array with their indices.
     * @param {Function} func - The function to call for each element.
     */
    forEachKV (func) {
        let i = 0;
        this.forEach((v) => {
            func(i, v);
            i++;
        });
    }

    /**
     * Iterates over the elements of the array in reverse order with their indices.
     * @param {Function} func - The function to call for each element.
     */
    reverseForEachKV (func) {
        let i = 0;
        this.forEach((v) => {
            func(i, v);
            i++;
        });
    }

    /**
     * @description Checks if the array is empty.
     * @returns {boolean} True if the array is empty, false otherwise.
     */
    isEmpty () {
        return this.length === 0;
    }

    /**
     * Checks if the array is equal to another array.
     * @param {Array} otherArray - The array to compare with.
     * @returns {boolean} True if the arrays are equal, false otherwise.
     */
    isEqual (otherArray) {
        if (Type.isNullOrUndefined(otherArray)) {
            return false;
        }

        if (otherArray.length === undefined) {
            return false;
        }

        if (this.length !== otherArray.length) {
            return false;
        }

        for (let i = 0; i < this.length; i++) {
            const v1 = this[i];
            const v2 = otherArray[i];
            if (v1 !== v2) {
                if (v1.isEqual && v2.isEqual) {
                    if (!v1.isEqual(v2)) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Returns the number of elements in the array.
     * @returns {number} The number of elements in the array.
     */
    size () {
        return this.length;
    }

    /**
     * Returns the element at the specified index, wrapping around if the index is negative.
     * @param {number} index - The index of the element to retrieve.
     * @returns {*} The element at the specified index.
     */
    atWrap (index) {
        if (index < 0) {
            return this[this.length + index];
        }

        return this[index];
    }

    /**
     * Removes the element at the specified index.
     * @param {number} index - The index of the element to remove.
     * @returns {Array_ideal} The current array after removing the element.
     */
    removeAt (index) {
        if (index >= 0 && index < this.length) {
            const v = this[index];
            this.willMutate("removeAt", v);
            this.splice(index, 1);
            this.didMutate("removeAt", v);
        }
        return this;
    }

    /**
     * Sets the element at the specified index.
     * @param {number} index - The index to set the element at.
     * @param {*} v - The value to set.
     * @returns {Array_ideal} The current array after setting the element.
     */
    atPut (index, v) {
        this.willMutate("atPut", v);
        if (v === null && !this._allowsNulls) {
            throw new Error("attempt to add null to Array that does not allow them");
        }
        this[index] = v;
        this.didMutate("atPut", v);
        return this;
    }

    /**
     * Returns the first element of the array.
     * @returns {*} The first element of the array.
     */
    first () {
        return this.at(0);
    }

    /**
     * Returns the second element of the array.
     * @returns {*} The second element of the array.
     */
    second () {
        return this.at(1);
    }

    /**
     * Returns a new array containing all elements except the first one.
     * @returns {Array_ideal} A new array containing all elements except the first one.
     */
    rest () {
        return this.slice(1);
    }

    /**
     * Returns the last element of the array.
     * @returns {*} The last element of the array.
     */
    last () {
        return this.at(this.length - 1);
    }

    /**
     * Returns the last N elements of the array.
     * @param {number} n - The number of elements to return.
     * @returns {Array_ideal} A new array containing the last N elements.
     */
    lastN (n) {
        if (n === 0 || this.length === 0) {
            return [];
        }

        if (this.length < n) {
            return this.slice();
        }

        return this.slice(-n);
    }

    /**
     * Returns the second to last element of the array.
     * @returns {*} The second to last element of the array.
     */
    secondToLast () {
        return this.at(this.length - 2);
    }

    /**
     * Checks if the array contains the specified element.
     * @param {*} element - The element to check for.
     * @returns {boolean} True if the element is found, false otherwise.
     */
    contains (element) {
        return this.includes(element);
    }

    /**
     * Checks if the array contains any of the elements in the provided array.
     * @param {Array} anArray - The array of elements to check for.
     * @returns {boolean} True if any of the elements are found, false otherwise.
     */
    containsAny (anArray) {
        return anArray.canDetect(item => this.contains(item));
    }

    /**
     * Removes duplicate elements from the array.
     * @returns {Array_ideal} The current array after removing duplicates.
     */
    removeDuplicates () {
        const u = this.unique();
        if (this.length !== u.length) {
            this.copyFrom(u);
        }
        return this;
    }

    /**
     * Checks if the array has duplicate elements.
     * @returns {boolean} True if duplicates are found, false otherwise.
     */
    hasDuplicates () {
        if (this.length > 100) {
            return this.hasDuplicates_setImplementation();
        } else {
            return this.hasDuplicates_indexOfImplementation();
        }
    }

    /**
     * Checks if the array has duplicate elements using a Set implementation.
     * @returns {boolean} True if duplicates are found, false otherwise.
     */
    hasDuplicates_setImplementation () {
        const set = new Set();
        for (let i = 0; i < this.length - 1; i++) {
            const v = this[i];
            if (set.has(v)) {
                console.warn("found duplicate of ", v);
                return true;
            } else {
                set.add(v);
            }
        }
        return false;
    }

    /**
     * Checks if the array has duplicate elements using indexOf implementation.
     * @returns {boolean} True if duplicates are found, false otherwise.
     */
    hasDuplicates_indexOfImplementation () {
        for (let i = 0; i < this.length - 1; i++) {
            const v = this[i];
            if (this.indexOf(v, i + 1) !== -1) {
                console.warn("found duplicate of ", v);
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the array has the specified prefix.
     * @param {Array} otherArray - The array to check for as a prefix.
     * @returns {boolean} True if the array has the specified prefix, false otherwise.
     */
    hasPrefix (otherArray) {
        if (this.length < otherArray.length) {
            return false;
        }

        for (let i = 0; i < this.length; i++) {
            if (this.at(i) !== otherArray.at(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Returns the element after the specified element in the array.
     * @param {*} v - The element to find the next element after.
     * @returns {*} The element after the specified element, or null if not found.
     */
    itemAfter (v) {
        let i = this.indexOf(v);

        if (i === -1) {
            return null;
        }

        i = i + 1;

        if (i > this.length - 1) {
            return null;
        }

        if (this.at(i) !== undefined) {
            return this.at(i);
        }

        return null;
    }

    /**
     * Returns the element before the specified element in the array.
     * @param {*} v - The element to find the previous element before.
     * @returns {*} The element before the specified element, or null if not found.
     */
    itemBefore (v) {
        let i = this.indexOf(v);

        if (i === -1) {
            return null;
        }

        i = i - 1;

        if (i < 0) {
            return null;
        }

        if (this.at(i)) {
            return this.at(i);
        }

        return null;
    }

    /**
     * Creates a deep copy of the array, calling the copy method on each element if it exists.
     * @param {Object} copyDict - An optional dictionary to pass to the copy method.
     * @returns {Array_ideal} A deep copy of the array.
     */
    copy (copyDict) {
        return this.slice().map((v) => {
            if (v.copy) {
                return v.copy(copyDict);
            } else {
                return v;
            }
        });
    }

    /**
     * Splits the array into multiple sub-arrays.
     * @param {number} subArrayCount - The number of sub-arrays to create.
     * @returns {Array<Array_ideal>} An array of sub-arrays.
     */
    split (subArrayCount) {
        const subArrays = [];
        const subArraySize = Math.ceil(this.length / subArrayCount);

        for (let i = 0; i < this.length; i += subArraySize) {
            let subArray = this.slice(i, i + subArraySize);
            if (subArray.length < subArraySize) {
                let lastSubArray = subArrays.pop();
                if (lastSubArray) {
                    subArray = lastSubArray.concat(subArray);
                }
            }
            subArrays.push(subArray);
        }

        return subArrays;
    }

    /**
     * Inserts an element at the specified index.
     * @param {number} i - The index to insert the element at.
     * @param {*} e - The element to insert.
     * @returns {Array_ideal} The current array after inserting the element.
     */
    atInsert (i, e) {
        this.splice(i, 0, e);
        return this;
    }

    /**
     * Inserts multiple elements at the specified index.
     * @param {number} i - The index to insert the elements at.
     * @param {Array} items - The elements to insert.
     * @returns {Array_ideal} The current array after inserting the elements.
     */
    atInsertItems (i, items) {
        let n = i;
        items.forEach(item => {
            this.atInsert(n, item);
            n++;
        });
        return this;
    }

    /**
     * Appends one or more elements to the end of the array.
     * @param {...*} elements - The elements to append.
     * @returns {Array_ideal} The current array after appending the elements.
     */
    append () {
        this.appendItems.call(this, arguments);
        return this;
    }

    /**
     * Appends multiple elements to the end of the array.
     * @param {Array} elements - The elements to append.
     * @returns {Array_ideal} The current array after appending the elements.
     */
    appendItems (elements) {
        this.push.apply(this, elements);
        return this;
    }

    /**
     * Appends multiple elements to the end of the array if they are not already present.
     * @param {Array} elements - The elements to append.
     * @returns {Array_ideal} The current array after appending the elements.
     */
    appendItemsIfAbsent (elements) {
        this.appendIfAbsent.apply(this, elements);
        return this;
    }

    /**
     * Moves multiple items to a specified index in the array.
     * @param {Array} movedItems - The items to move.
     * @param {number} anIndex - The index to move the items to.
     * @returns {Array_ideal} The current array after moving the items.
     */
    moveItemsToIndex (movedItems, anIndex) {
        const newArray = this.shallowCopy();
        let insertIndex = anIndex;

        movedItems.forEach(item => assert(this.contains(item)));

        movedItems.forEach(item => {
            const i = this.indexOf(item);
            if (i == -1) {
                throw new Error("this isn't handled yet");
            }

            if (i < insertIndex) {
                insertIndex--;
            }
            newArray.remove(item);
        });

        movedItems.reversed().forEach(item => {
            newArray.atInsert(insertIndex, item);
        });

        this.copyFrom(newArray);
        return this;
    }

    /**
     * Prepends an element to the beginning of the array.
     * @param {*} e - The element to prepend.
     * @returns {Array_ideal} The current array after prepending the element.
     */
    prepend (e) {
        this.unshift(e);
        return this;
    }

    /**
     * Appends one or more elements to the end of the array if they are not already present.
     * @param {...*} elements - The elements to append.
     * @returns {boolean} True if any elements were appended, false otherwise.
     */
    appendIfAbsent () {
        const elements = Array.from(arguments);
        let appended = false;

        elements.forEach((value) => {
            if (!this.contains(value)) {
                this.push(value);
                appended = true;
            }
        });

        return appended;
    }

    /**
     * Removes all elements from the array.
     * @returns {Array_ideal} The current array after removing all elements.
     */
    removeAll () {
        while (this.length) {
            this.pop();
        }
        return this;
    }

    /**
     * Removes the specified element from the array.
     * @param {*} e - The element to remove.
     * @returns {Array_ideal} The current array after removing the element.
     */
    remove (e) {
        const i = this.indexOf(e);
        if (i !== -1) {
            this.removeAt(i);
        }
        return this;
    }

    /**
     * Returns a new array with all empty values removed.
     * @returns {Array_ideal} A new array with all empty values removed.
     */
    emptiesRemoved () {
        return this.filter(v => !Type.isNullOrUndefined(v));
    }

    /**
     * Removes and returns the first element of the array.
     * @returns {*} The first element of the array.
     */
    removeFirst () {
        return this.shift();
    }

    /**
     * Removes and returns the last element of the array.
     * @returns {*} The last element of the array.
     */
    removeLast () {
        return this.pop();
    }

    /**
     * Removes multiple elements from the array.
     * @param {Array} elements - The elements to remove.
     * @returns {Array_ideal} The current array after removing the elements.
     */
    removeItems (elements) {
        elements.forEach(e => this.remove(e));
        return this;
    }

    /**
     * Removes all elements from the array.
     * @returns {Array_ideal} The current array after removing all elements.
     */
    empty () {
        this.splice(0, this.length);
        return this;
    }

    /**
     * Shuffles the elements of the array in-place.
     * @returns {Array_ideal} The shuffled array.
     */
    shuffle () {
        let i = this.length;

        if (i === 0) {
            return false;
        }

        while (--i) {
            const j = Math.floor(Math.random() * (i + 1));
            const tempi = this.at(i);
            const tempj = this.at(j);
            this.atPut(i, tempj);
            this.atPut(j, tempi);
        }

        return this;
    }

    /**
     * Returns a random element from the array.
     * @returns {*} A random element from the array.
     */
    atRandom () {
        const i = Math.floor(Math.random() * this.length);
        return this.at(i);
    }

    /**
     * Returns a random element from the array using a cryptographically secure random number generator.
     * @returns {*} A random element from the array.
     */
    pickOneAtRandom () {
        if (this.length === 0) {
            return undefined;
        }

        const randomBuffer = new Uint32Array(2);
        crypto.getRandomValues(randomBuffer);

        const SHIFT_AMOUNT = 21;
        const MAX_SAFE_VALUE = 9007199254740991;

        const randomValue = (randomBuffer[0] * (1 << SHIFT_AMOUNT)) + (randomBuffer[1] >>> (32 - SHIFT_AMOUNT));
        const randomIndex = Math.floor((randomValue / MAX_SAFE_VALUE) * this.length);

        return this[randomIndex];
    }

    /**
     * Removes and returns a random element from the array.
     * @returns {*} The removed random element.
     */
    removeOneAtRandom () {
        const pick = this.pickOneAtRandom();
        this.remove(pick);
        return pick;
    }

    /**
     * Iterates over the elements of the array and calls the specified method on each element if it exists.
     * @param {string} methodName - The name of the method to call.
     * @param {*} arg1 - The first argument to pass to the method.
     * @param {*} arg2 - The second argument to pass to the method.
     * @param {*} arg3 - The third argument to pass to the method.
     * @returns {Array_ideal} The current array.
     */
    forEachPerformIfResponds (methodName, arg1, arg2, arg3) {
        this.forEach((item) => {
            if (item) {
                const f = item[methodName];
                if (f) {
                    f.call(item, arg1, arg2, arg3);
                }
            }
        });
        return this;
    }

    /**
     * Iterates over the elements of the array and calls the specified method on each element.
     * @param {string} methodName - The name of the method to call.
     * @param {*} arg1 - The first argument to pass to the method.
     * @param {*} arg2 - The second argument to pass to the method.
     * @param {*} arg3 - The third argument to pass to the method.
     * @returns {Array_ideal} The current array.
     */
    forEachPerform (methodName, arg1, arg2, arg3) {
        this.forEach((item) => {
            if (item) {
                const f = item[methodName];
                if (f) {
                    f.call(item, arg1, arg2, arg3);
                } else {
                    throw new Error(Type.typeName(item) + " does not respond to '" + methodName + "'");
                }
            }
        });
        return this;
    }

    /**
     * Sorts the elements of the array in-place based on the specified method.
     * @param {string} functionName - The name of the method to call on each element.
     * @returns {Array_ideal} The sorted array.
     */
    sortPerform (functionName) {
        const args = this.slice.call(arguments).slice(1);
        return this.sort(function (x, y) {
            const xRes = x[functionName].apply(x, args);
            const yRes = y[functionName].apply(y, args);
            if (xRes < yRes) {
                return -1;
            } else if (yRes < xRes) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * Returns a new array containing the values of the specified property for each element.
     * @param {string} propertyName - The name of the property to map.
     * @returns {Array} A new array containing the mapped values.
     */
    mapProperty (propertyName) {
        return this.map(e => e[propertyName]);
    }

    /**
     * Creates a Map where the keys are unique values of the specified property and the values are the corresponding elements.
     * @param {string} propertyName - The name of the property to use as keys.
     * @param {boolean} [ignoreCollisions=false] - Whether to ignore collisions (duplicate keys) or throw an error.
     * @returns {Map} A Map containing the unique index.
     */
    uniqueIndexMapForProperty (propertyName, ignoreCollisions = false) {
        const m = new Map();
        this.forEach(entry => {
            const k = entry[propertyName];
            if (!m.has(k)) {
                m.set(k, entry);
            } else {
                if (!ignoreCollisions) {
                    const msg = "Array found two of the same value ('" + k + "') while building a uniqueIndexMap for property '" + propertyName + "'";
                    console.warn(msg);
                    throw new Error(msg);
                }
            }
        });
        return m;
    }

    /**
     * Creates a Map where the keys are values of the specified property and the values are arrays of corresponding elements.
     * @param {string} propertyName - The name of the property to use as keys.
     * @returns {Map} A Map containing the index.
     */
    indexMapForProperty (propertyName) {
        const m = new Map();
        this.forEach(entry => {
            const k = entry[propertyName];
            if (m.has(k)) {
                const array = m.get(k);
                array.push(entry);
            } else {
                m.set(k, [entry]);
            }
        });
        return m;
    }

    /**
     * Creates a Map where the keys are the results of calling the specified method on each element and the values are arrays of corresponding elements.
     * @param {string} methodName - The name of the method to call on each element.
     * @returns {Map} A Map containing the index.
     */
    indexMapForMethodName (methodName) {
        const m = new Map();
        this.forEach(entry => {
            const k = entry[methodName].apply(entry);
            if (m.has(k)) {
                const array = m.get(k);
                array.push(entry);
            } else {
                m.set(k, [entry]);
            }
        });
        return m;
    }

    /**
     * Checks if the array contains an element that satisfies the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {boolean} True if an element satisfies the condition, false otherwise.
     */
    canDetect (func) {
        const result = this.detect(func);
        return result !== undefined && result !== null;
    }

    /**
     * Returns the first element that satisfies the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {*} The first element that satisfies the condition, or null if not found.
     */
    detect (func) {
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i);
            if (func(v, i)) {
                return v;
            }
        }

        return null;
    }

    /**
     * Returns the first element that satisfies the specified condition, starting from the end of the array.
     * @param {Function} func - The condition function to check for.
     * @returns {*} The first element that satisfies the condition, or null if not found.
     */
    reverseDetect (func) {
        for (let i = this.length - 1; i > -1; i--) {
            const v = this.at(i);
            if (func(v, i)) {
                return v;
            }
        }

        return null;
    }

    /**
     * Returns the first non-false return value of the specified function.
     * @param {Function} func - The function to call for each element.
     * @returns {*} The first non-false return value, or null if not found.
     */
    detectAndReturnValue (func) {
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i);
            const result = func(v, i);
            if (result) {
                return result;
            }
        }

        return null;
    }

    /**
     * Returns the first element that satisfies the specified method call.
     * @param {string} functionName - The name of the method to call.
     * @param {...*} args - The arguments to pass to the method.
     * @returns {*} The first element that satisfies the method call, or null if not found.
     */
    detectPerform (functionName) {
        const args = this.slice.call(arguments).slice(1);
        return this.detect((value /*, index*/) => {
            return value[functionName].apply(value, args);
        });
    }

    /**
     * Returns the first element that has the specified property value.
     * @param {string} slotName - The name of the property to check.
     * @param {*} slotValue - The value of the property to check for.
     * @returns {*} The first element that has the specified property value, or null if not found.
     */
    detectProperty (slotName, slotValue) {
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i);
            if (v[slotName] === slotValue) {
                return v;
            }
        }

        return null;
    }

    /**
     * Returns the index of the first element that satisfies the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {number} The index of the first element that satisfies the condition, or null if not found.
     */
    detectIndex (func) {
        for (let i = 0; i < this.length; i++) {
            if (func(this.at(i), i)) {
                return i;
            }
        }

        return null;
    }

    /**
     * Returns a new array with all null values removed.
     * @returns {Array_ideal} A new array with all null values removed.
     */
    nullsRemoved () {
        return this.filter(v => !Type.isNull(v));
    }

    /**
     * Returns a new array containing only the elements that do not satisfy the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {Array_ideal} A new array containing only the elements that do not satisfy the condition.
     */
    reject (func) {
        return this.filter(v => !func(v));
    }

    /**
     * Returns an array containing the index and value of the maximum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {Array} An array containing the index and value of the maximum element.
     */
    maxEntry (optionalFunc) {
        const length = this.length;
        const mEntry = [undefined, undefined];

        for (let i = 0; i < length; i++) {
            let v = this.at(i);
            if (optionalFunc) {
                v = optionalFunc(v);
            }

            if (mEntry[1] === undefined || v > mEntry[1]) {
                mEntry[0] = i;
                mEntry[1] = v;
            }
        }

        return mEntry;
    }

    /**
     * Returns the index of the maximum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {number} The index of the maximum element.
     */
    maxIndex (optionalFunc) {
        return this.maxEntry(optionalFunc)[0];
    }

    /**
     * Returns the value of the maximum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @param {*} [theDefault] - An optional default value to return if the array is empty.
     * @returns {*} The value of the maximum element.
     */
    maxValue (optionalFunc, theDefault) {
        const entry = this.maxEntry(optionalFunc);
        if (entry[1] === undefined) {
            return theDefault;
        }
        return entry[1];
    }

    /**
     * Returns the maximum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {*} The maximum element.
     */
    maxItem (optionalFunc) {
        return this.at(this.maxIndex(optionalFunc));
    }

    /**
     * Returns an array containing the index and value of the minimum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {Array} An array containing the index and value of the minimum element.
     */
    minEntry (optionalFunc) {
        const length = this.length;
        const mEntry = [undefined, undefined];

        for (let i = 0; i < length; i++) {
            let v = this[i];
            if (optionalFunc) {
                v = optionalFunc(v);
            }

            if (mEntry[1] === undefined || v < mEntry[1]) {
                mEntry[0] = i;
                mEntry[1] = v;
            }
        }

        return mEntry;
    }

    /**
     * Returns the index of the minimum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {number} The index of the minimum element.
     */
    minIndex (optionalFunc) {
        return this.maxEntry(optionalFunc)[0];
    }

    /**
     * Returns the value of the minimum element in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before comparing.
     * @returns {*} The value of the minimum element.
     */
    minValue (optionalFunc) {
        return this.minEntry(optionalFunc)[1];
    }

    /**
     * Returns the sum of all elements in the array.
     * @param {Function} [optionalFunc] - An optional function to apply to each element before summing.
     * @returns {number} The sum of all elements.
     */
    sum (optionalFunc) {
        let sum = 0;
        const length = this.length;

        for (let i = 0; i < length; i++) {
            let v = this.at(i);
            if (optionalFunc) {
                v = optionalFunc(v);
            }

            sum = sum + v;
        }

        return sum;
    }

    /**
     * Returns the average of all elements in the array.
     * @returns {number} The average of all elements.
     */
    average () {
        if (this.length === 0) {
            return 0;
        }
        return this.sum() / this.length;
    }

    /**
     * Returns a new array with duplicate elements removed.
     * @returns {Array_ideal} A new array containing only unique elements.
     */
    unique () {
        return Array.from(new Set(this));
    }

    /**
     * Converts the array to a Set object.
     * @returns {Set} A new Set containing the array's elements.
     */
    asSet () {
        return new Set(this)
    }

    /**
     * Returns a new array with the elements in reverse order.
     * @returns {Array_ideal} A new array with the elements reversed.
     */
    reversed () {
        return this.shallowCopy().reverse();
    }

    /**
     * Converts the array to a path string.
     * @returns {string} A string representation of the array as a path.
     */
    asPath () {
        if (this.length === 1 && this.first() === "") {
            return "/";
        }
        else {
            return this.join("/");
        }
    }

    /**
     * Checks if the array represents an absolute path.
     * @returns {boolean} True if the array represents an absolute path, false otherwise.
     */
    isAbsolutePath () {
        return this.first() === "";
    }

    /**
     * Checks if the array represents a relative path.
     * @returns {boolean} True if the array represents a relative path, false otherwise.
     */
    isRelativePath () {
        return this.first() !== "";
    }

    /**
     * Filters the array in-place, removing elements that do not satisfy the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {Array_ideal} The filtered array.
     */
    filterInPlace (func) {
        for (let i = this.length - 1; i >= 0; i--) {
            const v = this.at(i);
            if (!func(v)) {
                this.removeAt(i)
            }
        }
        return this
    }

    /**
     * Returns a new array containing only the elements that satisfy the specified condition.
     * @param {Function} func - The condition function to check for.
     * @returns {Array_ideal} A new array containing only the elements that satisfy the condition.
     */
    select (func) {
        return this.filter(func)
    }

    /**
     * Returns a new array containing all elements after the specified element.
     * @param {*} v - The element to search for.
     * @returns {Array_ideal} A new array containing all elements after the specified element.
     */
    after (v) {
        const index = this.indexOf(v);

        if (index === -1) {
            return [];
        }

        return this.slice(index + 1);
    }

    /**
     * Returns a new array containing all elements before the specified element.
     * @param {*} v - The element to search for.
     * @returns {Array_ideal} A new array containing all elements before the specified element.
     */
    before (v) {
        const index = this.indexOf(v);

        if (index === -1) {
            return this.slice();
        }

        return this.slice(0, index);
    }

    /**
     * Replaces all occurrences of a specified value with a new value in the array.
     * @param {*} oldValue - The value to replace.
     * @param {*} newValue - The new value to replace with.
     * @returns {Array_ideal} The modified array.
     */
    replaceOccurancesOfWith (oldValue, newValue) {
        // isMutator
        for (let i = 0; i < this.length; i++) {
            if (this.at(i) === oldValue) {
                this.atPut(i, newValue);
            }
        }
        return this
    }

    /**
     * Removes all occurrences of a specified value from the array.
     * @param {*} e - The value to remove.
     * @returns {Array_ideal} The modified array.
     */
    removeOccurancesOf (e) {
        // isMutator
        for (let i = this.length - 1; i >= 0; i--) {
            const v = this.at(i);
            if (v === e) {
                this.removeAt(i)
            }
        }
        return this;
    }

    /**
     * Joins the elements of the array into a new array, inserting a separator between each element.
     * @param {Function} aFunc - The function to call for each element to get the separator.
     * @returns {Array} A new array containing the joined elements.
     */
    joinWithFunc (aFunc) {
        // not a mutator
        // like join, but calls aFunc with the array and index as arguments
        // to get each new item to insert between array items
        const joined = []
        for (let i = 0; i < this.length; i++) {
            const v = this[i]
            joined.push(v)
            if (i < this.length - 1) {
                const separator = aFunc(this, i)
                joined.push(separator)
            }
        }
        return joined
    }

    /**
     * Returns a new array containing all elements before the specified element.
     * @param {*} item - The element to search for.
     * @returns {Array_ideal} A new array containing all elements before the specified element.
     */
    itemsBefore (item) {
        const index = this.indexOf(item);
        if (index !== -1) {
            return this.slice(0, index);
        }
        return this
    }

    /**
     * Returns a new array containing the union of the elements in this array and another array.
     * @param {Array_ideal} other - The other array.
     * @returns {Array_ideal} A new array containing the union of the elements.
     */
    union (other) {
        let r = this.concat(other).unique()
        return r;
    }

    /**
     * Returns a new array containing the intersection of the elements in this array and another array.
     * @param {Array_ideal} other - The other array.
     * @returns {Array_ideal} A new array containing the intersection of the elements.
     */
    intersection (other) { // returns all items that are present in both
        const thisSet = new Set(this)
        return other.filter((v) => {
            return thisSet.has(v);
        });
    }

    /**
     * Returns a new array containing the elements in another array that are not present in this array.
     * @param {Array_ideal} other - The other array.
     * @returns {Array_ideal} A new array containing the difference of the elements.
     */
    difference (other) { // returns items in other that are not in self
        const thisSet = new Set(this)
        return other.filter(v => !thisSet.has(v));
    }

    /**
     * Returns a new array containing the elements that are present in either this array or another array, but not in both.
     * @param {Array_ideal} other - The other array.
     * @returns {Array_ideal} A new array containing the symmetric difference of the elements.
     */
    symmetricDifference (other) { // returns items in either not present in the other
        let all = this.concat(other)
        const thisSet = new Set(this)
        const otherSet = new Set(other)
        return all.filter(v => !thisSet.has(v) || !otherSet.has(v));
    }

    /**
     * Checks if this array is equal to another array.
     * @param {Array_ideal} array - The other array.
     * @returns {boolean} True if the arrays are equal, false otherwise.
     */
    equals (array /*, visited = new Set()*/) {
        // we want this to work on any object that confroms to the array protocol (length, at, equals are used)
        // array.assertImplementsMethodNamesSet(new Set(["length", "at", "equals"]));
        // ["length", "at", "equals"].forEach(slotName => { assertNotUndefined(array[slotName]) })
        // not just objects of the same JS type
        // but how do we test for the [] accessor?
        // also, how do we deal with circular structures?

        /*
        if (visited.has(this)) {
            return true // ?
        }
        visited.add(this)
        */

        if (array.length === undefined) {
            return false;
        }

        // compare lengths - can save a lot of time 
        if (this.length !== array.length) {
            return false;
        }

        for (let i = 0, l = this.length; i < l; i++) {
            const a = this.at(i)
            const b = array.at(i)

            // Check if we have nested arrays
            /*
                if (this.at(i) instanceof Array && array[i] instanceof Array) {
                    // recurse into the nested arrays
                    if (!this.at(i).equals(array[i]))
                        return false;       
                }     
            */

            if (a.equals && !a.equals(b, visited)) {
                return false;
            } else if (a !== b) {
                // Warning - two different object instances will never be equal: {x:20} !== {x:20}
                return false;
            }
        }

        return true;
    }


    /**
     * Checks if this array contains an element that is equal to a given element.
     * @param {*} b - The element to check for.
     * @returns {boolean} True if the array contains an equal element, false otherwise.
     */
    containsEquals (b) {
        for (let i = 0, l = this.length; i < l; i++) {
            let a = this.at(i)

            if (a.equals) {
                if (!a.equals(b)) {
                    return false;
                }
            } else if (a !== b) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns a 64-bit hash code for the array
     * @returns {number} A 64-bit hash code
     * @category Information
     */
    hashCode64 () {
        let h1 = 0xdeadbeef ^ 0;
        let h2 = 0x41c6ce57 ^ 0;
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i);
            const h = Type.hashCode64(v);
            h1 = Math.imul(h1 ^ h, 2654435761);
            h2 = Math.imul(h2 ^ h, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

}).initThisCategory();


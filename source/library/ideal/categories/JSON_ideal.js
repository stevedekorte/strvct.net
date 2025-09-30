"use strict";

/*

    JSON_ideal

    Some extra methods for JSON.

*/

//(class JSON_ideal extends JSON {

/**
 * Counts the number of nodes in a JSON structure.
 * @param {*} json - The JSON structure to count nodes for.
 * @returns {number} The total number of nodes in the JSON structure.
 * @memberof JSON
 * @category Data Analysis
 */
JSON.nodeCount = function (json) {
    let count = 1; // Start with 1 to count the current node

    if (Array.isArray(json)) {
        // If it's an array, recursively count nodes for each element
        json.forEach(item => {
            count += countJsonNodes(item);
        });
    } else if (typeof json === "object" && json !== null) {
        // If it's an object, recursively count nodes for each property
        Object.values(json).forEach(value => {
            count += countJsonNodes(value);
        });
    }

    return count;
};

/**
 * Stringifies only the JSON compatible values in an object.
 * @param {*} obj - The object to stringify.
 * @returns {string} The stringified object.
 * @memberof JSON
 * @category Data Analysis
 */
JSON.stringifyOnlyJson = function (obj, replacer, space) {
    function filterJsonCompatible (value) {
        if (Array.isArray(value)) {
            return value
                .filter(Type.isJsonType)
                .map(item => filterJsonCompatible(item));
        } else if (typeof value === "object" && value !== null) {
            return Object.keys(value).reduce((acc, key) => {
                if (Type.isJsonType(value[key])) {
                    acc[key] = filterJsonCompatible(value[key]);
                }
                return acc;
            }, {});
        } else {
            return value;
        }
    }

    const filteredObj = filterJsonCompatible(obj);
    return JSON.stringify(filteredObj, replacer, space);
};

/**
 * Stringifies only the JSON compatible values in an object, with stable key order.
 * @param {*} obj - The object to stringify.
 * @returns {string} The stringified object.
 * @memberof JSON
 * @category Data Analysis
 */
JSON.stableStringifyOnlyJson = function (obj, replacer, space) {
    const seen = new WeakSet();  // Track objects to prevent circular references

    function filterJsonCompatible (value) {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return undefined;  // Avoid circular reference
            seen.add(value);

            if (Array.isArray(value)) {
                return value
                    .filter(Type.isJsonType)
                    .map(item => filterJsonCompatible(item));
            } else {
                // Sort object keys and process each property recursively
                return Object.keys(value).sort().reduce((acc, key) => {
                    const propValue = value[key];
                    if (Type.isJsonType(propValue)) {
                        acc[key] = filterJsonCompatible(propValue);
                    }
                    return acc;
                }, {});
            }
        } else {
            return value;
        }
    }

    const filteredObj = filterJsonCompatible(obj);
    return JSON.stringify(filteredObj, replacer, space);
};


JSON.stableStringifyWithStdOptions = function (obj, replacer, space) {
    const opts = {};

    if (replacer) {
        assert(Type.isFunction(replacer));
        opts.replacer = replacer;
    }

    if (space) {
        assert(Type.isNumber(space));
        opts.space = space;
    } else {
        opts.space = 2;
    }

    /*
    if (Object.keys(opts).length === 0) {
        return JSON.stableStringify(obj);
    }
    */
    return JSON.stableStringify(obj, opts);
};


//}).initThisCategory();

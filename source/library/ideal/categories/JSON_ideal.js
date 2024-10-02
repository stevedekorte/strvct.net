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
    } else if (typeof json === 'object' && json !== null) {
        // If it's an object, recursively count nodes for each property
        Object.values(json).forEach(value => {
        count += countJsonNodes(value);
        });
    }
    
    return count;
}
    
//}).initThisCategory();
"use strict";

/*

    JSON_ideal

    Some extra methods for JSON.

*/

//(class JSON_ideal extends JSON {
    
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




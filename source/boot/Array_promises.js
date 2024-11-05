"use strict";
/**
 * @module boot
 */


/**
 * @class Array_promises
 * @extends Array
 * @classdesc Extends the built-in Array class with additional promise-based methods.
 */

(class Array_promises extends Array {

    /**
     * Executes a promise-returning function for each element in the array serially,
     * with a setTimeout between each iteration.
     * @param {function(any): Promise<void>} aPromiseBlock - The function to execute for each element.
     * @returns {Promise<void>}
     */
    async promiseSerialTimeoutsForEach (aPromiseBlock) {
        const nextFunc = async function (array, index) {
            if (array.length === index) {
                return; // finished
            }

            const v = array[index];
            await aPromiseBlock(v);
            setTimeout(() => nextFunc(array, index+1), 1);
        }

        await nextFunc(this, 0);
    }

    /**
     * Executes a promise-returning function for each element in the array serially.
     * @param {function(any): Promise<void>} aBlock - The function to execute for each element.
     * @returns {Promise<void>}
     */
    async promiseSerialForEach (aBlock) {
        for (let i = 0; i < this.length; i++) {
            await aBlock(this[i]);
        }
    }

    /**
     * Executes a promise-returning function for each element in the array in parallel.
     * @param {function(any): Promise<any>} aBlock - The function to execute for each element.
     * @returns {Promise<any[]>} A promise that resolves to an array of the results.
     */
    async promiseParallelMap (aBlock) {
        const promises = this.map(v => aBlock(v));
        const values = await Promise.all(promises);
        return values;
    }

}).initThisCategory();

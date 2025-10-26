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
    async promiseSerialTimeoutsForEach (aPromiseBlock, delay = 0) {
        return new Promise((resolve, reject) => {
            const nextFunc = async function (array, index) {
                try {
                    if (array.length === index) {
                        resolve(); // finished
                        return;
                    }

                    const v = array[index];
                    await aPromiseBlock(v, index, array.length);
                    setTimeout(() => nextFunc(array, index + 1), delay); // TODO: move to addTimeout?
                    //requestIdleCallback(() => nextFunc(array, index+1));
                } catch (error) {
                    reject(error);
                }
            };

            nextFunc(this, 0);
        });
    }

    /**
     * Executes a promise-returning function for each element in the array serially.
     * @param {function(any): Promise<void>} aBlock - The function to execute for each element.
     * @returns {Promise<void>}
     */
    async promiseSerialForEach (aBlock) {
        // Validate that aBlock is an async function
        if (aBlock.constructor.name !== "AsyncFunction") {
            throw new Error("aBlock must be an async function");
        }

        for (let i = 0; i < this.length; i++) {
            try {
                await aBlock(this[i], i);
            } catch (error) {
                console.error(`❌ Error in promiseSerialForEach at index ${i}:`, error);
                console.error("Element:", this[i]);
                console.error("Error type:", typeof error);
                throw error;
            }
        }
    }

    /**
     * Executes a promise-returning function for each element in the array in parallel.
     * @param {function(any): Promise<any>} aBlock - The function to execute for each element.
     * @returns {Promise<any[]>} A promise that resolves to an array of the results.
     */
    async promiseParallelMap (aBlock) {
        assert(aBlock.constructor.name === "AsyncFunction", "aBlock must be an async function");
        const promises = this.map(v => aBlock(v));
        const values = await Promise.all(promises);
        return values;
    }

    async promiseParallelForEach (aBlock) {
        await this.promiseParallelMap(aBlock);
        //await this.parallelForEachWithYield(aBlock);
        //await this.promiseSerialTimeoutsForEach(aBlock);
    }

    /**
     * Executes a promise-returning function for each element in the array with controlled concurrency,
     * using setTimeout between batches for better control flow.
     * @param {function(any, number, number): Promise<void>} asyncBlock - The async function to execute for each element.
     * @param {number} maxConcurrent - Maximum number of concurrent tasks (default: 1).
     * @param {number} delay - Delay in milliseconds between batches (default: 0).
     * @param {function(Error, any, number): void} catchFunc - Optional error handler. If not provided, errors are logged and processing continues.
     * @returns {Promise<void>}
     */
    async promiseConcurrentSerialTimeoutsForEach (asyncBlock, maxConcurrent = 1, delay = 0, catchFunc = null) {
        // Validate that asyncBlock is an async function
        if (asyncBlock.constructor.name !== "AsyncFunction") {
            throw new Error("asyncBlock must be an async function");
        }

        const promise = Promise.clone();
        let currentIndex = 0;
        let activeCount = 0;

        const processBatch = () => {
            // If we've processed all items and no tasks are active, we're done
            if (currentIndex >= this.length && activeCount === 0) {
                promise.callResolveFunc();
                return;
            }

            // Start new tasks up to maxConcurrent limit
            while (activeCount < maxConcurrent && currentIndex < this.length) {
                const index = currentIndex++;
                const value = this[index];
                activeCount++;

                // Execute the async block
                asyncBlock(value, index, this.length)
                    .then(() => {
                        activeCount--;
                        // Use setTimeout to yield control before processing next batch
                        setTimeout(processBatch, delay);
                    })
                    .catch(async (error) => {
                        activeCount--;
                        if (catchFunc) {
                            // Call the provided error handler
                            try {
                                return await catchFunc(error, value, index);
                            } catch (handlerError) {
                                console.error(`❌ Error in catchFunc at index ${index}:`, handlerError);
                            }
                        } else {
                            // Default error handling: log and continue
                            console.error(`❌ Error in promiseConcurrentSerialTimeoutsForEach at index ${index}:`, error);
                            console.error("Element:", value);
                        }
                        // Continue processing next batch
                        setTimeout(processBatch, delay);
                    });
            }
        };
        console.log("promiseConcurrentSerialTimeoutsForEach [on index: " + currentIndex + " of " + this.length + ", active: " + activeCount + " max: " + maxConcurrent + "]");

        // Start processing
        processBatch();

        return promise;
    }

}).initThisCategory();

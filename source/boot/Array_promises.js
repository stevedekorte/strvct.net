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
        return new Promise((resolve, reject) => {
            const nextFunc = async function (array, index) {
                try {
                    if (array.length === index) {
                        resolve(); // finished
                        return;
                    }

                    const v = array[index];
                    await aPromiseBlock(v, index);
                    //setTimeout(() => nextFunc(array, index+1), 0);
                    requestIdleCallback(() => nextFunc(array, index+1));
                } catch (error) {
                    reject(error);
                }
            }

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
        if (aBlock.constructor.name !== 'AsyncFunction') {
            throw new Error("aBlock must be an async function");
        }
        
        for (let i = 0; i < this.length; i++) {
            try {
                await aBlock(this[i], i);
            } catch (error) {
                console.error(`❌ Error in promiseSerialForEach at index ${i}:`, error);
                console.error(`Element:`, this[i]);
                console.error(`Error type:`, typeof error);
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
        assert(aBlock.constructor.name === 'AsyncFunction', "aBlock must be an async function");
        const promises = this.map(v => aBlock(v));
        const values = await Promise.all(promises);
        return values;
    }

    async promiseParallelForEach (aBlock) {
        await this.promiseParallelMap(aBlock);
        //await this.parallelForEachWithYield(aBlock);
        //await this.promiseSerialTimeoutsForEach(aBlock);
    }

    /*
    async parallelForEachWithYield (asyncFn) {
        if (asyncFn.constructor.name !== 'AsyncFunction') {
            throw new Error("aBlock must be an async function");
        }
        const results = [];
        let activePromises = 0;
        const MAX_CONCURRENT = 20; // Limit concurrent operations
        
        for (let i = 0; i < this.length; i++) {
          // Wait if too many active promises
          while (activePromises >= MAX_CONCURRENT) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
          
          activePromises++;
          
          // Start the async operation
          const promise = asyncFn(this[i], i, this).then(
            result => {
              activePromises--;
              results[i] = result;
              return result;
            },
            error => {
              activePromises--;
              throw error;
            }
          );
          
          // Force a micro-pause every single iteration
          // This guarantees the browser gets a chance to render
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Wait for remaining promises
        while (activePromises > 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        return results;
      }
      */
      

}).initThisCategory();

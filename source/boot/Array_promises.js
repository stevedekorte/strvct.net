"use strict";


(class Array_promises extends Array {

    async promiseSerialTimeoutsForEach (aPromiseBlock) {
        const nextFunc = async function (array, index) {
            if (array.length === index) {
                return; // finished
            }

            const v = array[index];
            await aPromiseBlock(v);
            setTimeout(() => nextFunc(array, index+1), 0);
        }

        await nextFunc(this, 0);
    }

    async promiseSerialForEach (aBlock) {
        for (let i = 0; i < this.length; i++) {
            await aBlock(this[i]);
        }
    }


    async promiseParallelMap (aBlock) {
        const promises = this.map(v => aBlock(v));
        const values = await Promise.all(promises);
        return values;
    }

}).initThisCategory();


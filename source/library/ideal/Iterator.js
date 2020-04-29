"use strict"

/*

    Iterator

*/


window.ideal.Iterator = class Iterator extends ProtoClass {

    static fromIter (anIter) {
        return this.clone().setIter(anIter)
    }

    init () {
        this.newSlot("iter", null)
    }

    asList () {
        const resultList = []
        const it = this.iter()
        let result = it.next()
        while (!result.done) {
            resultList.push(result.value)
            result = it.next()
        }
        return resultList
    }

    next () {

    }

}.initThisClass()


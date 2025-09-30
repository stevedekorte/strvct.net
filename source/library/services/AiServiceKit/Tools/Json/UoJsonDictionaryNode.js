"use strict";

/*
* @module library.services.AiServiceKit.ApiCalls
* @class UoJsonDictionaryNode
* @extends SvJsonDictionaryNode
* @classdesc Adds some methods to access the session.
*
*/

(class UoJsonDictionaryNode extends SvJsonDictionaryNode {

    /*
    * @description Returns the session.
    * @returns {UoSession}
    * @category Accessors
    */

    session () {
        return this.firstOwnerChainNodeOfClass(UoSession);
    }

}.initThisClass());

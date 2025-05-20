"use strict";

/*
* @module library.services.AiServiceKit.ApiCalls
* @class UoJsonDictionaryNode
* @extends BMJsonDictionaryNode
* @classdesc Adds some methods to access the session.
* 
*/

(class UoJsonDictionaryNode extends BMJsonDictionaryNode {

  /*
   * @description Returns the session.
   * @returns {UoSession}
   * @category Accessors
   */

  session () {
    return this.firstOwnerChainNodeOfClass(UoSession);
  }

}.initThisClass());

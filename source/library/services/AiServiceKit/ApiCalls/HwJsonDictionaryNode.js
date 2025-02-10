"use strict";

/*
* @module library.services.AiServiceKit.ApiCalls
* @class HwJsonDictionaryNode
* @extends BMJsonDictionaryNode
* @classdesc Adds some methods to access the session.
* 
*/

(class HwJsonDictionaryNode extends BMJsonDictionaryNode {

  /*
   * @description Returns the session.
   * @returns {HwSession}
   * @category Accessors
   */

  session () {
    const chain = this.ownershipChain();
    const session = chain.detect(node => node instanceof HwSession);
    return session;
  }



}.initThisClass());

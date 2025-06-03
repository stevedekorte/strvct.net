/**
 * @module library.services.Leonardo.RefImages
 */

"use strict";

/**
 * @class LeonardoRefImages
 * @extends SvSummaryNode
 * @classdesc Represents a collection of Leonardo generated images.
 * 
 * 
  Notes on managing reference images:
  
  POST /init‐image → upload (generate a new initImageId)
  GET /init‐image/{id} → fetch metadata for a single image by its ID
  DELETE /init‐image/{id} → remove a single image by its ID

  Check for exiting ref images and use them as character references

curl -X GET \
  "https://cloud.leonardo.ai/api/rest/v1/init-image/<INIT_IMAGE_ID>" \
  -H "Authorization: Bearer $LEONARDO_API_KEY"


 */
(class LeonardoRefImages extends SvSummaryNode {

  /**
   * @description Initializes the prototype slots for the LeonardoRefImages class.
   * @category Initialization
   */
  initPrototypeSlots () {
    this.setTitle("image results");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([LeonardoRefImage]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
    this.setNoteIsSubnodeCount(true);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Reference Images");
  }

  /**
   * @description Checks if all images have been loaded.
   * @returns {boolean} True if all images are loaded, false otherwise.
   * @category Status
   */
  hasLoadedAllImages () {
    return !this.subnodes().canDetect(sn => !sn.isLoaded())
  }

  /**
   * @description Checks if there is an error in any of the subnodes.
   * @returns {boolean} True if there is an error, false otherwise.
   * @category Status
   */
  hasError () {
    return this.subnodes().canDetect(sn => sn.hasError())
  }

  /**
   * @description Checks if any of the subnodes are still loading.
   * @returns {boolean} True if any subnode is loading, false otherwise.
   * @category Status
   */
  isLoading () {
    return this.subnodes().canDetect(sn => sn.isLoading())
  }

}.initThisClass());
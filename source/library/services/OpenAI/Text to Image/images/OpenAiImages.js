"use strict";

/* 
    OpenAiImages

*/

(class OpenAiImages extends BMSummaryNode {

  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("image results");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiImage]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
    this.setNoteIsSubnodeCount(true);
  }

  subtitle () {
    return this.status()
  }

  status () {
    if (this.subnodeCount() && this.hasLoadedAllImages()) {
      return "complete"
    } else if (this.hasError()) {
      return "error loading image"
    } else if (this.isLoading()) {
      return "loading images..."
    }
    return ""
  }

  imagePrompt () {
    return this.parentNode()
  }

  hasLoadedAllImages () {
    return !this.subnodes().canDetect(sn => !sn.isLoaded())
  }

  hasError () {
    return this.subnodes().canDetect(sn => sn.hasError())
  }

  isLoading () {
    return this.subnodes().canDetect(sn => sn.isLoading())
  }

}.initThisClass());

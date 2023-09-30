"use strict";

/* 
    AzureLocales

*/

(class AzureLocales extends BMSummaryNode {
  initPrototypeSlots () {
  }

  initPrototype () {
    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
    this.setCanDelete(false);
    this.setNoteIsSubnodeCount(true);
  }

  init () {
    super.init();
    this.setTitle("Locales");
  }

  locales () {
    return this.subnodes()
  }

  localeNamed (aLocaleName) {
    return this.locales().detect(locale => locales.title() === aLocalName)
  }

  localeNamedCreateIfAbsent (aLocalName) { // create if absent
    let locale = this.localeNamed(aLocaleName)
    if (!locale) {
      locale = AzureLocal.clone().setTitle(aLocaleName)
      this.addSubnode(locale)
    }
    return locale
  }

  addVoice (aVoice) {
    const locale = this.localeNamedCreateIfAbsent(aVoice.localeName())
    locale.addVoice(aVoice)
    return this
  }


}.initThisClass());


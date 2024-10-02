"use strict";

/**
 * @module library.services.Azure.locales
 */

/**
 * @class AzureLocales
 * @extends BMSummaryNode
 * @classdesc Represents a collection of Azure locales.
 */
(class AzureLocales extends BMSummaryNode {
  /**
   * @description Initializes prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the prototype.
   * @category Initialization
   */
  initPrototype () {
    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
    this.setCanDelete(false);
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setTitle("Locales");
  }

  /**
   * @description Gets all locales.
   * @returns {Array} An array of locale objects.
   * @category Data Retrieval
   */
  locales () {
    return this.subnodes()
  }

  /**
   * @description Finds a locale by name.
   * @param {string} aLocaleName - The name of the locale to find.
   * @returns {Object|undefined} The locale object if found, undefined otherwise.
   * @category Data Retrieval
   */
  localeNamed (aLocaleName) {
    return this.locales().detect(locale => locales.title() === aLocaleName)
  }

  /**
   * @description Finds a locale by name or creates it if it doesn't exist.
   * @param {string} aLocaleName - The name of the locale to find or create.
   * @returns {Object} The existing or newly created locale object.
   * @category Data Management
   */
  localeNamedCreateIfAbsent (aLocaleName) {
    let locale = this.localeNamed(aLocaleName)
    if (!locale) {
      locale = AzureLocal.clone().setTitle(aLocaleName)
      this.addSubnode(locale)
    }
    return locale
  }

  /**
   * @description Adds a voice to the appropriate locale.
   * @param {Object} aVoice - The voice object to add.
   * @returns {AzureLocales} The current instance for method chaining.
   * @category Data Management
   */
  addVoice (aVoice) {
    const locale = this.localeNamedCreateIfAbsent(aVoice.localeName())
    locale.addVoice(aVoice)
    return this
  }

}.initThisClass());
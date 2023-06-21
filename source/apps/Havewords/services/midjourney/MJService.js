"use strict";

/* 
    MJService

*/

(class MJService extends Base {
  initPrototypeSlots() {
    this.newSlot("storagePrefix", "midjourney_io");
  }

  // --- api key ---

  apiKey () {
    const v = localStorage.getItem(this.storagePrefix() + "_api_key")
    //console.log("MS API key: ", v);
    return v;
  }

  setApiKey (v) {
    localStorage.setItem(this.storagePrefix() + "_api_key", v)
    return this
  }

  //88888888-4444-4444-4444-121212121212
  validateKey (s) {
    // this just check's it's format, but can't tell if it actually works
    if (!s) {
      return false;
    }
    return /^[a-z0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(s)
  }

  // --- api base  url ---

  apiBaseUrl () {
    return localStorage.getItem(this.storagePrefix() + "_api_base_url")
  }

  setApiBaseUrl (v) {
    localStorage.setItem(this.storagePrefix() + "_api_base_url", v)
    return this
  }

  validateBaseUrl (s) {
    // this just check's it's format, but can't tell if it actually works
    if (!s) {
      return false;
    }
    return /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(s)
  }

  hasApiAccess () {
    return this.validateKey(this.apiKey()) && this.validateBaseUrl(this.apiBaseUrl())
  }

}.initThisClass());

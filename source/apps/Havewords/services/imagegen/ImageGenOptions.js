"use strict";

(class ImageGenOptions extends Base {
    initPrototypeSlots () {
        this.newSlot("storagePrefix", "imageGen_");
    }
  
    init () {
      super.init();
    }
  
    // --- api key ---

    allowsImageGen () {
        return this.option() !== "none";
    }
  
    modelOptions () {
        return ["none", this.midjourneyOption()];
        //return [this.dalleOption(), this.midjourneyOption()];
    }

    option() {
        return localStorage.getItem(this.storagePrefix() + "option") || "none";
    }

    setOption(option) {
        if (!this.isValidOption(option)) {
            throw `Invalid option: ${option}`;
        }
        localStorage.setItem(this.storagePrefix() + "option", option);
    }

    dalleOption() {
        return "OpenAI/DALL·E 2";
    }

    midjourneyOption() {
        return "Midjourneyapi.io";
    }

    isDalleOption() {
        return this.option() == this.dalleOption();
    }

    isMidjourneyOption() {
        return this.option() == this.midjourneyOption();
    }

    isValidOption(option) {
        return this.modelOptions().includes(option);
    }
  
  }.initThisClass());
  
"use strict";

/**
 * @module library.services.AiServiceKit.Music
 * @class SvMusicPrompts
 * @extends SvJsonArrayNode
 * @classdesc A collection of SvMusicPrompt (or a provider subclass).
 * Services set the item class via promptClass().
 */

(class SvMusicPrompts extends SvJsonArrayNode {

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(false);
        this.setSubnodeClasses([SvMusicPrompt]);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Music Prompts");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
        this.setSubnodeClasses([this.promptClass()]);
    }

    promptClass () {
        return SvMusicPrompt;
    }

    addPrompt () {
        const prompt = this.promptClass().clone();
        this.addSubnode(prompt);
        return prompt;
    }

}.initThisClass());

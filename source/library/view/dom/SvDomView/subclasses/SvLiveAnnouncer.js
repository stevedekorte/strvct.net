"use strict";

/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvLiveAnnouncer
 * @extends SvDomView
 * @classdesc The page's one polite live region: text given to announce() is
 * read by a screen reader once, without moving focus, and is never seen.
 *
 * A screen reader speaks a live region when its text changes, so the same
 * sentence twice in a row would be heard once. announce() therefore empties
 * the region and writes the sentence a moment later. A newer announcement
 * replaces one not yet written, so a burst of changes is heard as its last.
 *
 * Example:
 * ```
 * SvLiveAnnouncer.shared().announce("Narration");
 * ```
 */
(class SvLiveAnnouncer extends SvDomView {

    /**
     * @static
     * @description One region for the page.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description No slots of its own.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description A polite status region, kept out of sight but not out of
     * the accessibility tree (display: none would remove it from both).
     * @returns {SvLiveAnnouncer}
     * @category Initialization
     */
    init () {
        super.init();
        this.setElementClassName("SvLiveAnnouncer");
        this.setAriaRole("status");
        this.setAriaLive("polite");
        this.setPosition("fixed");
        this.setWidth("1px");
        this.setHeight("1px");
        this.setOverflow("hidden");
        this.setCssProperty("clip-path", "inset(50%)");
        this.setWhiteSpace("nowrap");
        return this;
    }

    /**
     * @description Says a sentence to a screen reader user.
     * @param {String} aString - what to say; an empty string says nothing
     * @returns {SvLiveAnnouncer}
     * @category Announcing
     */
    announce (aString) {
        if (!aString) {
            return this;
        }
        this.addToPageIfNeeded();
        this.setTextContent("");
        this.addTimeout(() => this.setTextContent(aString), 100, "announce");
        return this;
    }

    /**
     * @description Puts the region on the page the first time it speaks.
     * @returns {SvLiveAnnouncer}
     * @category Announcing
     * @private
     */
    addToPageIfNeeded () {
        if (!this.parentView()) {
            SvDocumentBody.shared().addSubview(this);
        }
        return this;
    }

}.initThisClass());

/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/**
 * @class SvChatMessageTile
 * @extends SvTextAreaFieldTile
 * @classdesc SvChatMessageTile is a specialized tile for chat message functionality.
 */


"use strict";

(class SvChatMessageTile extends SvTextAreaFieldTile {

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("hasBeenShownUnexpired", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isProgressTagExitPending", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("progressCompactObserver", null);
            slot.setSlotType("IntersectionObserver");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Initializes the SvChatInputTile instance.
     * @returns {SvChatInputTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");
        this.setElementClassName("SvChatMessageTile");

        // Accessibility: chat messages are live region content
        this.setAriaLive("polite");

        return this;
    }

    /**
     * @description Returns speakable elements.
     * @returns {Array} An array of speakable elements.
     * @category Speech
     */
    speakableElements () {
        return this.valueView().element().elementsOfTags(this.node().tagsToSpeak());
    }

    /**
     * @description Finds a speakable element with the given text.
     * @param {string} text - The text to search for.
     * @returns {Element|undefined} The found element or undefined.
     * @category Speech
     */
    speakableElementWithText (text) {
        return this.speakableElements().detect(e => e.textContent === text || e.textContent.trim() === text);
    }

    /**
     * @description Handles the speaking text event.
     * @param {Object} aNote - The notification object.
     * @category Speech
     */
    onSpeakingText (aNote) {
        const text = aNote.info();

        if (text.includes("<break time=")) {
            return;
        }

        const e = this.speakableElementWithText(text);
        if (!e) {
            // Best-effort presentation: the sentence's div may not have
            // rendered yet — the text-paced caption clock (voice off) posts
            // right at parse time, ahead of the tile's next sync, where the
            // TTS clock's audio latency always hid this race. Never throw
            // from inside the notification pipeline over a missed highlight;
            // the next sentence re-syncs the highlighting.
            console.warn(this.svTypeId() + ".onSpeakingText: no rendered div yet for [" + text.clipWithEllipsis(40) + "] — skipping highlight");
            return;
        }
        this.unhighlightAllSentences();
        this.highlightElement(e);
    }

    /**
     * @description Unhighlights all sentences.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    unhighlightAllSentences () {
        this.speakableElements().forEach(el => this.unhighlightElement(el));
        return this;
    }

    /**
     * @description Handles the spoke text event.
     * @param {Object} aNote - The notification object.
     * @category Speech
     */
    onSpokeText (aNote) {
        const text = aNote.info();

        if (text.includes("<break time=")) {
            return;
        }

        const e = this.speakableElementWithText(text);
        assert(e);
        this.unhighlightElement(e);
    }

    /**
     * @description Highlights the given element.
     * @param {Element} e - The element to highlight.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    highlightElement (e) {
        e.style.opacity = 1;
        // The sentence currently being narrated. Hue alone is a weak signal at body
        // size — the light theme's red sits at only 1.9:1 against the body ink — so
        // the theme supplies a SECOND channel too: a wash on a light ground, a glow
        // on a dark one. Both default to inert, so a theme that wants neither gets
        // colour only. All three are paint-only; none triggers layout, which matters
        // because this runs on every sentence advance.
        e.style.color = "var(--sv-speaking-color)";
        e.style.backgroundColor = "var(--sv-speaking-bg)";
        e.style.textShadow = "var(--sv-speaking-shadow)";
        return this;
    }

    /**
     * @description Unhighlights the given element.
     * @param {Element} e - The element to unhighlight.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    unhighlightElement (e) {
        e.style.fontWeight = "";
        e.style.opacity = "";
        e.style.color = "";
        // Must clear everything highlightElement set. Anything left behind
        // accumulates down the message as narration advances, so the whole
        // paragraph ends up wearing the active-sentence treatment.
        e.style.backgroundColor = "";
        e.style.textShadow = "";
        return this;
    }

    /**
     * @description Creates and configures the value view.
     * @returns {SvTextView} The configured value view.
     * @category UI
     */
    createValueView () {
        const v = SvTextView.clone();
        v.setElementClassName("SvChatMessageTileValueView");

        v.setIsMergeable(true);
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setOverflowY("scroll");

        // The bubble chrome (background, border, radius, padding) lives in
        // field_tiles/_css.css as token-driven rules (--sv-chat-msg-*), so a
        // theme can restyle it. Clear SvTextView.init's inline paddings AND
        // its syncBorder() inline "border: none" so the stylesheet rules
        // actually apply — an inline shorthand expands to border-left etc.
        // and silently beats any CSS rule (found via probe: the themed
        // player-message left rule matched but never rendered).
        v.setPaddingTop(null);
        v.setPaddingLeft(null);
        v.setPaddingRight(null);
        v.setPaddingBottom(null);
        v.setBorder(null);

        // Neuter the chrome setters IMMEDIATELY after the clears — the mode
        // setters below (setIsMultiline, setDoesInput, setDoesHoldFocusOnReturn)
        // trigger syncEditingControl → syncBorder("none"), which re-imposed the
        // inline border inside this very method (probe-verified). They MUST
        // return v (the value view), not the tile — callers chain them
        // (valueView.setPaddingLeft(..).setPaddingRight(..)), and returning the
        // tile made the second call style the TILE, adding a phantom right
        // padding (the mobile chat-input right-gap bug).
        v.setPaddingTop = () => { return v; };
        v.setPaddingLeft = () => { return v; };
        v.setPaddingRight = () => { return v; };
        v.setPaddingBottom = () => { return v; };

        v.setBackgroundColor = () => { return v; };
        v.setBorder = () => { return v; };
        v.syncBorder = () => { return v; };

        v.setAllowsHtml(true);
        v.setWhiteSpace("normal");

        v.setIsMultiline(true);
        v.setDoesInput(true);

        v.setDoesHoldFocusOnReturn(true);
        v.setDoesInput(true);
        v.turnOnUserSelect();
        return v;
    }

    /**
     * @description Handles the updated node event.
     * @param {Object} aNote - The notification object.
     * @returns {*} The result of the super call.
     * @category Event
     */
    onUpdatedNode (aNote) {
        return super.onUpdatedNode(aNote);
    }

    /**
     * @description Applies the node's height hint (nodeMinTileHeight) as a
     * true MINIMUM: chat tiles hug their text — replacing SvFieldTile's 5em
     * tile/contentView floors, which left dead bands above and below short
     * messages — while still growing with the content. Chat tiles apply the
     * hint THEMSELVES and it must stay that way: SvTile ignores
     * nodeMinTileHeight, and honoring it globally breaks every tile, because
     * SvViewableNode.finalInit() stamps 80 onto every node — titled tiles
     * (roll messages, headers, companion sheet) get clipped to a fixed 80px.
     * Chat message/input nodes override nodeMinTileHeight() to return a
     * compact constant.
     * @returns {SvChatMessageTile} The current instance.
     * @category Layout
     */
    applyStyles () {
        super.applyStyles();
        this.contentView().setBackgroundColor("transparent");
        return this;
    }

    updateSubviews () {
        super.updateSubviews();
        const node = this.node();
        if (node) {
            const h = node.nodeMinTileHeight();
            if (h > 0) {
                this.setMinHeightPx(h);
                this.setMaxHeight("none");
                this.contentView().setMinHeightPx(h);
            }
        }
        return this;
    }

    /**
     * @description Keeps makeOrientationRight (which runs AFTER
     * updateSubviews on every full sync) in agreement with the compact
     * minimum above — otherwise the tile's height flips between 5em and the
     * hint depending on which sync path ran last (visible as messages
     * changing height when selected/deselected).
     * @returns {String} The CSS min-height value.
     */
    orientationMinHeight () {
        const node = this.node();
        if (node && node.nodeMinTileHeight() > 0) {
            return this.pxNumberToString(node.nodeMinTileHeight());
        }
        return super.orientationMinHeight();
    }

    /**
     * @description Synchronizes the tile with its node.
     * @returns {SvChatInputTile} The current instance.
     * @category Synchronization
     */
    syncFromNode () {
        const node = this.node();
        this.watchSender(node);
        // Expose the message's role ("user" / "assistant") to CSS so themes
        // can style them differently (e.g. a left rule on player messages).
        if (node && node.role) {
            this.setAttribute("data-role", node.role());
        }
        // Live tiles that already showed progress keep the animate bit so
        // a same-chunk complete does not CSS-snap the tag. Reload snaps.
        if (this.hasBeenShownUnexpired()) {
            this.setAttribute("data-animate-progress", "true");
        }
        if (node && node.isComplete) {
            this.setAttribute("data-complete", node.isComplete() ? "true" : "false");
        }
        super.syncFromNode(); // This now includes syncDotsFromNode
        if (node && node.isComplete && !node.valueIsComplete) {
            if (node.isComplete()) {
                this.hideValueDots();
            } else {
                this.showValueDots();
            }
        }
        this.rememberVisibleProgress();
        this.animateSupersededProgressTags();
        this.scheduleProgressCompactWatch();
        return this;
    }

    isChatDebugMode () {
        return typeof SvApp !== "undefined"
            && SvApp.shared
            && SvApp.shared().developerMode
            && SvApp.shared().developerMode();
    }

    progressMinVisibleMs () {
        return 3000;
    }

    progressFadeMs () {
        return 3000;
    }

    progressFadedOpacity () {
        return "0.2";
    }

    shouldSkipDisplayExitAnimation () {
        if (typeof document !== "undefined" && document.hidden) {
            return true;
        }
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return false;
    }

    isProgressReloadSnap () {
        // First paint after reload / late join: the tile never showed this
        // progress live, so do not replay the dwell+fade. CSS already snaps
        // opacity; JS marks exit and collapses tiles above the fold.
        return this.getAttribute("data-animate-progress") !== "true"
            && this.tileHasFollowOnStarted();
    }

    rememberVisibleProgress () {
        if (this.visibleProgressTags().length > 0) {
            this.setHasBeenShownUnexpired(true);
        }
        return this;
    }

    visibleProgressTags () {
        return this.progressTags().filter(el => {
            if (el.offsetHeight <= 0 || el.dataset.exit === "1") {
                return false;
            }
            // Streaming often leaves <narration> (or an <img>) nested
            // inside an unclosed progress tag. Fading that wrapper would
            // hide the story / the generated scene.
            return !el.querySelector("narration, table-talk, img");
        });
    }

    progressTags () {
        const e = this.element();
        if (!e || !e.querySelectorAll) {
            return [];
        }
        return Array.from(e.querySelectorAll("narration-progress"));
    }

    animateSupersededProgressTags () {
        if (!this.tileHasFollowOnStarted()) {
            return this;
        }
        if (this.visibleProgressTags().length === 0) {
            return this;
        }
        if (this.isProgressReloadSnap() || this.shouldSkipDisplayExitAnimation()) {
            return this.snapProgressTagsHidden();
        }
        if (this.earlierProgressStillShowing()) {
            return this;
        }
        return this.scheduleProgressTagExit();
    }

    snapProgressTagsHidden () {
        this.visibleProgressTags().forEach(el => {
            el.dataset.exit = "1";
            el.style.opacity = this.progressFadedOpacity();
        });
        this.setIsProgressTagExitPending(false);
        this.scheduleProgressCompactWatch();
        return this.notifyLaterProgressExits();
    }

    scheduleProgressTagExit () {
        if (this.isProgressTagExitPending()) {
            return this;
        }
        this.setIsProgressTagExitPending(true);
        this.addTimeout(() => this.beginProgressTagExit(this.nextProgressTagToExit()), this.progressMinVisibleMs(), "progressTagExit");
        return this;
    }

    nextProgressTagToExit () {
        const tags = this.visibleProgressTags();
        return tags.length ? [tags[0]] : [];
    }

    tileHasFollowOnStarted () {
        if (this.domHasFollowOnContent()) {
            return true;
        }
        const node = this.node();
        if (node && node.hasFollowOnContent && node.hasFollowOnContent()) {
            return true;
        }
        return !!(node && node.hasCompletedFollowOnAfter && node.hasCompletedFollowOnAfter());
    }

    domHasFollowOnContent () {
        const e = this.element();
        if (!e || !e.querySelectorAll) {
            return false;
        }
        const tags = e.querySelectorAll("narration, table-talk");
        for (let i = 0; i < tags.length; i++) {
            if ((tags[i].textContent || "").trim().length > 0) {
                return true;
            }
        }
        return false;
    }

    beginProgressTagExit (tags) {
        if (!tags || tags.length === 0) {
            this.setIsProgressTagExitPending(false);
            return this;
        }
        tags.forEach(el => {
            el.dataset.exit = "1";
        });
        this.addTimeout(() => this.fadeProgressTags(tags), 0, "progressTagExit");
        return this;
    }

    fadeProgressTags (tags) {
        const fade = "opacity " + (this.progressFadeMs() / 1000) + "s ease-out";
        tags.forEach(el => {
            el.style.transition = fade;
            el.style.opacity = this.progressFadedOpacity();
        });
        this.addTimeout(() => this.finishProgressTagExit(), this.progressFadeMs(), "progressTagExit");
        return this;
    }

    finishProgressTagExit () {
        this.setIsProgressTagExitPending(false);
        if (this.visibleProgressTags().length > 0) {
            return this.scheduleProgressTagExit();
        }
        this.scheduleProgressCompactWatch();
        return this.notifyLaterProgressExits();
    }

    tryStartProgressExit () {
        return this.animateSupersededProgressTags();
    }

    tilesView () {
        let view = this.parentView();
        while (view) {
            if (view.subviewForNode) {
                return view;
            }
            view = view.parentView();
        }
        return null;
    }

    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue);
        if (!newValue) {
            this.disconnectProgressCompactObserver();
        }
        return this;
    }

    scrollView () {
        let view = this.tilesView();
        while (view) {
            if (view.anchorOnSubview) {
                return view;
            }
            view = view.parentView();
        }
        return null;
    }

    fadedProgressTags () {
        return this.progressTags().filter(el => {
            if (el.style.display === "none") {
                return false;
            }
            if (el.querySelector("narration, table-talk, img")) {
                return false;
            }
            if (el.dataset.exit === "1") {
                return true;
            }
            return this.getAttribute("data-animate-progress") !== "true"
                && this.tileHasFollowOnStarted();
        });
    }

    hasStickyUserFacingContent () {
        if (this.domHasFollowOnContent()) {
            return true;
        }
        const e = this.element();
        if (e && e.querySelector("img")) {
            return true;
        }
        const node = this.node();
        if (node && node.visibleTextWithoutProgress && node.content) {
            return node.visibleTextWithoutProgress(node.content()).length > 0;
        }
        return false;
    }

    needsEmptyTileWatch () {
        if (this.isChatDebugMode()) {
            return false;
        }
        if (this.fadedProgressTags().length > 0) {
            return true;
        }
        if (this.visibleProgressTags().length > 0) {
            return false;
        }
        return !this.hasStickyUserFacingContent();
    }

    scheduleProgressCompactWatch () {
        if (this.isChatDebugMode()) {
            return this.revealHiddenTileForDebug();
        }
        if (!this.needsEmptyTileWatch()) {
            return this;
        }
        if (this.progressCompactObserver()) {
            return this.maybeCompactFadedProgress();
        }
        return this.watchFadedProgressForCompact();
    }

    revealHiddenTileForDebug () {
        this.disconnectProgressCompactObserver();
        this.unhideDisplay();
        this.progressTags().forEach(el => {
            if (el.dataset.exit === "1") {
                el.style.display = "";
                el.style.opacity = this.progressFadedOpacity();
            }
        });
        return this;
    }

    watchFadedProgressForCompact () {
        const root = this.scrollView() ? this.scrollView().element() : null;
        const tileEl = this.element();
        if (!root || !tileEl || typeof IntersectionObserver === "undefined") {
            return this.maybeCompactFadedProgress();
        }
        const observer = new IntersectionObserver(entries => this.onProgressCompactIntersect(entries), { root: root, threshold: 0 });
        this.setProgressCompactObserver(observer);
        observer.observe(tileEl);
        return this.maybeCompactFadedProgress();
    }

    onProgressCompactIntersect (entries) {
        const entry = entries[0];
        if (!entry || !entry.rootBounds) {
            return this;
        }
        if (entry.boundingClientRect.bottom < entry.rootBounds.top) {
            this.maybeCompactFadedProgress();
        }
        return this;
    }

    maybeCompactFadedProgress () {
        const scrollView = this.scrollView();
        if (scrollView && scrollView.isInUserScrollSession && scrollView.isInUserScrollSession()) {
            this.addTimeout(() => this.maybeCompactFadedProgress(), 250, "progressCompact");
            return this;
        }
        if (this.tileIsFullyAboveScrollView()) {
            this.compactFadedProgressTags();
        }
        return this;
    }

    tileIsFullyAboveScrollView () {
        const root = this.scrollView() ? this.scrollView().element() : null;
        const tileEl = this.element();
        if (!root || !tileEl) {
            return false;
        }
        return tileEl.getBoundingClientRect().bottom < root.getBoundingClientRect().top - 1;
    }

    compactFadedProgressTags () {
        if (this.isChatDebugMode()) {
            return this;
        }
        this.fadedProgressTags().forEach(el => {
            el.style.transition = "none";
            el.style.display = "none";
        });
        if (!this.hasStickyUserFacingContent() && this.visibleProgressTags().length === 0) {
            this.hideDisplay();
        }
        return this.disconnectProgressCompactObserver();
    }

    disconnectProgressCompactObserver () {
        const observer = this.progressCompactObserver();
        if (observer) {
            observer.disconnect();
            this.setProgressCompactObserver(null);
        }
        return this;
    }

    conversationMessages () {
        const node = this.node();
        const conversation = node && node.conversation && node.conversation();
        if (!conversation || !conversation.messages) {
            return [];
        }
        return conversation.messages();
    }

    isProgressExitBusy () {
        return this.isProgressTagExitPending();
    }

    earlierProgressStillShowing () {
        const node = this.node();
        const tilesView = this.tilesView();
        if (!node || !tilesView) {
            return false;
        }
        const messages = this.conversationMessages();
        const index = messages.indexOf(node);
        for (let i = 0; i < index; i++) {
            const tile = tilesView.subviewForNode(messages[i]);
            if (!tile) {
                continue;
            }
            if (tile.isProgressTagExitPending && tile.isProgressTagExitPending()) {
                return true;
            }
            if (tile.visibleProgressTags && tile.visibleProgressTags().length > 0
                    && tile.tileHasFollowOnStarted && tile.tileHasFollowOnStarted()) {
                return true;
            }
        }
        return false;
    }

    notifyLaterProgressExits () {
        const tilesView = this.tilesView();
        const node = this.node();
        if (!tilesView || !node) {
            return this;
        }
        const messages = this.conversationMessages();
        const index = messages.indexOf(node);
        for (let i = index + 1; i < messages.length; i++) {
            const tile = tilesView.subviewForNode(messages[i]);
            if (tile && typeof tile.tryStartProgressExit === "function") {
                tile.tryStartProgressExit();
            }
        }
        return this;
    }

    /**
     * @description Shows the animated dots (calls showValueDots for backward compatibility).
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    showDots () {
        return this.showValueDots();
    }

    /**
     * @description Hides the animated dots (calls hideValueDots for backward compatibility).
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    hideDots () {
        return this.hideValueDots();
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Chat messages are always a polite live region.
     * @returns {string} The ARIA live value.
     * @category Accessibility
     */
    ariaLive () {
        return "polite";
    }

}.initThisClass());

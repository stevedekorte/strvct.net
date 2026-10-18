"use strict";

/**
 * @module library.node.node_views
 */

/**
 * @class SvNoticeBarView
 * @extends SvDomView
 * @classdesc The current notice (SvApp.notices().currentNotice()) as a slim
 * bar at the top of the window: its message, a button per action, and a
 * close button when it can be dismissed. Re-renders on onNoticesChanged; the
 * buttons call the notice's actions (view → model). Hidden when there is no
 * notice. Themed by tokens (--sv-surface-panel, --sv-text, --sv-hairline).
 */
(class SvNoticeBarView extends SvDomView {

    static initClass () {
        this.newClassSlot("hasAddedCss", false);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("notices", null);
            slot.setSlotType("SvNotices");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        SvNoticeBarView.ensureCss();
        this.element().classList.add("SvNoticeBar");
        this.setAriaRole("status");
        this.setDisplay("none");
        return this;
    }

    /**
     * @description Renders these notices from now on.
     * @param {SvNotices} notices
     * @returns {SvNoticeBarView}
     * @category Notices
     */
    showNotices (notices) {
        this.setNotices(notices);
        this.watchForNoteFrom("onNoticesChanged", notices);
        this.render();
        return this;
    }

    onNoticesChanged (/*aNote*/) {
        this.render();
    }

    render () {
        const notice = this.notices() ? this.notices().currentNotice() : null;
        this.removeAllSubviews();
        if (!notice) {
            this.setDisplay("none");
            return this;
        }
        this.setDisplay("flex");
        this.addSubview(SvDomView.clone().setElementClassName("SvNoticeMessage").setTextContent(notice.message()));
        notice.actions().forEach(action => this.addSubview(SvNoticeButtonView.clone().setLabelText(action.label()).setPress(() => action.performFor(notice))));
        if (notice.isDismissible()) {
            this.addSubview(SvNoticeButtonView.clone().setLabelText("×").setAriaLabelText("Dismiss").setIsCloseButton(true).setPress(() => notice.dismiss()));
        }
        return this;
    }

    static ensureCss () {
        if (this.hasAddedCss()) {
            return;
        }
        this.setHasAddedCss(true);
        SvWebDocument.shared().addStyleSheetString(`
            .SvNoticeBar {
                position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 100000;
                align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center;
                max-width: min(720px, calc(100vw - 16px)); box-sizing: border-box; margin-top: 8px;
                padding: 10px 14px 10px 18px;
                background: var(--sv-surface-panel, var(--sv-background, #f4f1e8));
                color: var(--sv-text, #2b2620);
                border: 1px solid var(--sv-hairline, rgba(0,0,0,0.2));
                box-shadow: 0 6px 24px rgba(0,0,0,0.12);
                font-family: var(--sv-face-body, inherit); font-size: 16px; line-height: 1.35;
            }
            .SvNoticeBar .SvNoticeMessage { flex: 1 1 220px; min-width: 0; }
            .SvNoticeBar .SvNoticeButton {
                flex: none; cursor: pointer; user-select: none; touch-action: manipulation;
                min-height: 36px; padding: 6px 12px; display: inline-flex; align-items: center;
                border: 1px solid currentColor; font-size: 15px; letter-spacing: 0.02em;
            }
            .SvNoticeBar .SvNoticeButton.SvNoticeClose { border: none; font-size: 22px; padding: 0 6px; opacity: 0.6; }
        `);
    }

}.initThisClass());

/**
 * @class SvNoticeButtonView
 * @extends SvDomView
 * @classdesc A button in the notice bar: tapped (or Enter/Space), it calls its press function.
 */
(class SvNoticeButtonView extends SvDomView {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("press", null);
            slot.setSlotType("Function");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        this.element().classList.add("SvNoticeButton");
        this.setAriaRole("button");
        this.element().setAttribute("tabindex", "0");
        this.addDefaultTapGesture();
        return this;
    }

    setLabelText (text) {
        this.setTextContent(text);
        return this;
    }

    setAriaLabelText (text) {
        this.element().setAttribute("aria-label", text);
        return this;
    }

    setIsCloseButton (aBool) {
        this.element().classList.toggle("SvNoticeClose", aBool);
        return this;
    }

    onTapComplete (/*aGesture*/) {
        if (this.press()) {
            this.press()();
        }
        return this;
    }

    onEnterKeyUp (/*event*/) {
        this.onTapComplete();
        return false;
    }

}.initThisClass());

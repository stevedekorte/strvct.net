"use strict";

/**
 * @module library.node.app.notices
 */

/**
 * @class SvNotices
 * @extends ProtoClass
 * @classdesc The notices showing now (SvApp.notices()), newest last. Posts
 * onNoticesChanged when one is shown or taken away, for the UI to render.
 */
(class SvNotices extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("notices", null); // Array<SvNotice>
            slot.setSlotType("Array");
        }
    }

    init () {
        super.init();
        this.setNotices([]);
        return this;
    }

    /**
     * @description Shows a notice, replacing any other with its id.
     * @param {SvNotice} notice
     * @returns {SvNotice}
     * @category Notices
     */
    show (notice) {
        this.setNotices(this.notices().filter(n => n.noticeId() !== notice.noticeId()).concat([notice]));
        notice.setNotices(this);
        this.didChange();
        return notice;
    }

    removeNotice (notice) {
        const before = this.notices().length;
        this.setNotices(this.notices().filter(n => n !== notice));
        if (this.notices().length !== before) {
            notice.setNotices(null);
            this.didChange();
        }
        return this;
    }

    removeNoticeWithId (noticeId) {
        const notice = this.noticeWithId(noticeId);
        if (notice) {
            this.removeNotice(notice);
        }
        return this;
    }

    noticeWithId (noticeId) {
        return this.notices().find(n => n.noticeId() === noticeId) || null;
    }

    /**
     * @description The notice to show: the newest.
     * @returns {SvNotice|null}
     * @category Notices
     */
    currentNotice () {
        return this.notices().length ? this.notices()[this.notices().length - 1] : null;
    }

    didChange () {
        SvNotificationCenter.shared().newNote().setSender(this).setName("onNoticesChanged").post();
    }

}.initThisClass());

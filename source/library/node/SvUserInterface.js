"use strict";

/*
    @class SvUserInterface
    @extends SvStorableNode
    @classdesc The SvUserInterface class is the main user interface class of the SvApp.

*/

(class SvUserInterface extends SvStorableNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    init () {
        super.init();
        //WebDocument.shared().setTitle(this.app().name());

        // Register for window errors
        //WindowErrorPanel.shared().registerForWindowErrors();
        return this;
    }

    async afterAppUiDidInit () {
        this.setupDocTheme();
        return this;
    }

    async setup () {
        return this;
    }


    /**
     * @description Sets up the document theme
     * @category UI
     */
    setupDocTheme () {
        const doc = DocumentBody.shared();
        doc.setColor("#f4f4ec");
        doc.setBackgroundColor("rgb(25, 25, 25)");
        this.setupNormalDocTheme();
    }

    /**
     * @description Sets up the normal document theme
     * @category UI
     */
    setupNormalDocTheme () {
        const doc = DocumentBody.shared();
        doc.setBackgroundColor("#191919");
        doc.setFontFamily("EB Garamond");
        //doc.setFontFamily("BarlowCondensed");
        doc.setFontWeight("Medium");
        doc.setFontSizeAndLineHeight("18px");
   }

}.initThisClass());

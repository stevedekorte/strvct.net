"use strict";

/*
    @class SvWebUserInterface
    @extends SvUserInterface
    @classdesc The SvWebUserInterface class is the user interface class for the web.

*/

(class SvWebUserInterface extends SvUserInterface {


    init () {
        super.init();
        //WebDocument.shared().setTitle(this.app().name());
        return this;
    }

    async afterAppDidInit () {
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
        doc.setFontFamily("HoeflerTitling");

        //doc.setFontFamily("EB Garamond");
        //doc.setFontFamily("IMFellEnglish");
        //doc.setFontFamily("Lusitana");
        //doc.setFontFamily("BarlowCondensed");
        //doc.setFontWeight("medium");

        //doc.setFontSize("18px");
        //doc.setLineHeight(1.3);
    }

}.initThisClass());

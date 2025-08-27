"use strict";

/*
    @class SvHeadlessUserInterface
    @extends SvUserInterface
    @classdesc The SvHeadlessUserInterface class is the user interface class for the headless mode.

*/

(class SvHeadlessUserInterface extends SvUserInterface {


    init () {
        super.init();
        //WebDocument.shared().setTitle(this.app().name());
        return this;
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        return this;
    }

}.initThisClass());

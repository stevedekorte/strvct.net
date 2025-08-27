"use strict";

/*
    @class SvCliUserInterface
    @extends SvUserInterface
    @classdesc The SvCliUserInterface class is the user interface class for the cli.

*/

(class SvCliUserInterface extends SvUserInterface {


    init () {
        super.init();
        return this;
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        return this;
    }

}.initThisClass());

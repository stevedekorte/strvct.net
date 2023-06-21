"use strict";

/*

    BMDefaultTheme

*/

(class BMDefaultTheme extends BMTheme {

    init () {
        super.init()
        return this
    }

    finalInit () {
        this.setupAsDefault() 
    }

    setupAsDefault () {
        if (!this.hasSubnodes()) {
            //debugger
            this.setTitle("DefaultTheme")
            const defaultThemeClass = BMThemeClass.clone().setupAsDefault()
            this.addSubnode(defaultThemeClass)
        }
        return this
   }

}.initThisClass());

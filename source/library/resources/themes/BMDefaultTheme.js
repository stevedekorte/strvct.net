"use strict";

/*

    BMDefaultTheme

*/

(class BMDefaultTheme extends BMTheme {
    

    init () {
        super.init() 
        return this
    }

    didInit () {
        super.didInit()
        this.setupAsDefault() 
    }

    setupAsDefault () {
        if (this.subnodes().length === 0) {
            this.setTitle("DefaultTheme")
            const defaultThemeClass = BMThemeClass.clone().setupAsDefault()
            this.addSubnode(defaultThemeClass)
        }
        return this
   }

}.initThisClass());

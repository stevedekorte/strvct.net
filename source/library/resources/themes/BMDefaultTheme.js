"use strict";

/*

    BMDefaultTheme

*/

(class BMDefaultTheme extends BMTheme {
    
    /*
    initPrototype () {
        this.setShouldScheduleDidInit(true)
    }
    */

    init () {
        this.setShouldScheduleDidInit(true)
        super.init()
        return this
    }

    didInit () {
        //debugger;
        console.log(this.typeId() + " didInit")

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

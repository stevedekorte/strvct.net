"use strict";

/*

    Date-ideal

    Some extra methods for the Javascript Date primitive.

*/


(class Date_ideal extends Date {

    /*
    static clone () {
        return new Date(this.getTime())
     }
    */

    copy () {
        return this.shallowCopy()
     }

    shallowCopy () {
        return new Date(this.getTime())
     }

    // ---
   
    monthNames () {
        return [ 
            "January", "February", "March", 
            "April", "May", "June", 
            "July", "August", "September", 
            "October", "November", "December" 
        ];
     }

    monthName () {
        const monthNumber = this.getMonth() - 1
        return this.monthNames()[monthNumber];
     }

    dateNumberName () {
        const dayNumber = this.getDate()
        return dayNumber + dayNumber.ordinalSuffix()
     }

    paddedNumber (n) {
        const s = "" + n
        if (s.length === 1) { 
            return "0" + s
        }
        return s
     }

    zeroPaddedHours () {
        return this.paddedNumber(this.getHours())
     }

    zeroPaddedMinutes () {
        return this.paddedNumber(this.getMinutes())
     }

    zeroPaddedSeconds () {
        return this.paddedNumber(this.getSeconds())
     }

    getTwelveHours () {
        let h = this.getHours()
        if (h > 12) { h -= 12 }
        if (h === 0) { h = 12 }
        return h
     }

    zeroPaddedUSDate () {
        return this.paddedNumber(this.getTwelveHours()) + ":" + this.paddedNumber(this.getMinutes())
     }

}).initThisCategory();







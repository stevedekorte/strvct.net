"use strict";


(class Object_puuid extends Object {

    /*
    static newUuid () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    */

    static newUuid () { // TODO: move this JS UUID when it's added to JS standard lib
        const uuidPart = () => { 
            const bigFloat = Math.random() * Math.pow(10, 17)
            const bigInt = Math.floor(bigFloat)
            const b64 = bigInt.toBase64()
            return b64
        }
        return uuidPart() + uuidPart()
    }

   // _puuid: undefined,

    puuid () {
        if (!this.hasPuuid()) {
            this.setPuuid(Object.newUuid())
        }

        return this["_puuid"]
    }

    hasPuuid () {
        return Object.prototype.hasOwnProperty.apply(this, ["_puuid"])
    }

    setPuuid (puuid) {
        assert(!Type.isNullOrUndefined(puuid))
        if (this.hasPuuid()) {
            const oldPid = this["_puuid"]
            this.defaultStore().onObjectUpdatePid(this, oldPid, puuid)
        }
        Object.defineSlot(this, "_puuid", puuid) // so _puuid isn't enumerable
        return this
    }

    typePuuid () {
        const puuid = this.puuid()
        if (Type.isFunction(this.type)) {
            return this.type() + "_" + puuid
        }
        return Type.typeName(this) + "_" + puuid
    }

    typeId () {
        return this.typePuuid()
    }

    debugTypeId () {
        const puuid = this.puuid().substr(0,3)

        if (Type.isFunction(this.type)) {
            return this.type() + "_" + puuid
        }
        return Type.typeName(this) + "_" + puuid
    }

    debugTypeIdSpacer () {
        return " -> "
    }

}).initThisCategory();

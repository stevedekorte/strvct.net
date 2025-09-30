"use strict";
/**
 * Extends Object with UUID (Universally Unique Identifier) functionality.
 * @module library.ideal.object
 * @class Object_puuid
 * @extends Object
 */
(class Object_puuid extends Object {

    /**
     * Generates a new UUID.
     * @returns {string} A new UUID.
     * @category Identification
     */
    static newUuid () {
        const length = 10;
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        const randomValues = new Uint8Array(length);

        // Use appropriate crypto API based on environment
        if (typeof window !== "undefined" && window.crypto) {
            // Browser environment
            window.crypto.getRandomValues(randomValues);
        } else if (typeof require !== "undefined") {
            // Node.js environment
            const crypto = require("crypto");
            crypto.randomFillSync(randomValues);
        } else {
            // Fallback to Math.random (less secure)
            for (let i = 0; i < length; i++) {
                randomValues[i] = Math.floor(Math.random() * 256);
            }
        }
        const result = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = characters[randomValues[i] % charactersLength];
        }

        return result.join("");
    }

    /**
     * Gets the PUUID (Persistent Universally Unique Identifier) of the object.
     * If the object doesn't have a PUUID, it generates a new one.
     * @returns {string} The PUUID of the object.
     * @category Identification
     */
    puuid () {
        if (!this.hasPuuid()) {
            this.setPuuid(Object.newUuid());
        }

        return this["_puuid"];
    }

    /**
     * Checks if the object has a PUUID.
     * @returns {boolean} True if the object has a PUUID, false otherwise.
     * @category Identification
     */
    hasPuuid () {
        return Object.prototype.hasOwnProperty.call(this, "_puuid");
    }

    /**
     * Sets the PUUID of the object.
     * @param {string} puuid - The PUUID to set.
     * @throws {Error} If the provided PUUID is null or undefined.
     * @returns {Object_puuid} This object.
     * @category Identification
     */
    setPuuid (puuid) {
        assert(!Type.isNullOrUndefined(puuid), "puuid cannot be null or undefined");
        if (this.hasPuuid()) {
            const oldPid = this["_puuid"];
            this.defaultStore().onObjectUpdatePid(this, oldPid, puuid);
            this._puuid = puuid;
        } else {
            Object.defineSlot(this, "_puuid", puuid); // so _puuid isn't enumerable
        }
        return this;
    }

    justSetPuuid (puuid) {
        if (this.hasPuuid()) {
            // NOTE: Dangerous! Only ObjectPool should use this!
            this._puuid = puuid;
        } else {
            Object.defineSlot(this, "_puuid", puuid); // so _puuid isn't enumerable
        }
        return this;
    }

    /**
     * Gets the type-specific PUUID of the object.
     * @returns {string} The type-specific PUUID.
     * @category Identification
     */
    typePuuid () {
        const puuid = this.puuid();
        let typeName = null;

        if (Type.isFunction(this.svType)) {
            typeName = this.svType();
        } else {
            typeName = Type.typeName(this);
        }

        if (this.isPrototype()) {
            typeName += "_Prototype";
        } else if (this.isClass()) {
            typeName += "_Class";
        }
        return typeName + "_" + puuid;
    }

    /**
     * Gets the type ID of the object.
     * @returns {string} The type ID.
     * @category Identification
     */
    svTypeId () {
        return this.typePuuid();
    }

    /**
     * Gets a debug-friendly type ID of the object.
     * @returns {string} A debug-friendly type ID.
     * @category Debugging
     */
    svDebugId () {
        const puuid = this.puuid().substr(0, 3);

        if (Type.isFunction(this.svType)) {
            return this.svType() + "_" + puuid;
        }
        return Type.typeName(this) + "_" + puuid;
    }

    /**
     * Gets the spacer used in debug type IDs.
     * @returns {string} The debug type ID spacer.
     * @category Debugging
     */
    svDebugIdSpacer () {
        return " -> ";
    }

}).initThisCategory();

assert(Object.svTypeId, "Object.svTypeId is not defined");

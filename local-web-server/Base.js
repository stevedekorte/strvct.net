
// ------------------------------------------------------------------

if (!String.prototype.capitalized) {
    String.prototype.capitalized = function () {
        return this.replace(/\b[a-z]/g, function (match) {
            return match.toUpperCase();
        });
    }
}

// ------------------------------------------------------------------

getGlobalThis().Base = class Base {
    // Base class with helpful methods for cloning and slot creation 

    static shared() {
        if (!this._shared) {
            this._shared = this.clone()
        }
        return this._shared
    }

    static type () {
        return this.name
    }

    type () {
        return this.constructor.name
    }

    static clone() {
        const obj = new this()
        obj.init()
        return obj
    }
    
    init() {
        // subclasses should override to initialize
    }

    newSlot(slotName, initialValue) {
        if (typeof(slotName) !== "string") {
            throw new Error("slot name must be a string"); 
        }

        if (initialValue === undefined) { 
            initialValue = null 
        };

        const privateName = "_" + slotName;
        this[privateName] = initialValue;

        if (!this[slotName]) {
            this[slotName] = function () {
                return this[privateName];
            }
        }

        const setterName = "set" + slotName.capitalized()

        if (!this[setterName]) {
            this[setterName] = function (newValue) {
                this[privateName] = newValue;
                return this;
            }
        }

        return this;
    }

    static initThisClass () {
        //console.log("this.classType() = ", this.classType())
        getGlobalThis()[this.type()] = this
        return this
    }
}

// ------------------------------------------------------------------

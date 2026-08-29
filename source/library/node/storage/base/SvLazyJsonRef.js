/** * @module library.node.storage.base
 */

/**
 * @class SvLazyJsonRef
 * @extends Object
 * @classdesc Placeholder parked in a lazy slot during JSON deserialize.
 * Analogous to SvStoreRef (pid until first getter): this holds the JSON
 * dict until first getter, so fromJson of a character/campaign does not
 * clone the lazy subtree (combat, skills, …) just to merge into it.
 */

(class SvLazyJsonRef extends Object {

    init () {
        super.init();
        Object.defineSlot(this, "_json", null);
        Object.defineSlot(this, "_filterName", null);
        Object.defineSlot(this, "_jsonPathComponents", null);
    }

    setJson (json) {
        this._json = json;
        return this;
    }

    json () {
        return this._json;
    }

    setFilterName (name) {
        this._filterName = name;
        return this;
    }

    filterName () {
        return this._filterName;
    }

    setJsonPathComponents (components) {
        this._jsonPathComponents = components;
        return this;
    }

    jsonPathComponents () {
        return this._jsonPathComponents;
    }

}.initThisClass());

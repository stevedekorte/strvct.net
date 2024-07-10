"use strict";

/*

    BMJsonCachedNode
    

*/
        
(class BMJsonCachedNode extends BMSummaryNode {

    initPrototypeSlots () {

        {
            // the json that this node represents
            // we update this when the node is edited
            // the node is the truth and the json is derived from it
            const slot = this.newSlot("jsonCache", null);
        }

        {
            // a hash of JSON.stableStrigify(jsonCache)
            const slot = this.newSlot("jsonHash", null);
        }
    }

    // --- json cache ---

    updateJsonHash () {
        this.setJsonHash(JSON.stableStringify(this.asJson()).hashCode());
        return this;
    }

    setJsonCache (json) {
        this._jsonCache = json;
        if (json === null) {
            this.setJsonHash(null);
        } else {
            this.setJsonHash(JSON.stableStringify(json).hashCode());
        }
        return this;
    }

    removeJsonCaches () {
        this.setJsonHash(null); 
        this.setJsonCache(null);  
        return this;
    }

    didUpdateNode () {
        super.didUpdateNode();
        this.removeJsonCaches(); 
    }

    doesMatchJson (json) {
        const a = JSON.stableStringify(json); 
        if (this.jsonHash()) {
            return this.jsonHash() === a.hashCode();
        }
        const b = JSON.stableStringify(this.asJson());
        return a === b;
    }

    asJson () {
        if (this.jsonCache() !== null) {
            return this.jsonCache();
        }
        const json = this.calcJson();
        this.setJsonCache(json);
        return json;
    }

  // --- JSON patches ---

    computeJsonPatches () {
        // patch format sample: [{ op: "replace", path: "/lastName", value: "Smith" }]
        const lastJson = this.lastJson() ? this.lastJson() : {};
        const currentJson = this.asJson();
        const patch = JsonPatch.compare(obj, updatedObj);
        this.setLastJson(currentJson);
        return patch;
    }

    applyJsonPatches (jsonPatches) {
        assert(Type.isJsonType(jsonPatches));

        let json = this.asJson();
        assert(Type.isJsonType(json));
        json = json.deepCopy();

        // if root node is replaced, json needs to update
        const results = JsonPatch.applyPatchWithAutoCreation(json, jsonPatches); // GPT sometimes forgets to define paths, so we do this to help it
        assert(results.newDocument, "Character.applyJsonPatches() results.newDocument missing");
        json = results.newDocument;
        assert(!json.newDocument, "Character.applyJsonPatches() json.newDocument should not have newDocument");

        if (jsonPatches.length === 0) {
            console.log("no patches to apply");
            debugger;
            return this;
        }
        // verify patch paths exist
        jsonPatches.forEach(patch => {
            const path = patch.path;
            if (!this.jsonHasPath(json, path)) {
            const errorMessage = this.type() + " applyJsonPatches( ) missing patched path: " + path;
            console.warn(errorMessage);

            // let's try it again so we can step through with the debugger
            //debugger
            JsonPatch.applyPatchWithAutoCreation(json, [patch]);
            }
        });

        const newJsonString = JSON.stableStringify(json);
        const oldJsonString = JSON.stableStringify(this.asJson());
        if (newJsonString === oldJsonString) {
            console.log("Character.applyJsonPatches() json applied correctly");
            debugger;
            return this; 
        } else {
            const delta = jsondiffpatch.diff(json, this.asJson());
            console.log("ERROR: asJson doesn't match json! Here's the delta: ", delta);
        }
        // apply new json
        this.setJson(json);
        assert (JSON.stableStringify(json) === JSON.stableStringify(this.asJson()), "Character.applyJsonPatches() json did not apply correctly");
        this.setLastJson(json);
        return this;
    }

    jsonHasPath (obj, path) { // helper method to find if a path exists in a json object
        const properties = path.split('/').slice(1); // Removing the leading slash
        let currentObj = obj;

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];

            if (currentObj.hasOwnProperty(prop)) {
            currentObj = currentObj[prop];
            } else {
            //debugger;
            return false;
            }
        }

        return true;
    }

}.initThisClass());

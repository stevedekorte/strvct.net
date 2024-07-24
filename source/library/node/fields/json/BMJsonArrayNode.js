"use strict";

/*

    BMJsonArrayNode
    

*/
        
(class BMJsonArrayNode extends BMJsonNode {
    
    static canOpenMimeType (mimeType) {
        return false;
    }

    static availableAsNodePrimitive () {
        return true;
    }

    static jsonDefaultValue () {
        return [];
    }

    static asJsonSchema (refSet) {
        assert(Type.isSet(refSet));
        const schema = {
            type: "array",
            title: this.jsonSchemaTitle(),
            description: this.jsonSchemaDescription(),
            default: this.jsonDefaultValue(),
            items: this.prototype.jsonSchemaForSubnodes(refSet) // prototype method
        };

        return schema;
    }

    jsonSchemaForSubnodes (refSet) { // NOTE: method on prototype, not class
        assert(refSet);
        const items = {};
        const refs = this.subnodeClasses().map(subnodeClass => {
            return { 
                "$ref": subnodeClass.jsonSchemaRef(refSet)
            };
        });
        if (refs.length > 0) {
            items.anyOf = refs;
        } else {
            throw new Error("BMJsonArrayNode.jsonSchemaForSubnodes() no subnode classes. Make sure setSubnodeClasses() is called in initPrototype.");
        }
        return items;
    }
    
    initPrototypeSlots () {
    }

    initPrototype () {
    }

    setupSubnodesSlotWithItemType (aClass) {
        const slot = this.overrideSlot("subnodes");
        slot.setIsInJsonSchema(true);
        slot.setShouldJsonArchive(true);
        slot.setJsonSchemaItemsType("CharacterClass");
        this.setSubnodeClasses([CharacterClass]);
    }

    subtitle () {
        if (this.thisClass().type() === "BMJsonArrayNode") {
            return "Array"; // so we know it's an array when using the UI to assembly JSON
        }

        return super.subtitle();
    }

    // --------------

    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(this.prepareSubnode(aSubnode), anIndex);
    }

    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true);

        if (aSubnode.keyIsVisible) {
            aSubnode.setKey("");
            aSubnode.setKeyIsVisible(false);
            aSubnode.setKeyIsEditable(false);
            const editableValueTypes = ["BMStringField", "BMNumberField", "BMBooleanField"];
            if (editableValueTypes.contains(aSubnode.type())) {
                aSubnode.setValueIsEditable(true);
            }
         }

        //aSubnode.setTitle(null);
        aSubnode.setNodeCanEditTitle(false);
        return aSubnode;
    }

    // -------

    jsonArchive () {
        return this.subnodes().map(sn => sn.jsonArchive());
    }

    newSubnodeForJson (json) {
        let aNode = null;
        if (this.subnodeClasses().length === 1) {
            const aClass = this.subnodeClasses().first();
            aNode = aClass.clone().setJson(json);
        } else {
            aNode = BMJsonNode.nodeForJson(json);
        }
        return aNode;
    }

    setJson (json) {
        // in order to merge json properly, we need to look at the jsonIds and match them up

        if (this.doesMatchJson(json)) {
            return this;
        }

        /*
        const hashSubnodeMap = new Map();
        this.subnodes().forEach(sn => {
            hashSubnodeMap.set(sn.jsonHash(), sn);
        });
        */

        const jsonIdToSubnodeMap = new Map();
        this.subnodes().forEach(sn => {
            jsonIdToSubnodeMap.set(sn.jsonId(), sn);
        });

        const hasOldSubnodes = this.subnodes().length > 0;

        const newSubnodes = [];

        json.forEach((v) => {
            //assert(v.jsonId);
            const jsonId = v.jsonId;

            if (hasOldSubnodes && !jsonId) {
                console.warn("BMJsonArrayNode.setJson() missing jsonId: ", v);
            }

            const existingNode = jsonIdToSubnodeMap.get(jsonId);

            if (existingNode) {
                // use the existing node
                existingNode.setJson(v);
                newSubnodes.push(existingNode);
            } else {
                // create a new node
                const aNode = this.newSubnodeForJson(v);
                newSubnodes.push(aNode);
                console.log("BMJsonArrayNode.setJson() creating new node " + aNode.type() + " for jsonId: ", jsonId);
                //debugger;
            }
        });

        this.setSubnodes(newSubnodes);
        this.setJsonCache(json);
        return this;
    }

    calcJson () {
        return this.subnodes().map(sn => sn.asJson());
    }

    getBMDataUrl () {
        //const json = this.node().copyArchiveDict();
        const json = this.jsonArchive();
        const d = BMDataUrl.clone();
        d.setMimeType("application/json");
        d.setFileName(this.title() + ".json");
        d.setDecodedData(JSON.stableStringify(json, null, 4));
        return d;
    }

}.initThisClass());

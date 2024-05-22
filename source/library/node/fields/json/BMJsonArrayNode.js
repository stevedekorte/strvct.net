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

    static asJsonSchema (refSet) {
        assert(Type.isSet(refSet));
        const schema = {
            type: "array",
            title: this.jsonSchemaTitle(),
            description: this.jsonSchemaDescription(),
            items: this.prototype.jsonSchemaForSubnodes(refSet) // prototype method
        };

        return schema;
    }

    jsonSchemaForSubnodes (refSet) { // NOTE: method on prototype, not class
        assert(refSet);
        const items = {};
        items.anyOf = this.subnodeClasses().map(subnodeClass => {
            return { 
                "$ref": subnodeClass.jsonSchemaRef(refSet)
            };
        });
        return items;
    }
    
    initPrototypeSlots () {
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

    setJson (json) {
        let index = 0;
        json.forEach((v) => {
            const aNode = BMJsonNode.nodeForJson(v);
            //aNode.setTitle(index);
            this.addSubnode(aNode);
            index ++;
        });
        return this;
    }

    getBMDataUrl () {
        //const json = this.node().copyArchiveDict();
        const json = this.jsonArchive();
        const d = BMDataUrl.clone();
        d.setMimeType("application/json");
        d.setFileName(this.title() + ".json");
        d.setDecodedData(JSON.stringify(json, null, 4));
        return d;
    }

}.initThisClass());

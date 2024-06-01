"use strict";

/*

    BMJsonDictionaryNode
    

*/
        
(class BMJsonDictionaryNode extends BMJsonNode {
    
    static canOpenMimeType (mimeType) {
        return false;
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("shouldMerge", true);
        }
    }

    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
        this.setCanDelete(true);
        this.setNoteIconName("right-arrow");
        //this.setSubtitle("Dictionary");
        this.setSummaryFormat("key value");
        this.setHasNewLineSeparator(true);
        this.setHasNewlineAfterSummary(true);
        //this.setNodeSummarySuffix("newline");
    }

    // ------------------------------

    jsonArchive () {
        // use asJson() if you want to get the json
        // jsonAcrchive is for the storable or communication version
        throw new Error("unimplemented");
    }

    // ------------------------------

    setJson (json) {
        assert(Type.isDictionary(json));

        json.ownForEachKV((k, v) => {
            const sn = this.firstSubnodeWithTitle(k); // do this if we want to merge
            if (this.shouldMerge() && sn) {
                sn.setJson(v);
            } else {
                const aNode = this.thisClass().nodeForJson(v);
                aNode.setTitle(k);
                if (aNode.setKey) {
                    aNode.setKey(k);
                }
                this.addSubnode(aNode);
            }
        })
        return this;
    }

    asJson () {
        const dict = {};
        this.subnodes().forEach((sn) => {
            const key = sn.key ? sn.key() : sn.title();
            if (sn.asJson) {
                // so we skip CreatorNode
                const value = sn.asJson();
                dict[key] = value;
            }
        })
        return dict;
    }

    // ----------

    addSubnodeAt (newNode, anIndex) {
        newNode = this.prepareSubnode(newNode);
        return super.addSubnodeAt(this.prepareSubnode(newNode), anIndex);
    }

    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    prepareSubnode (aSubnode) {
        this.assertValidSubnodeType(aSubnode);
        aSubnode.setCanDelete(true);

        if (aSubnode.keyIsVisible) {
            aSubnode.setKeyIsVisible(true);
            aSubnode.setKeyIsEditable(true);
        }

        aSubnode.setNodeCanEditTitle(true);
        return aSubnode;
    }

    // ------------

    getBMDataUrl () {
        const json = this.jsonArchive();
        const bdd = BMDataUrl.clone();
        bdd.setMimeType("application/json");
        bdd.setFileName(this.title() + ".json");
        bdd.setDecodedData(JSON.stringify(json, null, 4));
        return bdd;
    }

  // --- editable ---
  
  setIsEditable (aBool) {
    this.subnodes().forEach(sn => {
      if (sn.setIsEditable) {
        sn.setIsEditable(aBool);
        if (!aBool) {
            if (sn.setNodeCanAddSubnode) {
                sn.setNodeCanAddSubnode(false);
            }
        }
        //console.log(sn.title() + " setIsEditable(" + aBool + ")");
      }
    });
    return this;
  }
    
}.initThisClass());

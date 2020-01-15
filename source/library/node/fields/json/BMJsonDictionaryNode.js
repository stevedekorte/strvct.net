"use strict"

/*

    BMJsonDictionaryNode
    

*/
        
window.BMJsonDictionaryNode = class BMJsonDictionaryNode extends BMStorableNode {
    
    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setCanDelete(true)
        this.setNoteIconName("right arrow")
        this.setSubnodeProto(BMJsonCreatorNode)
    }

    init () {
        super.init()
        /*
        this.setNodeCanEditTitle(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setCanDelete(true)
        this.setNoteIconName("right arrow")
        */
        this.addAction("add")
        this.setSubnodeProto(BMJsonCreatorNode)
        this.setTitle("JSON")

    }

    subtitle () {
        return "Dictionary"
    }

    // ------------------------------

        // --------------



    acceptsAddingSubnode (aSubnode) {
        return BMJsonCreatorNode.acceptedDropTypes().contains(aSubnode.type())
    }

    dropJson (json) {
        const aNode = BMJsonCreatorNode.nodeForJson(json)
        aNode.setTitle("key")
        this.addSubnode(aNode)
    }

    setJson (json) {
        json.ownForEachKV((k, v) => {
            const aNode = BMJsonCreatorNode.nodeForJson(v)
            aNode.setTitle(k)
            if (aNode.setKey) {
                aNode.setKey(k)
            }
            this.addSubnode(aNode)
        })
        return this
    }



    // ----------

    addSubnode (newNode) {
        newNode = this.prepareSubnode(newNode)
        return super.addSubnode(newNode)
    }

    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode)
        return super.replaceSubnodeWith(oldNode, newNode)
    }

    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true)

        if (aSubnode.keyIsVisible) {
            aSubnode.setKeyIsVisible(true)
            aSubnode.setKeyIsEditable(true)
        }

        aSubnode.setNodeCanEditTitle(true)
        return aSubnode
    }

    // ------------

    jsonArchive () {
        const dict = {}
        this.subnodes().forEach((sn) => {
            const key = sn.key ? sn.key() : sn.title()
            const value = sn.jsonArchive()
            dict[key] = value
        })
        return dict
    }

    getBrowserDragData () {
        const json = this.jsonArchive() 
        const bdd = BrowserDragData.clone()
        bdd.setMimeType("application/json")
        bdd.setFileName(this.title() + ".json")
        bdd.setPayload(JSON.stringify(json, null, 4))
        return bdd
    }
    
}.initThisClass()

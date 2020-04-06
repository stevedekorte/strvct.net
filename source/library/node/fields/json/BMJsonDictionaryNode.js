"use strict"

/*

    BMJsonDictionaryNode
    

*/
        
window.BMJsonDictionaryNode = class BMJsonDictionaryNode extends BMJsonNode {
    
    static canOpenMimeType (mimeType) {
        return false
    }

    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setCanDelete(true)
        this.setNoteIconName("right arrow")
    }

    init () {
        super.init()
    }

    subtitle () {
        return "Dictionary"
    }

    // ------------------------------

    setJson (json) {
        json.ownForEachKV((k, v) => {
            const aNode = this.thisClass().nodeForJson(v)
            aNode.setTitle(k)
            if (aNode.setKey) {
                aNode.setKey(k)
            }
            this.addSubnode(aNode)
        })
        return this
    }

    // ----------

    addSubnodeAt (newNode, anIndex) {
        newNode = this.prepareSubnode(newNode)
        return super.addSubnodeAt(this.prepareSubnode(newNode), anIndex)
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

    getBMDataUrl () {
        const json = this.jsonArchive() 
        const bdd = BMDataUrl.clone()
        bdd.setMimeType("application/json")
        bdd.setFileName(this.title() + ".json")
        bdd.setDecodedData(JSON.stringify(json, null, 4))
        return bdd
    }
    
}.initThisClass()

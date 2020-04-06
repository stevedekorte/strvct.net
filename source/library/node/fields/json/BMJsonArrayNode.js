"use strict"

/*

    BMJsonArrayNode
    

*/
        
window.BMJsonArrayNode = class BMJsonArrayNode extends BMJsonNode {
    
    static canOpenMimeType (mimeType) {
        return false
    }

    static availableAsNodePrimitive() {
        return true
    }
    
    initPrototype () {
    }

    init () {
        super.init()
    }

    subtitle () {
        return "Array"
    }

    // --------------

    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode)
        return super.replaceSubnodeWith(oldNode, newNode)
    }

    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(this.prepareSubnode(aSubnode), anIndex)
    }

    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true)

        if (aSubnode.keyIsVisible) {
            aSubnode.setKey("")
            aSubnode.setKeyIsVisible(false)
            aSubnode.setKeyIsEditable(false)
            const editableValueTypes = ["BMStringField", "BMNumberField", "BMBooleanField"]
            if (editableValueTypes.contains(aSubnode.type())) {
                aSubnode.setValueIsEditable(true)
            }
         }

        //aSubnode.setTitle(null)
        aSubnode.setNodeCanEditTitle(false)
        return aSubnode
    }

    // -------

    jsonArchive () {
        return this.subnodes().map(sn => sn.jsonArchive())
    }

    setJson (json) {
        let index = 0
        json.forEach((v) => {
            const aNode = BMJsonNode.nodeForJson(v)
            //aNode.setTitle(index)
            this.addSubnode(aNode)
            index ++
        })
        return this
    }

    getBMDataUrl () {
        //const json = this.node().copyArchiveDict() 
        const json = this.jsonArchive() 
        const bdd = BMDataUrl.clone()
        bdd.setMimeType("application/json")
        bdd.setFileName(this.title() + ".json")
        bdd.setDecodedData(JSON.stringify(json, null, 4))
        return bdd
    }
    
}.initThisClass()

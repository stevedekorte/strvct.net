"use strict"

/*

    BMJsonArrayNode
    

*/
        
window.BMJsonArrayNode = class BMJsonArrayNode extends BMStorableNode {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setNodeCanEditTitle(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setCanDelete(true)
        this.setNoteIconName("right arrow")

        this.addAction("add")
        this.setSubnodeProto(BMJsonCreatorNode)
        this.setTitle("JSON")
    }


    subtitle () {
        return "Array"
    }

    // --------------

    acceptsAddingSubnode (aSubnode) {
        return BMJsonCreatorNode.acceptedDropTypes().contains(aSubnode.type())
    }

    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode)
        return super.replaceSubnodeWith(oldNode, newNode)
    }

    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true)

        if (aSubnode.keyIsVisible) {
            aSubnode.setKey("")
            aSubnode.setKeyIsVisible(false)
            aSubnode.setKeyIsEditable(false)
        }

        //aSubnode.setTitle(null)
        aSubnode.setNodeCanEditTitle(false)
        return aSubnode
    }

    // -------

    copyArchiveDict () {
        return this.jsonArchive()
    }

    jsonArchive() {
        return this.subnodes().map(sn => sn.jsonArchive())
    }

    setJson (json) {
        let index = 0
        json.forEach((v) => {
            const aNode = BMJsonCreatorNode.nodeForJson(v)
            //aNode.setTitle(index)
            this.addSubnode(aNode)
            index ++
        })
        return this
    }

    
}.initThisClass()

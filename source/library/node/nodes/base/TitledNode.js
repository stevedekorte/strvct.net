"use strict";

/*

    TitledNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Class for handling a node's:

        title
        subtitle
        summary
        icon/thumbnail (move to viewable?)

*/

(class TitledNode extends BMNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("title", null)
            slot.setDuplicateOp("copyValue")
        }

        {
            const slot = this.newSlot("subtitle", null)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setLabel("value")
            slot.setSlotType("String")
            slot.setInspectorPath("Node/Subtitle")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("note", null)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("noteIconName", null)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setLabel("icon")
            slot.setSlotType("String")
            slot.setValidValuesClosure((instance) => BMIconResources.shared().iconNames())
            slot.setInspectorPath("Node/Note")
        }

        {
            const slot = this.newSlot("nodeCanEditTitle", false)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("nodeCanEditSubtitle", false)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setLabel("editable")
            slot.setSlotType("Boolean")
            slot.setInspectorPath("Node/Subtitle")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("subtitleIsSubnodeCount", false)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("noteIsSubnodeCount", false)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
        }

    }

    // subtitle and note
    
    subtitle () {
        if (this.subtitleIsSubnodeCount() && this.subnodesCount()) {
            return this.subnodesCount()
        }
        
        return this._subtitle
    }
    
    note () {
        //console.log(this.title() + " noteIsSubnodeCount: " + this.noteIsSubnodeCount())
        if (this.noteIsSubnodeCount()) {
            const count = this.subnodesCount()
            if (count) {
                return count
            }

            return ""
        }
        
        return this._note
    }

    nodeHeaderTitle () {
        return this.title()
    }

    // --- title based paths ---
    
    nodePath () {
        if (this.parentNode()) {
            const parts = this.parentNode().nodePath()
            parts.push(this)
            return parts
        }
        return [this]
    }

    nodePathArrayForPathComponents (pathComponents, results = []) {
        results.push(this)

        const link = this.nodeTileLink()
        if (link && link !== this) {
            return link.nodePathArrayForPathComponents(pathComponents) 
        }

        const pathComponent = pathComponents.first()
        if (pathComponent) {
            const nextNode = this.firstSubnodeWithTitle(pathComponent)
            if (nextNode) {
                return nextNode.nodePathArrayForPathComponents(pathComponents.rest())
            }
        }
        return results
    }
    
    nodePathString () {
        return this.nodePath().map(node => node.title()).join("/")
    }
    
    nodeAtSubpathString (pathString) {
        return this.nodeAtSubpath(pathString.split("/"));        
    }
    
    nodeAtSubpath (subpathArray) {
        if (subpathArray.length) {
            const t = subpathArray.first()

            let subnode = null
            if (Type.isArray(t)) {
                // supports a path component that is an ordered list of subnodes titles 
                subnode = this.firstSubnodeWithTitles(t)
            } else {
                subnode = this.firstSubnodeWithTitle(t)
            }

            if (subnode) {
                return subnode.nodeAtSubpath(subpathArray.rest())
            }
            return null
        }        
        return this
    }

    // --- lookups and ops on subnodes via title/subtitle -------------------------------


    removeFirstSubnodeWithTitle (aString) {
        const sn = this.firstSubnodeWithTitle(aString)
        if (sn) {
            sn.delete()
        }
        return this
    }

    firstSubnodeWithTitle (aString) {
        return this.subnodes().detect(subnode => subnode.title() === aString)
    }

    firstSubnodeWithTitles (titlesArray) {
        for (let i = 0; i < titlesArray.length; i++) {
            const title = titlesArray[i]
            const subnode = this.firstSubnodeWithTitle(title)
            if (subnode) {
                return subnode
            }
        }
        return null
    }

    firstSubnodeWithSubtitle (aString) {
        return this.subnodes().detect(subnode => subnode.subtitle() === aString)
    }

    rootNode () {
        //debugger;
        const store = this.defaultStore()
        const root = store.rootObject()
        //root.setTitle("root")
        return root
    }

    /*
    rootSubnodeWithTitleForProto (aString, aProto) {
        return this.rootNode().subnodeWithTitleIfAbsentInsertProto(aString, aProto)
    }
    */
   
    subnodeWithTitleIfAbsentInsertProto (aString, aProto) {
        const subnode = this.firstSubnodeWithTitle(aString)

        if (subnode) {
            if (subnode.type() !== aProto.type()) {
                // replace the subnode with matching title, 
                // if it's not of the requested class

                const newSubnode = aProto.clone()
                try {
                    //newSubnode.copyFrom(subnode, true)
                    newSubnode.copyFromAndIgnoreMissingSlots(subnode)
                } catch (error) {
                    if (error instanceof MissingSlotError) {
                        debugger;
                    } else {
                        throw error
                    }
                }
                // TODO: Do we need to replace all references in pool and reload?
                this.replaceSubnodeWith(subnode, newSubnode)
                this.removeOtherSubnodesWithSameTitle(newSubnode)
                return newSubnode
            }

            this.removeOtherSubnodesWithSameTitle(subnode)
            return subnode
        }

        return this.subnodeWithTitleIfAbsentInsertClosure(aString, () => aProto.clone())
    }

    addSubnodeAndSetSlotForClass (aName, aClass) {
        // like subnodeWithTitleIfAbsentInsertProto but we also set the matching slot value to the subnode 
        // (eg, subnode with title "Resources", sets "resources" slot)
        const subnode = this.subnodeWithTitleIfAbsentInsertProto(aName, aClass)
        this.removeOtherSubnodesWithSameTitle(subnode)
        const slot = this.thisPrototype().slotNamed(aName.toLowerCase())
        assert(slot)
        if (slot) {
            slot.onInstanceSetValue(this, subnode) 
        }
        return subnode
    }

    removeSubnodesWithTitle (aString) {
        this.subnodes().select(sn => sn.title() === aString).forEach(sn => sn.delete())
        return this
    }

    /*
    removeOtherSubnodeInstances (aSubnode) {
        assert(this.hasSubnode(aSubnode))
        this.subnodes().shallowCopy().forEach((sn) => {
            if (sn !== aSubnode) {
                if (sn.thisClass() === aSubnode.thisClass()) {
                    this.removeSubnode(sn)
                }
            }
        })
        return this
    }
    */

    removeOtherSubnodesWithSameTitle (aSubnode) {
        assert(this.hasSubnode(aSubnode))
        this.subnodes().shallowCopy().forEach((sn) => {
            if (sn !== aSubnode) {
                if (sn.title() === aSubnode.title()) {
                    this.removeSubnode(sn)
                }
            }
        })
        return this
    }

    subnodeWithTitleIfAbsentInsertClosure (aString, aClosure) {
        let subnode = this.firstSubnodeWithTitle(aString)

        if (!subnode && aClosure) {
            subnode = aClosure()
            subnode.setTitle(aString)

            this.addSubnode(subnode)
        }

        return subnode
    }

    // --- sorting helper ---

    makeSortSubnodesByTitle () {
        this.setSubnodeSortFunc( (a, b) => a.title().localeCompare(b.title()) )
        return this
    }

    // --- node view badge ---

    nodeViewShouldBadge () {
        return false
    }

    nodeViewBadgeTitle () {
        return null
    }

    // --- summary ---

    summary () {
        return this.title() + " " + this.subtitle()
    }

    
}.initThisClass());





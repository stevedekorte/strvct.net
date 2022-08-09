"use strict";

/*
    DomView_browserDragAndDrop

    For subclasses to extend. Ancestors of this class are organizational parts of DomView.

*/

(class DomView_browserDragAndDrop extends DomView {
    
    // -- browser register for drop ---

    isRegisteredForBrowserDrop () {
        return this.dropListener().isListening()
    }

    setIsRegisteredForBrowserDrop (aBool) {
        this.dropListener().setIsListening(aBool)
        return this
    }

    acceptsDrop () {
        return true // make ivar?
    }

    // ---------------------

    onBrowserDragEnter (event) {
        // triggered on drop target
        //console.log("onBrowserDragEnter acceptsDrop: ", this.acceptsDrop());
        event.preventDefault() // needed?

        if (this.acceptsDrop(event)) {
            this.onBrowserDragOverAccept(event)
            return true
        }

        return false;
    }

    onBrowserDragOver (event) {
        // triggered on drop target
        //console.log("onBrowserDragOver acceptsDrop: ", this.acceptsDrop(event), " event:", event);

        event.preventDefault()

        if (this.acceptsDrop(event)) {
            event.dataTransfer.dropEffect = "copy";
            event.dataTransfer.effectAllowed = "copy";
            this.onBrowserDragOverAccept(event)
            return true
        }

        return false;
    }

    onBrowserDragOverAccept (event) {
        //console.log("onBrowserDragOverAccept ");
        this.dragHighlight()
    }

    onBrowserDragLeave (event) {
        // triggered on drop target
        //console.log("onBrowserDragLeave ", this.acceptsDrop(event));
        this.dragUnhighlight()
        return this.acceptsDrop(event);
    }

    dragHighlight () {

    }

    dragUnhighlight () {

    }

    // --- browser drop ---

    onBrowserDrop (event) {
        if (this.acceptsDrop(event)) {
            //const file = event.dataTransfer.files[0];
            //console.log('onDrop ' + file.path);
            this.onBrowserDataTransfer(event.dataTransfer)
            this.dragUnhighlight()
            event.preventDefault();
            event.stopPropagation()
            return true;
        }
        event.preventDefault();
        return false
    }

    dropMethodForMimeType (mimeType) {
        let s = mimeType.replaceAll("/", " ")
        s = s.replaceAll("-", " ")
        s = s.capitalizeWords()
        s = s.replaceAll(" ", "")
        return "onBrowserDrop" + s
    }

    onBrowserDataTransfer (dataTransfer) {
        // TODO: we need a way to avoid handling the same item twice...

        if (dataTransfer.files.length) {
            for (let i = 0; i < dataTransfer.files.length; i++) {
                const file = dataTransfer.files[i]
                this.onBrowserDropFile(file)
            }
        } else if (dataTransfer.items) {
            let data = dataTransfer.items

            let dataTransferItems = []
            for (let i = 0; i < data.length; i++) {
                dataTransferItems.push(data[i])
            }

            dataTransferItems = dataTransferItems.reversed()

            for (let i = 0; i < dataTransferItems.length; i++) {
                const dataTransferItem = dataTransferItems[i]
                const mimeType = dataTransferItem.type

                // Example MIME types: 
                // text/plain, text/html, text/uri-list

                if (mimeType) {
                    dataTransferItem.getAsString((s) => {
                        const chunk = BMDataUrl.clone()
                        chunk.setMimeType(mimeType)
                        chunk.setDecodedData(s)
                        console.log("mimeType:", mimeType)
                        console.log("    data:", s)
                        this.onBrowserDropChunk(chunk)
                    })
                }
                break; // only send the first MIME type for now
            }
        }
    }

    onBrowserDropFile (file) {
        const mimeType = file.type
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target.result
            this.onBrowserDropMimeTypeAndRawData(mimeType, data)
        }
        reader.readAsDataURL(file);
    }

    onBrowserDropMimeTypeAndRawData (mimeType, dataUrl) {
        const dd = BMDataUrl.clone().setDataUrlString(dataUrl)
        this.onBrowserDropChunk(dd)
    }

    onBrowserDropChunk (dataChunk) {
        // if the view has a method for the mime type of the file
        // e.g. onBrowserDropImageJpeg
        // then we call it. If the view wants to handle all types,
        // it can override this method.

        const methodName = this.dropMethodForMimeType(dataChunk.mimeType())
        const method = this[methodName]
        console.log("onBrowserDropFile => ", methodName)

        if (method) {
            method.apply(this, [dataChunk])
        }
    }

    // --- browser dragging ---

    setDraggable (aBool) {
        assert(Type.isBoolean(aBool))
        this.element().setAttribute("draggable", aBool)
        return this
    }

    draggable () {
        return this.element().getAttribute("draggable")
    }

    isRegisteredForBrowserDrag () {
        return this.browserDragListener().isListening()
    }

    setIsRegisteredForBrowserDrag (aBool) {
        this.browserDragListener().setIsListening(aBool)
        this.setDraggable(aBool)
        return this
    }

    onBrowserDragStart (event) {
        return false;
    }

    onBrowserDragEnd (event) {
        // triggered in element being dragged
        this.dragUnhighlight();
        //console.log("onDragEnd");
    }

}.initThisCategory());

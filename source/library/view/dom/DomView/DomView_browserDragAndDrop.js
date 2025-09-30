/**
 * @module library.view.dom.DomView
 */

/**
 * @class DomView_browserDragAndDrop
 * @extends DomView
 * @classdesc DomView_browserDragAndDrop
 *
 * For subclasses to extend. Ancestors of this class are organizational parts of DomView.
 */
(class DomView_browserDragAndDrop extends DomView {

    // -- browser register for drop ---

    /**
     * @description Checks if the view is registered for browser drop.
     * @returns {boolean} True if registered for browser drop, false otherwise.
     * @category Drop Registration
     */
    isRegisteredForBrowserDrop () {
        return this.dropListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for browser drop.
     * @param {boolean} aBool - True to register for browser drop, false to unregister.
     * @returns {this} The current instance.
     * @category Drop Registration
     */
    setIsRegisteredForBrowserDrop (aBool) {
        this.dropListener().setIsListening(aBool);
        return this;
    }

    /**
     * @description Checks if the view accepts drops.
     * @returns {boolean} True if the view accepts drops, false otherwise.
     * @category Drop Handling
     */
    acceptsDrop () {
        return true; // make ivar?
    }

    // ---------------------

    /**
     * @description Handles the browser drag enter event.
     * @param {Event} event - The drag enter event.
     * @returns {boolean} True if the drop is accepted, false otherwise.
     * @category Drag Event Handling
     */
    onBrowserDragEnter (event) {
        event.preventDefault(); // needed?

        if (this.acceptsDrop(event)) {
            this.onBrowserDragOverAccept(event);
            return true;
        }

        return false;
    }

    /**
     * @description Handles the browser drag over event.
     * @param {Event} event - The drag over event.
     * @returns {boolean} True if the drop is accepted, false otherwise.
     * @category Drag Event Handling
     */
    onBrowserDragOver (event) {
        event.preventDefault();

        if (this.acceptsDrop(event)) {
            event.dataTransfer.dropEffect = "copy";
            event.dataTransfer.effectAllowed = "copy";
            this.onBrowserDragOverAccept(event);
            return true;
        }

        return false;
    }

    /**
     * @description Handles the browser drag over accept event.
     * @param {Event} event - The drag over event.
     * @category Drag Event Handling
     */
    onBrowserDragOverAccept (event) {
        this.dragHighlight();
    }

    /**
     * @description Handles the browser drag leave event.
     * @param {Event} event - The drag leave event.
     * @returns {boolean} True if the drop is accepted, false otherwise.
     * @category Drag Event Handling
     */
    onBrowserDragLeave (event) {
        this.dragUnhighlight();
        return this.acceptsDrop(event);
    }

    /**
     * @description Highlights the drag area.
     * @category UI
     */
    dragHighlight () {

    }

    /**
     * @description Removes the highlight from the drag area.
     * @category UI
     */
    dragUnhighlight () {

    }

    // --- browser drop ---

    /**
     * @description Handles the browser drop event.
     * @param {Event} event - The drop event.
     * @returns {boolean} True if the drop is accepted and handled, false otherwise.
     * @category Drop Handling
     */
    onBrowserDrop (event) {
        if (this.acceptsDrop(event)) {
            this.onBrowserDataTransfer(event.dataTransfer);
            this.dragUnhighlight();
            event.preventDefault();
            event.stopPropagation();
            return true;
        }
        event.preventDefault();
        return false;
    }

    /**
     * @description Determines the method name for handling a specific MIME type drop.
     * @param {string} mimeType - The MIME type.
     * @returns {string} The method name for handling the drop.
     * @category Drop Handling
     */
    dropMethodForMimeType (mimeType) {
        let s = mimeType.replaceAll("/", " ");
        s = s.replaceAll("-", " ");
        s = s.capitalizeWords();
        s = s.replaceAll(" ", "");
        return "onBrowserDrop" + s;
    }

    /**
     * @description Handles the browser data transfer.
     * @param {DataTransfer} dataTransfer - The data transfer object.
     * @category Drop Handling
     */
    onBrowserDataTransfer (dataTransfer) {
        if (dataTransfer.files.length) {
            for (let i = 0; i < dataTransfer.files.length; i++) {
                const file = dataTransfer.files[i];
                this.onBrowserDropFile(file);
            }
        } else if (dataTransfer.items) {
            let data = dataTransfer.items;

            let dataTransferItems = [];
            for (let i = 0; i < data.length; i++) {
                dataTransferItems.push(data[i]);
            }

            dataTransferItems = dataTransferItems.reversed();

            for (let i = 0; i < dataTransferItems.length; i++) {
                const dataTransferItem = dataTransferItems[i];
                const mimeType = dataTransferItem.type;

                if (mimeType) {
                    dataTransferItem.getAsString((s) => {
                        const chunk = SvDataUrl.clone();
                        chunk.setMimeType(mimeType);
                        chunk.setDecodedData(s);
                        console.log("Drag mimeType: '" + mimeType + "'");
                        console.log("    data: " + s.length + " bytes");
                        this.onBrowserDropChunk(chunk);
                    });
                }
                break; // only send the first MIME type for now
            }
        }
    }

    /**
     * @description Handles the browser drop file event.
     * @param {File} file - The dropped file.
     * @returns {Promise<void>}
     * @category Drop Handling
     */
    async onBrowserDropFile (file) {
        const mimeType = file.type;
        const data = await FileReader.promiseReadAsDataURL(file);
        this.onBrowserDropMimeTypeAndRawData(mimeType, data);
    }

    /**
     * @description Handles the browser drop with MIME type and raw data.
     * @param {string} mimeType - The MIME type of the dropped data.
     * @param {string} dataUrl - The data URL of the dropped data.
     * @category Drop Handling
     */
    onBrowserDropMimeTypeAndRawData (mimeType, dataUrl) {
        const dd = SvDataUrl.clone().setDataUrlString(dataUrl);
        this.onBrowserDropChunk(dd);
    }

    /**
     * @description Handles the browser drop chunk.
     * @param {SvDataUrl} dataChunk - The data chunk.
     * @category Drop Handling
     */
    onBrowserDropChunk (dataChunk) {
        const methodName = this.dropMethodForMimeType(dataChunk.mimeType());
        const method = this[methodName];
        console.log("onBrowserDropFile => ", methodName);

        if (method) {
            method.call(this, dataChunk);
        }
    }

    // --- browser dragging ---

    /**
     * @description Sets whether the view is draggable.
     * @param {boolean} aBool - True to make draggable, false otherwise.
     * @returns {this} The current instance.
     * @category Drag Configuration
     */
    setDraggable (aBool) {
        assert(Type.isBoolean(aBool));
        this.element().setAttribute("draggable", aBool);
        return this;
    }

    /**
     * @description Checks if the view is draggable.
     * @returns {string} The draggable attribute value.
     * @category Drag Configuration
     */
    draggable () {
        return this.element().getAttribute("draggable");
    }

    /**
     * @description Checks if the view is registered for browser drag.
     * @returns {boolean} True if registered for browser drag, false otherwise.
     * @category Drag Registration
     */
    isRegisteredForBrowserDrag () {
        return this.browserDragListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for browser drag.
     * @param {boolean} aBool - True to register for browser drag, false to unregister.
     * @returns {this} The current instance.
     * @category Drag Registration
     */
    setIsRegisteredForBrowserDrag (aBool) {
        this.browserDragListener().setIsListening(aBool);
        this.setDraggable(aBool);
        return this;
    }

    /**
     * @description Handles the browser drag start event.
     * @param {Event} event - The drag start event.
     * @returns {boolean} False to indicate the event was not handled.
     * @category Drag Event Handling
     */
    onBrowserDragStart (event) {
        return false;
    }

    /**
     * @description Handles the browser drag end event.
     * @param {Event} event - The drag end event.
     * @category Drag Event Handling
     */
    onBrowserDragEnd (event) {
        this.dragUnhighlight();
    }

}.initThisCategory());

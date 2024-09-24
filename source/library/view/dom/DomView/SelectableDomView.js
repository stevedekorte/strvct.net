/**
 * @module library.view.dom.DomView
 */

/**
 * @class SelectableDomView
 * @extends ControlDomView
 * @classdesc SelectableDomView
 * 
 * For subclasses to extend. Ancestors of this class are organizational parts of DomView.
 */
(class SelectableDomView extends ControlDomView {
    
    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        /**
         * @property {Range} storedSelectionRange - The stored selection range.
         */
        {
            const slot = this.newSlot("storedSelectionRange", null);
            slot.setSlotType("Range");
        }
    }

    /**
     * @description Gets the selected text.
     * @returns {string} The selected text or an empty string if no selection.
     */
    getSelectedText () {
        if (this.containsSelection()) { // this.isFocused() should be true
            const selection = window.getSelection();
            return selection.toString();
        } else {
            console.warn(this.type() + " attempt to get selection on unfocused text")
        }
        return ""
    }

    /**
     * @description Stores the current selection range.
     * @returns {boolean} True if a range was stored, false otherwise.
     */
    storeSelectionRange () {
        const range = this.getSelectionRange();
        if (range) {
            console.log(this.typeId() + "--- storing selection ---")
            this.setStoredSelectionRange(range);
            return true;
        }
        return false;
    }

    /**
     * @description Restores the previously stored selection range.
     * @returns {boolean} True if a range was restored, false otherwise.
     */
    restoreSelectionRange () {
        if (this.storedSelectionRange()) {
            console.log(this.typeId() + "--- restoring selection ---");
            this.setSelectionRange(this.storedSelectionRange()); // may be null
            assert(this.storedSelectionRange().isEqual(this.getWindowSelectionRange()));
            this.setStoredSelectionRange(null);
            return true;
        }
        return false;
    }

    /**
     * @description Gets the current window selection range.
     * @returns {Range|null} The current window selection range or null if not available.
     */
    getWindowSelectionRange () {
        if (window.getSelection) {
            const selection = window.getSelection();
            //selection.collapse(<node>); // safe?
            if (selection.getRangeAt && selection.rangeCount) {
                return selection.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }

    /**
     * @description Sets the window selection range.
     * @param {Range} range - The range to set as the window selection.
     * @returns {SelectableDomView} The instance for method chaining.
     */
    setWindowSelectionRange (range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
        return this;
    }

    /**
     * @description Gets the current selection range if it's contained within this view.
     * @returns {Range|null} The current selection range or null if not contained.
     */
    getSelectionRange () {
        if (!this.containsSelection()) {
            return null;
        }

        return this.getWindowSelectionRange();
    }
    
    /**
     * @description Sets the selection range if it's contained within this view.
     * @param {Range} range - The range to set as the selection.
     * @returns {SelectableDomView|null} The instance for method chaining or null if not contained.
     */
    setSelectionRange (range) {
        if (!this.isContainedBySelectionRange(range)) {
            return null;
        }

        this.setWindowSelectionRange(range);
        return this;
    }

    /**
     * @description Places the caret at the end of the content.
     * @returns {SelectableDomView} The instance for method chaining.
     */
    placeCaretAtEnd () {
        const el = this.element()
        el.focus();

        if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange !== "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
        return this
    }

    /**
     * @description Moves the caret to the end of the content.
     * @returns {SelectableDomView} The instance for method chaining.
     */
    moveCaretToEnd () {
        const contentEditableElement = this.element()
        let range, selection;

        if (document.createRange) {
            //Firefox, Chrome, Opera, Safari, IE 9+
            range = document.createRange(); //Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection(); //get the selection object (allows you to change selection)
            selection.removeAllRanges(); //remove any selections already made
            selection.addRange(range); //make the range you have just created the visible selection
        }
        else if (document.selection) {
            //IE 8 and lower
            range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
        return this
    }

    /**
     * @description Selects all content within the view.
     */
    selectAll () {
        if (document.selection) {
            const range = document.body.createTextRange();
            range.moveToElementText(this.element());
            range.select();
        } else if (window.getSelection) {
            const selection = window.getSelection(); 
            const range = document.createRange();
            range.selectNodeContents(this.element());
            selection.removeAllRanges();
            selection.addRange(range);  
        }
    }

    /**
     * @description Replaces the selected text with the provided replacement text.
     * @param {string} replacementText - The text to replace the selection with.
     * @returns {SelectableDomView} The instance for method chaining.
     */
     replaceSelectedText (replacementText) {
        let range;
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(replacementText));
            }

            console.log("inserted node")
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.text = replacementText;
            console.log("set range.text")
        }

        if (range) {
            // now move the selection to just the end of the range
            range.setStart(range.endContainer, range.endOffset);
        }

        this.didEdit();

        return this
    }

    /**
     * @description Gets the current caret position.
     * @returns {number} The caret position.
     */
    getCaretPosition () {
        const editableElement = this.element()
        let caretPos = 0
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode == editableElement) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            const range = document.selection.createRange();
            if (range.parentElement() == editableElement) {
                const tempEl = document.createElement("span");
                editableElement.insertBefore(tempEl, editableElement.firstChild);
                const tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);
                caretPos = tempRange.text.length;
            }
        }
        return caretPos;
    }

    /**
     * @description Sets the caret position.
     * @param {number} caretPos - The desired caret position.
     */
    setCaretPosition (caretPos) {
        const e = this.element();

        if (e != null) {
            if (e.createTextRange) {
                const range = e.createTextRange();
                range.move("character", caretPos);
                range.select();
            }
            else {
                if (e.selectionStart) {
                    e.focus();
                    e.setSelectionRange(caretPos, caretPos);
                } else {
                    e.focus();
                }
            }
        }
    }

    /**
     * @description Clears the selection if it's contained within this view.
     * @returns {SelectableDomView} The instance for method chaining.
     */
    clearSelection () { // only clear it if the selection is in this view
        if (!this.containsSelection()) {
            return this;
        }

        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
        return this;
    }

    /**
     * @description Checks if the given range is contained within this view.
     * @param {Range} range - The range to check.
     * @returns {boolean} True if the range is contained, false otherwise.
     */
    isContainedBySelectionRange (range) {
        if (range) {
            const containsElement = range.intersectsNode(this.element(), true);
            return containsElement;
        }
        return false;
    }

    /**
     * @description Checks if this view is in the window selection.
     * @returns {boolean} True if the view is in the window selection, false otherwise.
     */
    isInWindowSelection () {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        return this.isContainedBySelectionRange(range);
    }

    /**
     * @description Checks if this view contains the current selection.
     * @returns {boolean} True if the view contains the selection, false otherwise.
     */
    containsSelection () {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        const element = this.element();
        return element.contains(startContainer) && element.contains(endContainer);
    }

}.initThisClass());
/** * @module browser.stack.SvTile.field_tiles
 */

/** * @class SvStringFieldTile
 * @extends SvFieldTile
 * @classdesc SvStringFieldTile class for handling string field tiles.
 
 
 */

(class SvStringFieldTile extends SvFieldTile {

    /*
    initPrototypeSlots () {
            }

    initPrototype () {
    }

    init () {
        super.init()
        return this
    }
    */

    /**
     * Creates and configures a value view for the string field tile.
     * @returns {TextField} The configured TextField instance.
     * @description Creates a TextField instance and sets its display properties.
     * @category UI
     */
    createValueView () {
        const v = SvTextView.clone();
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setBorderRadius("0.2em");
        return v;
    }

    syncValueFromNode () {
        const node = this.node();

        const valueAllowsHtml = (node.valueAllowsHtml ? node.valueAllowsHtml() : null);
        if (!Type.isNull(valueAllowsHtml)) {
            const vv = this.valueView();
            if (vv.setAllowsHtml) {
                vv.setAllowsHtml(valueAllowsHtml);
                if (valueAllowsHtml) {
                    vv.setIsEditable(false); // TODO: make sure this doesn't get overridden
                }
            }
        }

        const valueWhiteSpace = (node.valueWhiteSpace ? node.valueWhiteSpace() : null);
        if (!Type.isNull(valueWhiteSpace)) {
            const vv = this.valueView();
            if (vv.setWhiteSpace) {
                vv.setWhiteSpace(valueWhiteSpace);
            }
        }

        super.syncValueFromNode();
        this.scheduleScrollToHtmlTarget();
    }

    // --- links in an HTML value (SvField_htmlLinks) ---

    /**
     * @description A tap on a `data-sv-link` element opens where the link
     * leads; any other tap is the tile's.
     * @param {SvGestureRecognizer} aGesture
     * @returns {SvStringFieldTile}
     * @category Links
     */
    onTapComplete (aGesture) {
        const link = this.htmlLinkElementForGesture(aGesture);
        if (link && this.openHtmlLink(link.getAttribute("data-sv-link"))) {
            return this;
        }
        return super.onTapComplete(aGesture);
    }

    htmlLinkElementForGesture (aGesture) {
        const event = aGesture.beginEvent() || aGesture.downEvent();
        const target = event ? event.target : null;
        return (target && target.closest) ? target.closest("[data-sv-link]") : null;
    }

    /**
     * @description Opens the route the field's owner gives for a link: the
     * browser keeps its path up to the route's first node (already shown)
     * and selects the rest after it, as an inline document's links do.
     * @param {string} linkValue
     * @returns {Boolean} Whether the link led somewhere shown.
     * @category Links
     */
    openHtmlLink (linkValue) {
        const node = this.node();
        const route = (node && node.routeForHtmlLink) ? node.routeForHtmlLink(linkValue) : null;
        const browser = route ? this.firstParentViewWithAncestorClass(SvBrowserView) : null;
        if (!browser) {
            return false;
        }
        const current = browser.stackView().selectedNodePathArray();
        const at = current.indexOf(route.first());
        if (at === -1) {
            return false;
        }
        browser.selectPathWithRetry(current.slice(0, at + 1).concat(route.slice(1)));
        return true;
    }

    /**
     * @description Scrolls to the node's HTML scroll target once it is in the
     * rendered value. A sync can run before the column is laid out, so the
     * scroll waits a turn; a value without the element yet (a placeholder)
     * keeps the target for a later sync.
     * @returns {SvStringFieldTile}
     * @category Links
     */
    scheduleScrollToHtmlTarget () {
        const node = this.node();
        const id = (node && node.htmlScrollTargetId) ? node.htmlScrollTargetId() : null;
        if (id) {
            this.addTimeout(() => this.scrollToHtmlTarget(id), 0, "scrollToHtmlTarget");
        }
        return this;
    }

    scrollToHtmlTarget (id) {
        const element = this.valueView().element().querySelector("[id='" + id.replaceAll("'", "") + "']");
        const node = this.node();
        if (!element || !node || node.htmlScrollTargetId() !== id) {
            return this;
        }
        element.scrollIntoView({ block: "start" });
        node.didScrollToHtmlTarget();
        return this;
    }

}.initThisClass());

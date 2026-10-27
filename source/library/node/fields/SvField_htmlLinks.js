"use strict";

/**
 * @module library.node.fields
 */

/**
 * @class SvField_htmlLinks
 * @extends SvField
 * @classdesc Links inside a field's HTML value. An element carrying
 * `data-sv-link="<value>"` is a link: tapping it asks the node that owns the
 * field where it leads (`routeForHtmlLink(value)`), and the view opens that
 * route. The owner may also name an element of the destination's own HTML
 * field to scroll to (`setHtmlScrollTargetId`); the view scrolls there once
 * the element is on screen and says so (`didScrollToHtmlTarget`).
 *
 * The owner answers with a route: an array of nodes whose first is a node
 * already on the navigation path (the owner, or an ancestor of it) and
 * whose rest lead from it to the destination. Owners that don't answer
 * leave the link inert.
 */

(class SvField_htmlLinks extends SvField {

    initPrototypeSlots_htmlLinks () {
        /**
         * @member {string} htmlScrollTargetId - The id of an element in this
         * field's HTML to scroll to once it is shown; cleared once scrolled.
         */
        {
            const slot = this.newSlot("htmlScrollTargetId", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }
    }

    /**
     * @description Where a link in this field's HTML leads, as the owner
     * node says.
     * @param {string} linkValue - The link's data-sv-link value.
     * @returns {Array<SvNode>|null} The route, or null when it leads nowhere.
     * @category Links
     */
    routeForHtmlLink (linkValue) {
        const owner = this.ownerNode();
        return (owner && owner.routeForHtmlLink) ? owner.routeForHtmlLink(linkValue) : null;
    }

    /**
     * @description The view scrolled to the target element: nothing is
     * pending.
     * @returns {SvField_htmlLinks}
     * @category Links
     */
    didScrollToHtmlTarget () {
        this.setHtmlScrollTargetId(null);
        return this;
    }

}.initThisCategory());

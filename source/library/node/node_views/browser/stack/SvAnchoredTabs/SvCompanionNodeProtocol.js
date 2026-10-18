"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvCompanionNodeProtocol
 * @extends Protocol
 * @classdesc Protocol for domain nodes that declare a companion node for secondary layout docking.
 */

(class SvCompanionNodeProtocol extends Protocol {

    /**
     * @description Returns the companion root node to display alongside primary navigation.
     * @returns {Object|null} The companion root node, or null for none.
     */
    nodeCompanionNode () {
        return null;
    }

    /**
     * @description Returns the target layout width in pixels for the companion panel.
     * @returns {number} Target width in pixels.
     */
    nodeCompanionWidth () {
        return 300;
    }

    /**
     * @description Returns the preferred docking edge ("right" or "bottom").
     * @returns {string} Preferred docking edge string.
     */
    nodeCompanionEdge () {
        return "right";
    }

}.initThisProtocol());

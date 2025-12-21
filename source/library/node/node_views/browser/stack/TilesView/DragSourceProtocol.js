"use strict";

/** * @module library.node.node_views.browser.stack.TilesView
 */

/** * @class DragViewProtocol
 * @extends Protocol
 * @classdesc A drag and drop source protocol for views.
 * @implements {DragViewProtocol}
 
 
 */

/**

 */

(class DragSourceProtocol extends Protocol {

    // -- messages sent by DragView to the parent/owner of the view it's dragging ---

    /**
     * @description Handles the beginning of a drag operation
     * @param {Object} dragView - The view being dragged
     * @returns {Object} The current instance
     */
    onDragSourceBegin (dragView) {
        return this;
    }

    /**
     * @description Handles the cancellation of a drag operation
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceCancelled (dragView) {
    }

    /**
     * @description Handles when the drag source enters the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceEnter (dragView) {

    }

    /**
     * @description Handles when the drag source hovers over the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceHover (dragView) {
    }

    /**
     * @description Handles when the drag source exits the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceExit (dragView) {
    }


    // -- DragView dropping ---

    /**
     * @description Handles when the drag source is dropped
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceDropped (dragView) {
    }

    /**
     * @description Handles when an item is dropped on the destination
     * @param {Object} dragView - The view being dragged
     */
    onDragDestinationDropped (dragView) {
    }

    /**
     * @description Handles the end of a drag operation
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceEnd (dragView) {
    }

    // -- messages sent by DragView to the potential drop view, if not the source ---

    /**
     * @description Checks if the view accepts a drop hover
     * @param {Object} dragView - The view being dragged
     * @returns {boolean} Whether the drop hover is accepted
     */
    acceptsDropHover (dragView) {
    }

}).initThisProtocol();


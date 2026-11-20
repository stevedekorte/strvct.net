/**
 * @module library.node.node_views.browser
 */

"use strict";

/**
 * @class SvNavigationRequest
 * @extends ProtoClass
 * @classdesc Where a browser is asked to go, and who asked. Every navigation
 * that is not a selection made directly in the columns is one of these, handed
 * to SvBrowserView.navigate(), the one place a browser's path is changed from
 * outside its columns (docs/Plans/Browser Cleanup, part 1).
 *
 * Where: one of
 *   - a path of nodes (toPath). A leading node equal to the browser's root is
 *     tolerated and skipped, so absolute and root-relative paths both work.
 *   - a node (toNode): the path is the node's own parent chain.
 *   - a slash-separated title path (toPathString), as a URL holds it.
 *   - the browser's base state (toBaseState).
 *
 * Who asked (cause):
 *   - "user": the user's own act — a tile tapped or reached by key, a
 *     breadcrumb, a link in the content.
 *   - "url": the address changed, or the page was opened at one.
 *   - "program": code moved the user without their asking for that place.
 *   - "base": a browser nobody has navigated settling into its base state.
 *
 * A browser remembers the request behind its latest path change
 * (SvBrowserView.lastNavigationRequest), so a listener can tell the user's own
 * moves from the rest: a screen reader should hear about the second kind only.
 *
 * A selection made directly in the columns does not arrive as a request: the
 * browser hears of the path change afterwards and records it as the user's.
 */

(class SvNavigationRequest extends ProtoClass {

    initPrototypeSlots () {
        /**
         * @member {Array|null} path - the nodes to select, in order
         * @category Target
         */
        {
            const slot = this.newSlot("path", null);
            slot.setSlotType("Array");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {String|null} pathString - a slash-separated title path
         * @category Target
         */
        {
            const slot = this.newSlot("pathString", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Boolean} isBaseState - the target is the browser's base
         * state, which applies only to a browser nobody has navigated yet
         * @category Target
         */
        {
            const slot = this.newSlot("isBaseState", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} cause - who asked: "user", "url", "program" or
         * "base". The slot keeps "program" when given anything else (and warns).
         * @category Cause
         */
        {
            const slot = this.newSlot("cause", "program");
            slot.setSlotType("String");
            slot.setValidValues(["user", "url", "program", "base"]);
        }
    }

    // --- making one ---

    /**
     * @description A request for a path of nodes.
     * @param {Array<SvNode>} nodes - after the browser's root, or beginning with it
     * @returns {SvNavigationRequest}
     * @category Target
     */
    static toPath (nodes) {
        assert(Type.isArray(nodes), "a path is an array of nodes");
        return this.clone().setPath(nodes.shallowCopy());
    }

    /**
     * @description A request for a node, by its own parent chain. A node
     * reached through a link has no such chain to its tile: name the tiles
     * with toPath instead.
     * @param {SvNode} aNode
     * @returns {SvNavigationRequest}
     * @category Target
     */
    static toNode (aNode) {
        return this.toPath(aNode.nodePathArray());
    }

    /**
     * @description A request for a slash-separated title path. An empty
     * string is the base state.
     * @param {String} aString
     * @returns {SvNavigationRequest}
     * @category Target
     */
    static toPathString (aString) {
        assert(Type.isString(aString), "a path string is a string");
        if (aString === "") {
            return this.toBaseState();
        }
        return this.clone().setPathString(aString);
    }

    /**
     * @description A request for the browser's base state.
     * @returns {SvNavigationRequest}
     * @category Target
     */
    static toBaseState () {
        return this.clone().setIsBaseState(true).setCause("base");
    }

    // --- cause ---

    /**
     * @description Whether the user asked for this place themselves.
     * @returns {Boolean}
     * @category Cause
     */
    isUsersOwn () {
        return this.cause() === "user";
    }

    // --- resolving against a browser ---

    /**
     * @description The nodes to select in a browser, after its root. Asked on
     * every attempt, so a place that appears a moment later (a row still
     * loading) is found by the retry.
     * @param {SvBrowserView} aBrowser
     * @returns {Array<SvNode>|null} null: no such place (yet)
     * @category Resolving
     */
    pathIn (aBrowser) {
        if (this.isBaseState()) {
            return aBrowser.basePathArray();
        }
        const root = aBrowser.node();
        if (this.path()) {
            return this.path().slice(this.path().indexOf(root) + 1); // after the root, wherever the path begins
        }
        const path = this.pathForStringUnder(root);
        if (path && path.length === 0) {
            return aBrowser.basePathArray(); // the string names the root itself: shown in its base state
        }
        return path;
    }

    /**
     * @description The path the title string names, after a root node. A
     * leading component equal to the root's title is skipped, so absolute
     * paths ("Root/Section/Item", as a URL hash holds them) work.
     * @param {SvNode} root
     * @returns {Array<SvNode>|null} null: no node is at that path
     * @category Resolving
     */
    pathForStringUnder (root) {
        const titles = this.pathString().split("/");
        if (titles.first() === "") {
            titles.shift();
        }
        if (root && titles.first() === root.title()) {
            titles.shift();
        }
        const node = root ? root.nodeAtSubpathArray(titles) : null;
        if (!node) {
            return null;
        }
        const path = node.nodePathArray();
        return path.slice(path.indexOf(root) + 1);
    }

    /**
     * @description Whether arriving is announced as a path change. A base
     * state with nothing to select changes nothing: announcing it would tell
     * listeners a browser that has only just appeared had been navigated.
     * @param {Array<SvNode>|null} path - what pathIn() gave
     * @returns {Boolean}
     * @category Resolving
     */
    announcesArrivalAt (path) {
        return !(this.isBaseState() && path !== null && path.length === 0);
    }

    /**
     * @description A short description, for a warning when it cannot be reached.
     * @returns {String}
     * @category Debugging
     */
    summary () {
        const where = this.isBaseState() ? "the base state" : (this.pathString() !== null ? "'" + this.pathString() + "'" : "[" + this.path().map(node => node.title()).join(" / ") + "]");
        return where + " (" + this.cause() + ")";
    }

}.initThisClass());

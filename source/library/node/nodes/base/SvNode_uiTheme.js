"use strict";

/**
 * @module library.node.nodes.base
 * @class SvNode_uiTheme
 * @extends SvNode
 * @classdesc The `uiTheme` inherited resource (Plans/Theme Environment, Stage 4).
 *
 * A node that may own the theme the UI wears while the user is inside it
 * declares a `uiTheme` slot of type SvTheme, `null` by default, annotated
 * `setIsInheritedResource(true)`. Resolution is the ordinary resource walk:
 * `node.nodeInheritedResource("uiTheme")` climbs `nodeResourceParent()` until
 * a node answers. This category adds the two actions every such owner needs,
 * so no app class writes them twice.
 */
(class SvNode_uiTheme extends SvNode {

    /**
     * @description Whether this class declared the uiTheme resource slot.
     * @returns {Boolean}
     * @category Theme
     */
    declaresUiTheme () {
        const slot = this.thisPrototype().slotNamed("uiTheme");
        return !!(slot && slot.isInheritedResource && slot.isInheritedResource());
    }

    /**
     * @description Makes this node own its theme: a COPY of the theme it
     * currently inherits — or, when nothing up the chain names one, of the
     * theme the UI is wearing right now (SvThemeResources.displayedTheme),
     * so "customize" always starts from what the creator is looking at
     * rather than from three empty folders. Later edits to the source never
     * change this node under its users. No-op when it already owns one.
     * @returns {SvTheme|null} the owned theme
     * @category Theme
     */
    customizeUiTheme () {
        if (!this.declaresUiTheme()) {
            return null;
        }
        if (this.uiTheme()) {
            return this.uiTheme();
        }
        const theme = SvTheme.clone();
        const source = this.nodeInheritedResource("uiTheme") || SvThemeResources.shared().displayedTheme();
        if (source) {
            theme.copyThemeFrom(source);
        }
        theme.setTitle(this.title() + " theme");
        this.setUiTheme(theme);
        return theme;
    }

    /**
     * @description Gives up the owned theme so this node inherits again.
     * @returns {SvNode}
     * @category Theme
     */
    inheritUiTheme () {
        if (this.declaresUiTheme() && this.uiTheme()) {
            this.setUiTheme(null);
        }
        return this;
    }

}).initThisCategory();

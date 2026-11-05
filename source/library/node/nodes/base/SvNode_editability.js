"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_editability
 * @extends SvNode
 * @classdesc The editability cascade (Plans/Editability Cascade): how a node resolves whether its fields and subnodes are user editable, and the delete confirmation it offers.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_editability extends SvNode {

    // --- editability cascade (see docs/Plans/Editability Cascade) ---

    /**
     * @description Resolves the cascading editability policy for this node:
     * consult the node's OWN subtreeIsUserEditable (a node's fields are its
     * children), then walk up parentNode()/ownerNode() until an ancestor has
     * an opinion; an unopinionated chain defaults to true (all existing
     * behavior preserved). This is a local-UI affordance — it makes the
     * interface stop offering edits that won't be honored (a session's
     * copied-in character, a catalog a non-editor can't save to). It is NOT
     * authority: server rules and host mediation remain the write gate.
     * @returns {Boolean} Whether user edits should be offered in this subtree.
     * @category Editability
     */
    effectiveUserEditability () {
        const v = this.subtreeIsUserEditable();
        if (v !== null) {
            return v;
        }
        const parent = this.parentNode() ? this.parentNode() : this.ownerNode();
        if (parent && parent.effectiveUserEditability) {
            return parent.effectiveUserEditability();
        }
        return true;
    }

    /**
     * @description Convenience for view-side affordance checks: whether the
     * given capability (e.g. canDelete(), nodeCanAddSubnode(),
     * valueIsEditable()) should actually be OFFERED here, given the
     * editability cascade. Views consult this instead of the raw slot so the
     * model getters stay pure (duplicate/copy machinery reads them).
     * @param {Boolean} rawCapability - The slot-level capability value.
     * @returns {Boolean}
     * @category Editability
     */
    offersUserEdit (rawCapability) {
        return !!rawCapability && this.effectiveUserEditability();
    }

    /**
     * @description Whether a USER-initiated delete affordance (tile swipe,
     * close button, shift+backspace) must be confirmed via a panel before
     * deleting this node. A node may override to declare it directly; by
     * default it asks its parent, so a collection can request confirmation
     * for all of its subnodes via shouldConfirmUserDeleteOfSubnodes().
     * Programmatic delete() never consults this.
     * @returns {Boolean}
     * @category Editability
     */
    shouldConfirmUserDelete () {
        const parent = this.parentNode();
        return parent ? parent.shouldConfirmUserDeleteOfSubnodes() : false;
    }

    /**
     * @description Collection-side declaration: whether user-initiated
     * deletes of this node's subnodes require confirmation.
     * @returns {Boolean}
     * @category Editability
     */
    shouldConfirmUserDeleteOfSubnodes () {
        return false;
    }

    /**
     * @description The subtitle shown in the delete-confirmation panel.
     * @returns {String}
     * @category Editability
     */
    userDeleteConfirmSubtitle () {
        const title = this.title();
        const name = (title && String(title).length > 0) ? title : "this";
        return "Delete '" + name + "'?";
    }

}.initThisCategory());

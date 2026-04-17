"use strict";

/**
 * @module library.node.node_views
 */

/**
 * @class SvNodeView_accessibility
 * @extends SvNodeView
 * @classdesc ARIA accessibility getters that delegate to the node.
 *
 * Each getter checks the node for an override value and falls back to null.
 * Subclasses override these to provide view-specific defaults (e.g. SvTile
 * returns "link" from ariaRole(), SvFieldTile returns "group").
 *
 * Corresponding setters (setAriaRole, setAriaLabel, etc.) live on
 * SvCssDomView and handle setAttribute/removeAttribute.
 * @category Accessibility
 */

(class SvNodeView_accessibility extends SvNodeView {

    /**
     * @description Returns the ARIA role, checking node override.
     * Subclasses should override to provide a default role.
     * @returns {string|null} The ARIA role, or null if none.
     * @category Accessibility
     */
    ariaRole () {
        const node = this.node();
        return (node && node.nodeAriaRole) ? node.nodeAriaRole() : null;
    }

    /**
     * @description Returns the ARIA label from the node.
     * @returns {string|null} The ARIA label, or null if none.
     * @category Accessibility
     */
    ariaLabel () {
        const node = this.node();
        return (node && node.nodeAriaLabel) ? node.nodeAriaLabel() : null;
    }

    /**
     * @description Returns the ARIA description from the node's subtitle.
     * @returns {string|null} The ARIA description, or null if none.
     * @category Accessibility
     */
    ariaDescription () {
        const node = this.node();
        return (node && node.subtitle) ? node.subtitle() : null;
    }

    /**
     * @description Returns the ARIA read-only state, checking node override.
     * @returns {boolean|null} The read-only state, or null to defer.
     * @category Accessibility
     */
    ariaIsReadOnly () {
        const node = this.node();
        return (node && node.nodeAriaIsReadOnly) ? node.nodeAriaIsReadOnly() : null;
    }

    /**
     * @description Returns the ARIA required state, checking node override.
     * @returns {boolean|null} The required state, or null to defer.
     * @category Accessibility
     */
    ariaIsRequired () {
        const node = this.node();
        return (node && node.nodeAriaIsRequired) ? node.nodeAriaIsRequired() : null;
    }

    /**
     * @description Returns the ARIA disabled state.
     * Base checks node.isEnabled() if available.
     * @returns {boolean|null} True if disabled, or null to remove.
     * @category Accessibility
     */
    ariaIsDisabled () {
        const node = this.node();
        if (node && node.isEnabled) {
            return !node.isEnabled() ? true : null;
        }
        return null;
    }

    /**
     * @description Returns the ARIA checked state.
     * Subclasses override for boolean fields.
     * @returns {boolean|null} The checked state, or null.
     * @category Accessibility
     */
    ariaIsChecked () {
        return null;
    }

    /**
     * @description Returns the ARIA selected state.
     * Subclasses override for selectable options.
     * @returns {boolean|null} The selected state, or null.
     * @category Accessibility
     */
    ariaIsSelected () {
        return null;
    }

    /**
     * @description Returns the ARIA current value.
     * Subclasses override for tiles (selection) or breadcrumbs (location).
     * @returns {string|null} The aria-current value, or null.
     * @category Accessibility
     */
    ariaCurrent () {
        return null;
    }

    /**
     * @description Returns the ARIA live region value, checking node.
     * @returns {string|null} "polite", "assertive", or null.
     * @category Accessibility
     */
    ariaLive () {
        const node = this.node();
        return (node && node.nodeAriaLive) ? node.nodeAriaLive() : null;
    }

    /**
     * @description Syncs all ARIA attributes from the node.
     * Called by subclasses from their syncFromNode() methods.
     * @returns {SvNodeView} The current instance.
     * @category Accessibility
     */
    syncAriaFromNode () {
        this.setAriaRole(this.ariaRole());
        this.setAriaLabel(this.ariaLabel());
        this.setAriaDescription(this.ariaDescription());
        return this;
    }

}.initThisCategory());

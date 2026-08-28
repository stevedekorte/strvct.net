"use strict";

/**
 * @class SvNode_inheritedResources
 * @extends SvNode
 * @classdesc Inherited Resources — a CSS-style cascade of NAMED VALUES up a
 * parent chain (see the app's Plans/Inherited Resources). Two states,
 * uniform across types:
 *
 * - a node that does not declare the slot, or declares it with value null,
 *   is TRANSPARENT: the walk continues to nodeResourceParent();
 * - any non-null value is the answer (an empty string is an ordinary value
 *   that happens to contribute nothing — there is no sentinel keyword).
 *
 * Only slots annotated setIsInheritedResource(true) are consulted, so a
 * resource named "title" can never capture SvNode.title(). Declaration is
 * purely the CAPABILITY to override at that level; undeclared nodes pass
 * through, so a key is declared only where overriding is meaningful.
 *
 * Scope caution: this is for content-level cascades (style, prompts,
 * config, defaults). "Which method runs" is polymorphism's job — using the
 * walk for behavior dispatch would make a service locator.
 */

(class SvNode_inheritedResources extends SvNode {

    /**
     * @description The next node the resource walk consults. Defaults to the
     * tree parent, so a value set on any shared root becomes the default for
     * everything beneath it. Nodes with special topology override once at
     * the class (e.g. a session re-routes to the campaign it was created
     * from); return null to stop the walk.
     * @returns {SvNode|null}
     * @category Inherited Resources
     */
    nodeResourceParent () {
        return this.parentNode();
    }

    /**
     * @description Resolves a named resource up the nodeResourceParent()
     * chain. Cycle-guarded (overridden parents make loops possible).
     * @param {String} name - the resource key (an annotated slot name)
     * @param {Set} [visited] - internal cycle guard
     * @returns {*} the nearest non-null declared value, or null
     * @category Inherited Resources
     */
    nodeInheritedResource (name, visited = null) {
        const slot = this.thisPrototype().slotNamed(name);
        if (slot && slot.isInheritedResource && slot.isInheritedResource()) {
            const v = this[name] ? this[name]() : null;
            if (v !== null && v !== undefined) {
                return v;
            }
        }
        if (visited === null) {
            visited = new Set();
        }
        if (visited.has(this)) {
            return null; // cycle — stop
        }
        visited.add(this);
        const p = this.nodeResourceParent();
        if (!p || !p.nodeInheritedResource) {
            return null;
        }
        return p.nodeInheritedResource(name, visited);
    }

}).initThisCategory();

"use strict";

/** * @module library.node.nodes
 */

/** * @class Slot_constraints
 * @extends Slot
 * @classdesc Category of Slot adding value constraints, named after the JSON
 * Schema keywords they emit:
 *
 *     const slot = this.newSlot("level", 1);
 *     slot.setSlotType("Number");
 *     slot.setMinimum(1);
 *     slot.setMaximum(20);
 *
 * One declaration has four readers:
 *   - asJsonSchema() emits the keyword, so an AI is told the range;
 *   - constraintErrorForValue(v) gives the sentence to show when a value
 *     breaks it ("Must be at most 20."), which a field shows beside itself
 *     (SvField.validateValue) and a refused JSON patch returns to its sender
 *     (SvJsonGroup_patches' preflight);
 *   - a field tile reads minimum / maximum for aria-valuemin / aria-valuemax;
 *   - the setter WARNS, and keeps the value.
 *
 * The setter only warns because a constraint, like a slot flag, applies to
 * every record already stored: a value saved before the constraint existed
 * must still load. An EDIT is what gets refused, and that happens where the
 * edit comes in (a field, a patch), not in the setter.
 *
 * Constraints by value type; a value of another type is not judged here (the
 * slot's type check has its own say):
 *   Number: minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf
 *   String: minLength, maxLength
 *   Array:  minItems, maxItems
 *
 * `format` ("date-time", "email", "uri", "uuid", …) is emitted in the schema
 * and not checked.
 */

(class Slot_constraints extends Slot {

    // --- declaring ---

    /**
     * @description Sets a constraint, or removes it when given undefined.
     * @param {String} name - The JSON Schema keyword.
     * @param {*} value
     * @returns {Slot}
     * @category Constraints
     */
    setConstraint (name, value) {
        assert(this.constraintNames().includes(name), "unknown slot constraint '" + name + "'");
        if (value === undefined) {
            this.annotations().delete(name);
        } else {
            this.setAnnotation(name, value);
        }
        this.setAnnotation("hasConstraints", this.constraintNames().some(n => this.hasAnnotation(n)));
        return this;
    }

    constraintNames () {
        return ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "format", "minItems", "maxItems"];
    }

    /**
     * @description Whether any constraint is declared. Asked by the setter on
     * every set, so it is one lookup.
     * @returns {Boolean}
     * @category Constraints
     */
    hasConstraints () {
        return this.getAnnotation("hasConstraints") === true;
    }

    setMinimum (n) {
        return this.setConstraint("minimum", n);
    }

    minimum () {
        return this.getAnnotation("minimum");
    }

    setMaximum (n) {
        return this.setConstraint("maximum", n);
    }

    maximum () {
        return this.getAnnotation("maximum");
    }

    setExclusiveMinimum (n) {
        return this.setConstraint("exclusiveMinimum", n);
    }

    exclusiveMinimum () {
        return this.getAnnotation("exclusiveMinimum");
    }

    setExclusiveMaximum (n) {
        return this.setConstraint("exclusiveMaximum", n);
    }

    exclusiveMaximum () {
        return this.getAnnotation("exclusiveMaximum");
    }

    setMultipleOf (n) {
        assert(n > 0, "multipleOf must be greater than 0");
        return this.setConstraint("multipleOf", n);
    }

    multipleOf () {
        return this.getAnnotation("multipleOf");
    }

    setMinLength (n) {
        return this.setConstraint("minLength", n);
    }

    minLength () {
        return this.getAnnotation("minLength");
    }

    setMaxLength (n) {
        return this.setConstraint("maxLength", n);
    }

    maxLength () {
        return this.getAnnotation("maxLength");
    }

    setFormat (s) {
        return this.setConstraint("format", s);
    }

    format () {
        return this.getAnnotation("format");
    }

    setMinItems (n) {
        return this.setConstraint("minItems", n);
    }

    minItems () {
        return this.getAnnotation("minItems");
    }

    setMaxItems (n) {
        return this.setConstraint("maxItems", n);
    }

    maxItems () {
        return this.getAnnotation("maxItems");
    }

    // --- JSON Schema ---

    /**
     * @description Writes the declared constraints into a property schema. A
     * declared maxLength never raises the cap a stored string already has.
     * @param {Object} schema
     * @returns {Slot}
     * @category JSON Schema
     */
    jsonSchemaAddConstraints (schema) {
        if (!this.hasConstraints()) {
            return this;
        }
        const cap = schema.maxLength;
        this.constraintNames().filter(name => this.hasAnnotation(name)).forEach(name => {
            schema[name] = this.getAnnotation(name);
        });
        if (cap !== undefined && schema.maxLength > cap) {
            schema.maxLength = cap;
        }
        return this;
    }

    // --- checking a value ---

    /**
     * @description What is wrong with a value, as a sentence for whoever
     * offered it, or null. Judges only the constraints for the value's type.
     * @param {*} v
     * @returns {String|null}
     * @category Constraints
     */
    constraintErrorForValue (v) {
        if (!this.hasConstraints()) {
            return null;
        }
        if (Type.isNumber(v)) {
            return this.numberConstraintError(v);
        }
        if (Type.isString(v)) {
            return this.lengthConstraintError(v.length, "minLength", "maxLength", "character");
        }
        if (Type.isArray(v)) {
            return this.lengthConstraintError(v.length, "minItems", "maxItems", "item");
        }
        return null;
    }

    numberConstraintError (n) {
        const failed = this.numberConstraintChecks().find(check => this.hasAnnotation(check.name) && !check.passes(n, this.getAnnotation(check.name)));
        return failed ? "Must be " + failed.phrase + " " + this.getAnnotation(failed.name) + "." : null;
    }

    numberConstraintChecks () {
        return [
            { name: "minimum", phrase: "at least", passes: (n, limit) => n >= limit },
            { name: "maximum", phrase: "at most", passes: (n, limit) => n <= limit },
            { name: "exclusiveMinimum", phrase: "greater than", passes: (n, limit) => n > limit },
            { name: "exclusiveMaximum", phrase: "less than", passes: (n, limit) => n < limit },
            { name: "multipleOf", phrase: "a multiple of", passes: (n, step) => this.numberIsMultipleOf(n, step) }
        ];
    }

    // 0.3 / 0.1 is not a whole number in floating point, so allow for that.
    numberIsMultipleOf (n, step) {
        const quotient = n / step;
        return Math.abs(quotient - Math.round(quotient)) < 1e-9;
    }

    lengthConstraintError (length, minName, maxName, unit) {
        const min = this.getAnnotation(minName);
        const max = this.getAnnotation(maxName);
        if (min !== undefined && length < min) {
            return "Must have at least " + min + " " + unit + (min === 1 ? "" : "s") + ".";
        }
        if (max !== undefined && length > max) {
            return "Must have at most " + max + " " + unit + (max === 1 ? "" : "s") + ".";
        }
        return null;
    }

    /**
     * @description The setter's part: say that a value breaks a constraint,
     * and let it through (see the class comment for why).
     * @param {Object} anInstance - The object being set.
     * @param {*} v
     * @returns {Slot}
     * @category Constraints
     */
    warnIfConstraintViolated (anInstance, v) {
        const error = this.constraintErrorForValue(v);
        if (error) {
            console.warn("WARNING: " + anInstance.svType() + "." + this.setterName() + "(" + JSON.stringify(v).slice(0, 40) + ") breaks a constraint: " + error + " The value is kept.");
        }
        return this;
    }

}.initThisCategory());

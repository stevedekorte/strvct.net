"use strict";

/**
 * @module library.node.json
 * @class SvJsonSerializableProtocol
 * @extends Protocol
 * @interface
 * @classdesc A node that has a JSON form: the human-readable representation
 * used to exchange data with AI services, for import and export, and for the
 * clipboard (not the storage format, which is recordForStore). Writing it
 * out is required; reading it back is optional, since some nodes are only
 * ever exported (SvImageNode, SvJsonDictionaryNode).
 *
 * Adopted by the base classes that implement it (SvJsonGroup, SvJsonArrayNode,
 * SvJsonDictionaryNode, SvImageNode, SvDateNode, SvTimeNode, SvToolResult);
 * their subclasses conform through them. Adoption is checked when a class is
 * set up, so a class that claims a JSON form but can't write one fails at
 * startup rather than on its first export.
 *
 * Code that serializes a value of unknown kind still asks the value itself
 * (`value.serializeToJson`), since the value may be a string, a number or
 * null rather than a node.
 */
(class SvJsonSerializableProtocol extends Protocol {

    static optionalMethodNames () {
        return ["deserializeFromJson"];
    }

    /**
     * @description This node's JSON form.
     * @param {String} [filterName] - Which slots to include, by the slot filter of that name.
     * @param {Array<String>} [jsonPathComponents] - The path to this node, for error messages.
     * @returns {*} A JSON value.
     * @category JSON
     */
    serializeToJson (filterName, jsonPathComponents = []) {
        void filterName;
        void jsonPathComponents;
        return null;
    }

    /**
     * @description Sets this node from its JSON form. Optional.
     * @param {*} json - A JSON value, as serializeToJson() writes it.
     * @param {String} [filterName] - Which slots to set, by the slot filter of that name.
     * @param {Array<String>} [jsonPathComponents] - The path to this node, for error messages.
     * @returns {SvJsonSerializableProtocol} This node.
     * @category JSON
     */
    deserializeFromJson (json, filterName, jsonPathComponents = []) {
        void json;
        void filterName;
        void jsonPathComponents;
        return this;
    }

}).initThisProtocol();

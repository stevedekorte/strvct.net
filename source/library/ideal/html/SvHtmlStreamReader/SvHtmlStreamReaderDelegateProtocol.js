"use strict";

/**
 * @module library.ideal.html.SvHtmlStreamReader
 */

/**
 * @interface SvHtmlStreamReaderDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What an HTML stream reader tells its delegate as it builds a node tree from streamed text. Sent by SvHtmlStreamReader (sendDelegateMessage); every message is
 * optional. Written from the sends in SvHtmlStreamReader — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvHtmlStreamReaderDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The reader began a stream.
     * @param {SvHtmlStreamReader} reader - The reader.
     * @category Delegation
     */
    onHtmlStreamReaderStart (reader) {
    }

    /**
     * @description An element or text node opened.
     * @param {SvHtmlStreamReader} reader - The reader.
     * @param {SvStreamNode} node - The node it opened.
     * @category Delegation
     */
    onHtmlStreamReaderPushNode (reader, node) {
    }

    /**
     * @description An element closed.
     * @param {SvHtmlStreamReader} reader - The reader.
     * @param {SvStreamNode} node - The node it closed.
     * @category Delegation
     */
    onHtmlStreamReaderPopNode (reader, node) {
    }

    /**
     * @description The stream ended.
     * @param {SvHtmlStreamReader} reader - The reader.
     * @category Delegation
     */
    onHtmlStreamReaderEnd (reader) {
    }

}.initThisProtocol());

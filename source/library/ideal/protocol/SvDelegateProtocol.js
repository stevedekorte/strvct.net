"use strict";

/**
 * @module library.ideal.protocol
 */

/**
 * @interface SvDelegateProtocol
 * @extends Protocol
 * @classdesc The base of every delegate protocol: the messages one kind of
 * object sends its delegate (sendDelegateMessage). Every message is
 * optional — a delegate implements the ones it uses — so addProtocol() checks
 * nothing, but declaring it records who listens to what.
 *
 * A sender names its protocol with delegateProtocol(); sendDelegateMessage
 * then warns (once per sender class and message) when it sends a message
 * the protocol does not declare, so the declaration cannot drift from the code.
 *
 * Name a delegate protocol after its sender: SvHtmlStreamReader's delegate
 * protocol is SvHtmlStreamReaderDelegateProtocol.
 */
(class SvDelegateProtocol extends Protocol {

    static optionalMethodNames () {
        return this.protocolMethodNames();
    }

}.initThisProtocol());

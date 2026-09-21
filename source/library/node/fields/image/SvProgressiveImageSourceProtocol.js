"use strict";

/**
 * @module library.node.fields.image
 * @class SvProgressiveImageSourceProtocol
 * @extends Protocol
 * @interface
 * @classdesc Node-side capability contract: a node that produces an image
 * progressively (working → preview → final, or failure) declares this
 * protocol so any interested view can render the progression. The image well
 * (SvImageWellView, engaged by SvImageWellFieldTile) is the current consumer
 * — it reserves an aspect-ratio box, shows a working indicator, crossfades in
 * a blurred preview, and reveals the final image. A node that does NOT
 * conform takes the original, untouched single-image path.
 *
 * The protocol lives on the NODE side (beside SvImageNode) and is named for
 * the node's capability, not for any particular view: the node knows nothing
 * about image wells, and a different UI (another view class, a terminal UI)
 * can consume the same contract.
 *
 * These methods are DATA ONLY: a node supplies an aspect string, image-bearing
 * objects and booleans. It never references a view, and it never returns a
 * styling decision (blur radius, animation duration, colors are the view's) —
 * that would leak presentation into the model. Conformance is a stable
 * capability declared once via addProtocol(); it must not depend on mutable
 * runtime state that flips between syncs.
 *
 * OPTIONAL EXTENSION — onProgressiveImageFetchStalled(attempt, hash):
 * a consumer that cannot resolve the final image, though the node asserts one
 * exists, tells the node so (after a few attempts, then periodically while it
 * keeps failing). The node owns the remedy — clearing a negative cache, asking
 * a multiplayer host to re-publish — because only it knows where its bytes
 * come from; the view knows only the symptom. It is NOT declared as a protocol
 * method below: addProtocol() throws on any declared method an adopter is
 * missing, which would make this mandatory, and a node with no recovery to
 * offer must stay conformant. Consumers therefore probe for it with a
 * `typeof node.onProgressiveImageFetchStalled === "function"` check.
 * @param {Number} attempt - 1-based fetch attempt that just failed.
 * @param {String|null} hash - The final image's content hash, when known.
 */

(class SvProgressiveImageSourceProtocol extends Protocol {

    /**
     * @description The target aspect ratio for the reserved placeholder box, as
     * a "w:h" string (e.g. "5:3"), or null. Null means no reserved box: the
     * final image (if any) renders at its natural size.
     * @returns {String|null} The aspect-ratio string, or null.
     * @category Progressive Loading
     */
    progressiveImageAspectRatio () {
    }

    /**
     * @description The current preview value to show (e.g. blurred behind the
     * final image) while working — an object responding to asyncDataUrl() — or
     * null when there is no preview.
     * @returns {Object|null} An object with asyncDataUrl(), or null.
     * @category Progressive Loading
     */
    progressiveImagePreviewValue () {
    }

    /**
     * @description Whether generation is in flight (drives the working / shimmer
     * indicator). Terminal states (a final image, or failure) report false.
     * @returns {Boolean} True while work is in progress.
     * @category Progressive Loading
     */
    progressiveImageIsWorking () {
    }

    /**
     * @description Whether generation ended in failure or was interrupted — a
     * terminal state. When true the consumer tears its placeholder down (stops
     * any working indicator, clears preview layers, collapses the reserved box)
     * so no blank spacer lingers and error text can show.
     * @returns {Boolean} True when generation has failed / been interrupted.
     * @category Progressive Loading
     */
    progressiveImageHasFailed () {
    }

}).initThisProtocol();

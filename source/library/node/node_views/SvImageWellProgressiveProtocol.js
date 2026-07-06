"use strict";

/**
 * @module library.node.node_views
 * @class SvImageWellProgressiveProtocol
 * @extends Protocol
 * @interface
 * @classdesc Opt-in contract a node implements to drive progressive rendering
 * of an image well (SvImageWellView, engaged by SvImageWellFieldTile).
 *
 * A node that conforms to this protocol tells the tile to reserve an
 * aspect-ratio box, show a working indicator, crossfade in a blurred preview,
 * and reveal the final image — instead of the plain single-image path. A node
 * that does NOT conform takes the original, untouched single-image path.
 *
 * These methods are DATA ONLY: a node supplies an aspect string, image-bearing
 * objects and booleans. It never references a view, and it never returns a
 * styling decision (blur radius, animation duration, colors are the view's) —
 * that would leak presentation into the model. Conformance is a stable
 * capability declared once via addProtocol(); it must not depend on mutable
 * runtime state that flips between syncs.
 */

(class SvImageWellProgressiveProtocol extends Protocol {

    /**
     * @description The target aspect ratio for the reserved placeholder box, as
     * a "w:h" string (e.g. "5:3"), or null. Null means no reserved box: the
     * final image (if any) renders at its natural size.
     * @returns {String|null} The aspect-ratio string, or null.
     * @category Progressive Loading
     */
    imageWellAspectRatio () {
    }

    /**
     * @description The current preview value to show blurred behind the final
     * image while working — an object responding to asyncDataUrl() — or null
     * when there is no preview.
     * @returns {Object|null} An object with asyncDataUrl(), or null.
     * @category Progressive Loading
     */
    imageWellPreviewValue () {
    }

    /**
     * @description Whether generation is in flight (drives the working / shimmer
     * indicator). Terminal states (a final image, or failure) report false.
     * @returns {Boolean} True while work is in progress.
     * @category Progressive Loading
     */
    imageWellIsWorking () {
    }

    /**
     * @description Whether generation ended in failure or was interrupted — a
     * terminal state. When true the tile tears the placeholder down (stops the
     * shimmer, clears preview layers, collapses the reserved box) so no blank
     * spacer lingers and the field's key/error text can show.
     * @returns {Boolean} True when generation has failed / been interrupted.
     * @category Progressive Loading
     */
    imageWellHasFailed () {
    }

}).initThisProtocol();

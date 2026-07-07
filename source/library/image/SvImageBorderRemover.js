"use strict";

/**
 * @module library.image
 */

/**
 * @class SvImageBorderRemover
 * @extends ProtoClass
 * @classdesc Detects and crops straight (axis-aligned) borders from images —
 * the white/black bars image generators sometimes add on the top/bottom,
 * left/right, or both. Border detection is conservative: a line only counts
 * as border if nearly all of its pixels are within tolerance of a candidate
 * border color (white or black), and per-side crops are capped so a mostly
 * dark or light image can't be eaten.
 *
 * The detection core (`detectInsets`) works on plain ImageData-shaped
 * objects ({width, height, data: RGBA bytes}) — no canvas needed — so it
 * runs headless for tests. The `async*` conveniences use a canvas and are
 * browser-side.
 *
 * @example
 * const remover = SvImageBorderRemover.clone();
 * const croppedDataUrl = await remover.asyncCroppedDataUrlFromDataUrl(dataUrl);
 * // returns the original dataUrl unchanged if no border was found
 *
 * A dedicated class (rather than a method on an image node) so future
 * strategies (per-corner sampling, non-black/white mats, AI detection)
 * can hang parameters and alternate detectors here.
 */

(class SvImageBorderRemover extends ProtoClass {

    initPrototypeSlots () {
        {
            // Max per-channel distance from the candidate border color for a
            // pixel to count as border. 16 tolerates JPEG ringing and
            // off-white/off-black mats without grabbing image content.
            const slot = this.newSlot("tolerance", 16);
            slot.setSlotType("Number");
        }
        {
            // Fraction of a row/column's pixels that must match for the line
            // to count as border. High by design: real borders are uniform;
            // content that happens to be pale (snow, parchment) rarely is.
            const slot = this.newSlot("uniformity", 0.97);
            slot.setSlotType("Number");
        }
        {
            // Per-side safety cap as a fraction of the image dimension.
            const slot = this.newSlot("maxInsetFraction", 0.45);
            slot.setSlotType("Number");
        }
        {
            // Borders thinner than this are ignored (not worth recoding the
            // image over a 1-2px edge artifact).
            const slot = this.newSlot("minInset", 3);
            slot.setSlotType("Number");
        }
        {
            // Insets found by the last detect/crop call — {top,right,bottom,left}.
            const slot = this.newSlot("lastInsets", null);
            slot.setSlotType("Object");
        }
    }

    static borderColorCandidates () {
        return [
            [255, 255, 255], // white
            [0, 0, 0] // black
        ];
    }

    // --- detection core (pure, headless-safe) ---

    /**
     * @description Detects border insets on all four sides.
     * @param {Object} imageData - {width, height, data} with RGBA bytes
     *   (a real ImageData works, as does any object of that shape).
     * @returns {Object} {top, right, bottom, left} inset pixel counts
     *   (0 = no border on that side).
     * @category Detection
     */
    detectInsets (imageData) {
        // Horizontal bands first (full rows), then vertical sides measured
        // only within the remaining row range — otherwise a frame whose
        // top/bottom bars are a different color than its side bars breaks
        // column uniformity at the corners and the sides go undetected.
        const top = this.insetForSide(imageData, "top", 0, 0);
        const bottom = this.insetForSide(imageData, "bottom", 0, 0);
        const insets = {
            top,
            bottom,
            left: this.insetForSide(imageData, "left", top, bottom),
            right: this.insetForSide(imageData, "right", top, bottom)
        };
        // Opposing borders that would meet (or cross) mean the whole image
        // matched — that's not a border, that's a blank/degenerate image.
        if (insets.left + insets.right >= imageData.width || insets.top + insets.bottom >= imageData.height) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }
        this.setLastInsets(insets);
        return insets;
    }

    /**
     * @description Whether detectInsets found anything worth cropping.
     * @category Detection
     */
    insetsAreEmpty (insets) {
        return insets.top === 0 && insets.right === 0 && insets.bottom === 0 && insets.left === 0;
    }

    /**
     * @description Border inset for one side: picks the candidate color
     * (white/black) that matches the outermost line, then advances inward
     * while lines stay uniform, capped by maxInsetFraction. Returns 0 when
     * the result is thinner than minInset.
     * @category Detection
     */
    insetForSide (imageData, side, skipStart = 0, skipEnd = 0) {
        const isVertical = (side === "left" || side === "right");
        const lineCount = isVertical ? imageData.width : imageData.height;
        const maxInset = Math.floor(lineCount * this.maxInsetFraction());

        // Pick the border color by whichever candidate the outermost line matches.
        const color = this.thisClass().borderColorCandidates().find(candidate =>
            this.lineMatchFraction(imageData, side, 0, candidate, skipStart, skipEnd) >= this.uniformity()
        );
        if (!color) {
            return 0;
        }

        let inset = 0;
        while (inset < maxInset && this.lineMatchFraction(imageData, side, inset, color, skipStart, skipEnd) >= this.uniformity()) {
            inset++;
        }
        // Hitting the cap without finding a content edge means we can't tell
        // where the border ends — refuse rather than crop blindly. (Also
        // covers degenerate near-blank images.)
        if (inset >= maxInset && this.lineMatchFraction(imageData, side, inset, color, skipStart, skipEnd) >= this.uniformity()) {
            return 0;
        }
        return (inset >= this.minInset()) ? inset : 0;
    }

    /**
     * @description Fraction of pixels in the line `offset` steps in from
     * `side` that are within tolerance of `color`.
     * @category Detection
     */
    /**
     * @description Fraction of pixels in the line `offset` steps in from
     * `side` that are within tolerance of `color`. For vertical sides,
     * skipStart/skipEnd exclude already-detected top/bottom bands from the
     * column so differently-colored frame corners don't break uniformity.
     * @category Detection
     */
    lineMatchFraction (imageData, side, offset, color, skipStart = 0, skipEnd = 0) {
        const { width, height, data } = imageData;
        const tolerance = this.tolerance();
        let matches = 0;
        let count = 0;

        const pixelMatches = (i) => {
            return Math.abs(data[i] - color[0]) <= tolerance &&
                Math.abs(data[i + 1] - color[1]) <= tolerance &&
                Math.abs(data[i + 2] - color[2]) <= tolerance;
        };

        if (side === "top" || side === "bottom") {
            const y = (side === "top") ? offset : (height - 1 - offset);
            const rowStart = y * width * 4;
            for (let x = 0; x < width; x++) {
                if (pixelMatches(rowStart + x * 4)) {
                    matches++;
                }
                count++;
            }
        } else {
            const x = (side === "left") ? offset : (width - 1 - offset);
            for (let y = skipStart; y < height - skipEnd; y++) {
                if (pixelMatches((y * width + x) * 4)) {
                    matches++;
                }
                count++;
            }
        }
        return (count > 0) ? (matches / count) : 0;
    }

    // --- cropping conveniences (canvas; browser-side) ---

    newCanvas (width, height) {
        if (typeof OffscreenCanvas !== "undefined") {
            return new OffscreenCanvas(width, height);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * @description Detects borders on a drawable image source (Image,
     * ImageBitmap, canvas) and returns a cropped canvas — or null when
     * there is no border to remove (so callers can skip re-encoding).
     * @category Cropping
     */
    croppedCanvasFromImageSource (source) {
        const width = source.naturalWidth || source.width;
        const height = source.naturalHeight || source.height;
        const canvas = this.newCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, 0, 0);
        const insets = this.detectInsets(ctx.getImageData(0, 0, width, height));
        if (this.insetsAreEmpty(insets)) {
            return null;
        }
        const cropWidth = width - insets.left - insets.right;
        const cropHeight = height - insets.top - insets.bottom;
        const cropped = this.newCanvas(cropWidth, cropHeight);
        cropped.getContext("2d").drawImage(canvas, insets.left, insets.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        return cropped;
    }

    /**
     * @description Loads a data URL, removes any detected border, and
     * returns the cropped image as a data URL. Returns the ORIGINAL data
     * URL untouched when no border is found (no needless re-encode).
     * @param {string} dataUrl
     * @param {string} [mimeType="image/jpeg"]
     * @param {number} [quality=0.92]
     * @returns {Promise<string>}
     * @category Cropping
     */
    async asyncCroppedDataUrlFromDataUrl (dataUrl, mimeType = "image/jpeg", quality = 0.92) {
        const img = await this.asyncImageFromDataUrl(dataUrl);
        const cropped = this.croppedCanvasFromImageSource(img);
        if (!cropped) {
            return dataUrl;
        }
        if (cropped.convertToBlob) { // OffscreenCanvas
            const blob = await cropped.convertToBlob({ type: mimeType, quality });
            return await this.asyncDataUrlFromBlob(blob);
        }
        return cropped.toDataURL(mimeType, quality);
    }

    /**
     * @description Removes any detected border from an image blob. Returns
     * the ORIGINAL blob when no border is found.
     * @param {Blob} blob
     * @param {string} [mimeType] - defaults to the blob's own type
     * @param {number} [quality=0.92]
     * @returns {Promise<Blob>}
     * @category Cropping
     */
    async asyncCroppedBlobFromBlob (blob, mimeType = null, quality = 0.92) {
        const bitmap = await createImageBitmap(blob);
        const cropped = this.croppedCanvasFromImageSource(bitmap);
        bitmap.close();
        if (!cropped) {
            return blob;
        }
        const outType = mimeType || blob.type || "image/jpeg";
        if (cropped.convertToBlob) { // OffscreenCanvas
            return await cropped.convertToBlob({ type: outType, quality });
        }
        return await new Promise((resolve, reject) => {
            cropped.toBlob(b => b ? resolve(b) : reject(new Error("canvas toBlob failed")), outType, quality);
        });
    }

    /**
     * @description Removes any detected border from an SvImageNode's blob,
     * in place. Returns true if a border was found and the node's image was
     * replaced with the cropped version, false if left untouched.
     * @param {SvImageNode} imageNode
     * @param {string} [mimeType="image/jpeg"]
     * @param {number} [quality=0.92]
     * @returns {Promise<boolean>}
     * @category Cropping
     */
    async asyncCropImageNodeInPlace (imageNode, mimeType = "image/jpeg", quality = 0.92) {
        const dataUrl = await imageNode.asyncDataUrl();
        if (!dataUrl) {
            return false;
        }
        const croppedDataUrl = await this.asyncCroppedDataUrlFromDataUrl(dataUrl, mimeType, quality);
        if (croppedDataUrl === dataUrl) {
            return false; // no border found; original untouched
        }
        imageNode.setBlobFromDataURL(croppedDataUrl);
        return true;
    }

    asyncImageFromDataUrl (dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("SvImageBorderRemover: failed to load image from data URL"));
            img.src = dataUrl;
        });
    }

    asyncDataUrlFromBlob (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("SvImageBorderRemover: failed to read blob"));
            reader.readAsDataURL(blob);
        });
    }

}.initThisClass());

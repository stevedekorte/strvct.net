/**
 * @module library.media.mime
 */

"use strict";

/**
 * @class SvMimeTypeDetector
 * @extends Object
 * @classdesc
 * Detects MIME types from binary data by inspecting magic bytes (file signatures).
 * Supports common media types that modern browsers can handle/display/play.
 *
 * Example usage:
 *     const arrayBuffer = await file.arrayBuffer();
 *     const mimeType = SvMimeTypeDetector.detectFromArrayBuffer(arrayBuffer);
 *     // Returns: "image/png", "video/mp4", etc., or null if unknown
 */
(class SvMimeTypeDetector extends Object {

    /**
     * @static
     * @description Returns the magic byte signatures for supported MIME types.
     * null in a signature means "any byte at this position"
     * @returns {Object} Map of MIME type to magic byte signature(s)
     * @category Detection
     */
    static signatures () {
        return {
            // Images
            "image/png": [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            "image/jpeg": [0xFF, 0xD8, 0xFF],
            "image/gif": [
                [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
                [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
            ],
            "image/webp": [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50], // RIFF....WEBP
            "image/bmp": [0x42, 0x4D], // BM
            "image/avif": [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // ....ftypavif
            "image/svg+xml": [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml or <svg
            "image/x-icon": [0x00, 0x00, 0x01, 0x00], // ICO

            // Video
            "video/mp4": [
                [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D], // ....ftypisom
                [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32], // ....ftypmp42
                [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x53, 0x4E, 0x56]  // ....ftypMSNV
            ],
            "video/webm": [0x1A, 0x45, 0xDF, 0xA3], // WebM/Matroska
            "video/ogg": [0x4F, 0x67, 0x67, 0x53], // OggS
            "video/quicktime": [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ....ftypqt

            // Audio
            "audio/mpeg": [
                [0xFF, 0xFB], // MP3 Frame sync (MPEG-1 Layer 3)
                [0xFF, 0xF3], // MP3 Frame sync (MPEG-2 Layer 3)
                [0xFF, 0xF2], // MP3 Frame sync
                [0x49, 0x44, 0x33]  // ID3
            ],
            "audio/wav": [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x41, 0x56, 0x45], // RIFF....WAVE
            "audio/ogg": [0x4F, 0x67, 0x67, 0x53], // OggS
            "audio/flac": [0x66, 0x4C, 0x61, 0x43], // fLaC
            "audio/aac": [0xFF, 0xF1], // AAC ADTS
            "audio/webm": [0x1A, 0x45, 0xDF, 0xA3], // WebM audio (same as video)
            "audio/mp4": [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41] // ....ftypM4A
        };
    }

    /**
     * @static
     * @description Checks if a byte sequence matches a signature pattern.
     * @param {Uint8Array} bytes - The bytes to check
     * @param {Array} signature - The signature pattern (null means any byte)
     * @returns {boolean} True if the bytes match the signature
     * @category Detection
     */
    static matchesSignature (bytes, signature) {
        if (bytes.length < signature.length) {
            return false;
        }

        for (let i = 0; i < signature.length; i++) {
            if (signature[i] !== null && bytes[i] !== signature[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @static
     * @description Detects MIME type from a Uint8Array.
     * @param {Uint8Array} bytes - The byte array to analyze
     * @returns {string|null} The detected MIME type or null if unknown
     * @category Detection
     */
    static detectFromUint8Array (bytes) {
        if (!bytes || bytes.length === 0) {
            return null;
        }

        const signatures = this.signatures();

        for (const [mimeType, pattern] of Object.entries(signatures)) {
            // Handle multiple possible signatures for one type
            if (Array.isArray(pattern[0])) {
                // pattern is array of arrays
                for (const sig of pattern) {
                    if (this.matchesSignature(bytes, sig)) {
                        return mimeType;
                    }
                }
            } else {
                // pattern is single array
                if (this.matchesSignature(bytes, pattern)) {
                    return mimeType;
                }
            }
        }

        return null;
    }

    /**
     * @static
     * @description Detects MIME type from various input types.
     * @param {ArrayBuffer|Uint8Array|Uint8ClampedArray|string} value - The value to analyze (ArrayBuffer, Uint8Array, Uint8ClampedArray, or data URL string)
     * @returns {string|null} The detected MIME type or null if unknown
     * @category Detection
     */
    static detectFrom (value) {
        if (value instanceof ArrayBuffer) {
            return this.detectFromArrayBuffer(value);
        } else if (value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
            return this.detectFromUint8Array(value);
        } else if (typeof value === "string" && value.startsWith("data:")) {
            return this.detectFromDataUrl(value);
        } else {
            return null;
        }
    }

    /**
     * @static
     * @description Detects MIME type from a data URL string.
     * @param {string} dataUrlString - The data URL to analyze (e.g., "data:image/png;base64,iVBORw...")
     * @returns {string|null} The detected MIME type or null if unknown
     * @category Detection
     */
    static detectFromDataUrl (dataUrlString) {
        if (!dataUrlString || !dataUrlString.startsWith("data:")) {
            return null;
        }

        // Extract base64 part after "data:image/png;base64," or similar
        const parts = dataUrlString.split(",");
        if (parts.length < 2) {
            return null;
        }

        const base64Data = parts[1];
        if (!base64Data) {
            return null;
        }

        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return this.detectFromUint8Array(bytes);
    }

    /**
     * @static
     * @description Detects MIME type from an ArrayBuffer.
     * @param {ArrayBuffer} arrayBuffer - The array buffer to analyze
     * @returns {string|null} The detected MIME type or null if unknown
     * @category Detection
     */
    static detectFromArrayBuffer (arrayBuffer) {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            return null;
        }

        const bytes = new Uint8Array(arrayBuffer);
        return this.detectFromUint8Array(bytes);
    }

    /**
     * @static
     * @description Checks if the data is a JPEG image.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if JPEG
     * @category Format Checking
     */
    static isJPEG (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "image/jpeg";
    }

    /**
     * @static
     * @description Checks if the data is a PNG image.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if PNG
     * @category Format Checking
     */
    static isPNG (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "image/png";
    }

    /**
     * @static
     * @description Checks if the data is a GIF image.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if GIF
     * @category Format Checking
     */
    static isGIF (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "image/gif";
    }

    /**
     * @static
     * @description Checks if the data is a WebP image.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if WebP
     * @category Format Checking
     */
    static isWebP (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "image/webp";
    }

    /**
     * @static
     * @description Checks if the data is an MP4 video.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if MP4
     * @category Format Checking
     */
    static isMP4 (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "video/mp4";
    }

    /**
     * @static
     * @description Checks if the data is a WebM video.
     * @param {Uint8Array|ArrayBuffer} data - The data to check
     * @returns {boolean} True if WebM
     * @category Format Checking
     */
    static isWebM (data) {
        const mimeType = data instanceof ArrayBuffer
            ? this.detectFromArrayBuffer(data)
            : this.detectFromUint8Array(data);
        return mimeType === "video/webm" || mimeType === "audio/webm";
    }

    /**
     * @static
     * @description Gets the file extension for a MIME type.
     * @param {string} mimeType - The MIME type
     * @returns {string|null} The common file extension (without dot) or null
     * @category Utilities
     */
    static extensionForMimeType (mimeType) {
        const map = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/bmp": "bmp",
            "image/avif": "avif",
            "image/svg+xml": "svg",
            "image/x-icon": "ico",
            "video/mp4": "mp4",
            "video/webm": "webm",
            "video/ogg": "ogv",
            "video/quicktime": "mov",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "audio/ogg": "ogg",
            "audio/flac": "flac",
            "audio/aac": "aac",
            "audio/webm": "webm",
            "audio/mp4": "m4a"
        };
        return map[mimeType] || null;
    }

    /**
     * @static
     * @description Gets the MIME type for a file extension.
     * @param {string} extension - The file extension (with or without leading dot)
     * @returns {string|null} The MIME type or null
     * @category Utilities
     */
    static mimeTypeForExtension (extension) {
        // Remove leading dot if present
        const ext = extension.startsWith('.') ? extension.slice(1) : extension;

        const map = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "webp": "image/webp",
            "bmp": "image/bmp",
            "avif": "image/avif",
            "svg": "image/svg+xml",
            "ico": "image/x-icon",
            "mp4": "video/mp4",
            "webm": "video/webm",
            "ogv": "video/ogg",
            "ogg": "video/ogg",
            "mov": "video/quicktime",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "flac": "audio/flac",
            "aac": "audio/aac",
            "m4a": "audio/mp4"
        };
        return map[ext.toLowerCase()] || null;
    }

}.initThisClass());

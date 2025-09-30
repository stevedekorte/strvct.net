"use strict";

/**
 * @module library.view.dom.Helpers
 */

/**
 * CssColor
 *
 * Helpful for manipulating css colors.
 *
 * RGB2HSV and HSV2RGB are based on Color Match Remix see: http://color.twysted.net/
 * which is based on or copied from ColorMatch 5K see: http://colormatch.dk/
 *
 * @class
 * @extends ProtoClass
 * @classdesc Represents a CSS color and provides methods for manipulating and converting colors.
 */
(class CssColor extends ProtoClass {

    initPrototypeSlots () {
        /**
         * @member {Number} red - Red component of the color (between 0.0 and 1.0)
         */
        {
            const slot = this.newSlot("red", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} green - Green component of the color (between 0.0 and 1.0)
         */
        {
            const slot = this.newSlot("green", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} blue - Blue component of the color (between 0.0 and 1.0)
         */
        {
            const slot = this.newSlot("blue", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} opacity - Opacity of the color (between 0.0 and 1.0)
         */
        {
            const slot = this.newSlot("opacity", 1);
            slot.setSlotType("Number");
        }
        /**
         * @member {Map} colorCacheMap - Cache for parsed color strings
         */
        {
            const slot = this.newSlot("colorCacheMap", null);
            slot.setSlotType("Map");
        }
        //isMutable: true,
    }

    /**
     * @description Initializes the CssColor instance
     * @returns {CssColor} The initialized instance
     */
    init () {
        super.init();
        this.setColorCacheMap(new Map());
        return this;
    }

    /**
     * @description Randomizes the color components
     * @returns {CssColor} The instance with randomized color
     */
    randomize () {
        this.setRed(Math.random());
        this.setGreen(Math.random());
        this.setBlue(Math.random());
        return this;
    }

    /**
     * @description Creates a copy of another CssColor instance
     * @param {CssColor} aColor - The color to copy from
     * @param {Object} copyDict - Copy options (not used in this method)
     * @returns {CssColor} A new CssColor instance with copied values
     */
    copyFrom (aColor /*, copyDict*/) {
        return CssColor.clone().set(aColor.red(), aColor.green(), aColor.blue(), aColor.opacity());
    }

    /**
     * @description Parses a color string without caching
     * @private
     * @param {string} aColorString - The color string to parse
     * @returns {Array} An array of color components [r, g, b, a]
     */
    justParseColorString (aColorString) { // private
        // TODO: test if this is expensive
        // also, check for any risk of causing an event?
        const div = document.createElement("div");
        document.body.appendChild(div);
        div.style.color = aColorString;
        const style = window.getComputedStyle(div);
        const color = style.color;
        document.body.removeChild(div);

        assert(color.startsWith("rgb"));
        const inner = color.between("(", ")");
        const parts = inner.split(",");
        const numbers = parts.map((v) => parseInt(v));

        // add an alpha of 1 if no alpha is specified
        // in order to make returned array format consistent

        if (numbers.length === 3) {
            numbers.push(1);
        }

        assert(numbers.length === 4);

        numbers[0] /= 255;
        numbers[1] /= 255;
        numbers[2] /= 255;
        return numbers;
    }

    /**
     * @description Parses a color string, using cache if available
     * @param {string} string - The color string to parse
     * @returns {Array} An array of color components [r, g, b, a]
     */
    parseColorString (string) {
        const cache = CssColor.colorCacheMap();
        const cachedResult = cache.at(string);
        if (!Type.isUndefined(cachedResult)) {
            return cachedResult;
        }

        if (Type.isNull(cachedResult)) {
            throw new Error("invalid color string '" + string + "'");
        }

        const result = this.justParseColorString(string);

        cache.atPut(string, result);
        return result;
    }

    /**
     * @description Sets the color from a CSS color string
     * @param {string} aString - The CSS color string
     * @returns {CssColor} The instance with updated color
     */
    setCssColorString (aString) {
        const array = this.parseColorString(aString);
        this.set(array.at(0), array.at(1), array.at(2), array.at(3));
        return this;
    }

    /**
     * @description Sets the color from a hexadecimal color string
     * @param {string} hex - The hexadecimal color string
     * @returns {CssColor} The instance with updated color
     */
    setHex (hex) {
        return this.setCssColorString(hex);
    }

    /**
     * @description Sets the color components
     * @param {number} r - Red component (0-1)
     * @param {number} g - Green component (0-1)
     * @param {number} b - Blue component (0-1)
     * @param {number} [opacity=1] - Opacity (0-1)
     * @returns {CssColor} The instance with updated color
     */
    set (r, g, b, opacity) {
        this.setRed(r);
        this.setGreen(g);
        this.setBlue(b);

        if (!opacity) {
            this.setOpacity(0);
        } else {
            this.setOpacity(opacity);
        }

        return this;
    }

    /**
     * @description Converts a 0-255 value to 0-1 range
     * @param {number} v - Value to convert
     * @returns {number} Converted value
     */
    v255toUnit (v) {
        return v / 255;
    }

    /**
     * @description Converts a 0-1 value to 0-255 range
     * @param {number} v - Value to convert
     * @returns {number} Converted value
     */
    unitTo255 (v) {
        return Math.round(v * 255);
    }

    /**
     * @description Gets the red component in 0-255 range
     * @returns {number} Red component (0-255)
     */
    red255 () {
        return this.unitTo255(this.red());
    }

    /**
     * @description Gets the green component in 0-255 range
     * @returns {number} Green component (0-255)
     */
    green255 () {
        return this.unitTo255(this.green());
    }

    /**
     * @description Gets the blue component in 0-255 range
     * @returns {number} Blue component (0-255)
     */
    blue255 () {
        return this.unitTo255(this.blue());
    }

    /**
     * @description Gets the CSS color string representation
     * @returns {string} CSS color string (rgba format)
     */
    cssColorString () {
        return "rgba(" + this.red255() + ", " + this.green255() + ", " + this.blue255() + ", " + this.opacity()  + ")";
    }

    /**
     * @description Interpolates between two values
     * @param {number} v1 - First value
     * @param {number} v2 - Second value
     * @param {number} r - Ratio (0-1)
     * @returns {number} Interpolated value
     */
    interpV1V2Ratio (v1, v2, r) {
        if (v1 > v2) {
            return v1 - (v1 - v2) * r;
        }
        return v2 - (v2 - v1) * r;
    }

    /**
     * @description Interpolates color with another color
     * @param {CssColor} other - The other color to interpolate with
     * @param {number} v - Interpolation value (0-1)
     * @returns {CssColor} New interpolated color
     */
    interpolateWithColorTo (other, v) {
        const r1 = this.red();
        const g1 = this.green();
        const b1 = this.blue();
        const o1 = this.opacity();

        const r2 = other.red();
        const g2 = other.green();
        const b2 = other.blue();
        const o2 = other.opacity();

        const r = this.interpV1V2Ratio(r1, r2, v);
        const g = this.interpV1V2Ratio(g1, g2, v);
        const b = this.interpV1V2Ratio(b1, b2, v);
        const o = this.interpV1V2Ratio(o1, o2, v);

        const result = CssColor.clone().set(r, g, b, o);
        return result;
    }

    /**
     * @description Darkens the color
     * @param {number} v - Amount to darken (0-1)
     * @returns {CssColor} The darkened color instance
     */
    darken (v) {
        assertDefined(v);
        assert(v <= 1);
        const r = this.red();
        const g = this.green();
        const b = this.blue();
        this.setRed(r * v);
        this.setGreen(g * v);
        this.setBlue(b * v);
        return this;
    }

    /**
     * @description Lightens the color
     * @param {number} v - Amount to lighten (0-1)
     * @returns {CssColor} The lightened color instance
     */
    lighten (v) {
        assertDefined(v);
        const r = this.red();
        const g = this.green();
        const b = this.blue();
        this.setRed(r + (1 - r) * v);
        this.setGreen(g + (1 - g) * v);
        this.setBlue(b + (1 - b) * v);
        return this;
    }

    /**
     * @description Calculates the brightness of the color
     * @returns {number} Brightness value (0-1)
     */
    brightness () {
        // return value between 0.0 and 1.0
        return (this.red() + this.green() + this.blue()) / 3.0;
    }

    /**
     * @description Creates a white color
     * @returns {CssColor} A new white color instance
     */
    whiteColor () {
        return CssColor.clone().set(1, 1, 1, 1);
    }

    /**
     * @description Creates a black color
     * @returns {CssColor} A new black color instance
     */
    blackColor () {
        return CssColor.clone().set(0, 0, 0, 1);
    }

    /**
     * @description Creates a light gray color
     * @returns {CssColor} A new light gray color instance
     */
    lightGrayColor () {
        return CssColor.clone().set(0.75, 0.75, 0.55, 1);
    }

    /**
     * @description Creates a gray color
     * @returns {CssColor} A new gray color instance
     */
    grayColor () {
        return CssColor.clone().set(0.5, 0.5, 0.5, 1);
    }

    /**
     * @description Creates a dark gray color
     * @returns {CssColor} A new dark gray color instance
     */
    darkGrayColor () {
        return CssColor.clone().set(0.25, 0.25, 0.25, 1);
    }

    /**
     * @description Creates a red color
     * @returns {CssColor} A new red color instance
     */
    redColor () {
        return CssColor.clone().set(1, 0, 0, 1);
    }

    /**
     * @description Creates a green color
     * @returns {CssColor} A new green color instance
     */
    greenColor () {
        return CssColor.clone().set(0, 1, 0, 1);
    }

    /**
     * @description Creates a blue color
     * @returns {CssColor} A new blue color instance
     */
    blueColor () {
        return CssColor.clone().set(0, 0, 1, 1);
    }

    /**
     * @description Creates a yellow color
     * @returns {CssColor} A new yellow color instance
     */
    yellowColor () {
        return CssColor.clone().set(1, 1, 0, 1);
    }

    /**
     * @description Creates a random color
     * @returns {CssColor} A new random color instance
     */
    randomColor () {
        return CssColor.clone().randomize();
    }

    /**
     * @description Converts the color to an object with 0-255 range values
     * @returns {Object} An object with r, g, b properties (0-255)
     */
    asDict255 () {
        return { r:this.red255(), g:this.green255(), b:this.blue255() };
    }

    /**
     * @description Sets the color from an object with 0-255 range values
     * @param {Object} d - An object with r, g, b properties (0-255)
     * @returns {CssColor} The instance with updated color
     */
    fromDict255 (d) {
        this.setRed(d.r / 255);
        this.setGreen(d.g / 255);
        this.setBlue(d.b / 255);
        return this;
    }

    /**
     * @description Creates the complement of the current color
     * @returns {CssColor} A new CssColor instance with the complement color
     */
    complement () {
        let temprgb = this.asDict255();
        const temphsv = RGB2HSV(temprgb);
        temphsv.hue = HueShift(temphsv.hue, 180.0);
        temprgb = HSV2RGB(temphsv);
        return CssColor.clone().fromDict255(temprgb);
    }

    /**
     * @description Creates a contrasting complement of the current color
     * @param {number} v - Amount of contrast (0-1)
     * @returns {CssColor} A new CssColor instance with the contrasting complement color
     */
    contrastComplement (v) { // v should be a value in the range of 0.0 to 1.0
        // returns another CssColor object which is the same as the receiver but darkened
        //

        const b = this.brightness();

        if (b < 0.55) {
            const lightened = this.copy().lighten(v);
            return lightened;
        } else {
            const darkened = this.copy().darken(v);
            return darkened;
        }
    }

}.initThisClass());

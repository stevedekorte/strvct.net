"use strict";

/**
 * @module events.devices
 */

/**
 * @class
 * @classdesc Extends the Event prototype with methods for caching points.
 */
if (!getGlobalThis().Event) {
    console.log("WARNING: no Event object found - maybe we are not in browser?")
} else {
    Object.defineSlots(Event.prototype, {
        /**
         * @description Checks if the event has cached points.
         * @returns {boolean} True if cached points exist, false otherwise.
         * @category Cache Management
         */
        hasCachedPoints: function () {
            return this._cachedPoints !== undefined
        },

        /**
         * @description Sets the cached points for the event.
         * @param {Array} points - The points to be cached.
         * @category Cache Management
         */
        setCachedPoints: function (points) {
            this._cachedPoints = points
        },

        /**
         * @description Retrieves the cached points of the event.
         * @returns {Array|undefined} The cached points or undefined if not set.
         * @category Cache Management
         */
        cachedPoints: function () {
            return this._cachedPoints
        },
        
        /**
         * @description Adds a new point to the cached points array.
         * @param {Object} point - The point to be added to the cached points.
         * @category Cache Management
         */
        pushCachedPoint: function (point) {
            assert(this._cachedPoints)
            this._cachedPoints.push(point)
        }
    })
}
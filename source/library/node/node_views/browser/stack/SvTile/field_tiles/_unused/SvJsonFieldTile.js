/** * @module browser.stack.Tile.field_tiles
 */

/** * @class SvJsonFieldTile
 * @extends SvStringFieldTile
 * @classdesc SvJsonFieldTile class for handling JSON field tiles.
 
 
 */

/**

 */
(class SvJsonFieldTile extends SvStringFieldTile {

    visibleValue () {
        const value = this.node() ? this.node().visibleValue() : null;
        return JSON.stringify(value, null, 2);
    }

    canSyncToNode () {
        // syncToNode will call this method
        return this.canParseViewValue();
    }

    parseViewValue () {
        try {
            const json = JSON.parse(this.valueView().value());
            return json;
        } catch (error) {
            if (error) {
                // ignore - just here to keep linter happy
                this.setError(error);
            }
            return undefined;
        }
    }

    canParseViewValue () {
        return this.parseViewValue() !== undefined;
    }

    valueViewValue () {
        return this.parseViewValue();
    }

}.initThisClass());

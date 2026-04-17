# Programmatic Styling

Named CSS methods, the chainable API, and why STRVCT avoids CSS files.

## Why No CSS Files?

### The cascade is additive

The CSS cascade is designed for documents: you declare rules, the browser resolves conflicts by specificity and source order, and the result is static. You can mutate individual rules through the CSSOM, but the cascade itself is additive — removing a rule doesn't restore a known-good state, it just lets some other rule win, potentially one you didn't intend. This makes the cascade unreliable for UI components whose appearance changes frequently at runtime.

### State combinatorics

The deeper problem is combinatorial. Consider the independent states a single view might have: editable or read-only, selected or unselected, highlighted or not, showing an error, previously navigated, disabled. Five boolean states produce 32 combinations, and each combination may need distinct styling. In a stylesheet, each combination requires its own selector or class chain — and the count doubles with every new state. You can try to treat each state independently (`.selected` sets some properties, `.error` sets others), but that only works when the states don't interact visually. When "selected + error" needs to look different from the sum of "selected" and "error" applied separately, you're back to enumerating combinations.

### Theming compounds the problem

CSS custom properties can swap values at runtime, but they don't help with the structural problem of *which properties to set in which state combinations*. When a user customizes a theme, or different regions of the UI use different themes simultaneously, every state combination now has a theme axis too. The custom properties handle the value lookup, but the combinatorial selector structure they plug into still has to be authored and maintained by hand.

### The programmatic alternative

Programmatic styling sidesteps all of this. Each state applies its visual changes directly to the element, and the results compose naturally — enabling "selected" and "error" at the same time just means both sets of property changes are applied, with explicit logic for cases where they interact. Themes are dictionaries of values that can be swapped or scoped to any subtree at any time — no cascade resolution, just direct assignment. The styling logic lives alongside the view logic that drives it, so the two can't drift apart.

## Named Property Methods

Every view inherits named setter/getter pairs for standard CSS properties. These are the primary styling API:

```javascript
this.setBackgroundColor("rgba(0, 0, 0, 0.5)");
this.setPosition("fixed");
this.setDisplay("flex");
this.setZIndex(9999);
this.setTop("0");
this.setLeft("0");
this.setWidth("100vw");
this.setHeight("100vh");
this.setFontSize("14px");
this.setColor("white");
this.setBorderRadius("8px");
this.setOverflow("hidden");
this.setPadding("16px");
this.setBoxShadow("0 2px 8px rgba(0,0,0,0.15)");
```

Every setter returns `this`, so calls chain naturally. Each property also has a corresponding getter (e.g. `backgroundColor()`, `fontSize()`).

## Flexbox Methods

`SvFlexDomView` adds named methods for every flexbox property:

```javascript
this.setDisplay("flex");
this.setFlexDirection("column");
this.setJustifyContent("center");
this.setAlignItems("stretch");
this.setFlexWrap("wrap");
this.setFlexGrow(1);
this.setFlexShrink(0);
this.setFlexBasis("auto");
this.setGap("8px");
```

## Layout Convenience Methods

`SvFlexDomView` also provides higher-level shortcuts for common multi-property patterns:

| Method | Effect |
|--------|--------|
| `makeFlexAndCenterContent()` | Sets display flex, centers both axes |
| `flexCenterContent()` | Centers content horizontally and vertically |
| `makeStandardFlexView()` | Flex display, relative positioning, centered, overflow hidden |
| `fillParentView()` | Sets width and height to 100% |
| `newFlexSubview()` | Creates and adds a flex child with min dimensions set |

## Sizing Shortcuts

Convenience methods for constrained sizing:

| Method | Effect |
|--------|--------|
| `setMinAndMaxWidth(v)` | Sets min-width, max-width, and width to the same value |
| `setMinAndMaxHeight(v)` | Sets min-height, max-height, and height to the same value |
| `setMinAndMaxWidthAndHeight(v)` | Sets all six sizing properties at once |

These are useful for fixed-size elements like icons or thumbnails where you want all constraints to agree.

## Node-Driven CSS

Nodes can also request CSS properties that get applied to their view automatically. A node implements `cssVariableDict()` to return a dictionary of CSS key/value pairs:

```javascript
cssVariableDict () {
    return {
        "color": this.isActive() ? "white" : "gray",
        "--accent-color": this.themeColor()
    };
}
```

During the normal sync cycle, `SvNodeView.syncCssFromNode()` picks up this dictionary and applies it to the view's DOM element. This lets model logic influence presentation without the node needing any reference to its view — the node declares what it wants, and the view system handles the rest.

In general, prefer keeping styling in the view layer. Node-driven CSS is available for cases where the model genuinely determines a visual property (e.g. a user-chosen color or a status-dependent highlight), but most styling belongs in views or themes, not in model code.

## Low-Level Access

For unusual CSS properties that don't have a named method, `SvCssDomView` provides generic accessors:

| Method | Description |
|--------|-------------|
| `setCssProperty(key, value)` | Sets any CSS property by name |
| `getCssProperty(key)` | Gets the computed value |
| `removeCssProperty(key)` | Removes a property |

These should be rare in practice — the named methods cover the vast majority of styling needs.

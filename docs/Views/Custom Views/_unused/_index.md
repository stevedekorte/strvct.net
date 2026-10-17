# Custom Views

How to create custom view classes when the auto-generated UI doesn't fit.

## When to Create a Custom View

The auto-generated view system handles the common case: a node's slots and subnodes produce tiles, field editors, and navigation automatically. Custom views are for situations where you need a specific layout, non-standard DOM elements, or visual behavior that doesn't map to the tile-based pattern — overlays, canvas-based rendering, media players, or composite displays.

## The Basic Pattern

A custom view extends `SvDomView` (or one of its ancestors) and configures itself in `init()`:

```javascript
(class MyOverlayView extends SvDomView {

    init () {
        super.init();
        this.setPosition("fixed");
        this.setTop("0");
        this.setLeft("0");
        this.setWidth("100vw");
        this.setHeight("100vh");
        this.makeFlexAndCenterContent();
        this.setBackgroundColor("rgba(0, 0, 0, 0.5)");
        this.setZIndex(9999);
        return this;
    }

}.initThisClass());
```

All styling uses named property methods — there are no CSS files to manage. Every setter returns `this`, so calls chain naturally. See the Programmatic Styling page for the full API.

## Creating Child Views

Child views are created with `clone()` (not `new`) and added with `addSubview()`:

```javascript
init () {
    super.init();
    this.makeFlexAndCenterContent();

    const label = SvDomView.clone();
    label.setInnerHTML("Hello");
    label.setColor("white");
    label.setFontSize("24px");
    this.addSubview(label);

    return this;
}
```

`clone()` runs the full initialization lifecycle (`init()` then `finalInit()` then `afterInit()`). Use `addSubview()` to establish the parent/child relationship — it handles both the framework's view tree and the underlying DOM.

## Connecting to a Node

To make a custom view respond to model changes, extend `SvNodeView` instead of `SvDomView` and implement `syncFromNode()`:

```javascript
(class MyStatusView extends SvNodeView {

    init () {
        super.init();
        this._label = SvDomView.clone();
        this.addSubview(this._label);
        return this;
    }

    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        if (node) {
            this._label.setInnerHTML(node.statusText());
        }
    }

}.initThisClass());
```

`syncFromNode()` is called automatically whenever the observed node posts a change notification. The sync scheduler batches these calls so multiple rapid changes produce a single update.

## View Resolution for Custom Views

The framework finds views by naming convention: for a node class `MyWidget`, it looks for `MyWidgetView`. To use a custom view for a node type, just name the class to match:

- `UoCharacter` uses `UoCharacterView` (if it exists)
- `UoSession` uses `UoSessionView`
- Falls back to ancestor class names if no exact match

You can also override on the node side with `nodeViewClassName()` to point at a different view class.

## Convenience Methods

`SvFlexDomView` provides shortcuts for common layout patterns:

| Method | Effect |
|--------|--------|
| `makeFlexAndCenterContent()` | Sets display flex, centers both axes |
| `flexCenterContent()` | Centers content horizontally and vertically |
| `makeStandardFlexView()` | Flex display, relative positioning, centered, overflow hidden |
| `fillParentView()` | Sets width and height to 100% |
| `newFlexSubview()` | Creates and adds a flex child with min dimensions set |

These eliminate the most common multi-property patterns and keep `init()` methods concise.

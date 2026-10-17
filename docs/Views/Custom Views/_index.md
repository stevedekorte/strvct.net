# Custom Views

Authoring custom view classes, DOM wrappers, flex shortcuts, and model synchronization for specialized media.

## Overview

While auto-generated views handle structured domain data, custom view classes are created for **specialized media** where spatial layout carries irreducible domain meaning: WebGL 3D viewports, canvas drawing, media players, overlay panels, or battle maps.

```
+-------------------------------------------------------------------------+
|                         Custom View Lifecycle                           |
+-------------------------------------------------------------------------+
|  1. Extend SvNodeView  -->  2. Instantiate via clone()  --> 3. addSubview |
|  4. Chained Setters    -->  5. syncFromNode()           --> 6. DevTools  |
+-------------------------------------------------------------------------+
```

---

## The Custom View Pattern

Custom views extend `SvDomView` (or `SvNodeView`) and perform setup inside `init()`:

```javascript
(class MyOverlayView extends SvNodeView {

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

        // Create child view via clone()
        this._label = SvDomView.clone();
        this._label.setColor("white");
        this._label.setFontSize("24px");
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

---

## View Construction Rules: `clone()` vs `new`

- **Always Use `clone()`:** View instances MUST be instantiated via `Class.clone()` rather than `new Class()`.
- **Initialization Phases:** `clone()` executes the three-phase lifecycle automatically: `init()` $\rightarrow$ `finalInit()` $\rightarrow$ `afterInit()`.
- **View Tree & DOM Tree:** `this.addSubview(childView)` establishes both the internal framework subview hierarchy and appends the underlying DOM element.

---

## `SvFlexDomView` Layout Shortcuts

| Shortcut Method | CSS Property Modifications |
|---|---|
| `makeFlexAndCenterContent()` | Sets `display: flex`, `justify-content: center`, `align-items: center`. |
| `makeStandardFlexView()` | Sets `display: flex`, `position: relative`, `overflow: hidden`. |
| `fillParentView()` | Sets `width: 100%` and `height: 100%`. |
| `newFlexSubview()` | Creates and appends a flex child with `min-width: 0` and `min-height: 0`. |

---

## Related Guides

- [Auto-Generated Views](../Auto-Generated%20Views/index.html): View resolution and stack containers.
- [Responsive Views](../Responsive/index.html): Viewport compaction and column collapse.

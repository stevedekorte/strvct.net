# Inspectors and Debugging

Built-in tools for live Property Inspection, Developer Mode graph toggles, and Chrome DevTools source debugging.

## Overview

Because STRVCT generates user interfaces from annotated model nodes, the framework can automatically derive an **alternate Property Inspector view** for any domain object.

- **Option-Click (Alt-Click):** Option-clicking any tile opens its **Property Inspector** in the next column—a dynamically generated field tile stack displaying declared property slots, values, types, and editability flags.
- **Option-Shift-D (Alt-Shift-D):** Toggles **Developer Mode** globally (`SvApp.shared().developerMode()`), revealing hidden diagnostic subnodes, raw state inspectors, and AI message logs.

<svg viewBox="0 0 820 280" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="ains" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="230"/>
  <text x="40" y="42" class="b">User Gesture Trigger</text>

  <rect class="fill" x="40" y="60" width="210" height="45"/>
  <text x="55" y="80" class="b">Option-Click Tile</text>
  <text x="55" y="95" class="dim">justAlternateTap() on tile</text>

  <rect class="fill" x="40" y="115" width="210" height="45"/>
  <text x="55" y="135" class="b">Option-Shift-D</text>
  <text x="55" y="150" class="dim">Toggles developerMode()</text>

  <rect class="fill" x="40" y="170" width="210" height="45"/>
  <text x="55" y="190" class="b">Chrome DevTools</text>
  <text x="55" y="205" class="dim">sourceURL breakpoint debugging</text>

  <line class="flow" x1="265" y1="135" x2="290" y2="135" marker-end="url(#ains)"/>

  <rect class="fill" x="290" y="20" width="240" height="230"/>
  <text x="305" y="42" class="b">SvInspectableNode Engine</text>

  <rect class="box" x="305" y="60" width="210" height="45"/>
  <text x="320" y="80" class="b">setupInspectorFromSlots()</text>
  <text x="320" y="95" class="dim">Walks allSlotsMap() on prototype</text>

  <rect class="box" x="305" y="115" width="210" height="45"/>
  <text x="320" y="135" class="b">nodeInspector()</text>
  <text x="320" y="150" class="dim">Generates field stack on demand</text>

  <rect class="box" x="305" y="170" width="210" height="45"/>
  <text x="320" y="190" class="b">onAppDeveloperModeNote</text>
  <text x="320" y="205" class="dim">Posts global toggle notification</text>

  <line class="flow" x1="530" y1="135" x2="555" y2="135" marker-end="url(#ains)"/>

  <rect class="box" x="555" y="20" width="240" height="230"/>
  <text x="570" y="42" class="b">Live Runtime Presentation</text>

  <rect class="fill" x="570" y="60" width="210" height="45"/>
  <text x="585" y="80" class="b">Field Tile Column</text>
  <text x="585" y="95" class="dim">Opens editable slot controls</text>

  <rect class="fill" x="570" y="115" width="210" height="45"/>
  <text x="585" y="135" class="b">Hidden Subnodes Revealed</text>
  <text x="585" y="150" class="dim">Toggles setIsVisible() on subnodes</text>

  <rect class="fill" x="570" y="170" width="210" height="45"/>
  <text x="585" y="190" class="b">Write-Through Sync</text>
  <text x="585" y="205" class="dim">Edits update live object pool</text>
</svg>

---

## Option-Click: Property Inspector

Holding **Option** while clicking any tile opens an inspector view in the next column instead of navigating to the node's standard subnodes.

### Mechanism & Implementation (`SvInspectableNode`):
1. **Gesture Interception:** The tile gesture handler (`SvTile.justAlternateTap()`) catches the Option-Click gesture and sets `isInspecting = true` on the tile.
2. **Inspector Generation:** `SvInspectableNode.nodeInspector()` clones an inspector node and populates it via `setupInspectorFromSlots()`.
3. **Slot Map Inspection:** `setupInspectorFromSlots()` walks `allSlotsMap()` down the node's class inheritance chain, instantiating an `SvFieldTile` for every slot where `slot.canInspect()` returns `true`.
4. **Live Write-Through:** Edits made inside the inspector write directly through to the live object node, automatically triggering IndexedDB persistence and view change notifications.

### Inspector Slot Annotations:
- `slot.setCanEditInspection(true)`: Controls whether the slot value is editable in place inside the inspector.
- `slot.setInspectorPath("Section/Subsection")`: Groups slots into collapsible inspector section headers.

---

## Option-Shift-D: Developer Mode

Pressing **Option+Shift+D** anywhere in `SvBrowserView` toggles `SvApp.shared().developerMode()`. The app posts an `onAppDeveloperModeChangedNote` notification when toggled.

### Opt-In Subnode Visibility Code Pattern:

Domain nodes register to observe the notification and show or hide diagnostic subnodes:

```javascript
(class Character extends SvStorableNode {

    init () {
        super.init();
        this.watchForNote("onAppDeveloperModeChangedNote");
    }

    onAppDeveloperModeChangedNote (/*aNote*/) {
        const devMode = this.app().developerMode();
        this.diagnosticsNode().setIsVisible(devMode);
        this.rawStateNode().setIsVisible(devMode);
        this.aiMessageHistory().setIsVisible(devMode);
    }

}.initThisClass());
```

---

## Related Guides

- [Nodes](../Nodes/index.html): Core `SvNode` domain abstraction.
- [Slots](../Slots/index.html): Complete guide to slot metadata and declarations.
- [Getting Started](../Getting%20Started/index.html): DevTools configuration and debugging launch configs.

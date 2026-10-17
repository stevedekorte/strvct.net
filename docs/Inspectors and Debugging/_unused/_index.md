# Inspectors and Debugging

Built-in tools for inspecting nodes and revealing hidden parts of the model graph at runtime.

## Overview

Because STRVCT generates the UI from annotated model nodes, the same machinery can render an *alternate* view of any node — one that exposes its slots directly. Two interactions take advantage of this:

- **Option-Click** on a tile opens an **inspector** for that node — a column of field tiles, one per inspectable slot, showing the slot's current value, type, and editability.
- **Option-Shift-D** toggles **developer mode** — a global flag that applications use to reveal nodes and subnodes normally hidden from end users.

Both work in any STRVCT application without per-node setup.

<svg viewBox="0 0 820 390" width="820" xmlns="http://www.w3.org/2000/svg">
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
  <rect class="fill" x="220" y="20" width="380" height="88"/>
  <text x="235" y="40" class="b">Option-click a tile</text>
  <text x="235" y="58" class="dim">on any node in the running app</text>
  <line class="flow" x1="410" y1="108" x2="410" y2="133" marker-end="url(#ains)"/>
  <rect class="fill" x="220" y="133" width="380" height="88"/>
  <text x="235" y="153" class="b">Inspector node generated on demand</text>
  <text x="235" y="171" class="dim">framework walks the target's slot metadata;</text>
  <text x="235" y="189" class="dim">one field tile per slot whose canInspect() is true</text>
  <line class="flow" x1="410" y1="221" x2="410" y2="246" marker-end="url(#ains)"/>
  <rect class="fill" x="220" y="246" width="380" height="88"/>
  <text x="235" y="266" class="b">Field tiles open in the next column</text>
  <text x="235" y="284" class="dim">slot name · current value · type-aware editor;</text>
  <text x="235" y="302" class="dim">edits write through to the live object,</text>
  <text x="235" y="320" class="dim">persistence and view sync follow automatically</text>
  <text x="220" y="370" class="dim">Option-Shift-D toggles developer mode globally, revealing nodes that applications hide from end users.</text>
</svg>

## Option-Click: Inspect a Tile

Holding **Option** while clicking a tile opens an inspector view in the next column instead of navigating into the node's normal subnodes.

### What you see

The inspector is itself a node — generated on demand from the target's slot metadata. It contains one field tile for every slot whose configuration permits inspection (`canInspect()` returns true on the slot, which is set automatically when you call `setSlotType(...)` or related annotations). Each field tile shows:

- the slot name as the field key,
- the current slot value rendered with a type-appropriate editor (string, number, boolean, options list, pointer, etc.),
- whether the value is editable in place (controlled by `setCanEditInspection(true|false)` on the slot).

Slots can be grouped into sections by setting `setInspectorPath("Section/Subsection")`, which causes the inspector to nest summary nodes for organization.

### Why it's useful

The inspector reveals state that the tile's normal title/subtitle does not — internal flags, cached values, type information, references to other nodes. Because the editor is the same one the framework uses for forms, edits made in the inspector mutate the live object and propagate through the standard sync and persistence pipelines.

### Implementation note

`SvInspectableNode.nodeInspector()` lazily clones a base node and populates it via `setupInspectorFromSlots()`, which walks `allSlotsMap()` and creates a field for each inspectable slot. The tile gesture handler `justAlternateTap()` flips `isInspecting` on the tile, and `nodeTileLink()` then returns the inspector node instead of the regular link target — so the next column displays the inspector. The mechanism reuses the standard view pipeline, which is why no inspector-specific UI code exists.

## Option-Shift-D: Developer Mode

Pressing **Option+Shift+D** anywhere in a `SvBrowserView` toggles `SvApp.shared().developerMode()`. The framework posts an `onAppDeveloperModeChangedNote` notification when the flag flips; subscribers respond by toggling `isVisible` on nodes and slots that should appear only in developer mode.

### What gets revealed

Each application decides what is "hidden" — the framework only provides the toggle and the notification. Typical patterns include:

- internal subnodes used for diagnostics or backing storage,
- service configuration or resource indexes,
- raw JSON / clipboard-export actions,
- AI message history that's normally suppressed (system messages, parser internals).

Nodes opt in by observing the note and calling `setIsVisible(devMode)` on the subnodes that should appear or disappear:

```javascript
init () {
    super.init();
    this.watchForNote("onAppDeveloperModeChangedNote");
}

onAppDeveloperModeChangedNote (/*aNote*/) {
    const devMode = this.app().developerMode();
    this.diagnostics().setIsVisible(devMode);
    this.rawState().setIsVisible(devMode);
}
```

Once visible, these subnodes are navigable like any other — Option-Click works on them too, so developer mode and the inspector compose naturally.

### Implementation note

The handler lives on `SvBrowserView` (`onAlternate_D_KeyDown`) and is bound by the standard keyboard naming convention: capital `D` implies the Shift modifier, and `Alternate` is the Option/Alt key. `toggleDeveloperMode()` flips a stored slot on `SvApp`, so the state survives navigation and persists across reloads if the slot is configured to store.

## Composition

The two features are independent but pair well:

1. Press **Option-Shift-D** to surface developer-only nodes.
2. Navigate into them like any other model node.
3. **Option-Click** any tile to inspect its slots when the title and subtitle don't tell you enough.

Because both operations reuse the same view pipeline as the rest of the framework, anything that can be displayed can be inspected, and anything that can be hidden can be revealed — without writing UI code for either case.

# Drag and Drop

Browser drag-and-drop support for views and nodes, covering both drop targets and drag sources.

## Overview

STRVCT wraps the HTML5 Drag and Drop API through two complementary systems:

- **Drop targets** — Views register to accept dropped content (files, text, HTML from the desktop or other apps). Handled by `DomView_browserDragAndDrop` (a category on `DomView`) and `DropListener`.
- **Drag sources** — Views register to be draggable, providing data when the user initiates a drag. Handled by the same category class plus `DragListener`.

The system routes dropped data through a MIME-type dispatch chain, ultimately delivering it to either the view or its backing node.

## Architecture

### Class Hierarchy

```
EventSetListener
  ├── DropListener      — dragenter, dragover, dragleave, drop
  └── DragListener      — dragstart, drag, dragend

DomView
  └── DomView_browserDragAndDrop  (category)
        ├── Drop target API (acceptsDrop, onBrowserDrop, etc.)
        ├── Drag source API (setDraggable, onBrowserDragStart, etc.)
        └── MIME dispatch (onBrowserDropChunk → dropMethodForMimeType)
```

### Key Files

| File | Purpose |
|------|---------|
| `source/library/view/dom/DomView/DomView_browserDragAndDrop.js` | Drop/drag API on all views |
| `source/library/view/events/listening/listeners/DropListener.js` | Drop event listener set |
| `source/library/view/events/listening/listeners/DragListener.js` | Drag event listener set |
| `source/library/view/events/listening/EventSetListener.js` | Base listener management |
| `source/library/view/events/listening/EventListener.js` | Single event listener wrapper |
| `source/library/view/dom/DomView/ListenerDomView.js` | Lazy listener creation on views |
| `source/library/view/dom/DomView/subclasses/DocumentBody.js` | Global drop prevention |

## Drop Targets

### Registering a View for Drops

```javascript
// In a view's init() method:
this.setIsRegisteredForBrowserDrop(true);
```

This creates a `DropListener` that registers four event handlers on the view's DOM element:

| DOM Event | Handler Method |
|-----------|---------------|
| `dragenter` | `onBrowserDragEnter(event)` |
| `dragover` | `onBrowserDragOver(event)` |
| `dragleave` | `onBrowserDragLeave(event)` |
| `drop` | `onBrowserDrop(event)` |

All listeners use **bubble phase** by default (`useCapture: false`).

### Accepting or Rejecting Drops

Override `acceptsDrop(event)` to control whether the view accepts a drop:

```javascript
acceptsDrop (event) {
    // Default implementation returns true.
    // Override to inspect event.dataTransfer.types, etc.
    return true;
}
```

The return value controls both visual feedback (drag highlight) and whether the drop is processed.

### Drop Processing Chain

When a drop is accepted, data flows through this chain:

```
onBrowserDrop(event)
  └── onBrowserDataTransfer(dataTransfer)
        ├── [files present] → onBrowserDropFile(file) for each file
        │     └── onBrowserDropMimeTypeAndRawData(mimeType, dataUrl)
        │           └── onBrowserDropChunk(dataChunk)
        │                 └── dropMethodForMimeType(mimeType) → e.g. onBrowserDropImagePng(chunk)
        └── [items present] → getAsString → onBrowserDropChunk(dataChunk)
                                              └── (same MIME dispatch)
```

Each step can be overridden independently for custom handling.

### MIME Type Dispatch

`dropMethodForMimeType()` converts a MIME type to a handler method name:

| MIME Type | Method Name |
|-----------|------------|
| `image/png` | `onBrowserDropImagePng` |
| `image/jpeg` | `onBrowserDropImageJpeg` |
| `text/html` | `onBrowserDropTextHtml` |
| `text/plain` | `onBrowserDropTextPlain` |
| `application/json` | `onBrowserDropApplicationJson` |

If the view doesn't implement the specific method, the drop is silently ignored. To handle all types, override `onBrowserDropChunk(dataChunk)` directly.

### Data Chunk Format

Dropped data is wrapped in an `SvDataUrl` instance (`dataChunk`) that provides:

- `mimeType()` — The content MIME type
- `decodedData()` — The decoded string content
- `setDataUrlString(url)` — For file drops (data URL format)

### Visual Feedback

Override these for drag-over highlighting:

```javascript
dragHighlight () {
    // Called when dragging over an accepting view.
    // Add visual indication (border, background, etc.)
}

dragUnhighlight () {
    // Called when drag leaves or drop completes.
    // Remove visual indication.
}
```

## Drag Sources

### Making a View Draggable

```javascript
this.setIsRegisteredForBrowserDrag(true);
// This also calls setDraggable(true) on the element.
```

This registers a `DragListener` for `dragstart`, `drag`, and `dragend` events.

### Providing Drag Data

Override `onBrowserDragStart(event)` to set data on the transfer:

```javascript
onBrowserDragStart (event) {
    event.dataTransfer.setData("text/plain", this.node().title());
    event.dataTransfer.setData("application/json", JSON.stringify(this.node().asJson()));
    return true; // return false to cancel the drag
}
```

## Node Integration

### Forwarding Drops to Nodes

Views (particularly `TilesView`) forward drop data to their backing node:

```javascript
// In TilesView:
onBrowserDropChunk (dataChunk) {
    const node = this.node();
    if (node && node.onBrowserDropChunk) {
        node.onBrowserDropChunk(dataChunk);
    }
    this.scheduleSyncFromNode();
}
```

Nodes implement `onBrowserDropChunk(dataChunk)` to handle the import:

```javascript
// In a node class:
onBrowserDropChunk (dataChunk) {
    if (dataChunk.mimeType() === "application/json") {
        const json = JSON.parse(dataChunk.decodedData());
        const item = MyItemClass.clone().deserializeFromJson(json, null, []);
        this.addSubnode(item);
    }
}
```

## Event Propagation

### How Events Flow

Drop events follow standard DOM bubbling. The event fires on the **innermost element under the cursor**, then bubbles up through ancestor elements:

```
[drop target element]
  → child view element (if listener registered, handler fires)
    → parent view element (if listener registered, handler fires)
      → ... ancestors ...
        → document.body (DocumentBody handler fires)
```

Only elements with registered `DropListener` instances fire handlers. Views without drop registration are transparent to the event.

### Stopping Propagation

When a view **accepts** a drop (returns `true` from `acceptsDrop`), the handler calls `event.stopPropagation()`, preventing ancestor views from also handling the drop.

When a view **rejects** a drop, the event continues bubbling to ancestor views. The `EventListener.handleEvent()` method also calls `stopPropagation()` when a handler returns `false`, but since this only affects further bubbling from that point, it has no effect at the top of the tree.

### DocumentBody as Safety Net

`DocumentBody` registers for drops globally on `document.body` to prevent the browser's default behavior of navigating to (opening) dropped files:

```javascript
// DocumentBody:
acceptsDrop (event) {
    event.preventDefault();  // prevent browser from opening the file
    return false;            // reject the drop
}
```

This acts as a catch-all. If a child view handles the drop first and calls `stopPropagation()`, DocumentBody never sees the event.

### ScrollView Drop Delegation

Drop events fire on the **innermost DOM element under the cursor** and bubble upward through ancestors. A view only receives the event if its own element (or a descendant) is the drop target. This creates a gap when a child view's element doesn't fill its parent container — drops in the empty space land on the parent and bypass the child entirely.

**Example:** `TilesView` (registered for drops) sits inside `ScrollView`. If the tiles don't fill the scroll viewport, drops in the empty space below the last tile land on ScrollView's element, not TilesView's.

`ScrollView` solves this by registering for drops itself and **delegating to its content view**:

```javascript
// ScrollView:
acceptsDrop (event) {
    const cv = this.scrollContentView();
    return cv && cv.acceptsDrop ? cv.acceptsDrop(event) : false;
}

onBrowserDrop (event) {
    const cv = this.scrollContentView();
    if (cv) {
        return cv.onBrowserDrop(event);
    }
    event.preventDefault();
    return false;
}
```

This ensures drops anywhere in the scroll area — including empty space below the content — are handled by the content view (typically TilesView). ScrollView acts as a transparent proxy for drop events.

## Listener Lifecycle

### Creation

Listeners are created lazily when first accessed via `ListenerDomView.listenerNamed()`:

```javascript
listenerNamed (className) {
    const map = this.eventListenersMap();
    if (!map.has(className)) {
        const instance = Object.getClassNamed(className).clone()
            .setListenTarget(this.element())
            .setDelegate(this);
        map.set(className, instance);
    }
    return map.get(className);
}
```

The listener target is the view's DOM element. The delegate is the view itself.

### Starting and Stopping

`EventSetListener.start()` iterates its child `EventListener` instances, each of which:

1. Checks `delegateCanRespond()` — verifies the delegate has the handler method
2. Calls `addEventListener()` on the target element with the configured options

`stop()` removes all event listeners. `setIsListening(bool)` toggles between started and stopped states.

### Resynchronization

If the listen target, delegate, or capture mode changes while listening, the listener automatically stops, updates its configuration, and restarts via `resync()`.

## Summary

| Concept | Class/Method | Purpose |
|---------|-------------|---------|
| Register for drops | `setIsRegisteredForBrowserDrop(true)` | Listen for drag/drop events |
| Accept/reject | `acceptsDrop(event)` | Control which drops are handled |
| Process drop | `onBrowserDropChunk(dataChunk)` | Handle dropped data |
| MIME routing | `dropMethodForMimeType(mimeType)` | Route to type-specific handler |
| Visual feedback | `dragHighlight()` / `dragUnhighlight()` | Show drop zone state |
| Make draggable | `setIsRegisteredForBrowserDrag(true)` | Enable as drag source |
| Provide drag data | `onBrowserDragStart(event)` | Set transfer data |
| Node integration | `node.onBrowserDropChunk(chunk)` | Forward drops to model |
| Safety net | `DocumentBody.acceptsDrop()` | Prevent browser file open |

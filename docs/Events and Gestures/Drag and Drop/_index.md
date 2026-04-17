# Drag and Drop

Browser drag-and-drop support for views and nodes, covering both drop targets and drag sources.

## Overview

The browser's native drag-and-drop API is low-level and inconsistent — you must manually parse `DataTransfer` objects, handle file vs. string items differently, prevent the browser from navigating to dropped files, and deal with empty-space drops that bypass child elements entirely. STRVCT wraps this into a clean protocol: register a view for drops, and data arrives already parsed, typed by MIME, and routed to a handler method you name. You only implement the types you care about; everything else is silently ignored. The result is that adding drag-and-drop to a new view is typically a one-line registration plus one handler method.

STRVCT wraps the HTML5 Drag and Drop API through two complementary systems:

- **Drop targets** — Views register to accept dropped content (files, text, HTML from the desktop or other apps). Handled by `SvDomView_browserDragAndDrop` (a category on `SvDomView`) and `SvDropListener`.
- **Drag sources** — Views register to be draggable, providing data when the user initiates a drag. Handled by the same category class plus `SvDragListener`.

The system routes dropped data through a MIME-type dispatch chain, ultimately delivering it to either the view or its backing node.

## Key Files

| File | Purpose |
|------|---------|
| `SvDomView_browserDragAndDrop.js` | Drop/drag API on all views |
| `SvDropListener.js` | Drop event listener set |
| `SvDragListener.js` | Drag event listener set |
| `SvDocumentBody.js` | Global drop prevention |

## Drop Targets

### Registering a View for Drops

```javascript
// In a view's init() method:
this.setIsRegisteredForBrowserDrop(true);
```

This creates a `SvDropListener` that registers four event handlers on the view's DOM element:

| DOM Event | Handler Method |
|-----------|---------------|
| `dragenter` | `onBrowserDragEnter(event)` |
| `dragover` | `onBrowserDragOver(event)` |
| `dragleave` | `onBrowserDragLeave(event)` |
| `drop` | `onBrowserDrop(event)` |

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

This registers a `SvDragListener` for `dragstart`, `drag`, and `dragend` events.

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

Views (particularly `SvTilesView`) forward drop data to their backing node:

```javascript
// In SvTilesView:
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

## SvScrollView Drop Delegation

Drop events fire on the innermost DOM element under the cursor and bubble upward. When a child view's element doesn't fill its parent container, drops in the empty space land on the parent and bypass the child.

`SvScrollView` solves this by registering for drops itself and delegating to its content view:

```javascript
// SvScrollView:
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

This ensures drops anywhere in the scroll area — including empty space below the content — are handled by the content view (typically SvTilesView).

## SvDocumentBody Safety Net

`SvDocumentBody` registers for drops globally on `document.body` to prevent the browser's default behavior of navigating to dropped files:

```javascript
// SvDocumentBody:
acceptsDrop (event) {
    event.preventDefault();  // prevent browser from opening the file
    return false;            // reject the drop
}
```

If a child view handles the drop first and calls `stopPropagation()`, SvDocumentBody never sees the event.

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
| Safety net | `SvDocumentBody.acceptsDrop()` | Prevent browser file open |
| Scroll delegation | `SvScrollView.onBrowserDrop()` | Forward drops in empty space |

# Drag and Drop

Browser drag-and-drop support for views and nodes, covering drop targets, drag sources, and MIME-type dispatch.

## Overview

The browser's native HTML5 drag-and-drop API is low-level and inconsistent—you must manually parse `DataTransfer` objects, handle files versus text strings differently, prevent default browser navigation on dropped files, and manage empty-space drops that bypass child elements.

STRVCT wraps this into a clean, declarative protocol:
- **Drop Targets:** Views register to accept dropped content (`setIsRegisteredForBrowserDrop(true)`). Dropped data arrives pre-parsed, typed by MIME, and dispatched directly to a handler method named by convention.
- **Drag Sources:** Views register as draggable sources (`setIsRegisteredForBrowserDrag(true)`), populating `DataTransfer` payloads when a drag initiates.

<svg viewBox="0 0 820 500" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="add" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="220" y="20" width="380" height="52"/>
  <text x="235" y="40" class="b">1. Browser DOM Drop Event</text>
  <text x="235" y="58" class="dim">DataTransfer with files, text, HTML, or JSON</text>

  <line class="flow" x1="410" y1="72" x2="410" y2="115" marker-end="url(#add)"/>

  <rect class="fill" x="220" y="115" width="380" height="70"/>
  <text x="235" y="135" class="b">2. SvDropListener Target Check</text>
  <text x="235" y="153" class="dim">dragenter / dragover / dragleave / drop;</text>
  <text x="235" y="171" class="dim">Checks view.acceptsDrop(event)</text>

  <line class="flow" x1="410" y1="185" x2="410" y2="235" marker-end="url(#add)"/>

  <rect class="fill" x="220" y="235" width="380" height="106"/>
  <text x="235" y="255" class="b">3. MIME-Type Convention Dispatch</text>
  <text x="235" y="273" class="dim">text/plain  →  onBrowserDropTextPlain(dataChunk)</text>
  <text x="235" y="291" class="dim">text/html   →  onBrowserDropTextHtml(dataChunk)</text>
  <text x="235" y="309" class="dim">image/png   →  onBrowserDropImagePng(dataChunk)</text>
  <text x="235" y="327" class="dim">app/json    →  onBrowserDropApplicationJson(chunk)</text>

  <line class="flow" x1="410" y1="341" x2="410" y2="385" marker-end="url(#add)"/>

  <rect class="fill" x="220" y="385" width="380" height="70"/>
  <text x="235" y="405" class="b">4. View or Model Node Handler Runs</text>
  <text x="235" y="423" class="dim">Application processes typed data chunk;</text>
  <text x="235" y="441" class="dim">unhandled MIME types are silently ignored</text>

  <text x="410" y="490" text-anchor="middle" class="dim">Register drop support via setIsRegisteredForBrowserDrop(true) and implement one handler method per accepted MIME type.</text>
</svg>

---

## Key Framework Classes

| File / Class Name | Purpose & Responsibilities |
|---|---|
| `SvDomView_browserDragAndDrop.js` | Category on `SvDomView` implementing drop/drag target APIs. |
| `SvDropListener.js` | Manages element drop event listeners (`dragenter`, `dragover`, `dragleave`, `drop`). |
| `SvDragListener.js` | Manages element drag source event listeners (`dragstart`, `dragend`). |
| `SvDocumentBody.js` | Global drop prevention on `document.body` to stop browser file navigation. |

---

## Drop Targets API

### 1. Registering a View for Drops
```javascript
init () {
    super.init();
    this.setIsRegisteredForBrowserDrop(true); // Attaches SvDropListener
    return this;
}
```

### 2. Accepting or Rejecting Drops
Override `acceptsDrop(event)` to inspect incoming transfer types:

```javascript
acceptsDrop (event) {
    // Inspect event.dataTransfer.types
    return event.dataTransfer.types.includes("text/plain");
}
```

### 3. MIME Type Method Dispatch (`dropMethodForMimeType`)

| MIME Type | Convention Handler Method Name |
|---|---|
| `text/plain` | `onBrowserDropTextPlain(dataChunk)` |
| `text/html` | `onBrowserDropTextHtml(dataChunk)` |
| `image/png` | `onBrowserDropImagePng(dataChunk)` |
| `image/jpeg` | `onBrowserDropImageJpeg(dataChunk)` |
| `application/json` | `onBrowserDropApplicationJson(dataChunk)` |

### 4. Data Chunk Object (`SvDataUrl`)
Dropped payloads are wrapped in an `SvDataUrl` instance (`dataChunk`):
- `dataChunk.mimeType()`: Returns the MIME type string.
- `dataChunk.decodedData()`: Returns the decoded string or JSON content.
- `dataChunk.setDataUrlString(url)`: Contains the data URL string for dropped files.

### 5. Visual Drag Highlighting
Override styling hooks for hover feedback:
```javascript
dragHighlight () {
    this.setBorder("2px dashed cornflowerblue");
}

dragUnhighlight () {
    this.setBorder("none");
}
```

---

## Drag Sources API

To make a view draggable:

```javascript
init () {
    super.init();
    this.setIsRegisteredForBrowserDrag(true);
    return this;
}

// Populate transfer payload on drag start
onBrowserDragStart (event) {
    const dt = event.dataTransfer;
    dt.setData("text/plain", this.node().title());
    dt.setData("application/json", JSON.stringify(this.node().asJson()));
}
```

---

## Related Guides

- [Gesture Recognizers](../Gesture%20Recognizers/index.html): Touch and mouse gesture state machines.
- [Keyboard and Focus](../Keyboard%20and%20Focus/index.html): Modifier-aware key routing.

# Tile Views

Tile subclasses for presenting individual subnodes in specialized ways.

## Context

STRVCT's view architecture has two distinct roles: **tile container views** arrange the array of subnodes spatially (see [Tile Container Views](../Tile%20Container%20Views/index.html)), while **tile views** present an individual subnode -- its content, appearance, and interaction affordances.

Nodes select their tile class via `setNodeTileClass()`. All tiles inherit the standard tile infrastructure -- selection, theming, gestures, accessibility -- and add domain-specific rendering.

## Existing Tiles

### Base Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvTile` | -- | Base navigable tile. Supports selection, styling, slide-to-delete, reordering, drag, and close/delete buttons. |
| `SvTitledTile` | `SvTile` | Adds title, subtitle, note, note icon, and thumbnail subviews. |
| `SvHeaderTile` | `SvTitledTile` | Section header with selectable state and specific theme class. |
| `SvTextNodeTile` | `SvTile` | Displays and edits text nodes with a `SvTextView`. |
| `SvBreadCrumbsTile` | `SvTile` | Breadcrumb path navigation. |

### Field Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvFieldTile` | `SvTile` | Key/value field with label and value areas. Syncs ARIA from slot metadata. |
| `SvStringFieldTile` | `SvFieldTile` | Text input field. |
| `SvPasswordFieldTile` | `SvStringFieldTile` | Masked password input. |
| `SvBooleanFieldTile` | `SvFieldTile` | Checkbox toggle. |
| `SvActionFieldTile` | `SvTile` | Clickable button with action handling. |
| `SvTextAreaFieldTile` | `SvFieldTile` | Multiline text input with speech-to-text support. |
| `SvPointerFieldTile` | `SvTitledTile` | Navigation link with arrow indicator. |

### Media Input Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvImageWellFieldTile` | `SvFieldTile` | Drag-and-drop image input. |
| `SvVideoWellFieldTile` | `SvFieldTile` | Drag-and-drop video input. |
| `SvSceneViewWellFieldTile` | `SvFieldTile` | 3D model input (model/* MIME types). |

### Option Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvOptionsNodeTile` | `SvTitledTile` | Container for selectable options (`role="listbox"`). |
| `SvOptionNodeTile` | `SvTitledTile` | Individual selectable option (`role="option"`). |

### Chat Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvChatMessageTile` | `SvTextAreaFieldTile` | Chat bubble with HTML support, accessibility, and speech capability. |
| `SvChatInputTile` | `SvChatMessageTile` | Multiline chat input. |

### Resource Tiles

| Class | Extends | Purpose |
|---|---|---|
| `SvImageTile` | `SvTitledTile` | Image display with caption derived from node title. |
| `SvFontTile` | `SvTitledTile` | Font preview showing family, style, weight, and stretch. |

## Proposed Tiles

### Rich Text Tile

A tile whose value area supports formatted text (bold, italic, lists, headings) rather than plain text. Useful for notes, journal entries, descriptions, and any long-form content. Would need to bridge the node's value to a contentEditable region with structured markup.

### Media Tile

A standalone playback tile that embeds audio or video transport controls (play/pause, scrubbing, volume). The node would reference a sound or video resource; the tile provides the playback UI. Builds on the existing `SvWaSound` infrastructure for audio and could extend to video via standard HTML5 media elements.

The existing `SvVideoWellFieldTile` and `SvSceneViewWellFieldTile` handle drag-and-drop *input* of media files. This proposed tile is the complement: *playback* of media already associated with a node.

### Meter / Progress Tile

A tile that renders a numeric slot value as a visual meter, progress bar, or gauge. The slot's `minimum` and `maximum` annotations define the range -- the same annotations that already drive `aria-valuemin` / `aria-valuemax`. Useful for hit points, loading progress, skill levels, and any bounded numeric value.

### Badge / Status Tile

A compact tile optimized for small status indicators -- an icon plus a short label, possibly color-coded by state. Useful for tags, status markers, notification counts, and online/offline indicators. Would pair well with the wrapping grid container for dense displays.

### Embed Tile

A tile that renders an iframe or sandboxed external content. The node provides a URL; the tile handles sizing, loading states, and security boundaries. Useful for embedding external widgets, previews, or third-party content within the node hierarchy.

## Design Considerations

- **Slot-driven rendering**: New tiles should derive their behavior from slot metadata wherever possible (type, annotations, description), keeping domain objects declarative rather than view-aware.
- **Tile class selection**: Nodes opt in via `setNodeTileClass(SvImageTile)` etc. The framework's existing view-discovery mechanism handles the rest.
- **Accessibility**: Each new tile needs appropriate ARIA roles and state, following the `SvNodeView_accessibility` pattern. For example, a meter tile would use `role="meter"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
- **Composability with containers**: New tile types should work in any container -- a media tile in a list, an image tile in a wrapping grid, a badge tile in a spatial map.

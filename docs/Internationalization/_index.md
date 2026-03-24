# Internationalization

AI-powered translation of UI text with persistent caching, batched requests, and smart content filtering.

## Overview

STRVCT includes a built-in internationalization (i18n) system that translates UI strings on the fly using AI language models. Rather than maintaining static translation files for each language, the framework sends batched translation requests to an AI service and caches the results persistently in IndexedDB. This means any application built on STRVCT can support new languages without manual translation effort.

This approach is uniquely enabled by the naked objects pattern. Because the framework generates the UI from model slot annotations, there is a single point — the model-to-view boundary — where all display text passes through. Translation is injected at that boundary, making every model class translatable by default with no per-component wiring. In a bespoke-view framework, every component would need explicit `t()` calls and separate translation key files.

The system is designed around three principles:

- **Non-blocking** — translations happen asynchronously. The UI displays English text immediately and swaps in the translated version when it arrives, with no visible delay on subsequent visits thanks to persistent caching.
- **Smart filtering** — numbers, currency amounts, codes, URLs, emails, and other non-linguistic content are detected and skipped automatically, avoiding unnecessary API calls.
- **Batched and deduplicated** — individual translation requests are debounced, grouped by context, and sent as a single batch to minimize API usage.

## Architecture

The i18n system consists of five classes that form a pipeline from UI request to cached translation:

| Class | Role |
|-------|------|
| `SvI18n` | Singleton coordinator. Manages language state, delegates to cache and service, deduplicates promises. |
| `SvI18nCache` | Persistent translation store. Holds `SvI18nEntry` subnodes indexed by a composite cache key. |
| `SvI18nEntry` | Individual translation record with source text, translated text, language, context, and a source hash for staleness detection. |
| `SvI18nService` | Batched request service. Debounces incoming requests, groups them by context, sends them to an AI chat model, and stores results. |
| `SvTranslationFilter` | Pattern-based filter that determines whether a string contains translatable linguistic content. |

Supporting integration points:

| Class | Role |
|-------|------|
| `SvTranslatableNode` | Base class for nodes that need translated slot values. Sits in the hierarchy between `TitledNode` and `InspectableNode`. |
| `Slot` | Supports a `translationContext` annotation for per-slot context. |
| `SvFieldTile` | Calls `translatedValueOfSlotNamed()` to display translated keys and placeholder text. |
| `BreadCrumbsTile` | Observes `"svI18nLanguageChanged"` to rebuild breadcrumbs in the new language. |
| `SvServices` | Hosts the `SvI18n` singleton as a persisted subnode field. |

All i18n source files live in `source/library/i18n/`.

## Translation Flow

When a view needs to display a slot value:

1. **Request** — `SvFieldTile` calls `node.translatedValueOfSlotNamed("slotName")` on the model node.

2. **Filter** — `SvTranslatableNode` checks whether translation is needed:
   - Is translation enabled and the language not English?
   - Is the text short enough (20 words or fewer for slot values)?
   - Does `SvTranslationFilter` confirm the string contains translatable text (not a number, URL, email, etc.)?

3. **Cache lookup** — `SvI18n.cachedTranslate(text, context)` does an O(1) lookup in the in-memory index. The cache key is `"text/language/context"`. If the entry exists and is not stale (source hash matches), the translation is returned immediately.

4. **Cache miss** — On a miss, `SvI18n.asyncTranslate(text, context)` returns a Promise and:
   - Deduplicates: if the same key is already pending, the new caller's promise is chained to the existing request.
   - Enqueues the text in `SvI18nService` for batched submission.
   - Returns the English text as an immediate fallback.

5. **Batch** — `SvI18nService` accumulates requests for 200ms (configurable), then groups them by context and sends one AI request per group. Each request includes a JSON template mapping English strings to empty values, asking the model to fill in translations.

6. **Response** — The AI returns a JSON object mapping English to translated strings. The service stores each result in `SvI18nCache` and resolves all pending promises for those keys.

7. **View update** — The resolved promise calls `didUpdateNode()` on the requesting node, which triggers a view sync. The view calls `translatedValueOfSlotNamed()` again, this time getting a cache hit, and displays the translated text.

## SvTranslationFilter

The filter uses regex patterns to skip content that would not benefit from translation:

| Filter | Examples |
|--------|----------|
| Numeric and currency | `42`, `$9.99`, `€100`, `$70.16 USD`, `100%` |
| Alphanumeric codes | `23A`, `#7`, `3d6`, `+5`, `10/20` |
| Ordinals | `1st`, `2nd`, `3rd` |
| Labeled numeric | `HP: 45`, `AC: 18`, `XP: 1,200` |
| Email addresses | `user@example.com` |
| Phone numbers | `+1 (555) 123-4567` |
| URLs | `https://example.com`, `www.example.com/path` |
| IP addresses | `192.168.1.1`, `::1`, `2001:db8::1` |

The main entry point is `SvTranslationFilter.shared().shouldTranslate(value)`, which returns `false` for any of the above patterns.

## Caching

### Persistent Storage

`SvI18nCache` stores `SvI18nEntry` instances as subnodes, persisted to IndexedDB via the standard STRVCT object pool. An in-memory `Map` index (cache key to entry) provides O(1) lookups and is rebuilt from subnodes when the cache loads from storage.

### Staleness Detection

Each entry stores a hash of its source text. When a cached translation is looked up, the current source text is hashed and compared. If the English text has changed since the translation was cached, the entry is treated as stale and a new translation is requested.

### Seed Import and Export

The cache supports bulk operations for pre-loading translations:

```javascript
// Import translations from a seed file
cache.loadSeedJson(seedJson);

// Export all translations for a language
const json = cache.exportJson("es");
```

The export format groups entries by context:

```javascript
{
    meta: { language: "es", exported: 1698765432000, entryCount: 150 },
    entries: {
        "ui-label": { "Hit Points": "Puntos de Golpe", ... },
        "game-mechanic": { "Saving Throw": "Tirada de Salvacion", ... }
    }
}
```

## Making Nodes Translatable

Nodes opt into translation by extending `SvTranslatableNode` (which sits between `TitledNode` and `InspectableNode` in the hierarchy). This provides three methods:

- **`translatedValueOfSlotNamed(slotName)`** — Returns the translated value of a slot, falling back to English while a translation is pending.
- **`translatedValuePlaceholderOfSlotNamed(slotName)`** — Translates a slot's placeholder text annotation.
- **`translationContext()`** — Override to provide a default context for the node's slots (default: `"ui-label"`).

Individual slots can declare their own context via the `translationContext` annotation:

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("hitPoints", 0);
        slot.setSlotType("Number");
        slot.setTranslationContext("game-mechanic");
    }
}
```

The context string is sent to the AI with the translation request, helping it choose appropriate terminology (e.g., "game-mechanic" vs. "ui-label" vs. "dnd-character-sheet").

## Configuration

### Language

```javascript
// Set the target language (ISO 639-1 code)
SvI18n.shared().setCurrentLanguage("es");

// Check if translation is active
SvI18n.shared().needsTranslation(); // true when enabled and language != "en"

// Enable or disable the system
SvI18n.shared().setIsEnabled(true);
```

Setting the language posts an `"svI18nLanguageChanged"` notification that views can observe to trigger a full UI refresh.

### Service Tuning

`SvI18nService` has configurable parameters:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `debounceMs` | 200 | Milliseconds to wait before sending a batch |
| `maxBatchSize` | 50 | Maximum strings per API request |
| `maxConcurrent` | 3 | Maximum simultaneous API requests |
| `chatModel` | (lazy) | AI model to use; defaults to `SvServices.shared().defaultChatModel()` |

### Access

The `SvI18n` singleton is hosted on `SvServices`:

```javascript
const i18n = SvServices.shared().i18n();
```

## View Integration

### Field Tiles

`SvFieldTile` calls `node.translatedValueOfSlotNamed()` in its `visibleKey()` method, so all field tiles automatically display translated labels when the i18n system is active. Placeholder text on input fields is translated via `translatedValuePlaceholderOfSlotNamed()`.

### Breadcrumbs

`BreadCrumbsTile` observes the `"svI18nLanguageChanged"` notification. When the language changes, it clears its cached path and rebuilds all breadcrumb segments with translated titles.

### Custom Views

Any view can observe language changes and refresh:

```javascript
init () {
    super.init();
    SvNotificationCenter.shared().newObservation()
        .setName("svI18nLanguageChanged")
        .setObserver(this)
        .startWatching();
    return this;
}

svI18nLanguageChanged () {
    this.scheduleSyncFromNode();
}
```

## Translation Safety

Translation must never corrupt model data. The system translates values at the view boundary for display only — translated strings must never flow back into the model, serialization, or game state.

**Serialization boundary** — All JSON serialization paths (`asJson()`, `serializeToJson()`, `getClientState()`) read raw slot values, not translated display values. AI services, game mechanics, and network sync never see translations.

**Editable keys** — When `keyIsEditable()` is true on a field tile, `syncToNode()` writes the DOM value back to the model. If translation is active, the view must write back the original untranslated key, not the translated display text. This requires comparing the current DOM value against the known translated value to distinguish user edits from displayed translations.

**Planned: `shouldTranslate` slot annotation** — An explicit `shouldTranslate(false)` on data-bearing slots (e.g., `jsonId`, `email`) would short-circuit translation checks before any string analysis. When creating option nodes for selection UI, this annotation should propagate from the parent slot to prevent translating option labels that serve as identifiers (e.g., a language picker must always show language names in their native script).

## Framework / App Boundary

The i18n system is split between the STRVCT framework and the application layer:

**Framework responsibility** — caching, persistence, view hooks, batched AI requests, filtering, and notification dispatch. The framework is domain-agnostic — it has no knowledge of what the application's content is about.

**App responsibility** — configuration of which AI model to use, what system prompt to send (providing domain-specific context like "use official D&D terminology"), language picker UI, seed file management, and any domain-specific translation overrides.

Any STRVCT-based application can reuse the i18n system by providing its own system prompt and model choice via `SvI18nService` configuration.

## Layout Considerations

Different languages have different text metrics that affect UI layout:

- **Text expansion** — German and French text is typically 20-40% longer than English. Japanese and Korean can be shorter. Avoid fixed-width containers for translated text.
- **CJK line breaking** — Japanese and Korean text can break between any character (no word spaces). Browsers handle this natively.
- **Right-to-left (RTL)** — Arabic and Hebrew require CSS `direction` and logical properties (`margin-inline-start` vs `margin-left`). STRVCT's flexbox-based layout should adapt, but RTL is not yet supported.
- **Number and date formatting** — Use `Intl.NumberFormat` and `Intl.DateTimeFormat` for locale-aware formatting. These are built into the browser and do not require AI translation.

## Design Notes

**Promise deduplication** — If multiple views request the same translation simultaneously (common during initial render), only one API request is made. All callers' promises are chained to the same pending entry.

**Lazy model resolution** — `SvI18nService` lazily loads the chat model from `SvServices` on first use, avoiding circular dependency issues during framework initialization.

**Word limit** — Strings longer than 20 words are skipped by default, on the assumption that long text is content rather than UI labels. Placeholder text is exempt from this limit.

**Context grouping** — Batches are grouped by translation context before sending, so the AI model receives semantically related strings together, improving translation consistency.

## Planned Enhancements

### Two-Tier Storage

The current implementation stores all translations in the local `SvI18nCache` (IndexedDB). A planned two-tier architecture would add shared cloud storage:

- **Tier 1: Short strings** — UI labels stored in a shared cloud pool per language, fetched in a single request on cold start. New translations are promoted from local cache to the shared pool so all users benefit.
- **Tier 2: Long content** — Strings over 64 characters stored in `SvBlobPool`, keyed by SHA-256 hash of the source text. Content-addressable storage ensures changed source text automatically invalidates old translations.

This replaces the seed file workflow with an organic, self-growing translation store.

### Translation Persistence Annotation

A `translationPersistence` slot annotation would control where translations are stored:

- **`"local"`** — Cached on-device only. For transient content that is unlikely to repeat.
- **`"cloud"`** — Promoted to the shared pool. For standard UI labels and reusable content that many users in the same language will see.

### Content Page Translation

An `<auto-translate>` tag for content pages would mark sections as safe to translate while leaving surrounding content (license text, code blocks, URLs) untouched. Each tagged section would be translated as a unit to preserve paragraph flow and tone.

### View-Layer String Translation

Some UI text is hardcoded in view classes rather than flowing through the node slot system (e.g., tooltip text, placeholder text set via CSS `data-placeholder`). These strings need a separate translation path, potentially via a direct `SvI18n.translate()` call in the view.

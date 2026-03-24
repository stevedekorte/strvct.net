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

The i18n system consists of six classes that form a pipeline from UI request to cached translation:

| Class | Role |
|-------|------|
| `SvI18n` | Singleton coordinator. Manages language state, delegates to cache, store, and service, deduplicates promises. |
| `SvI18nStore` | Dedicated IndexedDB store with an in-memory seed map. Two-layer lookup: synchronous seed map for shared UI strings, async IndexedDB for user-specific translations. |
| `SvI18nCache` | Legacy translation cache. Holds `SvI18nEntry` subnodes indexed by a composite cache key. |
| `SvI18nEntry` | Individual translation record with source text, translated text, language, context, and a source hash for staleness detection. |
| `SvI18nService` | Batched request service. Debounces incoming requests, groups them by context, sends them to an AI chat model, and stores results. |
| `SvTranslationFilter` | Pattern-based filter that determines whether a string contains translatable linguistic content. |

Supporting integration points:

| Class | Role |
|-------|------|
| `SvTranslatableNode` | Base class for nodes that need translated slot values. Sits in the hierarchy between `TitledNode` and `InspectableNode`. |
| `Slot` | Supports `translationContext` (per-slot context) and `shouldTranslate` (disable translation) annotations. |
| `SvFieldTile` | Calls `translatedValueOfSlotNamed()` to display translated keys and placeholder text. Skips translation for editable keys. |
| `SvOptionNode` | Respects the parent slot's `shouldTranslate` annotation for option labels. |
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

3. **Seed map lookup** — `SvI18n.cachedTranslate(text, context)` first checks the `SvI18nStore` in-memory seed map for a synchronous hit. The seed map is loaded from a shared pool file at startup and covers common UI strings.

4. **Legacy cache lookup** — On seed miss, falls back to `SvI18nCache` for an O(1) in-memory lookup. The cache key is `"text/language/context"`. If the entry exists and is not stale (source hash matches), the translation is returned immediately.

5. **IndexedDB lookup** — On cache miss, `SvTranslatableNode` checks `SvI18nStore.asyncLookup()` for a translation in IndexedDB. If found, it is promoted to the legacy cache for synchronous access on subsequent renders, and the view is updated.

6. **AI translation** — If not found in any cache layer, `SvI18n.asyncTranslate(text, context)` returns a Promise and:
   - Deduplicates: if the same key is already pending, the new caller's promise is chained to the existing request.
   - Enqueues the text in `SvI18nService` for batched submission.
   - Returns the English text as an immediate fallback.

7. **Batch** — `SvI18nService` accumulates requests for 200ms (configurable), then groups them by context and sends one AI request per group. Each request includes a JSON template mapping English strings to empty values, asking the model to fill in translations.

8. **Response** — The AI returns a JSON object mapping English to translated strings. The service stores each result in `SvI18nCache`, persists it to `SvI18nStore` (IndexedDB) for future sessions, and resolves all pending promises for those keys.

9. **View update** — The resolved promise calls `didUpdateNode()` on the requesting node, which triggers a view sync. The view calls `translatedValueOfSlotNamed()` again, this time getting a cache hit, and displays the translated text.

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

Translation caching uses three layers, each optimized for different access patterns:

### Layer 1: Seed Map (Synchronous)

`SvI18nStore` maintains an in-memory `Map` of shared translations loaded from a pool file at startup. Keys are `"{language}:{sourceText}"`. This layer is checked first by `SvI18n.cachedTranslate()` and provides synchronous O(1) lookups for common UI strings, ensuring no flash of untranslated text on initial render.

```javascript
// Load shared translations from a pool file
SvI18nStore.shared().loadSeedMap(poolJson, "es");

// Synchronous lookup
SvI18nStore.shared().seedLookup("Hit Points", "es"); // → "Puntos de Golpe"
```

### Layer 2: IndexedDB Store (Asynchronous)

`SvI18nStore` also wraps a dedicated IndexedDB database (`SvIndexedDbFolder`) for user-specific and overflow translations. This is separate from the main object pool to avoid loading all translations into memory at startup. When an AI translation arrives, it is persisted here for future sessions.

```javascript
// Async lookup (called on seed miss by SvTranslatableNode)
const translation = await SvI18nStore.shared().asyncLookup("some text", "es");

// Async store (called automatically when AI translations arrive)
await SvI18nStore.shared().asyncStore("some text", "es", "algún texto");
```

### Layer 3: Legacy Cache

`SvI18nCache` stores `SvI18nEntry` instances as subnodes, persisted to IndexedDB via the standard STRVCT object pool. An in-memory `Map` index (cache key to entry) provides O(1) lookups and is rebuilt from subnodes when the cache loads from storage. When a translation is found in the IndexedDB store (Layer 2), it is promoted to the legacy cache for synchronous access on subsequent renders.

### Staleness Detection

Each `SvI18nEntry` stores a hash of its source text. When a cached translation is looked up, the current source text is hashed and compared. If the English text has changed since the translation was cached, the entry is treated as stale and a new translation is requested.

### Seed Import and Export

The legacy cache supports bulk operations for pre-loading translations:

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

**Editable keys** — When `keyIsEditable()` is true on a field tile, `visibleKey()` returns the raw slot value without translation. This prevents translated text from being written back to the model when the user edits the key.

**`shouldTranslate` slot annotation** — Setting `slot.setShouldTranslate(false)` disables translation for a slot's value. `SvTranslatableNode.translatedValueOfSlotNamed()` checks this annotation and returns the raw value when false. `SvOptionNode` also checks the parent slot's `shouldTranslate` annotation, so option labels inherit the setting — for example, a language picker's options stay in their native script rather than being translated.

```javascript
{
    const slot = this.newSlot("language", "en");
    slot.setShouldTranslate(false); // "Español", "Français" stay untranslated
    slot.setValidItems([
        { label: "English", value: "en" },
        { label: "Español", value: "es" }
    ]);
}
```

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

## Comparison to Other Frameworks

Most web frameworks treat i18n as an opt-in layer that developers wire into each component. STRVCT takes a fundamentally different approach by making translation an emergent property of the naked objects pattern.

### Traditional Approach (React-intl, vue-i18n, next-intl, Angular i18n)

- Developers maintain **separate JSON translation files** for each language, with developer-defined keys like `"character.hitPoints"`.
- Every visible string must be **explicitly wrapped** with a `t()` call or `<FormattedMessage>` component.
- All translations are loaded at startup or per-route — lookup is always synchronous.
- Adding a new language requires producing a complete translation file and ensuring every string in every component is wrapped.
- The localization cost grows linearly with the number of components and strings.

### STRVCT's Approach

- **No translation files to maintain.** Translations are generated by AI and cached persistently in IndexedDB.
- **No per-component wiring.** Because the naked objects pattern means all UI text flows from model slots through a single framework-controlled rendering pipeline, translation is injected at the model-to-view boundary automatically. New model classes are translatable by default.
- **Adding a new language is a configuration change**, not a translation project.
- **Progressive rendering.** English text displays immediately; translated text swaps in asynchronously when it arrives from cache or AI. No blocking on translation load.
- **Domain-aware context.** Slot annotations provide translation context (e.g., "game mechanic" vs. "ui label") that travels with the model, improving translation quality without developer effort.

### Tradeoffs

| | Traditional i18n | STRVCT i18n |
|---|---|---|
| Translation source | Human translators or external services | AI-generated with persistent caching |
| Developer effort per string | Wrap with `t()`, add key to JSON file | None (automatic) |
| New language cost | Full translation file + QA | Configuration change |
| Determinism | Same input always produces same output | Cached after first translation |
| Professional quality | Human translators catch cultural nuance | AI may miss subtle distinctions |
| Runtime cost | None (static lookup) | Async on first encounter, then cached |
| Tooling maturity | Extraction tools, TMS platforms, CI checks | Slot annotations, seed generation |

Traditional i18n excels when professional translation quality is critical and a mature localization workflow is already in place. STRVCT's approach excels when minimizing developer effort is the priority and the application needs to support new languages rapidly without a dedicated localization team.

## Planned Enhancements

### Shared Cloud Pool

The local caching layers (seed map, IndexedDB, legacy cache) are implemented. The next step is a shared cloud pool so all users benefit from translations:

- A single `pool.json` per language hosted in cloud storage (e.g., Firebase Storage at `public/translations/{languageCode}/pool.json`).
- Admin-write, everyone-read access rules.
- On cold start, clients check the pool's metadata (ETag/timestamp) against a locally cached version to avoid unnecessary downloads.
- A `just translate` command extracts translatable strings from the codebase, translates them, and writes the pool file.
- A promotion Cloud Function moves validated translations from local caches to the shared pool.

### Translation Persistence Annotation

A `translationPersistence` slot annotation would control where translations are stored:

- **`"local"`** — Cached on-device only. For transient content that is unlikely to repeat.
- **`"cloud"`** — Promoted to the shared pool. For standard UI labels and reusable content that many users in the same language will see.

### Content Page Translation

An `<auto-translate>` tag for content pages would mark sections as safe to translate while leaving surrounding content (license text, code blocks, URLs) untouched. Each tagged section would be translated as a unit to preserve paragraph flow and tone.

### View-Layer String Translation

Some UI text is hardcoded in view classes rather than flowing through the node slot system (e.g., tooltip text, placeholder text set via CSS `data-placeholder`). These strings need a separate translation path, potentially via a direct `SvI18n.translate()` call in the view.

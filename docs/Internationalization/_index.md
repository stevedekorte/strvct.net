# Internationalization

AI-powered translation of UI text with persistent caching, batched requests, and smart content filtering.

## Overview

STRVCT includes a built-in internationalization (i18n) system that translates UI strings on the fly using AI language models. Rather than maintaining static translation files for each language, the framework sends batched translation requests to an AI service and caches the results persistently in IndexedDB. This means any application built on STRVCT can support new languages without manual translation effort.

This approach is uniquely enabled by the naked objects pattern. Because the framework generates the UI from model slot annotations, there is a single point — the model-to-view boundary — where all display text passes through. Translation is injected at that boundary, making every model class translatable by default with no per-component wiring. In a bespoke-view framework, every component would need explicit `t()` calls and separate translation key files.

The system is designed around three principles:

- **Non-blocking** — translations happen asynchronously. The UI displays English text immediately and swaps in the translated version when it arrives, with no visible delay on subsequent visits thanks to persistent caching.
- **Smart filtering** — numbers, currency amounts, codes, URLs, emails, and other non-linguistic content are detected and skipped automatically, avoiding unnecessary API calls.
- **Batched and deduplicated** — individual translation requests are debounced, grouped by context, and sent as a single batch to minimize API usage.

## Implementation Overview

Translation storage is fully decoupled from the STRVCT ObjectPool. All translations live in a dedicated IndexedDB database (`i18nTranslations`).

**SvI18n** (singleton coordinator)
- Owns the dedicated IndexedDB, shared between cache and store
- One active SvI18nCache + one active SvI18nStore for the current target language
- Inactive when language is English
- Reloads cache on language change
- Computed status getters (`queuedCount`, `completedCount`) for admin UI

**SvI18nCache** (eager, in-memory, for common UI text)
- Loads all entries for the current language from IndexedDB into a `Map` on language select
- Seed entries loaded from cloud seed file
- Runtime additions (e.g. short common phrases) also stored here
- High water mark = 3x seed entry count (FIFO eviction on timestamped entries only)
- Writes runtime additions back to IndexedDB
- Synchronous lookups
- Handles legacy format migration (plain strings from Phase 1)

**SvI18nStore** (async IndexedDB bridge)
- No in-memory state — purely an async read/write interface to IndexedDB
- Async lookups; results promoted to SvI18nCache by SvI18n
- Fire-and-forget persistence for new translations

**SvTranslatableNode** (per-node translation map)
- Each node maintains a lazy `translationMap` (string→string, FIFO capped at 10)
- Auto-clears when it detects the language has changed (no notification observers needed)
- Lives on the node (not the view) so translations survive view reallocation during UI navigation
- Provides tier-0 sync lookup before hitting the shared cache

NOTE: If accumulated node translation maps become a memory concern,
a GC sweep could be added: walk all views, collect their referenced nodes,
and clear translationMaps on all in-memory nodes not in that set.

**Shared value format in IndexedDB (serialized as JSON):**
- Seed entry: `{ t: "translation" }` (no timestamp = permanent, never evicted)
- Runtime entry: `{ t: "translation", ts: 1711382400000 }` (evictable by FIFO)

**Shared IndexedDB key format:** `"lang:sourceText"` (e.g. `"fr:Hit Points"`)

**Lookup order:**
1. Node's translationMap (sync) — per-node FIFO cache of recent lookups
2. SvI18nCache Map (sync) — all entries for current language
3. SvI18nStore IndexedDB (async) — promotes hit to cache + node map
4. Queue for AI translation — stores result in cache + store; node map updated on promise resolve

**Seed update flow:**
1. Check cloud seed version vs local version
2. If newer: clear ALL IndexedDB entries for that language (losing runtime additions)
3. Write new seed entries (no timestamps) to IndexedDB
4. Load into cache Map
5. Runtime additions rebuild organically

A new seed may imply context or setting changes, so stale runtime translations should not persist.

## Architecture

The i18n system consists of five classes that form a pipeline from UI request to cached translation:

| Class | Role |
|-------|------|
| `SvI18n` | Singleton coordinator. Owns the dedicated IndexedDB, manages language state, delegates to cache/store/service, deduplicates pending promises. Computed status getters for admin UI. |
| `SvI18nCache` | Eager in-memory cache. Loads all entries for the current language from IndexedDB into a `Map`. Handles seed entries and runtime additions with FIFO eviction. |
| `SvI18nStore` | Async IndexedDB bridge. Provides on-demand async lookups and fire-and-forget persistence. No in-memory state. |
| `SvI18nService` | Batched request service. Debounces incoming requests, groups them by context, sends them to an AI chat model, and stores results. |
| `SvTranslationFilter` | Pluggable filter with named functions in a Map. Determines whether a string contains translatable linguistic content. Applications can add domain-specific filters. |

Supporting integration points:

| Class | Role |
|-------|------|
| `SvTranslatableNode` | Base class for translatable nodes. Maintains a per-node `translationMap` for flicker-free re-renders. Sits between `TitledNode` and `InspectableNode`. |
| `Slot` | Supports `translationContext` (per-slot context) and `shouldTranslate` (disable translation) annotations. |
| `SvFieldTile` | Calls `translatedValueOfSlotNamed()` to display translated keys and placeholder text. Skips translation for editable keys. |
| `SvOptionNode` | Respects the parent slot's `shouldTranslate` annotation for option labels. |
| `BreadCrumbsTile` | Observes `"svI18nLanguageChanged"` to rebuild breadcrumbs in the new language. |
| `SvServices` | Hosts the `SvI18n` singleton as a subnode field. |

All i18n source files live in `source/library/i18n/`.

## Translation Flow

When a view needs to display a slot value:

1. **Request** — `SvFieldTile` calls `node.translatedValueOfSlotNamed("slotName")` on the model node.

2. **Filter** — `SvTranslatableNode` checks whether translation is needed:
   - Is translation enabled and the language not English?
   - Is the text short enough (20 words or fewer for slot values)?
   - Does `SvTranslationFilter` confirm the string contains translatable text (not a number, URL, email, etc.)?

3. **Node map lookup** — The node's `translationMap` is checked first (sync, O(1)). This is a string→string Map capped at 10 entries with FIFO eviction. It auto-clears if the language has changed since last access. On hit, returns immediately with no flicker.

4. **Cache lookup** — `SvI18n.cachedTranslate(text, context)` checks the cache Map. On hit, the result is stored in the node's translationMap and returned.

5. **Async lookup** — On sync miss, `SvI18n.asyncTranslate(text, context)` is called. This returns a Promise and checks the store's IndexedDB layer. If found, the value is promoted to the cache, stored in the node's translationMap, and the promise resolves.

6. **AI translation** — If not found in any layer, the text is enqueued in `SvI18nService`:
   - Deduplicates: if the same key is already pending, the new caller's promise chains onto the existing request.
   - Returns the English text as an immediate fallback.

7. **Batch** — `SvI18nService` accumulates requests for 200ms (configurable), then groups them by context and sends one AI request per group. Each request includes a JSON template mapping English strings to empty values, asking the model to fill in translations.

8. **Response** — The AI returns a JSON object mapping English to translated strings. The service stores each result in both the cache (for sync access) and the store (IndexedDB persistence), then resolves all pending promises for those keys.

9. **View update** — The resolved promise stores the result in the node's translationMap and calls `didUpdateNode()`, which triggers a view sync. The view calls `translatedValueOfSlotNamed()` again, this time getting a sync hit from the node map, and displays the translated text with no flicker.

## SvTranslationFilter

The filter uses a pluggable Map of named filter functions. Each function takes a trimmed string and returns `true` if it should NOT be translated. Names prevent duplicate registration.

Built-in filters:

| Filter | Examples |
|--------|----------|
| No alphabetical characters | `17 (+3)`, `+5 / +3 / +2`, `---` |
| Numeric and currency | `42`, `$9.99`, `€100`, `$70.16 USD`, `100%` |
| Alphanumeric codes | `23A`, `#7`, `3d6`, `+5`, `10/20` |
| Ordinals | `1st`, `2nd`, `3rd` |
| Labeled numeric | `HP: 45`, `AC: 18`, `XP: 1,200` |
| Email addresses | `user@example.com` |
| Phone numbers | `+1 (555) 123-4567` |
| URLs | `https://example.com`, `www.example.com/path` |
| IP addresses | `192.168.1.1`, `::1`, `2001:db8::1` |

Applications can add domain-specific filters:

```javascript
SvTranslationFilter.shared().addFilter("diceNotation", s => /^\d*d\d+(\s*[+-]\s*\d+)?$/i.test(s));
```

The main entry point is `SvTranslationFilter.shared().shouldTranslate(value)`, which returns `false` for any matching filter.

## Caching

Translation caching uses two tiers backed by a single dedicated IndexedDB, separate from the main STRVCT ObjectPool.

### Tier 0: Node Translation Map (Per-Node, Synchronous)

Each `SvTranslatableNode` maintains a lazy `translationMap` — a plain `Map` from English source text to translated text. This provides the fastest possible sync lookup and prevents flicker on view re-render.

Key properties:
- **FIFO capped at 10** — enough for title, subtitle, and a handful of labels per node
- **Lazy allocation** — the Map is only created when the first translation is stored (English-only users pay zero cost)
- **Auto-clears on language change** — tracks the language it was populated for and clears itself if the language differs on next access (no notification observers needed)
- **Lives on the node, not the view** — survives view reallocation during UI navigation (clicking between tiles in a TilesView)

### Tier 1: SvI18nCache (Eager, Synchronous)

The cache loads all entries for the current language from IndexedDB into a `Map` when the language is set. This provides O(1) synchronous lookups for the majority of UI strings, ensuring no flash of untranslated text.

Entries come from two sources:
- **Seed entries** — loaded from a pre-generated JSON file. These have no timestamp and are permanent (never evicted).
- **Runtime additions** — short common phrases that accumulate during use. These have a timestamp and are evictable by FIFO.

The high water mark for eviction is 3x the seed entry count (minimum 100). When the total entry count exceeds this, the oldest timestamped entries are evicted from the Map (they remain in IndexedDB for the store to access).

```javascript
// Synchronous lookup (called by SvI18n.cachedTranslate)
cache.lookup("Hit Points", "es"); // → "Puntos de Golpe" or null

// Store a runtime addition
cache.store("New Phrase", "es", "Nueva Frase"); // persists to IndexedDB too
```

### Tier 2: SvI18nStore (Async, IndexedDB)

The store is a thin async bridge to IndexedDB for translations not in the eager cache. It has no in-memory state — lookups go directly to IndexedDB, and results are promoted to the cache by SvI18n for future sync access.

```javascript
// Async lookup (IndexedDB only)
const translation = await store.asyncLookup("some text", "es");

// Fire-and-forget persist to IndexedDB
store.storeSync("some text", "es", "algún texto");
```

### Seed Files

Seed files provide instant translations on cold start. The format groups entries by context:

```javascript
{
    meta: { language: "es", entryCount: 150 },
    entries: {
        "ui-label": { "Hit Points": "Puntos de Golpe", ... },
        "game-mechanic": { "Saving Throw": "Tirada de Salvacion", ... }
    }
}
```

When a seed file is loaded, its entries are written to the cache Map (for sync access) and to IndexedDB (for persistence). Seed entries have no timestamp, making them permanent — they survive eviction.

When a new seed version is detected, all entries for that language are wiped from IndexedDB and replaced with the new seed. Runtime additions are lost and rebuild organically through use.

### Seed Generation

Seed files are generated through a two-phase process accessible via the admin UI (Services > Internationalization, in debug mode):

**Phase 1 — Introspection (Init Seed button)**
1. Clears the cache for the current language
2. Walks all `SvNode` subclass prototypes via STRVCT introspection
3. For each slot with `shouldTranslate() === true`, collects: labels, placeholder text, valid value labels, and string defaults
4. Filters collected strings through `SvTranslationFilter`
5. Queues all collected strings through the normal translation pipeline (batched AI via SvI18nService)

**Phase 2 — Runtime Accumulation**
- Browse the application UI to trigger translations of dynamic strings not discoverable via introspection (computed titles, subtitles, action names, etc.)
- The admin UI shows live queued/completed counts to track progress

**Phase 3 — Store (Store Current Seed button)**
1. Exports all cache entries for the current language as a seed JSON file
2. Strips all timestamps (treating everything as permanent seed entries)
3. Uploads to Firebase Storage, replacing the existing seed file for that language

**IMPORTANT:** Seed generation must be done in production to save to the correct cloud storage location. Running in a dev environment would save to the dev project's storage, not the production seed files that users download.

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

The context string is sent to the AI with the translation request, helping it choose appropriate terminology (e.g., "game mechanic" vs. "ui label" vs. "dnd-character-sheet").

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

Setting the language posts an `"svI18nLanguageChanged"` notification that views can observe to trigger a full UI refresh. Internally, the cache reloads from IndexedDB for the new language. Node translation maps auto-clear lazily on next access when they detect the language has changed.

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
    slot.setShouldTranslate(false); // "Espanol", "Francais" stay untranslated
    slot.setValidItems([
        { label: "English", value: "en" },
        { label: "Espanol", value: "es" }
    ]);
}
```

## Framework / App Boundary

The i18n system is split between the STRVCT framework and the application layer:

**Framework responsibility** — caching, persistence, view hooks, batched AI requests, filtering, and notification dispatch. The framework is domain-agnostic — it has no knowledge of what the application's content is about.

**App responsibility** — configuration of which AI model to use, what system prompt to send (providing domain-specific context like "use official D&D terminology"), language picker UI, seed file management, domain-specific translation filters, and any domain-specific translation overrides.

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

**ObjectPool decoupling** — Translation storage is fully separate from the STRVCT ObjectPool. This avoids loading thousands of translation records into the main persistence layer, keeps translation I/O independent of model persistence, and simplifies the data format (plain `{ t, ts }` objects instead of full `SvStorableNode` instances).

**Sync loop safety** — Status display slots (`queuedCount`, `completedCount`) use computed getter overrides rather than `setSyncsToView`. This avoids sync loops: since translation lookups happen during view sync, any state mutation with `syncsToView` during that cycle would create infinite feedback. The computed getters read live state without mutation.

**Node vs view translation maps** — Translation maps live on the node, not the view, because views are ephemeral (reallocated when navigating between tiles in a TilesView) while nodes persist. A view-level map would be empty every time the user navigates back to a previously visited tile.

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
- **Optional seed files for instant cold starts.** A seed file per language can be pre-generated via introspection of class prototypes and runtime accumulation, then stored in cloud storage for all users to download.

### Tradeoffs

| | Traditional i18n | STRVCT i18n |
|---|---|---|
| Translation source | Human translators or external services | AI-generated with persistent caching |
| Developer effort per string | Wrap with `t()`, add key to JSON file | None (automatic) |
| New language cost | Full translation file + QA | Configuration change |
| Determinism | Same input always produces same output | Cached after first translation |
| Professional quality | Human translators catch cultural nuance | AI may miss subtle distinctions |
| Runtime cost | None (static lookup) | Async on first encounter, then cached |
| Tooling maturity | Extraction tools, TMS platforms, CI checks | Slot annotations, automatic seed generation from model |

Traditional i18n excels when professional translation quality is critical and a mature localization workflow is already in place. STRVCT's approach excels when minimizing developer effort is the priority and the application needs to support new languages rapidly without a dedicated localization team.

## Planned Enhancements

### Shared Cloud Seed

A shared cloud seed so all users benefit from translations:

- A single `seed.json` per language hosted in cloud storage (e.g., Firebase Storage at `public/translations/{languageCode}/seed.json`).
- Admin-write, everyone-read access rules.
- On cold start, clients check the seed's metadata (ETag/timestamp) against a locally cached version to avoid unnecessary downloads.
- A promotion Cloud Function moves validated translations from local caches to the shared seed.

### Translation Persistence Annotation

A `translationPersistence` slot annotation would control where translations are stored:

- **`"local"`** — Cached on-device only. For transient content that is unlikely to repeat.
- **`"cloud"`** — Promoted to the shared pool. For standard UI labels and reusable content that many users in the same language will see.

### Content Page Translation

An `<auto-translate>` tag for content pages would mark sections as safe to translate while leaving surrounding content (license text, code blocks, URLs) untouched. Each tagged section would be translated as a unit to preserve paragraph flow and tone.

### View-Layer String Translation

Some UI text is hardcoded in view classes rather than flowing through the node slot system (e.g., tooltip text, placeholder text set via CSS `data-placeholder`). These strings need a separate translation path, potentially via a direct `SvI18n.translate()` call in the view.

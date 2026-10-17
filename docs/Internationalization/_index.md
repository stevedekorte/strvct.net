# Internationalization

AI-powered translation of UI text with per-language IndexedDB persistence, batched requests, and content filtering.

## Overview

STRVCT includes a built-in internationalization (i18n) system that translates UI strings on the fly using AI language models. Rather than maintaining static, hand-edited translation files for each language, the framework sends batched translation requests to an AI service and caches the results persistently in per-language IndexedDB databases.

This approach is uniquely enabled by the naked objects pattern. Because the framework generates the UI from model slot annotations, there is a single point—the **model-to-view boundary**—where all display text passes through. Translation is injected at that boundary, making every model class translatable by default with no per-component wiring. In a bespoke-view framework, every component would need explicit `t()` calls and separate translation key files.

The system is designed around three core principles:
- **Non-blocking:** Translations happen asynchronously. The UI displays English text immediately and swaps in the translated version when it arrives, with no visible delay on subsequent visits thanks to persistent caching.
- **Smart filtering:** Numbers, currency amounts, codes, URLs, emails, and other non-linguistic content are detected and skipped automatically, avoiding unnecessary API calls.
- **Batched and deduplicated:** Individual translation requests are debounced, grouped by context, and sent as a single batch to minimize API usage.

<svg viewBox="0 0 820 460" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="ai18n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="220" y="20" width="380" height="50"/>
  <text x="235" y="40" class="b">Model Display Text</text>
  <text x="235" y="58" class="dim">title, subtitle, slot labels</text>

  <line class="flow" x1="410" y1="70" x2="410" y2="95" marker-end="url(#ai18n)"/>

  <rect class="fill" x="220" y="95" width="380" height="60"/>
  <text x="235" y="115" class="b">Model-to-View Boundary</text>
  <text x="235" y="133" class="dim">Single point where all UI text passes through;</text>
  <text x="235" y="148" class="dim">translation hook applies automatically</text>

  <line class="flow" x1="410" y1="155" x2="410" y2="180" marker-end="url(#ai18n)"/>

  <rect class="fill" x="220" y="180" width="380" height="60"/>
  <text x="235" y="200" class="b">SvTranslationFilter &amp; Tier 0 Map</text>
  <text x="235" y="218" class="dim">Filters non-linguistic content (URLs, numbers);</text>
  <text x="235" y="233" class="dim">checks per-node translationMap (sync O(1))</text>

  <line class="flow" x1="410" y1="240" x2="410" y2="265" marker-end="url(#ai18n)"/>

  <rect class="fill" x="220" y="265" width="380" height="60"/>
  <text x="235" y="285" class="b">SvI18nCache (Per-Language IndexedDB)</text>
  <text x="235" y="303" class="dim">In-memory Map loaded at boot on language select;</text>
  <text x="235" y="318" class="dim">returns immediately on cache hit</text>

  <line class="flow" x1="410" y1="325" x2="410" y2="350" marker-end="url(#ai18n)"/>

  <rect class="fill" x="220" y="350" width="380" height="60"/>
  <text x="235" y="370" class="b">SvI18nService AI Translation</text>
  <text x="235" y="388" class="dim">Groups requests by context, debounces 200ms,</text>
  <text x="235" y="403" class="dim">sends single batch call; stores result</text>

  <text x="410" y="445" text-anchor="middle" class="dim">UI shows source English text immediately, then swaps in translated string when promise resolves.</text>
</svg>

---

## Core Architecture & Classes

The i18n system consists of five core classes in `source/library/i18n/`:

| Class | Role |
|---|---|
| `SvI18n` | Singleton coordinator. Manages dedicated per-language IndexedDBs, language state, deduplicates pending promises, and exposes computed status getters (`queuedCount`, `completedCount`) for admin UI. |
| `SvI18nCache` | Eager in-memory cache. Owns `i18nTranslations/cache/{lang}` IndexedDB. Loads all language entries into a `Map` on language selection. Handles seed entries (permanent) and runtime additions with FIFO eviction. |
| `SvI18nStore` | Async IndexedDB bridge (`i18nTranslations/store/{lang}`). Purely an async read/write interface to IndexedDB with no in-memory state; promotes hits to `SvI18nCache`. |
| `SvI18nService` | Batched request service. Accumulates requests for 200ms, groups by context, sends JSON templates to AI chat models, and stores results. |
| `SvTranslationFilter` | Pluggable filter with named regex functions in a Map. Determines whether a string contains translatable linguistic content. |
| `SvTranslatableNode` | Base class for translatable domain nodes (`SvNode` hierarchy). Holds per-node Tier 0 `translationMap`. |

---

## The 4-Tier Lookup Pipeline

When a view calls `node.translatedValueOfSlotNamed("slotName")`:

1. **Request & Filter Verification:** `SvTranslatableNode` checks whether translation is needed:
   - System is enabled and language is not English (`SvI18n.shared().currentLanguage() !== "en"`).
   - Text is 20 words or fewer for slot values.
   - `SvTranslationFilter.shared().shouldTranslate(text)` confirms text contains linguistic content (not numbers, URLs, codes, or emails).
2. **Tier 0: Node Map (Sync $O(1)$):** Checks `node.translationMap` (per-node FIFO `Map` capped at 10 items). Auto-clears lazily if language has changed since last access. On hit, returns immediately with no UI flicker.
3. **Tier 1: SvI18nCache Map (Sync $O(1)$):** Checks `SvI18n.cachedTranslate(text, context)`. On hit, promotes result to Tier 0 map and returns.
4. **Tier 2: SvI18nStore IndexedDB (Async):** Calls `SvI18n.asyncTranslate(text, context)`. On hit in `i18nTranslations/store/{lang}`, promotes result to Tier 1 cache and Tier 0 map, then resolves promise.
5. **Tier 3: AI Batch Translation:** On complete miss, enqueues text in `SvI18nService`:
   - Returns English source text as immediate fallback.
   - Deduplicates: if key is pending, caller promise chains onto existing request.
   - Accumulates requests for 200ms (configurable `debounceMs`), groups by context, and sends 1 AI batch JSON request.
   - Stores response in Tier 1 cache and Tier 2 store, resolves pending promises, and calls `didUpdateNode()` to swap UI text cleanly without flicker.

---

## Smart Non-Linguistic Filtering (`SvTranslationFilter`)

`SvTranslationFilter` uses a pluggable Map of named filter functions to skip unnecessary API calls:

| Filter Name | Pattern Examples Skipped |
|---|---|
| `noAlphabetical` | `17 (+3)`, `+5 / +3 / +2`, `---` |
| `numericAndCurrency` | `42`, `$9.99`, `€100`, `$70.16 USD`, `100%` |
| `alphanumericCodes` | `23A`, `#7`, `3d6`, `+5`, `10/20` |
| `ordinals` | `1st`, `2nd`, `3rd` |
| `labeledNumeric` | `HP: 45`, `AC: 18`, `XP: 1,200` |
| `emailAddresses` | `user@example.com` |
| `phoneNumbers` | `+1 (555) 123-4567` |
| `urlsAndIps` | `https://example.com`, `192.168.1.1` |

Custom domain filters can be registered dynamically:

```javascript
SvTranslationFilter.shared().addFilter("diceNotation", s => /^\d*d\d+(\s*[+-]\s*\d+)?$/i.test(s));
```

---

## Seed Generation & Cloud Storage Workflow

Seed files provide instant, cold-start translations. They group entries by context:

```json
{
    "meta": { "language": "es", "entryCount": 150 },
    "entries": {
        "ui-label": { "Hit Points": "Puntos de Golpe" },
        "game-mechanic": { "Saving Throw": "Tirada de Salvacion" }
    }
}
```

### 3-Phase Seed Generation Pipeline (Admin UI):

1. **Phase 1 — Introspection (Init Seed):**
   - Clears cache for current language.
   - Walks all `SvNode` subclass prototypes via introspection.
   - Collects labels, placeholders, valid values, and default strings for slots with `shouldTranslate() === true`.
   - Filters collected strings through `SvTranslationFilter` and enqueues them for AI batch translation.
2. **Phase 2 — Runtime Accumulation:**
   - Developers browse the UI to trigger translations for dynamic strings not discoverable via static introspection (computed titles, subtitles, dynamic action labels).
3. **Phase 3 — Cloud Upload (Store Current Seed):**
   - Exports all cache entries for the language, strips timestamps (marking entries as permanent seed entries), and uploads the JSON seed file to Firebase Storage.

---

## Configuration & Tuning Parameters

```javascript
// Change active language (ISO 639-1)
SvI18n.shared().setCurrentLanguage("es");

// Enable or disable translation system
SvI18n.shared().setIsEnabled(true);
```

### `SvI18nService` Tuning Parameters:
- `debounceMs`: Milliseconds to accumulate requests before sending batch (default: `200`).
- `maxBatchSize`: Maximum strings per API request (default: `50`).
- `maxConcurrent`: Maximum simultaneous API requests (default: `3`).

---

## View Integration Details

- **Field Tiles (`SvFieldTile`):** Calls `node.translatedValueOfSlotNamed()` in `visibleKey()`, automatically displaying translated field labels.
- **Breadcrumb Navigation (`SvBreadCrumbsTile`):** Observes `"svI18nLanguageChanged"` notification, rebuilding breadcrumb path segments in the new language.
- **Custom Views:** Any view can observe `"svI18nLanguageChanged"` to trigger a UI refresh when the active language changes.

---

## Related Guides

- [Nodes](../Nodes/index.html): Core `SvNode` domain abstraction.
- [Slots](../Slots/index.html): Complete guide to slot metadata annotations.
- [AI Services](../Services/AI%20Services/index.html): AI service provider infrastructure.

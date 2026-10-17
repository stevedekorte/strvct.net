# Internationalization

AI-powered translation of UI text with per-language IndexedDB persistence, batched requests, and content filtering.

## Overview

STRVCT includes a built-in internationalization (i18n) system that translates UI strings on the fly using AI language models. Rather than maintaining static, hand-edited translation files for each language, the framework sends batched translation requests to an AI service and caches the results persistently in per-language IndexedDB databases.

This approach is uniquely enabled by the naked objects pattern. Because the framework generates the UI from model slot annotations, there is a single point—the **model-to-view boundary**—where all display text passes through. Translation is injected at that boundary, making every model class translatable by default with no per-component wiring.

```
+-------------------------------------------------------------------------+
|                  Internationalization Pipeline                          |
+-------------------------------------------------------------------------+
|  1. Model Text  -->  2. Model-to-View Boundary  -->  3. Smart Filter   |
|  4. Tier 0 Node Map -> 5. SvI18nCache (Sync)    -->  6. SvI18nStore (Async) |
|  7. AI Batch Translation -> 8. Cache Promotion   -->  9. Live View Swap |
+-------------------------------------------------------------------------+
```

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

## Core Classes Architecture

| Class Name | Role | Location |
|---|---|---|
| `SvI18n` | Singleton coordinator. Manages active language state, delegates to cache/store/service, and deduplicates pending promises. | `source/library/i18n/` |
| `SvI18nCache` | Eager in-memory cache. Loads all entries for current language from IndexedDB into a `Map`. FIFO eviction. | `source/library/i18n/` |
| `SvI18nStore` | Async IndexedDB bridge (`i18nTranslations/store/{lang}`). Async reads and fire-and-forget writes. | `source/library/i18n/` |
| `SvI18nService` | Batched request service. Debounces incoming requests (200ms), groups by context, and invokes AI chat model. | `source/library/i18n/` |
| `SvTranslationFilter` | Pluggable filter with named regex functions in a Map. Filters non-linguistic text (numbers, URLs, codes). | `source/library/i18n/` |
| `SvTranslatableNode` | Base class for translatable nodes (`SvNode` hierarchy). Holds per-node Tier 0 `translationMap`. | `source/library/i18n/` |

---

## The 4-Tier Lookup Pipeline

When a view calls `node.translatedValueOfSlotNamed("slotName")`:

1. **Filter Verification:** `SvTranslatableNode` checks if translation is required:
   - Language is not English (`SvI18n.shared().currentLanguage() !== "en"`).
   - Text is 20 words or fewer for slot values.
   - `SvTranslationFilter.shared().shouldTranslate(text)` confirms text is linguistic.
2. **Tier 0 (Node Map):** `node.translationMap` (sync $O(1)$) string Map (FIFO capped at 10 items). Returns immediately without UI flicker.
3. **Tier 1 (SvI18nCache):** Synchronous `SvI18nCache` `Map` lookup. On hit, promotes result to Tier 0 map and returns.
4. **Tier 2 (SvI18nStore):** Async IndexedDB lookup (`i18nTranslations/store/{lang}`). On hit, promotes result to Tier 1 and Tier 0.
5. **Tier 3 (AI Batch Translation):** On complete miss, `SvI18nService` enqueues text:
   - Returns source text immediately as temporary fallback.
   - Accumulates requests for 200ms, groups by context, and sends 1 AI batch JSON payload.
   - Stores result in Tier 1 and Tier 2, resolves promises, and calls `didUpdateNode()` to swap UI text cleanly.

---

## Non-Linguistic Content Filtering (`SvTranslationFilter`)

The filter engine skips unnecessary API calls for strings matching non-linguistic patterns:

| Built-in Filter Name | Pattern Examples Skipped |
|---|---|
| `noAlphabetical` | `17 (+3)`, `+5 / +3`, `---` |
| `numericAndCurrency` | `42`, `$9.99`, `€100`, `$70.16 USD`, `100%` |
| `alphanumericCodes` | `23A`, `#7`, `3d6`, `+5`, `10/20` |
| `ordinals` | `1st`, `2nd`, `3rd` |
| `labeledNumeric` | `HP: 45`, `AC: 18`, `XP: 1,200` |
| `emailAddresses` | `user@example.com` |
| `phoneNumbers` | `+1 (555) 123-4567` |
| `urlsAndIps` | `https://example.com`, `192.168.1.1` |

Custom domain filters can be added dynamically:

```javascript
SvTranslationFilter.shared().addFilter("diceNotation", s => /^\d*d\d+(\s*[+-]\s*\d+)?$/i.test(s));
```

---

## Slot Annotations for Translation

| Slot Annotation | Purpose |
|---|---|
| `slot.setTranslationContext("ui-label")` | Groups slot values into context categories for AI prompt batching (e.g. `"ui-label"`, `"game-mechanic"`). |
| `slot.setShouldTranslate(false)` | Disables automatic translation for raw code or technical identifier slots. |

---

## Related Guides

- [Nodes](../Nodes/index.html): Core `SvNode` domain abstraction.
- [Slots](../Slots/index.html): Complete guide to slot metadata annotations.
- [AI Services](../Services/AI%20Services/index.html): AI service provider infrastructure.

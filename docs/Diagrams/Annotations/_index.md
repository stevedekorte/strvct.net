# Annotations

One slot declaration carries metadata that independent framework layers read without coordinating. Adding a new layer leaves existing layers unchanged.

<svg viewBox="0 0 820 480" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .dashed { stroke-dasharray: 4,4; fill: none; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
<defs>
      <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
      </marker>
    </defs>
    <rect class="fill" x="250" y="20" width="320" height="220"/>
    <text x="410" y="48" text-anchor="middle" class="b">a single slot declaration</text>
    <text x="272" y="78">newSlot("name", "")</text>
    <text x="282" y="100">.setSlotType("String")</text>
    <text x="282" y="122">.setShouldStoreSlot(true)</text>
    <text x="282" y="144">.setSyncsToView(true)</text>
    <text x="282" y="166">.setCanEditInspection(true)</text>
    <text x="282" y="188">.setIsSubnodeField(true)</text>
    <text x="282" y="210">.setFinalInitProto(Cls)</text>
    <text x="282" y="232">.setTranslationContext(...)</text>
    <line class="flow" x1="410" y1="240" x2="410" y2="270"/>
    <line class="flow" x1="120" y1="270" x2="700" y2="270"/>
    <line class="flow" x1="120" y1="270" x2="120" y2="300" marker-end="url(#a2)"/>
    <line class="flow" x1="270" y1="270" x2="270" y2="300" marker-end="url(#a2)"/>
    <line class="flow" x1="420" y1="270" x2="420" y2="300" marker-end="url(#a2)"/>
    <line class="flow" x1="570" y1="270" x2="570" y2="300" marker-end="url(#a2)"/>
    <line class="flow" x1="700" y1="270" x2="700" y2="300" marker-end="url(#a2)"/>
    <rect class="box" x="55"  y="300" width="130" height="70"/>
    <text x="120" y="330" text-anchor="middle" class="b">UI</text>
    <text x="120" y="352" text-anchor="middle" class="dim">type, edit, nav</text>
    <rect class="box" x="205" y="300" width="130" height="70"/>
    <text x="270" y="330" text-anchor="middle" class="b">Storage</text>
    <text x="270" y="352" text-anchor="middle" class="dim">should-store</text>
    <rect class="box" x="355" y="300" width="130" height="70"/>
    <text x="420" y="330" text-anchor="middle" class="b">Sync</text>
    <text x="420" y="352" text-anchor="middle" class="dim">syncsToView</text>
    <rect class="box" x="505" y="300" width="130" height="70"/>
    <text x="570" y="330" text-anchor="middle" class="b">AI / Patch</text>
    <text x="570" y="352" text-anchor="middle" class="dim">type / schema</text>
    <rect class="box" x="635" y="300" width="130" height="70"/>
    <text x="700" y="330" text-anchor="middle" class="b">i18n</text>
    <text x="700" y="352" text-anchor="middle" class="dim">translation ctx</text>
    <text x="410" y="412" text-anchor="middle" class="dim">No inter-layer coordination; each consumer reads only what it needs.</text>
    <text x="410" y="438" text-anchor="middle" class="dim">A new layer added later: have it read the slot metadata it cares about.</text>
  </svg>

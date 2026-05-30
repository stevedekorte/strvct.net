# Annotations

One slot declaration carries metadata that independent framework layers read without coordinating. Adding a new layer leaves existing layers unchanged.

<svg viewBox="0 0 820 410" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="fill" x="260" y="20" width="300" height="200"/>
  <text x="275" y="40" class="b">a single slot declaration</text>
  <text x="275" y="62" class="dim">newSlot("name", "")</text>
  <text x="275" y="80" class="dim">  .setSlotType("String")</text>
  <text x="275" y="98" class="dim">  .setShouldStoreSlot(true)</text>
  <text x="275" y="116" class="dim">  .setSyncsToView(true)</text>
  <text x="275" y="134" class="dim">  .setCanEditInspection(true)</text>
  <text x="275" y="152" class="dim">  .setIsSubnodeField(true)</text>
  <text x="275" y="170" class="dim">  .setFinalInitProto(Cls)</text>
  <text x="275" y="188" class="dim">  .setTranslationContext(...)</text>
  <line class="flow" x1="410" y1="220" x2="410" y2="240"/>
  <line class="flow" x1="130" y1="240" x2="690" y2="240"/>
  <line class="flow" x1="130" y1="240" x2="130" y2="270" marker-end="url(#a2)"/>
  <line class="flow" x1="270" y1="240" x2="270" y2="270" marker-end="url(#a2)"/>
  <line class="flow" x1="410" y1="240" x2="410" y2="270" marker-end="url(#a2)"/>
  <line class="flow" x1="550" y1="240" x2="550" y2="270" marker-end="url(#a2)"/>
  <line class="flow" x1="690" y1="240" x2="690" y2="270" marker-end="url(#a2)"/>
  <rect class="box" x="65" y="270" width="130" height="52"/>
  <text x="80" y="290" class="b">UI</text>
  <text x="80" y="308" class="dim">type, edit, nav</text>
  <rect class="box" x="205" y="270" width="130" height="52"/>
  <text x="220" y="290" class="b">Storage</text>
  <text x="220" y="308" class="dim">should-store</text>
  <rect class="box" x="345" y="270" width="130" height="52"/>
  <text x="360" y="290" class="b">Sync</text>
  <text x="360" y="308" class="dim">syncsToView</text>
  <rect class="box" x="485" y="270" width="130" height="52"/>
  <text x="500" y="290" class="b">AI / Patch</text>
  <text x="500" y="308" class="dim">type / schema</text>
  <rect class="box" x="625" y="270" width="130" height="52"/>
  <text x="640" y="290" class="b">i18n</text>
  <text x="640" y="308" class="dim">translation ctx</text>
  <text x="65" y="355" class="dim">No inter-layer coordination; each consumer reads only what it needs.</text>
  <text x="65" y="375" class="dim">A new layer added later: have it read the slot metadata it cares about.</text>
</svg>

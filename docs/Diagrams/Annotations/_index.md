# Annotations

One slot declaration carries metadata that independent framework layers read without coordinating. Adding a new layer leaves existing layers unchanged.

<svg viewBox="0 0 820 330" width="820" xmlns="http://www.w3.org/2000/svg">
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

  <!-- Top Slot Declaration Box -->
  <rect class="fill" x="240" y="20" width="340" height="170"/>
  <text x="255" y="42" class="b">Single Slot Declaration (SvSlot)</text>
  <text x="255" y="62" class="dim">const slot = this.newSlot("name", "");</text>
  <text x="255" y="80" class="dim">slot.setSlotType("String");</text>
  <text x="255" y="98" class="dim">slot.setShouldStoreSlot(true);</text>
  <text x="255" y="116" class="dim">slot.setSyncsToView(true);</text>
  <text x="255" y="134" class="dim">slot.setCanEditInspection(true);</text>
  <text x="255" y="152" class="dim">slot.setIsSubnodeField(true);</text>
  <text x="255" y="170" class="dim">slot.setFinalInitProto(Inventory);</text>

  <!-- Flow Line to Bus -->
  <line class="flow" x1="410" y1="190" x2="410" y2="215"/>
  <line class="flow" x1="90" y1="215" x2="730" y2="215"/>

  <!-- Arrows to 5 Layer Consumers -->
  <line class="flow" x1="90" y1="215" x2="90" y2="235" marker-end="url(#a2)"/>
  <line class="flow" x1="250" y1="215" x2="250" y2="235" marker-end="url(#a2)"/>
  <line class="flow" x1="410" y1="215" x2="410" y2="235" marker-end="url(#a2)"/>
  <line class="flow" x1="570" y1="215" x2="570" y2="235" marker-end="url(#a2)"/>
  <line class="flow" x1="730" y1="215" x2="730" y2="235" marker-end="url(#a2)"/>

  <!-- 5 Uniform Consumer Boxes (w: 140, h: 50) -->
  <rect class="box" x="20" y="235" width="140" height="50"/>
  <text x="35" y="255" class="b">UI Layer</text>
  <text x="35" y="273" class="dim">Type, edit, &amp; nav</text>

  <rect class="box" x="180" y="235" width="140" height="50"/>
  <text x="195" y="255" class="b">Storage Layer</text>
  <text x="195" y="273" class="dim">IndexedDB rows</text>

  <rect class="box" x="340" y="235" width="140" height="50"/>
  <text x="355" y="255" class="b">Sync Engine</text>
  <text x="355" y="273" class="dim">Deferred notifications</text>

  <rect class="box" x="500" y="235" width="140" height="50"/>
  <text x="515" y="255" class="b">AI Tool Surface</text>
  <text x="515" y="273" class="dim">schema-fetch &amp; patch</text>

  <rect class="box" x="660" y="235" width="140" height="50"/>
  <text x="675" y="255" class="b">i18n Engine</text>
  <text x="675" y="273" class="dim">Translation context</text>

  <text x="410" y="315" text-anchor="middle" class="dim">No inter-layer coordination; each consumer reads only its relevant slot metadata annotations.</text>
</svg>

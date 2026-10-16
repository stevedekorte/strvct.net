# Layers

Application code sits on the Strvct framework, which sits on the platform. Inside Strvct, the slot system is the shared metadata layer that independent consumers read.

<svg viewBox="0 0 820 530" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Application Layer -->
  <rect class="box" x="40" y="20" width="740" height="70"/>
  <text x="55" y="42" class="b">Application Code</text>
  <rect class="fill" x="70" y="50" width="680" height="30"/>
  <text x="85" y="70" class="dim">UoCharacter, UoCampaign, UoSession, Custom Domain Classes</text>

  <line class="flow" x1="410" y1="90" x2="410" y2="120" marker-end="url(#a1)"/>

  <!-- STRVCT Framework Layer -->
  <rect class="box" x="40" y="120" width="740" height="270"/>
  <text x="55" y="142" class="b">STRVCT Framework</text>

  <rect class="fill" x="70" y="155" width="320" height="45"/>
  <text x="85" y="175" class="b">Domain Model</text>
  <text x="85" y="191" class="dim">SvNode object graph</text>

  <line class="flow" x1="390" y1="170" x2="430" y2="170" marker-end="url(#a1)"/>
  <line class="flow" x1="430" y1="185" x2="390" y2="185" marker-end="url(#a1)"/>

  <rect class="fill" x="430" y="155" width="320" height="45"/>
  <text x="445" y="175" class="b">View Layer</text>
  <text x="445" y="191" class="dim">SvNodeView hierarchy &amp; Miller tiles</text>

  <line class="flow" x1="230" y1="200" x2="230" y2="225"/>
  <line class="flow" x1="230" y1="225" x2="410" y2="225" marker-end="url(#a1)"/>

  <rect class="fill" x="250" y="215" width="320" height="40"/>
  <text x="265" y="240" class="b">Slot Annotation Metadata Bridge</text>

  <line class="flow" x1="410" y1="255" x2="410" y2="280"/>
  <line class="flow" x1="120" y1="280" x2="700" y2="280"/>

  <line class="flow" x1="120" y1="280" x2="120" y2="300" marker-end="url(#a1)"/>
  <line class="flow" x1="265" y1="280" x2="265" y2="300" marker-end="url(#a1)"/>
  <line class="flow" x1="410" y1="280" x2="410" y2="300" marker-end="url(#a1)"/>
  <line class="flow" x1="555" y1="280" x2="555" y2="300" marker-end="url(#a1)"/>
  <line class="flow" x1="700" y1="280" x2="700" y2="300" marker-end="url(#a1)"/>

  <!-- 5 Framework Subsystem Boxes -->
  <rect class="box" x="55" y="300" width="130" height="50"/>
  <text x="70" y="320" class="b">Persistence</text>
  <text x="70" y="338" class="dim">shouldStoreSlot</text>

  <rect class="box" x="200" y="300" width="130" height="50"/>
  <text x="215" y="320" class="b">Sync Engine</text>
  <text x="215" y="338" class="dim">syncsToView</text>

  <rect class="box" x="345" y="300" width="130" height="50"/>
  <text x="360" y="320" class="b">AI Tool Surface</text>
  <text x="360" y="338" class="dim">schema-fetch/patch</text>

  <rect class="box" x="490" y="300" width="130" height="50"/>
  <text x="505" y="320" class="b">i18n Engine</text>
  <text x="505" y="338" class="dim">translationContext</text>

  <rect class="box" x="635" y="300" width="130" height="50"/>
  <text x="650" y="320" class="b">JSON Schema</text>
  <text x="650" y="338" class="dim">type validation</text>

  <!-- Flow to Platform Layer -->
  <line class="flow" x1="410" y1="390" x2="410" y2="415"/>
  <line class="flow" x1="215" y1="415" x2="605" y2="415"/>
  <line class="flow" x1="215" y1="415" x2="215" y2="430" marker-end="url(#a1)"/>
  <line class="flow" x1="605" y1="415" x2="605" y2="430" marker-end="url(#a1)"/>

  <!-- Platforms -->
  <rect class="box" x="40" y="430" width="350" height="70"/>
  <text x="55" y="452" class="b">Web Browser / Electron Platform</text>
  <rect class="fill" x="70" y="460" width="290" height="30"/>
  <text x="85" y="480" class="dim">IndexedDB · DOM API · Web Fetch</text>

  <rect class="box" x="430" y="430" width="350" height="70"/>
  <text x="445" y="452" class="b">Node.js Headless Platform</text>
  <rect class="fill" x="460" y="460" width="290" height="30"/>
  <text x="475" y="480" class="dim">LevelDB · Browser API Shims</text>
</svg>

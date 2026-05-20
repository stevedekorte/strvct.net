# Layers

Application code sits on the Strvct framework, which sits on the platform. Inside Strvct, the slot system is the shared metadata layer that independent consumers read.

<svg viewBox="0 0 820 640" width="820" xmlns="http://www.w3.org/2000/svg">
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
      <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
      </marker>
    </defs>
    <rect class="box" x="40" y="20" width="740" height="110"/>
    <text x="55" y="42" class="b">Application Code</text>
    <rect class="fill" x="80" y="60" width="660" height="50"/>
    <text x="410" y="90" text-anchor="middle" class="dim">UoCharacter, UoCampaign, UoSession …</text>
    <line class="flow" x1="410" y1="130" x2="410" y2="155" marker-end="url(#a1)"/>
    <rect class="box" x="40" y="155" width="740" height="320"/>
    <text x="55" y="177" class="b">STRVCT Framework</text>
    <rect class="fill" x="80" y="200" width="240" height="70"/>
    <text x="200" y="230" text-anchor="middle" class="b">Domain Model</text>
    <text x="200" y="252" text-anchor="middle" class="dim">SvNode tree</text>
    <rect class="fill" x="500" y="200" width="240" height="70"/>
    <text x="620" y="230" text-anchor="middle" class="b">View Layer</text>
    <text x="620" y="252" text-anchor="middle" class="dim">SvDomView, tiles</text>
    <line class="flow" x1="320" y1="235" x2="500" y2="235" marker-end="url(#a1)"/>
    <line class="flow" x1="500" y1="235" x2="320" y2="235" marker-end="url(#a1)"/>
    <rect class="fill" x="290" y="300" width="240" height="70"/>
    <text x="410" y="330" text-anchor="middle" class="b">Slot System</text>
    <text x="410" y="352" text-anchor="middle" class="dim">shared metadata</text>
    <line class="flow" x1="410" y1="370" x2="410" y2="390"/>
    <line class="flow" x1="120" y1="390" x2="700" y2="390"/>
    <line class="flow" x1="120" y1="390" x2="120" y2="410" marker-end="url(#a1)"/>
    <line class="flow" x1="265" y1="390" x2="265" y2="410" marker-end="url(#a1)"/>
    <line class="flow" x1="410" y1="390" x2="410" y2="410" marker-end="url(#a1)"/>
    <line class="flow" x1="555" y1="390" x2="555" y2="410" marker-end="url(#a1)"/>
    <line class="flow" x1="700" y1="390" x2="700" y2="410" marker-end="url(#a1)"/>
    <rect class="box" x="55"  y="410" width="130" height="50"/>
    <text x="120" y="441" text-anchor="middle" class="b">Persistence</text>
    <rect class="box" x="200" y="410" width="130" height="50"/>
    <text x="265" y="441" text-anchor="middle" class="b">Sync</text>
    <rect class="box" x="345" y="410" width="130" height="50"/>
    <text x="410" y="441" text-anchor="middle" class="b">AI Tools</text>
    <rect class="box" x="490" y="410" width="130" height="50"/>
    <text x="555" y="441" text-anchor="middle" class="b">i18n</text>
    <rect class="box" x="635" y="410" width="130" height="50"/>
    <text x="700" y="441" text-anchor="middle" class="b">Schema</text>
    <line class="flow" x1="410" y1="475" x2="410" y2="490"/>
    <line class="flow" x1="220" y1="490" x2="600" y2="490"/>
    <line class="flow" x1="220" y1="490" x2="220" y2="510" marker-end="url(#a1)"/>
    <line class="flow" x1="600" y1="490" x2="600" y2="510" marker-end="url(#a1)"/>
    <rect class="box" x="40" y="510" width="360" height="110"/>
    <text x="55" y="532" class="b">Web Browser / Electron Platform</text>
    <rect class="fill" x="80" y="550" width="280" height="50"/>
    <text x="220" y="580" text-anchor="middle" class="dim">IndexedDB · DOM · Fetch</text>
    <rect class="box" x="420" y="510" width="360" height="110"/>
    <text x="435" y="532" class="b">Node.js Headless Platform</text>
    <rect class="fill" x="460" y="550" width="280" height="50"/>
    <text x="600" y="580" text-anchor="middle" class="dim">LevelDB · Browser API Shims</text>
  </svg>

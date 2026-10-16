# View Resolution

When a node becomes visible, the framework finds a view class by climbing the node's inheritance chain. Custom views are an override; the default is always available.

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
    <marker id="a4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Step 1: Navigate to Node -->
  <rect class="fill" x="240" y="20" width="340" height="45"/>
  <text x="255" y="46" class="b">Navigate to Node N (Instance of Class C)</text>

  <line class="flow" x1="410" y1="65" x2="410" y2="90" marker-end="url(#a4)"/>

  <!-- Step 2: C Declares nodeViewClass() -->
  <rect class="fill" x="240" y="90" width="340" height="45"/>
  <text x="255" y="116" class="b">C Declares nodeViewClass() Override?</text>

  <!-- YES Branch Left -->
  <line class="flow" x1="240" y1="112" x2="200" y2="112" marker-end="url(#a4)"/>
  <rect class="box" x="20" y="90" width="180" height="45"/>
  <text x="35" y="116" class="b">Use Declared Class</text>

  <line class="flow" x1="410" y1="135" x2="410" y2="160" marker-end="url(#a4)"/>

  <!-- Step 3: Look up C.name + "View" -->
  <rect class="fill" x="240" y="160" width="340" height="45"/>
  <text x="255" y="186" class="b">Look Up Class Name: C.name + "View"</text>

  <line class="flow" x1="410" y1="205" x2="410" y2="230" marker-end="url(#a4)"/>

  <!-- Step 4: Found Class? -->
  <rect class="fill" x="240" y="230" width="340" height="45"/>
  <text x="255" y="256" class="b">Found Matching View Class in Scope?</text>

  <!-- YES Branch Right -->
  <line class="flow" x1="580" y1="252" x2="620" y2="252" marker-end="url(#a4)"/>
  <rect class="box" x="620" y="230" width="180" height="45"/>
  <text x="635" y="256" class="b">Instantiate View Class</text>

  <!-- NO Branch Left -->
  <line class="flow" x1="240" y1="252" x2="200" y2="252" marker-end="url(#a4)"/>
  <rect class="box" x="20" y="230" width="180" height="45"/>
  <text x="35" y="256" class="b">Climb to Superclass</text>

  <text x="410" y="305" text-anchor="middle" class="dim">Reaching the prototype root without a match falls back to SvNodeView (framework default view).</text>
</svg>
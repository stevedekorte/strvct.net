# View Resolution

When a node becomes visible, the framework finds a view class by climbing the node's inheritance chain. Custom views are an override; the default is always available.

<svg viewBox="0 0 820 360" width="820" xmlns="http://www.w3.org/2000/svg">
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
  <rect class="fill" x="290" y="20" width="240" height="52"/>
  <text x="305" y="40" class="b">navigate to node N</text>
  <text x="305" y="58" class="dim">instance of class C</text>
  <line class="flow" x1="410" y1="72" x2="410" y2="95" marker-end="url(#a4)"/>
  <rect class="fill" x="290" y="95" width="240" height="52"/>
  <text x="305" y="115" class="b">C declares nodeViewClass()?</text>
  <text x="305" y="133" class="dim">decision</text>
  <line class="flow" x1="410" y1="147" x2="410" y2="170" marker-end="url(#a4)"/>
  <text x="425" y="162" class="dim">no</text>
  <rect class="fill" x="290" y="170" width="240" height="52"/>
  <text x="305" y="190" class="b">look up</text>
  <text x="305" y="208" class="dim">C.name + "View"</text>
  <line class="flow" x1="410" y1="222" x2="410" y2="245" marker-end="url(#a4)"/>
  <rect class="fill" x="290" y="245" width="240" height="52"/>
  <text x="305" y="265" class="b">found?</text>
  <text x="305" y="283" class="dim">decision</text>
  <rect class="box" x="40" y="95" width="200" height="52"/>
  <text x="55" y="115" class="b">use declared</text>
  <text x="55" y="133" class="b">class</text>
  <rect class="box" x="40" y="245" width="200" height="52"/>
  <text x="55" y="265" class="b">climb to</text>
  <text x="55" y="283" class="b">superclass</text>
  <rect class="box" x="580" y="245" width="200" height="52"/>
  <text x="595" y="265" class="b">use that</text>
  <text x="595" y="283" class="b">view class</text>
  <line class="flow" x1="290" y1="121" x2="240" y2="121" marker-end="url(#a4)"/>
  <text x="265" y="113" text-anchor="middle" class="dim">yes</text>
  <line class="flow" x1="530" y1="271" x2="580" y2="271" marker-end="url(#a4)"/>
  <text x="555" y="263" text-anchor="middle" class="dim">yes</text>
  <line class="flow" x1="290" y1="271" x2="240" y2="271" marker-end="url(#a4)"/>
  <text x="265" y="263" text-anchor="middle" class="dim">no</text>
  <path class="flow" d="M 140 245 L 140 196 L 290 196" marker-end="url(#a4)"/>
  <text x="40" y="335" class="dim">Root reached without a match falls through to SvNodeView (default).</text>
</svg>

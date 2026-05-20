# View Resolution

When a node becomes visible, the framework finds a view class by climbing the node's inheritance chain. Custom views are an override; the default is always available.

<svg viewBox="0 0 820 540" width="820" xmlns="http://www.w3.org/2000/svg">
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
      <marker id="a4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
      </marker>
    </defs>
    <rect class="fill" x="290" y="20" width="240" height="70"/>
    <text x="410" y="50" text-anchor="middle" class="b">navigate to node N</text>
    <text x="410" y="72" text-anchor="middle" class="dim">instance of class C</text>
    <line class="flow" x1="410" y1="90" x2="410" y2="135" marker-end="url(#a4)"/>
    <rect class="fill" x="290" y="135" width="240" height="70"/>
    <text x="410" y="165" text-anchor="middle" class="b">C declares nodeViewClass()?</text>
    <text x="410" y="187" text-anchor="middle" class="dim">decision</text>
    <line class="flow" x1="290" y1="170" x2="200" y2="170" marker-end="url(#a4)"/>
    <text x="245" y="162" text-anchor="middle" class="dim">yes</text>
    <rect class="box" x="40" y="135" width="160" height="70"/>
    <text x="120" y="165" text-anchor="middle" class="b">use declared</text>
    <text x="120" y="187" text-anchor="middle" class="b">class</text>
    <line class="flow" x1="410" y1="205" x2="410" y2="245" marker-end="url(#a4)"/>
    <text x="425" y="232" class="dim">no</text>
    <rect class="fill" x="290" y="245" width="240" height="70"/>
    <text x="410" y="275" text-anchor="middle" class="b">look up</text>
    <text x="410" y="297" text-anchor="middle">C.name + "View"</text>
    <line class="flow" x1="410" y1="315" x2="410" y2="355" marker-end="url(#a4)"/>
    <rect class="fill" x="290" y="355" width="240" height="70"/>
    <text x="410" y="385" text-anchor="middle" class="b">found?</text>
    <text x="410" y="407" text-anchor="middle" class="dim">decision</text>
    <line class="flow" x1="530" y1="390" x2="620" y2="390" marker-end="url(#a4)"/>
    <text x="575" y="382" text-anchor="middle" class="dim">yes</text>
    <rect class="box" x="620" y="355" width="160" height="70"/>
    <text x="700" y="385" text-anchor="middle" class="b">use that</text>
    <text x="700" y="407" text-anchor="middle" class="b">view class</text>
    <line class="flow" x1="290" y1="390" x2="200" y2="390" marker-end="url(#a4)"/>
    <text x="245" y="382" text-anchor="middle" class="dim">no</text>
    <rect class="box" x="40" y="355" width="160" height="70"/>
    <text x="120" y="385" text-anchor="middle" class="b">climb to</text>
    <text x="120" y="407" text-anchor="middle" class="b">superclass</text>
    <path class="flow" d="M 120 355 L 120 280 L 290 280" marker-end="url(#a4)"/>
    <text x="410" y="500" text-anchor="middle" class="dim">Root reached without a match falls through to SvNodeView (default).</text>
  </svg>

# Persistence Pipeline

Drilling into Local Storage. The object pool persists slot mutations through the synchronous track on the left. The blob pool stores content-addressable binaries asynchronously on the right. Garbage collection bridges them: the object pool walks reachable nodes, collects referenced hashes, and the blob pool removes any blob not in that set.

<svg viewBox="0 0 820 450" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="a6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="120" y="20" width="250" height="415"/>
  <text x="135" y="42" class="b">Object Pool (sync)</text>
  <rect class="box" x="450" y="20" width="250" height="415"/>
  <text x="465" y="42" class="b">Blob Pool (async)</text>
  <rect class="fill" x="135" y="60" width="220" height="52"/>
  <text x="150" y="80" class="b">SvNode setter called</text>
  <text x="150" y="98" class="dim">slot mutation</text>
  <line class="flow" x1="245" y1="112" x2="245" y2="137" marker-end="url(#a6)"/>
  <rect class="fill" x="135" y="137" width="220" height="52"/>
  <text x="150" y="157" class="b">addDirtyObject(self)</text>
  <text x="150" y="175" class="dim">via ObjectPool</text>
  <line class="flow" x1="245" y1="189" x2="245" y2="214" marker-end="url(#a6)"/>
  <rect class="fill" x="135" y="214" width="220" height="52"/>
  <text x="150" y="234" class="b">end of event loop</text>
  <text x="150" y="252" class="dim">begin atomic txn</text>
  <line class="flow" x1="245" y1="266" x2="245" y2="291" marker-end="url(#a6)"/>
  <rect class="fill" x="135" y="291" width="220" height="52"/>
  <text x="150" y="311" class="b">recordForStore() per object</text>
  <text x="150" y="329" class="dim">write keyed by puuid</text>
  <rect class="fill" x="135" y="368" width="220" height="52"/>
  <text x="150" y="388" class="b">GC: walk reachable</text>
  <text x="150" y="406" class="dim">collect referenced hashes</text>
  <rect class="fill" x="465" y="60" width="220" height="52"/>
  <text x="480" y="80" class="b">asyncStoreBlob(blob)</text>
  <text x="480" y="98" class="dim">from app code</text>
  <line class="flow" x1="575" y1="112" x2="575" y2="137" marker-end="url(#a6)"/>
  <rect class="fill" x="465" y="137" width="220" height="52"/>
  <text x="480" y="157" class="b">sha256(blob) → hash</text>
  <text x="480" y="175" class="dim">content-addressable key</text>
  <line class="flow" x1="575" y1="189" x2="575" y2="214" marker-end="url(#a6)"/>
  <rect class="fill" x="465" y="214" width="220" height="52"/>
  <text x="480" y="234" class="b">write hash → data + meta</text>
  <text x="480" y="252" class="dim">{hash} and {hash}/meta</text>
  <line class="flow" x1="575" y1="266" x2="575" y2="291" marker-end="url(#a6)"/>
  <rect class="fill" x="465" y="291" width="220" height="52"/>
  <text x="480" y="311" class="b">node stores hash string</text>
  <text x="480" y="329" class="dim">drives GC reachability</text>
  <rect class="fill" x="465" y="368" width="220" height="52"/>
  <text x="480" y="388" class="b">remove orphan blobs</text>
  <text x="480" y="406" class="dim">not in referenced set</text>
  <line class="flow" x1="355" y1="394" x2="465" y2="394" marker-end="url(#a6)"/>
  <text x="410" y="387" text-anchor="middle" class="dim">ref hash set</text>
</svg>

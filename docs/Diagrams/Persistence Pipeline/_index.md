# Persistence Pipeline

Drilling into Local Storage. The object pool persists slot mutations through the synchronous track on the left. The blob pool stores content-addressable binaries asynchronously on the right. Garbage collection bridges them: the object pool walks reachable nodes, collects referenced hashes, and the blob pool removes any blob not in that set.

<svg viewBox="0 0 820 620" width="820" xmlns="http://www.w3.org/2000/svg">
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
      <marker id="a6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
      </marker>
    </defs>
    <rect class="box" x="60"  y="20" width="320" height="565"/>
    <text x="75" y="42" class="b">Object Pool (sync)</text>
    <rect class="box" x="440" y="20" width="320" height="565"/>
    <text x="455" y="42" class="b">Blob Pool (async)</text>
    <rect class="fill" x="100" y="95" width="240" height="70"/>
    <text x="220" y="125" text-anchor="middle" class="b">SvNode setter called</text>
    <text x="220" y="147" text-anchor="middle" class="dim">slot mutation</text>
    <line class="flow" x1="220" y1="165" x2="220" y2="190" marker-end="url(#a6)"/>
    <rect class="fill" x="100" y="190" width="240" height="70"/>
    <text x="220" y="220" text-anchor="middle" class="b">addDirtyObject(self)</text>
    <text x="220" y="242" text-anchor="middle" class="dim">via ObjectPool</text>
    <line class="flow" x1="220" y1="260" x2="220" y2="285" marker-end="url(#a6)"/>
    <rect class="fill" x="100" y="285" width="240" height="70"/>
    <text x="220" y="315" text-anchor="middle" class="b">end of event loop</text>
    <text x="220" y="337" text-anchor="middle" class="dim">begin atomic txn</text>
    <line class="flow" x1="220" y1="355" x2="220" y2="380" marker-end="url(#a6)"/>
    <rect class="fill" x="100" y="380" width="240" height="70"/>
    <text x="220" y="410" text-anchor="middle" class="b">recordForStore() per object</text>
    <text x="220" y="432" text-anchor="middle" class="dim">write keyed by puuid</text>
    <rect class="fill" x="100" y="475" width="240" height="70"/>
    <text x="220" y="505" text-anchor="middle" class="b">GC: walk reachable</text>
    <text x="220" y="527" text-anchor="middle" class="dim">collect referenced hashes</text>
    <rect class="fill" x="480" y="95" width="240" height="70"/>
    <text x="600" y="125" text-anchor="middle" class="b">asyncStoreBlob(blob)</text>
    <text x="600" y="147" text-anchor="middle" class="dim">from app code</text>
    <line class="flow" x1="600" y1="165" x2="600" y2="190" marker-end="url(#a6)"/>
    <rect class="fill" x="480" y="190" width="240" height="70"/>
    <text x="600" y="220" text-anchor="middle" class="b">sha256(blob) → hash</text>
    <text x="600" y="242" text-anchor="middle" class="dim">content-addressable key</text>
    <line class="flow" x1="600" y1="260" x2="600" y2="285" marker-end="url(#a6)"/>
    <rect class="fill" x="480" y="285" width="240" height="70"/>
    <text x="600" y="315" text-anchor="middle" class="b">write hash → data + meta</text>
    <text x="600" y="337" text-anchor="middle" class="dim">{hash} and {hash}/meta</text>
    <line class="flow" x1="600" y1="355" x2="600" y2="380" marker-end="url(#a6)"/>
    <rect class="fill" x="480" y="380" width="240" height="70"/>
    <text x="600" y="410" text-anchor="middle" class="b">node stores hash string</text>
    <text x="600" y="432" text-anchor="middle" class="dim">drives GC reachability</text>
    <rect class="fill" x="480" y="475" width="240" height="70"/>
    <text x="600" y="505" text-anchor="middle" class="b">remove orphan blobs</text>
    <text x="600" y="527" text-anchor="middle" class="dim">not in referenced set</text>
    <line class="flow" x1="340" y1="510" x2="480" y2="510" marker-end="url(#a6)"/>
    <text x="410" y="503" text-anchor="middle" class="dim">ref hash set</text>
  </svg>

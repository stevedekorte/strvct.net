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

  <!-- Left Column: Object Pool & Record Store -->
  <rect class="box" x="40" y="20" width="350" height="410"/>
  <text x="55" y="42" class="b">Object Pool &amp; Record Store (Synchronous)</text>

  <rect class="fill" x="65" y="60" width="300" height="48"/>
  <text x="80" y="80" class="b">SvNode Setter Mutates Slot</text>
  <text x="80" y="96" class="dim">Slot setter invokes didMutate()</text>

  <line class="flow" x1="215" y1="108" x2="215" y2="132" marker-end="url(#a6)"/>

  <rect class="fill" x="65" y="132" width="300" height="48"/>
  <text x="80" y="152" class="b">addDirtyObject(self)</text>
  <text x="80" y="168" class="dim">Schedules deferred commit in SvObjectPool</text>

  <line class="flow" x1="215" y1="180" x2="215" y2="204" marker-end="url(#a6)"/>

  <rect class="fill" x="65" y="204" width="300" height="48"/>
  <text x="80" y="224" class="b">End of Event Loop Commit</text>
  <text x="80" y="240" class="dim">SvPersistentAtomicMap begins transaction</text>

  <line class="flow" x1="215" y1="252" x2="215" y2="276" marker-end="url(#a6)"/>

  <rect class="fill" x="65" y="276" width="300" height="48"/>
  <text x="80" y="296" class="b">SvRecordRow Written to IndexedDB</text>
  <text x="80" y="312" class="dim">Row payload keyed by (poolId + objectId)</text>

  <line class="flow" x1="215" y1="324" x2="215" y2="348" marker-end="url(#a6)"/>

  <rect class="fill" x="65" y="348" width="300" height="60"/>
  <text x="80" y="368" class="b">Mark &amp; Sweep GC</text>
  <text x="80" y="386" class="dim">Traces reachable nodes &amp; collects referenced</text>
  <text x="80" y="400" class="dim">SHA-256 binary hash strings</text>

  <!-- Right Column: Blob Pool -->
  <rect class="box" x="430" y="20" width="350" height="410"/>
  <text x="445" y="42" class="b">SHA-256 Blob Store (Asynchronous CAS)</text>

  <rect class="fill" x="455" y="60" width="300" height="48"/>
  <text x="470" y="80" class="b">asyncStoreBlob(ArrayBuffer)</text>
  <text x="470" y="96" class="dim">Triggered from app code or media upload</text>

  <line class="flow" x1="605" y1="108" x2="605" y2="132" marker-end="url(#a6)"/>

  <rect class="fill" x="455" y="132" width="300" height="48"/>
  <text x="470" y="152" class="b">sha256(ArrayBuffer) -&gt; Hash Digest</text>
  <text x="470" y="168" class="dim">Computes content-addressable key</text>

  <line class="flow" x1="605" y1="180" x2="605" y2="204" marker-end="url(#a6)"/>

  <rect class="fill" x="455" y="204" width="300" height="48"/>
  <text x="470" y="224" class="b">Write Hash -&gt; Data + Metadata</text>
  <text x="470" y="240" class="dim">Stores raw binary in IndexedDB SvBlobPool</text>

  <line class="flow" x1="605" y1="252" x2="605" y2="276" marker-end="url(#a6)"/>

  <rect class="fill" x="455" y="276" width="300" height="48"/>
  <text x="470" y="296" class="b">Domain Node Stores Hash String</text>
  <text x="470" y="312" class="dim">Slot holds hash ref string ("hash:...")</text>

  <line class="flow" x1="605" y1="324" x2="605" y2="348" marker-end="url(#a6)"/>

  <rect class="fill" x="455" y="348" width="300" height="60"/>
  <text x="470" y="368" class="b">Orphan Blob Purge</text>
  <text x="470" y="386" class="dim">Deletes binary blobs not in GC referenced</text>
  <text x="470" y="400" class="dim">hash set</text>

  <!-- Bridge Arrow from Object Pool GC to Blob Store GC -->
  <line class="flow" x1="365" y1="378" x2="455" y2="378" marker-end="url(#a6)"/>
</svg>

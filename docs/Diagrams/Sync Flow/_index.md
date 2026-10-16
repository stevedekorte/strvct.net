# View ↔ Model ↔ Storage Syncing

A user or agent mutation is validated by the setter, then broadcast through the notification center. View and storage layers schedule their work end-of-event-loop.

<svg viewBox="0 0 820 520" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Step 1: User Event Input -->
  <rect class="box" x="240" y="20" width="340" height="45"/>
  <text x="255" y="46" class="b">User Event / Agent Patch Input</text>

  <line class="flow" x1="410" y1="65" x2="410" y2="90" marker-end="url(#a3)"/>

  <!-- Step 2: SvNodeView -->
  <rect class="fill" x="240" y="90" width="340" height="50"/>
  <text x="255" y="110" class="b">SvNodeView Action Handler</text>
  <text x="255" y="128" class="dim">Processes UI gesture &amp; calls model setter</text>

  <line class="flow" x1="410" y1="140" x2="410" y2="165" marker-end="url(#a3)"/>

  <!-- Step 3: SvNode Setter -->
  <rect class="fill" x="240" y="165" width="340" height="50"/>
  <text x="255" y="185" class="b">SvNode Setter</text>
  <text x="255" y="203" class="dim">Validates type &amp; updates private slot state</text>

  <!-- Rejection Branch -->
  <line class="flow" x1="580" y1="190" x2="620" y2="190" marker-end="url(#a3)"/>
  <rect class="box" x="620" y="165" width="170" height="50"/>
  <text x="635" y="185" class="b">Rejection Response</text>
  <text x="635" y="203" class="dim">Returns slot schema</text>

  <line class="flow" x1="410" y1="215" x2="410" y2="240" marker-end="url(#a3)"/>

  <!-- Step 4: SvNotificationCenter -->
  <rect class="fill" x="240" y="240" width="340" height="50"/>
  <text x="255" y="260" class="b">SvNotificationCenter</text>
  <text x="255" y="278" class="dim">Posts "didChangeSlot" to observing targets</text>

  <!-- Split Flow to Views & Storage -->
  <line class="flow" x1="410" y1="290" x2="410" y2="315"/>
  <line class="flow" x1="210" y1="315" x2="610" y2="315"/>

  <line class="flow" x1="210" y1="315" x2="210" y2="335" marker-end="url(#a3)"/>
  <line class="flow" x1="610" y1="315" x2="610" y2="335" marker-end="url(#a3)"/>

  <!-- Left: Observing Views -->
  <rect class="fill" x="40" y="335" width="340" height="50"/>
  <text x="55" y="355" class="b">Observing Views</text>
  <text x="55" y="373" class="dim">Schedules syncFromNode() in SvSyncScheduler</text>

  <line class="flow" x1="210" y1="385" x2="210" y2="410" marker-end="url(#a3)"/>

  <rect class="box" x="40" y="410" width="340" height="45"/>
  <text x="55" y="437" class="b">Coalesced View Re-Render Pass</text>

  <!-- Right: Storage Engine -->
  <rect class="fill" x="440" y="335" width="340" height="50"/>
  <text x="455" y="355" class="b">SvObjectPool Persistence Hook</text>
  <text x="455" y="373" class="dim">addDirtyObject(self) queues record commit</text>

  <line class="flow" x1="610" y1="385" x2="610" y2="410" marker-end="url(#a3)"/>

  <rect class="box" x="440" y="410" width="340" height="45"/>
  <text x="455" y="437" class="b">Atomic IndexedDB Commit</text>

  <text x="410" y="485" text-anchor="middle" class="dim">Coalesced once per event loop. Bidirectional synchronization halts automatically when setter values converge.</text>
</svg>

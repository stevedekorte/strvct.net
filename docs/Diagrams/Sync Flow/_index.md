# View ↔ Model ↔ Storage Syncing

A user or agent mutation is validated by the setter, then broadcast through the notification center. View and storage layers schedule their work end-of-event-loop.

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
      <marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
      </marker>
    </defs>
    <rect class="box" x="290" y="20" width="240" height="42"/>
    <text x="305" y="44" class="b">user input</text>
    <line class="flow" x1="410" y1="62" x2="410" y2="95" marker-end="url(#a3)"/>
    <rect class="fill" x="290" y="95" width="240" height="52"/>
    <text x="305" y="115" class="b">SvDomView</text>
    <text x="305" y="133" class="dim">handles event, calls action</text>
    <line class="flow" x1="410" y1="147" x2="410" y2="190" marker-end="url(#a3)"/>
    <rect class="fill" x="290" y="190" width="240" height="52"/>
    <text x="305" y="210" class="b">SvNode setter</text>
    <text x="305" y="228" class="dim">validates against slotType</text>
    <line class="flow" x1="530" y1="225" x2="630" y2="225" marker-end="url(#a3)"/>
    <text x="580" y="218" text-anchor="middle" class="dim">reject</text>
    <rect class="box" x="630" y="190" width="160" height="60"/>
    <text x="645" y="214" class="b">rejection</text>
    <text x="645" y="232" class="dim">with slot schema</text>
    <line class="flow" x1="410" y1="242" x2="410" y2="285" marker-end="url(#a3)"/>
    <text x="425" y="277" class="dim">didUpdateSlot</text>
    <rect class="fill" x="290" y="285" width="240" height="52"/>
    <text x="305" y="305" class="b">SvNotificationCenter</text>
    <text x="305" y="323" class="dim">post to observers</text>
    <line class="flow" x1="410" y1="337" x2="410" y2="380"/>
    <line class="flow" x1="180" y1="380" x2="640" y2="380"/>
    <line class="flow" x1="180" y1="380" x2="180" y2="400" marker-end="url(#a3)"/>
    <line class="flow" x1="640" y1="380" x2="640" y2="400" marker-end="url(#a3)"/>
    <rect class="fill" x="60" y="400" width="240" height="52"/>
    <text x="75" y="420" class="b">observing views</text>
    <text x="75" y="438" class="dim">scheduleSyncToView</text>
    <rect class="fill" x="520" y="400" width="240" height="52"/>
    <text x="535" y="420" class="b">persistence hook</text>
    <text x="535" y="438" class="dim">addDirtyObject(self)</text>
    <line class="flow" x1="180" y1="452" x2="180" y2="495" marker-end="url(#a3)"/>
    <line class="flow" x1="640" y1="452" x2="640" y2="495" marker-end="url(#a3)"/>
    <rect class="box" x="60" y="495" width="240" height="42"/>
    <text x="75" y="519" class="b">view re-renders</text>
    <rect class="box" x="520" y="495" width="240" height="42"/>
    <text x="535" y="519" class="b">IndexedDB commit</text>
    <text x="410" y="585" text-anchor="middle" class="dim">Coalesced once per event loop. Bidirectional sync stops when values converge.</text>
  </svg>

# Boot Sequence

How the application loads from first script tag to a running app.

## Overview

The boot process has three phases: load the boot loader, load all resources via the content-addressable memory system, then create and run the app. Each phase completes fully before the next begins, so by the time application code runs, every class and resource is available.

<svg viewBox="0 0 820 690" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="abs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="40" y="20" width="740" height="130"/>
  <text x="55" y="42" class="b">1. Initial Bootstrap</text>
  <rect class="fill" x="55" y="70" width="345" height="46"/>
  <text x="70" y="90" class="b">Browser loads boot loader</text>
  <text x="70" y="108" class="dim">single script tag entry point</text>
  <rect class="fill" x="420" y="70" width="345" height="46"/>
  <text x="435" y="90" class="b">Core boot files</text>
  <text x="435" y="108" class="dim">Object, Promise, IndexedDB, HashCache, ResourceManager</text>
  <line class="flow" x1="410" y1="150" x2="410" y2="180" marker-end="url(#abs)"/>
  <rect class="box" x="40" y="180" width="740" height="214"/>
  <text x="55" y="202" class="b">2. Resource Loading</text>
  <text x="55" y="220" class="dim">ResourceManager.shared().setupAndRun()</text>
  <rect class="fill" x="55" y="235" width="710" height="30"/>
  <text x="70" y="255" class="dim">Load _index.json: resource metadata + content hashes</text>
  <rect class="fill" x="55" y="273" width="710" height="30"/>
  <text x="70" y="293" class="dim">Check HashCache: skip downloads for unchanged content</text>
  <rect class="fill" x="55" y="311" width="710" height="30"/>
  <text x="70" y="331" class="dim">Download _cam.json.zip (compressed bundle) on cache miss</text>
  <rect class="fill" x="55" y="349" width="710" height="30"/>
  <text x="70" y="369" class="dim">Evaluate CSS sequentially, then JS in dependency order; filter env-inappropriate files</text>
  <line class="flow" x1="410" y1="394" x2="410" y2="424" marker-end="url(#abs)"/>
  <rect class="box" x="40" y="424" width="740" height="214"/>
  <text x="55" y="446" class="b">3. App Creation</text>
  <text x="55" y="464" class="dim">SvApp.loadAndRunShared()</text>
  <rect class="fill" x="55" y="479" width="710" height="30"/>
  <text x="70" y="499" class="dim">Open persistent store; load root object from store</text>
  <rect class="fill" x="55" y="517" width="710" height="30"/>
  <text x="70" y="537" class="dim">Pause schedulers; setupModel(); setupUi()</text>
  <rect class="fill" x="55" y="555" width="710" height="30"/>
  <text x="70" y="575" class="dim">appDidInit fires: post notification, unhide root view, handle URL params</text>
  <rect class="fill" x="55" y="593" width="710" height="30"/>
  <text x="70" y="613" class="dim">Resume schedulers</text>
  <text x="410" y="675" text-anchor="middle" class="dim">Each phase completes before the next; application code runs only after every class and resource is available.</text>
</svg>

## 1. Initial Bootstrap

The browser loads the boot loader script. Core boot files are loaded in parallel and evaluated sequentially. These include: Object extensions, Promise extensions, IndexedDB support, HashCache, and ResourceManager.

## 2. Resource Loading

`ResourceManager.shared().setupAndRun()` drives this phase:

1. Loads `_index.json` containing resource metadata and content hashes.
2. Checks `HashCache` for cached resources — unchanged content is never re-downloaded.
3. Downloads `_cam.json.zip` (compressed content bundle) on cache miss.
4. Evaluates CSS resources sequentially (cascade order matters).
5. Filters out environment-inappropriate resources (e.g., `browser-only/` files in Node.js) via `StrvctFile.canUseInCurrentEnv()`.
6. Evaluates JavaScript resources in dependency order.

After this phase, all classes are defined and available globally. See [Headless Execution](../Headless%20Execution/) for details on how the boot sequence adapts to Node.js.

## 3. App Creation

`SvApp.loadAndRunShared()` creates the app singleton and opens the persistent store:

```
SvApp.loadAndRunShared()
  ├── setStore(defaultStore())
  ├── loadFromStore()
  │   ├── store.promiseOpen()
  │   └── store.rootOrIfAbsentFromClosure()
  └── run()
      └── setup()
          ├── pauseSchedulers()
          ├── setupModel()
          ├── setupUi()
          ├── appDidInit()
          │   ├── setHasDoneAppInit(true)
          │   ├── postNoteNamed("appDidInit")
          │   ├── unhideRootView()
          │   └── afterAppUiDidInit()
          │       ├── handleSearchParams()
          │       └── didInitPromise.resolve()
          └── resumeSchedulers()
```

Schedulers are paused during setup so that model and UI initialization don't trigger premature sync cycles. They resume once everything is wired up.

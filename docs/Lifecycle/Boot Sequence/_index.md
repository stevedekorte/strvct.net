# Boot Sequence

How the application loads from first script tag to a running app.

## Overview

The boot process has three phases: load the boot loader, load all resources via the content-addressable memory system, then create and run the app. Each phase completes fully before the next begins, so by the time application code runs, every class and resource is available.

## 1. Initial Bootstrap

The browser loads the boot loader script. Core boot files are loaded in parallel and evaluated sequentially. These include: Object extensions, Promise extensions, IndexedDB support, HashCache, and ResourceManager.

## 2. Resource Loading

`ResourceManager.shared().setupAndRun()` drives this phase:

1. Loads `_index.json` containing resource metadata and content hashes.
2. Checks `HashCache` for cached resources — unchanged content is never re-downloaded.
3. Downloads `_cam.json.zip` (compressed content bundle) on cache miss.
4. Evaluates CSS resources sequentially (cascade order matters).
5. Evaluates JavaScript resources in dependency order.

After this phase, all classes are defined and available globally.

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

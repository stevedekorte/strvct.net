# STRVCT Boot System

`source/boot/` is the part of the framework that loads the rest of it: the boot
loader, the resource manager, and the index builder that produces the files the
resource manager reads. Nothing here may depend on `source/library/` — it runs
before the library exists.

## Two generated files

The build writes two files into `build/`; the runtime reads them. Never hand-edit either.

- `_index.json` — catalog of every resource declared through the `_imports.json`
  tree: path, size, SHA-256 content hash. Binary files (images, audio, fonts) are
  listed here but their bytes are not bundled; they load individually at runtime.
- `_cam.json.zip` — compressed content-addressable bundle (`hash → file text`) of
  the text resources: `js`, `css`, `svg`, `json`, `txt`, `html` (the list is in
  `ImportsIndexer.computeCam()`). Identical content is stored once.

A `.hash` sidecar is written next to each so the runtime can check freshness
without fetching the payload.

## Commands (from the strvct root)

```bash
# Rebuild build/_index.json and build/_cam.json.zip. Run after adding/removing
# files or editing any _imports.json. Headless tests boot from this index and
# fail confusingly when it is stale.
node source/boot/index-builder/ImportsIndexer.js

# Generate _imports.json for asset directories (icons, sounds, images, …).
# SvResourcesFolder does the walk: skips dotfiles, files starting with "_",
# extensionless files, and .DS_Store.
node source/boot/index-builder/SvResourceIndexer.js ./resources/icons ./resources/sounds

# Write app-version.json (git hash, tag, timestamp) into the *site* folder that
# contains this strvct checkout — used by the app, not by strvct itself.
sh source/boot/index-builder/RecordGitHash.sh
```

## `_imports.json`

A JSON array of paths relative to the file, in load order. Entries are either
files or another `_imports.json` to descend into:

```json
[
    "SomeClass.js",
    "SomeClass_category.js",
    "subfolder/_imports.json",
    "styles.css",
    "data.json"
]
```

Order matters twice over: a base class must precede its categories, and CSS is
evaluated in declaration order so the cascade is preserved. Path components
named `browser-only` or `server-only` exclude a resource from the other
environment (`StrvctFile.canUseInCurrentEnv()`).

## Runtime sequence

1. `SvBootLoader` evaluates the boot files.
2. `SvResourceManager` fetches the small `_index.json`.
3. For each resource it checks `SvHashCache` by content hash; only on a miss does
   it download `_cam.json.zip`.
4. CSS resources are evaluated sequentially in declaration order; JS resources in
   dependency order; each resource once, even if several modules import it.
5. Every eval'd chunk ends with `//# sourceURL=strvct/…` (emitted by
   `SvHelpers.evalStringFromSourceUrl()`, `SvUrlResource.evalDataAsJS()` /
   `evalDataAsCss()`, and `SvBootLoader`) so DevTools and editors can map it.
   Format rules are in the root `CLAUDE.md` under Debugging.

## Adding a resource type to the bundle

Add the extension to the array in `ImportsIndexer.computeCam()`. Only UTF-8 text
can go in the CAM today; a binary type would need base64 encoding, which is not
implemented — leave binaries index-only and let them load on demand.

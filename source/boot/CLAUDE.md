# STRVCT Boot System Documentation

## Overview

The boot system is responsible for building and loading resources for the STRVCT framework. It uses a content-addressable memory (CAM) system for efficient resource loading and caching.

## Index-Builder System

The index-builder creates two key files that enable the framework's resource loading:
- `_index.json` - Metadata catalog with paths, sizes, and content hashes for all resources
- `_cam.json.zip` - Compressed content-addressable memory bundle with actual file contents

### Key Components

#### ImportsIndexer.js
- Main indexer that recursively walks through `_imports.json` files
- Creates the index and CAM files in the `build/` directory
- Starts from the root `_imports.json` and follows all references

#### ResourceIndexer.js
- Command-line tool that generates `_imports.json` files for resource directories
- Used to index assets like icons, sounds, images, etc.
- Example usage: `node ResourceIndexer.js ./resources/icons ./resources/sounds`

#### ResourcesFolder.js
- Helper class used by ResourceIndexer
- Recursively scans directories and creates `_imports.json` files
- File filtering rules:
  - Excludes files starting with `.` (hidden files)
  - Excludes files starting with `_`
  - Must have a file extension
  - Excludes `.DS_Store` files

## CAM File Selection

The `computeCam()` method in ImportsIndexer determines which files get included in the CAM:

```javascript
computeCam () {
    const paths = this.pathsWithExtensions(["js", "css", "svg", "json", "txt"]); // file extensions to include in cam
    const cam = {};
    paths.forEach(path => {
        const fullPath = nodePath.join(process.cwd(), path);
        const value = fs.readFileSync(fullPath, "utf8"); // TODO: encode this in case it's binary?
        const hash = this.hashForData(value);
        cam[hash] = value;
    });
    return cam;
}
```

### Important Notes:

1. **Two-Stage Process**:
   - ALL files referenced in `_imports.json` are indexed in `_index.json`
   - Only text-based files (js, css, svg, json, txt) have content stored in `_cam.json`

2. **Binary Files**:
   - Binary files (images, audio, etc.) are tracked in the index but not included in CAM
   - They're loaded separately at runtime when needed
   - Current implementation only handles UTF-8 text files

3. **Content-Addressable Storage**:
   - Files are stored by their SHA-256 hash
   - Enables deduplication - identical files stored only once
   - Allows efficient caching based on content

## _imports.json Format

Simple JSON array of relative paths:
```json
[
    "SomeClass.js",
    "subfolder/_imports.json",
    "styles.css",
    "data.json"
]
```

## Build Process

The build is typically run via:
```bash
# From GameServer directory
node ./site/strvct/source/boot/index-builder/ImportsIndexer.js
node ./site/strvct/source/boot/index-builder/ResourceIndexer.js ./strvct/resources/icons ./strvct/resources/sounds
```

## Runtime Loading

At runtime:
1. SvResourceManager loads the small `_index.json` first
2. Checks SvHashCache for cached content using hashes
3. Downloads `_cam.json.zip` if needed
4. Extracts and evaluates resources in dependency order
5. CSS evaluated sequentially, JS in dependency order

## Adding New Resource Types

To include new file types in the CAM:
1. Add the extension to the array in `computeCam()`: `["js", "css", "svg", "json", "txt", "newtype"]`
2. Ensure the file type can be read as UTF-8 text
3. For binary files, they would need base64 encoding (not currently implemented)

## Performance Considerations

- The CAM system enables efficient caching - unchanged files don't need re-downloading
- Compression reduces network transfer size
- Content hashing allows cache validation without timestamps
- Index file is small and loads quickly to determine what needs updating
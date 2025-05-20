# STRVCT Framework

STRVCT is a naked objects JavaScript framework for building dynamic web applications.

> **⚠️ IMPORTANT: This framework is still under active development and is NOT ready for external use by non-core developers. It is currently being published to npm primarily for internal use and development purposes. APIs may change without notice, and documentation is incomplete.**
>
> For more information and documentation, visit [strvct.net](https://strvct.net)

## Installation

```bash
npm install strvct
```

## Usage

```javascript
// ES Modules
import StrvctFramework from 'strvct';

// CommonJS
const StrvctFramework = require('strvct');

// Initialize the framework
const framework = new StrvctFramework({
  rootPath: 'path/to/strvct' // defaults to 'strvct'
});

// Wait for initialization to complete
framework.initialize().then(() => {
  console.log('STRVCT framework initialized');
  // Start using the framework
});
```

## Framework Features

- Naked objects pattern - domain models auto-generate their UI
- Resource loading system with content-addressable memory
- Hierarchical import system using _imports.json files
- Built-in persistence with IndexedDB
- Event handling and view system

## License

MIT
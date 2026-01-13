# STRVCT Documentation Tools

Utilities for generating documentation and visualizations from the STRVCT codebase.

## class-tree.js

Generates ASCII tree diagrams showing class inheritance hierarchies.

### Usage

```bash
# From this directory
node class-tree.js [path] [options]

# From anywhere (if made executable)
./strvct/docs/tools/class-tree.js [path] [options]
```

### Arguments

- `path` - Directory to scan (default: `../../source`)

### Options

- `--filter <pattern>` - Only show classes matching pattern (e.g., "Sv", "Uo", "Node")
- `--depth <n>` - Maximum depth to display (default: unlimited)
- `--full` - Show full file paths instead of just class names

### Examples

```bash
# Show all STRVCT framework classes
node class-tree.js

# Show only classes starting with "Sv"
node class-tree.js --filter Sv

# Show application classes (assuming run from tools dir)
node class-tree.js ../../../app --filter Uo

# Limit depth to 3 levels
node class-tree.js --filter Node --depth 3

# Show with file paths
node class-tree.js --filter View --full
```

### Example Output

```
└── ProtoClass
    ├── BMNotification
    ├── BMObservation
    ├── Protocol
    └── SvNode
        ├── SvField
        │   ├── SvActionField
        │   └── SvJsonField
        ├── SvStorableNode
        │   └── JsonGroup
        │       └── UoCharacter
        └── ViewableNode
            └── DomView
                └── NodeView
```

### Requirements

This script requires the following npm packages (already in the project):
- `acorn` - JavaScript parser
- `acorn-walk` - AST walker

These are typically already installed as part of the STRVCT development dependencies.

## Future Tools

Additional documentation tools may be added here:
- Method signature extractor
- Slot documentation generator
- Protocol compliance checker
- Notification flow visualizer


build:
  echo "TODO: build strvct and output /build folder files"

# Generate class hierarchy tree for STRVCT framework
class-tree:
  #!/bin/bash
  echo "📊 Generating STRVCT class hierarchy tree..."
  cd docs/tools
  node class-tree.js ../../source > ../class-hierarchy-tree.txt
  echo "✅ Class hierarchy written to docs/class-hierarchy-tree.txt"


# Rebuild the resource index and run every headless test (filters: just test Record Xhr)
test *ARGS:
  node tests/run-headless.js {{ARGS}}

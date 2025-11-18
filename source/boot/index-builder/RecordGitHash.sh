#!/bin/bash

# RecordGitHash.sh
# Records the current git version information to app-version.json in the site folder

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to the site folder (4 levels up from this script)
# index-builder -> boot -> source -> strvct -> site
SITE_ROOT="$( cd "$SCRIPT_DIR/../../../.." && pwd )"

# Get the git hash
GIT_HASH=$(cd "$SITE_ROOT" && git rev-parse HEAD)

# Get the latest git tag (if any)
GIT_TAG=$(cd "$SITE_ROOT" && git describe --tags --abbrev=0 2>/dev/null || echo "")

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create JSON file
cat > "$SITE_ROOT/app-version.json" << EOF
{
  "gitTag": "$GIT_TAG",
  "gitHash": "$GIT_HASH",
  "buildTimestamp": "$TIMESTAMP"
}
EOF

echo "Recorded version info to $SITE_ROOT/app-version.json"
echo "  Tag: $GIT_TAG"
echo "  Hash: ${GIT_HASH:0:7}"
echo "  Timestamp: $TIMESTAMP"

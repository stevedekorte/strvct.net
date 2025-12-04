# Steps to Publish STRVCT as an NPM Package

Follow these steps to publish the STRVCT framework as an npm package.

## ⚠️ IMPORTANT: NPM Token Migration Required

**NPM is deprecating classic tokens. All classic tokens will stop working on December 9th, 2025.**

Before you can publish, you must migrate to granular access tokens or set up automated publishing. See:
- **[TOKEN_MIGRATION_GUIDE.md](./TOKEN_MIGRATION_GUIDE.md)** - Complete migration instructions

## Preparation

1. Ensure that all files are properly organized:
   - The main entry point is at `source/module/StrvctFramework.js`
   - The `_imports.json` in `source/module/` includes StrvctFramework.js

2. Make sure your build process is working:
   - Run the build to generate the `build/_index.json` and `build/_cam.json.zip` files
   - These are required for the resource loading system to work

## Publishing Process

### Option 1: Manual Publishing (Traditional Method)

1. Ensure you have a valid granular access token (see TOKEN_MIGRATION_GUIDE.md)

2. Copy the package.json and README.md from the npm-pkg directory to the strvct root:
   ```bash
   cp npm-pkg/package.json .
   cp npm-pkg/README.md .
   ```

3. Verify your npm authentication:
   ```bash
   npm whoami
   ```

4. Publish the package:
   ```bash
   npm publish
   ```

### Option 2: Automated Publishing via GitHub Actions (Recommended)

1. Set up trusted publishing with NPM (see TOKEN_MIGRATION_GUIDE.md)

2. Go to the GitHub repository's Actions tab:
   https://github.com/stevedekorte/strvct.net/actions

3. Select "Publish to NPM" workflow

4. Click "Run workflow" and enter the version number (e.g., `0.1.2`)

5. The workflow will:
   - Update the version in package.json
   - Copy files to the root
   - Publish to NPM with provenance
   - Create a git tag and GitHub release

## Updating the Package

1. When making changes, update the version in package.json following semantic versioning:
   - Patch version for bug fixes: 0.1.0 → 0.1.1
   - Minor version for new features: 0.1.1 → 0.2.0
   - Major version for breaking changes: 0.2.0 → 1.0.0

2. Rebuild the project to update resource files:
   ```bash
   ./build.sh
   ```

3. Publish the new version:
   ```bash
   npm publish
   ```

## Integration with Consuming Applications

Applications that use the STRVCT npm package should:

1. Import the framework:
   ```javascript
   import StrvctFramework from 'strvct';
   ```

2. Initialize it:
   ```javascript
   const framework = new StrvctFramework();
   await framework.initialize();
   ```

3. Access the framework's functionality through the SvResourceManager:
   ```javascript
   const resourceManager = framework.resourceManager();
   ```
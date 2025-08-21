# Steps to Publish STRVCT as an NPM Package

Follow these steps to publish the STRVCT framework as an npm package:

## Preparation

1. Ensure that all files are properly organized:
   - The main entry point is at `source/module/StrvctFramework.js`
   - The `_imports.json` in `source/module/` includes StrvctFramework.js

2. Make sure your build process is working:
   - Run the build to generate the `build/_index.json` and `build/_cam.json.zip` files
   - These are required for the resource loading system to work

## Publishing Process

1. Copy the package.json and README.md from the npm-pkg directory to the strvct root:
   ```bash
   cp npm-pkg/package.json .
   cp npm-pkg/README.md .
   ```

2. Log in to npm (if not already logged in):
   ```bash
   npm login
   ```

3. Publish the package:
   ```bash
   npm publish
   ```

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
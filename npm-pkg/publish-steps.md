# Steps to Publish STRVCT as an NPM Package

The package is published by a GitHub Actions workflow, using npm trusted
publishing: npm accepts the workflow's GitHub identity, so there is no npm
token to create, store or rotate. npm is retiring publish tokens that bypass
2FA, so do not set one up.

## One-time setup on npmjs.com

On https://www.npmjs.com/package/strvct/access, under **Trusted Publisher**,
choose **GitHub Actions** and enter:

| Field | Value |
|---|---|
| Organization or user | `stevedekorte` |
| Repository | `strvct.net` |
| Workflow filename | `publish-npm.yml` |
| Environment name | leave blank |

Allow `npm publish`. npm drops a trusted publisher that has not published
successfully within two days of being added, so add it when you are ready to
publish.

The `repository` URL in `npm-pkg/package.json` must name the same repository
(`stevedekorte/strvct.net`), or npm rejects the publish.

## Publishing a version

1. Go to https://github.com/stevedekorte/strvct.net/actions and select
   **Publish to NPM**.
2. Click **Run workflow** and enter the version (e.g. `0.1.2`). Tick
   **dry run** to see what would be published without publishing.
3. The workflow:
   - builds `build/_index.json` and `build/_cam.json.zip` (the resource
     loading system needs them, and `build/` is not in git),
   - sets the version and copies `npm-pkg/package.json` and
     `npm-pkg/README.md` to the root,
   - publishes to npm with provenance,
   - creates the `v<version>` tag and a GitHub release.

Versions follow semantic versioning, and npm never lets a version number be
reused:

- Patch for bug fixes: 0.1.0 → 0.1.1
- Minor for new features: 0.1.1 → 0.2.0
- Major for breaking changes: 0.2.0 → 1.0.0

## Publishing by hand (fallback)

This needs two-factor authentication on your npm account; `npm publish` opens
a browser page to confirm it.

```bash
node source/boot/index-builder/ImportsIndexer.js
cp npm-pkg/package.json .       # after setting the version in npm-pkg/package.json
cp npm-pkg/README.md .
npm login
npm publish
git checkout package.json README.md   # restore the repo's own files
npm logout
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
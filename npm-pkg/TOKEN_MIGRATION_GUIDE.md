# NPM Token Migration Guide

## Background

NPM is deprecating classic tokens in favor of more secure alternatives:
- **November 5th, 2024**: Classic token creation disabled
- **December 9th, 2025**: All classic tokens will be permanently revoked

You need to migrate to either:
1. **Granular Access Tokens** (for manual publishing)
2. **Trusted Publishing with OIDC** (for automated CI/CD)

## Option 1: Migrate to Granular Access Tokens (Recommended for Manual Publishing)

### Step 1: Check for Existing Classic Tokens

Check if you have classic tokens in your `~/.npmrc` file:

```bash
cat ~/.npmrc | grep "//registry.npmjs.org/:_authToken"
```

If you see a line like `//registry.npmjs.org/:_authToken=npm_XXXXXXXXXX`, you have a classic token.

### Step 2: Create a Granular Access Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Granular Access Token"
3. Configure the token:
   - **Token Name**: `strvct-publish` (or any descriptive name)
   - **Expiration**: Choose an appropriate duration (e.g., 1 year)
   - **Packages and scopes**:
     - Select "Read and write" permissions
     - Choose "Only select packages and scopes"
     - Add `strvct` to the allowed packages
   - **Organizations**: None (unless strvct is under an org)
   - **IP allowlist**: Optional (add your IP for extra security)

4. Click "Generate Token"
5. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 3: Update Your ~/.npmrc File

Replace the old classic token with your new granular token:

```bash
# Backup your current .npmrc
cp ~/.npmrc ~/.npmrc.backup

# Edit ~/.npmrc and replace the line:
# //registry.npmjs.org/:_authToken=npm_OLD_TOKEN
# with:
# //registry.npmjs.org/:_authToken=npm_NEW_GRANULAR_TOKEN
```

Or use this one-liner (replace NEW_TOKEN with your actual token):

```bash
echo "//registry.npmjs.org/:_authToken=npm_NEW_GRANULAR_TOKEN" > ~/.npmrc
```

### Step 4: Test the New Token

```bash
cd /path/to/strvct/npm-pkg
npm whoami
```

If this shows your username, the token is working correctly.

### Step 5: Publish as Usual

Your existing publish workflow remains the same:

```bash
# Update version in package.json
# Then:
cp npm-pkg/package.json .
cp npm-pkg/README.md .
npm publish
```

## Option 2: Set Up Trusted Publishing with GitHub Actions (Recommended for Automation)

This option eliminates the need for long-lived tokens by using OpenID Connect (OIDC).

### Step 1: Configure NPM for Trusted Publishing

1. Go to https://www.npmjs.com/package/strvct/access
2. Click "Publishing Access" → "Automation tokens"
3. Click "Create token" → "GitHub Actions"
4. Configure:
   - **Repository**: `stevedekorte/strvct.net`
   - **Environment**: Leave blank for no restrictions, or set to "production"
   - **Package**: `strvct`

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/publish.yml` in the strvct repository:

```yaml
name: Publish to NPM

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (e.g., 0.1.2)'
        required: true
        type: string

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for OIDC

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Update version
        run: |
          cd npm-pkg
          npm version ${{ inputs.version }} --no-git-tag-version

      - name: Copy package files to root
        run: |
          cp npm-pkg/package.json .
          cp npm-pkg/README.md .

      - name: Publish to NPM
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Step 3: Usage

Instead of manually running `npm publish`, trigger the GitHub Action:

1. Go to https://github.com/stevedekorte/strvct.net/actions
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Enter the version number (e.g., `0.1.2`)
5. Click "Run workflow"

## Troubleshooting

### "Invalid token" error

- Ensure your token hasn't expired
- Verify the token has the correct permissions for the `strvct` package
- Make sure you're using the full token including the `npm_` prefix

### "Authentication failed" with GitHub Actions

- Verify that trusted publishing is configured correctly in NPM
- Ensure the repository name matches exactly: `stevedekorte/strvct.net`
- Check that `id-token: write` permission is set in the workflow

### "Package already published"

- You need to increment the version number in `package.json` before publishing
- NPM doesn't allow republishing the same version

## Additional Resources

- [NPM Granular Access Tokens Documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [NPM Trusted Publishing with OIDC](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Token Migration Guide](https://docs.npmjs.com/creating-and-viewing-access-tokens)

## Timeline

- **Before December 9th, 2025**: Complete migration to avoid publishing disruption
- Classic tokens will stop working on December 9th, 2025

# NPM Token Migration - Quick Start Checklist

## Immediate Action Required (Before December 9th, 2025)

Classic NPM tokens will be permanently revoked on **December 9th, 2025**.

## Quick Migration Steps

### For Manual Publishing (5 minutes)

- [ ] Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
- [ ] Click "Generate New Token" → "Granular Access Token"
- [ ] Configure:
  - Name: `strvct-publish`
  - Expiration: 1 year
  - Packages: Add `strvct` with Read+Write permissions
- [ ] Copy the token (you won't see it again!)
- [ ] Update `~/.npmrc`:
  ```bash
  echo "//registry.npmjs.org/:_authToken=YOUR_NEW_TOKEN" > ~/.npmrc
  ```
- [ ] Test with: `npm whoami`
- [ ] ✅ Done! Continue using `npm publish` as before

### For Automated Publishing (10 minutes)

- [ ] Configure NPM Trusted Publishing:
  - Go to https://www.npmjs.com/package/strvct/access
  - Click "Publishing Access" → "Automation tokens"
  - Add GitHub Actions with repository `stevedekorte/strvct.net`
- [ ] Commit the included `.github/workflows/publish-npm.yml` file
- [ ] Push to GitHub
- [ ] Test by running the workflow from GitHub Actions UI
- [ ] ✅ Done! Use GitHub Actions to publish from now on

## Full Documentation

See [TOKEN_MIGRATION_GUIDE.md](./TOKEN_MIGRATION_GUIDE.md) for detailed instructions.

## Questions?

- NPM Documentation: https://docs.npmjs.com/creating-and-viewing-access-tokens
- Community Discussion: https://github.com/orgs/community/discussions/178140

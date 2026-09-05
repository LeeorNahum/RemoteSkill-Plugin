# Releasing

`plugin.json` is the version source. The dependent surfaces and exact published file inventory
live in `scripts/release-contract.json`.

1. Set the next semantic version in `plugin.json`.
2. Run `node scripts/sync-version.mjs --write`.
3. Run `npm ci`, `npm run validate`, and `npm test`.
4. Commit the complete release state and push it through review.
5. Confirm the reviewed commit is the current `origin/main` tip, tag it as `vX.Y.Z`, and push the
   tag.

The tag workflow rejects a tag that does not resolve to the current `origin/main` tip or differs
from `plugin.json`. It stages only the contracted runtime files, creates a ZIP and SHA-256
checksum, and publishes both to the GitHub release. It does not submit to or alter any
marketplace.

## Coordinated Web release gate

Before the plugin is released, set `REMOTESKILL_PLUGIN_PATH` in the Web repository's test
environment to this candidate checkout and run its candidate contract tests. Merge the reviewed
plugin state, tag it, and wait for the GitHub release workflow and published artifact checks to
pass. Only then may the Web production publish gate use that released plugin version. The plugin
release is an input to the Web production gate, not a parallel or later step.

Validation uses canonical schemas vendored under `schemas/`. Normal validation is offline and
checks their recorded hashes. Refresh them only through the explicit network command
`node scripts/sync-schemas.mjs --refresh`, then review the generated diff.

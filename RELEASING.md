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

## OpenAI's plugin portal

OpenAI's portal takes the package as a ZIP whose root holds `plugin.json`. It reads the listing,
the review cases, and the icon from `extensions.com.openai` in `plugin.json`, and it needs one
setting the Agent Plugins MCP schema does not allow: how the server's OAuth client is registered.
`node scripts/stage-openai.mjs --output dist/openai` stages the folder with that setting added to
its copy of `mcp.json`. Zip the contents of that folder, not the folder itself, and upload it on
the listing with **Upload new version**. Reviewer credentials are entered in the portal and never
go in the package.

A change to the server's tools needs no upload: the portal rescans the live server. A change to
the bundled skill, the listing text, or the review cases needs a new version and a new ZIP.

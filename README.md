# RemoteSkill plugin

[![GitHub Release](https://img.shields.io/github/v/release/LeeorNahum/RemoteSkill-Plugin?sort=semver)](https://github.com/LeeorNahum/RemoteSkill-Plugin/releases/latest)

Connects an agent to your global [RemoteSkill](https://remoteskill.md) library through
`https://mcp.remoteskill.md/mcp`. The plugin ships both the
[Agent Plugins 1.0.0](https://agent-plugins.org) manifests (`plugin.json`, `mcp.json`) and a
Claude Code adapter (`.claude-plugin/`, `.mcp.json`). Compatible hosts can expose its bundled
Agent Skill from the plugin installation, independently of the current project directory. The
package cannot force a host to expose or select that skill, load the catalog, or pass either one
into subagents.

## Tools

- `list_skills` loads the catalog and `read_skill` loads one skill or bundled file.
- `create_skill` creates a hosted skill from its complete `SKILL.md`.
- `write_skill_file`, `edit_skill_file`, and `delete_skill_file` manage hosted skill files by
  stable skill ID.
- `add_skills` imports repository or share links, and `remove_skills` removes skills by stable
  ID.

These operations describe the current public tool surface. Agents should use the MCP server's
live tool list as the authority rather than relying on a fixed count. Skills carrying
`sourceUrl` or `sharedBy` are read-only mirrors. Hosted skills with neither field can be edited.

## Connection

If the host reports that authentication is required, use the host's MCP authentication flow.
If the tools are already available, no separate sign-in step is needed. See [SETUP.md](SETUP.md)
for the Claude Code path and portable troubleshooting guidance.

The server uses Streamable HTTP and currently accepts only MCP revision `2026-07-28`. If it
returns `UnsupportedProtocolVersionError` (`-32022`), update the client. Installing this package
does not guarantee protocol compatibility, and reinstalling it cannot add support to the client.

## Install

```bash
# Codex
codex plugin marketplace add LeeorNahum/RemoteSkill-Plugin
codex plugin add remoteskill@remoteskill

# Claude Code
/plugin marketplace add LeeorNahum/RemoteSkill-Plugin
/plugin install remoteskill@remoteskill

# Cursor
git clone https://github.com/LeeorNahum/RemoteSkill-Plugin ~/.cursor/plugins/local/remoteskill
```

VS Code users can clone the repository and add its directory to `chat.pluginLocations` in user
settings.

## Update

First refresh the marketplace metadata, then refresh the installed package:

```bash
# Codex
codex plugin marketplace upgrade remoteskill
codex plugin add remoteskill@remoteskill

# Claude Code
claude plugin marketplace update remoteskill
claude plugin update remoteskill@remoteskill
```

Start a new session after the package update so the host can rediscover its manifests, tools, and
skills. Hosted RemoteSkill library changes are live on the next MCP read, but content already read
into an existing conversation can remain stale. Refresh the catalog and re-read changed skills
after a library update.

Licensed under the [Apache License 2.0](LICENSE).

# RemoteSkill plugin

[![GitHub Release](https://img.shields.io/github/v/release/LeeorNahum/RemoteSkill-Plugin?sort=semver)](https://github.com/LeeorNahum/RemoteSkill-Plugin/releases/latest)

Connects an agent to your global [RemoteSkill](https://remoteskill.md) library through
`https://mcp.remoteskill.md/mcp`. The plugin ships both the
[Agent Plugins 1.0.0](https://agent-plugins.org) manifests (`plugin.json`, `mcp.json`) and a
Claude Code adapter (`.claude-plugin/`, `.mcp.json`). Compatible hosts expose its bundled Agent
Skill from the plugin installation, independently of the current project directory. That skill's
description repeats the instruction the server's own instructions open with: call `list_skills` before
the first reply, then `read_skill` for each skill that applies. The plugin runs no hooks and holds
none of your library, so every list and read comes from the server at that moment. No
instruction can guarantee that an agent follows every matching skill, and each host controls
whether it shows the bundled skill to subagents.

## Tools

- `list_skills` loads the catalog and `read_skill` loads one skill or bundled file.
- `create_skill` creates a hosted skill from its complete `SKILL.md`.
- `write_skill_file`, `edit_skill_file`, and `delete_skill_file` manage the files of a skill
  with no update source, by stable skill ID.
- `add_skills` imports repository or share links, and `remove_skills` removes skills by stable
  ID.

The server also offers every skill as a resource, which a host can show as a file to attach, and
as a prompt, which a host can show as a slash command. Both are for a person to pick by hand.

These operations describe the current public tool surface. Agents should use the MCP server's
live tool list as the authority rather than relying on a fixed count. Skills carrying
`sourceUrl` or `sharedBy` update from that source and are read-only until the user detaches
them in RemoteSkill, which keeps the files, stops the updates, and makes them editable. The user
detaches one by saving a change to it in RemoteSkill, which asks first, or from its menu. Skills
with neither field can be edited.

## Connection

If the host reports that authentication is required, use the host's MCP authentication flow.
If the tools are already available, no separate sign-in step is needed. See [SETUP.md](SETUP.md)
for the Claude Code path and portable troubleshooting guidance.

The server uses Streamable HTTP and currently accepts only MCP revision `2026-07-28`. If it
returns `UnsupportedProtocolVersionError` (`-32022`), enable or update the client's protocol
support as described in [SETUP.md](SETUP.md). Installing this package
does not guarantee protocol compatibility, and reinstalling it cannot add support to the client.

## Install

```bash
# Claude Code
/plugin marketplace add LeeorNahum/RemoteSkill-Plugin
/plugin install remoteskill@remoteskill

# Codex
codex plugin marketplace add LeeorNahum/RemoteSkill-Plugin
codex plugin add remoteskill@remoteskill
codex features enable mcp_2026_07_28
```

Codex reaches the server only with its `mcp_2026_07_28` feature on. Run `codex features list` to
see its state. The feature may be marked under development.

In the Claude app, open Customize, then Plugins, add this repository as a marketplace by its
GitHub address, and install RemoteSkill from it.

Cursor does not work yet. Its MCP client speaks revisions up to `2025-11-25`, and the server
accepts only `2026-07-28`, so the connection is refused. Checked with Cursor 3.17.19.

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

This repository is generated from RemoteSkill's own source, so a change made here directly does not
last. To suggest one, write to contact@remoteskill.md.

Licensed under the [Apache License 2.0](LICENSE).

# RemoteSkill plugin

Points an agent at your [RemoteSkill](https://remoteskill.md) library: one MCP server at
`https://mcp.remoteskill.md/mcp`, declared in both the [Agent Plugins 1.0.0](https://agent-plugins.org)
format (`plugin.json`, `mcp.json`) and Claude Code's (`.claude-plugin/`, `.mcp.json`).

Sign-in is OAuth through your agent's own prompt. Skills are per-account content served
behind that sign-in, so the plugin carries none; `skills/remoteskill/` holds only the usage
skill. A plugin installed before you sign in shows nothing until the sign-in completes,
because the format treats an unauthorized server as a failed connection.

## Tools

- `list_skills`: your catalog, every skill's name and full description.
- `read_skill`: one skill's `SKILL.md` and file manifest, or a single bundled file.
- `create_skill`: a new hosted skill, by name. An existing name is refused with every holder listed.
- `save_skill_file`, `delete_skill_file`: edit one file in a hosted skill, by the skill's stable ID.

Writes reach exactly what you could edit in the app: hosted skills nothing else updates. A
skill mirroring a GitHub repository or following someone's shared skill is read-only here.

## Where it works

The server speaks MCP revision `2026-07-28` only. Measured 2026-08-09:

| Client | Connects |
| --- | --- |
| ChatGPT | **Yes** |
| Claude Code 2.1.226 | Not yet, sends `2025-11-25` |
| Cursor 3.15.6 | Not yet, sends `2025-11-25` |
| VS Code 1.132.0 | Not yet |
| Codex CLI 0.147.0 | Not yet, sends `2025-06-18` |

Clients connect without any plugin change once they ship the current revision.

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

VS Code: clone anywhere, then add the directory to `chat.pluginLocations` in user settings.

A test in the RemoteSkill repository asserts both manifests equal the endpoint the
deployment advertises, so they cannot silently diverge.

# RemoteSkill plugin

[![GitHub Release](https://img.shields.io/github/v/release/LeeorNahum/RemoteSkill-Plugin?sort=semver)](https://github.com/LeeorNahum/RemoteSkill-Plugin/releases/latest)

Points an agent at your [RemoteSkill](https://remoteskill.md) library: one MCP server at
`https://mcp.remoteskill.md/mcp`, declared in both the [Agent Plugins 1.0.0](https://agent-plugins.org)
format (`plugin.json`, `mcp.json`) and Claude Code's (`.claude-plugin/`, `.mcp.json`).

Sign-in is OAuth through your agent's own prompt. Skills are per-account content served
behind that sign-in, so the plugin carries none; `skills/remoteskill/` holds only the usage
skill. A plugin installed before you sign in shows nothing until the sign-in completes,
because the format treats an unauthorized server as a failed connection.

## Tools

- `list_skills`: your catalog, every skill's name and full description, each with its ID and URL.
- `read_skill`: one skill's `SKILL.md` and file manifest, or a single bundled file.
- `create_skill`: a new hosted skill from the `SKILL.md` you give it, which carries the name in its
  frontmatter. An existing name is refused with every holder listed.
- `write_skill_file`, `edit_skill_file`, `delete_skill_file`: change one file in a hosted skill, by
  the skill's stable ID. Write sends the whole file; edit replaces one exact fragment.
- `add_skill`: add one skill from one link, either a GitHub link to its `SKILL.md` on a branch or a
  RemoteSkill share link. A repository on its own is refused, because it may hold many skills.

Writes reach exactly what you could edit in the app: hosted skills nothing else updates. A
skill mirroring a GitHub repository or following someone's shared skill is read-only here.

## Where it works

The server speaks MCP revision `2026-07-28` only. Each row carries the date it was measured,
because they were not all measured on the same day:

| Client | Connects | Measured |
| --- | --- | --- |
| Claude Code 2.1.229 | **Yes**, sends `2026-07-28` | 2026-08-13 |
| claude.ai | **Yes** | 2026-08-13 |
| ChatGPT | **Yes** | 2026-08-09 |
| Cursor 3.15.6 | Not yet, sends `2025-11-25` | 2026-08-09 |
| VS Code 1.132.0 | Not yet | 2026-08-09 |
| Codex CLI 0.147.0 | Not yet, sends `2025-06-18` | 2026-08-09 |

Claude Code was measured on the wire: a local server logged its requests, and it sent
`MCP-Protocol-Version: 2026-07-28` with `server/discover` as its first call, never `initialize`.
The claude.ai row is weaker evidence, measured in the product rather than on the wire: the
connection is healthy and all seven tools are listed, split two and five by their read-only and
destructive annotations, which needs a completed `tools/list` to render. Claude Desktop is not in
the table because it was not tested.

The rows still at "not yet" connect without any plugin change once they ship the current
revision, which is exactly what Claude Code did between 2.1.226 and 2.1.229.

## Connecting

The server is OAuth, so a fresh install reports `! Needs authentication` and shows no tools until
you sign in. That is the first state, not a fault. `SETUP.md` walks an agent through the
connection, and in Claude Code the manual path is `/mcp`, then `plugin:remoteskill:remoteskill`,
then Authenticate.

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

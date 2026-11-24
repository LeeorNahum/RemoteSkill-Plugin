# RemoteSkill Plugin

This repository is the RemoteSkill agent plugin: the `remoteskill` skill and the connection to RemoteSkill's MCP server, packaged for each agent host. RemoteSkill publishes it from its own source, and each publish replaces the files of this published repository, so a change made here directly does not last and stops the next publish. To suggest a change, write to contact@remoteskill.md.

## Layout

| Path | What it is |
| --- | --- |
| `plugin.json` | The plugin's name, version, description, links, and OpenAI listing, in Agent Plugins format, read by Codex, Cursor, and OpenAI's plugin portal |
| `mcp.json` | The MCP connection in Agent Plugins format |
| `.claude-plugin/plugin.json`, `.mcp.json`, `.claude-plugin/marketplace.json` | Claude Code's descriptors, which Codex's marketplace also reads. `.mcp.json` names the transport `http`, Claude Code's word for what Agent Plugins' `mcp.json` calls `streamable-http` |
| `skills/remoteskill/` | The skill |
| `assets/icon.png` | The icon hosts show |
| `.github/workflows/release.yml` | Attaches a ZIP of the plugin and its checksum to each release tag |

Every descriptor is written from `plugin.json`, so they always carry the same name, version, and server address. Branch `main` connects to RemoteSkill, `preview` to its staging copy, and `dev` to a server on `localhost`.

To try the plugin from a clone, load the folder directly, such as `claude --plugin-dir <clone>`. `claude plugin validate --strict <clone>` checks it.

# RemoteSkill plugin

One manifest that points an agent at your [RemoteSkill](https://remoteskill.md) library.

RemoteSkill hosts your Agent Skills once and serves them to every agent through a read-only MCP server. This repository is the plugin that installs that server. It is an [Agent Plugins 1.0.0](https://agent-plugins.org) plugin, and the same directory also carries Claude Code's own plugin shape, so one repository serves both.

**The plugin carries no skill content, and that is correct rather than a limitation.** Skills are per account, private, and served live behind a sign-in. A plugin is a static directory that every installer receives identically, so baking skills into it would publish private material and be stale the moment you edited a skill. The plugin declares exactly one thing: where your library lives. It is the front door, not the house.

## What is in here

| File | Read by |
| --- | --- |
| `plugin.json` | Agent Plugins 1.0.0 clients (VS Code, Cursor, GitHub Copilot, ChatGPT, Codex, Kiro, Hermes) |
| `mcp.json` | The same clients, for the MCP server declaration |
| `.claude-plugin/plugin.json` | Claude Code |
| `.claude-plugin/marketplace.json` | Claude Code, and Codex, which reads this catalog format too |
| `.mcp.json` | Claude Code, for the MCP server declaration |

Both manifests declare one Streamable HTTP server at `https://mcp.remoteskill.md/mcp`, and nothing else. There is no `skills/` directory, no `headers` key, and no credential of any kind. Agent Plugins 1.0.0 section 7.2.1 is explicit that header values are visible package data, so the correct expression of "authorization is the client's job" is to omit the field entirely.

## Signing in

The plugin holds no credential and needs none. Your agent connects to the server, gets an OAuth challenge, and shows you its own sign-in prompt. You authorize RemoteSkill once in a browser, your agent stores the token, and later sessions just work.

One consequence is worth knowing before you install: Agent Plugins 1.0.0 makes an authorization failure a connection failure rather than a configuration error, so **a plugin installed before you sign in looks like nothing happening**. That is expected. Install it, then complete the sign-in your agent offers.

Two read-only tools arrive with the connection:

- `list_skills` returns your catalog, every skill's name and its full description.
- `read_skill` returns one skill's `SKILL.md`, plus its file manifest, or a single bundled file.

Nothing here can write to your library.

## Where it works today

Every client below loads the plugin. Whether the server then connects depends on which MCP protocol revision the client speaks, because `mcp.remoteskill.md` serves revision `2026-07-28` and only that revision.

| Client | Plugin loads | Speaks `2026-07-28` | Connects today |
| --- | --- | --- | --- |
| ChatGPT (web, desktop, mobile) | Yes | Yes | **Yes** |
| Claude Code 2.1.226 | Yes | No, sends `2025-11-25` | Not yet |
| Cursor 3.15.6 | Yes | No, sends `2025-11-25` | Not yet |
| VS Code 1.132.0 | Yes | No, `2026-07-28` is absent from the build | Not yet |
| Codex CLI 0.147.0 | Yes | No, sends `2025-06-18` | Not yet |

Measured on 2026-08-09 by pointing each client at a loopback server that logs the revision it puts on the wire. "Not yet" means the client's own MCP implementation has not moved to the current revision, not that anything here is misconfigured. Those clients will connect without any change to this plugin once they do, which is why the entries are published now.

If you use Claude in the browser or the desktop app, there is no plugin install path there at all. Add RemoteSkill as a connector instead.

## Install

**ChatGPT and Codex.** Search the plugin directory for RemoteSkill once it is listed. Until then, Codex can install it straight from this repository:

```bash
codex plugin marketplace add LeeorNahum/RemoteSkill-Plugin
codex plugin add remoteskill@remoteskill
```

**Claude Code.** This repository is a marketplace as well as a plugin:

```
/plugin marketplace add LeeorNahum/RemoteSkill-Plugin
/plugin install remoteskill@remoteskill
```

**Cursor.** Clone into Cursor's local plugin directory:

```bash
git clone https://github.com/LeeorNahum/RemoteSkill-Plugin ~/.cursor/plugins/local/remoteskill
```

**VS Code and GitHub Copilot.** Clone anywhere, then point VS Code at the directory in your user settings:

```json
"chat.pluginLocations": {
  "/absolute/path/to/RemoteSkill-Plugin": true
}
```

`Chat: Install Plugin From Source` in the Command Palette installs from a git URL instead. VS Code starts a plugin's MCP servers when you open the Chat view, not at launch.

## Versioning

The endpoint in this repository is production. Staging is exercised with each client's local plugin directory rather than with a second published variant, which is what those directories are for.

The URL is deliberately restated in two files, one per manifest format. A test in the RemoteSkill repository fetches both of them and asserts they equal the endpoint the deployment itself advertises, so the two cannot silently diverge.

## License

MIT. See [LICENSE](LICENSE).

---
name: "remoteskill-setup"
description: "Connect this plugin's RemoteSkill MCP server. Use when the server requests authentication, its tools are unavailable, or someone asks how to connect RemoteSkill."
---

# Connecting RemoteSkill

The plugin declares one remote MCP server, `remoteskill`, at
`https://mcp.remoteskill.md/mcp`. It needs no API key, custom header, environment variable, or
project-local file.

## Connect when the host asks

If the RemoteSkill tools are already present, confirm the connection with `list_skills` and do
not force another sign-in. If the host reports that the server needs authentication, use that
host's MCP authentication flow. Hosts may expose an authentication action, open a browser flow,
or ask for a callback URL. Follow the interface the host actually provides.

In Claude Code, open `/mcp`, select `plugin:remoteskill:remoteskill`, and choose
**Authenticate**. The user completes the browser sign-in. If a remote environment cannot receive
the localhost callback, use the completion action offered by the host and provide the full
callback URL only when it asks for it.

## Confirm the result

Call `list_skills`. A returned catalog means the connection works. An empty catalog is valid for
an account with no saved skills. Do not retry authentication merely because the list is empty.

If the server instead reports an unsupported MCP protocol revision, enable or update the
client's protocol support. If the endpoint is unreachable, check ordinary HTTPS connectivity.
Do not infer a credential problem from either condition.

### Codex protocol support

Run `codex features list`. If it lists `mcp_2026_07_28` as disabled, start the session with
`codex --enable mcp_2026_07_28`. This feature may be marked under development. Enabling it
for that invocation opts into experimental protocol support without changing global settings.
If the flag is unavailable and the connection still reports an unsupported revision, update
to a client release that supports the server's revision. Installing the plugin cannot add
protocol support to the client.

### Claude Code connection checks

Confirm the connection with a real `list_skills` call in a fresh session. A standalone
`claude mcp get` health probe can negotiate a different revision from an actual session.
If the session call succeeds, a failing standalone probe does not justify another sign-in.

The Claude Code adapter injects a small selection reminder before each user prompt and when each
child agent starts. The reminder tells Claude to invoke the bundled bootstrap. That bootstrap
reuses a current catalog or calls `list_skills`, inspects every description, and directs Claude to
read applicable skill bodies before proceeding. The hook contains no catalog or skill content and
does not fetch the catalog. Its local command has a ten-second timeout. If the server is disconnected or
authentication is unavailable, the reminder still runs, but later RemoteSkill tool calls cannot
succeed until the connection is restored.

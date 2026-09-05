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

If the server instead reports an unsupported MCP protocol revision, update the client. If the
endpoint is unreachable, check ordinary HTTPS connectivity. Do not infer a credential problem
from either condition.

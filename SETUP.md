---
name: remoteskill-setup
description: Connect this plugin's RemoteSkill MCP server. Use when the plugin is installed but its server reports that it needs authentication, when its tools are missing from the session, or when someone asks how to sign in to RemoteSkill.
---

# Connecting RemoteSkill

The plugin ships one remote MCP server, `remoteskill`, at `https://mcp.remoteskill.md/mcp`.
There is nothing to configure: no API key, no header, no environment variable, and no file to
edit. The whole of setup is one sign-in, and until it happens the server is unauthenticated
rather than broken.

## Expect this on the first run

A freshly installed plugin reports its server as needing authentication, and none of its tools
appear. In Claude Code that reads:

```
plugin:remoteskill:remoteskill: https://mcp.remoteskill.md/mcp (HTTP) - ! Needs authentication
```

That is the server answering `401` with the `WWW-Authenticate` challenge that begins OAuth, which
is the designed first state. Do not report it as a failure, do not reinstall the plugin, and do
not go looking for a credential to paste somewhere.

## Connect it

The server's name inside the plugin is `remoteskill`. A host may prefix it, so Claude Code
addresses it as `plugin:remoteskill:remoteskill`.

**If the host offers an authenticate tool for this server, that is the path.** A host that knows
a bundled server is unauthenticated exposes two tools for it in place of the server's real ones:
one that starts the flow and one that finishes it from a callback URL. Call the first with no
arguments. It answers with an authorization URL. Hand that URL to the person rather than trying
to open it yourself, because the sign-in is theirs. When they finish, the server's seven real
tools appear on their own and the two setup tools go away.

If their browser lands on a `http://localhost:<port>/callback?code=...` page that does not load,
which is what happens when the agent runs somewhere that browser cannot reach, ask for the full
URL out of the address bar and pass it to the second tool. The code in that URL is what completes
the exchange, and the page failing to render does not invalidate it.

**If the host offers no such tool**, hand the person the host's own command. In Claude Code that
is `/mcp`, then `plugin:remoteskill:remoteskill`, then Authenticate.

Sign-in is Google, GitHub, or email, and it creates the RemoteSkill account if there is not one
yet. GitHub sign-in is identity only: it grants no repository access, which comes separately from
installing the RemoteSkill GitHub App at <https://remoteskill.md>.

## Confirm it worked

Call `list_skills`. A catalog coming back, however short, means the connection is live.

**An empty catalog is a working connection, not a failed one.** Skills are per-account content
and the plugin carries none of them, so a new account has nothing to list. Say that plainly
instead of retrying, and point the person at <https://remoteskill.md> to import from GitHub or
upload, or offer `add_skills` if they are already holding links to skills.

## When the problem is not the sign-in

The server speaks MCP revision `2026-07-28` and nothing else. A client on an older revision is
refused with `UnsupportedProtocolVersionError` (`-32022`), listing `2026-07-28` as the only
version it supports, and that refusal survives any amount of signing in. When that is the error,
the fix is a current client rather than a credential, and nothing in the plugin needs to change.
Claude Code 2.1.229 was measured sending `2026-07-28` on 2026-08-13.

Everything else is ordinary. The endpoint has to be reachable over HTTPS, and a connection that
worked before and now asks for authentication again is asking for the same sign-in again.

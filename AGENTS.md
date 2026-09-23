# RemoteSkill Plugin

This repository is the client half of RemoteSkill: the Claude Code plugin manifest, the MCP connection, the hooks, and the remoteskill skill an agent loads. It is public and stays slim: no planning, no server code, no Context directory.

The server, the MCP tools, the web app, and the planning records live in the RemoteSkill-Web repository beside this one, under RemoteSkill/Web. A change here to the tool surface, the OAuth flow, the hook contract, or the skill's wording is checked against that repository, and a change there is checked against this one. Read SETUP.md and RELEASING.md before changing how the plugin installs or ships.

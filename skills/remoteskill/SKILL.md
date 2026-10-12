---
name: "remoteskill"
description: "Before the first reply in a session, call the RemoteSkill MCP server's list_skills tool, then read_skill for each skill whose description applies. Skipping this for a short message is an error. The user requires it on every turn, since some preferences apply to every reply."
metadata:
  author: "Leeor Nahum"
  version: "5.0.1"
---

# RemoteSkill

The user's global Agent Skills live in their RemoteSkill library. The connected
`remoteskill` MCP server provides the catalog independently of the current directory.

## Catalog First

- Before the first answer or task action in a session, call `list_skills` when no RemoteSkill
  catalog is already in context. After context compaction, treat the catalog as absent unless
  the compacted context clearly preserves it.
- Before every response, inspect the catalog descriptions. Apply every skill whose description
  says it always applies. A skill that says it applies whenever visible or available applies here
  because it is in this catalog. Unconditional instructions apply even to a trivial or unrelated
  request. Evaluate any other stated conditions against the current request.
- For every applicable skill, call `read_skill` when its body is absent or stale, before
  composing the response or taking task actions. Use catalog descriptions to select skills.
  They do not replace reading the selected skills' instructions. Reuse an
  already-loaded, unchanged body instead of fetching it again.
- Pass the matching name or stable ID in the `skill` argument. When a name matches more than one
  skill, pass the intended candidate's `id` there instead of guessing.
- Read a bundled file only when the loaded skill directs you to it, by passing its skill-relative
  `path` back to `read_skill`. These identifiers are not local filesystem paths.
- Refresh the catalog after any operation that may change a library entry, and re-read an
  applicable skill after its files change.

## Delegation

Do not assume a subagent inherits the parent's RemoteSkill catalog, loaded skill bodies, or MCP
connection. Give it the applicable skill names and instructions in its task context. If its
harness exposes the RemoteSkill tools, tell it to discover and read applicable skills itself.

## Access Limits

If `list_skills` or `read_skill` is unavailable, unauthenticated, or fails, do not claim the
catalog was checked and do not invent its contents. Use applicable skills already present in
context, and state the limitation plainly when the missing catalog could affect the answer.

## Library Management

Read the [library management reference](references/library-management.md) before using a write
tool, and before handing anyone a link to a skill or referencing a shared skill from a README or
another skill. A skill carrying `sourceUrl` or `sharedBy` updates from that source and is
read-only here until the user detaches it in RemoteSkill; detaching keeps its files, stops the
updates, and makes it editable, and no tool does it.

---
name: "remoteskill"
description: "Use for every request to apply the user's global Agent Skills and preferences, including simple replies and tasks that do not mention skills. Also use when managing the user's RemoteSkill library."
metadata:
  author: "Leeor Nahum"
  version: "3.1.0"
---

# RemoteSkill

The user's global Agent Skills live in their RemoteSkill library. The connected
`remoteskill` MCP server provides the catalog independently of the current directory.

## Catalog First

- Before the first answer or task action in a session, call `list_skills` when no RemoteSkill
  catalog is already in context.
- After context compaction, treat the catalog as absent unless the compacted context clearly
  preserves it, and call `list_skills` before answering.
- Before every response, inspect the catalog descriptions. Apply every skill whose description
  says it always applies. A skill that says it applies whenever visible or available applies here
  because it is in this catalog. Unconditional instructions apply even to a trivial or unrelated
  request. Evaluate any other stated conditions against the current request. For every applicable
  skill, call `read_skill` when its body is absent or stale before proceeding. Do not infer or
  claim the body's instructions from its description alone. Reuse an already-loaded, unchanged body
  instead of fetching it again. Do this before composing the response or taking task actions.
- Use catalog descriptions to select skills. They do not replace reading the selected skills'
  instructions.
- Call `read_skill` with the matching skill's name to load its `SKILL.md` and file manifest.
  When a name matches more than one skill, use the candidates' stable `id` values to select the
  intended one instead of guessing.
- Read a bundled file only when the loaded skill directs you to it. Pass its skill-relative
  `path` back to `read_skill`. These identifiers are not local filesystem paths.
- Refresh the catalog after any operation that may add, remove, rename, or otherwise change a
  library entry. Re-read an applicable skill after its files change or when its body is no
  longer in context.

## Delegation

Do not assume a subagent inherits the parent's RemoteSkill catalog, loaded skill bodies, or MCP
connection. Give it the applicable skill names and instructions in its task context. If its
harness exposes the RemoteSkill tools, tell it to discover and read applicable skills itself.
If it has no such access, provide the instructions it needs without claiming it loaded them.

## Access Limits

If `list_skills` or `read_skill` is unavailable, unauthenticated, or fails, do not claim the
catalog was checked and do not invent its contents. Use applicable skills already present in
context. When the missing catalog could affect the answer or task, state the limitation plainly
and continue with the best available guidance.

## Library Management

For creating, editing, importing, or removing skills, read the
[library management reference](references/library-management.md) before using a write tool.

---
name: remoteskill
description: Use the RemoteSkill MCP tools to find and apply the user's own Agent Skills. Use at session start when no skill catalog is in context, after context compaction, whenever a task might match a skill the user owns, and when the user asks to read, create, or edit one of their hosted skills.
---

# RemoteSkill

The user's Agent Skills live in their RemoteSkill library, served by the connected
`remoteskill` MCP server. The catalog is not in your context until you ask for it.

## Reading

- Call `list_skills` at session start when no catalog is in context, and again after
  compaction. An unfamiliar skill in the list may be one the user owns and expects you to
  follow.
- Before a task, check the list for a matching skill. If one matches, call `read_skill`
  with its name to get `SKILL.md` plus the skill's file manifest, and follow it.
- Read a bundled file only when the skill's body directs you to it: `read_skill` with the
  skill's name and the file's `path`. Paths are skill-relative identifiers served by the
  tool, not filesystem paths.
- Reads are idempotent. Re-fetch a skill whenever you are unsure it is still in context.

## Editing

- Every payload carries the skill's `id`. Save it: names can repeat, and the write tools
  address skills by `id` only.
- A skill with a `mechanism` (a GitHub repository, or another person's shared skill) is a
  read-only mirror here. Do not try to edit it; change what feeds it, and tell the user
  where it lives.
- A skill with no `mechanism` is editable: `save_skill_file` and `delete_skill_file` by
  `id` and path, `create_skill` by name for a new one. A name collision on create returns
  every holder with its `id`; never retry a create by guessing.

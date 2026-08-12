---
name: remoteskill
description: Use the RemoteSkill MCP tools to find and apply the user's own Agent Skills. Use at session start when no skill catalog is in context, after context compaction, whenever a task might match a skill the user owns, when the user asks to read, create, or edit one of their hosted skills, and when they hand over a link to a skill and want it added to their library.
---

# RemoteSkill

The user's Agent Skills live in their RemoteSkill library, served by the connected
`remoteskill` MCP server. The catalog is not in your context until you ask for it.

## Reading

- Call `list_skills` at session start when no catalog is in context, and again after
  compaction. An unfamiliar skill in the list may be one the user owns and expects you to
  follow.
- Before a task, check the list for a matching skill. If one matches, call `read_skill`
  with its name to get `SKILL.md` plus the skill's file manifest, and follow it. A name
  two skills share answers with both, each with its `id`; ask again by `id`.
- Read a bundled file only when the skill's body directs you to it: `read_skill` with the
  skill's name and the file's `path`. Paths are skill-relative identifiers served by the
  tool, not filesystem paths.
- Reads are idempotent. Re-fetch a skill whenever you are unsure it is still in context.

## Editing

- Every payload carries the skill's `id` and its `url`. Save the `id`: names can repeat,
  and the write tools address skills by `id` only. The `url` is the page the user reads
  the skill on, and the link to hand them.
- A skill with a `mechanism` (a GitHub repository, or another person's shared skill) is a
  read-only mirror here. Do not try to edit it; change what feeds it, and tell the user
  where it lives.
- A skill with no `mechanism` is editable, by `id` and path: `write_skill_file` sends a
  whole file, `edit_skill_file` replaces one exact fragment that must appear exactly once,
  and `delete_skill_file` removes a bundled file. Prefer the exact edit for a small change
  in a long file; a file too large to hold inline is refused there and names
  `write_skill_file` instead.
- `create_skill` takes the new skill's `SKILL.md` content and nothing else: its frontmatter
  is the name and the description. Writing `SKILL.md` later works the same way, so changing
  the frontmatter name renames the skill. A name collision on create returns every holder
  with its `id`; never retry a create by guessing.

## Adding from a link

- When the user hands you a link to a skill, or points you at one you can see, call
  `add_skill` with that one link. Two kinds work: a GitHub link to the skill's `SKILL.md` on
  a branch (the `blob` address, the `raw.githubusercontent.com` spelling of the same file, or
  the `/tree/` link to the directory it sits in), and a RemoteSkill share link somebody sent
  them.
- A skill is a directory holding a `SKILL.md`, so the link has to name that one directory. A
  repository on its own is refused rather than guessed at, because it may hold many skills.
- One link per call, and there is no batch argument. Five links are five calls, each with its
  own outcome and its own failure.
- `mode` is for share links only and defaults to following the person who shared it, which
  stops working if they stop sharing. `copy` takes a detached copy that is the user's to edit
  and never updates again.
- Read the result rather than assuming one. `outcome: updated` means the user already had a
  skill fed by that repository directory and it was refreshed, not that a second one appeared.
  A name one of their skills already wears is kept beside it rather than replacing it, so hand
  them the `url` in the result, which is what tells the two apart.

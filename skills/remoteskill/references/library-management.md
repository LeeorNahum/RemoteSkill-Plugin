# Library Management

Use the stable `id` returned by `list_skills` or `read_skill` for every write. Names can repeat,
and write tools never address a skill by name. Return the skill's `url` when the user needs a
link to the result.

## What each entry says about editing

A skill with `sourceUrl` mirrors a GitHub repository. A skill with `sharedBy` follows another
person's shared skill. Either one updates from that source and is read-only here until
the user detaches it in RemoteSkill; detaching keeps its files, stops the updates, and makes it
editable, and no tool does it.
A skill with neither field has no update source and can be edited by stable `id`. Never
collapse these fields into an invented wrapper. For a read-only entry, do not attempt a
RemoteSkill write against it, because the write is refused: tell the user where it updates from
and that detaching it in RemoteSkill makes it editable, or change the repository identified by
`sourceUrl` outside RemoteSkill.

Every entry also carries `tokens` (`skillMd` for SKILL.md alone and `total` for every text
file), which is what reading it costs.

## Creating and editing

- `create_skill` accepts the complete new `SKILL.md`. Its frontmatter supplies the name and
  description. A name collision lists every holder with its `id`. Do not retry by guessing.
- `write_skill_file` replaces a complete text file or creates it when absent.
- `edit_skill_file` replaces one exact fragment that must occur exactly once. Read the current
  file first and include enough surrounding text to make the match unique.
- `delete_skill_file` removes one bundled file. It cannot remove `SKILL.md`.
- Writing `SKILL.md` can rename a skill. Continue with the name and identity returned by the
  write result.

## Importing links

Pass each link to `add_skills` as its own item. Supported inputs identify one skill directory:
a GitHub link to its `SKILL.md` or directory, or a RemoteSkill share link. A repository root is
ambiguous and must not be guessed.

Read every per-item result. For share links, the default follows the sharer and `copy` creates a
detached editable copy. An `updated` outcome means an existing repository-backed skill was
refreshed. Give the user the returned `url`, especially when names repeat.

## Removing skills

List first, resolve the stable `id`, and ask which entry the user means when a name is ambiguous.
`remove_skills` is irreversible, but a `not_found` result makes retrying a partially completed
batch safe. Report every outcome.

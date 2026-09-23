# Library Management

Use the stable `id` returned by `list_skills` or `read_skill` for every write. Names can repeat,
and write tools never address a skill by name. Return the skill's `url` when the user needs a
link to the result.

## What each entry says about editing

A skill with `sourceUrl` mirrors a GitHub repository. A skill with `sharedBy` follows another
person's shared skill. A skill with neither is hosted by RemoteSkill and can be edited by
stable `id`.

A mirror is read-only here unless its entry carries `editing: true`, which means the user
turned editing on for it in RemoteSkill: writes then land in a working copy that every agent and
every follower receives at once, before it reaches the repository. A skill following another
person is always read-only here. Never collapse these fields into an invented wrapper. For a
read-only entry, change the repository identified by `sourceUrl`, or tell the user who owns the
source identified by `sharedBy`, and do not attempt a RemoteSkill write against it.

An entry with `pending: true` is serving an unpublished edit: what you read is the working copy,
live in RemoteSkill and not yet in its repository. Every entry also carries `changedAt` (when
its served content last changed), `checkedAt` (when its source was last checked, absent for a
hosted skill), and `tokens` (`skillMd` for SKILL.md alone and `total` for every text file).

## Creating and editing

- `create_skill` accepts the complete new `SKILL.md`. Its frontmatter supplies the name and
  description. A name collision lists every holder with its `id`. Do not retry by guessing.
- `write_skill_file` replaces a complete text file or creates it when absent.
- `edit_skill_file` replaces one exact fragment that must occur exactly once. Read the current
  file first and include enough surrounding text to make the match unique.
- `delete_skill_file` removes one bundled file. It cannot remove `SKILL.md`.
- Writing `SKILL.md` can rename a skill. Continue with the name and identity returned by the
  write result.
- Every write result carries `pending`. When it is `true`, the write landed in a mirror's
  working copy: it is live to every agent now and reaches the repository only when published.
  Tell the user so, and do not describe the write as being in GitHub.

## Publishing a working copy

`publish_skill` commits a mirror's pending edits to the branch it was imported from, as one
commit that touches only the skill's own files, authored as the user with RemoteSkill as
co-author. Call it only when the user asked to publish: the edits are already live to every
agent, so publishing changes nothing about what runs, and what it changes is the user's
repository outside RemoteSkill. It requires an entry with `editing: true` and `pending: true`.
Pass `message` when the user gave one. Read the result: `committed` carries the commit's `url`,
and `pull_request` means the branch refused a direct commit, so the same commit is waiting in a
pull request at `pullRequestUrl` and the skill stays pending until it lands. A refusal names
what the user does about it (turn editing on, approve the app's permissions on GitHub, decide a
conflict on the skill page, or wait for an earlier pull request). Do not retry a refusal.

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

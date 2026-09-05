import assert from "node:assert/strict"
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, relative, resolve, sep } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { Scalar } from "yaml"
import { frontmatterScalar, parseSkillFrontmatter, writeFrontmatterVersion } from "../scripts/frontmatter.mjs"
import { stageRelease } from "../scripts/stage-release.mjs"
import { synchronizeVersions } from "../scripts/sync-version.mjs"
import { validatePackage } from "../scripts/validate.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

async function walk(path, base = path) {
  const entries = await readdir(path, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) files.push(...await walk(child, base))
    if (entry.isFile()) files.push(relative(base, child).split(sep).join("/"))
  }
  return files.sort(compareText)
}

async function copyCandidate(context) {
  const temporary = await mkdtemp(resolve(tmpdir(), "remoteskill-plugin-test-"))
  context.after(() => rm(temporary, { recursive: true, force: true }))
  const candidate = resolve(temporary, "candidate")
  await cp(root, candidate, {
    recursive: true,
    filter: (path) => !path.includes(`${sep}.git${sep}`)
      && !path.endsWith(`${sep}.git`)
      && !path.includes(`${sep}node_modules${sep}`)
      && !path.endsWith(`${sep}node_modules`)
      && !path.includes(`${sep}dist${sep}`)
      && !path.endsWith(`${sep}dist`),
  })
  return candidate
}

test("the candidate package satisfies its release contract", async () => {
  const result = await validatePackage(root)
  const plugin = JSON.parse(await readFile(resolve(root, "plugin.json"), "utf8"))
  assert.deepEqual(result.errors, [])
  assert.equal(result.ok, true)
  assert.equal(result.version, plugin.version)
})

test("version drift fails validation", async (context) => {
  const candidate = await copyCandidate(context)

  const manifestPath = resolve(candidate, ".claude-plugin/plugin.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  manifest.version = "0.0.0"
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const result = await validatePackage(candidate)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.includes(".claude-plugin/plugin.json version")))
})

test("version generation repairs declared dependent surfaces", async (context) => {
  const candidate = await copyCandidate(context)
  const manifestPath = resolve(candidate, ".claude-plugin/plugin.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  manifest.version = "0.0.0"
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const sync = await synchronizeVersions({ root: candidate, write: true })
  const result = await validatePackage(candidate)
  assert.deepEqual(sync.changed, [".claude-plugin/plugin.json"])
  assert.equal(result.ok, true)
})

test("contract validation is independent of legal JSON property order", async (context) => {
  const candidate = await copyCandidate(context)
  const contractPath = resolve(candidate, "scripts/release-contract.json")
  const contract = JSON.parse(await readFile(contractPath, "utf8"))
  const reordered = {
    publishedFiles: contract.publishedFiles,
    skillPolicy: contract.skillPolicy,
    version: {
      dependents: contract.version.dependents.map((dependent) => Object.fromEntries(Object.entries(dependent).reverse())),
      source: Object.fromEntries(Object.entries(contract.version.source).reverse()),
    },
  }
  await writeFile(contractPath, `${JSON.stringify(reordered, null, 2)}\n`)

  const result = await validatePackage(candidate)
  assert.equal(result.ok, true)
})

test("YAML parsing handles folded scalars and updates only metadata.version", () => {
  const content = `---
name: remoteskill
description: >-
  Discover global skills before answering,
  even when a request does not mention them.
metadata:
  release:
    version: "nested-lookalike"
  version: '1.2.3'
---

# Body
`
  const parsed = parseSkillFrontmatter(content)
  assert.equal(parsed.data.description, "Discover global skills before answering, even when a request does not mention them.")
  assert.equal(parsed.data.metadata.release.version, "nested-lookalike")
  assert.equal(parsed.data.metadata.version, "1.2.3")

  const updated = parseSkillFrontmatter(writeFrontmatterVersion(content, "3.1.0"))
  assert.equal(updated.data.metadata.release.version, "nested-lookalike")
  assert.equal(updated.data.metadata.version, "3.1.0")
  assert.equal(frontmatterScalar(updated, ["metadata", "version"]).type, Scalar.QUOTE_DOUBLE)
})

test("canonical schemas reject unknown manifest properties", async (context) => {
  const candidate = await copyCandidate(context)
  const manifestPath = resolve(candidate, "plugin.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  manifest.unrecognized = true
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const result = await validatePackage(candidate)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.startsWith("plugin.json/") && error.includes("additional properties")))
})

test("vendored schema drift fails validation", async (context) => {
  const candidate = await copyCandidate(context)
  const schemaPath = resolve(candidate, "schemas/agent-plugins/plugin.schema.json")
  const schema = JSON.parse(await readFile(schemaPath, "utf8"))
  schema.title = "Tampered schema"
  await writeFile(schemaPath, `${JSON.stringify(schema, null, 2)}\n`)

  const result = await validatePackage(candidate)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.includes("recorded SHA-256")))
})

test("credential-bearing MCP configuration is rejected", async (context) => {
  const candidate = await copyCandidate(context)
  const mcpPath = resolve(candidate, "mcp.json")
  const mcp = JSON.parse(await readFile(mcpPath, "utf8"))
  mcp.mcpServers.remoteskill.headers = { Authorization: "Bearer placeholder" }
  await writeFile(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`)

  const result = await validatePackage(candidate)
  assert.equal(result.ok, false)
  assert.ok(result.errors.includes("mcp.json remoteskill server must not declare request headers or credentials"))
})

test("the policy fixture detects missing catalog guidance", async (context) => {
  const candidate = await copyCandidate(context)
  const skillPath = resolve(candidate, "skills/remoteskill/SKILL.md")
  const skill = await readFile(skillPath, "utf8")
  await writeFile(skillPath, skill.replace("Before every response", "Before a later response"))

  const result = await validatePackage(candidate)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.includes("Before every response")))
})

test("release staging contains exactly the published runtime files", async (context) => {
  const temporary = await mkdtemp(resolve(tmpdir(), "remoteskill-release-test-"))
  context.after(() => rm(temporary, { recursive: true, force: true }))
  const output = resolve(temporary, "remoteskill-package")
  const staged = await stageRelease({ root, output })
  const plugin = JSON.parse(await readFile(resolve(root, "plugin.json"), "utf8"))

  assert.deepEqual(await walk(output), staged.files)
  assert.equal(staged.version, plugin.version)
})

test("release publishing requires the tag to resolve to the current main tip", async () => {
  const workflow = await readFile(resolve(root, ".github/workflows/release.yml"), "utf8")
  assert.match(workflow, /git rev-parse \"\$\{GITHUB_SHA\}\^\{commit\}\"/)
  assert.match(workflow, /git rev-parse \"origin\/main\^\{commit\}\"/)
  assert.match(workflow, /test \"\$\{tagged_commit\}\" = \"\$\{main_commit\}\"/)
  assert.doesNotMatch(workflow, /merge-base --is-ancestor/)
})

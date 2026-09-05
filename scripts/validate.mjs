#!/usr/bin/env node

import Ajv from "ajv"
import Ajv2020 from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { isMap, Scalar } from "yaml"
import { readdir, readFile } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { isDeepStrictEqual } from "node:util"
import { frontmatterScalar, parseSkillFrontmatter } from "./frontmatter.mjs"
import { checkSchemas } from "./sync-schemas.mjs"
import { inspectVersions } from "./sync-version.mjs"

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const publicTools = [
  "list_skills",
  "read_skill",
  "create_skill",
  "write_skill_file",
  "edit_skill_file",
  "delete_skill_file",
  "add_skills",
  "remove_skills",
]
const expectedVersionContract = {
  source: {
    path: "plugin.json",
    jsonPointer: "/version",
  },
  dependents: [
    {
      path: ".claude-plugin/marketplace.json",
      jsonPointer: "/plugins/0/version",
    },
    {
      path: ".claude-plugin/plugin.json",
      jsonPointer: "/version",
    },
    {
      path: "skills/remoteskill/SKILL.md",
      frontmatterPath: "metadata.version",
    },
  ],
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

async function readJson(path, errors) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    errors.push(`${relative(scriptRoot, path)} is not valid JSON: ${error.message}`)
    return undefined
  }
}

async function walkFiles(root, path = root) {
  const entries = await readdir(path, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) files.push(...await walkFiles(root, child))
    if (entry.isFile()) files.push(relative(root, child).split(sep).join("/"))
  }
  return files
}

function addEqual(errors, label, actual, expected) {
  if (actual !== expected) errors.push(`${label} must be ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
}

function hasExactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(compareText)
  return isDeepStrictEqual(actual, [...expected].sort(compareText))
}

async function validateWithSchema(root, label, document, schemaPath, errors) {
  if (!document) return
  const schema = JSON.parse(await readFile(resolve(root, schemaPath), "utf8"))
  const options = { allErrors: true, strict: false }
  const ajv = schema.$schema?.includes("2020-12") ? new Ajv2020(options) : new Ajv(options)
  addFormats(ajv)
  const validate = ajv.compile(schema)
  if (validate(document)) return
  for (const error of validate.errors ?? []) {
    errors.push(`${label}${error.instancePath || "/"}: ${error.message}`)
  }
}

function rejectCredentialConfiguration(label, server, errors) {
  if (server?.headers !== undefined) errors.push(`${label} must not declare request headers or credentials`)
  try {
    const url = new URL(server?.url)
    if (url.username || url.password) errors.push(`${label} URL must not contain credentials`)
  } catch {
    errors.push(`${label} URL must be an absolute URL`)
  }
}

export async function validatePackage(root = scriptRoot) {
  const errors = []
  const plugin = await readJson(resolve(root, "plugin.json"), errors)
  const mcp = await readJson(resolve(root, "mcp.json"), errors)
  const claudePlugin = await readJson(resolve(root, ".claude-plugin/plugin.json"), errors)
  const claudeMarketplace = await readJson(resolve(root, ".claude-plugin/marketplace.json"), errors)
  const claudeMcp = await readJson(resolve(root, ".mcp.json"), errors)
  const contract = await readJson(resolve(root, "scripts/release-contract.json"), errors)
  const policy = await readJson(resolve(root, "scripts/skill-policy.json"), errors)
  const version = plugin?.version

  try {
    const schemaErrors = await checkSchemas(root)
    errors.push(...schemaErrors.map((error) => `Vendored schema error: ${error}`))
  } catch (error) {
    errors.push(`Vendored schemas are invalid: ${error.message}`)
  }

  await validateWithSchema(root, "plugin.json", plugin, "schemas/agent-plugins/plugin.schema.json", errors)
  await validateWithSchema(root, "mcp.json", mcp, "schemas/agent-plugins/mcp.schema.json", errors)
  await validateWithSchema(root, ".claude-plugin/plugin.json", claudePlugin, "schemas/claude/plugin.schema.json", errors)
  await validateWithSchema(root, ".claude-plugin/marketplace.json", claudeMarketplace, "schemas/claude/marketplace.schema.json", errors)
  if (claudeMcp) {
    await validateWithSchema(
      root,
      ".mcp.json",
      { $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", ...claudeMcp },
      "schemas/agent-plugins/mcp.schema.json",
      errors,
    )
  }

  addEqual(errors, "plugin.json $schema", plugin?.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json")
  addEqual(errors, "plugin.json name", plugin?.name, "remoteskill")
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) errors.push(`plugin.json version must be semantic, received ${JSON.stringify(version)}`)
  addEqual(errors, "mcp.json $schema", mcp?.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json")

  const canonicalServer = mcp?.mcpServers?.remoteskill
  addEqual(errors, "mcp.json server type", canonicalServer?.type, "streamable-http")
  addEqual(errors, "mcp.json server URL", canonicalServer?.url, "https://mcp.remoteskill.md/mcp")
  addEqual(errors, ".mcp.json server type", claudeMcp?.mcpServers?.remoteskill?.type, canonicalServer?.type)
  addEqual(errors, ".mcp.json server URL", claudeMcp?.mcpServers?.remoteskill?.url, canonicalServer?.url)
  rejectCredentialConfiguration("mcp.json remoteskill server", canonicalServer, errors)
  rejectCredentialConfiguration(".mcp.json remoteskill server", claudeMcp?.mcpServers?.remoteskill, errors)

  addEqual(errors, "Claude plugin name", claudePlugin?.name, plugin?.name)
  addEqual(errors, "Claude plugin description", claudePlugin?.description, plugin?.description)
  addEqual(errors, "Claude marketplace source", claudeMarketplace?.plugins?.[0]?.source, "./")
  addEqual(errors, "Claude marketplace name", claudeMarketplace?.plugins?.[0]?.name, plugin?.name)
  addEqual(errors, "Claude marketplace description", claudeMarketplace?.plugins?.[0]?.description, plugin?.description)
  if (!hasExactKeys(contract, ["version", "skillPolicy", "publishedFiles"])) {
    errors.push("release-contract.json contains missing or unknown top-level fields")
  }
  if (!isDeepStrictEqual(contract?.version, expectedVersionContract)) {
    errors.push("release-contract.json must declare every supported version surface")
  }
  addEqual(errors, "release-contract.json skillPolicy", contract?.skillPolicy, "scripts/skill-policy.json")

  try {
    const inspection = await inspectVersions(root)
    for (const surface of inspection.surfaces) {
      addEqual(errors, `${surface.path} version`, surface.value, inspection.version)
    }
  } catch (error) {
    errors.push(`Version contract is invalid: ${error.message}`)
  }

  const skillPath = resolve(root, "skills/remoteskill/SKILL.md")
  const skill = await readFile(skillPath, "utf8")
  let parsedFrontmatter
  try {
    parsedFrontmatter = parseSkillFrontmatter(skill)
  } catch (error) {
    errors.push(error.message)
  }
  const metadata = parsedFrontmatter?.data
  const frontmatterKeys = isMap(parsedFrontmatter?.document.contents)
    ? parsedFrontmatter.document.contents.items.map((pair) => pair.key?.value)
    : []
  if (!isDeepStrictEqual([...frontmatterKeys].sort(compareText), ["description", "metadata", "name"])) {
    errors.push("RemoteSkill frontmatter must contain only name, description, and metadata")
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata?.name ?? "")) {
    errors.push("RemoteSkill name must use lowercase ASCII letters, numbers, and single hyphens")
  }
  if ((metadata?.name?.length ?? 0) > 64) errors.push("RemoteSkill name exceeds 64 characters")
  addEqual(errors, "skill-policy.json name", policy?.frontmatter?.name, "remoteskill")
  addEqual(errors, "skill-policy.json descriptionMaxLength", policy?.frontmatter?.descriptionMaxLength, 1024)
  addEqual(errors, "RemoteSkill name", metadata?.name, policy?.frontmatter?.name)
  addEqual(errors, "RemoteSkill metadata.version", metadata?.metadata?.version, version)
  if (typeof metadata?.description !== "string" || metadata.description.length === 0) {
    errors.push("RemoteSkill description must be a non-empty string")
  }
  if ((metadata?.description?.length ?? 0) > 1024) {
    errors.push("RemoteSkill description exceeds its policy limit")
  }
  if (!metadata?.metadata || Object.values(metadata.metadata).some((value) => typeof value !== "string")) {
    errors.push("RemoteSkill metadata values must all be strings")
  }
  const quotedPaths = [
    ["name"],
    ["description"],
    ["metadata", "author"],
    ["metadata", "version"],
  ]
  for (const path of quotedPaths) {
    if (frontmatterScalar(parsedFrontmatter, path)?.type !== Scalar.QUOTE_DOUBLE) {
      errors.push(`RemoteSkill ${path.join(".")} must use a double-quoted YAML scalar`)
    }
  }
  const management = await readFile(resolve(root, "skills/remoteskill/references/library-management.md"), "utf8")
  const skillSurface = `${skill}\n${management}`
  if (!hasExactKeys(policy, ["frontmatter", "descriptionRequiredPhrases", "bodyRequiredPhrases", "bodyForbiddenPhrases"])) {
    errors.push("skill-policy.json contains missing or unknown top-level fields")
  }
  const policyArrays = ["descriptionRequiredPhrases", "bodyRequiredPhrases", "bodyForbiddenPhrases"]
  for (const key of policyArrays) {
    if (!Array.isArray(policy?.[key]) || policy[key].length === 0 || policy[key].some((value) => typeof value !== "string" || value.length === 0)) {
      errors.push(`skill-policy.json ${key} must be a non-empty string array`)
    }
  }
  for (const phrase of policy?.descriptionRequiredPhrases ?? []) {
    if (!metadata?.description?.includes(phrase)) errors.push(`RemoteSkill description is missing ${JSON.stringify(phrase)}`)
  }
  for (const phrase of policy?.bodyRequiredPhrases ?? []) {
    if (!skillSurface.includes(phrase)) errors.push(`RemoteSkill guidance is missing ${JSON.stringify(phrase)}`)
  }
  for (const phrase of policy?.bodyForbiddenPhrases ?? []) {
    if (skillSurface.includes(phrase)) errors.push(`RemoteSkill guidance contains forbidden text ${JSON.stringify(phrase)}`)
  }

  const readme = await readFile(resolve(root, "README.md"), "utf8")
  for (const tool of publicTools) {
    if (!readme.includes(`\`${tool}\``)) errors.push(`README.md is missing the ${tool} tool`)
  }
  const setup = await readFile(resolve(root, "SETUP.md"), "utf8")
  if (/\b(?:seven|eight) real tools\b/i.test(`${readme}\n${setup}`)) errors.push("Connection guidance must not infer readiness from a fixed tool count")

  if (!contract || !Array.isArray(contract.publishedFiles)) {
    errors.push("scripts/release-contract.json must declare publishedFiles")
  } else {
    const published = contract.publishedFiles
    const sorted = [...published].sort(compareText)
    if (new Set(published).size !== published.length) errors.push("publishedFiles contains duplicates")
    if (published.some((path) => path.startsWith("/") || path.includes("..") || path.includes("\\"))) {
      errors.push("publishedFiles must contain safe repository-relative POSIX paths")
    }
    if (JSON.stringify(published) !== JSON.stringify(sorted)) errors.push("publishedFiles must be sorted")

    const claudeFiles = (await walkFiles(resolve(root, ".claude-plugin")))
      .map((path) => `.claude-plugin/${path}`)
    const skillFiles = (await walkFiles(resolve(root, "skills")))
      .map((path) => `skills/${path}`)
    const runtimeFiles = [...claudeFiles, ...skillFiles]
    const requiredFiles = [".mcp.json", "LICENSE", "README.md", "SETUP.md", "mcp.json", "plugin.json", ...runtimeFiles]
      .sort(compareText)
    if (JSON.stringify(published) !== JSON.stringify(requiredFiles)) {
      errors.push("publishedFiles must exactly match every user runtime component")
    }
    for (const path of published) {
      try {
        await readFile(resolve(root, path))
      } catch {
        errors.push(`Published file does not exist: ${path}`)
      }
    }
  }

  const textRuntime = [skill, management, readme, setup]
  if (textRuntime.some((content) => content.includes("\u2014"))) errors.push("Runtime prose contains an em dash")

  return {
    ok: errors.length === 0,
    version,
    publishedFiles: contract?.publishedFiles ?? [],
    errors,
  }
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/validate.mjs\n\n`)
  process.stdout.write(`Validate plugin manifests, endpoint parity, skill guidance, and release inventory.\n`)
}

async function main() {
  if (process.argv[2] === "--help") {
    printHelp()
    return
  }
  if (process.argv.length > 2) {
    printHelp()
    process.exitCode = 2
    return
  }

  const result = await validatePackage()
  process.stdout.write(`${JSON.stringify(result)}\n`)
  if (!result.ok) process.exitCode = 1
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}

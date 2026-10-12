#!/usr/bin/env node
// Stages the folder OpenAI's plugin portal takes as a ZIP.
//
// The portal reads the same Agent Plugins package this repository publishes,
// with one difference it requires and the Agent Plugins MCP schema does not
// allow: how the server's OAuth client is registered, declared on the server
// entry under extensions.com.openai. So the staged mcp.json carries that one
// addition and the repository's own mcp.json stays valid against its schema.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { validatePackage } from "./validate.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// What the portal reads. The Claude Code adapter and the setup notes are for
// other hosts.
const PORTAL_FILES = (published) =>
  published.filter((path) => !path.startsWith(".") && path !== "README.md" && path !== "SETUP.md")

export async function stageOpenAi(output) {
  const validation = await validatePackage(root)
  if (!validation.ok) throw new Error(`Package validation failed: ${validation.errors.join(" | ")}`)
  await rm(output, { recursive: true, force: true })
  for (const path of PORTAL_FILES(validation.publishedFiles)) {
    const target = resolve(output, path)
    await mkdir(dirname(target), { recursive: true })
    await cp(resolve(root, path), target)
  }
  const mcp = JSON.parse(await readFile(resolve(root, "mcp.json"), "utf8"))
  for (const server of Object.values(mcp.mcpServers)) {
    server.extensions = { "com.openai": { auth: { type: "oauth", client: { mode: "dcr" } } } }
  }
  await writeFile(resolve(output, "mcp.json"), `${JSON.stringify(mcp, null, 2)}\n`)
  return { output, version: validation.version, files: PORTAL_FILES(validation.publishedFiles) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf("--output")
  const output = flag === -1 ? undefined : process.argv[flag + 1]
  if (!output) {
    console.error("Usage: node scripts/stage-openai.mjs --output <directory>")
    process.exit(1)
  }
  console.log(JSON.stringify(await stageOpenAi(resolve(output))))
}

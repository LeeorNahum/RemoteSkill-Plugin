#!/usr/bin/env node

import { copyFile, mkdir, stat } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { validatePackage } from "./validate.mjs"

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

export async function stageRelease({ root = scriptRoot, output }) {
  if (!output) throw new Error("--output is required")
  const target = resolve(output)
  if (await exists(target)) throw new Error(`Output already exists: ${target}`)

  const validation = await validatePackage(root)
  if (!validation.ok) {
    throw new Error(`Package validation failed: ${validation.errors.join(" | ")}`)
  }

  for (const path of validation.publishedFiles) {
    const destination = resolve(target, path)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(resolve(root, path), destination)
  }

  return {
    version: validation.version,
    output: target,
    files: validation.publishedFiles,
  }
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/stage-release.mjs --output DIRECTORY\n\n`)
  process.stdout.write(`Validate and stage the exact published file inventory.\n\n`)
  process.stdout.write(`Options:\n`)
  process.stdout.write(`  --output DIRECTORY  New directory to create\n`)
  process.stdout.write(`  --help              Show this help\n`)
}

async function main() {
  if (process.argv[2] === "--help") {
    printHelp()
    return
  }
  if (process.argv[2] !== "--output" || !process.argv[3] || process.argv.length !== 4) {
    printHelp()
    process.exitCode = 2
    return
  }

  const result = await stageRelease({ output: process.argv[3] })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}

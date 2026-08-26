import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = path.join(root, 'plugins', 'eufemia')
const pluginSchemaUrl =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const mcpSchemaUrl =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

const readJson = async (filePath) =>
  JSON.parse(await fs.readFile(filePath, 'utf-8'))

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const fetchSchema = async (url) => {
  const response = await fetch(url)
  assert(response.ok, `Could not fetch schema: ${url} (${response.status})`)
  return response.json()
}

const validateSchema = (schema, value, label) => {
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)
  if (!validate(value)) {
    throw new Error(`${label} is invalid: ${ajv.errorsText(validate.errors)}`)
  }
}

const isSecretLooking = (name) => {
  const lower = name.toLowerCase()
  return (
    lower === '.env' ||
    lower.startsWith('.env.') ||
    lower.endsWith('.pem') ||
    lower.endsWith('.key') ||
    lower === 'id_rsa' ||
    lower === 'credentials' ||
    lower === 'kubeconfig'
  )
}

const validateTree = async (directory) => {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name)
    assert(!entry.isSymbolicLink(), `Symlink is not allowed: ${absolutePath}`)
    assert(!isSecretLooking(entry.name), `Secret-looking file: ${absolutePath}`)
    if (entry.isDirectory()) {
      await validateTree(absolutePath)
    } else {
      assert(entry.isFile(), `Unsupported file type: ${absolutePath}`)
    }
  }
}

const marketplace = await readJson(
  path.join(root, '.claude-plugin', 'marketplace.json')
)
const source = await readJson(path.join(root, '.eufemia-source.json'))
const plugin = await readJson(path.join(pluginRoot, 'plugin.json'))
const claudePlugin = await readJson(
  path.join(pluginRoot, '.claude-plugin', 'plugin.json')
)
const mcp = await readJson(path.join(pluginRoot, 'mcp.json'))
const claudeMcp = await readJson(path.join(pluginRoot, '.mcp.json'))
const [pluginSchema, mcpSchema] = await Promise.all([
  fetchSchema(pluginSchemaUrl),
  fetchSchema(mcpSchemaUrl),
])

validateSchema(pluginSchema, plugin, 'plugin.json')
validateSchema(mcpSchema, mcp, 'mcp.json')

assert(marketplace.name === 'eufemia-plugins-official', 'Invalid marketplace name')
assert(marketplace.plugins?.length === 1, 'Marketplace must contain one plugin')
assert(marketplace.plugins[0]?.name === 'eufemia', 'Invalid marketplace plugin name')
assert(
  marketplace.plugins[0]?.source === './plugins/eufemia',
  'Invalid marketplace plugin source'
)
assert(plugin.name === 'eufemia', 'Invalid Agent Plugin name')
assert(claudePlugin.name === plugin.name, 'Plugin names do not match')
assert(claudePlugin.version === plugin.version, 'Plugin versions do not match')
assert(source.pluginVersion === plugin.version, 'Source version does not match')
assert(/^[0-9a-f]{40}$/.test(source.ref), 'Source ref must be a full commit SHA')
assert(source.repository === 'dnbexperience/eufemia', 'Invalid source repository')
assert(
  source.generator === 'tools/eufemia-raiwork-plugin',
  'Invalid source generator'
)
assert(
  mcp.mcpServers?.eufemia?.url ===
    'https://server.eufemia.dnb.no/mcp/web',
  'Invalid portable MCP endpoint'
)
assert(
  claudeMcp.mcpServers?.eufemia?.url === mcp.mcpServers.eufemia.url,
  'MCP endpoints do not match'
)

const skillRoot = path.join(pluginRoot, 'skills')
const skillEntries = await fs.readdir(skillRoot, { withFileTypes: true })
const skillNames = new Set()
for (const entry of skillEntries) {
  assert(entry.isDirectory(), `Unexpected skills entry: ${entry.name}`)
  const skill = await fs.readFile(
    path.join(skillRoot, entry.name, 'SKILL.md'),
    'utf-8'
  )
  const name = skill.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1]
  assert(name === entry.name, `Skill name does not match directory: ${entry.name}`)
  assert(!skillNames.has(name), `Duplicate skill name: ${name}`)
  skillNames.add(name)
}
assert(skillNames.size > 0, 'Plugin has no skills')

await validateTree(pluginRoot)
console.log(`Validated Eufemia Agent Plugin ${plugin.version} with ${skillNames.size} skills`)

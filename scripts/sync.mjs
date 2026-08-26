import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const upstreamRoot = path.resolve(process.argv[2] ?? '')
const generatedRoot = path.join(
  upstreamRoot,
  'tools',
  'eufemia-raiwork-plugin',
  'dist',
  'eufemia'
)
const destinationRoot = path.join(root, 'plugins', 'eufemia')

if (!process.argv[2]) {
  throw new Error('Usage: npm run sync -- <eufemia-checkout>')
}

const sourceRef = execFileSync(
  'git',
  ['-C', upstreamRoot, 'rev-parse', 'HEAD'],
  { encoding: 'utf-8' }
).trim()
const plugin = JSON.parse(
  await fs.readFile(path.join(generatedRoot, 'plugin.json'), 'utf-8')
)

await fs.rm(destinationRoot, { recursive: true, force: true })
await fs.cp(generatedRoot, destinationRoot, { recursive: true })
await fs.writeFile(
  path.join(root, '.eufemia-source.json'),
  `${JSON.stringify(
    {
      repository: 'dnbexperience/eufemia',
      ref: sourceRef,
      generator: 'tools/eufemia-raiwork-plugin',
      pluginVersion: plugin.version,
    },
    null,
    2
  )}\n`
)

console.log(`Synced Eufemia Agent Plugin ${plugin.version} from ${sourceRef}`)

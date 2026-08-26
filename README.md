# Eufemia Agent Plugins

Public marketplace for official Eufemia Agent Plugins. The marketplace works in
Claude Code and clients that implement Agent Plugins 1.0, including VS Code.

## Install

### Claude Code

```bash
claude plugin marketplace add dnbexperience/eufemia-agent-plugins
claude plugin install eufemia@eufemia-plugins-official
```

### VS Code

Add the marketplace to your user or workspace settings:

```json
{
  "chat.plugins.marketplaces": [
    "dnbexperience/eufemia-agent-plugins"
  ]
}
```

Open the Extensions view, filter by `@agentPlugins`, and install **Eufemia
Web**.

## Frontend Frida dependency

A Claude plugin can depend on Eufemia with:

```json
{
  "dependencies": [
    {
      "name": "eufemia",
      "marketplace": "eufemia-plugins-official"
    }
  ]
}
```

The declaring marketplace must also allow the cross-marketplace dependency:

```json
{
  "allowCrossMarketplaceDependenciesOn": [
    "eufemia-plugins-official"
  ]
}
```

The Eufemia marketplace must be registered and permitted by organizational
policy before Claude can resolve the dependency.

## Package formats

`plugins/eufemia` is one self-contained plugin directory with shared skills:

- `plugin.json` and `mcp.json` implement Agent Plugins 1.0.
- `.claude-plugin/plugin.json` and `.mcp.json` provide Claude compatibility.
- `skills/` contains the canonical Eufemia Agent Skills.

## Source and releases

Eufemia owns the canonical skills, MCP contract, and generator in
[`dnbexperience/eufemia`](https://github.com/dnbexperience/eufemia). Generated
files under `plugins/eufemia` must not be edited directly.

`.eufemia-source.json` records the exact source commit and plugin version. Run
the **Sync Eufemia** workflow to build from another Eufemia ref and open an
update pull request.

Plugin releases use tags named `eufemia--v<version>` so Claude can resolve
version constraints. Version `0.1.0` is the initial release shared with the
existing Eufemia Web RAIWork plugin.

## Validate

```bash
npm ci
npm run validate
npx --yes @anthropic-ai/claude-code@2.1.246 plugin validate . --strict
npx --yes @anthropic-ai/claude-code@2.1.246 plugin validate plugins/eufemia --strict
```

The first command validates the Agent Plugins schemas, package containment,
marketplace identity, source provenance, MCP endpoint, and skill names. Claude's
validator checks the catalog and Claude plugin adapter.

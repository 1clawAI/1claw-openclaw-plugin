# 1claw OpenClaw Plugin

OpenClaw gateway plugin for [1claw](https://1claw.xyz) — HSM-backed secret management, transaction signing, and Shroud LLM proxy integration for AI agents.

**Repository:** [github.com/1clawAI/1claw-openclaw-plugin](https://github.com/1clawAI/1claw-openclaw-plugin)  
**npm:** [@1claw/openclaw-plugin](https://www.npmjs.com/package/@1claw/openclaw-plugin)  
**Docs:** [OpenClaw Plugins](https://docs.openclaw.ai/tools/plugin) · [1claw](https://docs.1claw.xyz)

---

## Features

- **Native agent tools** — 27+ tools for secrets, vaults, policies, sharing, signing keys, multi-chain transactions, execution intents, automations, memory, runtimes, and discovery (EVM + Bitcoin, Solana, XRP, Cardano, Tron; optional, configurable)
- **Automations** — Create and manage cron-based scheduled tasks via `oneclaw_create_automation`, `oneclaw_list_automations`, `oneclaw_delete_automation`
- **Agent Memory** — Store and search persistent vector memory via `oneclaw_store_memory`, `oneclaw_search_memory`
- **Runtimes** — Deploy and manage agent runtime environments via `oneclaw_deploy_runtime`, `oneclaw_list_runtimes`
- **Discovery** — Publish agents to the 1Claw directory via `oneclaw_publish_agent`, `oneclaw_search_directory`
- **Secret redaction** — Scan outbound messages and redact leaked secret values (default on)
- **Secret injection** — Replace `{{1claw:path/to/secret}}` placeholders at prompt time (opt-in)
- **Shroud routing** — Route LLM traffic through [Shroud](https://shroud.1claw.xyz) TEE when the agent has `shroud_enabled` (opt-in)
- **Key rotation monitor** — Background warnings for secrets expiring within 7 days (opt-in)
- **Slash commands** — `/oneclaw`, `/oneclaw-list`, `/oneclaw-rotate`, `/oneclaw-memory` (optional)
- **Gateway RPC** — `1claw.status` for programmatic health/status
- **Bundled skill** — 1claw skill (`skills/1claw/SKILL.md`) auto-discovered by OpenClaw

All features are toggled via `plugins.entries.1claw.config.features`. Auth uses config or env vars.

---

## Install

```bash
openclaw plugins install @1claw/openclaw-plugin
```

Or from the repo (e.g. when developing or using as a submodule):

```bash
openclaw plugins install -l ./path/to/1claw-openclaw-plugin
```

---

## Config

Minimal config (config file or env):

```json5
{
  plugins: {
    entries: {
      "1claw": {
        enabled: true,
        config: {
          apiKey: "ocv_..."
          // agentId, vaultId, baseUrl, shroudUrl optional
          // features: { tools: true, secretRedaction: true, ... }
        }
      }
    }
  }
}
```

**Env fallback:** `ONECLAW_AGENT_API_KEY`, `ONECLAW_AGENT_ID`, `ONECLAW_VAULT_ID`, `ONECLAW_BASE_URL`, `ONECLAW_SHROUD_URL`.

Prefer the env fallback for hosted agents so `ONECLAW_AGENT_API_KEY` stays out
of checked-in OpenClaw config files.

Restart the OpenClaw Gateway after changing config.

---

## Tool names

When enabled, tools are registered with a `oneclaw_` prefix (e.g. `oneclaw_list_secrets`, `oneclaw_get_secret`). Add them to your agent’s `tools.allow` (e.g. `"1claw"` or specific names).

---

## Companion plugin example: TweetClaw

Use 1claw to manage the Xquik API key used by
[TweetClaw](https://github.com/Xquik-dev/tweetclaw). TweetClaw reads the key
from sensitive OpenClaw plugin config. 1claw does not inject vault values into
another plugin's config automatically.

```bash
openclaw plugins install clawhub:@xquik/tweetclaw
openclaw config set plugins.entries.tweetclaw.config.apiKey "$XQUIK_API_KEY"
openclaw gateway restart
openclaw plugins inspect tweetclaw --runtime --json
```

Retrieve the current key through a trusted human workflow. Expose it as
`XQUIK_API_KEY` only in that shell. Never paste it into an agent prompt. After
rotating the key in 1claw, repeat the `config set` command and restart OpenClaw.
If the tool profile excludes plugins, add both names to `tools.alsoAllow`.

TweetClaw injects auth into its API calls. It provides structured tools for
search, publishing, exports, monitoring, media, direct messages, and draws.
Review each OpenClaw approval prompt before allowing visible X/Twitter writes.

## Slash commands

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `/oneclaw`        | Connection status, vault info, token TTL, features |
| `/oneclaw-list`   | List secret paths (optional prefix arg)          |
| `/oneclaw-rotate` | Rotate a secret: `/oneclaw-rotate <path> <new-value>` |

---

## Development

```bash
npm install
npm run typecheck
```

- **TypeScript** only (no build step required for OpenClaw; jiti loads `.ts` at runtime).
- Optional: `npm run build` to emit `dist/` (not required for `openclaw plugins install` when using source).

### As a submodule in 1claw

From the [1claw](https://github.com/1clawAI/1claw) repo root:

```bash
git submodule add https://github.com/1clawAI/1claw-openclaw-plugin.git packages/openclaw-plugin
git submodule update --init --recursive
```

Clone 1claw with the submodule:

```bash
git clone --recurse-submodules https://github.com/1clawAI/1claw.git
```

---

## License

MIT © [1claw](https://1claw.xyz)

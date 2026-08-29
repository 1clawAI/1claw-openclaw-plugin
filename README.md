# 1claw OpenClaw Plugin

> ⭐ **Star [1clawAI/agent-templates](https://github.com/1clawAI/agent-templates)** — ready-to-run agent templates wired to 1Claw. It is our single starred repo.

OpenClaw gateway plugin for [1claw](https://1claw.co).

**Repository:** [github.com/1clawAI/1claw-openclaw-plugin](https://github.com/1clawAI/1claw-openclaw-plugin)  
**npm:** [@1claw/openclaw-plugin](https://www.npmjs.com/package/@1claw/openclaw-plugin)  
**Docs:** [OpenClaw Plugins](https://docs.openclaw.ai/tools/plugin) · [1claw](https://docs.1claw.co)

OpenClaw agents need vault access, transaction signing, and sometimes an inspected LLM path. Running a separate MCP process works, but this plugin registers **29 native tools** inside the gateway itself. Secrets are fetched at runtime. Outbound messages get scanned for leaked values. Optional Shroud routing sends LLM traffic through the TEE proxy when the agent has it enabled.

Install one npm package, set `ONECLAW_AGENT_API_KEY`, restart the gateway. Your agent gets secrets, signing, env vars, execution bindings, automations, memory, and approvals without extra wiring. Toggle features (redaction, injection, Shroud, slash commands) in `plugins.entries.1claw.config.features`.

---

## Features

- **Native agent tools** — 29 tools for secrets, vaults, policies, sharing, signing keys, multi-chain transactions, execution intents, env vars, automations, memory, and approvals (EVM + Bitcoin, Solana, XRP, Cardano, Tron; optional, configurable)
- **Secrets & vaults** — `oneclaw_list_secrets`, `oneclaw_get_secret`, `oneclaw_put_secret`, `oneclaw_delete_secret`, `oneclaw_describe_secret`, `oneclaw_rotate_and_store`, `oneclaw_get_env_bundle`, `oneclaw_create_vault`, `oneclaw_list_vaults`, `oneclaw_grant_access`, `oneclaw_share_secret`
- **Env vars** — `oneclaw_resolve_env`, `oneclaw_list_env_vars`, `oneclaw_create_env_var`
- **Signing** — `oneclaw_provision_signing_key`, `oneclaw_list_signing_keys`, `oneclaw_sign_message`, `oneclaw_sign_typed_data`, `oneclaw_simulate_transaction`, `oneclaw_sign_transaction`, `oneclaw_submit_transaction`
- **Execution intents** — `oneclaw_execute_http`, `oneclaw_list_bindings`
- **Automations & memory** — `oneclaw_list_automations`, `oneclaw_trigger_automation`, `oneclaw_put_memory`, `oneclaw_get_memory`, `oneclaw_list_memory`
- **Approvals** — `oneclaw_request_approval` for human-in-the-loop policy changes
- **Guardrail governance** — Execution intents honor shadow/enforce; guardrail widening requires human `policy_change` approval (v0.56+)
- **Secret redaction** — Scan outbound messages and redact leaked secret values (default on)
- **Secret injection** — Replace `{{1claw:path/to/secret}}` placeholders at prompt time (opt-in)
- **Shroud routing** — Route LLM traffic through [Shroud](https://shroud.1claw.co) TEE when the agent has `shroud_enabled` (opt-in)
- **Key rotation monitor** — Background warnings for secrets expiring within 7 days (opt-in)
- **Slash commands** — `/oneclaw`, `/oneclaw-list`, `/oneclaw-rotate`, `/oneclaw-memory` (optional)
- **Gateway RPC** — `1claw.status` for programmatic health/status
- **Bundled skill** — 1claw skill (`skills/1claw/SKILL.md`) auto-discovered by OpenClaw

All features are toggled via `plugins.entries.1claw.config.features`. Auth uses config or env vars.

### Platform v0.56+ (HITL, HFA, guardrails)

| Capability | Plugin behavior |
|------------|-----------------|
| **Graduated HITL** | `oneclaw_submit_transaction` / sign tools may return `awaiting_approval` — poll approvals or use dashboard/mobile inbox. |
| **Human Factor Auth** | N/A for agent keys; treasury HFA is human-only (`@1claw/wallet-react`). |
| **Guardrail governance** | Execution intents honor shadow/enforce; widening guardrails requires human `policy_change` approval. |

Pin `@1claw/openclaw-plugin@0.57.0` with Vault API / MCP **0.58.0** for full platform parity. For Safe account tools, use `@1claw/sdk`, `@1claw/cli`, or `@1claw/mcp`.

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

MIT © [1claw](https://1claw.co)

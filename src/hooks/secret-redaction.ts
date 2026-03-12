import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface SecretCache {
    values: Map<string, string>;
    refreshedAt: number;
}

let cache: SecretCache | null = null;

async function refreshCache(client: OneClawClient): Promise<Map<string, string>> {
    if (cache && Date.now() - cache.refreshedAt < CACHE_TTL_MS) {
        return cache.values;
    }

    const values = new Map<string, string>();
    try {
        const listing = await client.listSecrets();
        for (const secret of listing.secrets) {
            try {
                const full = await client.getSecret(secret.path);
                if (full.value && full.value.length >= 8) {
                    values.set(secret.path, full.value);
                }
            } catch {
                // Skip secrets we can't read (no policy, expired, etc.)
            }
        }
    } catch {
        // Can't list secrets — return empty cache
    }

    cache = { values, refreshedAt: Date.now() };
    return values;
}

function redactSecrets(text: string, secrets: Map<string, string>): { redacted: string; count: number } {
    let redacted = text;
    let count = 0;

    for (const [path, value] of secrets) {
        if (redacted.includes(value)) {
            redacted = redacted.replaceAll(value, `[REDACTED:${path}]`);
            count++;
        }
    }

    return { redacted, count };
}

interface PromptBuildEvent {
    messages?: Array<{ role: string; content: string }>;
}

export function registerSecretRedaction(api: PluginApi, client: OneClawClient): void {
    api.on(
        "before_prompt_build",
        async (event: unknown, _ctx: unknown) => {
            const ev = event as PromptBuildEvent;
            if (!ev.messages || ev.messages.length === 0) return {};

            const secrets = await refreshCache(client);
            if (secrets.size === 0) return {};

            let totalRedacted = 0;

            for (const msg of ev.messages) {
                if (!msg.content) continue;
                const { redacted, count } = redactSecrets(msg.content, secrets);
                if (count > 0) {
                    msg.content = redacted;
                    totalRedacted += count;
                }
            }

            if (totalRedacted > 0) {
                api.logger.warn(
                    `[1claw/redaction] Redacted ${totalRedacted} leaked secret value(s) from conversation`,
                );
            }

            return {};
        },
        { priority: 100 },
    );

    api.logger.info("[1claw] Secret redaction hook registered");
}

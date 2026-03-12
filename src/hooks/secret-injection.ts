import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";

const PLACEHOLDER_RE = /\{\{1claw:([^}]+)\}\}/g;

interface PromptBuildEvent {
    messages?: Array<{ role: string; content: string }>;
}

export function registerSecretInjection(api: PluginApi, client: OneClawClient): void {
    api.on(
        "before_prompt_build",
        async (event: unknown, _ctx: unknown) => {
            const ev = event as PromptBuildEvent;
            if (!ev.messages || ev.messages.length === 0) return {};

            let injected = 0;

            for (const msg of ev.messages) {
                if (!msg.content) continue;

                const matches = [...msg.content.matchAll(PLACEHOLDER_RE)];
                if (matches.length === 0) continue;

                for (const match of matches) {
                    const fullPlaceholder = match[0];
                    const secretPath = match[1];

                    try {
                        const secret = await client.getSecret(secretPath);
                        msg.content = msg.content.replace(fullPlaceholder, secret.value);
                        injected++;
                    } catch (err) {
                        const errMsg = err instanceof Error ? err.message : String(err);
                        api.logger.warn(
                            `[1claw/injection] Failed to resolve ${secretPath}: ${errMsg}`,
                        );
                        msg.content = msg.content.replace(
                            fullPlaceholder,
                            `[1CLAW_UNAVAILABLE:${secretPath}]`,
                        );
                    }
                }
            }

            if (injected > 0) {
                api.logger.info(
                    `[1claw/injection] Injected ${injected} secret(s) into conversation`,
                );
            }

            return {};
        },
        { priority: 90 },
    );

    api.logger.info("[1claw] Secret injection hook registered");
}

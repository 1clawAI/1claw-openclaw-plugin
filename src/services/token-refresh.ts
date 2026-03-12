import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function createTokenRefreshService(api: PluginApi, client: OneClawClient) {
    let interval: ReturnType<typeof setInterval> | null = null;

    return {
        id: "1claw-token-refresh",
        start: () => {
            interval = setInterval(async () => {
                try {
                    await client.ensureToken();
                    const ttlMin = Math.round(client.tokenTtlMs / 60_000);
                    api.logger.info(`[1claw/token] Token refreshed, TTL: ${ttlMin}min`);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    api.logger.error(`[1claw/token] Refresh failed: ${msg}`);
                }
            }, REFRESH_INTERVAL_MS);

            api.logger.info("[1claw] Token refresh service started");
        },
        stop: () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            api.logger.info("[1claw] Token refresh service stopped");
        },
    };
}

import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const WARNING_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createKeyRotationService(api: PluginApi, client: OneClawClient) {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function checkExpiring(): Promise<void> {
        try {
            const data = await client.listSecrets();
            const now = Date.now();
            const expiring: string[] = [];

            for (const secret of data.secrets) {
                if (!secret.expires_at) continue;
                const expiresAt = new Date(secret.expires_at).getTime();
                if (expiresAt - now < WARNING_THRESHOLD_MS && expiresAt > now) {
                    const daysLeft = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
                    expiring.push(`${secret.path} (expires in ${daysLeft}d)`);
                }
            }

            if (expiring.length > 0) {
                api.logger.warn(
                    `[1claw/rotation] ${expiring.length} secret(s) expiring within 7 days:\n  ${expiring.join("\n  ")}`,
                );
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            api.logger.error(`[1claw/rotation] Check failed: ${msg}`);
        }
    }

    return {
        id: "1claw-key-rotation-monitor",
        start: async () => {
            await checkExpiring();

            interval = setInterval(checkExpiring, POLL_INTERVAL_MS);
            api.logger.info("[1claw] Key rotation monitor started");
        },
        stop: () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            api.logger.info("[1claw] Key rotation monitor stopped");
        },
    };
}

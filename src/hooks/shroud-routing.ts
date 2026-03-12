import type { OneClawClient } from "../client.js";
import type { PluginApi, AgentProfile } from "../types.js";

let cachedProfile: AgentProfile | null = null;
let profileFetchedAt = 0;
const PROFILE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getAgentProfile(client: OneClawClient): Promise<AgentProfile | null> {
    if (cachedProfile && Date.now() - profileFetchedAt < PROFILE_CACHE_TTL_MS) {
        return cachedProfile;
    }

    try {
        cachedProfile = await client.getAgentProfile();
        profileFetchedAt = Date.now();
        return cachedProfile;
    } catch {
        return null;
    }
}

export function registerShroudRouting(
    api: PluginApi,
    client: OneClawClient,
    shroudUrl: string,
): void {
    api.on(
        "before_model_resolve",
        async (_event: unknown, _ctx: unknown) => {
            const profile = await getAgentProfile(client);
            if (!profile?.shroud_enabled) return {};

            api.logger.info(
                `[1claw/shroud] Routing LLM traffic through Shroud at ${shroudUrl}`,
            );

            return {
                providerOverride: shroudUrl,
            };
        },
        { priority: 50 },
    );

    api.logger.info("[1claw] Shroud routing hook registered");
}

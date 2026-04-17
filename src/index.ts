import { OneClawClient } from "./client.js";
import { resolveConfig } from "./config.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllHooks } from "./hooks/index.js";
import { registerAllServices } from "./services/index.js";
import { registerAllCommands, registerUnauthenticatedCommands } from "./commands/index.js";
import type { PluginApi } from "./types.js";

interface FullConfig {
    plugins?: {
        entries?: Record<string, { enabled?: boolean; config?: Record<string, unknown> }>;
    };
}

function extractPluginConfig(api: PluginApi): Record<string, unknown> | undefined {
    const full = api.config as FullConfig;
    return full?.plugins?.entries?.["1claw"]?.config;
}

function register(api: PluginApi): void {
    const rawConfig = extractPluginConfig(api);
    const config = resolveConfig(rawConfig as Parameters<typeof resolveConfig>[0]);

    // Always register commands that work without auth (e.g. enroll)
    registerUnauthenticatedCommands(api, config);

    if (!config.apiKey) {
        api.logger.warn(
            "[1claw] No API key configured. Set ONECLAW_AGENT_API_KEY (or ONECLAW_API_KEY) env var, or run /oneclaw-enroll to get started.",
        );
        return;
    }

    const client = new OneClawClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        agentId: config.agentId,
        vaultId: config.vaultId,
    });

    api.logger.info(
        `[1claw] Initializing plugin (base: ${config.baseUrl}, agent: ${config.agentId ?? "auto-resolve"})`,
    );

    if (config.features.tools) {
        registerAllTools(api, client, config);
    }

    registerAllHooks(api, client, config);
    registerAllServices(api, client, config);

    if (config.features.slashCommands) {
        registerAllCommands(api, client, config);
    }

    api.registerGatewayMethod("1claw.status", async ({ respond }: { respond: (ok: boolean, data: unknown) => void }) => {
        try {
            await client.ensureVaultResolved();
            const vaults = await client.listVaults();
            respond(true, {
                authenticated: client.isAuthenticated,
                agentId: client.agentId ?? null,
                vaultId: client.vaultId || null,
                tokenTtlMs: client.tokenTtlMs,
                vaultCount: vaults.vaults.length,
                features: config.features,
                securityMode: config.securityMode,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            respond(false, { error: msg });
        }
    });

    api.logger.info("[1claw] Plugin initialized successfully");
}

export default {
    id: "1claw",
    name: "1Claw Secrets Manager",
    register,
};

export { OneClawClient } from "./client.js";
export { resolveConfig } from "./config.js";
export type { ResolvedConfig, ResolvedFeatures } from "./config.js";
export type { PluginApi, PluginTool, ToolResult, CommandContext } from "./types.js";

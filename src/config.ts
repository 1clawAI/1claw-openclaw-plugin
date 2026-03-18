export interface ResolvedFeatures {
    tools: boolean;
    secretInjection: boolean;
    secretRedaction: boolean;
    shroudRouting: boolean;
    keyRotationMonitor: boolean;
    slashCommands: boolean;
}

export interface ResolvedConfig {
    apiKey: string | undefined;
    agentId: string | undefined;
    vaultId: string | undefined;
    baseUrl: string;
    shroudUrl: string;
    features: ResolvedFeatures;
    securityMode: "block" | "surgical" | "log_only";
}

interface RawPluginConfig {
    apiKey?: string;
    agentId?: string;
    vaultId?: string;
    baseUrl?: string;
    shroudUrl?: string;
    features?: Partial<ResolvedFeatures>;
    securityMode?: string;
}

const DEFAULT_FEATURES: ResolvedFeatures = {
    tools: true,
    secretInjection: false,
    secretRedaction: true,
    shroudRouting: false,
    keyRotationMonitor: false,
    slashCommands: true,
};

function resolveSecurityMode(
    raw: string | undefined,
): "block" | "surgical" | "log_only" {
    if (raw === "surgical" || raw === "log_only") return raw;
    return "block";
}

export function resolveConfig(pluginConfig?: RawPluginConfig): ResolvedConfig {
    const raw = pluginConfig ?? {};

    return {
        apiKey:
            raw.apiKey ??
            process.env.ONECLAW_AGENT_API_KEY ??
            process.env.ONECLAW_API_KEY ??
            undefined,
        agentId:
            raw.agentId ??
            process.env.ONECLAW_AGENT_ID ??
            undefined,
        vaultId:
            raw.vaultId ??
            process.env.ONECLAW_VAULT_ID ??
            undefined,
        baseUrl:
            raw.baseUrl ??
            process.env.ONECLAW_BASE_URL ??
            "https://api.1claw.xyz",
        shroudUrl:
            raw.shroudUrl ??
            process.env.ONECLAW_SHROUD_URL ??
            "https://shroud.1claw.xyz",
        features: {
            ...DEFAULT_FEATURES,
            ...(raw.features ?? {}),
        },
        securityMode: resolveSecurityMode(
            raw.securityMode ??
                process.env.ONECLAW_MCP_SANITIZATION_MODE,
        ),
    };
}

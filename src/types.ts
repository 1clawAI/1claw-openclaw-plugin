export const SECRET_TYPES = [
    "api_key",
    "password",
    "private_key",
    "certificate",
    "file",
    "note",
    "ssh_key",
    "env_bundle",
] as const;

export type SecretType = (typeof SECRET_TYPES)[number];

export interface SecretMetadata {
    id: string;
    path: string;
    type: SecretType;
    version: number;
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at: string | null;
}

export interface SecretWithValue extends SecretMetadata {
    value: string;
}

export interface SecretListResponse {
    secrets: SecretMetadata[];
}

export interface VaultResponse {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_by_type: string;
    created_at: string;
}

export interface VaultListResponse {
    vaults: VaultResponse[];
}

export interface PolicyResponse {
    id: string;
    vault_id: string;
    secret_path_pattern: string;
    principal_type: string;
    principal_id: string;
    permissions: string[];
    conditions: Record<string, unknown>;
    expires_at: string | null;
    created_by: string;
    created_by_type: string;
    created_at: string;
}

export interface ShareLinkResponse {
    id: string;
    share_url: string;
    recipient_type: string;
    recipient_email?: string;
    expires_at: string;
    max_access_count: number;
}

export interface BalanceChange {
    address: string;
    token?: string;
    token_symbol?: string;
    before?: string;
    after?: string;
    change?: string;
}

export interface SimulationResponse {
    simulation_id: string;
    status: "success" | "reverted" | "error";
    gas_used: number;
    gas_estimate_usd?: string;
    balance_changes: BalanceChange[];
    error?: string;
    error_code?: string;
    error_human_readable?: string;
    revert_reason?: string;
    tenderly_dashboard_url?: string;
    simulated_at: string;
}

export interface BundleSimulationResponse {
    simulations: SimulationResponse[];
}

export interface TransactionResponse {
    id: string;
    agent_id: string;
    chain: string;
    chain_id: number;
    to: string;
    value_wei: string;
    status: string;
    signed_tx?: string;
    tx_hash?: string;
    error_message?: string;
    created_at: string;
    signed_at?: string;
    simulation_id?: string;
    simulation_status?: string;
}

export interface SignTransactionResponse {
    signed_tx: string;
    tx_hash: string;
    from: string;
    to: string;
    chain: string;
    chain_id: number;
    nonce: number;
    value_wei: string;
    status: "sign_only";
    simulation_id?: string;
    simulation_status?: string;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
}

export interface AgentProfile {
    id: string;
    name: string;
    org_id: string;
    is_active: boolean;
    shroud_enabled?: boolean;
    shroud_config?: Record<string, unknown>;
    intents_api_enabled?: boolean;
    created_by?: string;
}

export interface ApiErrorBody {
    type: string;
    title: string;
    status: number;
    detail: string;
}

/** OpenClaw plugin API surface (subset used by this plugin). */
export interface PluginApi {
    logger: {
        info: (msg: string) => void;
        warn: (msg: string) => void;
        error: (msg: string) => void;
    };
    config: Record<string, unknown>;
    registerTool: (tool: PluginTool) => void;
    registerHook: (
        event: string,
        handler: (...args: unknown[]) => unknown,
        meta?: { name?: string; description?: string },
    ) => void;
    on: (
        event: string,
        handler: (event: unknown, ctx: unknown) => unknown,
        opts?: { priority?: number },
    ) => void;
    registerService: (service: {
        id: string;
        start: () => void | Promise<void>;
        stop: () => void | Promise<void>;
    }) => void;
    registerCommand: (cmd: {
        name: string;
        description: string;
        acceptsArgs?: boolean;
        requireAuth?: boolean;
        handler: (ctx: CommandContext) => { text: string } | Promise<{ text: string }>;
    }) => void;
    registerGatewayMethod: (
        method: string,
        handler: (ctx: { respond: (ok: boolean, data: unknown) => void }) => void | Promise<void>,
    ) => void;
}

export interface PluginTool {
    name: string;
    description: string;
    parameters: unknown;
    optional?: boolean;
    execute: (id: unknown, params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
    content: Array<{ type: string; text: string }>;
}

export interface CommandContext {
    senderId?: string;
    channel: string;
    isAuthorizedSender: boolean;
    args?: string;
    commandBody: string;
    config: Record<string, unknown>;
}

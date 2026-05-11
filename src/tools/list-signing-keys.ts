import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listSigningKeysTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_signing_keys",
        description:
            "List all multi-chain signing keys provisioned for this agent. Returns each key's chain, curve, public key, address, and active status.",
        parameters: Type.Object({}),
        optional: true,
        execute: async (_id: unknown, _params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: list_signing_keys requires agent authentication." }] };
            }

            try {
                const result = await client.listSigningKeys(agentId);
                const keys = result.keys ?? [];

                if (keys.length === 0) {
                    return { content: [{ type: "text", text: "No signing keys provisioned. Use oneclaw_provision_signing_key to create one." }] };
                }

                const lines = keys.map((k) => {
                    const parts = [
                        `Chain: ${k.chain}`,
                        `Curve: ${k.curve}`,
                        `Public key: ${k.public_key}`,
                    ];
                    if (k.address) parts.push(`Address: ${k.address}`);
                    parts.push(`Version: ${k.key_version}`);
                    parts.push(`Active: ${k.is_active}`);
                    return parts.join(" | ");
                });

                return { content: [{ type: "text", text: `Signing keys (${keys.length}):\n${lines.join("\n")}` }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                }
                throw err;
            }
        },
    };
}

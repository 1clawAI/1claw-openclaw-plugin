import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function provisionSigningKeyTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_provision_signing_key",
        description:
            "Provision a new multi-chain signing key for this agent. The key's curve is determined by the chain (e.g. secp256k1 for EVM, ed25519 for Solana). Returns the public key and derived address.",
        parameters: Type.Object({
            chain: Type.String({
                description: "Chain ecosystem to create the key for (e.g. 'evm', 'solana', 'bitcoin', 'xrp')",
            }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: provision_signing_key requires agent authentication." }] };
            }

            try {
                const result = await client.createSigningKey(agentId, params.chain as string);

                const lines = [
                    `Signing key provisioned for ${result.chain}`,
                    `Curve: ${result.curve}`,
                    `Public key: ${result.public_key}`,
                ];
                if (result.address) lines.push(`Address: ${result.address}`);
                lines.push(`Version: ${result.key_version}`);

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    if (err.status === 400 || err.status === 403 || err.status === 409) {
                        return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                    }
                }
                throw err;
            }
        },
    };
}

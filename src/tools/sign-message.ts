import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function signMessageTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_sign_message",
        description:
            "Sign a message using the agent's multi-chain signing key (EIP-191 personal_sign). The agent must have message_signing_enabled and an active signing key for the specified chain.",
        parameters: Type.Object({
            message: Type.String({ description: "Message to sign (UTF-8 string or hex-encoded bytes)" }),
            chain: Type.String({ description: "Chain ecosystem (e.g. 'evm', 'solana')" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: sign_message requires agent authentication." }] };
            }

            try {
                const result = await client.sign(agentId, {
                    intent_type: "personal_sign",
                    chain: params.chain as string,
                    message: params.message as string,
                });

                const lines = [
                    `Message signed (${result.intent_type})`,
                    `Chain: ${result.chain}`,
                    `From: ${result.from}`,
                ];
                if (result.signature) lines.push(`Signature: ${result.signature}`);
                if (result.message_hash) lines.push(`Message hash: ${result.message_hash}`);

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    if (err.status === 400 || err.status === 403) {
                        return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                    }
                }
                throw err;
            }
        },
    };
}

import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function signTypedDataTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_sign_typed_data",
        description:
            "Sign EIP-712 typed data using the agent's signing key. The typed_data must be a valid EIP-712 object with domain, types, primaryType, and message fields. Subject to the agent's eip712_domain_allowlist guardrails.",
        parameters: Type.Object({
            typed_data: Type.String({
                description: "EIP-712 typed data as a JSON string (must include domain, types, primaryType, message)",
            }),
            chain: Type.String({ description: "Chain ecosystem (default: 'evm')" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: sign_typed_data requires agent authentication." }] };
            }

            let typedData: unknown;
            try {
                typedData = typeof params.typed_data === "string"
                    ? JSON.parse(params.typed_data as string)
                    : params.typed_data;
            } catch {
                return { content: [{ type: "text", text: "Error: typed_data must be valid JSON." }] };
            }

            try {
                const result = await client.sign(agentId, {
                    intent_type: "typed_data",
                    chain: (params.chain as string) ?? "evm",
                    typed_data: typedData,
                });

                const lines = [
                    `Typed data signed (${result.intent_type})`,
                    `Chain: ${result.chain}`,
                    `From: ${result.from}`,
                ];
                if (result.signature) lines.push(`Signature: ${result.signature}`);
                if (result.typed_data_hash) lines.push(`Typed data hash: ${result.typed_data_hash}`);

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

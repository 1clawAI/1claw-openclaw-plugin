import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function simulateTransactionTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_simulate_transaction",
        description:
            "Simulate an EVM transaction via Tenderly without signing or broadcasting. Returns balance changes, gas estimates, and success/revert status.",
        parameters: Type.Object({
            to: Type.String({ description: "Destination address (0x-prefixed)" }),
            value: Type.String({ description: "Value in ETH (e.g. '0.01')" }),
            chain: Type.String({ description: "Chain name or numeric chain ID" }),
            data: Type.Optional(Type.String({ description: "Hex-encoded calldata" })),
            signing_key_path: Type.Optional(Type.String({ description: "Vault path to signing key" })),
            gas_limit: Type.Optional(Type.Integer({ description: "Gas limit (default: 21000)" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: simulate_transaction requires agent authentication." }] };
            }

            try {
                const result = await client.simulateTransaction(agentId, {
                    to: params.to as string,
                    value: params.value as string,
                    chain: params.chain as string,
                    data: params.data as string | undefined,
                    signing_key_path: params.signing_key_path as string | undefined,
                    gas_limit: params.gas_limit as number | undefined,
                });

                const lines: string[] = [
                    `Simulation ${result.status.toUpperCase()}`,
                    `Gas used: ${result.gas_used}`,
                ];

                if (result.gas_estimate_usd) lines.push(`Gas estimate: ${result.gas_estimate_usd}`);

                if (result.balance_changes.length > 0) {
                    lines.push("", "Balance changes:");
                    for (const bc of result.balance_changes) {
                        const token = bc.token_symbol ?? bc.token ?? "ETH";
                        lines.push(`  ${bc.address}: ${bc.change ?? "?"} ${token}`);
                    }
                }

                if (result.error) lines.push("", `Error: ${result.error}`);
                if (result.error_human_readable) lines.push(`Reason: ${result.error_human_readable}`);
                if (result.tenderly_dashboard_url) lines.push("", `Tenderly: ${result.tenderly_dashboard_url}`);

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    if (err.status === 400 || err.status === 403 || err.status === 422) {
                        return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                    }
                }
                throw err;
            }
        },
    };
}

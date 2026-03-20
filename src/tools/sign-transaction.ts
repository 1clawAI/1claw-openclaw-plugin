import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function signTransactionTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_sign_transaction",
        description:
            "Sign an EVM transaction without broadcasting it. Returns the raw signed_tx hex and tx_hash so the caller can submit to any RPC. All agent guardrails (allowlists, value caps, daily limits) are enforced.",
        parameters: Type.Object({
            to: Type.String({ description: "Destination address (0x-prefixed)" }),
            value: Type.String({ description: "Value in ETH (e.g. '0.01')" }),
            chain: Type.String({ description: "Chain name or numeric chain ID" }),
            data: Type.Optional(Type.String({ description: "Hex-encoded calldata" })),
            signing_key_path: Type.Optional(Type.String({ description: "Vault path to signing key" })),
            nonce: Type.Optional(Type.Integer({ description: "Transaction nonce (auto-resolved if omitted)" })),
            gas_price: Type.Optional(Type.String({ description: "Gas price in wei (legacy mode)" })),
            gas_limit: Type.Optional(Type.Integer({ description: "Gas limit (default: 21000)" })),
            max_fee_per_gas: Type.Optional(Type.String({ description: "EIP-1559 max fee per gas in wei" })),
            max_priority_fee_per_gas: Type.Optional(Type.String({ description: "EIP-1559 max priority fee in wei" })),
            simulate_first: Type.Optional(Type.Boolean({ description: "Run simulation before signing (default: true)" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: sign_transaction requires agent authentication." }] };
            }

            try {
                const result = await client.signTransaction(agentId, {
                    to: params.to as string,
                    value: params.value as string,
                    chain: params.chain as string,
                    data: params.data as string | undefined,
                    signing_key_path: params.signing_key_path as string | undefined,
                    nonce: params.nonce as number | undefined,
                    gas_price: params.gas_price as string | undefined,
                    gas_limit: params.gas_limit as number | undefined,
                    max_fee_per_gas: params.max_fee_per_gas as string | undefined,
                    max_priority_fee_per_gas: params.max_priority_fee_per_gas as string | undefined,
                    simulate_first: (params.simulate_first as boolean) ?? true,
                });

                const lines: string[] = [
                    `Transaction SIGNED (not broadcast)`,
                    `Tx hash: ${result.tx_hash}`,
                    `From: ${result.from}`,
                    `To: ${result.to}`,
                    `Chain: ${result.chain} (${result.chain_id})`,
                    `Nonce: ${result.nonce}`,
                    `Value: ${result.value_wei} wei`,
                    `Signed tx: ${result.signed_tx}`,
                ];

                if (result.simulation_id) lines.push(`Simulation: ${result.simulation_id} (${result.simulation_status})`);

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

import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function createVaultTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_create_vault",
        description:
            "Create a new vault for organising secrets. The vault is owned by this agent and, best-effort, shared back to the human who registered this agent (so they can see/manage it in the dashboard).",
        parameters: Type.Object({
            name: Type.String({ minLength: 1, maxLength: 255, description: "Vault name" }),
            description: Type.Optional(Type.String({ description: "Short description" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const result = await client.createVaultAndShareWithCreator(
                params.name as string,
                params.description as string | undefined,
            );
            const { vault, shared_with, reason } = result;

            const lines: string[] = [
                `Vault created successfully.`,
                `  ID: ${vault.id}`,
                `  Name: ${vault.name}`,
                `  Owner: ${vault.created_by_type}:${vault.created_by}`,
            ];

            if (shared_with) {
                lines.push(
                    `  Shared with human: user:${shared_with.user_id} (${shared_with.permissions.join(", ")})`,
                    `  Policy ID: ${shared_with.policy_id}`,
                );
            } else if (reason) {
                lines.push(`  Sharing note: ${reason}`);
            }

            lines.push(
                ``,
                `This vault is now the default for secret tools in this session — you do **not** need to add ONECLAW_VAULT_ID to Pinata (only ONECLAW_AGENT_API_KEY is required there). The vault ID is not sensitive; share it if helpful.`,
            );

            return {
                content: [{ type: "text", text: lines.join("\n") }],
            };
        },
    };
}

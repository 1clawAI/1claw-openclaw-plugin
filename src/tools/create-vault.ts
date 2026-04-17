import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function createVaultTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_create_vault",
        description:
            "Create a new vault for organising secrets. The vault is owned by this agent and automatically shared with the human who registered you.",
        parameters: Type.Object({
            name: Type.String({ minLength: 1, maxLength: 255, description: "Vault name" }),
            description: Type.Optional(Type.String({ description: "Short description" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const vault = await client.createVault(
                params.name as string,
                params.description as string | undefined,
            );
            return {
                content: [{
                    type: "text",
                    text:
                        `Vault created successfully.\n` +
                        `  ID: ${vault.id}\n` +
                        `  Name: ${vault.name}\n` +
                        `  Owner: ${vault.created_by_type}:${vault.created_by}\n\n` +
                        `This vault is now the default for secret tools in this session — you do **not** need to add ONECLAW_VAULT_ID to Pinata (only ONECLAW_AGENT_API_KEY is required there). ` +
                        `The vault ID is not sensitive; share it if helpful. The vault has been shared with your creator.`,
                }],
            };
        },
    };
}

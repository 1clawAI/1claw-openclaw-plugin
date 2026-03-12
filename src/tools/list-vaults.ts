import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listVaultsTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_vaults",
        description:
            "List all vaults accessible to you. Returns vault IDs, names, and creators. Use this to discover available vaults.",
        parameters: Type.Object({}),
        optional: true,
        execute: async (): Promise<ToolResult> => {
            const data = await client.listVaults();
            const vaults = data.vaults;

            if (vaults.length === 0) {
                return { content: [{ type: "text", text: "No vaults found. Create one with oneclaw_create_vault." }] };
            }

            const lines = vaults.map(
                (v) => `- ${v.name}  (id: ${v.id}, created by: ${v.created_by_type}, ${v.created_at})`,
            );

            return {
                content: [{ type: "text", text: `Found ${vaults.length} vault(s):\n${lines.join("\n")}` }],
            };
        },
    };
}

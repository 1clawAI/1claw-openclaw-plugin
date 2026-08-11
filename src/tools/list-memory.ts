import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listMemoryTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_memory",
        description:
            "List memory entries in a namespace for this agent.",
        parameters: Type.Object({
            namespace: Type.String({ description: "Memory namespace to list entries from" }),
        }),
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const entries = await client.listMemory(params.namespace as string);
            if (entries.length === 0) {
                return { content: [{ type: "text", text: `No memory entries in namespace "${params.namespace}".` }] };
            }
            const lines = entries.map(
                (e: { key: string; tier: string; updated_at: string }) =>
                    `- ${e.key} (tier: ${e.tier}, updated: ${e.updated_at})`,
            );
            return {
                content: [{ type: "text", text: `${entries.length} entries in "${params.namespace}":\n${lines.join("\n")}` }],
            };
        },
    };
}

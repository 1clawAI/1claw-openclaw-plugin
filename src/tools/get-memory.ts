import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function getMemoryTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_get_memory",
        description:
            "Retrieve a memory entry by namespace and key for this agent.",
        parameters: Type.Object({
            namespace: Type.String({ description: "Memory namespace" }),
            key: Type.String({ description: "Entry key within the namespace" }),
        }),
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const entry = await client.getMemory(params.namespace as string, params.key as string);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            { namespace: entry.namespace, key: entry.key, value: entry.value, tier: entry.tier },
                            null,
                            2,
                        ),
                    },
                ],
            };
        },
    };
}

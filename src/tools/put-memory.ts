import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function putMemoryTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_put_memory",
        description:
            "Store or update a memory entry for this agent. Organized by namespace and key with optional TTL for scratch tier.",
        parameters: Type.Object({
            namespace: Type.String({ description: "Memory namespace (e.g. 'context', 'preferences')" }),
            key: Type.String({ description: "Entry key within the namespace" }),
            value: Type.String({ description: "Value to store" }),
            tier: Type.Optional(
                Type.Union([Type.Literal("scratch"), Type.Literal("durable"), Type.Literal("semantic")], {
                    description: "Memory tier: scratch (TTL-based), durable (persistent), or semantic (vector-indexed)",
                }),
            ),
            ttl_secs: Type.Optional(Type.Number({ description: "TTL in seconds (scratch tier only)" })),
        }),
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const ns = params.namespace as string;
            const key = params.key as string;
            const result = await client.putMemory(ns, key, {
                value: params.value as string,
                tier: (params.tier as string) || "durable",
                ttl_secs: params.ttl_secs as number | undefined,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Memory stored: ${ns}/${key} (tier: ${result.tier ?? (params.tier || "durable")})`,
                    },
                ],
            };
        },
    };
}

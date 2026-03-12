import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function rotateAndStoreTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_rotate_and_store",
        description:
            "Store a new value for an existing secret (creating a new version). Use after regenerating an API key at a provider.",
        parameters: Type.Object({
            path: Type.String({ minLength: 1, description: "Secret path to rotate" }),
            value: Type.String({ minLength: 1, description: "The new secret value" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const result = await client.putSecret(params.path as string, {
                value: params.value as string,
                type: "api_key",
            });
            return {
                content: [{ type: "text", text: `Rotated secret at '${params.path}'. New version: ${result.version}.` }],
            };
        },
    };
}

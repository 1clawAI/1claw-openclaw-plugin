import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function putSecretTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_put_secret",
        description:
            "Store a new secret or update an existing one in the 1claw vault. Each call creates a new version. Supports optional expiry and max access count.",
        parameters: Type.Object({
            path: Type.String({ minLength: 1, description: "Secret path, e.g. 'api-keys/stripe'" }),
            value: Type.String({ minLength: 1, description: "The secret value to store" }),
            type: Type.Optional(
                Type.Union([
                    Type.Literal("api_key"),
                    Type.Literal("password"),
                    Type.Literal("private_key"),
                    Type.Literal("certificate"),
                    Type.Literal("file"),
                    Type.Literal("note"),
                    Type.Literal("ssh_key"),
                    Type.Literal("env_bundle"),
                ], { description: "Secret type (default: api_key)" }),
            ),
            metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Optional JSON metadata" })),
            expires_at: Type.Optional(Type.String({ description: "Optional ISO 8601 expiry datetime" })),
            max_access_count: Type.Optional(Type.Integer({ minimum: 1, description: "Max reads before auto-expiry" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const result = await client.putSecret(params.path as string, {
                value: params.value as string,
                type: (params.type as string) ?? "api_key",
                metadata: params.metadata as Record<string, unknown> | undefined,
                expires_at: params.expires_at as string | undefined,
                max_access_count: params.max_access_count as number | undefined,
            });

            return {
                content: [{ type: "text", text: `Secret stored at '${params.path}' (version ${result.version}, type: ${result.type}).` }],
            };
        },
    };
}

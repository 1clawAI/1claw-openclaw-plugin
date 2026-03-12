import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function describeSecretTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_describe_secret",
        description:
            "Get metadata for a secret (type, version, expiry) without fetching its value. Use this to check if a secret exists or is still valid before fetching it.",
        parameters: Type.Object({
            path: Type.String({ minLength: 1, description: "Secret path to describe" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const path = params.path as string;
            const data = await client.listSecrets();
            const match = data.secrets.find((s) => s.path === path);

            if (!match) {
                try {
                    const secret = await client.getSecret(path);
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                path: secret.path,
                                type: secret.type,
                                version: secret.version,
                                metadata: secret.metadata,
                                created_at: secret.created_at,
                                expires_at: secret.expires_at,
                            }, null, 2),
                        }],
                    };
                } catch (err) {
                    if (err instanceof OneClawApiError) {
                        if (err.status === 404) {
                            return { content: [{ type: "text", text: `Error: No secret found at path '${path}'.` }] };
                        }
                        if (err.status === 410) {
                            return { content: [{ type: "text", text: `Error: Secret at path '${path}' is expired or has exceeded its maximum access count.` }] };
                        }
                    }
                    throw err;
                }
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        path: match.path,
                        type: match.type,
                        version: match.version,
                        metadata: match.metadata,
                        created_at: match.created_at,
                        expires_at: match.expires_at,
                    }, null, 2),
                }],
            };
        },
    };
}

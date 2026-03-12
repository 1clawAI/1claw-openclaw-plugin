import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function getSecretTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_get_secret",
        description:
            "Fetch the decrypted value of a secret from the 1claw vault by its path. Use this immediately before making an API call that requires the credential. Do not store the value or include it in summaries.",
        parameters: Type.Object({
            path: Type.String({
                minLength: 1,
                description: "Secret path, e.g. 'api-keys/stripe'",
            }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const path = params.path as string;
            try {
                const secret = await client.getSecret(path);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            path: secret.path,
                            type: secret.type,
                            version: secret.version,
                            value: secret.value,
                        }),
                    }],
                };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    if (err.status === 410) {
                        return { content: [{ type: "text", text: `Error: Secret at path '${path}' is expired or has exceeded its maximum access count.` }] };
                    }
                    if (err.status === 404) {
                        return { content: [{ type: "text", text: `Error: No secret found at path '${path}'.` }] };
                    }
                }
                throw err;
            }
        },
    };
}

import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function getEnvBundleTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_get_env_bundle",
        description:
            "Fetch a secret of type env_bundle, parse its KEY=VALUE lines, and return a structured JSON object. Useful for injecting environment variables into subprocesses.",
        parameters: Type.Object({
            path: Type.String({ minLength: 1, description: "Path to an env_bundle secret" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const path = params.path as string;
            try {
                const secret = await client.getSecret(path);

                if (secret.type !== "env_bundle") {
                    return {
                        content: [{ type: "text", text: `Error: Secret at '${path}' is type '${secret.type}', not 'env_bundle'.` }],
                    };
                }

                const env: Record<string, string> = {};
                for (const line of secret.value.split("\n")) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith("#")) continue;
                    const eqIdx = trimmed.indexOf("=");
                    if (eqIdx === -1) continue;
                    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
                }

                return { content: [{ type: "text", text: JSON.stringify(env, null, 2) }] };
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

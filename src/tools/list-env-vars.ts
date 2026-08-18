import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listEnvVarsTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_env_vars",
        description:
            "List environment variables for a vault. Optionally filter by environment name.",
        parameters: Type.Object({
            environment: Type.Optional(
                Type.String({
                    description:
                        "Filter by environment (e.g. 'production', 'preview', 'development')",
                }),
            ),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const environment = params.environment as string | undefined;

            try {
                const result = await client.listEnvVars(environment);
                const envVars = result.env_vars;

                if (!envVars || envVars.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: environment
                                    ? `No environment variables found for environment '${environment}'.`
                                    : "No environment variables found in this vault.",
                            },
                        ],
                    };
                }

                const lines = envVars.map((v) => {
                    const key = v.env_key as string;
                    const envs = (v.environments as string[])?.join(", ") ?? "all";
                    const sensitive = v.sensitive ? " [sensitive]" : "";
                    const branch = v.git_branch ? ` (branch: ${v.git_branch})` : "";
                    return `- ${key}  (environments: ${envs}${branch}${sensitive})`;
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${envVars.length} env var(s):\n${lines.join("\n")}`,
                        },
                    ],
                };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    return {
                        content: [
                            { type: "text", text: `Error listing env vars: ${err.detail}` },
                        ],
                    };
                }
                throw err;
            }
        },
    };
}

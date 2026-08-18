import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function resolveEnvTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_resolve_env",
        description:
            "Resolve environment variables for a vault, returning the final KEY=VALUE set with precedence applied (shared < vault < branch override).",
        parameters: Type.Object({
            environment: Type.String({
                minLength: 1,
                description:
                    "Named environment to resolve (e.g. 'production', 'preview', 'development')",
            }),
            git_branch: Type.Optional(
                Type.String({
                    description:
                        "Git branch for branch-specific overrides (e.g. 'feat/login')",
                }),
            ),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const environment = params.environment as string;
            const gitBranch = params.git_branch as string | undefined;

            try {
                const result = await client.resolveEnvVars(environment, gitBranch);
                const vars = result.vars as Record<string, string> | undefined;

                if (!vars || Object.keys(vars).length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `No environment variables resolved for environment '${environment}'${gitBranch ? ` (branch: ${gitBranch})` : ""}.`,
                            },
                        ],
                    };
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    return {
                        content: [
                            { type: "text", text: `Error resolving env vars: ${err.detail}` },
                        ],
                    };
                }
                throw err;
            }
        },
    };
}

import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function createEnvVarTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_create_env_var",
        description:
            "Create an environment variable in the vault. Supports targeting specific environments and marking as sensitive (write-only after creation).",
        parameters: Type.Object({
            key: Type.String({
                minLength: 1,
                description: "Environment variable key (e.g. 'DATABASE_URL')",
            }),
            value: Type.String({
                description: "Environment variable value",
            }),
            environments: Type.Optional(
                Type.Array(Type.String(), {
                    description:
                        "Target environments (e.g. ['production', 'preview']). Omit for all environments.",
                }),
            ),
            sensitive: Type.Optional(
                Type.Boolean({
                    description:
                        "Mark as sensitive — value becomes write-only after creation (cannot be read back via list/get)",
                }),
            ),
            comment: Type.Optional(
                Type.String({
                    description: "Optional comment describing this variable",
                }),
            ),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const key = params.key as string;
            const value = params.value as string;
            const environments = params.environments as string[] | undefined;
            const sensitive = params.sensitive as boolean | undefined;
            const comment = params.comment as string | undefined;

            try {
                const body: Record<string, unknown> = { key, value };
                if (environments) body.environments = environments;
                if (sensitive !== undefined) body.sensitive = sensitive;
                if (comment) body.comment = comment;

                const result = await client.createEnvVar(body as Parameters<typeof client.createEnvVar>[0]);

                const envs = environments?.join(", ") ?? "all";
                return {
                    content: [
                        {
                            type: "text",
                            text: `Created env var '${key}' targeting environments: ${envs}${sensitive ? " [sensitive]" : ""}.\n${JSON.stringify(result, null, 2)}`,
                        },
                    ],
                };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    return {
                        content: [
                            { type: "text", text: `Error creating env var: ${err.detail}` },
                        ],
                    };
                }
                throw err;
            }
        },
    };
}

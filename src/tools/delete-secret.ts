import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function deleteSecretTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_delete_secret",
        description:
            "Soft-delete a secret at the given path. All versions are marked deleted. This is reversible by an admin.",
        parameters: Type.Object({
            path: Type.String({ minLength: 1, description: "Secret path to delete" }),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const path = params.path as string;
            try {
                await client.deleteSecret(path);
                return { content: [{ type: "text", text: `Secret at '${path}' has been soft-deleted.` }] };
            } catch (err) {
                if (err instanceof OneClawApiError && err.status === 404) {
                    return { content: [{ type: "text", text: `Error: No secret found at path '${path}'.` }] };
                }
                throw err;
            }
        },
    };
}

import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function grantAccessTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_grant_access",
        description:
            "Grant a user or agent access to one of your vaults. You can only grant access on vaults you created.",
        parameters: Type.Object({
            vault_id: Type.String({ description: "UUID of the vault to share" }),
            principal_type: Type.Union([Type.Literal("user"), Type.Literal("agent")], {
                description: "Type of principal",
            }),
            principal_id: Type.String({ description: "UUID of the user or agent" }),
            permissions: Type.Optional(
                Type.Array(Type.String(), { description: "Permissions to grant (default: ['read'])" }),
            ),
            secret_path_pattern: Type.Optional(
                Type.String({ description: "Glob pattern for secret paths (default: '**')" }),
            ),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const permissions = (params.permissions as string[]) ?? ["read"];
            const pathPattern = (params.secret_path_pattern as string) ?? "**";

            const policy = await client.createPolicy(
                params.vault_id as string,
                params.principal_type as string,
                params.principal_id as string,
                permissions,
                pathPattern,
            );

            return {
                content: [{
                    type: "text",
                    text:
                        `Access granted.\n` +
                        `  Policy ID: ${policy.id}\n` +
                        `  Vault: ${policy.vault_id}\n` +
                        `  Granted to: ${policy.principal_type}:${policy.principal_id}\n` +
                        `  Permissions: ${policy.permissions.join(", ")}\n` +
                        `  Path pattern: ${policy.secret_path_pattern}`,
                }],
            };
        },
    };
}

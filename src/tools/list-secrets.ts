import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listSecretsTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_secrets",
        description:
            "List all secrets stored in the 1claw vault. Returns paths, types, versions, and metadata — never secret values. Use this to discover what credentials are available before fetching one.",
        parameters: Type.Object({
            prefix: Type.Optional(
                Type.String({ description: "Path prefix to filter secrets (e.g. 'api-keys/')" }),
            ),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const data = await client.listSecrets();
            let secrets = data.secrets;
            const prefix = params.prefix as string | undefined;

            if (prefix) {
                secrets = secrets.filter((s) => s.path.startsWith(prefix));
            }

            if (secrets.length === 0) {
                return { content: [{ type: "text", text: "No secrets found in this vault." }] };
            }

            const lines = secrets.map(
                (s) =>
                    `- ${s.path}  (type: ${s.type}, version: ${s.version}, expires: ${s.expires_at ?? "never"})`,
            );

            return {
                content: [{ type: "text", text: `Found ${secrets.length} secret(s):\n${lines.join("\n")}` }],
            };
        },
    };
}

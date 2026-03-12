import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function shareSecretTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_share_secret",
        description:
            "Share a specific secret with a user, agent, or your creator (the human who registered you). " +
            "Use recipient_type 'creator' to share back with the human — no recipient_id needed.",
        parameters: Type.Object({
            secret_id: Type.String({ description: "UUID of the secret to share" }),
            recipient_type: Type.Union([
                Type.Literal("user"),
                Type.Literal("agent"),
                Type.Literal("anyone_with_link"),
                Type.Literal("creator"),
            ], { description: "Recipient type" }),
            recipient_id: Type.Optional(Type.String({ description: "UUID of recipient (required for user/agent)" })),
            expires_at: Type.String({ description: "ISO-8601 expiry date" }),
            max_access_count: Type.Optional(Type.Integer({ minimum: 1, description: "Max accesses (default: 5)" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const recipientType = params.recipient_type as string;
            const recipientId = params.recipient_id as string | undefined;

            if ((recipientType === "user" || recipientType === "agent") && !recipientId) {
                return {
                    content: [{ type: "text", text: `Error: recipient_id is required when sharing with a ${recipientType}.` }],
                };
            }

            const share = await client.shareSecret(params.secret_id as string, {
                recipient_type: recipientType,
                recipient_id: recipientId,
                expires_at: params.expires_at as string,
                max_access_count: (params.max_access_count as number) ?? 5,
            });

            const recipientLabel =
                recipientType === "creator"
                    ? "your creator (the human who registered this agent)"
                    : `${recipientType}${recipientId ? ` (${recipientId})` : ""}`;

            return {
                content: [{
                    type: "text",
                    text:
                        `Secret shared successfully.\n` +
                        `  Share ID: ${share.id}\n` +
                        `  Recipient: ${recipientLabel}\n` +
                        `  Expires: ${share.expires_at}\n` +
                        `  Max accesses: ${share.max_access_count}\n` +
                        `  URL: ${share.share_url}\n\n` +
                        `The recipient must accept the share before they can access the secret.`,
                }],
            };
        },
    };
}

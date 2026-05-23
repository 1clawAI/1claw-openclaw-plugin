import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function requestApprovalTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_request_approval",
        description:
            "Request human approval for a policy change or sensitive action. " +
            "Creates a pending approval that the agent's human operator must review.",
        parameters: Type.Object({
            action: Type.String({
                description:
                    "Type of action being requested (e.g. 'policy_change', 'access_request')",
            }),
            target_type: Type.String({
                description:
                    "Type of target resource (e.g. 'policy', 'vault', 'secret')",
            }),
            target_id: Type.String({
                description: "ID of the target resource",
            }),
            summary: Type.Record(Type.String(), Type.Unknown(), {
                description:
                    "JSON summary of the requested change",
            }),
            reason: Type.Optional(
                Type.String({
                    description: "Human-readable reason for the request",
                }),
            ),
            risk_tier: Type.Optional(
                Type.Number({
                    description: "Risk level 1-5 (1=low, 5=critical). Default: 1",
                }),
            ),
        }),
        execute: async (
            _id: unknown,
            params: Record<string, unknown>,
        ): Promise<ToolResult> => {
            const result = await client.requestApproval({
                action: params.action as string,
                target_type: params.target_type as string,
                target_id: params.target_id as string,
                summary: params.summary as Record<string, unknown>,
                reason: params.reason as string | undefined,
                risk_tier: params.risk_tier as number | undefined,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `Approval request created.\nID: ${result.id}\nStatus: ${result.status}\nThe human operator will be notified to review this request.`,
                    },
                ],
            };
        },
    };
}

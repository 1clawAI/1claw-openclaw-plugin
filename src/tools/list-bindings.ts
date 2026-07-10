import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listBindingsTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_bindings",
        description:
            "List all active bindings for this agent. Bindings are pre-configured credential handles for external services (HTTP, GraphQL, databases, etc.). Created by humans — agents can only use them.",
        parameters: Type.Object({}),
        optional: true,
        execute: async (_id: unknown, _params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: list_bindings requires agent authentication." }] };
            }

            try {
                const result = await client.listBindings(agentId);
                const bindings = result.bindings ?? [];

                if (bindings.length === 0) {
                    return { content: [{ type: "text", text: "No bindings configured. A human can create them at 1claw.xyz/dashboard on the agent detail page." }] };
                }

                const lines = bindings.map((b: any) => {
                    const parts = [
                        `Name: ${b.name}`,
                        `Type: ${b.binding_type}`,
                    ];
                    if (b.base_url) parts.push(`URL: ${b.base_url}`);
                    parts.push(`Active: ${b.is_active ?? true}`);
                    return parts.join(" | ");
                });

                return { content: [{ type: "text", text: `Bindings (${bindings.length}):\n${lines.join("\n")}` }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                }
                throw err;
            }
        },
    };
}

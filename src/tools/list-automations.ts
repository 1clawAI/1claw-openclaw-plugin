import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function listAutomationsTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_list_automations",
        description: "List all automations in the organization.",
        parameters: Type.Object({}),
        execute: async (): Promise<ToolResult> => {
            const data = await client.listAutomations();
            const automations = data.automations ?? [];
            if (automations.length === 0) {
                return { content: [{ type: "text", text: "No automations configured." }] };
            }
            // Same as list-memory: narrow the array, not the callback param.
            const lines = (
                automations as Array<{
                    name: string;
                    trigger_type: string;
                    is_active: boolean;
                    last_run_status?: string;
                }>
            ).map(
                (a) =>
                    `- ${a.name} (trigger: ${a.trigger_type}, active: ${a.is_active}, last: ${a.last_run_status ?? "never"})`,
            );
            return {
                content: [{ type: "text", text: `${automations.length} automation(s):\n${lines.join("\n")}` }],
            };
        },
    };
}

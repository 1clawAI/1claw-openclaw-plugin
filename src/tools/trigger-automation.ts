import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function triggerAutomationTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_trigger_automation",
        description: "Manually trigger an automation workflow.",
        parameters: Type.Object({
            automation_id: Type.String({ description: "UUID of the automation to trigger" }),
        }),
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const run = await client.triggerAutomation(params.automation_id as string);
            return {
                content: [
                    {
                        type: "text",
                        text: `Automation triggered. Run ID: ${run.id}, status: ${run.status}`,
                    },
                ],
            };
        },
    };
}

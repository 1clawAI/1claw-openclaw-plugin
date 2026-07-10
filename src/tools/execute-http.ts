import { Type } from "@sinclair/typebox";
import type { OneClawClient } from "../client.js";
import { OneClawApiError } from "../client.js";
import type { PluginTool, ToolResult } from "../types.js";

export function executeHttpTool(client: OneClawClient): PluginTool {
    return {
        name: "oneclaw_execute_http",
        description:
            "Execute an HTTP request through a pre-configured binding. The binding's credential is injected server-side — the agent never sees it. Requires execution_intents_enabled on the agent (Pro+ plan).",
        parameters: Type.Object({
            binding: Type.String({ description: "Name of the binding to use (e.g. 'github-api', 'stripe')" }),
            method: Type.Optional(Type.String({ description: "HTTP method (default: GET)" })),
            path: Type.Optional(Type.String({ description: "URL path appended to the binding's base_url" })),
            headers: Type.Optional(Type.Record(Type.String(), Type.String(), { description: "Additional HTTP headers" })),
            body: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "JSON request body (for POST/PUT/PATCH)" })),
            execution_mode: Type.Optional(Type.String({ description: "Execution surface: 'vault' (standard) or 'tee' (Shroud TEE, Business+ only)" })),
        }),
        optional: true,
        execute: async (_id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const agentId = client.agentId;
            if (!agentId) {
                return { content: [{ type: "text", text: "Error: execute_http requires agent authentication." }] };
            }

            try {
                const result = await client.executeHttp(agentId, {
                    binding: params.binding as string,
                    method: params.method as string | undefined,
                    path: params.path as string | undefined,
                    headers: params.headers as Record<string, string> | undefined,
                    body: params.body as Record<string, unknown> | undefined,
                    execution_mode: params.execution_mode as string | undefined,
                });

                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            } catch (err) {
                if (err instanceof OneClawApiError) {
                    if (err.status === 400 || err.status === 403 || err.status === 422) {
                        return { content: [{ type: "text", text: `Error: ${err.detail}` }] };
                    }
                }
                throw err;
            }
        },
    };
}

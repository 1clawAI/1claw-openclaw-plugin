import type { OneClawClient } from "../client.js";
import type { PluginApi, PluginTool, ToolResult } from "../types.js";
import type { ResolvedConfig } from "../config.js";
import { inspectInput, inspectOutput } from "../security/index.js";

import { listSecretsTool } from "./list-secrets.js";
import { getSecretTool } from "./get-secret.js";
import { putSecretTool } from "./put-secret.js";
import { deleteSecretTool } from "./delete-secret.js";
import { describeSecretTool } from "./describe-secret.js";
import { rotateAndStoreTool } from "./rotate-and-store.js";
import { getEnvBundleTool } from "./get-env-bundle.js";
import { createVaultTool } from "./create-vault.js";
import { listVaultsTool } from "./list-vaults.js";
import { grantAccessTool } from "./grant-access.js";
import { shareSecretTool } from "./share-secret.js";
import { simulateTransactionTool } from "./simulate-transaction.js";
import { submitTransactionTool } from "./submit-transaction.js";

type ToolFactory = (client: OneClawClient) => PluginTool;

const ALL_TOOL_FACTORIES: ToolFactory[] = [
    listSecretsTool,
    getSecretTool,
    putSecretTool,
    deleteSecretTool,
    describeSecretTool,
    rotateAndStoreTool,
    getEnvBundleTool,
    createVaultTool,
    listVaultsTool,
    grantAccessTool,
    shareSecretTool,
    simulateTransactionTool,
    submitTransactionTool,
];

function wrapWithSecurity(
    tool: PluginTool,
    api: PluginApi,
    config: ResolvedConfig,
): PluginTool {
    const originalExecute = tool.execute;

    return {
        ...tool,
        execute: async (id: unknown, params: Record<string, unknown>): Promise<ToolResult> => {
            const inputCheck = inspectInput(tool.name, params, config.securityMode);

            if (!inputCheck.passed) {
                const threat = inputCheck.threats[0];
                api.logger.warn(
                    `[1claw/security] Blocked ${tool.name}: ${threat?.type} (${threat?.pattern})`,
                );
                return {
                    content: [{ type: "text", text: `Security check failed: ${threat?.type} detected` }],
                };
            }

            if (inputCheck.threats.length > 0) {
                api.logger.info(
                    `[1claw/security] Warnings for ${tool.name}: ${inputCheck.threats.map((t) => t.pattern).join(", ")}`,
                );
            }

            const result = await originalExecute(id, params);

            const outputText = result.content.map((c) => c.text).join("\n");
            const outputCheck = inspectOutput(tool.name, outputText);
            if (outputCheck.threats.length > 0) {
                api.logger.info(
                    `[1claw/security] Output warnings for ${tool.name}: ${outputCheck.threats.map((t) => t.pattern).join(", ")}`,
                );
            }

            return result;
        },
    };
}

export function registerAllTools(
    api: PluginApi,
    client: OneClawClient,
    config: ResolvedConfig,
): void {
    for (const factory of ALL_TOOL_FACTORIES) {
        const tool = factory(client);
        const secured = wrapWithSecurity(tool, api, config);
        api.registerTool(secured);
    }
    api.logger.info(`[1claw] Registered ${ALL_TOOL_FACTORIES.length} agent tools`);
}

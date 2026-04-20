import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";
import type { ResolvedConfig } from "../config.js";
import { statusCommand } from "./status.js";
import { listCommand } from "./list.js";
import { rotateCommand } from "./rotate.js";
import { enrollCommand } from "./enroll.js";
import { bootstrapCommand } from "./bootstrap.js";

export function registerUnauthenticatedCommands(
    api: PluginApi,
    config: ResolvedConfig,
): void {
    api.registerCommand(enrollCommand(config));
    api.logger.info("[1claw] Registered unauthenticated commands (/oneclaw-enroll)");
}

export function registerAllCommands(
    api: PluginApi,
    client: OneClawClient,
    config: ResolvedConfig,
): void {
    api.registerCommand(statusCommand(client, config));
    api.registerCommand(listCommand(client));
    api.registerCommand(rotateCommand(client));
    api.registerCommand(bootstrapCommand(client, config));

    api.logger.info(
        "[1claw] Registered 4 slash commands (/oneclaw, /oneclaw-list, /oneclaw-rotate, /oneclaw-bootstrap)",
    );
}

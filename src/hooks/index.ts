import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";
import type { ResolvedConfig } from "../config.js";
import { registerSecretRedaction } from "./secret-redaction.js";
import { registerSecretInjection } from "./secret-injection.js";
import { registerShroudRouting } from "./shroud-routing.js";

export function registerAllHooks(
    api: PluginApi,
    client: OneClawClient,
    config: ResolvedConfig,
): void {
    if (config.features.secretRedaction) {
        registerSecretRedaction(api, client);
    }

    if (config.features.secretInjection) {
        registerSecretInjection(api, client);
    }

    if (config.features.shroudRouting) {
        registerShroudRouting(api, client, config.shroudUrl);
    }
}

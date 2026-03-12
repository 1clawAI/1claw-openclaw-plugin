import type { OneClawClient } from "../client.js";
import type { PluginApi } from "../types.js";
import type { ResolvedConfig } from "../config.js";
import { createTokenRefreshService } from "./token-refresh.js";
import { createKeyRotationService } from "./key-rotation.js";

export function registerAllServices(
    api: PluginApi,
    client: OneClawClient,
    config: ResolvedConfig,
): void {
    api.registerService(createTokenRefreshService(api, client));

    if (config.features.keyRotationMonitor) {
        api.registerService(createKeyRotationService(api, client));
    }
}

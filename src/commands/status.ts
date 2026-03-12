import type { OneClawClient } from "../client.js";
import type { ResolvedConfig } from "../config.js";

export function statusCommand(client: OneClawClient, config: ResolvedConfig) {
    return {
        name: "oneclaw",
        description: "Show 1claw connection status, vault info, token TTL, and enabled features",
        handler: async () => {
            const lines: string[] = ["1Claw Status", "─".repeat(30)];

            lines.push(`API: ${config.baseUrl}`);
            lines.push(`Shroud: ${config.shroudUrl}`);
            lines.push(`Authenticated: ${client.isAuthenticated ? "yes" : "no"}`);

            if (client.agentId) {
                lines.push(`Agent ID: ${client.agentId}`);
            }

            if (client.vaultId) {
                lines.push(`Vault ID: ${client.vaultId}`);
            }

            const ttlMin = Math.round(client.tokenTtlMs / 60_000);
            lines.push(`Token TTL: ${ttlMin > 0 ? `${ttlMin} min` : "expired or not set"}`);

            lines.push("", "Features:");
            const features = config.features;
            lines.push(`  Tools: ${features.tools ? "on" : "off"}`);
            lines.push(`  Secret injection: ${features.secretInjection ? "on" : "off"}`);
            lines.push(`  Secret redaction: ${features.secretRedaction ? "on" : "off"}`);
            lines.push(`  Shroud routing: ${features.shroudRouting ? "on" : "off"}`);
            lines.push(`  Key rotation monitor: ${features.keyRotationMonitor ? "on" : "off"}`);
            lines.push(`  Slash commands: ${features.slashCommands ? "on" : "off"}`);
            lines.push(`  Security mode: ${config.securityMode}`);

            try {
                const vaults = await client.listVaults();
                lines.push("", `Vaults accessible: ${vaults.vaults.length}`);
            } catch {
                lines.push("", "Vaults: unable to list (check credentials)");
            }

            return { text: lines.join("\n") };
        },
    };
}

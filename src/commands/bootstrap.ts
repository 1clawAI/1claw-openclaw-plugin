import fs from "node:fs/promises";
import path from "node:path";
import type { OneClawClient } from "../client.js";
import type { ResolvedConfig } from "../config.js";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const IDENTITY_DIR = ".1claw";
const IDENTITY_FILE = "identity.env";

/**
 * `/oneclaw-bootstrap` — one-shot self-setup run by the agent on first boot.
 *
 * 1. Resolves the real agent ID via the auth token exchange (never trusts a
 *    hallucinated UUID).
 * 2. Ensures at least one vault exists; if none, creates `<agent-name>-shared`
 *    and shares it with the human who registered the agent.
 * 3. Writes the resolved, non-secret IDs to `<cwd>/.1claw/identity.env` so the
 *    human can see which agent/org/vault is wired up. The `ocv_` API key is
 *    never written to this file.
 */
export function bootstrapCommand(client: OneClawClient, config: ResolvedConfig) {
    return {
        name: "oneclaw-bootstrap",
        description:
            "Resolve real agent identity, auto-create and share a vault if none exists, and write non-secret IDs to .1claw/identity.env",
        handler: async (): Promise<{ text: string }> => {
            const lines: string[] = ["1Claw bootstrap", "─".repeat(30)];

            try {
                await client.ensureToken();
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    text:
                        `Bootstrap failed while authenticating: ${msg}\n\n` +
                        `Make sure ONECLAW_AGENT_API_KEY is set in the agent host (e.g. Pinata → ` +
                        `Settings → Environment Variables) and that the agent was restarted after ` +
                        `setting it. Run /oneclaw-enroll first if you do not yet have an API key.`,
                };
            }

            const agentId = client.agentId;
            if (!agentId || agentId === NIL_UUID) {
                return {
                    text:
                        "Bootstrap aborted: could not resolve a real agent ID from the API key. " +
                        "Double-check ONECLAW_AGENT_API_KEY (no quotes, no whitespace) and restart the agent. " +
                        "Never write or pass the zero UUID 00000000-0000-0000-0000-000000000000.",
                };
            }

            let profile;
            try {
                profile = await client.getAgentProfile();
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    text: `Bootstrap failed while loading agent profile: ${msg}`,
                };
            }

            lines.push(`Agent: ${profile.name} (${profile.id})`);
            lines.push(`Org: ${profile.org_id}`);
            if (profile.created_by) {
                lines.push(`Created by (human user): ${profile.created_by}`);
            } else {
                lines.push(
                    "Created by: (not set — agent was enrolled without an email; " +
                        "the human must grant themselves vault access manually)",
                );
            }

            await client.ensureVaultResolved();

            let vaultId = client.vaultId;
            let createdVaultName: string | undefined;
            let shareNote: string | undefined;

            if (!vaultId) {
                const baseName = (profile.name || "agent")
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 200) || "agent";
                try {
                    const result = await client.createVaultAndShareWithCreator(
                        `${baseName}-shared`,
                        "Auto-created by @1claw/openclaw-plugin bootstrap. Shared with the human who enrolled this agent.",
                    );
                    vaultId = result.vault.id;
                    createdVaultName = result.vault.name;
                    lines.push("", `Created vault: ${result.vault.name} (${result.vault.id})`);
                    if (result.shared_with) {
                        lines.push(
                            `  Shared with: user:${result.shared_with.user_id} (${result.shared_with.permissions.join(", ")})`,
                        );
                    } else if (result.reason) {
                        shareNote = result.reason;
                        lines.push(`  Sharing note: ${result.reason}`);
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    return {
                        text:
                            lines.join("\n") +
                            `\n\nBootstrap failed while creating the initial vault: ${msg}\n` +
                            `Fix this by either asking the human to create a vault in the dashboard ` +
                            `or resolving the error (billing/tier, permissions, network) and re-running /oneclaw-bootstrap.`,
                    };
                }
            } else {
                lines.push("", `Active vault: ${vaultId} (already existed — no sharing change made)`);
            }

            const cwd = process.cwd();
            const dir = path.join(cwd, IDENTITY_DIR);
            const file = path.join(dir, IDENTITY_FILE);
            const body = [
                "# Auto-generated by @1claw/openclaw-plugin bootstrap. Safe to commit.",
                "# Contains non-secret identifiers only — never write ONECLAW_AGENT_API_KEY here.",
                "# The API key belongs in your agent host's environment variables (e.g. Pinata → Settings).",
                `ONECLAW_AGENT_ID=${profile.id}`,
                `ONECLAW_ORG_ID=${profile.org_id}`,
                `ONECLAW_VAULT_ID=${vaultId ?? ""}`,
                profile.created_by ? `ONECLAW_CREATED_BY=${profile.created_by}` : null,
                `ONECLAW_BASE_URL=${config.baseUrl}`,
                "",
            ]
                .filter((l): l is string => l !== null)
                .join("\n");

            try {
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(file, body, { encoding: "utf8", mode: 0o644 });
                lines.push("", `Wrote identity file: ${file}`);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                lines.push(
                    "",
                    `Could not write ${file} (${msg}). IDs above are still valid; copy them manually if needed.`,
                );
            }

            lines.push(
                "",
                createdVaultName && !shareNote
                    ? "Bootstrap complete. Your human now has owner-level access to the new vault from https://1claw.xyz."
                    : createdVaultName && shareNote
                      ? "Bootstrap complete (vault created, but sharing skipped — see note above)."
                      : "Bootstrap complete. Using an existing vault.",
            );

            return { text: lines.join("\n") };
        },
    };
}

import type { OneClawClient } from "../client.js";

export function listCommand(client: OneClawClient) {
    return {
        name: "oneclaw-list",
        description: "List secret paths in the vault (metadata only, no values)",
        acceptsArgs: true,
        handler: async (ctx: { args?: string }) => {
            try {
                const data = await client.listSecrets();
                let secrets = data.secrets;
                const prefix = ctx.args?.trim();

                if (prefix) {
                    secrets = secrets.filter((s) => s.path.startsWith(prefix));
                }

                if (secrets.length === 0) {
                    return { text: prefix ? `No secrets matching prefix '${prefix}'.` : "No secrets in vault." };
                }

                const lines = secrets.map(
                    (s) => `${s.path}  (${s.type}, v${s.version}${s.expires_at ? `, expires ${s.expires_at}` : ""})`,
                );

                return { text: `${secrets.length} secret(s):\n${lines.join("\n")}` };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { text: `Error listing secrets: ${msg}` };
            }
        },
    };
}

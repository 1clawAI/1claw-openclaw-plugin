import type { ResolvedConfig } from "../config.js";

interface EnrollResponse {
    agent_id: string;
    name: string;
    message?: string;
}

export function enrollCommand(config: ResolvedConfig) {
    return {
        name: "oneclaw-enroll",
        description: "Self-enroll a new 1claw agent. Usage: /oneclaw-enroll email@example.com [agent-name]",
        acceptsArgs: true,
        handler: async (ctx: { args?: string; commandBody: string }) => {
            const args = (ctx.args ?? ctx.commandBody ?? "").trim();
            const parts = args.split(/\s+/);
            const email = parts[0];
            const name = parts.slice(1).join(" ") || "openclaw-agent";

            if (!email || !email.includes("@")) {
                return {
                    text: "Usage: /oneclaw-enroll your-email@example.com [agent-name]\n\nThis registers a new agent with 1claw. The API key will be emailed to you.",
                };
            }

            try {
                const res = await fetch(`${config.baseUrl}/v1/agents/enroll`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        human_email: email,
                        description: "OpenClaw agent",
                    }),
                });

                if (!res.ok) {
                    let detail = `HTTP ${res.status}`;
                    try {
                        const body = (await res.json()) as { detail?: string };
                        if (body.detail) detail = body.detail;
                    } catch {
                        /* use default */
                    }
                    return { text: `Enrollment failed: ${detail}` };
                }

                const data = (await res.json()) as EnrollResponse;
                const lines = [
                    "Agent enrolled successfully!",
                    "",
                    `Agent ID: ${data.agent_id}`,
                    `Name: ${data.name}`,
                    "",
                    `Check ${email} for your API key. Then:`,
                    "",
                    "1. Create a vault and policy in the 1claw dashboard (https://1claw.xyz)",
                    "2. Set these environment variables:",
                    `   export ONECLAW_AGENT_ID="${data.agent_id}"`,
                    '   export ONECLAW_AGENT_API_KEY="ocv_..."',
                    '   export ONECLAW_VAULT_ID="<vault-id>"',
                    "",
                    "3. Restart OpenClaw to pick up the new credentials.",
                ];
                return { text: lines.join("\n") };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { text: `Enrollment error: ${msg}` };
            }
        },
    };
}

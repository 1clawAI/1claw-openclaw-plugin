import type { ResolvedConfig } from "../config.js";

/** Matches POST /v1/agents/enroll response (OpenAPI EnrollAgentResponse). */
interface EnrollResponse {
    agent_id?: string;
    message?: string;
    approval_url?: string;
}

const NIL_AGENT_ID = "00000000-0000-0000-0000-000000000000";

export function enrollCommand(config: ResolvedConfig) {
    return {
        name: "oneclaw-enroll",
        description:
            "Self-enroll a 1claw agent. Usage: /oneclaw-enroll you@example.com [agent-name] — or name only: /oneclaw-enroll my-agent",
        acceptsArgs: true,
        handler: async (ctx: { args?: string; commandBody: string }) => {
            const raw = (ctx.args ?? ctx.commandBody ?? "").trim();
            const parts = raw.split(/\s+/).filter(Boolean);

            if (parts.length === 0) {
                return {
                    text: [
                        "Usage:",
                        "  • /oneclaw-enroll you@example.com [agent-name]  — email + optional name (approval email sent; approval URL may appear below too)",
                        "  • /oneclaw-enroll my-agent-name  — link-only enrollment (open the approval URL while signed in at 1claw.xyz)",
                        "",
                        "After approval, add ONECLAW_AGENT_API_KEY to your agent host (e.g. Pinata → Environment Variables) and restart.",
                    ].join("\n"),
                };
            }

            let human_email: string | undefined;
            let name: string;

            if (parts[0].includes("@")) {
                human_email = parts[0].toLowerCase();
                name = parts.slice(1).join(" ").trim() || "openclaw-agent";
            } else {
                name = parts.join(" ").trim() || "openclaw-agent";
            }

            const body: Record<string, string> = {
                name,
                description: "OpenClaw agent",
            };
            if (human_email) {
                body.human_email = human_email;
            }

            try {
                const res = await fetch(`${config.baseUrl}/v1/agents/enroll`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    let detail = `HTTP ${res.status}`;
                    try {
                        const errBody = (await res.json()) as { detail?: string };
                        if (errBody.detail) detail = errBody.detail;
                    } catch {
                        /* use default */
                    }
                    return { text: `Enrollment failed: ${detail}` };
                }

                const data = (await res.json()) as EnrollResponse;
                const lines: string[] = [];

                if (data.approval_url) {
                    lines.push(
                        "Open this link while signed in to your 1claw account to approve (save it — also check email if you used one):",
                        "",
                        data.approval_url,
                        "",
                    );
                }

                if (data.message) {
                    lines.push(data.message);
                } else {
                    lines.push(
                        human_email
                            ? "If this email matches a 1claw account, check your inbox for Allow/Deny links."
                            : "Use the approval URL above to finish enrollment.",
                    );
                }

                const aid = data.agent_id;
                if (aid && aid !== NIL_AGENT_ID) {
                    lines.push("", `Agent ID (after creation): ${aid}`);
                }

                lines.push(
                    "",
                    "After you click Allow, copy the API key from the approval page or email, then:",
                    "  • Pinata: Settings → Environment Variables → ONECLAW_AGENT_API_KEY = (paste key only)",
                    "  • Restart the agent and run /oneclaw to verify.",
                );

                return { text: lines.join("\n") };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { text: `Enrollment error: ${msg}` };
            }
        },
    };
}

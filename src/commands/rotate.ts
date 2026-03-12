import type { OneClawClient } from "../client.js";

export function rotateCommand(client: OneClawClient) {
    return {
        name: "oneclaw-rotate",
        description: "Rotate a secret to a new value: /oneclaw-rotate <path> <new-value>",
        acceptsArgs: true,
        requireAuth: true,
        handler: async (ctx: { args?: string }) => {
            const args = ctx.args?.trim();
            if (!args) {
                return { text: "Usage: /oneclaw-rotate <path> <new-value>" };
            }

            const spaceIdx = args.indexOf(" ");
            if (spaceIdx === -1) {
                return { text: "Usage: /oneclaw-rotate <path> <new-value>\nBoth path and new value are required." };
            }

            const path = args.slice(0, spaceIdx);
            const newValue = args.slice(spaceIdx + 1).trim();

            if (!newValue) {
                return { text: "Usage: /oneclaw-rotate <path> <new-value>\nNew value cannot be empty." };
            }

            try {
                const result = await client.putSecret(path, {
                    value: newValue,
                    type: "api_key",
                });
                return { text: `Rotated '${path}' to version ${result.version}.` };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { text: `Error rotating '${path}': ${msg}` };
            }
        },
    };
}

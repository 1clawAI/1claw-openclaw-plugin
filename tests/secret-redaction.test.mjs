import assert from "node:assert/strict";
import test from "node:test";

import { registerSecretRedaction } from "../dist/hooks/secret-redaction.js";

function registration() {
    let handler;
    const api = {
        logger: { info() {}, warn() {} },
        on(event, callback) {
            assert.equal(event, "before_prompt_build");
            handler = callback;
        },
    };

    return {
        api,
        handler() {
            assert.ok(handler);
            return handler;
        },
    };
}

function client(path, value) {
    return {
        async getSecret(requestedPath) {
            assert.equal(requestedPath, path);
            return { path, value };
        },
        async listSecrets() {
            return { secrets: [{ path }] };
        },
    };
}

test("keeps cached redaction values isolated by client", async () => {
    const first = registration();
    const second = registration();
    registerSecretRedaction(first.api, client("first", "first-secret"));
    registerSecretRedaction(second.api, client("second", "second-secret"));

    const firstEvent = {
        messages: [{ role: "user", content: "token=first-secret" }],
    };
    const secondEvent = {
        messages: [{ role: "user", content: "token=second-secret" }],
    };

    await first.handler()(firstEvent, {});
    await second.handler()(secondEvent, {});

    assert.equal(firstEvent.messages[0].content, "token=[REDACTED:first]");
    assert.equal(secondEvent.messages[0].content, "token=[REDACTED:second]");
});

import assert from "node:assert/strict";
import { readAuthLanding, needsFirstPassword, passwordValidation, authErrorMessage } from "../src/lib/auth-flow.js";
import { requestPasswordReset, updateOwnPassword } from "../src/lib/password-actions.js";

assert.deepEqual(readAuthLanding("#type=recovery&access_token=test-not-a-real-token"), { password: true, error: false });
assert.equal(readAuthLanding("#type=invite").password, true);
assert.equal(readAuthLanding("#studio").password, false);
assert.equal(readAuthLanding("#error_code=otp_expired").error, true);
for (const role of ["client", "collaborator"]) {
  assert.equal(needsFirstPassword({ user_metadata: { invited_role: role } }), true);
  assert.equal(needsFirstPassword({ user_metadata: { invited_role: role, password_setup_complete: true } }), false);
}
assert.equal(needsFirstPassword(null), false);
assert.equal(needsFirstPassword({ user_metadata: {} }), false);
assert.match(passwordValidation("short", "short"), /12/);
assert.match(passwordValidation("long-test-password", "different"), /متطابقتين/);
assert.equal(passwordValidation("long-test-password", "long-test-password"), "");
assert.match(authErrorMessage({ message: "email rate limit exceeded" }), /حد إرسال/);
assert.match(authErrorMessage({ code: "otp_expired" }), /منتهي/);
assert.match(authErrorMessage({ message: "Invalid login credentials" }), /غير صحيحة/);
let calls = [];
const auth = {
  async resetPasswordForEmail(email, options) { calls.push({ email, options }); return { error: null }; },
  async updateUser(payload) { calls.push(payload); return { data: { user: { id: "test-user", user_metadata: payload.data } }, error: null }; },
};
await requestPasswordReset(auth, " test@example.com ", "https://www.u89des.com");
assert.deepEqual(calls.pop(), { email: "test@example.com", options: { redirectTo: "https://www.u89des.com/" } });
await assert.rejects(updateOwnPassword(auth, "short", "short"));
await assert.rejects(updateOwnPassword(auth, "long-test-password", "does-not-match"));
assert.equal(calls.length, 0, "Invalid passwords must never reach the auth service");
const user = await updateOwnPassword(auth, "long-test-password", "long-test-password");
assert.equal(user.user_metadata.password_setup_complete, true);
assert.deepEqual(Object.keys(calls[0]).sort(), ["data", "password"]);
assert.deepEqual(calls[0].data, { password_setup_complete: true }, "No role or membership changes");
await assert.rejects(updateOwnPassword({ updateUser: async () => ({ data: null, error: new Error("session expired") }) }, "long-test-password", "long-test-password"), /expired/);
await assert.rejects(requestPasswordReset({ resetPasswordForEmail: async () => ({ error: new Error("rate limit") }) }, "test@example.com", "https://www.u89des.com"), /rate limit/);
console.log("Auth flow passed: invite/recovery intent, first-password UX, validation, self-only updates, reset redirects, and failure handling. No live credentials changed.");

import assert from "node:assert/strict";
import handler from "../api/contact.js";

process.env.SUPABASE_URL = "https://contact-test.invalid";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key";
let inserted;
let rateCount = 0;
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  if (url.includes("/workspaces?")) return Response.json({ id: "test-workspace" });
  if (url.includes("/activity_events?") && options.method === "HEAD") return new Response(null, { headers: { "content-range": `0-0/${rateCount}` } });
  if (url.includes("/activity_events") && options.method === "POST") {
    inserted = JSON.parse(options.body);
    return new Response(null, { status: 201 });
  }
  throw new Error(`Unexpected request: ${options.method} ${url}`);
};
async function call(method, body = {}, headers = {}) {
  const result = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ method, body, headers }, result);
  return result;
}
assert.equal((await call("DELETE")).code, 405);
assert.equal((await call("GET")).code, 401);
assert.equal((await call("POST", {}, { origin: "https://untrusted.invalid" })).code, 403);
assert.equal((await call("POST", {})).code, 400);
assert.equal((await call("POST", { website: "spam" })).code, 200);
assert.equal(inserted, undefined);
const message = { name: "اختبار", contact: "test@example.com", message: "رسالة اختبار محلية" };
assert.equal((await call("POST", message)).code, 201);
assert.equal(inserted.event_type, "contact_message");
assert.equal(inserted.label, message.message);
assert.equal(inserted.metadata.contact, message.contact);
assert.equal(inserted.project_id, undefined);
rateCount = 10;
assert.equal((await call("POST", message)).code, 429);
console.log("Contact validation, private access, persistence and rate-limit checks passed.");

import assert from "node:assert/strict";
import handler from "../api/portfolio.js";
process.env.SUPABASE_URL = "https://portfolio-test.invalid";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
let role = "collaborator";
let enabled = false;
let draftOwner = "user-1";
let writes = 0;
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  if (url.includes("/auth/v1/user")) return Response.json({ id: "user-1" });
  if (url.includes("/workspaces?")) return Response.json({ id: "workspace-1" });
  if (url.includes("/memberships?")) return Response.json({ role, notification_preferences: { portfolioEditor: enabled } });
  if (url.includes("/activity_events?")) {
    if (options.method === "PATCH") { writes++; return new Response(null, { status: 204 }); }
    return Response.json({ id: "draft-1", actor_user_id: draftOwner, metadata: { status: "draft", project: { id: "test", name: "test", cover: "" } } });
  }
  throw new Error(`Unexpected network request: ${url}`);
};
async function call(body, token = "test") {
  const result = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body }, result);
  return result;
}
assert.equal((await call({}, "")).code, 401);
assert.equal((await call({ action: "create" })).code, 403);
enabled = true;
assert.equal((await call({ action: "permission", userId: "other", enabled: true })).code, 403);
assert.equal((await call({ action: "publish", id: "draft-1" })).code, 403);
draftOwner = "other-user";
assert.equal((await call({ action: "save", id: "draft-1" })).code, 403);
draftOwner = "user-1";
assert.equal((await call({ action: "upload", id: "draft-1", mime: "image/svg+xml" })).code, 400);
assert.equal((await call({ action: "save", id: "draft-1", project: { name: "test", cover: "draft:workspace-1/other-user/other-draft/image.png" } })).code, 400);
assert.equal(writes, 0);
const saved = await call({ action: "save", id: "draft-1", project: { name: "Test project", cover: "/portfolio/mamola-logo.webp", scope: ["تصميم الهوية"] }, submit: true });
assert.equal(saved.body.saved, true);
assert.equal(writes, 1);
for (const kind of ["logo", "campaign"]) {
  assert.equal((await call({ action: "save", id: "draft-1", project: { name: "Collection item", kind, cover: "/logos-original/Artboard 1-2.svg" }, submit: true })).body.saved, true);
  assert.equal((await call({ action: "publish", id: "draft-1" })).code, 403);
}
assert.equal((await call({ action: "save", id: "draft-1", project: { name: "Bad type", kind: "admin" } })).code, 400);
assert.equal((await call({ action: "save", id: "draft-1", project: { name: "Bad source", kind: "logo", cover: "/logos-original/unknown.svg" } })).code, 400);
role = "client";
assert.equal((await call({ action: "create" })).code, 403);
console.log("Portfolio role boundaries, owner-only publishing, draft isolation, and image validation passed.");

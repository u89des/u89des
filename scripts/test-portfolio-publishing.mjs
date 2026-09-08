import assert from "node:assert/strict";
import handler from "../api/portfolio.js";

// All requests are intercepted: this test never touches the live site or storage.
process.env.SUPABASE_URL = "https://portfolio-test.invalid";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
let role = "owner";
let conflict = false;
let draftStatus = "submitted";
let eventWrites = [];
let siteWrites = [];
const originalContent = {
  hero: { headline: "Keep the homepage" },
  workVisibility: [false, true],
  portfolioProjects: [
    { id: "existing", name: "Old name", cover: "/portfolio/old.png" },
    { id: "untouched", name: "Another project", cover: "/portfolio/other.png" },
  ],
};
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  if (url.pathname === "/auth/v1/user") return Response.json({ id: "user-1" });
  if (url.pathname.endsWith("/workspaces")) return Response.json({ id: "workspace-1" });
  if (url.pathname.endsWith("/memberships")) return Response.json({ role, notification_preferences: { portfolioEditor: true } });
  if (url.pathname.endsWith("/activity_events")) {
    if (options.method === "PATCH") {
      eventWrites.push(JSON.parse(options.body));
      return new Response(null, { status: 204 });
    }
    return Response.json({ id: "draft-1", actor_user_id: "user-1", metadata: {
      status: draftStatus,
      project: { id: "existing", name: "Updated name", cover: "/portfolio/mamola-logo.webp", gallery: [] },
    } });
  }
  if (url.pathname === "/storage/v1/bucket/portfolio-published") return Response.json({ id: "portfolio-published", public: true });
  if (url.pathname.endsWith("/public_site_content")) {
    if (options.method === "PATCH") {
      assert.equal(url.searchParams.get("updated_at"), "eq.version-1", "Publication must check concurrent edits");
      if (conflict) return Response.json({ code: "PGRST116", message: "Concurrent edit" }, { status: 406 });
      siteWrites.push(JSON.parse(options.body));
      return Response.json({ workspace_id: "workspace-1" });
    }
    return Response.json({ content: structuredClone(originalContent), updated_at: "version-1" });
  }
  throw new Error(`Unexpected test request: ${url.pathname}`);
};
async function call(body) {
  const result = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ method: "POST", headers: { authorization: "Bearer test" }, body }, result);
  return result;
}

role = "collaborator";
assert.equal((await call({ action: "visibility", projectId: "existing", visible: true })).code, 403);
assert.equal((await call({ action: "publish", id: "draft-1" })).code, 403);
assert.equal(siteWrites.length, 0);
const saved = await call({ action: "save", id: "draft-1", project: { name: "Private draft", cover: "/portfolio/mamola-logo.webp" }, submit: true });
assert.equal(saved.body.saved, true);
assert.equal(eventWrites.at(-1).metadata.status, "submitted");
assert.equal(siteWrites.length, 0, "Review submission must not publish");

role = "owner";
eventWrites = [];
assert.equal((await call({ action: "publish", id: "draft-1" })).body.published, true);
const published = siteWrites.at(-1);
assert.deepEqual(published.content.hero, originalContent.hero);
assert.deepEqual(published.content.workVisibility, [false, true]);
assert.equal(published.content.portfolioProjects.length, 2);
assert.equal(published.content.portfolioProjects[0].name, "Updated name");
assert.deepEqual(published.content.portfolioProjects[1], originalContent.portfolioProjects[1]);
assert.equal(eventWrites.at(-1).metadata.status, "published");
assert.equal(eventWrites.at(-1).metadata.publishedBy, "user-1");

siteWrites = [];
eventWrites = [];
conflict = true;
assert.equal((await call({ action: "publish", id: "draft-1" })).code, 400);
assert.equal(eventWrites.length, 0, "A failed site save must not mark the draft published");
assert.equal(siteWrites.length, 0);
conflict = false;
draftStatus = "published";
assert.equal((await call({ action: "save", id: "draft-1", project: { name: "Changed" } })).code, 400);
assert.equal((await call({ action: "upload", id: "draft-1", mime: "image/png" })).code, 400);
assert.equal(eventWrites.length, 0, "Published snapshots must remain immutable");
console.log("Portfolio publication: private review, owner control, content preservation, stale-write rejection, and immutable snapshots passed.");

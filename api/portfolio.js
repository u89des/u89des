import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { portfolioProjects } from "../src/portfolio-data.js";

const privateBucket = "portfolio-drafts";
const publicBucket = "portfolio-published";
const mimeExtensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const fail = (message) => { throw new Error(message); };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.SUPABASE_URL) return res.status(503).json({ error: "الخدمة غير مهيأة" });
  const db = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "سجّل الدخول" });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return res.status(401).json({ error: "انتهت الجلسة" });
  const { data: workspace } = await db.from("workspaces").select("id").eq("slug", "u89").single();
  if (!workspace) return res.status(503).json({ error: "تعذر تحميل المساحة" });
  const { data: member } = await db.from("memberships").select("role,notification_preferences").eq("workspace_id", workspace.id).eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  const owner = member?.role === "owner";
  const editor = member?.role === "collaborator" && member.notification_preferences?.portfolioEditor === true;
  if (!owner && !editor) return res.status(403).json({ error: "لا تملك صلاحية إعداد معرض الأعمال" });
  const check = ({ error, data }) => { if (error) fail(error.message); return data; };
  const ensureBucket = async (name, isPublic) => {
    const { data } = await db.storage.getBucket(name);
    if (!data) {
      const created = await db.storage.createBucket(name, { public: isPublic, fileSizeLimit: 8388608, allowedMimeTypes: Object.keys(mimeExtensions) });
      if (created.error && !(await db.storage.getBucket(name)).data) fail("تعذر تجهيز مساحة الصور");
    }
  };
  try {
    if (req.method === "GET") {
      let query = db.from("activity_events").select("id,actor_user_id,metadata,created_at").eq("workspace_id", workspace.id).eq("event_type", "portfolio_draft").order("created_at", { ascending: false }).limit(100);
      if (!owner) query = query.eq("actor_user_id", auth.user.id);
      const drafts = check(await query);
      for (const draft of drafts) {
        const paths = [draft.metadata.project?.cover, ...(draft.metadata.project?.gallery || []).map((image) => image.src)].filter((path) => typeof path === "string" && path.startsWith("draft:"));
        draft.previews = {};
        for (const path of paths) {
          const { data } = await db.storage.from(privateBucket).createSignedUrl(path.slice(6), 3600);
          if (data) draft.previews[path] = data.signedUrl;
        }
      }
      const { data: site } = await db.from("public_site_content").select("content").eq("workspace_id", workspace.id).maybeSingle();
      const collaborators = owner ? check(await db.from("memberships").select("user_id,display_name,notification_preferences").eq("workspace_id", workspace.id).eq("role", "collaborator").eq("status", "active")) : [];
      return res.json({ drafts, projects: site?.content?.portfolioProjects || portfolioProjects, visibility: site?.content?.workVisibility || [], collaborators: collaborators.map((person) => ({ user_id: person.user_id, display_name: person.display_name, enabled: person.notification_preferences?.portfolioEditor === true })), owner });
    }
    const body = req.body || {};
    if (body.action === "visibility") {
      if (!owner) return res.status(403).json({ error: "المالك فقط يتحكم بظهور الأعمال" });
      if (typeof body.visible !== "boolean") fail("بيانات غير صالحة");
      const { data: site, error } = await db.from("public_site_content").select("content,updated_at").eq("workspace_id", workspace.id).maybeSingle();
      if (error) fail(error.message);
      const projects = site?.content?.portfolioProjects || portfolioProjects;
      if (!projects.some((project) => project.id === body.projectId)) fail("المشروع غير موجود");
      const workVisibility = projects.map((project, index) => project.id === body.projectId ? body.visible : site?.content?.workVisibility?.[index] !== false);
      const content = { ...site?.content, portfolioProjects: projects, workVisibility };
      if (site) check(await db.from("public_site_content").update({ content }).eq("workspace_id", workspace.id).eq("updated_at", site.updated_at).select("workspace_id").single());
      else check(await db.from("public_site_content").insert({ workspace_id: workspace.id, content, published: true, published_at: new Date().toISOString() }));
      return res.json({ saved: true });
    }
    if (body.action === "permission") {
      if (!owner) return res.status(403).json({ error: "المالك فقط يحدد الصلاحيات" });
      if (typeof body.enabled !== "boolean" || typeof body.userId !== "string") fail("بيانات غير صالحة");
      const person = check(await db.from("memberships").select("notification_preferences").eq("workspace_id", workspace.id).eq("user_id", body.userId).eq("role", "collaborator").eq("status", "active").single());
      check(await db.from("memberships").update({ notification_preferences: { ...person.notification_preferences, portfolioEditor: body.enabled } }).eq("workspace_id", workspace.id).eq("user_id", body.userId));
      return res.json({ saved: true });
    }
    if (body.action === "create") {
      const item = check(await db.from("activity_events").insert({ workspace_id: workspace.id, actor_user_id: auth.user.id, actor_label: "محرر المعرض", event_type: "portfolio_draft", label: "مسودة معرض أعمال", metadata: { status: "draft", project: { id: `portfolio-${randomUUID()}`, name: "مشروع جديد", cover: "", gallery: [], scope: [], consulting: [], palette: { surface: "#edf0e8", ink: "#151814", accent: "#b7d43b" } } } }).select("id").single());
      return res.json(item);
    }
    if (typeof body.id !== "string") fail("اختر المسودة");
    const draft = check(await db.from("activity_events").select("id,actor_user_id,metadata").eq("workspace_id", workspace.id).eq("event_type", "portfolio_draft").eq("id", body.id).single());
    if (!owner && draft.actor_user_id !== auth.user.id) return res.status(403).json({ error: "هذه ليست مسودتك" });
    if (draft.metadata.status === "published") fail("النسخة منشورة؛ أنشئ مسودة جديدة لتعديلها");
    if (body.action === "upload") {
      const extension = mimeExtensions[body.mime];
      if (!extension) fail("الصور المدعومة JPG وPNG وWebP");
      await ensureBucket(privateBucket, false);
      const path = `${workspace.id}/${draft.actor_user_id}/${draft.id}/${randomUUID()}.${extension}`;
      const data = check(await db.storage.from(privateBucket).createSignedUploadUrl(path));
      return res.json({ path, token: data.token, bucket: privateBucket });
    }
    if (body.action === "save") {
      const source = body.project || {};
      const cleanText = (value, max = 6000) => String(value || "").trim().slice(0, max);
      const validImage = (value) => {
        const path = cleanText(value, 2000);
        if (!path || path.startsWith(`/portfolio/`) && !path.includes("..")) return path;
        if (path.startsWith(`draft:${workspace.id}/${draft.actor_user_id}/${draft.id}/`) && !path.includes("..")) return path;
        const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/${publicBucket}/${workspace.id}/`;
        if (path.startsWith(prefix) && !path.includes("..")) return path;
        fail("صورة غير صالحة لهذه المسودة");
      };
      const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
      const project = { id: /^[a-z0-9-]{1,100}$/i.test(source.id) ? source.id : draft.metadata.project.id, name: cleanText(source.name, 150), nameEn: cleanText(source.nameEn, 150), category: cleanText(source.category, 150), statement: cleanText(source.statement), story: cleanText(source.story), cover: validImage(source.cover), scope: (Array.isArray(source.scope) ? source.scope : []).slice(0, 40).map((value) => cleanText(value, 300)), consulting: (Array.isArray(source.consulting) ? source.consulting : []).slice(0, 40).map((value) => cleanText(value, 300)), palette: { surface: color(source.palette?.surface, "#edf0e8"), ink: color(source.palette?.ink, "#151814"), accent: color(source.palette?.accent, "#b7d43b") }, gallery: (Array.isArray(source.gallery) ? source.gallery : []).slice(0, 20).map((image) => ({ src: validImage(image.src), alt: cleanText(image.alt, 300), layout: ["wide", "standard"].includes(image.layout) ? image.layout : "standard" })) };
      if (!project.name) fail("اسم المشروع مطلوب");
      check(await db.from("activity_events").update({ metadata: { ...draft.metadata, project, status: body.submit ? "submitted" : "draft", savedAt: new Date().toISOString() } }).eq("id", draft.id));
      return res.json({ saved: true });
    }
    if (body.action === "publish") {
      if (!owner) return res.status(403).json({ error: "النشر متاح لعبد الوهاب فقط" });
      const project = structuredClone(draft.metadata.project);
      if (!project.name || !project.cover) fail("ارفع الشعار وأكمل اسم المشروع أولاً");
      await ensureBucket(publicBucket, true);
      const publishImage = async (src) => {
        if (!src.startsWith("draft:")) return src;
        const path = src.slice(6);
        const blob = check(await db.storage.from(privateBucket).download(path));
        const target = `${workspace.id}/${draft.id}/${path.split("/").pop()}`;
        check(await db.storage.from(publicBucket).upload(target, blob, { contentType: blob.type, upsert: true }));
        return db.storage.from(publicBucket).getPublicUrl(target).data.publicUrl;
      };
      project.cover = await publishImage(project.cover);
      for (const image of project.gallery || []) image.src = await publishImage(image.src);
      const { data: site, error: siteError } = await db.from("public_site_content").select("content,updated_at").eq("workspace_id", workspace.id).maybeSingle();
      if (siteError) fail(siteError.message);
      const projects = [...(site?.content?.portfolioProjects || portfolioProjects)];
      const index = projects.findIndex((item) => item.id === project.id);
      if (index < 0) projects.push(project); else projects[index] = project;
      const content = { ...site?.content, portfolioProjects: projects };
      if (site) check(await db.from("public_site_content").update({ content, published: true, published_at: new Date().toISOString() }).eq("workspace_id", workspace.id).eq("updated_at", site.updated_at).select("workspace_id").single());
      else check(await db.from("public_site_content").insert({ workspace_id: workspace.id, content, published: true, published_at: new Date().toISOString() }));
      check(await db.from("activity_events").update({ metadata: { ...draft.metadata, status: "published", publishedAt: new Date().toISOString(), publishedBy: auth.user.id } }).eq("id", draft.id));
      return res.json({ published: true });
    }
    fail("إجراء غير معروف");
  } catch (error) { return res.status(400).json({ error: error.message || "تعذر تنفيذ الإجراء" }); }
}

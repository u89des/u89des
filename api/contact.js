import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST", "PATCH"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: "التواصل غير متاح مؤقتاً. حاول لاحقاً." });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: workspace, error: workspaceError } = await db.from("workspaces").select("id").eq("slug", "u89").single();
  if (workspaceError || !workspace) return res.status(503).json({ error: "تعذر استقبال الرسالة الآن." });
  if (["GET", "PATCH"].includes(req.method)) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "سجّل الدخول" });
    const { data: auth, error } = await db.auth.getUser(token);
    if (error || !auth.user) return res.status(401).json({ error: "انتهت الجلسة" });
    const { data: member } = await db.from("memberships").select("role").eq("workspace_id", workspace.id).eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
    if (!member || !["owner", "manager"].includes(member.role)) return res.status(403).json({ error: "غير مصرح" });
    if (req.method === "PATCH") {
      const { id, status } = req.body || {};
      if (typeof id !== "string" || !["new", "replied", "archived"].includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
      const { data: item, error } = await db.from("activity_events").select("metadata").eq("workspace_id", workspace.id).eq("event_type", "contact_message").eq("id", id).single();
      if (error || !item) return res.status(404).json({ error: "الرسالة غير موجودة" });
      const { error: saveError } = await db.from("activity_events").update({ metadata: { ...item.metadata, status, statusChangedAt: new Date().toISOString(), statusChangedBy: auth.user.id } }).eq("workspace_id", workspace.id).eq("event_type", "contact_message").eq("id", id);
      if (saveError) return res.status(500).json({ error: "تعذر حفظ الحالة" });
      return res.status(200).json({ saved: true });
    }
    const offset = Math.max(0, Math.min(100000, Number.parseInt(req.query?.offset || "0", 10) || 0));
    const { data, error: readError } = await db.from("activity_events").select("id,actor_label,label,metadata,created_at").eq("workspace_id", workspace.id).eq("event_type", "contact_message").order("created_at", { ascending: false }).range(offset, offset + 49);
    if (readError) return res.status(500).json({ error: "تعذر تحميل الرسائل" });
    return res.status(200).json({ messages: data.map(({ metadata, ...item }) => ({ ...item, contact: metadata.contact, status: metadata.status || "new" })) });
  }
  const origin = req.headers.origin;
  const allowedOrigins = new Set(["https://u89des.com", "https://www.u89des.com", "https://u89des.vercel.app"]);
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: "غير مصرح" });
  const body = req.body || {};
  if (body.website) return res.status(200).json({ sent: true });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name || name.length > 100 || contact.length < 5 || contact.length > 200 || !message || message.length > 4000) return res.status(400).json({ error: "أكمل الاسم ووسيلة التواصل والرسالة ضمن الأطوال المحددة." });
  const hash = (value) => createHash("sha256").update(key + value).digest("hex");
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const fingerprint = hash(ip);
  const contactHash = hash(contact.toLowerCase());
  const since = new Date(Date.now() - 3600000).toISOString();
  for (const [field, value, limit] of [["fingerprint", fingerprint, 10], ["contactHash", contactHash, 3]]) {
    const { count, error } = await db.from("activity_events").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("event_type", "contact_message").eq(`metadata->>${field}`, value).gte("created_at", since);
    if (error) return res.status(503).json({ error: "تعذر استقبال الرسالة الآن." });
    if (count >= limit) return res.status(429).json({ error: "وصلت للحد المؤقت للرسائل. حاول بعد ساعة." });
  }
  const { error } = await db.from("activity_events").insert({ workspace_id: workspace.id, actor_label: name, event_type: "contact_message", label: message, metadata: { contact, fingerprint, contactHash } });
  if (error) return res.status(500).json({ error: "لم تُحفظ الرسالة. حاول مرة أخرى." });
  return res.status(201).json({ sent: true });
}

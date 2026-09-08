import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/studio-platform";

export default function PortfolioDesk({ access }) {
  const [data, setData] = useState(null);
  const [id, setId] = useState("");
  const [project, setProject] = useState(null);
  const [previews, setPreviews] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const objectUrls = useRef([]);
  useEffect(() => () => { objectUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  const request = async (body) => {
    const response = await fetch("/api/portfolio", { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${access.session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "تعذر الاتصال");
    return result;
  };
  const load = async () => { const result = await request(); setData(result); return result; };
  useEffect(() => { let active = true; request().then((result) => { if (active) setData(result); }).catch((error) => { if (active) setMessage(error.message); }); return () => { active = false; }; }, [access.session.access_token]);
  const run = async (action) => { setBusy(true); setMessage(""); try { await action(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const select = (draft) => { setId(draft.id); setProject(draft.metadata.project); setPreviews(draft.previews || {}); setMessage(""); };
  const create = () => run(async () => { const item = await request({ action: "create" }); const result = await load(); select(result.drafts.find((draft) => draft.id === item.id)); });
  const change = (key, value) => setProject((current) => ({ ...current, [key]: value }));
  const save = async (submit = false) => { await request({ action: "save", id, project, submit }); await load(); setMessage(submit ? "أُرسلت المسودة لعبد الوهاب للمراجعة. لم تُنشر." : "حُفظت المسودة ولم تُنشر."); };
  const upload = (files, cover) => run(async () => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (!cover && (project.gallery?.length || 0) + selected.length > 20) throw new Error("الحد الأقصى 20 صورة لكل مشروع");
    const added = [];
    const nextPreviews = { ...previews };
    for (const file of selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error("اختر JPG أو PNG أو WebP، حتى 8 ميجابايت للصورة");
      const ticket = await request({ action: "upload", id, mime: file.type });
      const { error } = await supabase.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (error) throw error;
      const path = `draft:${ticket.path}`;
      added.push({ src: path, alt: file.name, layout: "standard" });
      nextPreviews[path] = URL.createObjectURL(file);
      objectUrls.current.push(nextPreviews[path]);
    }
    const next = cover ? { ...project, cover: added[0].src } : { ...project, gallery: [...(project.gallery || []), ...added] };
    setProject(next); setPreviews(nextPreviews);
    await request({ action: "save", id, project: next }); await load(); setMessage("رُفعت الصور وحُفظت داخل المسودة الخاصة.");
  });
  const selected = data?.drafts.find((draft) => draft.id === id);
  const locked = selected?.metadata.status === "published";
  const statuses = { draft: "مسودة", submitted: "للمراجعة", published: "منشور" };
  const imageUrl = (src) => src?.startsWith("draft:") ? previews[src] : src;
  return <section className="panel page-stack"><div className="panel-heading"><div><h2>معرض الأعمال: الإعداد والمراجعة</h2><p>ارفع الصور من جهازك. الحفظ والإرسال للمراجعة لا ينشران العمل للزوار.</p></div><button className="button primary" disabled={busy || !data} onClick={create}>إضافة مسودة عمل</button></div>
    {message && <p role="status">{message}</p>}
    {data?.owner && <details><summary>صلاحية إعداد المعرض للمتعاونين</summary><p>تسمح بإنشاء وتعديل مسوداته ورفع الصور فقط. النشر لك وحدك.</p>{data.collaborators.length ? data.collaborators.map((person) => <label className="consent-field" key={person.user_id}><input type="checkbox" checked={person.enabled} disabled={busy} onChange={(event) => { const enabled = event.target.checked; if (!window.confirm(`${enabled ? "منح" : "إلغاء"} صلاحية إعداد المعرض للمتعاون ${person.display_name}؟`)) return; run(async () => { await request({ action: "permission", userId: person.user_id, enabled }); await load(); setMessage("تم تحديث صلاحية إعداد المعرض فقط"); }); }} />{person.display_name}</label>) : <p>لا يوجد متعاون نشط حالياً.</p>}</details>}
    <div className="live-actions">{data?.drafts.map((draft) => <button disabled={busy} className={`button ${id === draft.id ? "primary" : "ghost"}`} key={draft.id} onClick={() => { if (project && !window.confirm("الانتقال للمسودة الأخرى؟ احفظ تعديلاتك أولاً.")) return; select(draft); }}>{draft.metadata.project.name} · {statuses[draft.metadata.status]}</button>)}</div>
    {project && <div className="live-task-form"><fieldset disabled={busy || locked} style={{ border: 0, padding: 0 }}>
      <label>عمل جديد أو تعديل عمل منشور<select value={(data?.projects || []).some((item) => item.id === project.id) ? project.id : ""} onChange={(event) => { const existing = data.projects.find((item) => item.id === event.target.value); if (existing) setProject(structuredClone(existing)); }}><option value="" disabled>عمل جديد</option>{data?.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="field-row"><label>اسم المشروع<input value={project.name || ""} maxLength={150} onChange={(event) => change("name", event.target.value)} /></label><label>الاسم بالإنجليزية<input value={project.nameEn || ""} onChange={(event) => change("nameEn", event.target.value)} /></label></div>
      <label>التصنيف<input value={project.category || ""} onChange={(event) => change("category", event.target.value)} /></label><label>الفكرة الرئيسية<textarea value={project.statement || ""} onChange={(event) => change("statement", event.target.value)} /></label><label>قصة المشروع<textarea rows={4} value={project.story || ""} onChange={(event) => change("story", event.target.value)} /></label>
      <label>نطاق العمل، كل عنصر بسطر<textarea value={(project.scope || []).join("\n")} onChange={(event) => change("scope", event.target.value.split("\n"))} /></label><label>تفاصيل الاستشارات، كل عنصر بسطر<textarea value={(project.consulting || []).join("\n")} onChange={(event) => change("consulting", event.target.value.split("\n"))} /></label>
      <div className="field-row">{[["surface", "الخلفية"], ["ink", "النص"], ["accent", "الحركة"]].map(([key, label]) => <label key={key}>{label}<input type="color" value={project.palette?.[key] || "#111111"} onChange={(event) => change("palette", { ...project.palette, [key]: event.target.value })} /></label>)}</div>
      <label>رفع الشعار<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { upload(event.target.files, true); event.target.value = ""; }} /></label>{imageUrl(project.cover) && <img src={imageUrl(project.cover)} alt="معاينة الشعار" style={{ width: 180, height: 150, objectFit: "contain" }} />}
      <label>رفع صور المشروع<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { upload(event.target.files, false); event.target.value = ""; }} /></label><small>JPG، PNG، WebP. حتى 8 ميجابايت للصورة، و20 صورة للمشروع.</small>
      <div className="live-actions">{(project.gallery || []).map((image, index) => <div key={`${image.src}-${index}`} style={{ width: 180 }}>{imageUrl(image.src) && <img src={imageUrl(image.src)} alt={image.alt} style={{ width: 180, height: 120, objectFit: "contain" }} />}<input aria-label="وصف الصورة" value={image.alt || ""} onChange={(event) => change("gallery", project.gallery.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} /><button type="button" className="button ghost small" onClick={() => change("gallery", project.gallery.filter((_, i) => i !== index))}>إزالة من المسودة</button></div>)}</div>
    </fieldset><div className="live-actions">{!locked && <><button className="button ghost" disabled={busy} onClick={() => run(() => save())}>حفظ المسودة</button><button className="button primary" disabled={busy} onClick={() => run(() => save(true))}>إرسال للمراجعة</button>{data?.owner && <button className="button primary" disabled={busy} onClick={() => { if (!window.confirm(`نشر «${project.name}» وصوره للزوار الآن؟`)) return; run(async () => { await save(); await request({ action: "publish", id }); await load(); setMessage("نُشر المشروع للزوار. حدّث الموقع لمشاهدته."); }); }}>اعتماد ونشر للزوار</button>}</>}{locked && <p>نُشرت هذه النسخة. لتعديلها أنشئ مسودة جديدة واختر العمل المنشور.</p>}</div></div>}
  </section>;
}

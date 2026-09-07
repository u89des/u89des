import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpLeft, Check, CheckCircle, Clock, Command, FolderOpen, MagnifyingGlass, Pause, Play, Plus, Sparkle, Target, Tray, UsersThree, Wallet, X } from "@phosphor-icons/react";

export function readLocalList(key, fallback = []) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; } catch { return fallback; }
}
export function groupMoney(rows) {
  return rows.reduce((totals, row) => {
    const amount = Number(String(row.amount ?? 0).replaceAll(",", ""));
    const currency = row.currency || "SAR";
    if (Number.isFinite(amount)) totals[currency] = (totals[currency] || 0) + amount;
    return totals;
  }, {});
}
const names = { internal_review: "بروفة تحتاج مراجعتك", client_revision: "العميل طلب تعديلاً", changes_requested: "تعديل قيد المتابعة", draft: "جاهز للتنفيذ أو التفويض", in_progress: "قيد التنفيذ", dispatched: "أُرسل للمتعاون", client_review: "بانتظار العميل", completed: "مكتمل", owner_production: "تعمل عليه بنفسك", creative_development: "قيد التطوير" };
const finished = (row) => ["completed", "done", "cancelled"].includes(row.status);
function isoOverdue(value) { return /^\d{4}-\d{2}-\d{2}/.test(value || "") && new Date(value).getTime() < new Date().setHours(0, 0, 0, 0); }
export function buildControlModel({ liveData, seeds, scenario }) {
  const live = Boolean(liveData);
  const rawOrders = live ? liveData.work_orders || [] : readLocalList("u89-work-orders", seeds.orders);
  const projectNames = new Map((liveData?.projects || []).map((item) => [item.id, item.name]));
const orders = rawOrders.map((order) => ({ ...order, dispatched: live ? Boolean(order.dispatched_at) : order.dispatched, projectName: (live ? projectNames.get(order.project_id) : order.project)?.replaceAll("سيد مندي", "مندي مجيد") || "مشروع", dueLabel: order.due_date || order.due || "بدون موعد", assigned: live ? (liveData.work_order_assignees || []).some((a) => a.work_order_id === order.id) : Boolean(order.assignees?.length) }));
  const rawInvoices = live ? liveData.invoices || [] : readLocalList("u89-invoices", seeds.invoices);
  const rawClaims = live ? liveData.collaborator_claims || [] : readLocalList("u89-collaborator-claims", seeds.claims);
  const invoices = rawInvoices.filter((row) => (live ? ["issued", "sent", "overdue"] : ["مستحقة", "متأخرة"]).includes(row.status));
  const claims = rawClaims.filter((row) => (live ? ["approved", "due"] : ["مستحقة"]).includes(row.status));
  const requests = live ? (liveData.service_requests || []).filter((row) => ["new", "needs_info"].includes(row.status)) : readLocalList("u89-retainer-requests", seeds.requests).filter((row) => row.status === "جديد");
  const decisions = orders.filter((row) => !finished(row) && (row.status === "internal_review" || row.status === "client_revision" || !row.dispatched && !row.assigned && row.status !== "client_review" || isoOverdue(row.due_date || row.due))).map((row) => ({
    id: `order-${row.id}`, targetId: row.id, section: "work-orders", title: row.title, project: row.projectName,
    reason: names[row.status] || "يحتاج قرارك", priority: row.status === "client_revision" ? 0 : row.status === "internal_review" ? 1 : isoOverdue(row.due_date || row.due) ? 2 : 6,
    overdue: isoOverdue(row.due_date || row.due), created: row.created_at || "", label: row.status === "internal_review" ? "راجع البروفة" : "افتح العمل",
  }));
  requests.forEach((row) => decisions.push({ id: `request-${row.id}`, section: "requests", title: row.project_name || row.title, project: row.client || "طلب عميل", reason: "طلب جديد يحتاج موافقتك", priority: 5, created: row.created_at || "", label: "راجع الطلب" }));
  (liveData?.briefs || []).filter((row) => row.status === "submitted").forEach((row) => decisions.push({ id: `brief-${row.id}`, section: "briefs", title: "بريف جاهز للمراجعة", project: projectNames.get(row.project_id) || "مشروع", reason: "قبل إعداد عرض السعر", priority: 4, label: "راجع البريف" }));
  (liveData?.quotes || []).filter((row) => row.status === "draft").forEach((row) => decisions.push({ id: `quote-${row.id}`, section: "documents", title: "عرض سعر مسودة", project: projectNames.get(row.project_id) || "مشروع", reason: "أكمل الصياغة قبل الإرسال", priority: 4, label: "افتح العروض" }));
  if (!live && scenario.step <= 6) decisions.push({ id: "scenario", section: "scenario", title: scenario.project.name, project: "السيناريو التجريبي", reason: "تابع الطلب من آخر خطوة محفوظة", priority: 7, label: "تابع السيناريو" });
  invoices.filter((row) => row.status === "overdue" || isoOverdue(row.due_date)).forEach((row) => decisions.push({ id: `invoice-${row.id}`, section: "finance", title: `متابعة فاتورة ${row.reference || row.id}`, project: projectNames.get(row.project_id) || row.project || "عميل", reason: "تجاوزت تاريخ الاستحقاق", priority: 3, label: "افتح الحسابات" }));
  decisions.sort((a, b) => a.priority - b.priority || (a.created || "").localeCompare(b.created || ""));
  const waiting = orders.filter((row) => !finished(row) && ["dispatched", "in_progress", "client_review", "changes_requested"].includes(row.status) && (row.assigned || row.status === "client_review"));
  return { live, orders, active: orders.filter((row) => !finished(row)), decisions, waiting, invoices, claims, receivable: groupMoney(invoices), payable: groupMoney(claims), requestCount: requests.length };
}
function Money({ amounts }) {
  return Object.keys(amounts).length ? Object.entries(amounts).map(([currency, amount]) => <strong className="cc-money-line" key={currency} dir="ltr">{amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} <small>{currency}</small></strong>) : <strong className="cc-money-line">لا توجد مستحقات</strong>;
}
export default function ControlCenter({ model, onNavigate, onCapture, onFocus, notes, onToggleNote, onSearch }) {
  const [tab, setTab] = useState("decisions");
  const [expanded, setExpanded] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [query, setQuery] = useState("");
  const items = tab === "decisions" ? model.decisions : model.waiting.map((row) => ({ id: row.id, targetId: row.id, section: "work-orders", title: row.title, project: row.projectName, reason: names[row.status] || row.status, label: "افتح النقاش" }));
  const filtered = items.filter((item) => `${item.title} ${item.project} ${item.reason}`.includes(query));
  const shown = expanded || query ? filtered : filtered.slice(0, 3);
  const main = model.decisions[0];
  const activeNotes = notes.filter((note) => showDone || !note.done);
  return <div className="control-center">
    <header className="cc-heading"><div><div className="cc-context">مساحة عبد الوهاب <span>{model.live ? "متصلة ببيانات العمل" : "تجربة محلية ببيانات تجريبية"}</span></div><h1>مساحة أوسع للإبداع.</h1><p>قراراتك، أعمالك، والتزاماتك في نظرة واحدة.</p></div><button className="cc-search-launch" aria-label="انتقل إلى قسم أو عمل" onClick={onSearch}><MagnifyingGlass size={20} /><span>انتقل إلى قسم أو عمل</span><kbd>⌘ K</kbd></button></header>
    <section className="cc-hero-grid">
      <article className="cc-priority"><div className="cc-priority-top"><span><Target size={19} /> يحتاج عينك</span><span>{model.decisions.length} قرارات</span></div><div className="cc-priority-body"><p>{main?.project || "وقتك لك"}</p><h2>{main?.title || "كل شيء تحت السيطرة."}</h2><span>{main?.reason || "ابدأ عملك الإبداعي أو التقط فكرة جديدة."}</span></div><div className="cc-priority-actions"><button onClick={() => main ? onNavigate(main.section, main.targetId) : onCapture()}>{main?.label || "التقط فكرة"}<ArrowUpLeft size={22} /></button><button className="cc-focus-start" onClick={() => onFocus(main || { title: "جلسة إبداعية", section: "work-orders" })}><Play size={17} weight="fill" /> ركّز 25 دقيقة</button></div></article>
      <div className="cc-money-panel"><header><Wallet size={22} /><h2>الصورة المالية</h2></header><button onClick={() => onNavigate("finance")}><span>مستحقات العملاء <ArrowUpLeft size={17} /></span><Money amounts={model.receivable} /><small>{model.invoices.length} فواتير غير محصّلة</small></button><button onClick={() => onNavigate("finance")}><span>مستحقات المتعاونين <ArrowUpLeft size={17} /></span><Money amounts={model.payable} /><small>{model.claims.length} مطالبات مستحقة</small></button><p>كل عملة مستقلة. المسودات خارج الإجماليات.</p></div>
    </section>
    <div className="cc-pulse"><button onClick={() => onNavigate("work-orders")}><FolderOpen size={20} /><strong>{model.active.length}</strong><span>أعمال نشطة</span><ArrowLeft size={17} /></button><button onClick={() => onNavigate("requests")}><Tray size={20} /><strong>{model.requestCount}</strong><span>طلبات جديدة</span><ArrowLeft size={17} /></button><button onClick={() => setTab("waiting")}><UsersThree size={20} /><strong>{model.waiting.length}</strong><span>بانتظار الآخرين</span><ArrowLeft size={17} /></button></div>
    <div className="cc-main-grid"><section className="cc-decisions"><header className="cc-section-heading"><div><h2>رتّب انتباهك</h2><p>افتح القرار، أو اختره لجلسة تركيز.</p></div><span>{filtered.length}</span></header><div className="cc-decision-tools"><div role="group" aria-label="تصفية القرارات"><button className={tab === "decisions" ? "active" : ""} onClick={() => { setTab("decisions"); setExpanded(false); }}>يحتاجني</button><button className={tab === "waiting" ? "active" : ""} onClick={() => { setTab("waiting"); setExpanded(false); }}>بانتظار الآخرين</button></div><label><MagnifyingGlass size={17} /><input aria-label="بحث في القرارات" placeholder="ابحث هنا" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div><div className="cc-decision-list">{shown.map((item) => <article key={item.id}><div className={`cc-decision-symbol ${item.priority < 2 ? "review" : ""}`}>{item.priority < 2 ? <Sparkle size={22} /> : <FolderOpen size={22} />}</div><div className="cc-decision-copy"><small>{item.project}</small><h3>{item.title}</h3><p>{item.reason}{item.overdue && <em>تجاوز الموعد</em>}</p></div><div className="cc-decision-actions"><button onClick={() => onNavigate(item.section, item.targetId)}>{item.label}<ArrowLeft size={15} /></button><button aria-label={`التركيز على ${item.title}`} onClick={() => onFocus(item)}><Target size={19} /></button></div></article>)}</div>{!shown.length && <div className="cc-empty"><CheckCircle size={28} /><h3>{query ? "لا توجد نتائج" : "لا شيء ينتظر هنا"}</h3><p>{query ? "جرّب اسم المشروع أو امسح البحث." : "ستظهر الأعمال عندما تتغيّر حالتها."}</p></div>}{filtered.length > 3 && !query && <button className="cc-show-more" onClick={() => setExpanded(!expanded)}>{expanded ? "اكتفِ بثلاثة قرارات" : `عرض البقية (${filtered.length - 3})`}</button>}</section>
    <aside className="cc-notes"><header className="cc-section-heading"><div><h2>صندوق أفكاري</h2><p>محفوظ على هذا الجهاز.</p></div><button aria-label="إضافة فكرة" onClick={onCapture}><Plus size={23} /></button></header><label className="cc-notes-filter"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> إظهار المنجزة</label><div className="cc-note-list">{activeNotes.map((note) => <article key={note.id} className={note.done ? "is-done" : ""}><button aria-label={note.done ? `إعادة فتح ${note.text}` : `إنجاز ${note.text}`} onClick={() => onToggleNote(note.id)}>{note.done && <Check size={15} />}</button><div><p>{note.text}</p><time>{new Date(note.createdAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}</time></div></article>)}</div>{!activeNotes.length && <div className="cc-empty"><Tray size={28} /><p>ضع الفكرة هنا، وارجع لها حين يناسبك.</p></div>}<button className="cc-note-add" onClick={onCapture}><Plus size={18} /> التقط فكرة</button></aside></div>
    <section className="cc-projects"><header className="cc-section-heading"><div><h2>على طاولة العمل</h2><p>نفّذ بنفسك، أو افتح العمل لتقسيمه وتحديد المتعاون وأجره.</p></div><button onClick={() => onNavigate("work-orders")}>كل الأعمال <ArrowLeft size={16} /></button></header><div className="cc-work-grid">{model.active.slice(0, 6).map((order) => <button key={order.id} onClick={() => onNavigate("work-orders", order.id)}><span className="cc-work-owner">{order.assigned ? "مفوّض لمتعاون" : "بقيادتك"}<ArrowUpLeft size={21} /></span><h3>{order.title}</h3><p>{order.projectName}</p><div><span>{names[order.status] || order.status}</span><small>{order.dueLabel}</small></div></button>)}</div>{!model.active.length && <div className="cc-empty">لا توجد أعمال نشطة. افتح التنفيذ والتفويض لإنشاء عمل.</div>}</section>
  </div>;
}

const openControlDialogs = [];
let controlDialogBodyOverflow = "";

function useControlDialog(onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previousFocus = document.activeElement;
    if (!openControlDialogs.length) {
      controlDialogBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openControlDialogs.push(dialog);
    const isTop = () => openControlDialogs.at(-1) === dialog;
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter((element) => element.getClientRects().length && !element.closest('[inert], [hidden], [aria-hidden="true"]'));
    const focusFirst = () => (dialog.querySelector("[data-dialog-initial-focus]") || focusable()[0] || dialog).focus({ preventScroll: true });
    const handleKey = (event) => {
      if (!isTop()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat && !event.isComposing) closeRef.current();
      } else if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          event.preventDefault();
          dialog.focus({ preventScroll: true });
        } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const keepFocusInside = (event) => { if (isTop() && !dialog.contains(event.target)) focusFirst(); };
    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("focusin", keepFocusInside);
    focusFirst();
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      document.removeEventListener("focusin", keepFocusInside);
      const index = openControlDialogs.indexOf(dialog);
      if (index !== -1) openControlDialogs.splice(index, 1);
      if (!openControlDialogs.length) document.body.style.overflow = controlDialogBodyOverflow;
      const currentDialog = openControlDialogs.at(-1);
      if (previousFocus?.isConnected && (!currentDialog || currentDialog.contains(previousFocus))) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return dialogRef;
}

export function FocusSession({ task, onClose, onOpen }) {
  const dialogRef = useControlDialog(onClose);
  const [remaining, setRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState(null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => { const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); setRemaining(next); if (!next) setDeadline(null); };
    tick(); const timer = setInterval(tick, 250); return () => clearInterval(timer);
  }, [deadline]);
  const toggleTimer = () => {
    if (deadline) {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      setDeadline(null);
    } else {
      const seconds = remaining || 25 * 60;
      setRemaining(seconds);
      setDeadline(Date.now() + seconds * 1000);
    }
  };
  return <div className="cc-focus-overlay" role="dialog" aria-modal="true" aria-label="جلسة التركيز"><section ref={dialogRef} tabIndex={-1}><button className="cc-focus-close" onClick={onClose}><X size={20} /> عرض اللوحة</button><Target size={34} /><p>شيء واحد الآن</p><h1>{task.title}</h1><div className="cc-timer" role="timer" aria-label="الوقت المتبقي" dir="ltr">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</div><p role="status">{remaining === 0 ? "انتهت الجلسة. خذ مساحة للراحة." : deadline ? "وقتك للعمل على ما اخترته." : "ابدأ حين تكون جاهزاً."}</p><div className="cc-focus-buttons"><button onClick={toggleTimer} data-dialog-initial-focus>{deadline ? <Pause size={20} /> : <Play size={20} />}{deadline ? "إيقاف مؤقت" : remaining === 0 ? "جلسة جديدة" : remaining < 1500 ? "استئناف التركيز" : "ابدأ التركيز"}</button><button onClick={onOpen}>افتح العمل <ArrowLeft size={18} /></button></div><small>انتهاء الجلسة لا يغيّر حالة العمل.</small></section></div>;
}

export function CommandPalette({ sections, orders, onNavigate, onClose, onCapture }) {
  const dialogRef = useControlDialog(onClose);
  const [query, setQuery] = useState("");
  const results = useMemo(() => [...sections.map((item) => ({ key: item.id, label: item.label, section: item.id, meta: "قسم" })), ...orders.map((item) => ({ key: `order-${item.id}`, label: item.title, meta: item.projectName, section: "work-orders", targetId: item.id }))].filter((item) => `${item.label} ${item.meta}`.includes(query)).slice(0, 12), [sections, orders, query]);
  return <div className="cc-command-layer" onMouseDown={onClose}><section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="الانتقال السريع" onMouseDown={(e) => e.stopPropagation()}><header><MagnifyingGlass size={23} /><input data-dialog-initial-focus aria-label="بحث عن قسم أو عمل" placeholder="إلى أين تريد الذهاب؟" value={query} onChange={(e) => setQuery(e.target.value)} /><button aria-label="إغلاق البحث" onClick={onClose}><X size={21} /></button></header><div className="cc-command-results">{results.map((item) => <button key={item.key} onClick={() => { onNavigate(item.section, item.targetId); onClose(); }}><span><strong>{item.label}</strong><small>{item.meta}</small></span><ArrowLeft size={19} /></button>)}{!results.length && <p>لا توجد نتيجة. جرّب اسم المشروع أو القسم.</p>}</div><footer><button onClick={() => { onClose(); onCapture(); }}><Plus size={18} /> التقط فكرة بدلاً من البحث</button><kbd>Esc</kbd></footer></section></div>;
}

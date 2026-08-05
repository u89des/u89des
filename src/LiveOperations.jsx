import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  Coins,
  FileArrowUp,
  FileText,
  FolderOpen,
  Handshake,
  Invoice,
  List,
  LockKey,
  PaperPlaneTilt,
  Plus,
  Printer,
  Receipt,
  ShieldCheck,
  Target,
  Tray,
  UserFocus,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react";
import {
  createSignedProjectFileUrl,
  insertRecord,
  loadWorkspaceSnapshot,
  updateRecord,
  uploadProjectFile,
  workflow,
} from "./lib/studio-platform";

const statusLabels = {
  new: "جديد",
  needs_info: "يحتاج معلومات",
  accepted: "مقبول",
  converted: "تحول إلى مشروع",
  brief: "البريف",
  quote: "عرض السعر",
  contract: "العقد",
  active: "قيد التنفيذ",
  proof: "البروفات",
  delivery: "التسليم",
  follow_up: "المتابعة",
  completed: "مكتمل",
  paused: "متوقف مؤقتاً",
  cancelled: "ملغي",
  draft: "مسودة",
  sent: "مرسل",
  in_progress: "قيد التنفيذ",
  submitted: "جاهز للمراجعة",
  needs_changes: "يحتاج تعديلاً",
  approved: "معتمد",
  viewed: "تمت المشاهدة",
  client_signed: "وقعه العميل",
  signed: "موقع",
  issued: "صادرة",
  overdue: "متأخرة",
  paid: "مدفوعة",
  due: "مستحقة",
  todo: "لم تبدأ",
  review: "للمراجعة",
  changes_requested: "تعديل مطلوب",
  done: "مكتملة",
};

const formatMoney = (amount, currency = "SAR") => `${Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
const displayStatus = (status) => statusLabels[status] || status || "غير محدد";
const displayDate = (value) => value ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(value)) : "غير محدد";

export function useWorkspaceData(access) {
  const [state, setState] = useState({ loading: Boolean(access), error: "", data: null });
  const refresh = useCallback(async () => {
    if (!access?.workspaceId) return;
    setState((current) => ({ ...current, loading: !current.data, error: "" }));
    try {
      const data = await loadWorkspaceSnapshot(access.workspaceId);
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || "تعذر تحميل بيانات مساحة العمل" }));
    }
  }, [access?.workspaceId]);

  useEffect(() => {
    if (!access?.workspaceId) {
      setState({ loading: false, error: "", data: null });
      return undefined;
    }
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, [access?.workspaceId, refresh]);

  return { ...state, refresh };
}

function EmptyState({ icon: Icon = FolderOpen, title, body }) {
  return <div className="empty-state live-empty"><Icon size={34} /><h2>{title}</h2><p>{body}</p></div>;
}

function LiveStatus({ value, label }) {
  return <span className={`status-badge live-status ${["active", "paid", "approved", "signed", "done", "completed"].includes(value) ? "success" : ""}`}>{label || displayStatus(value)}</span>;
}

function EntityHeader({ icon: Icon, title, meta, status }) {
  return <div className="live-entity-head"><span><Icon size={20} /></span><div><strong>{title}</strong><small>{meta}</small></div>{status && <LiveStatus value={status} />}</div>;
}

const listValue = (value) => Array.isArray(value) ? value : [];

function PrintableDocument({ kind, record, project, client, settings, onClose }) {
  const labels = { quote: "عرض سعر", contract: "عقد تقديم خدمات إبداعية", invoice: "فاتورة غير ضريبية", claim: "فاتورة تقديم خدمة" };
  const amount = kind === "contract" ? record.body?.total : record.amount ?? record.total;
  const currency = kind === "contract" ? record.body?.currency : record.currency;
  const scope = kind === "contract" ? record.body?.scope : record.scope;
  const paymentPlan = kind === "contract" ? listValue(record.body?.payment_plan) : listValue(record.payment_plan);
  const terms = listValue(record.body?.terms);
  return <div className="modal-layer print-layer" onMouseDown={onClose}><section className="modal-panel wide print-modal" onMouseDown={(event) => event.stopPropagation()}><div className="print-actions"><button className="button ghost" onClick={onClose}>إغلاق</button><button className="button primary" onClick={() => window.print()}><Printer size={18} /> طباعة أو حفظ PDF</button></div><article className="print-document"><header><div className="print-brand">U89<span>استوديو العلامة</span></div><div><small>{labels[kind]}</small><strong>{record.reference}</strong><time>{displayDate(record.created_at)}</time></div></header><section className="print-parties"><div><small>مقدم الخدمة</small><strong>{settings?.owner_name_ar || "عبد الوهاب بن سليمان السويد"}</strong><span>{settings?.email}</span><span>{settings?.phone}</span></div><div><small>{kind === "claim" ? "مقدم الخدمة المتعاون" : "العميل"}</small><strong>{kind === "claim" ? record.collaborator_name : client?.company_name || "يحدد من ملف العميل"}</strong><span>{kind === "claim" ? record.item_name : client?.contact_name}</span><span>{kind === "claim" ? "" : client?.email}</span></div></section><section className="print-subject"><small>المشروع</small><h1>{project?.name || record.item_name || "خدمة إبداعية"}</h1>{scope && <p>{scope}</p>}</section>{kind === "quote" && <><section className="print-columns"><div><small>المخرجات</small>{listValue(record.deliverables).map((item) => <p key={item}>{item}</p>)}</div><div><small>الاستثناءات</small>{listValue(record.exclusions).length ? listValue(record.exclusions).map((item) => <p key={item}>{item}</p>) : <p>لا توجد استثناءات إضافية مثبتة.</p>}</div></section><section className="print-terms"><p>البروفة الأولى خلال {record.first_proof_days} يوم عمل، والتعديل خلال {record.revision_days} أيام عمل.</p><p>صلاحية العرض {record.validity_days} أيام من تاريخ الإصدار.</p><p>قبول العرض ينشئ عقداً مستقلاً، ولا يبدأ التنفيذ قبل توقيع العقد وتسجيل الدفعة الأولى.</p></section></>}{kind === "contract" && <section className="print-terms"><h2>بنود العقد</h2>{terms.map((term, index) => <p key={`${index}-${term}`}><b>{index + 1}.</b> {term}</p>)}<div className="print-signatures"><span><small>مقدم الخدمة</small><strong>{record.owner_signed_at ? "وقع إلكترونياً" : "بانتظار التوقيع"}</strong><time>{displayDate(record.owner_signed_at)}</time></span><span><small>العميل</small><strong>{record.client_signer_name || "بانتظار التوقيع"}</strong><time>{displayDate(record.client_signed_at)}</time></span></div></section>}{kind === "invoice" && <section className="print-terms"><p>البيان: {record.installment_label}</p><p>تاريخ الاستحقاق: {displayDate(record.due_date)}</p><p>الحالة: {displayStatus(record.status)}</p>{record.payment_reference && <p>مرجع السداد: {record.payment_reference}</p>}</section>}{kind === "claim" && <section className="print-columns"><div><small>القطعة أو الخدمة</small><p>{record.item_name}</p><p>الكمية: {record.quantity}</p></div><div><small>سعر الوحدة</small><p>{formatMoney(record.unit_price, record.currency)}</p><p>الحالة: {displayStatus(record.status)}</p></div></section>}<section className="print-total"><span>الإجمالي</span><strong>{formatMoney(amount, currency)}</strong>{paymentPlan.length > 0 && <div>{paymentPlan.map((value, index) => <span key={index}>الدفعة {index + 1}: {value}%</span>)}</div>}</section><footer><span>{kind === "invoice" ? "فاتورة عادية غير ضريبية" : "مستند صادر من U89 Studio OS"}</span><span>{settings?.bank_name ? `بيانات التحويل محفوظة في مساحة العميل، ${settings.bank_name}` : ""}</span></footer></article></section></div>;
}

function LiveOverview({ data, setSection }) {
  const pendingRequest = data.service_requests?.find((item) => ["new", "needs_info"].includes(item.status));
  const submittedBrief = data.briefs?.find((item) => item.status === "submitted");
  const draftQuote = data.quotes?.find((item) => item.status === "draft");
  const unpaidInvoice = data.invoices?.find((item) => ["issued", "overdue"].includes(item.status));
  const next = pendingRequest
    ? { title: `راجع طلب ${pendingRequest.project_name}`, body: "اقبل الطلب بعد التحقق من الخدمة والموعد، وسيُنشأ البريف تلقائياً.", section: "requests" }
    : submittedBrief
      ? { title: "راجع البريف الجاهز", body: "اعتماده يفتح عرض السعر ويغلق احتمال التسعير قبل وضوح النطاق.", section: "briefs" }
      : draftQuote
        ? { title: "أكمل عرض السعر", body: "حدد القيمة والنطاق وخطة الدفعات ثم أرسله للعميل.", section: "documents" }
        : unpaidInvoice
          ? { title: "تحقق من الدفعة المستحقة", body: "سجل التحويل بعد مطابقته مع الحساب البنكي.", section: "finance" }
          : { title: "لا يوجد قرار عاجل الآن", body: "النظام سيضع أول قرار جديد هنا عند وصوله.", section: "projects" };
  const dueInvoices = (data.invoices || []).filter((item) => ["issued", "overdue"].includes(item.status));
  const pendingClaims = (data.collaborator_claims || []).filter((item) => ["submitted", "due"].includes(item.status));

  return <div className="dashboard-content live-overview">
    <section className="today-grid">
      <article className="focus-card"><div className="focus-card-top"><span>قرارك التالي</span><time>مساحة حية</time></div><div className="focus-card-body"><div><p>U89 Studio OS</p><h2>{next.title}</h2><span>{next.body}</span></div><button className="button inverted" onClick={() => setSection(next.section)}>فتح القرار <ArrowLeft size={18} /></button></div></article>
      <article className="money-card" onClick={() => setSection("finance")} role="button" tabIndex="0"><div className="money-head"><Wallet size={23} /><span>المستحقات الحالية</span></div><strong>{formatMoney(dueInvoices.reduce((sum, item) => sum + Number(item.amount), 0), dueInvoices[0]?.currency || "SAR")}</strong><p>{dueInvoices.length} فواتير تحتاج متابعة، و{pendingClaims.length} مطالبات للمتعاونين.</p></article>
    </section>
    <section className="metrics-row live-metrics"><div><Briefcase size={22} /><span>المشاريع<strong>{data.projects?.length || 0}</strong></span></div><div><Tray size={22} /><span>طلبات جديدة<strong>{(data.service_requests || []).filter((item) => item.status === "new").length}</strong></span></div><div><List size={22} /><span>بريفات للمراجعة<strong>{(data.briefs || []).filter((item) => item.status === "submitted").length}</strong></span></div><div><Receipt size={22} /><span>فواتير مستحقة<strong>{dueInvoices.length}</strong></span></div></section>
    <section className="panel live-activity-panel"><div className="panel-heading"><div><h2>آخر الحركة</h2><p>سجل تدقيق مشترك لكل ما تغير داخل المشاريع.</p></div></div>{data.activity_events?.length ? <div className="live-activity-list">{data.activity_events.slice(0, 8).map((event) => <article key={event.id}><CheckCircle size={18} weight="fill" /><div><strong>{event.label}</strong><small>{event.actor_label}، {displayDate(event.created_at)}</small></div></article>)}</div> : <EmptyState icon={Clock} title="لم تبدأ الحركة بعد" body="يظهر هنا أول طلب أو اعتماد أو دفعة مسجلة." />}</section>
  </div>;
}

function LiveRequests({ data, refresh, onToast, access }) {
  const [busy, setBusy] = useState("");
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
  const members = data.memberships || [];
  const collaborators = members.filter((item) => ["collaborator", "manager"].includes(item.role));
  const accept = async (request) => {
    setBusy(request.id);
    try {
      await workflow.acceptRequest(request.id);
      onToast("تم قبول الطلب وإنشاء المشروع والبريف وإشعار العميل");
      await refresh();
    } catch (error) {
      onToast(error.message);
    } finally {
      setBusy("");
    }
  };
  const assignRetainer = async (request, userId) => {
    try {
      await updateRecord("retainer_requests", request.id, { assignee_user_id: userId || null, status: userId ? "assigned" : "triage" }, access.workspaceId);
      onToast("تم تحديث مسؤول الطلب الدوري");
      await refresh();
    } catch (error) { onToast(error.message); }
  };

  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>طلبات العملاء</h1><p>طلبات المشاريع الجديدة والطلبات الدورية في طابور واحد واضح.</p></div></div>
    <section className="panel live-list-panel"><div className="panel-heading"><div><h2>طلبات المشاريع</h2><p>يُنشأ المشروع والبريف فقط بعد قبولك.</p></div><span>{data.service_requests?.length || 0}</span></div>{data.service_requests?.length ? <div className="live-entity-list">{data.service_requests.map((request) => { const client = clients[request.client_id]; return <article key={request.id}><EntityHeader icon={Tray} title={request.project_name} meta={`${request.reference}، ${client?.company_name || "عميل"}`} status={request.status} /><div className="live-facts"><span><small>الخدمة</small><strong>{request.service_name}</strong></span><span><small>التواصل</small><strong>{client?.preferred_contact || "غير محدد"}</strong></span><span><small>الميزانية</small><strong>{request.budget || "غير محددة"}</strong></span><span><small>الموعد</small><strong>{displayDate(request.requested_deadline)}</strong></span></div>{request.goal && <p className="live-entity-note">{request.goal}</p>}{["new", "needs_info"].includes(request.status) && <button className="button primary small" disabled={busy === request.id} onClick={() => accept(request)}>{busy === request.id ? <CircleNotch size={17} className="spin" /> : <Check size={17} />} قبول وإرسال البريف</button>}</article>; })}</div> : <EmptyState icon={Tray} title="لا توجد طلبات جديدة" body="سيظهر هنا أول طلب يصل من نموذج الموقع العام." />}</section>
    <section className="panel live-list-panel"><div className="panel-heading"><div><h2>طلبات العقود التسويقية</h2><p>كل طلب مرتبط بعقده ومدته والمسؤول عنه.</p></div><span>{data.retainer_requests?.length || 0}</span></div>{data.retainer_requests?.length ? <div className="live-entity-list compact">{data.retainer_requests.map((request) => <article key={request.id}><EntityHeader icon={Handshake} title={request.title} meta={`${request.reference}، ${request.request_type}`} status={request.status} /><p className="live-entity-note">{request.brief}</p><label className="live-inline-select">المسؤول<select value={request.assignee_user_id || ""} onChange={(event) => assignRetainer(request, event.target.value)}><option value="">غير مسند</option>{collaborators.map((person) => <option value={person.user_id} key={person.user_id}>{person.display_name}</option>)}</select></label></article>)}</div> : <EmptyState icon={Handshake} title="لا توجد طلبات دورية" body="يستطيع عميل العقد النشط إرسال طلباته من بوابته." />}</section>
  </div>;
}

function LiveProjects({ data, refresh, onToast }) {
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
  const internalProofs = useMemo(() => Object.fromEntries((data.proofs || []).filter((item) => item.status === "internal_review").map((item) => [item.project_id, item])), [data.proofs]);
  const openProof = async (proof) => {
    const file = (data.project_files || []).find((item) => item.proof_id === proof.id && item.category === "proof");
    if (!file) { onToast("لم يعثر النظام على ملف مرتبط بهذه البروفة"); return; }
    try { window.open(await createSignedProjectFileUrl(file.storage_path), "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); }
  };
  const sendProof = async (proof) => {
    try { await workflow.sendProofToClient(proof.id); onToast("تم اعتماد البروفة وإرسالها إلى العميل"); await refresh(); } catch (error) { onToast(error.message); }
  };
  const uploadDelivery = async (project, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadProjectFile({ workspaceId: project.workspace_id, projectId: project.id, file, category: "delivery" });
      onToast("تم رفع ملف التسليم وبقي فحص الدفعات وفتح الملفات للعميل");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const release = async (project) => {
    try {
      await workflow.releaseDelivery(project.id);
      onToast("تم فتح ملفات التسليم للعميل");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>المشاريع</h1><p>مرحلة المشروع والقرار التالي والعميل في سجل متصل.</p></div></div>{data.projects?.length ? <div className="live-project-grid">{data.projects.map((project) => { const pendingProof = internalProofs[project.id]; const deliveryCount = (data.project_files || []).filter((file) => file.project_id === project.id && file.category === "delivery").length; return <article className="panel" key={project.id}><EntityHeader icon={Briefcase} title={project.name} meta={`${project.reference}، ${clients[project.client_id]?.company_name || "عميل"}`} status={project.status} /><div className="live-project-action"><small>القرار التالي</small><strong>{project.next_action || "لا يوجد قرار مسجل"}</strong></div><div className="live-facts"><span><small>الخدمة</small><strong>{project.service_name}</strong></span><span><small>الاستحقاق</small><strong>{displayDate(project.due_date)}</strong></span></div>{pendingProof && <div className="live-proof-review-gate"><span><small>مراجعة داخلية</small><strong>{pendingProof.title}</strong><p>{pendingProof.note || "راجع الملف قبل إرساله للعميل."}</p></span><div className="live-actions"><button className="button ghost small" onClick={() => openProof(pendingProof)}>فتح الملف</button><button className="button primary small" onClick={() => sendProof(pendingProof)}>اعتماد وإرسال للعميل</button></div></div>}{["active", "proof"].includes(project.status) && <div className="live-actions live-delivery-actions"><label className="button ghost small upload-button">رفع ملف تسليم <FileArrowUp size={16} /><input type="file" onChange={(event) => uploadDelivery(project, event)} /></label><button className="button ghost small" disabled={!deliveryCount} onClick={() => release(project)}>فحص وفتح التسليم <ArrowLeft size={16} /></button></div>}</article>; })}</div> : <EmptyState icon={Briefcase} title="لا توجد مشاريع بعد" body="قبول أول طلب سينشئ المشروع وملفه المتصل." />}</div>;
}

function LiveBriefs({ data, refresh, onToast }) {
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  const approve = async (brief) => {
    try {
      await workflow.approveBrief(brief.id);
      onToast("تم اعتماد البريف وإنشاء مسودة عرض السعر");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>البريفات</h1><p>إجابات العميل هي بوابة التسعير الإلزامية.</p></div></div><section className="panel live-list-panel">{data.briefs?.length ? <div className="live-entity-list">{data.briefs.map((brief) => <article key={brief.id}><EntityHeader icon={List} title={projects[brief.project_id]?.name || brief.reference} meta={brief.reference} status={brief.status} /><details className="live-details"><summary>عرض الإجابات</summary><div>{Object.entries(brief.answers || {}).map(([key, value]) => <span key={key}><small>{key}</small><p>{Array.isArray(value) ? value.join("، ") : String(value)}</p></span>)}</div></details>{brief.status === "submitted" && <button className="button primary small" onClick={() => approve(brief)}><ShieldCheck size={17} /> اعتماد وفتح العرض</button>}</article>)}</div> : <EmptyState icon={List} title="لا توجد بريفات" body="يُنشأ البريف المناسب تلقائياً بعد قبول الطلب." />}</section></div>;
}

function LiveQuote({ quote, project, access, refresh, onToast, onPrint }) {
  const [scope, setScope] = useState(quote.scope || "");
  const [amount, setAmount] = useState(String(quote.subtotal || 0));
  const [paymentPlan, setPaymentPlan] = useState(Array.isArray(quote.payment_plan) ? quote.payment_plan : [50, 50]);
  const [deliverables, setDeliverables] = useState(listValue(quote.deliverables).join("\n"));
  const [exclusions, setExclusions] = useState(listValue(quote.exclusions).join("\n"));
  const [revisionRounds, setRevisionRounds] = useState(quote.revision_rounds ?? "");
  const [firstProofDays, setFirstProofDays] = useState(quote.first_proof_days || 14);
  const [revisionDays, setRevisionDays] = useState(quote.revision_days || 7);
  const [validityDays, setValidityDays] = useState(quote.validity_days || 10);
  const [busy, setBusy] = useState(false);
  const updatePayment = (index, value) => setPaymentPlan((current) => current.map((item, itemIndex) => itemIndex === index ? Number(value) : item));
  const save = async (send = false) => {
    setBusy(true);
    try {
      await updateRecord("quotes", quote.id, {
        scope,
        subtotal: Number(amount),
        payment_plan: paymentPlan,
        deliverables: deliverables.split("\n").map((item) => item.trim()).filter(Boolean),
        exclusions: exclusions.split("\n").map((item) => item.trim()).filter(Boolean),
        revision_rounds: revisionRounds === "" ? null : Number(revisionRounds),
        first_proof_days: Number(firstProofDays),
        revision_days: Number(revisionDays),
        validity_days: Number(validityDays),
      }, access.workspaceId);
      if (send) await workflow.sendQuote(quote.id);
      onToast(send ? "تم إرسال العرض إلى العميل" : "تم حفظ مسودة العرض");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(false); }
  };
  return <article className="live-document-card"><EntityHeader icon={FileText} title={`عرض ${project?.name || quote.reference}`} meta={quote.reference} status={quote.status} />{quote.status === "draft" ? <div className="live-document-form"><label>نطاق العمل<textarea rows="4" value={scope} onChange={(event) => setScope(event.target.value)} /></label><div className="field-row"><label>المخرجات، كل مخرج في سطر<textarea rows="4" value={deliverables} onChange={(event) => setDeliverables(event.target.value)} /></label><label>الاستثناءات، كل استثناء في سطر<textarea rows="4" value={exclusions} onChange={(event) => setExclusions(event.target.value)} /></label></div><div className="field-row"><label>القيمة<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>العملة<input value={quote.currency} disabled /></label></div><div className="field-row live-quote-timing"><label>جولات التعديل<input type="number" min="0" value={revisionRounds} onChange={(event) => setRevisionRounds(event.target.value)} /></label><label>البروفة الأولى<input type="number" min="1" value={firstProofDays} onChange={(event) => setFirstProofDays(event.target.value)} /></label><label>مدة التعديل<input type="number" min="1" value={revisionDays} onChange={(event) => setRevisionDays(event.target.value)} /></label><label>صلاحية العرض<input type="number" min="1" value={validityDays} onChange={(event) => setValidityDays(event.target.value)} /></label></div><div className="payment-editor">{paymentPlan.map((value, index) => <label key={index}>الدفعة {index + 1}<span><input type="number" min="0" max="100" value={value} onChange={(event) => updatePayment(index, event.target.value)} />%</span></label>)}</div><div className="live-actions"><button className="button ghost small" disabled={busy} onClick={() => save(false)}>حفظ</button><button className="button primary small" disabled={busy || paymentPlan.reduce((sum, item) => sum + Number(item), 0) !== 100 || Number(amount) <= 0} onClick={() => save(true)}><PaperPlaneTilt size={17} /> إرسال العرض</button></div></div> : <div className="live-facts"><span><small>الإجمالي</small><strong>{formatMoney(quote.total, quote.currency)}</strong></span><span><small>الصلاحية</small><strong>{displayDate(quote.valid_until)}</strong></span></div>}<button className="button ghost small live-print-button" onClick={onPrint}><Printer size={17} /> طباعة أو PDF</button></article>;
}

function LiveContract({ contract, project, access, refresh, onToast, ownerName, onPrint }) {
  const [terms, setTerms] = useState(listValue(contract.body?.terms).join("\n"));
  const locked = Boolean(contract.client_signed_at || contract.owner_signed_at);
  const saveTerms = async () => {
    try {
      await updateRecord("contracts", contract.id, { body: { ...contract.body, terms: terms.split("\n").map((item) => item.trim()).filter(Boolean) } }, access.workspaceId);
      onToast("تم حفظ الصياغة النهائية للعقد");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const sign = async () => {
    try {
      await workflow.signContract(contract.id, ownerName);
      onToast("تم توقيع العقد من مقدم الخدمة");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <article><EntityHeader icon={Handshake} title={project?.name || "عقد مشروع"} meta={contract.reference} status={contract.status} /><div className="live-facts"><span><small>توقيع العميل</small><strong>{contract.client_signed_at ? displayDate(contract.client_signed_at) : "بانتظار العميل"}</strong></span><span><small>توقيع مقدم الخدمة</small><strong>{contract.owner_signed_at ? displayDate(contract.owner_signed_at) : "لم يوقع"}</strong></span></div>{!locked && <label className="live-contract-terms">صياغة البنود، كل بند في سطر<textarea rows="7" value={terms} onChange={(event) => setTerms(event.target.value)} /></label>}{locked && <div className="form-note"><LockKey size={18} /> قفل النظام نص العقد بعد أول توقيع لحماية النسخة المعتمدة.</div>}<div className="live-actions">{!locked && <button className="button ghost small" onClick={saveTerms}>حفظ الصياغة</button>}{!contract.owner_signed_at && <button className="button primary small" onClick={sign}><Check size={17} /> توقيع مقدم الخدمة</button>}<button className="button ghost small" onClick={onPrint}><Printer size={17} /> طباعة أو PDF</button></div></article>;
}

function LiveDocuments({ data, access, refresh, onToast, ownerName }) {
  const [printable, setPrintable] = useState(null);
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
  const settings = data.studio_settings?.[0] || {};
  const printProps = printable ? { kind: printable.kind, record: printable.record, project: projects[printable.record.project_id], client: clients[projects[printable.record.project_id]?.client_id], settings, onClose: () => setPrintable(null) } : null;
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>العروض والعقود</h1><p>لا يرسل عرض قبل اعتماد البريف، ولا يبدأ التنفيذ قبل اكتمال العقد.</p></div></div><section className="panel live-list-panel"><div className="panel-heading"><div><h2>عروض السعر</h2><p>راجع النطاق والمخرجات والقيمة والدفعات والمدة قبل الإرسال.</p></div></div>{data.quotes?.length ? <div className="live-document-list">{data.quotes.map((quote) => <LiveQuote key={quote.id} quote={quote} project={projects[quote.project_id]} access={access} refresh={refresh} onToast={onToast} onPrint={() => setPrintable({ kind: "quote", record: quote })} />)}</div> : <EmptyState icon={FileText} title="لا توجد عروض" body="اعتماد بريف العميل ينشئ أول مسودة." />}</section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>العقود</h2><p>عدل الصياغة النهائية قبل أول توقيع، ثم يقفل النظام نص النسخة المعتمدة.</p></div></div>{data.contracts?.length ? <div className="live-entity-list compact">{data.contracts.map((contract) => <LiveContract key={contract.id} contract={contract} project={projects[contract.project_id]} access={access} refresh={refresh} onToast={onToast} ownerName={ownerName} onPrint={() => setPrintable({ kind: "contract", record: contract })} />)}</div> : <EmptyState icon={Handshake} title="لا توجد عقود" body="ينشأ العقد من عرض وافق عليه العميل." />}</section>{printProps && <PrintableDocument {...printProps} />}</div>;
}

function PaymentDialog({ invoice: invoiceRow, onClose, onConfirm }) {
  const [method, setMethod] = useState("تحويل بنكي");
  const [reference, setReference] = useState("");
  return <div className="modal-layer" onMouseDown={onClose}><section className="modal-panel compact" onMouseDown={(event) => event.stopPropagation()}><header className="modal-header"><h2>تسجيل تحصيل {invoiceRow.reference}</h2><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></header><form className="request-form" onSubmit={(event) => { event.preventDefault(); onConfirm(method, reference); }}><label>طريقة التحصيل<select value={method} onChange={(event) => setMethod(event.target.value)}><option>تحويل بنكي</option><option>نقدي</option><option>بطاقة</option><option>أخرى</option></select></label><label>مرجع العملية<input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="رقم الحوالة أو المرجع البنكي" /></label><div className="form-note"><ShieldCheck size={18} /> سجّل التحصيل فقط بعد مطابقته مع حسابك البنكي.</div><button className="button primary full" type="submit">تأكيد التحصيل</button></form></section></div>;
}

function ClaimPaymentDialog({ claim, onClose, onConfirm }) {
  const [reference, setReference] = useState("");
  const [exchangeRate, setExchangeRate] = useState(claim.currency === "SAR" ? "1" : "");
  return <div className="modal-layer" onMouseDown={onClose}><section className="modal-panel compact" onMouseDown={(event) => event.stopPropagation()}><header className="modal-header"><h2>سداد مطالبة {claim.reference}</h2><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></header><form className="request-form" onSubmit={(event) => { event.preventDefault(); onConfirm(reference, Number(exchangeRate)); }}><div className="form-note"><Coins size={18} /> {formatMoney(claim.amount, claim.currency)} لصالح {claim.collaborator_name}</div><label>مرجع التحويل<input required value={reference} onChange={(event) => setReference(event.target.value)} /></label>{claim.currency !== "SAR" && <label>سعر الصرف إلى الريال<input type="number" min="0.000001" step="0.000001" required value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} /><small>أدخل السعر الفعلي المسجل يوم السداد.</small></label>}<button className="button primary full" type="submit">تأكيد السداد</button></form></section></div>;
}

function LiveFinance({ data, refresh, onToast }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [printable, setPrintable] = useState(null);
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
  const settings = data.studio_settings?.[0] || {};
  const printProps = printable ? { kind: printable.kind, record: printable.record, project: projects[printable.record.project_id], client: clients[printable.record.client_id], settings, onClose: () => setPrintable(null) } : null;
  const confirm = async (method, reference) => {
    try {
      await workflow.recordInvoicePayment(selectedInvoice.id, method, reference);
      setSelectedInvoice(null);
      onToast("تم تسجيل التحصيل وإضافته إلى دفتر الحركة");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const approveClaim = async (claim) => { try { await workflow.approveClaim(claim.id); onToast("تم اعتماد مطالبة المتعاون"); await refresh(); } catch (error) { onToast(error.message); } };
  const confirmClaim = async (reference, exchangeRate) => { try { await workflow.recordClaimPayment(selectedClaim.id, reference, selectedClaim.currency === "SAR" ? 1 : exchangeRate); setSelectedClaim(null); onToast("تم تسجيل سداد المطالبة وإضافتها إلى المصروفات"); await refresh(); } catch (error) { onToast(error.message); } };
  const openReceipt = async (invoiceRow) => {
    const receiptFile = (data.project_files || []).find((file) => file.invoice_id === invoiceRow.id && file.category === "invoice");
    if (!receiptFile) { onToast("لا يوجد إيصال مرفوع لهذه الفاتورة"); return; }
    try { window.open(await createSignedProjectFileUrl(receiptFile.storage_path), "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); }
  };
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>الحسابات</h1><p>فواتير غير ضريبية، مطالبات متعاونين، وحركة مالية تحفظ كل عملة منفصلة.</p></div></div><section className="finance-hero live-finance-hero"><div className="finance-balance"><span>المحصل المسجل</span><strong>{formatMoney((data.financial_entries || []).filter((item) => item.direction === "income" && item.currency === "SAR").reduce((sum, item) => sum + Number(item.amount), 0))}</strong><p>لا تشمل العملات الأخرى حتى يضاف سعر الصرف المرجعي.</p></div><div className="finance-pairs"><div><Receipt size={22} /><span>فواتير العملاء<strong>{data.invoices?.length || 0}</strong></span></div><div><Coins size={22} /><span>مطالبات الفريق<strong>{data.collaborator_claims?.length || 0}</strong></span></div></div></section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>فواتير العملاء</h2><p>الفاتورة غير ضريبية وتصدر حسب خطة العقد.</p></div></div>{data.invoices?.length ? <div className="live-entity-list compact">{data.invoices.map((item) => <article key={item.id}><EntityHeader icon={Invoice} title={`${item.installment_label}، ${projects[item.project_id]?.name || "مشروع"}`} meta={item.reference} status={item.status} /><div className="live-facts"><span><small>القيمة</small><strong>{formatMoney(item.amount, item.currency)}</strong></span><span><small>الاستحقاق</small><strong>{displayDate(item.due_date)}</strong></span></div><div className="live-actions">{["issued", "overdue"].includes(item.status) && <button className="button primary small" onClick={() => setSelectedInvoice(item)}>تسجيل التحصيل</button>}{(data.project_files || []).some((file) => file.invoice_id === item.id && file.category === "invoice") && <button className="button ghost small" onClick={() => openReceipt(item)}><Receipt size={17} /> فتح الإيصال</button>}<button className="button ghost small" onClick={() => setPrintable({ kind: "invoice", record: item })}><Printer size={17} /> طباعة أو PDF</button></div></article>)}</div> : <EmptyState icon={Invoice} title="لا توجد فواتير" body="تُنشأ الدفعات تلقائياً عند اكتمال توقيع العقد." />}</section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>مطالبات المتعاونين</h2><p>السعر والكمية والعملة تبقى مرتبطة بالمشروع.</p></div></div>{data.collaborator_claims?.length ? <div className="live-entity-list compact">{data.collaborator_claims.map((claim) => <article key={claim.id}><EntityHeader icon={Coins} title={claim.collaborator_name} meta={`${claim.reference}، ${claim.item_name}`} status={claim.status} /><strong>{formatMoney(claim.amount, claim.currency)}</strong><div className="live-actions">{claim.status === "submitted" && <button className="button ghost small" onClick={() => approveClaim(claim)}>اعتماد المطالبة</button>}{["approved", "due"].includes(claim.status) && <button className="button primary small" onClick={() => setSelectedClaim(claim)}>تسجيل السداد</button>}<button className="button ghost small" onClick={() => setPrintable({ kind: "claim", record: claim })}><Printer size={17} /> طباعة أو PDF</button></div></article>)}</div> : <EmptyState icon={Coins} title="لا توجد مطالبات" body="يستطيع المتعاون إرسال مطالبته من مساحته." />}</section>{selectedInvoice && <PaymentDialog invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onConfirm={confirm} />}{selectedClaim && <ClaimPaymentDialog claim={selectedClaim} onClose={() => setSelectedClaim(null)} onConfirm={confirmClaim} />}{printProps && <PrintableDocument {...printProps} />}</div>;
}

function CreateRetainerForm({ data, access, refresh, onToast }) {
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const project = (data.projects || []).find((item) => item.id === values.projectId);
    try {
      await insertRecord("retainers", {
        workspace_id: access.workspaceId,
        project_id: project.id,
        client_id: project.client_id,
        title: values.title,
        start_date: values.start,
        end_date: values.end,
        monthly_fee: Number(values.fee || 0),
        currency: values.currency,
        included_units: values.units.split("\n").map((item) => item.trim()).filter(Boolean),
        request_rules: { note: values.rules || "" },
        status: "active",
      });
      event.currentTarget.reset();
      onToast("تم تفعيل العقد التسويقي وفتح نموذج الطلب للعميل");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const availableProjects = (data.projects || []).filter((project) => !(data.retainers || []).some((retainer) => retainer.project_id === project.id));
  if (!availableProjects.length) return <div className="form-note"><Handshake size={18} /> كل المشاريع الحالية مرتبطة بعقود تسويقية أو لا توجد مشاريع بعد.</div>;
  return <form className="live-task-form" onSubmit={submit}><div className="field-row"><label>المشروع<select name="projectId" required defaultValue=""><option value="" disabled>اختر المشروع</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>اسم العقد<input name="title" required placeholder="مثال: تشغيل المحتوى لمدة 6 أشهر" /></label></div><div className="field-row"><label>تاريخ البداية<input name="start" type="date" required /></label><label>تاريخ النهاية<input name="end" type="date" required /></label></div><div className="field-row"><label>القيمة الشهرية<input name="fee" type="number" min="0" step="0.01" required /></label><label>العملة<select name="currency" defaultValue="SAR"><option>SAR</option><option>USD</option><option>EUR</option></select></label></div><label>الوحدات أو المخرجات المشمولة، كل عنصر في سطر<textarea name="units" rows="4" required /></label><label>قواعد الطلب والمواعيد<textarea name="rules" rows="3" /></label><button className="button primary" type="submit"><Plus size={17} /> تفعيل العقد التسويقي</button></form>;
}

function LiveClients({ data, access, refresh, onToast }) {
  const projectsByClient = (data.projects || []).reduce((grouped, project) => ({ ...grouped, [project.client_id]: [...(grouped[project.client_id] || []), project] }), {});
  const invoicesByClient = (data.invoices || []).reduce((grouped, item) => ({ ...grouped, [item.client_id]: [...(grouped[item.client_id] || []), item] }), {});
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>العملاء</h1><p>ملف موحد للتواصل والمشاريع والمستحقات.</p></div></div>{data.clients?.length ? <div className="client-directory live-client-directory">{data.clients.map((client) => { const due = (invoicesByClient[client.id] || []).filter((item) => ["issued", "overdue"].includes(item.status)); return <article className="client-entry" key={client.id}><span className="client-avatar">{client.company_name.slice(0, 1)}</span><span><strong>{client.company_name}</strong><small>{client.contact_name}</small></span><span><small>المشاريع</small><strong>{projectsByClient[client.id]?.length || 0}</strong></span><span><small>المستحق</small><strong>{formatMoney(due.reduce((sum, item) => sum + Number(item.amount), 0), due[0]?.currency || "SAR")}</strong></span><span className="health">{client.status === "active" ? "عميل نشط" : displayStatus(client.status)}</span></article>; })}</div> : <EmptyState icon={UsersThree} title="لا يوجد عملاء" body="يُنشأ ملف العميل مع أول طلب يصل من الموقع." />}<section className="panel"><div className="panel-heading"><div><h2>عقد تسويقي مستمر</h2><p>حدد المدة والقيمة والمخرجات، وسيظهر نموذج الطلب مباشرة في بوابة العميل.</p></div></div><CreateRetainerForm data={data} access={access} refresh={refresh} onToast={onToast} /></section></div>;
}

function InviteUserForm({ access, data, refresh, onToast }) {
  const [role, setRole] = useState("client");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access.session.access_token}` },
        body: JSON.stringify({ ...values, role, workspaceId: access.workspaceId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر إرسال الدعوة");
      event.currentTarget.reset();
      onToast("تم إرسال الدعوة وربط الصلاحية بالحساب");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(false); }
  };
  return <form className="live-invite-form" onSubmit={submit}><div className="field-row"><label>الاسم<input name="displayName" required /></label><label>البريد<input name="email" type="email" dir="ltr" required /></label></div><div className="field-row"><label>الجوال<input name="phone" type="tel" dir="ltr" /></label><label>الصلاحية<select value={role} onChange={(event) => setRole(event.target.value)}><option value="client">عميل</option><option value="collaborator">متعاون</option><option value="manager">مدير</option><option value="accountant">محاسب</option></select></label></div>{role === "client" && <label>ملف العميل<select name="clientId" defaultValue=""><option value="">اختر الملف</option>{(data.clients || []).map((client) => <option value={client.id} key={client.id}>{client.company_name}</option>)}</select></label>}<button className="button primary" type="submit" disabled={busy}>{busy ? <CircleNotch size={17} className="spin" /> : <PaperPlaneTilt size={17} />} إرسال الدعوة</button></form>;
}

function CreateTaskForm({ access, data, refresh, onToast }) {
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await insertRecord("project_tasks", { workspace_id: access.workspaceId, project_id: values.projectId, title: values.title, description: values.description || null, assignee_user_id: values.assigneeId || null, due_date: values.due || null, priority: values.priority, status: values.assigneeId ? "todo" : "todo" });
      event.currentTarget.reset();
      onToast("تم إنشاء المهمة وإسنادها");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const assignees = (data.memberships || []).filter((item) => ["manager", "collaborator"].includes(item.role));
  return <form className="live-task-form" onSubmit={submit}><label>المهمة<input name="title" required placeholder="المخرج أو القرار المطلوب" /></label><div className="field-row"><label>المشروع<select name="projectId" required defaultValue=""><option value="" disabled>اختر المشروع</option>{(data.projects || []).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label>المسؤول<select name="assigneeId" defaultValue=""><option value="">غير مسند</option>{assignees.map((person) => <option value={person.user_id} key={person.user_id}>{person.display_name}</option>)}</select></label></div><div className="field-row"><label>الاستحقاق<input name="due" type="date" /></label><label>الأولوية<select name="priority" defaultValue="normal"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label></div><label>تفاصيل مختصرة<textarea name="description" rows="3" /></label><button className="button primary" type="submit"><Plus size={17} /> إنشاء المهمة</button></form>;
}

function CollaboratorRateForm({ access, data, refresh, onToast }) {
  const collaborators = (data.memberships || []).filter((item) => item.role === "collaborator");
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const person = collaborators.find((item) => item.user_id === values.collaboratorId);
    try {
      await insertRecord("collaborator_rates", { workspace_id: access.workspaceId, collaborator_user_id: person.user_id, collaborator_name: person.display_name, item_name: values.item, unit_price: Number(values.price), currency: values.currency, active: true });
      event.currentTarget.reset();
      onToast("تم حفظ سعر القطعة للمتعاون");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <form className="live-task-form" onSubmit={submit}><div className="field-row"><label>المتعاون<select name="collaboratorId" required defaultValue=""><option value="" disabled>اختر المتعاون</option>{collaborators.map((person) => <option value={person.user_id} key={person.user_id}>{person.display_name}</option>)}</select></label><label>القطعة أو الخدمة<input name="item" required placeholder="مثال: منشور ثابت" /></label></div><div className="field-row"><label>سعر القطعة<input name="price" type="number" min="0" step="0.01" required /></label><label>العملة<select name="currency" defaultValue="SAR"><option>SAR</option><option>USD</option><option>EUR</option></select></label></div><button className="button ghost" type="submit"><Plus size={17} /> حفظ السعر</button></form>;
}

function LiveTeam({ data, access, refresh, onToast }) {
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>الفريق والصلاحيات</h1><p>الدعوات والمهام والأسعار في مساحة واحدة، مع فصل واضح لما يراه كل دور.</p></div></div><section className="system-columns live-team-columns"><div className="panel"><div className="panel-heading"><div><h2>الأعضاء</h2><p>الحسابات المرتبطة بالمساحة.</p></div></div><div className="live-member-list">{(data.memberships || []).map((person) => <article key={person.id}><span className="person-avatar">{person.display_name.slice(0, 1)}</span><div><strong>{person.display_name}</strong><small>{person.role}</small></div><LiveStatus value={person.status} label={person.status === "active" ? "نشط" : undefined} /></article>)}</div></div><aside className="panel"><div className="panel-heading"><div><h2>دعوة مستخدم</h2><p>تُرسل من الخادم ولا تكشف مفاتيح الإدارة.</p></div></div><InviteUserForm access={access} data={data} refresh={refresh} onToast={onToast} /></aside></section><section className="panel"><div className="panel-heading"><div><h2>مهمة جديدة</h2><p>اربط كل تكليف بمشروع ومسؤول وموعد.</p></div></div><CreateTaskForm access={access} data={data} refresh={refresh} onToast={onToast} /></section><section className="panel"><div className="panel-heading"><div><h2>أسعار المتعاونين</h2><p>سعر مستقل لكل قطعة وبالعملة المتفق عليها.</p></div></div><CollaboratorRateForm access={access} data={data} refresh={refresh} onToast={onToast} />{data.collaborator_rates?.length ? <div className="live-rate-list">{data.collaborator_rates.map((rate) => <span key={rate.id}><strong>{rate.collaborator_name}</strong><small>{rate.item_name}</small><b>{formatMoney(rate.unit_price, rate.currency)}</b></span>)}</div> : null}</section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>المهام الحالية</h2><p>يرى المتعاون المهام المسندة إليه فقط.</p></div></div>{data.project_tasks?.length ? <div className="live-entity-list compact">{data.project_tasks.map((task) => <article key={task.id}><EntityHeader icon={UserFocus} title={task.title} meta={displayDate(task.due_date)} status={task.status} /><p className="live-entity-note">{task.description || "لا توجد تفاصيل إضافية"}</p></article>)}</div> : <EmptyState icon={UserFocus} title="لا توجد مهام" body="أنشئ أول مهمة واربطها بالمشروع والمتعاون." />}</section></div>;
}

export function LiveOwnerSection({ section, data, access, refresh, onToast, setSection, ownerName }) {
  if (section === "overview" || section === "scenario") return <LiveOverview data={data} setSection={setSection} />;
  if (section === "requests") return <LiveRequests data={data} refresh={refresh} onToast={onToast} access={access} />;
  if (section === "projects") return <LiveProjects data={data} refresh={refresh} onToast={onToast} />;
  if (section === "briefs") return <LiveBriefs data={data} refresh={refresh} onToast={onToast} />;
  if (section === "documents") return <LiveDocuments data={data} access={access} refresh={refresh} onToast={onToast} ownerName={ownerName} />;
  if (section === "finance") return <LiveFinance data={data} refresh={refresh} onToast={onToast} />;
  if (section === "clients") return <LiveClients data={data} access={access} refresh={refresh} onToast={onToast} />;
  if (section === "team") return <LiveTeam data={data} access={access} refresh={refresh} onToast={onToast} />;
  return <LiveOverview data={data} setSection={setSection} />;
}

function LiveBriefField({ field, value, onChange, onFile }) {
  if (field.type === "textarea") return <textarea rows="4" required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "date") return <input type="date" required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "select") return <select required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)}><option value="">اختر</option>{(field.options || []).map((option) => <option key={option}>{option}</option>)}</select>;
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return <div className="brief-choice-grid">{(field.options || []).map((option) => <label className={selected.includes(option) ? "selected" : ""} key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])} />{option}</label>)}</div>;
  }
  if (field.type === "scale") return <div className="feedback-scale">{[1, 2, 3, 4, 5].map((score) => <button type="button" className={Number(value) === score ? "active" : ""} onClick={() => onChange(score)} key={score}>{score}</button>)}</div>;
  if (field.type === "file") return <div className="live-brief-file"><input type="file" required={field.required && !value} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) onFile(selected); }} />{value && <small>تم رفع {value}</small>}</div>;
  return <input required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)} />;
}

function ClientBriefAction({ brief, projectId, access, refresh, onToast }) {
  const [answers, setAnswers] = useState(brief.answers || {});
  const [uploading, setUploading] = useState("");
  const sections = brief.template_snapshot?.schema?.sections || [];
  const submit = async (event) => {
    event.preventDefault();
    try {
      await workflow.submitBrief(brief.id, answers);
      onToast("تم إرسال البريف إلى الإدارة للمراجعة");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  const uploadReference = async (field, file) => {
    setUploading(field.id);
    try {
      await uploadProjectFile({ workspaceId: access.workspaceId, projectId, file, category: "brief" });
      setAnswers((current) => ({ ...current, [field.id]: file.name }));
      onToast("تم رفع ملف البريف وحفظه داخل المشروع");
    } catch (error) { onToast(error.message); } finally { setUploading(""); }
  };
  return <form className="live-client-action live-brief-action" onSubmit={submit}><div className="portal-action-heading"><div><span>البريف المطلوب</span><h2>{brief.template_snapshot?.title || "بريف المشروع"}</h2><p>أجب بدقة. هذه الإجابات ستصبح مرجع نطاق العرض.</p></div></div>{sections.map((section) => <section key={section.id}><h3>{section.title}</h3><div className="client-brief-grid">{section.fields.map((field) => <label key={field.id}>{field.label}{field.required && <small>مطلوب</small>}<LiveBriefField field={field} value={answers[field.id]} onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))} onFile={(file) => uploadReference(field, file)} />{uploading === field.id && <small>جارٍ رفع الملف...</small>}</label>)}</div></section>)}<button className="button primary" type="submit" disabled={Boolean(uploading)}>إرسال البريف <ArrowLeft size={18} /></button></form>;
}

function ClientRetainerRequest({ retainer, access, refresh, onToast }) {
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await insertRecord("retainer_requests", { workspace_id: access.workspaceId, retainer_id: retainer.id, project_id: retainer.project_id, title: values.title, request_type: values.requestType, brief: values.brief, priority: values.priority, requested_due_date: values.due || null, status: "new" });
      event.currentTarget.reset();
      onToast("وصل الطلب إلى طابور التنفيذ");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <form className="panel live-retainer-form" onSubmit={submit}><div className="panel-heading"><div><h2>طلب جديد ضمن العقد</h2><p>{retainer.title}، حتى {displayDate(retainer.end_date)}</p></div><Handshake size={22} /></div><label>عنوان الطلب<input name="title" required /></label><div className="field-row"><label>نوع المخرج<input name="requestType" required placeholder="منشور، تقرير، حملة" /></label><label>الموعد المطلوب<input name="due" type="date" /></label></div><label>التفاصيل<textarea name="brief" rows="4" required /></label><label>الأولوية<select name="priority" defaultValue="normal"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label><button className="button primary" type="submit">إرسال الطلب</button></form>;
}

export function LiveClientPortal({ data, access, refresh, onToast }) {
  const [selectedId, setSelectedId] = useState(data.projects?.[0]?.id || "");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const projects = data.projects || [];
  const project = projects.find((item) => item.id === selectedId) || projects[0];
  useEffect(() => { if (!selectedId && projects[0]) setSelectedId(projects[0].id); }, [selectedId, projects]);
  useEffect(() => {
    if (!project) return;
    workflow.getPaymentInstructions(project.id).then(setPaymentInfo).catch(() => setPaymentInfo(null));
  }, [project?.id]);
  if (!project) return <div className="portal-shell"><EmptyState icon={Briefcase} title="لا يوجد مشروع مرتبط بحسابك" body="تواصل مع الإدارة إذا استلمت دعوة قبل إنشاء المشروع." /></div>;
  const brief = data.briefs?.find((item) => item.project_id === project.id);
  const quote = data.quotes?.find((item) => item.project_id === project.id && !["declined", "superseded"].includes(item.status));
  const contract = data.contracts?.find((item) => item.project_id === project.id && item.status !== "void");
  const invoiceRow = data.invoices?.find((item) => item.project_id === project.id && ["issued", "overdue"].includes(item.status));
  const proof = data.proofs?.find((item) => item.project_id === project.id && item.status === "sent");
  const proofFiles = proof ? (data.project_files || []).filter((item) => item.proof_id === proof.id && item.category === "proof" && item.is_client_visible) : [];
  const deliveryFiles = (data.project_files || []).filter((item) => item.project_id === project.id && item.category === "delivery" && item.is_client_visible);
  const retainer = data.retainers?.find((item) => item.project_id === project.id && item.status === "active");
  const respondQuote = async (accepted) => { try { await workflow.respondToQuote(quote.id, accepted); onToast(accepted ? "تم اعتماد العرض وإنشاء العقد" : "تم تسجيل رفض العرض"); await refresh(); } catch (error) { onToast(error.message); } };
  const sign = async () => { try { const client = data.clients?.find((item) => item.id === project.client_id); await workflow.signContract(contract.id, client?.contact_name || "ممثل العميل"); onToast("تم توقيع العقد وتسجيل وقت الاعتماد"); await refresh(); } catch (error) { onToast(error.message); } };
  const reviewProof = async (decision, note = null) => { try { await workflow.reviewProof(proof.id, decision, note); onToast(decision === "approved" ? "تم اعتماد البروفة" : "تم إرسال التعديل للمتعاون"); await refresh(); } catch (error) { onToast(error.message); } };
  const download = async (file) => { try { const url = await createSignedProjectFileUrl(file.storage_path); window.open(url, "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); } };
  const uploadReceipt = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { await uploadProjectFile({ workspaceId: access.workspaceId, projectId: project.id, invoiceId: invoiceRow.id, file, category: "invoice" }); onToast("تم رفع الإيصال. ستراجعه الإدارة قبل تسجيل التحصيل"); await refresh(); } catch (error) { onToast(error.message); } };

  let action = <div className="live-client-action"><Clock size={30} /><h2>لا يوجد إجراء مطلوب منك الآن</h2><p>{project.next_action || "ستصلك رسالة عند وصول قرار جديد."}</p></div>;
  if (brief && ["sent", "in_progress", "needs_changes"].includes(brief.status)) action = <ClientBriefAction brief={brief} projectId={project.id} access={access} refresh={refresh} onToast={onToast} />;
  else if (quote && ["sent", "viewed"].includes(quote.status)) action = <div className="live-client-action"><FileText size={31} /><span>عرض السعر {quote.reference}</span><h2>{formatMoney(quote.total, quote.currency)}</h2><p>{quote.scope}</p><div className="preview-payments">{(quote.payment_plan || []).map((value, index) => <span key={index}><b>{value}%</b><small>الدفعة {index + 1}</small></span>)}</div><div className="live-actions"><button className="button ghost" onClick={() => respondQuote(false)}>رفض العرض</button><button className="button primary" onClick={() => respondQuote(true)}>اعتماد العرض <Check size={18} /></button></div></div>;
  else if (contract && ["sent", "viewed"].includes(contract.status) && !contract.client_signed_at) action = <div className="live-client-action"><Handshake size={31} /><span>العقد {contract.reference}</span><h2>راجع بنود العقد ووقعه</h2><p>يعتمد العقد على النطاق وخطة الدفعات الموافق عليهما في العرض.</p><div className="live-client-contract-terms">{listValue(contract.body?.terms).map((term, index) => <p key={`${index}-${term}`}><b>{index + 1}</b>{term}</p>)}</div><label className="consent-field"><input type="checkbox" id="live-contract-consent" /><span>قرأت العقد وأوافق على التوقيع بصفتي ممثل العميل.</span></label><button className="button primary" onClick={() => { const checkbox = document.getElementById("live-contract-consent"); if (checkbox?.checked) sign(); else onToast("وافق على الإقرار أولاً"); }}>توقيع العقد <Check size={18} /></button></div>;
  else if (invoiceRow) action = <div className="live-client-action"><Receipt size={31} /><span>فاتورة غير ضريبية {invoiceRow.reference}</span><h2>{formatMoney(invoiceRow.amount, invoiceRow.currency)}</h2><p>حوّل المبلغ إلى الحساب أدناه، ثم ارفع الإيصال للمراجعة.</p><div className="payment-instructions"><span><small>المستفيد</small><strong>{paymentInfo?.beneficiary || "يظهر بعد اكتمال إعداد الحساب"}</strong></span><span><small>البنك</small><strong>{paymentInfo?.bank_name || "غير محدد"}</strong></span><span><small>IBAN</small><strong dir="ltr">{paymentInfo?.bank_iban || "غير محدد"}</strong></span></div><label className="button primary upload-button">رفع إيصال التحويل <FileArrowUp size={18} /><input type="file" accept="image/*,application/pdf" onChange={uploadReceipt} /></label></div>;
  else if (proof) action = <ClientProofReview proof={proof} files={proofFiles} onDownload={download} onReview={reviewProof} />;
  else if (project.status === "delivery") action = <div className="live-client-action"><FolderOpen size={31} /><span>التسليم النهائي</span><h2>ملفات مشروعك جاهزة</h2><div className="delivery-file-list">{deliveryFiles.map((file) => <button key={file.id} onClick={() => download(file)}><FileText size={20} /><span><strong>{file.file_name}</strong><small>{file.mime_type || "ملف"}</small></span><ArrowLeft size={17} /></button>)}</div><button className="button primary" disabled={!deliveryFiles.length} onClick={async () => { try { await workflow.confirmDelivery(project.id); onToast("تم تأكيد الاستلام وفتح المتابعة"); await refresh(); } catch (error) { onToast(error.message); } }}>تأكيد الاستلام <Check size={18} /></button></div>;
  else if (project.status === "follow_up") action = <ClientFeedbackAction project={project} refresh={refresh} onToast={onToast} />;

  return <div className="portal-shell live-portal"><header className="live-portal-head"><div><small>بوابة العميل</small><h1>{project.name}</h1><p>{project.service_name}</p></div>{projects.length > 1 && <select value={project.id} onChange={(event) => setSelectedId(event.target.value)}>{projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}<LiveStatus value={project.status} /></header><section className="live-portal-layout"><main>{action}</main><aside><section className="panel"><h2>حالة المشروع</h2><p>{project.next_action || "لا يوجد قرار تالٍ"}</p><div className="live-facts"><span><small>البدء</small><strong>{displayDate(project.start_date)}</strong></span><span><small>التسليم</small><strong>{displayDate(project.due_date)}</strong></span></div></section>{retainer && <ClientRetainerRequest retainer={retainer} access={access} refresh={refresh} onToast={onToast} />}</aside></section></div>;
}

function ClientProofReview({ proof, files, onDownload, onReview }) {
  const [note, setNote] = useState("");
  return <div className="live-client-action"><Target size={31} /><span>البروفة {proof.version}</span><h2>{proof.title}</h2><p>{proof.note || "راجع الاتجاه وأرسل قراراً واضحاً."}</p><div className="delivery-file-list">{files.map((file) => <button key={file.id} onClick={() => onDownload(file)}><FileText size={20} /><span><strong>{file.file_name}</strong><small>فتح ملف البروفة</small></span><ArrowLeft size={17} /></button>)}</div><label>ملاحظات التعديل<textarea rows="4" value={note} onChange={(event) => setNote(event.target.value)} placeholder="اكتب ملاحظة محددة إذا كنت تحتاج تعديلاً" /></label><div className="live-actions"><button className="button ghost" disabled={!note.trim()} onClick={() => onReview("changes_requested", note)}>طلب تعديل</button><button className="button primary" disabled={!files.length} onClick={() => onReview("approved")}>اعتماد البروفة <Check size={18} /></button></div></div>;
}

function ClientFeedbackAction({ project, refresh, onToast }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      await workflow.submitProjectFeedback(project.id, rating, note || null);
      onToast("شكراً، اكتملت رحلة المشروع وحفظنا تقييمك");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <form className="live-client-action live-feedback-action" onSubmit={submit}><CheckCircle size={34} /><span>متابعة ما بعد التسليم</span><h2>كيف كانت تجربة المشروع؟</h2><p>تقييمك يغلق الحلقة ويساعدنا على الحفاظ على ما نجح وتحسين ما يحتاج.</p><div className="feedback-scale">{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} className={rating === score ? "active" : ""} onClick={() => setRating(score)}>{score}</button>)}</div><label>ملاحظة أخيرة<textarea rows="4" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ما الذي تريد أن نحافظ عليه أو نحسنه؟" /></label><button className="button primary" type="submit" disabled={!rating}>إرسال التقييم وإغلاق المشروع <Check size={18} /></button></form>;
}

function CollaboratorClaimForm({ task, data, access, refresh, onToast }) {
  const [rateId, setRateId] = useState(data.collaborator_rates?.[0]?.id || "");
  const rates = data.collaborator_rates || [];
  const rate = rates.find((item) => item.id === rateId);
  const member = data.memberships?.find((item) => item.user_id === access.user.id);
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await insertRecord("collaborator_claims", { workspace_id: access.workspaceId, project_id: task.project_id, collaborator_user_id: access.user.id, collaborator_name: member?.display_name || access.user.email, item_name: rate?.item_name || values.item, unit_price: rate ? Number(rate.unit_price) : Number(values.price), quantity: Number(values.quantity || 1), currency: rate?.currency || values.currency, due_date: values.due || null, status: "submitted", notes: values.notes || null });
      event.currentTarget.reset();
      onToast("تم إرسال المطالبة إلى الحسابات للمراجعة");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <form className="panel live-claim-form" onSubmit={submit}><div className="panel-heading"><div><h2>مطالبة تقديم خدمة</h2><p>ترتبط بهذه المهمة ولا تختلط بفواتير العميل.</p></div><Coins size={21} /></div>{rates.length ? <label>السعر المتفق عليه<select value={rateId} onChange={(event) => setRateId(event.target.value)}>{rates.map((item) => <option value={item.id} key={item.id}>{item.item_name}، {formatMoney(item.unit_price, item.currency)}</option>)}</select></label> : <><label>الخدمة<input name="item" required /></label><div className="field-row"><label>سعر القطعة<input name="price" type="number" min="0" step="0.01" required /></label><label>العملة<select name="currency"><option>SAR</option><option>USD</option><option>EUR</option></select></label></div></>}<div className="field-row"><label>الكمية<input name="quantity" type="number" min="1" defaultValue="1" required /></label><label>الاستحقاق<input name="due" type="date" /></label></div><label>ملاحظة<textarea name="notes" rows="2" /></label><button className="button ghost" type="submit">إرسال المطالبة</button></form>;
}

export function LiveCollaboratorPortal({ data, access, refresh, onToast }) {
  const [selectedId, setSelectedId] = useState(data.project_tasks?.[0]?.id || "");
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const tasks = data.project_tasks || [];
  const task = tasks.find((item) => item.id === selectedId) || tasks[0];
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  if (!task) return <div className="portal-shell"><EmptyState icon={UserFocus} title="لا توجد مهمة مسندة" body="ستظهر هنا المهمة فور إسنادها من الإدارة." /></div>;
  const project = projects[task.project_id];
  const changeStatus = async (status) => { try { await workflow.updateTaskStatus(task.id, status); onToast("تم تحديث حالة المهمة"); await refresh(); } catch (error) { onToast(error.message); } };
  const submitProof = async () => {
    if (!file) { onToast("اختر ملف البروفة أولاً"); return; }
    try {
      await uploadProjectFile({ workspaceId: access.workspaceId, projectId: task.project_id, file, category: "proof" });
      await workflow.submitProof({ projectId: task.project_id, taskId: task.id, title: file.name, note, sendToClient: false });
      setFile(null); setNote("");
      onToast("تم رفع البروفة وإرسالها للمراجعة الداخلية");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <div className="portal-shell live-portal"><header className="live-portal-head"><div><small>مساحة المتعاون</small><h1>{task.title}</h1><p>{project?.name || "مشروع"}</p></div>{tasks.length > 1 && <select value={task.id} onChange={(event) => setSelectedId(event.target.value)}>{tasks.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select>}<LiveStatus value={task.status} /></header><section className="live-portal-layout"><main><div className="live-client-action"><UserFocus size={31} /><span>المهمة المسندة</span><h2>{task.title}</h2><p>{task.description || "نفذ المخرج حسب البريف وملفات المصدر."}</p><div className="live-facts"><span><small>الأولوية</small><strong>{task.priority}</strong></span><span><small>الاستحقاق</small><strong>{displayDate(task.due_date)}</strong></span></div>{task.status === "todo" && <button className="button primary" onClick={() => changeStatus("in_progress")}>بدء التنفيذ</button>}{["in_progress", "changes_requested"].includes(task.status) && <div className="live-proof-upload"><label>ملف البروفة<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><label>ملاحظة التسليم<textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} /></label><button className="button primary" onClick={submitProof}><FileArrowUp size={18} /> رفع وإرسال البروفة</button></div>}</div></main><aside><section className="panel"><h2>ما تراه فقط</h2><p>المهمة وملفاتها والبريف المرتبط. حسابات العميل وبقية المشاريع محجوبة.</p><div className="live-facts"><span><small>مطالباتك</small><strong>{data.collaborator_claims?.length || 0}</strong></span><span><small>أسعارك</small><strong>{data.collaborator_rates?.length || 0}</strong></span></div></section><CollaboratorClaimForm task={task} data={data} access={access} refresh={refresh} onToast={onToast} /></aside></section></div>;
}

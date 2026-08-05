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
  creative_development: "تطوير الفكرة",
  direction_ready: "اتجاه مثبت",
  owner_production: "ينفذه عبد الوهاب",
  dispatched: "تم توجيهه",
  sent: "مرسل",
  in_progress: "قيد التنفيذ",
  internal_review: "جاهزة لمراجعتك",
  owner_approved: "معتمد داخلياً",
  client_review: "لدى العميل",
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
const priorityLabels = { low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة" };

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
  return <div className="modal-layer print-layer" onMouseDown={onClose}><section className="modal-panel wide print-modal" onMouseDown={(event) => event.stopPropagation()}><div className="print-actions"><div><small>معاينة المستند الكامل</small><strong>{labels[kind]}، {record.reference}</strong></div><span><button className="button ghost" onClick={onClose}>إغلاق</button><button className="button primary" onClick={() => window.print()}><Printer size={18} /> طباعة أو حفظ PDF</button></span></div><article className="print-document"><header><div className="print-brand">U89<span>استوديو العلامة</span></div><div><small>{labels[kind]}</small><strong>{record.reference}</strong><time>{displayDate(record.created_at)}</time></div></header><section className="print-parties"><div><small>مقدم الخدمة</small><strong>{settings?.owner_name_ar || "عبد الوهاب بن سليمان السويد"}</strong><span>{settings?.email}</span><span>{settings?.phone}</span></div><div><small>{kind === "claim" ? "مقدم الخدمة المتعاون" : "العميل"}</small><strong>{kind === "claim" ? record.collaborator_name : client?.company_name || "يحدد من ملف العميل"}</strong><span>{kind === "claim" ? record.item_name : client?.contact_name}</span><span>{kind === "claim" ? "" : client?.email}</span></div></section><section className="print-subject"><small>المشروع</small><h1>{project?.name || record.item_name || "خدمة إبداعية"}</h1>{scope && <p>{scope}</p>}</section>{kind === "quote" && <><section className="print-columns"><div><small>المخرجات المشمولة</small>{listValue(record.deliverables).map((item) => <p key={item}>{item}</p>)}</div><div><small>غير المشمول</small>{listValue(record.exclusions).length ? listValue(record.exclusions).map((item) => <p key={item}>{item}</p>) : <p>لا توجد استثناءات إضافية مثبتة.</p>}</div></section><section className="print-terms"><h2>المدة والتعديلات</h2><p>البروفة الأولى خلال {record.first_proof_days} يوم عمل، والتعديل خلال {record.revision_days} أيام عمل.</p><p>عدد جولات التعديل: {record.revision_rounds ?? "يحدد في النسخة النهائية"}.</p><p>صلاحية العرض {record.validity_days} أيام من تاريخ الإصدار.</p><p>قبول العرض ينشئ عقداً مستقلاً، ولا يبدأ التنفيذ قبل توقيع العقد وتسجيل الدفعة الأولى.</p></section></>}{kind === "contract" && <><section className="print-columns"><div><small>المخرجات الملزمة</small>{listValue(record.body?.deliverables).map((item) => <p key={item}>{item}</p>)}</div><div><small>الاستثناءات</small>{listValue(record.body?.exclusions).length ? listValue(record.body?.exclusions).map((item) => <p key={item}>{item}</p>) : <p>لا توجد استثناءات إضافية.</p>}</div></section><section className="print-terms"><h2>بنود العقد</h2>{terms.map((term, index) => <p key={`${index}-${term}`}><b>{index + 1}.</b> {term}</p>)}<div className="print-signatures"><span><small>مقدم الخدمة</small><strong>{record.owner_signed_at ? "وقع إلكترونياً" : "بانتظار التوقيع"}</strong><time>{displayDate(record.owner_signed_at)}</time></span><span><small>العميل</small><strong>{record.client_signer_name || "بانتظار التوقيع"}</strong><time>{displayDate(record.client_signed_at)}</time></span></div></section></>}{kind === "invoice" && <section className="print-terms"><h2>تفاصيل الاستحقاق</h2><p>البيان: {record.installment_label}</p><p>رقم الدفعة: {record.installment_number}</p><p>تاريخ الاستحقاق: {displayDate(record.due_date)}</p><p>الحالة: {displayStatus(record.status)}</p>{record.payment_reference && <p>مرجع السداد: {record.payment_reference}</p>}</section>}{kind === "claim" && <section className="print-columns"><div><small>القطعة أو الخدمة</small><p>{record.item_name}</p><p>الكمية: {record.quantity}</p></div><div><small>سعر الوحدة</small><p>{formatMoney(record.unit_price, record.currency)}</p><p>الحالة: {displayStatus(record.status)}</p></div></section>}<section className="print-total"><span>الإجمالي</span><strong>{formatMoney(amount, currency)}</strong>{paymentPlan.length > 0 && <div>{paymentPlan.map((value, index) => <span key={index}>الدفعة {index + 1}: {value}%</span>)}</div>}</section><footer><span>{kind === "invoice" ? "فاتورة عادية غير ضريبية، وليست فاتورة ضريبية" : "مستند صادر من U89 Studio OS"}</span><span>{settings?.bank_name ? `بيانات التحويل محفوظة في مساحة العميل، ${settings.bank_name}` : ""}</span></footer></article></section></div>;
}

function LiveOverview({ data, setSection }) {
  const pendingRequest = data.service_requests?.find((item) => ["new", "needs_info"].includes(item.status));
  const submittedBrief = data.briefs?.find((item) => item.status === "submitted");
  const draftQuote = data.quotes?.find((item) => item.status === "draft");
  const pendingWorkProof = data.work_orders?.find((item) => item.status === "internal_review");
  const draftWorkOrder = data.work_orders?.find((item) => item.status === "draft");
  const unpaidInvoice = data.invoices?.find((item) => ["issued", "overdue"].includes(item.status));
  const next = pendingRequest
    ? { title: `راجع طلب ${pendingRequest.project_name}`, body: "اقبل الطلب بعد التحقق من الخدمة والموعد، وسيُنشأ البريف تلقائياً.", section: "requests" }
    : submittedBrief
      ? { title: "راجع البريف الجاهز", body: "اعتماده يفتح عرض السعر ويغلق احتمال التسعير قبل وضوح النطاق.", section: "briefs" }
      : draftQuote
        ? { title: "أكمل عرض السعر", body: "حدد القيمة والنطاق وخطة الدفعات ثم أرسله للعميل.", section: "documents" }
        : pendingWorkProof
          ? { title: `راجع بروفة ${pendingWorkProof.title}`, body: pendingWorkProof.execution_mode === "owner_led" ? "راجع عملك بعين المدير الإبداعي، ثم طوّره أو اعتمد إرساله للعميل." : "راجع التنفيذ المفوض تحت اتجاهك، ثم اعتمده أو أرسل ملاحظة إنتاجية محددة.", section: "work-orders" }
          : draftWorkOrder
            ? { title: `واصل بناء ${draftWorkOrder.title}`, body: "ثبت الفكرة ومنطقها أولاً، ثم نفذها بنفسك أو فوض جزءاً إنتاجياً عند الحاجة.", section: "work-orders" }
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
    <section className="metrics-row live-metrics"><div><Briefcase size={22} /><span>أعمال إبداعية نشطة<strong>{(data.work_orders || []).filter((item) => !["draft", "completed", "cancelled"].includes(item.status)).length}</strong></span></div><div><Tray size={22} /><span>طلبات جديدة<strong>{(data.service_requests || []).filter((item) => item.status === "new").length}</strong></span></div><div><List size={22} /><span>قرارات بروفات<strong>{(data.work_orders || []).filter((item) => item.status === "internal_review").length}</strong></span></div><div><Receipt size={22} /><span>فواتير مستحقة<strong>{dueInvoices.length}</strong></span></div></section>
    <section className="panel live-activity-panel"><div className="panel-heading"><div><h2>آخر الحركة</h2><p>سجل تدقيق مشترك لكل ما تغير داخل المشاريع.</p></div></div>{data.activity_events?.length ? <div className="live-activity-list">{data.activity_events.slice(0, 8).map((event) => <article key={event.id}><CheckCircle size={18} weight="fill" /><div><strong>{event.label}</strong><small>{event.actor_label}، {displayDate(event.created_at)}</small></div></article>)}</div> : <EmptyState icon={Clock} title="لم تبدأ الحركة بعد" body="يظهر هنا أول طلب أو اعتماد أو دفعة مسجلة." />}</section>
  </div>;
}

function LiveRequests({ data, refresh, onToast, access, setSection }) {
  const [busy, setBusy] = useState("");
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
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
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>طلبات العملاء</h1><p>طلبات المشاريع الجديدة والطلبات الدورية في طابور واحد واضح.</p></div></div>
    <section className="panel live-list-panel"><div className="panel-heading"><div><h2>طلبات المشاريع</h2><p>يُنشأ المشروع والبريف فقط بعد قبولك.</p></div><span>{data.service_requests?.length || 0}</span></div>{data.service_requests?.length ? <div className="live-entity-list">{data.service_requests.map((request) => { const client = clients[request.client_id]; return <article key={request.id}><EntityHeader icon={Tray} title={request.project_name} meta={`${request.reference}، ${client?.company_name || "عميل"}`} status={request.status} /><div className="live-facts"><span><small>الخدمة</small><strong>{request.service_name}</strong></span><span><small>التواصل</small><strong>{client?.preferred_contact || "غير محدد"}</strong></span><span><small>الميزانية</small><strong>{request.budget || "غير محددة"}</strong></span><span><small>الموعد</small><strong>{displayDate(request.requested_deadline)}</strong></span></div>{request.goal && <p className="live-entity-note">{request.goal}</p>}{["new", "needs_info"].includes(request.status) && <button className="button primary small" disabled={busy === request.id} onClick={() => accept(request)}>{busy === request.id ? <CircleNotch size={17} className="spin" /> : <Check size={17} />} قبول وإرسال البريف</button>}</article>; })}</div> : <EmptyState icon={Tray} title="لا توجد طلبات جديدة" body="سيظهر هنا أول طلب يصل من نموذج الموقع العام." />}</section>
    <section className="panel live-list-panel"><div className="panel-heading"><div><h2>طلبات العقود التسويقية</h2><p>تبقى في طابورك حتى تفتح لها مساحة إبداعية وتبدأ أنت ببناء الفكرة. لا تنتقل تلقائياً إلى أي متعاون.</p></div><span>{data.retainer_requests?.length || 0}</span></div>{data.retainer_requests?.length ? <div className="live-entity-list compact">{data.retainer_requests.map((request) => <article key={request.id}><EntityHeader icon={Handshake} title={request.title} meta={`${request.reference}، ${request.request_type}`} status={request.status} /><p className="live-entity-note">{request.brief}</p><div className="live-actions"><span className="form-note"><LockKey size={17} /> لم يبدأ العمل الإبداعي بعد</span><button className="button primary small" onClick={() => setSection("work-orders")}><ArrowLeft size={16} /> فتح مساحة إبداعية للطلب</button></div></article>)}</div> : <EmptyState icon={Handshake} title="لا توجد طلبات دورية" body="يستطيع عميل العقد النشط إرسال طلباته من بوابته." />}</section>
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

function AssigneeChecks({ people, selected, onChange }) {
  const toggle = (userId) => onChange(selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId]);
  return <div className="work-order-assignee-checks">{people.map((person) => <label className={selected.includes(person.user_id) ? "selected" : ""} key={person.user_id}><input type="checkbox" checked={selected.includes(person.user_id)} onChange={() => toggle(person.user_id)} /><span>{person.display_name.slice(0, 1)}</span><b>{person.display_name}</b><small>{person.role === "manager" ? "مدير" : "متعاون"}</small></label>)}</div>;
}

function CreateWorkOrderForm({ data, refresh, onToast, onCreated }) {
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const order = await workflow.createWorkOrder({
        projectId: values.projectId,
        title: values.title,
        description: values.description,
        creativeCore: values.creativeCore || null,
        creativeRationale: values.creativeRationale || null,
        creativeNotes: values.creativeNotes || null,
        executionMode: values.executionMode,
        priority: values.priority,
        dueDate: values.due || null,
        requiresClientApproval: values.clientApproval === "on",
        assigneeUserIds: [],
        sourceRetainerRequestId: values.retainerRequestId || null,
      });
      event.currentTarget.reset();
      setProjectId("");
      onToast("فُتحت مساحة إبداعية خاصة بك. لا يرى المتعاونون أي شيء منها");
      await refresh();
      onCreated(order.id);
    } catch (error) { onToast(error.message); } finally { setBusy(false); }
  };
  const matchingRetainerRequests = (data.retainer_requests || []).filter((item) => item.project_id === projectId && !["done", "cancelled"].includes(item.status));
  return <form className="panel work-order-create creative-space-create" onSubmit={submit}><div className="work-order-form-intro"><span><Plus size={20} /></span><div><h2>افتح مساحة للفكرة قبل التنفيذ</h2><p>الافتراضي أن يقود عبد الوهاب الفكرة وينفذها. اختيار المتعاون يأتي لاحقاً بعد وضوح الاتجاه.</p></div></div><div className="field-row"><label>المشروع<select name="projectId" required value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="" disabled>اختر المشروع</option>{(data.projects || []).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label>عنوان المساحة<input name="title" required placeholder="مثال: فكرة الهوية والاتجاه البصري" /></label></div><label>السؤال أو المخرج الإبداعي<textarea name="description" rows="4" required placeholder="ما المشكلة التي ستحلها؟ وما النتيجة التي تريد الوصول إليها؟" /></label><div className="field-row"><label>بذرة الفكرة، اختيارية<textarea name="creativeCore" rows="3" placeholder="الجملة أو المعنى الذي تريد اختباره" /></label><label>ملاحظات عبد الوهاب<textarea name="creativeNotes" rows="3" placeholder="مشاهدات، احتمالات، وما يحتاج بحثاً" /></label></div><label>منطق الفكرة، يمكن استكماله لاحقاً<textarea name="creativeRationale" rows="3" placeholder="لماذا يمكن أن تكون هذه الفكرة مناسبة للعميل والجمهور؟" /></label><label>نمط التنفيذ الافتراضي<select name="executionMode" defaultValue="owner_led"><option value="owner_led">عبد الوهاب يقود وينفذ</option><option value="delegated">عبد الوهاب يبني الاتجاه ثم يفوض جزءاً إنتاجياً</option><option value="collaborative">عبد الوهاب يقود ويشارك متعاوناً في التنفيذ</option></select></label><div className="field-row"><label>الأولوية<select name="priority" defaultValue="normal"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label><label>موعد عبد الوهاب الداخلي<input name="due" type="date" /></label></div>{matchingRetainerRequests.length > 0 && <label>ربط طلب العقد بهذه المساحة، اختياري<select name="retainerRequestId" defaultValue=""><option value="">بدون ربط</option>{matchingRetainerRequests.map((item) => <option value={item.id} key={item.id}>{item.reference}، {item.title}</option>)}</select></label>}<label className="work-order-client-toggle"><input type="checkbox" name="clientApproval" /><span><strong>تصل النتيجة إلى العميل بعد قرار عبد الوهاب</strong><small>لا يرسل النظام أي بروفة تلقائياً.</small></span></label><button className="button primary" type="submit" disabled={busy}>{busy ? <CircleNotch size={18} className="spin" /> : <Plus size={18} />} فتح المساحة الخاصة</button></form>;
}

function WorkOrderFiles({ files, onOpen }) {
  if (!files.length) return <p className="work-order-empty-line">لا توجد ملفات في هذه الغرفة بعد.</p>;
  return <div className="work-order-file-list">{files.map((file) => <button type="button" key={file.id} onClick={() => onOpen(file)}><FileText size={19} /><span><strong>{file.file_name}</strong><small>{file.category === "proof" ? "بروفة" : "ملف توجيه أو مصدر"}</small></span><ArrowLeft size={16} /></button>)}</div>;
}

function WorkOrderMessages({ messages, currentUserId }) {
  if (!messages.length) return <div className="work-order-thread-empty"><Bell size={24} /><p>تبدأ المحادثة عند إرسال أول ملاحظة داخل هذا الطلب.</p></div>;
  return <div className="work-order-thread">{messages.map((message) => <article className={`${message.author_user_id === currentUserId ? "mine" : ""} ${message.message_type}`} key={message.id}><header><strong>{message.author_label}</strong><time>{displayDate(message.created_at)}</time></header><p>{message.body}</p></article>)}</div>;
}

function LegacyWorkOrderRoom({ order, data, access, refresh, onToast }) {
  const [description, setDescription] = useState(order.description || "");
  const [recommendations, setRecommendations] = useState(order.owner_recommendations || "");
  const [creativeCore, setCreativeCore] = useState(order.creative_core || "");
  const [creativeRationale, setCreativeRationale] = useState(order.creative_rationale || "");
  const [creativeNotes, setCreativeNotes] = useState(order.creative_notes || "");
  const [delegationScope, setDelegationScope] = useState(order.delegation_scope || "");
  const [executionMode, setExecutionMode] = useState(order.execution_mode || "owner_led");
  const [priority, setPriority] = useState(order.priority || "normal");
  const [dueDate, setDueDate] = useState(order.due_date || "");
  const [requiresClientApproval, setRequiresClientApproval] = useState(Boolean(order.requires_client_approval));
  const [assignees, setAssignees] = useState((data.work_order_assignees || []).filter((item) => item.work_order_id === order.id).map((item) => item.user_id));
  const [message, setMessage] = useState("");
  const [messageFile, setMessageFile] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [ownerProofFile, setOwnerProofFile] = useState(null);
  const [ownerProofNote, setOwnerProofNote] = useState("");
  const [busy, setBusy] = useState("");
  const project = (data.projects || []).find((item) => item.id === order.project_id);
  const people = (data.memberships || []).filter((item) => ["manager", "collaborator"].includes(item.role) && item.status === "active");
  const assignedRows = (data.work_order_assignees || []).filter((item) => item.work_order_id === order.id);
  const files = (data.project_files || []).filter((item) => item.work_order_id === order.id);
  const messages = (data.work_order_messages || []).filter((item) => item.work_order_id === order.id).slice().reverse();
  const proof = (data.proofs || []).find((item) => item.work_order_id === order.id && item.status !== "superseded");
  const proofFiles = proof ? files.filter((item) => item.proof_id === proof.id) : [];
  const creativePatch = { description, owner_recommendations: recommendations || null, creative_core: creativeCore || null, creative_rationale: creativeRationale || null, creative_notes: creativeNotes || null, delegation_scope: delegationScope || null, execution_mode: executionMode, priority, due_date: dueDate || null, requires_client_approval: requiresClientApproval };
  const openFile = async (file) => { try { window.open(await createSignedProjectFileUrl(file.storage_path), "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); } };
  const saveDraft = async () => {
    setBusy("save");
    try {
      await updateRecord("work_orders", order.id, creativePatch, access.workspaceId);
      await workflow.saveWorkOrderAssignees(order.id, assignees);
      onToast("حفظت الفكرة والاتجاه وملاحظاتك الخاصة");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const advanceOwner = async (status) => {
    if (["direction_ready", "owner_production"].includes(status) && (!creativeCore.trim() || !creativeRationale.trim())) { onToast("ثبت الفكرة المركزية ومنطقها أولاً"); return; }
    setBusy(status);
    try {
      await updateRecord("work_orders", order.id, creativePatch, access.workspaceId);
      await workflow.saveWorkOrderAssignees(order.id, assignees);
      await workflow.advanceOwnerWorkOrder(order.id, status);
      onToast(status === "creative_development" ? "بدأت تطوير الفكرة داخل مساحتك" : status === "direction_ready" ? "ثبت الاتجاه الإبداعي" : "انتقلت إلى التنفيذ بقيادتك وتصميمك");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const dispatch = async () => {
    setBusy("dispatch");
    try {
      await updateRecord("work_orders", order.id, creativePatch, access.workspaceId);
      await workflow.saveWorkOrderAssignees(order.id, assignees);
      await workflow.dispatchWorkOrder(order.id);
      onToast("أرسلت الجزء الإنتاجي المحدد فقط، وبقيت القيادة الإبداعية لديك");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const submitOwnerProof = async () => {
    if (!ownerProofFile) { onToast("اختر ملف البروفة أولاً"); return; }
    setBusy("owner-proof");
    try {
      await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file: ownerProofFile, category: "proof" });
      await workflow.submitOwnerWorkOrderProof(order.id, ownerProofFile.name, ownerProofNote || null);
      setOwnerProofFile(null); setOwnerProofNote("");
      onToast("حفظت بروفتك في بوابة القرار قبل مشاركتها مع العميل");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const uploadSource = async (file) => {
    if (!file) return;
    setBusy("upload");
    try { await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file, category: "source" }); onToast("تم إرفاق الملف داخل طلب العمل"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const postMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() && !messageFile) return;
    setBusy("message");
    try {
      if (messageFile) await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file: messageFile, category: "source" });
      await workflow.postWorkOrderMessage(order.id, message.trim() || `أرفقت ملف ${messageFile.name}`);
      setMessage(""); setMessageFile(null);
      onToast("وصلت الرسالة إلى غرفة الطلب");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const review = async (decision, sendToClient = false) => {
    if (decision === "changes_requested" && !reviewNote.trim()) { onToast("اكتب ملاحظة تعديل واضحة أولاً"); return; }
    setBusy(decision);
    try {
      await workflow.reviewWorkOrderProof(proof.id, decision, reviewNote || null, sendToClient);
      setReviewNote("");
      onToast(decision === "changes_requested" ? "أرسلت ملاحظاتك للمتعاون داخل الغرفة" : sendToClient ? "اعتمدت البروفة وأرسلتها للعميل" : "اعتمدت البروفة وأغلقت طلب العمل");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };

  return <section className="panel work-order-room"><header className="work-order-room-head"><div><span>{order.reference}، {project?.name || "مشروع"}</span><h2>{order.title}</h2></div><LiveStatus value={order.status} /></header>{order.status === "draft" ? <div className="work-order-draft-editor"><div className="work-order-private-note"><LockKey size={19} /><p><strong>مسودة خاصة بك.</strong> لا يراها أي متعاون قبل الإرسال الصريح.</p></div><label>تفاصيل المطلوب<textarea rows="5" value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>توصياتك وأفكارك<textarea rows="4" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} /></label><div className="field-row"><label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label><label>الموعد الداخلي<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><div className="work-order-form-section"><div><strong>المتعاونون</strong><small>غيّر التوزيع قبل الإرسال.</small></div><AssigneeChecks people={people} selected={assignees} onChange={setAssignees} /></div><label className="work-order-client-toggle"><input type="checkbox" checked={requiresClientApproval} onChange={(event) => setRequiresClientApproval(event.target.checked)} /><span><strong>يحتاج اعتماد العميل بعد اعتمادك</strong><small>يبقى قرار الإرسال للعميل بيدك.</small></span></label><div className="live-actions"><button className="button ghost" disabled={Boolean(busy)} onClick={saveDraft}>حفظ المسودة</button><button className="button primary" disabled={Boolean(busy) || !assignees.length || !description.trim()} onClick={dispatch}><PaperPlaneTilt size={18} /> إرسال للمتعاونين</button></div></div> : <><section className="work-order-brief-block"><small>المطلوب</small><p>{order.description}</p>{order.owner_recommendations && <blockquote><strong>توصيات عبد الوهاب</strong>{order.owner_recommendations}</blockquote>}<div className="work-order-meta"><span><small>الأولوية</small><strong>{priorityLabels[order.priority]}</strong></span><span><small>موعدك الداخلي</small><strong>{displayDate(order.due_date)}</strong></span><span><small>الفريق</small><strong>{assignedRows.map((item) => item.role_label || "متعاون").join("، ")}</strong></span></div></section>{proof?.status === "internal_review" && <section className="work-order-proof-gate"><div><span>قرارك مطلوب</span><h3>{proof.title}</h3><p>{proof.note || "رفع المتعاون بروفة جديدة. افتح الملف ثم سجل قرارك."}</p></div><WorkOrderFiles files={proofFiles} onOpen={openFile} /><label>قرار أو ملاحظة<textarea rows="3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="اكتب سبب التعديل أو ملاحظة الاعتماد" /></label><div className="live-actions"><button className="button ghost" disabled={Boolean(busy)} onClick={() => review("changes_requested")}><X size={17} /> طلب تعديل</button><button className="button primary" disabled={Boolean(busy) || !proofFiles.length} onClick={() => review("approved", false)}><Check size={17} /> اعتماد وإنهاء الطلب</button>{order.requires_client_approval && <button className="button primary secondary-action" disabled={Boolean(busy) || !proofFiles.length} onClick={() => review("approved", true)}><PaperPlaneTilt size={17} /> اعتماد وإرسال للعميل</button>}</div></section>}</> }<section className="work-order-room-columns"><div><div className="work-order-section-title"><div><h3>الملفات</h3><p>المصادر والبروفات الخاصة بهذا الطلب فقط.</p></div><label className="button ghost small upload-button">إرفاق ملف <FileArrowUp size={16} /><input type="file" onChange={(event) => { uploadSource(event.target.files?.[0]); event.target.value = ""; }} /></label></div><WorkOrderFiles files={files} onOpen={openFile} /></div><div><div className="work-order-section-title"><div><h3>النقاش</h3><p>كل قرار وملاحظة محفوظان مع الطلب.</p></div></div><WorkOrderMessages messages={messages} currentUserId={access.user.id} /><form className="work-order-composer" onSubmit={postMessage}><textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب توجيهاً أو رداً محدداً" /><div><label className="text-link">إرفاق<input type="file" onChange={(event) => setMessageFile(event.target.files?.[0] || null)} /></label>{messageFile && <small>{messageFile.name}</small>}<button className="button primary small" type="submit" disabled={busy === "message" || (!message.trim() && !messageFile)}>إرسال <PaperPlaneTilt size={16} /></button></div></form></div></section></section>;
}

function CreativeDirectionCanvas({ core, rationale, notes, stage, editable, onCore, onRationale, onNotes }) {
  const complete = Boolean(core.trim() && rationale.trim());
  return <section className={`creative-direction-canvas ${complete ? "complete" : ""}`}><header><div><small>لوحة الاتجاه الإبداعي</small><h3>الفكرة قبل التنفيذ</h3></div><span>{complete ? "اتجاه واضح" : "قيد البناء"}</span></header><div className="creative-canvas-grid"><label>الفكرة المركزية<textarea rows="4" value={core} readOnly={!editable} onChange={(event) => onCore(event.target.value)} placeholder="ما الجملة أو المعنى الذي يقود العلامة؟" /></label><label>لماذا هذه الفكرة؟<textarea rows="4" value={rationale} readOnly={!editable} onChange={(event) => onRationale(event.target.value)} placeholder="اربط الفكرة بالجمهور والسوق والشخصية والقرار البصري" /></label><label className="wide">دفتر عبد الوهاب<textarea rows="4" value={notes} readOnly={!editable} onChange={(event) => onNotes(event.target.value)} placeholder="مشاهداتك، الاحتمالات، ما جربته، وما تريد العودة إليه" /></label></div><div className="creative-stage-track"><span className="active">بحث وفهم</span><span className={["concept", "direction", "production"].includes(stage) ? "active" : ""}>فكرة</span><span className={["direction", "production"].includes(stage) ? "active" : ""}>اتجاه</span><span className={stage === "production" ? "active" : ""}>تنفيذ</span></div></section>;
}

function WorkOrderRoom({ order, data, access, refresh, onToast }) {
  const [description, setDescription] = useState(order.description || "");
  const [recommendations, setRecommendations] = useState(order.owner_recommendations || "");
  const [creativeCore, setCreativeCore] = useState(order.creative_core || "");
  const [creativeRationale, setCreativeRationale] = useState(order.creative_rationale || "");
  const [creativeNotes, setCreativeNotes] = useState(order.creative_notes || "");
  const [delegationScope, setDelegationScope] = useState(order.delegation_scope || "");
  const [executionMode, setExecutionMode] = useState(order.execution_mode || "owner_led");
  const [priority, setPriority] = useState(order.priority || "normal");
  const [dueDate, setDueDate] = useState(order.due_date || "");
  const [requiresClientApproval, setRequiresClientApproval] = useState(Boolean(order.requires_client_approval));
  const [assignees, setAssignees] = useState((data.work_order_assignees || []).filter((item) => item.work_order_id === order.id).map((item) => item.user_id));
  const [message, setMessage] = useState("");
  const [messageFile, setMessageFile] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [ownerProofFile, setOwnerProofFile] = useState(null);
  const [ownerProofNote, setOwnerProofNote] = useState("");
  const [busy, setBusy] = useState("");
  const project = (data.projects || []).find((item) => item.id === order.project_id);
  const people = (data.memberships || []).filter((item) => ["manager", "collaborator"].includes(item.role) && item.status === "active");
  const assignedRows = (data.work_order_assignees || []).filter((item) => item.work_order_id === order.id);
  const files = (data.project_files || []).filter((item) => item.work_order_id === order.id);
  const messages = (data.work_order_messages || []).filter((item) => item.work_order_id === order.id).slice().reverse();
  const proof = (data.proofs || []).find((item) => item.work_order_id === order.id && item.status !== "superseded");
  const proofFiles = proof ? files.filter((item) => item.proof_id === proof.id) : [];
  const editable = ["draft", "creative_development", "direction_ready", "owner_production"].includes(order.status);
  const executionPlanLocked = ["internal_review", "client_review", "completed"].includes(order.status);
  const isOwnerExecution = executionMode === "owner_led" && !order.dispatched_at;
  const ownerAuthoredProof = proof?.submitted_by === access.user.id || isOwnerExecution;
  const modeLabels = { owner_led: "عبد الوهاب يقود وينفذ", delegated: "عبد الوهاب يقود ويفوض الإنتاج", collaborative: "قيادة عبد الوهاب مع تنفيذ مشترك" };
  const patch = { description, owner_recommendations: recommendations || null, creative_core: creativeCore || null, creative_rationale: creativeRationale || null, creative_notes: creativeNotes || null, delegation_scope: delegationScope || null, execution_mode: executionMode, priority, due_date: dueDate || null, requires_client_approval: requiresClientApproval };
  const openFile = async (file) => { try { window.open(await createSignedProjectFileUrl(file.storage_path), "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); } };
  const persist = async () => {
    await updateRecord("work_orders", order.id, patch, access.workspaceId);
    // A proof returned to the owner is already past the delegation gate.
    // Keep the creative fields editable without reopening team assignment.
    if (order.status !== "changes_requested") await workflow.saveWorkOrderAssignees(order.id, assignees);
  };
  const chooseExecutionMode = (mode) => {
    setExecutionMode(mode);
    if (mode === "owner_led") { setAssignees([]); setDelegationScope(""); }
    onToast(mode === "owner_led" ? "سيبقى التنفيذ بيد عبد الوهاب" : mode === "delegated" ? "حفظت نية تفويض جزء إنتاجي. لن يصل شيء للمتعاون قبل تثبيت الاتجاه والإرسال الصريح" : "حفظت خطة التنفيذ المشترك بقيادة عبد الوهاب");
  };
  const save = async () => {
    setBusy("save");
    try { await persist(); onToast("حفظت الفكرة والاتجاه وملاحظاتك الخاصة"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const advance = async (status) => {
    if (["direction_ready", "owner_production"].includes(status) && (!creativeCore.trim() || !creativeRationale.trim())) { onToast("ثبت الفكرة المركزية ومنطقها أولاً"); return; }
    setBusy(status);
    try { await persist(); await workflow.advanceOwnerWorkOrder(order.id, status); onToast(status === "creative_development" ? "بدأت تطوير الفكرة داخل مساحتك" : status === "direction_ready" ? "ثبت الاتجاه الإبداعي" : "انتقلت إلى التنفيذ بقيادتك وتصميمك"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const dispatch = async () => {
    if (!assignees.length) { onToast("اختر منفذاً واحداً على الأقل"); return; }
    if (!delegationScope.trim()) { onToast("حدد نطاق التفويض الإنتاجي أولاً"); return; }
    setBusy("dispatch");
    try { await persist(); await workflow.dispatchWorkOrder(order.id); onToast("أرسلت الجزء الإنتاجي المحدد فقط، وبقيت القيادة الإبداعية لديك"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const uploadSource = async (file) => {
    if (!file) return;
    setBusy("upload");
    try { await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file, category: "source" }); onToast("أضفت الملف إلى مساحة العمل الإبداعية"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const postMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() && !messageFile) return;
    setBusy("message");
    try { if (messageFile) await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file: messageFile, category: "source" }); await workflow.postWorkOrderMessage(order.id, message.trim() || `أرفقت ملف ${messageFile.name}`); setMessage(""); setMessageFile(null); onToast("أضفت توجيهك إلى غرفة التنفيذ"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const submitOwnerProof = async () => {
    if (!ownerProofFile) { onToast("اختر ملف البروفة أولاً"); return; }
    setBusy("owner-proof");
    try { await uploadProjectFile({ workspaceId: access.workspaceId, projectId: order.project_id, workOrderId: order.id, file: ownerProofFile, category: "proof" }); await workflow.submitOwnerWorkOrderProof(order.id, ownerProofFile.name, ownerProofNote || null); setOwnerProofFile(null); setOwnerProofNote(""); onToast("حفظت بروفتك في بوابة القرار قبل مشاركتها مع العميل"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const review = async (decision, sendToClient = false) => {
    if (decision === "changes_requested" && !reviewNote.trim()) { onToast("اكتب ملاحظة واضحة أولاً"); return; }
    setBusy(decision);
    try { await workflow.reviewWorkOrderProof(proof.id, decision, reviewNote || null, sendToClient); setReviewNote(""); onToast(decision === "changes_requested" ? ownerAuthoredProof ? "أعدت البروفة لمساحة تنفيذك مع حفظ الملاحظة" : "أرسلت ملاحظتك للمنفذ" : sendToClient ? "اعتمدت العمل وأرسلته للعميل" : "اعتمدت العمل وأغلقته"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };

  return <section className="panel work-order-room creative-work-room"><header className="work-order-room-head"><div><span>{order.reference}، {project?.name || "مشروع"}</span><h2>{order.title}</h2><small>{modeLabels[executionMode]}</small></div><LiveStatus value={order.status} label={order.status === "owner_production" && executionMode !== "owner_led" ? "جاهز للتفويض" : undefined} /></header>{!order.dispatched_at && !["client_review", "completed"].includes(order.status) && <div className="work-order-private-note creative-owner-note"><LockKey size={19} /><p><strong>هذه مساحة عبد الوهاب الإبداعية.</strong> لا يرى المتعاون البحث أو الفكرة أو الملفات قبل تثبيت الاتجاه وتفويض نطاق إنتاجي محدد.</p></div>}
    {!order.dispatched_at && !["client_review", "completed"].includes(order.status) && <section className="creative-execution-planner"><header><div><small>خطة التنفيذ</small><h3>من سينفذ الاتجاه بعد بنائه؟</h3></div><span>لا يوجد إرسال تلقائي</span></header><div className="execution-mode-options"><button disabled={executionPlanLocked} className={executionMode === "owner_led" ? "active" : ""} onClick={() => chooseExecutionMode("owner_led")}><strong>ينفذه عبد الوهاب</strong><small>الفكرة والتصميم والتطبيقات بيده</small></button><button disabled={executionPlanLocked} className={executionMode === "delegated" ? "active" : ""} onClick={() => chooseExecutionMode("delegated")}><strong>تفويض جزء لمتعاون</strong><small>يبني عبد الوهاب الاتجاه ثم يحدد جزءاً إنتاجياً</small></button><button disabled={executionPlanLocked} className={executionMode === "collaborative" ? "active" : ""} onClick={() => chooseExecutionMode("collaborative")}><strong>تنفيذ مشترك</strong><small>قيادة عبد الوهاب مع مشاركة متعاون في الإنتاج</small></button></div>{executionPlanLocked && <div className="delegation-locked-note"><LockKey size={18} /><span><strong>الخطة مقفلة أثناء بوابة القرار.</strong> أعد البروفة إلى مساحة تنفيذك إذا أردت تغيير طريقة التنفيذ أو تفويض جزء منها.</span></div>}{!executionPlanLocked && executionMode !== "owner_led" && !["direction_ready", "owner_production"].includes(order.status) && <div className="delegation-locked-note"><LockKey size={18} /><span><strong>حفظنا قرار التفويض.</strong> بعد تثبيت الاتجاه سيفتح تحديد النطاق واختيار المتعاون وزر الإرسال.</span></div>}{!executionPlanLocked && executionMode !== "owner_led" && ["direction_ready", "owner_production"].includes(order.status) && <div className="delegation-ready-note"><CheckCircle size={18} weight="fill" /><span><strong>التفويض جاهز للإعداد.</strong> اكتب النطاق واختر المتعاون في القسم التالي.</span></div>}</section>}
    <CreativeDirectionCanvas core={creativeCore} rationale={creativeRationale} notes={creativeNotes} stage={order.creative_stage || "exploration"} editable={editable} onCore={setCreativeCore} onRationale={setCreativeRationale} onNotes={setCreativeNotes} />
    <section className="work-order-brief-block"><small>السؤال أو المخرج الإبداعي</small>{editable ? <textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} /> : <p>{order.description}</p>}{editable && <label>توجيه التنفيذ، عند الحاجة<textarea rows="3" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="ما الذي يجب الحفاظ عليه أو تجنبه أثناء الإنتاج؟" /></label>}<div className="work-order-meta"><span><small>الأولوية</small><strong>{priorityLabels[priority]}</strong></span><span><small>موعد عبد الوهاب</small><strong>{displayDate(dueDate)}</strong></span><span><small>القيادة الإبداعية</small><strong>عبد الوهاب السويد</strong></span></div></section>
    {editable && <div className="creative-settings-row"><label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label><label>الموعد الداخلي<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div>}
    {order.status === "draft" && <div className="creative-primary-actions"><button className="button ghost" disabled={Boolean(busy)} onClick={save}>حفظ المساحة</button><button className="button primary" disabled={Boolean(busy)} onClick={() => advance("creative_development")}><Target size={18} /> ابدأ تطوير الفكرة</button></div>}
    {order.status === "creative_development" && <div className="creative-primary-actions"><button className="button ghost" disabled={Boolean(busy)} onClick={save}>حفظ التطوير</button><button className="button primary" disabled={Boolean(busy)} onClick={() => advance("direction_ready")}><Check size={18} /> تثبيت الاتجاه الإبداعي</button></div>}
    {order.status === "direction_ready" && executionMode === "owner_led" && <section className="creative-execution-choice"><div><small>الخطوة التالية قرارك</small><h3>ابدأ تنفيذ الاتجاه بنفسك</h3><p>وإذا أردت التفويض، اختره من خطة التنفيذ الظاهرة أعلى العمل.</p></div><div><button className="button primary" disabled={Boolean(busy)} onClick={() => advance("owner_production")}>أكمل التصميم بنفسي</button><button className="button ghost" onClick={() => chooseExecutionMode("delegated")}>تفويض جزء لمتعاون</button></div></section>}
    {["direction_ready", "owner_production"].includes(order.status) && executionMode !== "owner_led" && <section className="creative-delegation-gate"><header><span>تفويض بعد الفكرة</span><h3>ما الذي سينفذه المتعاون تحت اتجاهك؟</h3></header><label>نطاق التفويض<textarea rows="4" value={delegationScope} onChange={(event) => setDelegationScope(event.target.value)} placeholder="حدد الجزء الإنتاجي فقط، وما الذي لا يحق تغييره في الفكرة والاتجاه" /></label><div className="work-order-form-section"><div><strong>اختر المنفذين</strong><small>يبقى عبد الوهاب صاحب الفكرة والقرار النهائي.</small></div><AssigneeChecks people={people} selected={assignees} onChange={setAssignees} /></div><button className="button primary" disabled={Boolean(busy) || !delegationScope.trim() || !assignees.length} onClick={dispatch}><PaperPlaneTilt size={18} /> إرسال الجزء الإنتاجي المحدد</button></section>}
    {order.status === "owner_production" && executionMode !== "delegated" && <section className="owner-proof-station"><div><span>عمل عبد الوهاب الإبداعي</span><h3>احفظ البروفة ثم مررها على بوابة قرارك</h3><p>توقف مقصود قبل أن يرى العميل النتيجة.</p></div><label>ملف البروفة<input type="file" onChange={(event) => setOwnerProofFile(event.target.files?.[0] || null)} /></label><label>ملاحظتك على البروفة<textarea rows="3" value={ownerProofNote} onChange={(event) => setOwnerProofNote(event.target.value)} /></label><button className="button primary" disabled={busy === "owner-proof" || !ownerProofFile} onClick={submitOwnerProof}><FileArrowUp size={18} /> حفظ في بوابة القرار</button></section>}
    {order.status === "changes_requested" && isOwnerExecution && <div className="creative-primary-actions"><button className="button primary" disabled={Boolean(busy)} onClick={() => advance("owner_production")}>العودة إلى تنفيذي الإبداعي</button></div>}
    {proof?.status === "internal_review" && <section className="work-order-proof-gate"><div><span>توقف المدير الإبداعي</span><h3>{proof.title}</h3><p>{proof.note || (ownerAuthoredProof ? "راجع عملك بعين المدير الإبداعي قبل عرضه." : "رفع المنفذ بروفة تحت اتجاهك.")}</p></div><WorkOrderFiles files={proofFiles} onOpen={openFile} /><label>ملاحظة القرار<textarea rows="3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="طورها أكثر، أو سجل سبب جاهزيتها" /></label><div className="live-actions"><button className="button ghost" disabled={Boolean(busy)} onClick={() => review("changes_requested")}><X size={17} /> {ownerAuthoredProof ? "إعادتها لتنفيذي" : "طلب تعديل من المنفذ"}</button><button className="button primary" disabled={Boolean(busy) || !proofFiles.length} onClick={() => review("approved", false)}><Check size={17} /> اعتماد وإنهاء العمل</button>{order.requires_client_approval && <button className="button primary secondary-action" disabled={Boolean(busy) || !proofFiles.length} onClick={() => review("approved", true)}><PaperPlaneTilt size={17} /> اعتماد وإرسال للعميل</button>}</div></section>}
    <section className="work-order-room-columns"><div><div className="work-order-section-title"><div><h3>المراجع والملفات</h3><p>بحث عبد الوهاب ومصادره وبروفات العمل.</p></div><label className="button ghost small upload-button">إرفاق ملف <FileArrowUp size={16} /><input type="file" onChange={(event) => { uploadSource(event.target.files?.[0]); event.target.value = ""; }} /></label></div><WorkOrderFiles files={files} onOpen={openFile} /></div>{order.dispatched_at ? <div><div className="work-order-section-title"><div><h3>غرفة التنفيذ</h3><p>عبد الوهاب يقود النقاش، والمتعاون ينفذ النطاق المحدد.</p></div></div><WorkOrderMessages messages={messages} currentUserId={access.user.id} /><form className="work-order-composer" onSubmit={postMessage}><textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب قراراً أو توجيهاً تنفيذياً" /><div><label className="text-link">إرفاق<input type="file" onChange={(event) => setMessageFile(event.target.files?.[0] || null)} /></label>{messageFile && <small>{messageFile.name}</small>}<button className="button primary small" type="submit" disabled={busy === "message" || (!message.trim() && !messageFile)}>إرسال <PaperPlaneTilt size={16} /></button></div></form></div> : <div className="creative-private-journal"><LockKey size={25} /><h3>لا توجد غرفة فريق</h3><p>هذا العمل ما زال بقيادة عبد الوهاب وتنفيذه. دفتره الإبداعي أعلاه خاص به.</p></div>}</section>
  </section>;
}

function LiveWorkOrders({ data, access, refresh, onToast }) {
  const [selectedId, setSelectedId] = useState(data.work_orders?.[0]?.id || "");
  const [creating, setCreating] = useState(!(data.work_orders || []).length);
  const orders = data.work_orders || [];
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  useEffect(() => { if (!orders.some((item) => item.id === selectedId) && orders[0]) setSelectedId(orders[0].id); }, [orders, selectedId]);
  const selected = orders.find((item) => item.id === selectedId);
  const waiting = orders.filter((item) => item.status === "internal_review").length;
  const ownerActive = orders.filter((item) => !item.dispatched_at && !["completed", "cancelled"].includes(item.status)).length;
  const delegated = orders.filter((item) => item.dispatched_at && !["completed", "cancelled"].includes(item.status)).length;
  return <div className="dashboard-content page-stack work-orders-page creative-lab-page"><div className="page-title"><div><span className="creative-director-kicker">مساحة عبد الوهاب الإبداعية</span><h1>المعمل الإبداعي</h1><p>هنا يبني عبد الوهاب الفكرة والاتجاه والتصميم. التفويض خيار لاحق لجزء إنتاجي محدد.</p></div><button className="button primary" onClick={() => setCreating((value) => !value)}><Plus size={18} /> مساحة إبداعية جديدة</button></div><section className="creative-lead-banner"><div><small>الدور الأساسي</small><strong>عبد الوهاب، المدير الإبداعي والمصمم</strong><p>الفكرة والاتجاه والقرار البصري تبدأ منه. النظام يحمي وقته ويوثق قراراته، ولا يحوله إلى موزع مهام.</p></div><div><span><b>01</b> أفهم وأبحث</span><span><b>02</b> أبني الفكرة</span><span><b>03</b> أصمم الاتجاه</span><span><b>04</b> أنفذ أو أفوض جزءاً</span></div></section><section className="work-order-kpis"><span><small>أعمال يقودها بنفسه</small><strong>{ownerActive}</strong></span><span><small>اتجاهات قيد البناء</small><strong>{orders.filter((item) => ["draft", "creative_development"].includes(item.status)).length}</strong></span><span><small>تنفيذ إنتاجي مفوض</small><strong>{delegated}</strong></span><span className={waiting ? "attention" : ""}><small>بوابات قرار</small><strong>{waiting}</strong></span></section>{creating && <CreateWorkOrderForm data={data} refresh={refresh} onToast={onToast} onCreated={(id) => { setSelectedId(id); setCreating(false); }} />}{orders.length ? <section className="work-order-command creative-work-command"><aside className="work-order-index"><header><strong>الأعمال الإبداعية</strong><small>{orders.length} مساحات عبر المشاريع</small></header>{orders.map((order) => { const assigned = (data.work_order_assignees || []).filter((item) => item.work_order_id === order.id); return <button className={selectedId === order.id ? "active" : ""} key={order.id} onClick={() => setSelectedId(order.id)}><span><small>{order.reference}</small><strong>{order.title}</strong><em>{projects[order.project_id]?.name || "مشروع"}</em></span><LiveStatus value={order.status} /><div>{!order.dispatched_at && <i className="owner-avatar">ع</i>}{assigned.slice(0, 3).map((item) => <i key={item.id}>{(item.role_label || "م").slice(0, 1)}</i>)}{assigned.length > 3 && <i>+{assigned.length - 3}</i>}</div></button>; })}</aside>{selected && <WorkOrderRoom key={selected.id} order={selected} data={data} access={access} refresh={refresh} onToast={onToast} />}</section> : !creating && <EmptyState icon={Target} title="افتح أول مساحة إبداعية" body="ابدأ بالسؤال والفكرة. لا تحتاج إلى اختيار متعاون حتى تقرر أنت أن جزءاً من التنفيذ يحتاج مساعدة." />}</div>;
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
  return <article className="live-document-card"><EntityHeader icon={FileText} title={`عرض ${project?.name || quote.reference}`} meta={quote.reference} status={quote.status} />{quote.status === "draft" ? <div className="live-document-form"><label>نطاق العمل<textarea rows="4" value={scope} onChange={(event) => setScope(event.target.value)} /></label><div className="field-row"><label>المخرجات، كل مخرج في سطر<textarea rows="4" value={deliverables} onChange={(event) => setDeliverables(event.target.value)} /></label><label>الاستثناءات، كل استثناء في سطر<textarea rows="4" value={exclusions} onChange={(event) => setExclusions(event.target.value)} /></label></div><div className="field-row"><label>القيمة<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>العملة<input value={quote.currency} disabled /></label></div><div className="field-row live-quote-timing"><label>جولات التعديل<input type="number" min="0" value={revisionRounds} onChange={(event) => setRevisionRounds(event.target.value)} /></label><label>البروفة الأولى<input type="number" min="1" value={firstProofDays} onChange={(event) => setFirstProofDays(event.target.value)} /></label><label>مدة التعديل<input type="number" min="1" value={revisionDays} onChange={(event) => setRevisionDays(event.target.value)} /></label><label>صلاحية العرض<input type="number" min="1" value={validityDays} onChange={(event) => setValidityDays(event.target.value)} /></label></div><div className="payment-editor">{paymentPlan.map((value, index) => <label key={index}>الدفعة {index + 1}<span><input type="number" min="0" max="100" value={value} onChange={(event) => updatePayment(index, event.target.value)} />%</span></label>)}</div><div className="live-actions"><button className="button ghost small" disabled={busy} onClick={() => save(false)}>حفظ</button><button className="button primary small" disabled={busy || paymentPlan.reduce((sum, item) => sum + Number(item), 0) !== 100 || Number(amount) <= 0} onClick={() => save(true)}><PaperPlaneTilt size={17} /> إرسال العرض</button></div></div> : <div className="live-facts"><span><small>الإجمالي</small><strong>{formatMoney(quote.total, quote.currency)}</strong></span><span><small>الصلاحية</small><strong>{displayDate(quote.valid_until)}</strong></span></div>}<button className="button primary small live-print-button" onClick={onPrint}><FileText size={17} /> فتح عرض السعر كاملاً</button></article>;
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
  return <article><EntityHeader icon={Handshake} title={project?.name || "عقد مشروع"} meta={contract.reference} status={contract.status} /><div className="live-facts"><span><small>توقيع العميل</small><strong>{contract.client_signed_at ? displayDate(contract.client_signed_at) : "بانتظار العميل"}</strong></span><span><small>توقيع مقدم الخدمة</small><strong>{contract.owner_signed_at ? displayDate(contract.owner_signed_at) : "لم يوقع"}</strong></span></div>{!locked && <label className="live-contract-terms">صياغة البنود، كل بند في سطر<textarea rows="7" value={terms} onChange={(event) => setTerms(event.target.value)} /></label>}{locked && <div className="form-note"><LockKey size={18} /> قفل النظام نص العقد بعد أول توقيع لحماية النسخة المعتمدة.</div>}<div className="live-actions">{!locked && <button className="button ghost small" onClick={saveTerms}>حفظ الصياغة</button>}{!contract.owner_signed_at && <button className="button primary small" onClick={sign}><Check size={17} /> توقيع مقدم الخدمة</button>}<button className="button primary small" onClick={onPrint}><Handshake size={17} /> فتح العقد كاملاً</button></div></article>;
}

function LiveDocuments({ data, access, refresh, onToast, ownerName }) {
  const [printable, setPrintable] = useState(null);
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  const clients = useMemo(() => Object.fromEntries((data.clients || []).map((item) => [item.id, item])), [data.clients]);
  const settings = data.studio_settings?.[0] || {};
  const printProps = printable ? { kind: printable.kind, record: printable.record, project: projects[printable.record.project_id], client: clients[projects[printable.record.project_id]?.client_id], settings, onClose: () => setPrintable(null) } : null;
  return <div className="dashboard-content page-stack document-center"><div className="page-title"><div><h1>مركز المستندات</h1><p>كل عرض وعقد يظهر كمستند كامل قابل للفتح أولاً، ثم الطباعة أو الحفظ PDF.</p></div></div><section className="document-pipeline" aria-label="تسلسل المستندات"><span><b>01</b><strong>عرض السعر</strong><small>النطاق والمخرجات والقيمة</small></span><i><ArrowLeft size={18} /></i><span><b>02</b><strong>العقد</strong><small>بنود مستقلة وتوقيعان</small></span><i><ArrowLeft size={18} /></i><span><b>03</b><strong>الفواتير</strong><small>تظهر كاملة في الحسابات</small></span></section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>عروض السعر</h2><p>افتح النسخة الكاملة للتأكد مما سيراه العميل، ثم عدّل أو أرسل.</p></div><span>{data.quotes?.length || 0}</span></div>{data.quotes?.length ? <div className="live-document-list">{data.quotes.map((quote) => <LiveQuote key={quote.id} quote={quote} project={projects[quote.project_id]} access={access} refresh={refresh} onToast={onToast} onPrint={() => setPrintable({ kind: "quote", record: quote })} />)}</div> : <EmptyState icon={FileText} title="لا توجد عروض بعد" body="اعتماد البريف ينشئ مسودة عرض واضحة هنا، ولا يوجد مستند مخفي." />}</section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>العقود</h2><p>افتح العقد كاملاً، ثم حرر البنود قبل التوقيع. يقفل النص بعد أول توقيع.</p></div><span>{data.contracts?.length || 0}</span></div>{data.contracts?.length ? <div className="live-entity-list compact">{data.contracts.map((contract) => <LiveContract key={contract.id} contract={contract} project={projects[contract.project_id]} access={access} refresh={refresh} onToast={onToast} ownerName={ownerName} onPrint={() => setPrintable({ kind: "contract", record: contract })} />)}</div> : <EmptyState icon={Handshake} title="لا توجد عقود بعد" body="ينشأ العقد مستقلاً فور موافقة العميل على عرض السعر." />}</section>{printProps && <PrintableDocument {...printProps} />}</div>;
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
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>الحسابات</h1><p>فواتير غير ضريبية، مطالبات متعاونين، وحركة مالية تحفظ كل عملة منفصلة.</p></div></div><section className="finance-hero live-finance-hero"><div className="finance-balance"><span>المحصل المسجل</span><strong>{formatMoney((data.financial_entries || []).filter((item) => item.direction === "income" && item.currency === "SAR").reduce((sum, item) => sum + Number(item.amount), 0))}</strong><p>لا تشمل العملات الأخرى حتى يضاف سعر الصرف المرجعي.</p></div><div className="finance-pairs"><div><Receipt size={22} /><span>فواتير العملاء<strong>{data.invoices?.length || 0}</strong></span></div><div><Coins size={22} /><span>مطالبات الفريق<strong>{data.collaborator_claims?.length || 0}</strong></span></div></div></section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>فواتير العملاء</h2><p>الفاتورة غير ضريبية وتصدر حسب خطة العقد.</p></div></div>{data.invoices?.length ? <div className="live-entity-list compact">{data.invoices.map((item) => <article key={item.id}><EntityHeader icon={Invoice} title={`${item.installment_label}، ${projects[item.project_id]?.name || "مشروع"}`} meta={item.reference} status={item.status} /><div className="live-facts"><span><small>القيمة</small><strong>{formatMoney(item.amount, item.currency)}</strong></span><span><small>الاستحقاق</small><strong>{displayDate(item.due_date)}</strong></span></div><div className="live-actions">{["issued", "overdue"].includes(item.status) && <button className="button primary small" onClick={() => setSelectedInvoice(item)}>تسجيل التحصيل</button>}{(data.project_files || []).some((file) => file.invoice_id === item.id && file.category === "invoice") && <button className="button ghost small" onClick={() => openReceipt(item)}><Receipt size={17} /> فتح الإيصال</button>}<button className="button primary small" onClick={() => setPrintable({ kind: "invoice", record: item })}><Invoice size={17} /> فتح الفاتورة كاملة</button></div></article>)}</div> : <EmptyState icon={Invoice} title="لا توجد فواتير" body="تُنشأ الدفعات تلقائياً عند اكتمال توقيع العقد." />}</section><section className="panel live-list-panel"><div className="panel-heading"><div><h2>مطالبات المتعاونين</h2><p>السعر والكمية والعملة تبقى مرتبطة بالمشروع.</p></div></div>{data.collaborator_claims?.length ? <div className="live-entity-list compact">{data.collaborator_claims.map((claim) => <article key={claim.id}><EntityHeader icon={Coins} title={claim.collaborator_name} meta={`${claim.reference}، ${claim.item_name}`} status={claim.status} /><strong>{formatMoney(claim.amount, claim.currency)}</strong><div className="live-actions">{claim.status === "submitted" && <button className="button ghost small" onClick={() => approveClaim(claim)}>اعتماد المطالبة</button>}{["approved", "due"].includes(claim.status) && <button className="button primary small" onClick={() => setSelectedClaim(claim)}>تسجيل السداد</button>}<button className="button ghost small" onClick={() => setPrintable({ kind: "claim", record: claim })}><Coins size={17} /> فتح فاتورة الخدمة</button></div></article>)}</div> : <EmptyState icon={Coins} title="لا توجد مطالبات" body="يستطيع المتعاون إرسال مطالبته من مساحته." />}</section>{selectedInvoice && <PaymentDialog invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onConfirm={confirm} />}{selectedClaim && <ClaimPaymentDialog claim={selectedClaim} onClose={() => setSelectedClaim(null)} onConfirm={confirmClaim} />}{printProps && <PrintableDocument {...printProps} />}</div>;
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
  return <div className="dashboard-content page-stack"><div className="page-title"><div><h1>الفريق والصلاحيات</h1><p>هنا تدير الحسابات والأسعار فقط. أي مساعدة إنتاجية تبدأ من «المعمل الإبداعي» بعد أن تثبّت أنت الاتجاه.</p></div></div><section className="system-columns live-team-columns"><div className="panel"><div className="panel-heading"><div><h2>الأعضاء</h2><p>الحسابات المرتبطة بالمساحة.</p></div></div><div className="live-member-list">{(data.memberships || []).map((person) => <article key={person.id}><span className="person-avatar">{person.display_name.slice(0, 1)}</span><div><strong>{person.display_name}</strong><small>{person.role}</small></div><LiveStatus value={person.status} label={person.status === "active" ? "نشط" : undefined} /></article>)}</div></div><aside className="panel"><div className="panel-heading"><div><h2>دعوة مستخدم</h2><p>تُرسل من الخادم ولا تكشف مفاتيح الإدارة.</p></div></div><InviteUserForm access={access} data={data} refresh={refresh} onToast={onToast} /></aside></section><section className="panel team-workflow-note"><Target size={25} /><div><h2>التكليف لا يبدأ من هنا</h2><p>ابدأ بالفكرة في المعمل الإبداعي. وعندما يكتمل الاتجاه، حدّد جزءاً إنتاجياً واضحاً واختر من يساعدك فيه إن احتجت.</p></div></section><section className="panel"><div className="panel-heading"><div><h2>أسعار المتعاونين</h2><p>سعر مستقل لكل قطعة وبالعملة المتفق عليها.</p></div></div><CollaboratorRateForm access={access} data={data} refresh={refresh} onToast={onToast} />{data.collaborator_rates?.length ? <div className="live-rate-list">{data.collaborator_rates.map((rate) => <span key={rate.id}><strong>{rate.collaborator_name}</strong><small>{rate.item_name}</small><b>{formatMoney(rate.unit_price, rate.currency)}</b></span>)}</div> : null}</section></div>;
}

export function LiveOwnerSection({ section, data, access, refresh, onToast, setSection, ownerName }) {
  if (section === "overview" || section === "scenario") return <LiveOverview data={data} setSection={setSection} />;
  if (section === "requests") return <LiveRequests data={data} refresh={refresh} onToast={onToast} access={access} setSection={setSection} />;
  if (section === "projects") return <LiveProjects data={data} refresh={refresh} onToast={onToast} />;
  if (section === "work-orders") return <LiveWorkOrders data={data} access={access} refresh={refresh} onToast={onToast} />;
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

function ClientDocumentShelf({ quote, contract, invoices, onOpen }) {
  const rows = [
    quote && { kind: "quote", record: quote, icon: FileText, label: "عرض السعر" },
    contract && { kind: "contract", record: contract, icon: Handshake, label: "العقد" },
    ...invoices.map((record) => ({ kind: "invoice", record, icon: Invoice, label: record.installment_label })),
  ].filter(Boolean);
  return <section className="panel client-document-shelf"><div><h2>مستندات المشروع</h2><p>افتح النسخة الكاملة في أي وقت.</p></div>{rows.length ? rows.map((row) => { const Icon = row.icon; return <button key={`${row.kind}-${row.record.id}`} onClick={() => onOpen(row.kind, row.record)}><Icon size={19} /><span><strong>{row.label}</strong><small>{row.record.reference}، {displayStatus(row.record.status)}</small></span><ArrowLeft size={16} /></button>; }) : <small>لم يصدر أي مستند بعد.</small>}</section>;
}

export function LiveClientPortal({ data, access, refresh, onToast }) {
  const [selectedId, setSelectedId] = useState(data.projects?.[0]?.id || "");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [printable, setPrintable] = useState(null);
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
  const projectInvoices = (data.invoices || []).filter((item) => item.project_id === project.id && item.status !== "cancelled");
  const client = (data.clients || []).find((item) => item.id === project.client_id);
  const settings = data.studio_settings?.[0] || {};
  const printProps = printable ? { kind: printable.kind, record: printable.record, project, client, settings, onClose: () => setPrintable(null) } : null;
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
  else if (quote && ["sent", "viewed"].includes(quote.status)) action = <div className="live-client-action"><FileText size={31} /><span>عرض السعر {quote.reference}</span><h2>{formatMoney(quote.total, quote.currency)}</h2><p>{quote.scope}</p><button className="button ghost" onClick={() => setPrintable({ kind: "quote", record: quote })}><FileText size={18} /> فتح عرض السعر كاملاً</button><div className="preview-payments">{(quote.payment_plan || []).map((value, index) => <span key={index}><b>{value}%</b><small>الدفعة {index + 1}</small></span>)}</div><div className="live-actions"><button className="button ghost" onClick={() => respondQuote(false)}>رفض العرض</button><button className="button primary" onClick={() => respondQuote(true)}>اعتماد العرض <Check size={18} /></button></div></div>;
  else if (contract && ["sent", "viewed"].includes(contract.status) && !contract.client_signed_at) action = <div className="live-client-action"><Handshake size={31} /><span>العقد {contract.reference}</span><h2>راجع بنود العقد ووقعه</h2><p>يعتمد العقد على النطاق وخطة الدفعات الموافق عليهما في العرض.</p><button className="button ghost" onClick={() => setPrintable({ kind: "contract", record: contract })}><Handshake size={18} /> فتح العقد كاملاً</button><div className="live-client-contract-terms">{listValue(contract.body?.terms).map((term, index) => <p key={`${index}-${term}`}><b>{index + 1}</b>{term}</p>)}</div><label className="consent-field"><input type="checkbox" id="live-contract-consent" /><span>قرأت العقد وأوافق على التوقيع بصفتي ممثل العميل.</span></label><button className="button primary" onClick={() => { const checkbox = document.getElementById("live-contract-consent"); if (checkbox?.checked) sign(); else onToast("وافق على الإقرار أولاً"); }}>توقيع العقد <Check size={18} /></button></div>;
  else if (invoiceRow) action = <div className="live-client-action"><Receipt size={31} /><span>فاتورة غير ضريبية {invoiceRow.reference}</span><h2>{formatMoney(invoiceRow.amount, invoiceRow.currency)}</h2><p>حوّل المبلغ إلى الحساب أدناه، ثم ارفع الإيصال للمراجعة.</p><button className="button ghost" onClick={() => setPrintable({ kind: "invoice", record: invoiceRow })}><Invoice size={18} /> فتح الفاتورة كاملة</button><div className="payment-instructions"><span><small>المستفيد</small><strong>{paymentInfo?.beneficiary || "يظهر بعد اكتمال إعداد الحساب"}</strong></span><span><small>البنك</small><strong>{paymentInfo?.bank_name || "غير محدد"}</strong></span><span><small>IBAN</small><strong dir="ltr">{paymentInfo?.bank_iban || "غير محدد"}</strong></span></div><label className="button primary upload-button">رفع إيصال التحويل <FileArrowUp size={18} /><input type="file" accept="image/*,application/pdf" onChange={uploadReceipt} /></label></div>;
  else if (proof) action = <ClientProofReview proof={proof} files={proofFiles} onDownload={download} onReview={reviewProof} />;
  else if (project.status === "delivery") action = <div className="live-client-action"><FolderOpen size={31} /><span>التسليم النهائي</span><h2>ملفات مشروعك جاهزة</h2><div className="delivery-file-list">{deliveryFiles.map((file) => <button key={file.id} onClick={() => download(file)}><FileText size={20} /><span><strong>{file.file_name}</strong><small>{file.mime_type || "ملف"}</small></span><ArrowLeft size={17} /></button>)}</div><button className="button primary" disabled={!deliveryFiles.length} onClick={async () => { try { await workflow.confirmDelivery(project.id); onToast("تم تأكيد الاستلام وفتح المتابعة"); await refresh(); } catch (error) { onToast(error.message); } }}>تأكيد الاستلام <Check size={18} /></button></div>;
  else if (project.status === "follow_up") action = <ClientFeedbackAction project={project} refresh={refresh} onToast={onToast} />;

  return <div className="portal-shell live-portal"><header className="live-portal-head"><div><small>بوابة العميل</small><h1>{project.name}</h1><p>{project.service_name}</p></div>{projects.length > 1 && <select value={project.id} onChange={(event) => setSelectedId(event.target.value)}>{projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}<LiveStatus value={project.status} /></header><section className="live-portal-layout"><main>{action}</main><aside><section className="panel"><h2>حالة المشروع</h2><p>{project.next_action || "لا يوجد قرار تالٍ"}</p><div className="live-facts"><span><small>البدء</small><strong>{displayDate(project.start_date)}</strong></span><span><small>التسليم</small><strong>{displayDate(project.due_date)}</strong></span></div></section><ClientDocumentShelf quote={quote} contract={contract} invoices={projectInvoices} onOpen={(kind, record) => setPrintable({ kind, record })} />{retainer && <ClientRetainerRequest retainer={retainer} access={access} refresh={refresh} onToast={onToast} />}</aside></section>{printProps && <PrintableDocument {...printProps} />}</div>;
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
      await insertRecord("collaborator_claims", { workspace_id: access.workspaceId, project_id: task.project_id, work_order_id: task.id, collaborator_user_id: access.user.id, collaborator_name: member?.display_name || access.user.email, item_name: rate?.item_name || values.item, unit_price: rate ? Number(rate.unit_price) : Number(values.price), quantity: Number(values.quantity || 1), currency: rate?.currency || values.currency, due_date: values.due || null, status: "submitted", notes: values.notes || null });
      event.currentTarget.reset();
      onToast("تم إرسال المطالبة إلى الحسابات للمراجعة");
      await refresh();
    } catch (error) { onToast(error.message); }
  };
  return <form className="panel live-claim-form" onSubmit={submit}><div className="panel-heading"><div><h2>مطالبة تقديم خدمة</h2><p>ترتبط بطلب العمل الحالي ولا تختلط بفواتير العميل.</p></div><Coins size={21} /></div>{rates.length ? <label>السعر المتفق عليه<select value={rateId} onChange={(event) => setRateId(event.target.value)}>{rates.map((item) => <option value={item.id} key={item.id}>{item.item_name}، {formatMoney(item.unit_price, item.currency)}</option>)}</select></label> : <><label>الخدمة<input name="item" required /></label><div className="field-row"><label>سعر القطعة<input name="price" type="number" min="0" step="0.01" required /></label><label>العملة<select name="currency"><option>SAR</option><option>USD</option><option>EUR</option></select></label></div></>}<div className="field-row"><label>الكمية<input name="quantity" type="number" min="1" defaultValue="1" required /></label><label>الاستحقاق<input name="due" type="date" /></label></div><label>ملاحظة<textarea name="notes" rows="2" /></label><button className="button ghost" type="submit">إرسال المطالبة</button></form>;
}

export function LiveCollaboratorPortal({ data, access, refresh, onToast }) {
  const [selectedId, setSelectedId] = useState(data.work_orders?.[0]?.id || "");
  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageFile, setMessageFile] = useState(null);
  const [busy, setBusy] = useState("");
  const tasks = data.work_orders || [];
  const task = tasks.find((item) => item.id === selectedId) || tasks[0];
  const projects = useMemo(() => Object.fromEntries((data.projects || []).map((item) => [item.id, item])), [data.projects]);
  useEffect(() => { if (!tasks.some((item) => item.id === selectedId) && tasks[0]) setSelectedId(tasks[0].id); }, [tasks, selectedId]);
  if (!task) return <div className="portal-shell"><EmptyState icon={UserFocus} title="لا توجد طلبات عمل موجهة لك" body="لا تصل إليك المسودات. سيظهر الطلب فقط بعد أن يختارك عبد الوهاب ويرسله بنفسه." /></div>;
  const project = projects[task.project_id];
  const files = (data.project_files || []).filter((item) => item.work_order_id === task.id);
  const messages = (data.work_order_messages || []).filter((item) => item.work_order_id === task.id).slice().reverse();
  const assignees = (data.work_order_assignees || []).filter((item) => item.work_order_id === task.id);
  const openFile = async (file) => { try { window.open(await createSignedProjectFileUrl(file.storage_path), "_blank", "noopener,noreferrer"); } catch (error) { onToast(error.message); } };
  const changeStatus = async () => { setBusy("start"); try { await workflow.startWorkOrder(task.id); onToast("بدأت التنفيذ وسجل النظام ذلك داخل الطلب"); await refresh(); } catch (error) { onToast(error.message); } finally { setBusy(""); } };
  const postMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() && !messageFile) return;
    setBusy("message");
    try {
      if (messageFile) await uploadProjectFile({ workspaceId: access.workspaceId, projectId: task.project_id, workOrderId: task.id, file: messageFile, category: "source" });
      await workflow.postWorkOrderMessage(task.id, message.trim() || `أرفقت ملف ${messageFile.name}`);
      setMessage(""); setMessageFile(null);
      onToast("وصلت رسالتك إلى عبد الوهاب داخل الطلب");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  const submitProof = async () => {
    if (!proofFile) { onToast("اختر ملف البروفة أولاً"); return; }
    setBusy("proof");
    try {
      await uploadProjectFile({ workspaceId: access.workspaceId, projectId: task.project_id, workOrderId: task.id, file: proofFile, category: "proof" });
      await workflow.submitWorkOrderProof(task.id, proofFile.name, proofNote || null);
      setProofFile(null); setProofNote("");
      onToast("وصلت البروفة إلى عبد الوهاب للمراجعة. لم تُرسل إلى العميل");
      await refresh();
    } catch (error) { onToast(error.message); } finally { setBusy(""); }
  };
  return <div className="portal-shell live-portal collaborator-work-room"><header className="live-portal-head"><div><small>تنفيذ تحت قيادة عبد الوهاب، {task.reference}</small><h1>{task.title}</h1><p>{project?.name || "مشروع"}</p></div>{tasks.length > 1 && <select value={task.id} onChange={(event) => setSelectedId(event.target.value)}>{tasks.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select>}<LiveStatus value={task.status} /></header><section className="collaborator-work-layout"><main><section className="panel collaborator-brief"><span>نطاق إنتاجي من عبد الوهاب</span><div className="collaborator-direction-owner"><small>المدير الإبداعي والمصمم</small><strong>عبد الوهاب بن سليمان السويد</strong></div><h2>{task.title}</h2>{task.creative_core && <div className="collaborator-creative-core"><small>الفكرة التي تقود التنفيذ</small><strong>{task.creative_core}</strong><p>{task.creative_rationale}</p></div>}<div className="delegated-scope"><small>نطاقك الإنتاجي المحدد</small><p>{task.delegation_scope || task.description}</p></div>{task.owner_recommendations && <blockquote><strong>توجيه عبد الوهاب</strong>{task.owner_recommendations}</blockquote>}<div className="work-order-meta"><span><small>الأولوية</small><strong>{priorityLabels[task.priority]}</strong></span><span><small>موعد التسليم</small><strong>{displayDate(task.due_date)}</strong></span><span><small>معك في التنفيذ</small><strong>{assignees.map((item) => item.role_label || "متعاون").join("، ")}</strong></span></div>{task.status === "dispatched" && <button className="button primary" disabled={Boolean(busy)} onClick={changeStatus}>بدء الجزء الإنتاجي</button>}{task.status === "internal_review" && <div className="form-note"><Clock size={18} /> التنفيذ لدى عبد الوهاب بانتظار قراره الإبداعي.</div>}{["completed", "client_review"].includes(task.status) && <div className="form-note"><CheckCircle size={18} /> {task.status === "completed" ? "اعتمد عبد الوهاب التنفيذ وأغلق النطاق." : "اعتمد عبد الوهاب التنفيذ وأرسل النتيجة للعميل."}</div>}</section><section className="panel collaborator-files"><div className="work-order-section-title"><div><h3>ملفات التنفيذ</h3><p>المراجع التي اختار عبد الوهاب مشاركتها ضمن هذا النطاق.</p></div></div><WorkOrderFiles files={files} onOpen={openFile} /></section>{["in_progress", "changes_requested", "dispatched"].includes(task.status) && <section className="panel live-proof-upload collaborator-proof-upload"><div><span>تسليم داخلي</span><h2>ارفع التنفيذ لعبد الوهاب</h2><p>لا يصل للعميل مباشرة. يراجعه عبد الوهاب بصفته صاحب الفكرة والمدير الإبداعي.</p></div><label>ملف البروفة<input type="file" onChange={(event) => setProofFile(event.target.files?.[0] || null)} /></label><label>ملاحظة التسليم<textarea rows="3" value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="ما الذي نفذته داخل النطاق؟ وما الذي يحتاج انتباه عبد الوهاب؟" /></label><button className="button primary" disabled={busy === "proof" || !proofFile} onClick={submitProof}><FileArrowUp size={18} /> رفع للمراجعة الإبداعية</button></section>}</main><aside><section className="panel collaborator-thread-panel"><div className="work-order-section-title"><div><h3>النقاش مع عبد الوهاب</h3><p>مرتبط بالنطاق الذي فوضه لك فقط.</p></div></div><WorkOrderMessages messages={messages} currentUserId={access.user.id} /><form className="work-order-composer" onSubmit={postMessage}><textarea rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب سؤالك التنفيذي أو تحديثك" /><div><label className="text-link">إرفاق ملف<input type="file" onChange={(event) => setMessageFile(event.target.files?.[0] || null)} /></label>{messageFile && <small>{messageFile.name}</small>}<button className="button primary small" type="submit" disabled={busy === "message" || (!message.trim() && !messageFile)}>إرسال <PaperPlaneTilt size={16} /></button></div></form></section><section className="panel collaborator-scope-note"><h2>حدود الدور</h2><p>لا ترى بحث عبد الوهاب الخاص أو عقود العميل ومالياته. تعمل داخل الجزء الإنتاجي الذي اختار تفويضه لك فقط.</p></section><CollaboratorClaimForm task={task} data={data} access={access} refresh={refresh} onToast={onToast} /></aside></section></div>;
}

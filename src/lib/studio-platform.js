import { createClient } from "@supabase/supabase-js";
import { readAuthLanding } from "./auth-flow.js";
import { requestPasswordReset, updateOwnPassword } from "./password-actions.js";

// Capture only intent, never tokens, before the SDK consumes the callback URL.
export const authLanding = readAuthLanding(window.location.hash);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();
const workspaceSlug = import.meta.env.VITE_U89_WORKSPACE_SLUG?.trim() || "u89";

export const platformConfig = Object.freeze({
  supabaseUrl,
  publishableKey,
  workspaceSlug,
  configured: Boolean(supabaseUrl && publishableKey),
  mode: supabaseUrl && publishableKey ? "connected" : "local",
});

export const supabase = platformConfig.configured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const assertConnected = () => {
  if (!supabase) {
    throw new Error("قاعدة البيانات غير مربوطة بعد. أضف متغيرات Supabase في Vercel أو ملف البيئة المحلي.");
  }
};

const throwIfError = (error) => {
  if (error) throw error;
};

export async function submitPublicServiceRequest(payload) {
  assertConnected();
  const { data, error } = await supabase.rpc("submit_service_request", {
    p_workspace_slug: workspaceSlug,
    p_payload: payload,
  });
  throwIfError(error);
  return data;
}

export async function loadPublishedSiteContent() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_public_site_content", {
    p_workspace_slug: workspaceSlug,
  });
  throwIfError(error);
  return data || null;
}

export async function publishSiteContent(workspaceId, content) {
  assertConnected();
  const publicKeys = [
    "heroTitle", "heroBody", "heroCta", "servicesTitle", "workTitle", "finalTitle",
    "email", "phone", "domain", "seoTitle", "seoDescription", "indexable", "catalogVersion",
    "acceptingRequests", "maintenance", "sectionVisibility", "serviceVisibility",
    "workVisibility", "portfolioProjects", "portfolioCollectionsInitialized", "services", "requestQuestions",
  ];
  const publicContent = Object.fromEntries(
    publicKeys.filter((key) => Object.hasOwn(content, key)).map((key) => [key, content[key]]),
  );
  // Portfolio publishing has its own owner-approved workflow. Do not overwrite it
  // with an older CMS tab's in-memory copy when publishing other site settings.
  const { data: latestSite, error: latestError } = await supabase.from("public_site_content").select("content").eq("workspace_id", workspaceId).maybeSingle();
  throwIfError(latestError);
  if (latestSite?.content?.portfolioProjects) publicContent.portfolioProjects = latestSite.content.portfolioProjects;
  if (latestSite?.content?.portfolioCollectionsInitialized === true) publicContent.portfolioCollectionsInitialized = true;
  if (latestSite?.content?.workVisibility) publicContent.workVisibility = latestSite.content.workVisibility;
  const { data, error } = await supabase
    .from("public_site_content")
    .upsert({
      workspace_id: workspaceId,
      published: true,
      content: publicContent,
      published_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })
    .select()
    .single();
  throwIfError(error);
  const templateRows = (content.briefTemplates || []).map((template) => ({
    workspace_id: workspaceId,
    service_id: template.serviceId,
    title: template.title,
    description: template.description || null,
    schema: { sections: template.sections || [] },
    enabled: template.enabled !== false,
  }));
  if (templateRows.length) {
    const { error: templateError } = await supabase
      .from("brief_templates")
      .upsert(templateRows, { onConflict: "workspace_id,service_id,title" });
    throwIfError(templateError);
  }
  return data;
}

export async function saveStudioSettings(workspaceId, content) {
  assertConnected();
  const record = {
    workspace_id: workspaceId,
    owner_name_ar: content.ownerNameAr,
    owner_name_en: content.ownerNameEn,
    email: content.email,
    phone: content.phone,
    bank_name: content.bankName || null,
    bank_account: content.bankAccount || null,
    bank_iban: content.bankIban || null,
    vat_registered: Boolean(content.vatRegistered),
    quote_validity_days: Number(content.quoteValidityDays || 10),
    first_proof_days: Number(content.firstProofDays || 14),
    revision_days: Number(content.revisionDays || 7),
    restart_days: Number(content.restartDays || 10),
    finalization_days: Number(content.finalizationDays || 14),
    payment_plans: content.paymentPlans || [],
    collaborator_currencies: content.collaboratorCurrencies || ["SAR", "USD", "EUR"],
    preferences: {
      revisionRounds: content.revisionRounds,
      briefTemplates: content.briefTemplates || [],
    },
  };
  const { data, error } = await supabase
    .from("studio_settings")
    .upsert(record, { onConflict: "workspace_id" })
    .select()
    .single();
  throwIfError(error);
  const templateRows = (content.briefTemplates || []).map((template) => ({
    workspace_id: workspaceId,
    service_id: template.serviceId,
    title: template.title,
    description: template.description || null,
    schema: { sections: template.sections || [] },
    enabled: template.enabled !== false,
  }));
  if (templateRows.length) {
    const { error: templateError } = await supabase
      .from("brief_templates")
      .upsert(templateRows, { onConflict: "workspace_id,service_id,title" });
    throwIfError(templateError);
  }
  return data;
}

export async function loadStudioSettings(workspaceId) {
  assertConnected();
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return {
    ownerNameAr: data.owner_name_ar,
    ownerNameEn: data.owner_name_en,
    email: data.email,
    phone: data.phone,
    bankName: data.bank_name || "",
    bankAccount: data.bank_account || "",
    bankIban: data.bank_iban || "",
    vatRegistered: data.vat_registered,
    quoteValidityDays: data.quote_validity_days,
    firstProofDays: data.first_proof_days,
    revisionDays: data.revision_days,
    restartDays: data.restart_days,
    finalizationDays: data.finalization_days,
    paymentPlans: data.payment_plans || [],
    collaboratorCurrencies: data.collaborator_currencies || ["SAR", "USD", "EUR"],
    ...(data.preferences?.revisionRounds ? { revisionRounds: data.preferences.revisionRounds } : {}),
    ...(Array.isArray(data.preferences?.briefTemplates) && data.preferences.briefTemplates.length
      ? { briefTemplates: data.preferences.briefTemplates }
      : {}),
  };
}

export async function signInWithPassword(email, password) {
  assertConnected();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  throwIfError(error);
  return data;
}

export async function sendMagicLink(email) {
  assertConnected();
  const redirectTo = `${window.location.origin}/studio`;
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });
  throwIfError(error);
  return data;
}

export async function sendPasswordReset(email) {
  assertConnected();
  return requestPasswordReset(supabase.auth, email, `${window.location.origin}/studio`);
}

export async function setMyPassword(password, confirmation) {
  assertConnected();
  return updateOwnPassword(supabase.auth, password, confirmation);
}

export async function signOutPlatform() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  throwIfError(error);
}

export async function getCurrentAccess() {
  assertConnected();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  throwIfError(sessionError);
  const session = sessionData.session;
  if (!session) return null;

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("id, role, status, workspace_id, display_name, workspaces(id, name, slug)")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  throwIfError(error);
  if (!membership) {
    throw new Error("الحساب صحيح لكنه غير مرتبط بمساحة عمل نشطة.");
  }

  return {
    session,
    user: session.user,
    membership,
    role: membership.role,
    workspaceId: membership.workspace_id,
    workspace: membership.workspaces,
  };
}

export function subscribeToAuth(callback) {
  if (!supabase) return () => {};
  let active = true;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Supabase calls listeners under its auth lock. Defer SDK work to avoid deadlocks.
    setTimeout(() => { if (active) callback(session, event); }, 0);
  });
  return () => { active = false; data.subscription.unsubscribe(); };
}

export async function loadWorkspaceSnapshot(workspaceId) {
  assertConnected();
  const tables = [
    "memberships",
    "brief_templates",
    "studio_settings",
    "clients",
    "service_requests",
    "projects",
    "briefs",
    "quotes",
    "contracts",
    "invoices",
    "collaborator_claims",
    "collaborator_rates",
    "financial_entries",
    "retainers",
    "retainer_requests",
    "project_tasks",
    "work_orders",
    "work_order_assignees",
    "work_order_messages",
    "proofs",
    "project_files",
    "notifications",
    "activity_events",
  ];

  const results = await Promise.all(
    tables.map(async (table) => {
      let query = supabase.from(table).select("*").eq("workspace_id", workspaceId);
      if (["activity_events", "notifications"].includes(table)) {
        query = query.order("created_at", { ascending: false }).limit(100);
      } else {
        query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query;
      throwIfError(error);
      return [table, data || []];
    }),
  );

  return Object.fromEntries(results);
}

export async function updateRecord(table, id, patch, workspaceId) {
  assertConnected();
  const { data, error } = await supabase
    .from(table)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  throwIfError(error);
  return data;
}

export async function insertRecord(table, record) {
  assertConnected();
  const { data, error } = await supabase.from(table).insert(record).select().single();
  throwIfError(error);
  return data;
}

async function callWorkflow(name, args) {
  assertConnected();
  const { data, error } = await supabase.rpc(name, args);
  throwIfError(error);
  return data;
}

export const workflow = Object.freeze({
  acceptRequest: (requestId, templateId = null) => callWorkflow("accept_service_request", {
    p_request_id: requestId,
    p_template_id: templateId,
  }),
  submitBrief: (briefId, answers) => callWorkflow("submit_brief", {
    p_brief_id: briefId,
    p_answers: answers,
  }),
  approveBrief: (briefId) => callWorkflow("approve_brief", { p_brief_id: briefId }),
  sendQuote: (quoteId) => callWorkflow("send_quote", { p_quote_id: quoteId }),
  respondToQuote: (quoteId, accept) => callWorkflow("respond_to_quote", {
    p_quote_id: quoteId,
    p_accept: accept,
  }),
  signContract: (contractId, signerName) => callWorkflow("sign_contract", {
    p_contract_id: contractId,
    p_signer_name: signerName,
  }),
  issueProjectInvoice: (invoiceId) => callWorkflow("issue_project_invoice", { p_invoice_id: invoiceId }),
  recordInvoicePayment: (invoiceId, method, reference = null) => callWorkflow("record_invoice_payment", {
    p_invoice_id: invoiceId,
    p_payment_method: method,
    p_payment_reference: reference,
  }),
  approveClaim: (claimId) => callWorkflow("approve_collaborator_claim", { p_claim_id: claimId }),
  recordClaimPayment: (claimId, reference, exchangeRate = null) => callWorkflow("record_claim_payment", {
    p_claim_id: claimId,
    p_payment_reference: reference,
    p_exchange_rate_to_sar: exchangeRate,
  }),
  createWorkOrder: async ({ projectId, title, description, recommendations = null, creativeCore = null, creativeRationale = null, creativeNotes = null, delegationScope = null, executionMode = "owner_led", priority = "normal", dueDate = null, requiresClientApproval = false, assigneeUserIds = [], sourceRetainerRequestId = null, parentWorkOrderId = null, workKind = "whole" }) => {
    const order = await callWorkflow("create_work_order", {
      p_project_id: projectId,
      p_title: title,
      p_description: description,
      p_owner_recommendations: recommendations,
      p_creative_core: creativeCore,
      p_creative_rationale: creativeRationale,
      p_creative_notes: creativeNotes,
      p_delegation_scope: delegationScope,
      p_execution_mode: executionMode,
      p_priority: priority,
      p_due_date: dueDate,
      p_requires_client_approval: requiresClientApproval,
      p_assignee_user_ids: assigneeUserIds,
      p_source_retainer_request_id: sourceRetainerRequestId,
    });
    if (!parentWorkOrderId && workKind === "whole") return order;
    return updateRecord("work_orders", order.id, {
      parent_work_order_id: parentWorkOrderId,
      work_kind: workKind,
    }, order.workspace_id);
  },
  advanceOwnerWorkOrder: (workOrderId, status) => callWorkflow("advance_owner_work_order", {
    p_work_order_id: workOrderId,
    p_status: status,
  }),
  saveWorkOrderAssignees: (workOrderId, userIds) => callWorkflow("save_work_order_assignees", {
    p_work_order_id: workOrderId,
    p_user_ids: userIds,
  }),
  saveWorkOrderAssignments: (workOrderId, assignments) => callWorkflow("save_work_order_assignments", {
    p_work_order_id: workOrderId,
    p_assignments: assignments,
  }),
  dispatchWorkOrder: (workOrderId) => callWorkflow("dispatch_work_order", { p_work_order_id: workOrderId }),
  startWorkOrder: (workOrderId) => callWorkflow("start_work_order", { p_work_order_id: workOrderId }),
  postWorkOrderMessage: (workOrderId, body, messageType = "message") => callWorkflow("post_work_order_message", {
    p_work_order_id: workOrderId,
    p_body: body,
    p_message_type: messageType,
  }),
  submitWorkOrderProof: (workOrderId, title, note = null) => callWorkflow("submit_work_order_proof", {
    p_work_order_id: workOrderId,
    p_title: title,
    p_note: note,
  }),
  submitOwnerWorkOrderProof: (workOrderId, title, note = null) => callWorkflow("submit_owner_work_order_proof", {
    p_work_order_id: workOrderId,
    p_title: title,
    p_note: note,
  }),
  reviewWorkOrderProof: (proofId, decision, note = null, sendToClient = false) => callWorkflow("review_work_order_proof", {
    p_proof_id: proofId,
    p_decision: decision,
    p_note: note,
    p_send_to_client: sendToClient,
  }),
  updateTaskStatus: (taskId, status) => callWorkflow("update_assigned_task_status", {
    p_task_id: taskId,
    p_status: status,
  }),
  submitProof: ({ projectId, taskId = null, title, note = null, sendToClient = false }) => callWorkflow("submit_proof", {
    p_project_id: projectId,
    p_task_id: taskId,
    p_title: title,
    p_note: note,
    p_send_to_client: sendToClient,
  }),
  sendProofToClient: (proofId) => callWorkflow("send_proof_to_client", { p_proof_id: proofId }),
  reviewProof: (proofId, decision, note = null) => callWorkflow("review_proof", {
    p_proof_id: proofId,
    p_decision: decision,
    p_note: note,
  }),
  routeClientRevision: (workOrderId, route, note = null) => callWorkflow("route_client_revision", {
    p_work_order_id: workOrderId,
    p_route: route,
    p_note: note,
  }),
  releaseDelivery: (projectId) => callWorkflow("release_project_delivery", { p_project_id: projectId }),
  confirmDelivery: (projectId) => callWorkflow("confirm_project_delivery", { p_project_id: projectId }),
  submitProjectFeedback: (projectId, rating, note = null) => callWorkflow("submit_project_feedback", { p_project_id: projectId, p_rating: rating, p_note: note }),
  getPaymentInstructions: (projectId) => callWorkflow("get_project_payment_instructions", { p_project_id: projectId }),
  markNotificationRead: (notificationId) => callWorkflow("mark_notification_read", { p_notification_id: notificationId }),
});

export async function uploadProjectFile({ workspaceId, projectId, file, category = "general", invoiceId = null, workOrderId = null, messageId = null }) {
  assertConnected();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwIfError(authError);
  if (!authData.user) throw new Error("يلزم تسجيل الدخول قبل رفع الملفات.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const fileId = crypto.randomUUID();
  const path = `${workspaceId}/${projectId}/${category}/${fileId}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  throwIfError(uploadError);

  const record = await insertRecord("project_files", {
    id: fileId,
    workspace_id: workspaceId,
    project_id: projectId,
    work_order_id: workOrderId,
    message_id: messageId,
    category,
    invoice_id: invoiceId,
    file_name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: authData.user.id,
  });
  return record;
}

export async function createSignedProjectFileUrl(storagePath, expiresIn = 900) {
  assertConnected();
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, expiresIn);
  throwIfError(error);
  return data.signedUrl;
}

export async function checkPlatformConnection() {
  if (!supabase) {
    return {
      configured: false,
      database: false,
      auth: false,
      mode: "local",
      message: "وضع محلي آمن للتجربة",
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("public_site_content").select("workspace_id").limit(1);
  return {
    configured: true,
    database: !error,
    auth: Boolean(sessionData.session),
    mode: "connected",
    message: error ? "المفاتيح موجودة لكن مخطط قاعدة البيانات لم يطبق" : "متصل بقاعدة البيانات",
    error: error?.message || null,
  };
}

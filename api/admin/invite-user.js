import { createClient } from "@supabase/supabase-js";

const allowedRoles = new Set(["manager", "accountant", "collaborator", "client"]);

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return response.status(503).json({ error: "Server integration is not configured" });

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ error: "Unauthorized" });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return response.status(401).json({ error: "Invalid session" });

  const body = request.body || {};
  const workspaceId = String(body.workspaceId || "");
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const phone = String(body.phone || "").trim() || null;
  const role = String(body.role || "");
  const clientId = body.clientId ? String(body.clientId) : null;

  if (!workspaceId || !email || !displayName || !allowedRoles.has(role)) {
    return response.status(400).json({ error: "Missing or invalid invitation data" });
  }

  const { data: requester, error: membershipError } = await admin
    .from("memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError || !requester || !["owner", "manager"].includes(requester.role)) {
    return response.status(403).json({ error: "Forbidden" });
  }
  if (requester.role !== "owner" && ["manager", "accountant"].includes(role)) {
    return response.status(403).json({ error: "Only the owner can invite privileged roles" });
  }

  // Resolve the exact client before sending an invitation or granting access.
  if (role === "client") {
    if (!clientId) return response.status(400).json({ error: "أنشئ ملف العميل واختره قبل إرسال الدعوة" });
    const { data: client, error } = await admin.from("clients")
      .select("id,user_id,email").eq("workspace_id", workspaceId).eq("id", clientId).maybeSingle();
    if (error || !client) return response.status(400).json({ error: "ملف العميل غير موجود في مساحة العمل" });
    if (client.user_id) return response.status(409).json({ error: "ملف العميل مرتبط بحساب بالفعل" });
    if (client.email.trim().toLowerCase() !== email) return response.status(400).json({ error: "بريد الدعوة يجب أن يطابق بريد ملف العميل" });
  }

  const redirectTo = `${process.env.PUBLIC_APP_URL || "https://u89des.com"}/`;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { display_name: displayName, invited_role: role, workspace_id: workspaceId },
  });
  if (inviteError || !inviteData.user) {
    return response.status(409).json({ error: inviteError?.message || "Could not create invitation" });
  }

  const invitedUserId = inviteData.user.id;
  const { error: insertError } = await admin.from("memberships").upsert({
    workspace_id: workspaceId,
    user_id: invitedUserId,
    role,
    status: "active",
    display_name: displayName,
    phone,
    notification_preferences: { email: true, whatsapp: Boolean(phone) },
  }, { onConflict: "workspace_id,user_id" });
  if (insertError) return response.status(500).json({ error: insertError.message });

  if (role === "client" && clientId) {
    const { error: clientError } = await admin
      .from("clients")
      .update({ user_id: invitedUserId })
      .eq("workspace_id", workspaceId)
      .eq("id", clientId)
      .is("user_id", null)
      .select("id").single();
    if (clientError) return response.status(500).json({ error: "أُرسل بريد الدعوة لكن تعذر ربط الملف. راجع ملف العميل قبل إعادة الدعوة." });
  }

  return response.status(201).json({
    invited: true,
    userId: invitedUserId,
    role,
    email,
  });
}

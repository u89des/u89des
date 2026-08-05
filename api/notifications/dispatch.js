const requiredServerConfig = () => ({
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  cronSecret: process.env.CRON_SECRET,
  webhookSecret: process.env.NOTIFICATION_WEBHOOK_SECRET,
});

const jsonHeaders = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
});

async function sendEmail(notification) {
  if (!notification.recipient_email) return { channel: "email", skipped: true, reason: "لا يوجد بريد للمستلم" };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { channel: "email", skipped: true, reason: "خدمة البريد غير مهيأة" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [notification.recipient_email],
      subject: notification.subject,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>${escapeHtml(notification.subject)}</h2><p>${escapeHtml(notification.message)}</p>${notification.action_url ? `<p><a href="${escapeAttribute(resolveActionUrl(notification.action_url))}">فتح مساحة العمل</a></p>` : ""}</div>`,
    }),
  });

  if (!response.ok) throw new Error(`Email ${response.status}: ${await response.text()}`);
  return { channel: "email", sent: true };
}

async function sendWhatsApp(notification) {
  if (!notification.recipient_phone) return { channel: "whatsapp", skipped: true, reason: "لا يوجد جوال للمستلم" };
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const version = process.env.WHATSAPP_GRAPH_VERSION;
  if (!phoneNumberId || !accessToken || !templateName || !version) {
    return { channel: "whatsapp", skipped: true, reason: "خدمة واتساب غير مهيأة" };
  }

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: notification.recipient_phone.replace(/[^0-9]/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "ar" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: notification.subject },
              { type: "text", text: notification.message },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) throw new Error(`WhatsApp ${response.status}: ${await response.text()}`);
  return { channel: "whatsapp", sent: true };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function resolveActionUrl(actionUrl) {
  const baseUrl = process.env.PUBLIC_APP_URL || "https://u89des.com";
  return new URL(actionUrl, baseUrl).toString();
}

async function updateNotification(config, id, patch) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/notifications?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      ...jsonHeaders(config.serviceRoleKey),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`Database update ${response.status}: ${await response.text()}`);
}

async function processNotification(config, notification) {
  const requested = notification.channels.filter((channel) => channel !== "in_app");
  const results = [];
  const errors = [];

  for (const channel of requested) {
    try {
      if (channel === "email") results.push(await sendEmail(notification));
      if (channel === "whatsapp") results.push(await sendWhatsApp(notification));
    } catch (error) {
      errors.push(`${channel}: ${error.message}`);
    }
  }

  const sentCount = results.filter((item) => item.sent).length;
  const skippedReasons = results.filter((item) => item.skipped).map((item) => `${item.channel}: ${item.reason}`);
  const allErrors = [...errors, ...skippedReasons];
  const status = sentCount === requested.length || requested.length === 0
    ? "sent"
    : sentCount > 0
      ? "partial"
      : "failed";

  await updateNotification(config, notification.id, {
    status,
    sent_at: sentCount ? new Date().toISOString() : null,
    last_error: allErrors.length ? allErrors.join(" | ").slice(0, 2000) : null,
  });

  return { id: notification.id, status, sentCount, errors: allErrors };
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const config = requiredServerConfig();
  if (!config.supabaseUrl || !config.serviceRoleKey || (!config.cronSecret && !config.webhookSecret)) {
    return response.status(503).json({ error: "Server integration is not configured" });
  }
  const cronAuthorized = config.cronSecret && request.headers.authorization === `Bearer ${config.cronSecret}`;
  const webhookAuthorized = config.webhookSecret && request.headers["x-u89-webhook-secret"] === config.webhookSecret;
  if (!cronAuthorized && !webhookAuthorized) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const pendingResponse = await fetch(`${config.supabaseUrl}/rest/v1/rpc/claim_pending_notifications`, {
    method: "POST",
    headers: jsonHeaders(config.serviceRoleKey),
    body: JSON.stringify({ p_limit: 25 }),
  });
  if (!pendingResponse.ok) {
    return response.status(502).json({ error: await pendingResponse.text() });
  }

  const pending = await pendingResponse.json();
  const results = [];
  for (const notification of pending) {
    try {
      results.push(await processNotification(config, notification));
    } catch (error) {
      results.push({ id: notification.id, status: "failed", errors: [error.message] });
    }
  }

  return response.status(200).json({ processed: results.length, results });
}

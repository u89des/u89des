export default async function handler(_request, response) {
  const checks = {
    database: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    whatsapp: Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_TEMPLATE_NAME &&
      process.env.WHATSAPP_GRAPH_VERSION
    ),
    notifications: Boolean(process.env.CRON_SECRET || process.env.NOTIFICATION_WEBHOOK_SECRET),
  };
  const ready = checks.database && checks.notifications;
  response.setHeader("Cache-Control", "no-store");
  return response.status(ready ? 200 : 503).json({ ready, checks });
}

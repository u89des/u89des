const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const kindLabel = (kind = "") => {
  if (kind.startsWith("brief.")) return "البريف";
  if (kind.startsWith("quote.")) return "عرض السعر";
  if (kind.startsWith("contract.")) return "العقد";
  if (kind.startsWith("invoice.")) return "الحسابات";
  if (kind.startsWith("claim.")) return "مستحقات المتعاون";
  if (kind.startsWith("proof.") || kind.startsWith("work_order.proof")) return "البروفات";
  if (kind.startsWith("work_order.")) return "طلب العمل";
  if (kind.startsWith("delivery.")) return "التسليم";
  if (kind.startsWith("request.")) return "طلب جديد";
  return "تحديث المشروع";
};

const actionLabel = (kind = "") => {
  if (kind.startsWith("work_order.")) return "فتح طلب العمل";
  if (kind.startsWith("invoice.") || kind.startsWith("claim.")) return "فتح الحسابات";
  if (kind.startsWith("quote.") || kind.startsWith("contract.")) return "فتح المستند";
  if (kind.startsWith("brief.")) return "فتح البريف";
  if (kind.startsWith("proof.")) return "فتح البروفة";
  return "فتح التحديث";
};

export function renderNotificationEmail(notification, actionUrl) {
  const subject = escapeHtml(notification.subject);
  const message = escapeHtml(notification.message).replaceAll("\n", "<br>");
  const label = escapeHtml(kindLabel(notification.kind));
  const button = escapeHtml(actionLabel(notification.kind));
  const safeUrl = escapeHtml(actionUrl);
  const preheader = escapeHtml(`${notification.subject}: ${notification.message}`.slice(0, 145));

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#eef0e9;color:#282b27;font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef0e9;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fafbf8;border:1px solid #d5d9d1;border-radius:20px;overflow:hidden">
        <tr><td style="padding:26px 30px;background:#292d27;color:#f1f4ec">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="font-size:13px;color:#c9cec5;text-align:left;direction:ltr">U89DES.COM</td>
            <td style="font-size:29px;font-weight:800;letter-spacing:-1px;text-align:right;direction:ltr">U89</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:38px 30px 14px">
          <span style="display:inline-block;color:#5f7420;font-size:13px;font-weight:700">${label}</span>
          <h1 style="margin:12px 0 14px;font-size:28px;line-height:1.45;letter-spacing:-.4px;color:#282b27">${subject}</h1>
          <p style="margin:0;color:#575d54;font-size:16px;line-height:1.9">${message}</p>
        </td></tr>
        ${actionUrl ? `<tr><td style="padding:22px 30px 40px"><a href="${safeUrl}" style="display:inline-block;background:#a8c353;color:#20251c;text-decoration:none;font-size:15px;font-weight:800;padding:14px 23px;border-radius:999px">${button}</a><p style="margin:17px 0 0;color:#7a8175;font-size:12px;line-height:1.7">يفتح الرابط الصفحة المرتبطة مباشرة بعد تسجيل الدخول.</p></td></tr>` : ""}
        <tr><td style="padding:22px 30px;border-top:1px solid #dfe3da;color:#737a70;font-size:12px;line-height:1.8">
          رسالة آلية من مساحة عمل عبد الوهاب بن سليمان السويد<br>
          للاستفسار: <a href="mailto:w@u89des.com" style="color:#4f6220">w@u89des.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function notificationText(notification, actionUrl) {
  return [notification.subject, notification.message, actionUrl ? `فتح التحديث: ${actionUrl}` : ""].filter(Boolean).join("\n\n");
}

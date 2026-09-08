export function readAuthLanding(hash = "") {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    password: ["invite", "recovery"].includes(params.get("type")),
    error: params.has("error") || params.has("error_code"),
  };
}

export function passwordValidation(password, confirmation) {
  if (password.length < 12) return "استخدم 12 حرفًا على الأقل لكلمة المرور.";
  if (password.length > 128) return "الحد الأقصى 128 حرفًا.";
  if (password !== confirmation) return "كلمتا المرور غير متطابقتين.";
  return "";
}

export function needsFirstPassword(user) {
  // UX preference only; never used to grant a role or authorize data access.
  return Boolean(user?.user_metadata?.invited_role && user.user_metadata.password_setup_complete !== true);
}

export function authErrorMessage(error) {
  const message = String(error?.code || "") + " " + String(error?.message || "");
  if (/rate.limit|too.many|over_email_send_rate_limit/i.test(message)) return "وصلنا لحد إرسال الرسائل مؤقتًا. لا تكرر الطلب الآن؛ حاول لاحقًا.";
  if (/expired|otp_expired|access_denied/i.test(message)) return "رابط الدخول منتهي أو استُخدم من قبل. اطلب رابطًا جديدًا وافتح أحدث رسالة فقط.";
  if (/invalid.login.credentials/i.test(message)) return "البريد أو كلمة المرور غير صحيحة. إذا لم تعيّن كلمة مرور، استخدم رابط البريد أولًا.";
  if (/same.password/i.test(message)) return "اختر كلمة مرور مختلفة عن السابقة.";
  if (/weak.password|password.*least/i.test(message)) return "اختر كلمة مرور أقوى وأطول، وغير شائعة.";
  if (/session|not.authenticated|reauthentication/i.test(message)) return "يلزم تسجيل دخول حديث. اطلب رابط استعادة جديدًا من صفحة الدخول.";
  return "تعذر إكمال العملية. تحقق من الاتصال وحاول مرة أخرى.";
}

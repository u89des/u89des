# إطلاق U89 Studio OS

هذا الدليل ينقل الموقع من وضع التجربة المحلية إلى تشغيل فعلي على Vercel مع Supabase ودومين GoDaddy.

## تجهيز Supabase

1. أنشئ مشروعاً جديداً في Supabase واختر منطقة قريبة من العملاء.
2. افتح SQL Editor.
3. شغل `supabase/migrations/202608050001_u89_studio_os.sql` كاملاً.
4. يجب أن ينتهي التنفيذ دون خطأ. ملف الترحيل ينشئ الجداول، الدوال، سياسات الصلاحيات، الفهارس وحاوية الملفات الخاصة.
5. أنشئ مستخدم المالك من Authentication > Users.
6. انسخ UUID الخاص بالمستخدم.
7. عدل القيم المطلوبة في `supabase/OWNER_SETUP.sql` وشغله.
8. من Project Settings > API انسخ Project URL وPublishable key.
9. احتفظ بمفتاح Service role للاستخدام داخل Vercel Functions فقط.

مرجع Supabase الرسمي: [استخدام Supabase مع React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

## اختبار الربط محلياً

أنشئ ملف `.env.local` من `.env.example` وأدخل القيم العامة فقط عند استخدام Vite مباشرة:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
VITE_U89_WORKSPACE_SLUG=u89
```

ثم شغل:

```bash
npm run dev
```

سجل الدخول بحساب المالك وافتح «الربط والإطلاق». يجب أن يظهر اتصال قاعدة البيانات وتسجيل الدخول باللون الجاهز.

## النشر على Vercel

1. ارفع المشروع إلى مستودع GitHub خاص.
2. في Vercel اختر Add New ثم Project واستورد المستودع.
3. الإعدادات موجودة في `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite
4. أضف متغيرات البيئة التالية لبيئة Production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_U89_WORKSPACE_SLUG`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NOTIFICATION_WEBHOOK_SECRET`
   - `PUBLIC_APP_URL`
5. أضف متغيرات البريد وواتساب عند تفعيلهما كما هي موضحة في `.env.example`.
6. انشر المشروع وافتح `/api/health`. يجب أن يعيد JSON ولا يعرض أي مفتاح سري.

متغيرات Vite التي تبدأ بـ `VITE_` تصبح جزءاً من حزمة المتصفح. لا تضع فيها Service role أو مفاتيح البريد وواتساب. مرجع Vercel: [متغيرات البيئة](https://vercel.com/docs/environment-variables)

## إعداد الإشعارات الفورية

1. في Supabase افتح Database Webhooks.
2. أنشئ Webhook على جدول `notifications` لحدث INSERT.
3. استخدم الرابط:
   `https://u89des.com/api/notifications/dispatch`
4. أضف ترويسة:
   `x-u89-webhook-secret: قيمة NOTIFICATION_WEBHOOK_SECRET`
5. اختبر بطلب خدمة جديد من الموقع.
6. راجع Vercel Logs وجدول `notifications` للتأكد من تغير الحالة إلى `sent`.

يوجد Cron احتياطي في `vercel.json` يعمل مرة يومياً. خطة Vercel Hobby تسمح بتشغيل Cron مرة واحدة يومياً، لذلك لا تغيره إلى كل عشر دقائق إلا إذا كانت الخطة تسمح بذلك. مرجع Vercel الرسمي: [إدارة Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

## البريد عبر Resend

أضف:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

يجب توثيق الدومين لدى Resend قبل استخدام عنوان من `u89des.com`. استخدم عنواناً منفصلاً مثل `notifications@u89des.com` ولا تغير سجلات البريد الحالية دون حفظ نسخة منها.

## واتساب عبر Meta

أضف:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE=ar`
- `WHATSAPP_GRAPH_VERSION`

يجب أن يحتوي القالب المعتمد على متغيرين لعنوان الإشعار ونصه. اختبره على رقم داخلي قبل تفعيله للعملاء.

## ربط دومين GoDaddy

1. في Vercel افتح المشروع ثم Settings > Domains.
2. أضف `u89des.com` و`www.u89des.com`.
3. اختر أحدهما أساسياً واجعل الآخر يعيد التوجيه إليه.
4. انسخ سجلات DNS التي يعرضها Vercel للمشروع نفسه.
5. في GoDaddy افتح Domain Portfolio ثم DNS.
6. احفظ لقطة من السجلات الحالية، خصوصاً MX وTXT الخاصة بالبريد.
7. أضف أو عدل سجل A للاسم `@` حسب قيمة Vercel.
8. أضف أو عدل سجل CNAME للاسم `www` حسب قيمة Vercel.
9. أضف TXT فقط إذا طلب Vercel التحقق من الملكية.
10. لا تحذف MX أو TXT الخاصة بالبريد.
11. ارجع إلى Vercel واضغط Refresh حتى تظهر حالة Valid Configuration.

مرجع Vercel الرسمي: [إعداد دومين مخصص](https://vercel.com/docs/domains/set-up-custom-domain)

## اختبار قبول الإنتاج

نفذ الاختبار التالي بحسابات منفصلة، وليس بمعاينة الأدوار:

1. أرسل طلباً من نافذة متصفح خاصة.
2. ادخل كمالك واقبل الطلب.
3. ادخل كعميل وأكمل البريف.
4. اعتمد البريف كمالك وحدد قيمة العرض والدفعات.
5. وافق على العرض ووقع العقد بحساب العميل.
6. وقع العقد بحساب المالك، ثم تحقق من إنشاء الفواتير.
7. سجل الدفعة الأولى بعد رفع إيصال تجريبي.
8. أنشئ مهمة وأسندها إلى متعاون حقيقي تجريبي.
9. ارفع بروفة من حساب المتعاون واطلب تعديلاً من حساب العميل.
10. ارفع النسخة الثانية واعتمدها.
11. سجل الدفعة الأخيرة وحاول فتح التسليم قبلها للتأكد من أن النظام يمنع ذلك.
12. ارفع ملفات التسليم وافتحها للعميل ثم أكد الاستلام.
13. أنشئ مطالبة متعاون بعملة أجنبية وتأكد من طلب سعر الصرف وقت السداد.
14. اختبر تحديث الصفحة والجوال والوضعين الفاتح والداكن.
15. راجع جدول `activity_events` وتأكد من وجود سجل لكل قرار مهم.

لا تفتح استقبال الطلبات الحقيقية قبل نجاح هذا الاختبار كاملاً.

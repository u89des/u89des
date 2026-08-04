import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bell,
  Briefcase,
  CalendarBlank,
  CaretDown,
  ChartLineUp,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  Coins,
  Command,
  FileArrowUp,
  FileText,
  FloppyDisk,
  FolderOpen,
  Globe,
  Handshake,
  House,
  Invoice,
  List,
  LockKey,
  MagnifyingGlass,
  Moon,
  PaperPlaneTilt,
  Plus,
  Receipt,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Sparkle,
  SquaresFour,
  Sun,
  Target,
  Tray,
  UserCircle,
  UserFocus,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react";

const initialProjects = [
  {
    id: 1,
    name: "سيد مندي",
    type: "صناعة علامة",
    client: "شركة الذائقة",
    status: "بانتظار الاعتماد",
    stage: 5,
    next: "اعتماد اتجاه التغليف",
    due: "اليوم، 4:30 م",
    value: "18,500 ر.س",
    image: "/work-mandi.jpg",
    accent: "orange",
  },
  {
    id: 2,
    name: "بخاري أختر",
    type: "تطوير علامة",
    client: "مجموعة أختر",
    status: "قيد التنفيذ",
    stage: 4,
    next: "رفع تطبيقات الواجهة",
    due: "غداً، 11:00 ص",
    value: "14,200 ر.س",
    image: "/work-bukhary.jpg",
    accent: "cyan",
  },
  {
    id: 3,
    name: "مامولا",
    type: "هوية ومحتوى",
    client: "مخابز مامولا",
    status: "مراجعة داخلية",
    stage: 4,
    next: "مراجعة دليل النبرة",
    due: "الخميس، 1:00 م",
    value: "22,000 ر.س",
    image: "/work-mamola.jpg",
    accent: "sand",
  },
];

const stages = ["الطلب", "البريف", "العرض", "العقد", "التنفيذ", "البروفات", "التسليم", "المتابعة"];

const scenarioMilestones = [
  { label: "مراجعة الطلب", role: "owner", section: "requests", description: "راجع بيانات العميل واقبل المشروع لإنشاء البريف المناسب." },
  { label: "تعبئة البريف", role: "client", section: "briefs", description: "ادخل بوابة العميل وأكمل بريف صناعة العلامة." },
  { label: "اعتماد البريف", role: "owner", section: "briefs", description: "راجع إجابات العميل واعتمد النطاق قبل التسعير." },
  { label: "إرسال عرض السعر", role: "owner", section: "documents", description: "راجع النطاق والقيمة والدفعات ثم أرسل العرض." },
  { label: "اعتماد العرض", role: "client", section: "documents", description: "راجع العرض من بوابة العميل ووافق عليه." },
  { label: "توقيع العقد", role: "client", section: "documents", description: "راجع البنود ووقّع العقد التجريبي." },
  { label: "سداد الدفعة الأولى", role: "client", section: "finance", description: "سدد الدفعة الأولى لفتح التنفيذ." },
  { label: "رفع البروفة", role: "collaborator", section: "team", description: "ادخل مساحة المتعاون وارفع البروفة المسندة." },
  { label: "قرار البروفة", role: "client", section: "projects", description: "راجع البروفة واعتمدها أو اطلب تعديلاً." },
  { label: "سداد الدفعة الأخيرة", role: "client", section: "finance", description: "أكمل الدفعة الأخيرة قبل تسليم الملفات." },
  { label: "إطلاق التسليم", role: "owner", section: "projects", description: "أكد اكتمال الحزمة وافتحها للعميل." },
  { label: "تأكيد الاستلام", role: "client", section: "projects", description: "نزّل الحزمة النهائية وأكد استلامها." },
  { label: "المتابعة", role: "client", section: "clients", description: "أرسل تقييم التجربة وأغلق المشروع." },
  { label: "مكتمل", role: "owner", section: "scenario", description: "اكتمل السيناريو وأصبحت كل السجلات مترابطة." },
];

const scenarioRoleLabels = {
  owner: "الإدارة",
  client: "العميل",
  collaborator: "المتعاون",
};

const scenarioToProjectStage = (step) => {
  if (step <= 0) return 0;
  if (step <= 2) return 1;
  if (step <= 4) return 2;
  if (step <= 6) return 3;
  if (step === 7) return 4;
  if (step === 8) return 5;
  if (step <= 11) return 6;
  return 7;
};

const navItems = [
  { id: "overview", label: "نظرة اليوم", icon: SquaresFour },
  { id: "scenario", label: "التجربة الكاملة", icon: Target },
  { id: "projects", label: "المشاريع", icon: FolderOpen },
  { id: "requests", label: "طلبات العملاء", icon: Tray },
  { id: "briefs", label: "البريفات", icon: List },
  { id: "documents", label: "العروض والعقود", icon: FileText },
  { id: "clients", label: "العملاء", icon: UsersThree },
  { id: "finance", label: "الحسابات", icon: Wallet },
  { id: "team", label: "فريق العمل", icon: UserFocus },
  { id: "studio-settings", label: "إعدادات العمل", icon: SlidersHorizontal },
  { id: "site-admin", label: "إدارة الموقع", icon: Globe },
];

const serviceList = [
  ["شخصية العلامة", "نحدد الشخصية التي يتذكرها الناس ويتفاعلون معها."],
  ["تسمية العلامة", "نصنع اسماً مناسباً للتموضع وقابلاً للنمو."],
  ["صناعة العلامة", "نحوّل الفكرة إلى نظام بصري وتجربة متكاملة."],
  ["تطوير العلامة", "نراجع الموجود ونبني مساراً أوضح للمستقبل."],
  ["الخطوط الطباعية", "نصمم صوتاً بصرياً خاصاً يثبت حضور العلامة."],
  ["الاستشارات الإبداعية", "نربط التصميم بالمحتوى والحملات والتجربة."],
];

const defaultBriefTemplates = [
  {
    id: "brief-personality",
    serviceId: "service-1",
    title: "بريف شخصية العلامة",
    description: "يفهم السياق والجمهور والانطباع الحالي، ثم يحدد الشخصية والنبرة المرغوبة.",
    enabled: true,
    sections: [
      { id: "context", title: "السياق والقرار", fields: [
        { id: "project_intro", label: "حدثنا ببساطة عن العلامة وماذا تقدم؟", type: "textarea", required: true },
        { id: "main_goal", label: "ما الهدف الرئيسي من بناء شخصية العلامة؟", type: "textarea", required: true },
        { id: "decision_maker", label: "من صاحب القرار النهائي ونقطة التواصل؟", type: "text", required: true },
      ] },
      { id: "audience", title: "الجمهور والانطباع", fields: [
        { id: "main_audience", label: "من الجمهور الرئيسي؟", type: "textarea", required: true },
        { id: "secondary_audience", label: "هل يوجد جمهور ثانوي مهم؟", type: "textarea", required: false },
        { id: "current_perception", label: "كيف يصف الناس العلامة حالياً؟", type: "textarea", required: false },
        { id: "desired_perception", label: "كيف تريد أن يصفها الناس مستقبلاً؟", type: "textarea", required: true },
      ] },
      { id: "character", title: "الشخصية والنبرة", fields: [
        { id: "human_traits", label: "لو كانت العلامة شخصاً، ما أبرز صفاتها؟", type: "textarea", required: true },
        { id: "tone_voice", label: "ما نبرة الصوت المناسبة؟", type: "multiselect", required: true, options: ["ودودة", "واثقة", "خبيرة", "جريئة", "هادئة", "مرحة"] },
        { id: "avoid", label: "ما الذي يجب ألا تبدو أو تتحدث به العلامة؟", type: "textarea", required: true },
        { id: "brand_word", label: "صف العلامة بكلمة واحدة", type: "text", required: true },
        { id: "references", label: "أرفق أمثلة أو مراجع تعبر عن الاتجاه", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-naming",
    serviceId: "service-2",
    title: "بريف تسمية العلامة",
    description: "يجمع أساس التسمية والاتجاهات اللغوية والقيود قبل البحث وتوليد الأسماء.",
    enabled: true,
    sections: [
      { id: "business", title: "المشروع والفرصة", fields: [
        { id: "project_intro", label: "ما المشروع وماذا يقدم تحديداً؟", type: "textarea", required: true },
        { id: "naming_reason", label: "لماذا تحتاج إلى اسم جديد الآن؟", type: "textarea", required: true },
        { id: "difference", label: "ما القيمة أو الفرق الذي تريد أن يحمله الاسم؟", type: "textarea", required: true },
        { id: "audience", label: "من سيستخدم الاسم أو يتعامل معه؟", type: "textarea", required: true },
      ] },
      { id: "direction", title: "اتجاه الاسم", fields: [
        { id: "language", label: "لغة الاسم المفضلة", type: "select", required: true, options: ["عربي", "إنجليزي", "ثنائي اللغة", "مفتوح للاقتراح"] },
        { id: "style", label: "ما أنواع الأسماء الأقرب لك؟", type: "multiselect", required: false, options: ["وصفي", "مبتكر", "مجازي", "مختصر", "مرتبط بمكان أو قصة", "اسم شخص"] },
        { id: "preferred_words", label: "هل توجد كلمات أو معان تريد الاقتراب منها؟", type: "textarea", required: false },
        { id: "avoid_words", label: "ما الكلمات أو المعاني التي يجب تجنبها؟", type: "textarea", required: true },
      ] },
      { id: "constraints", title: "القيود والاعتماد", fields: [
        { id: "must_include", label: "هل توجد أحرف أو كلمة يجب تضمينها؟", type: "text", required: false },
        { id: "domain", label: "هل توفر نطاق إلكتروني محدد شرط أساسي؟", type: "text", required: false },
        { id: "legal", label: "ما الأسواق أو الدول التي يلزم التحقق فيها؟", type: "textarea", required: false },
        { id: "deadline", label: "متى تحتاج اعتماد الاسم؟", type: "date", required: true },
        { id: "references", label: "أرفق أسماء أو مراجع تحبها مع السبب", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-brand-build",
    serviceId: "service-3",
    title: "بريف صناعة العلامة",
    description: "بريف الهوية الأعمق: المشروع والرسالة والجمهور والشخصية والمخرجات والتفضيلات البصرية.",
    enabled: true,
    sections: [
      { id: "general", title: "معلومات المشروع", fields: [
        { id: "project_intro", label: "حدثنا ببساطة عن مشروعك وماذا يفعل؟", type: "textarea", required: true },
        { id: "field", label: "صف مجال عمل المشروع", type: "textarea", required: true },
        { id: "impact", label: "كيف يحسن المشروع حياة الأفراد أو الشركات؟", type: "textarea", required: true },
        { id: "required", label: "ما المطلوب تنفيذه ضمن هذه المرحلة؟", type: "textarea", required: true },
        { id: "launch", label: "ما التاريخ المتوقع لإطلاق المشروع؟", type: "date", required: true },
      ] },
      { id: "strategy", title: "الرسالة والجمهور", fields: [
        { id: "main_goal", label: "ما الهدف الرئيسي من المشروع؟", type: "textarea", required: true },
        { id: "one_sentence", label: "ما رسالة المشروع في جملة واحدة؟", type: "textarea", required: true },
        { id: "main_audience", label: "من الجمهور الرئيسي؟", type: "textarea", required: true },
        { id: "secondary_audience", label: "هل يوجد جمهور ثانوي؟", type: "textarea", required: false },
        { id: "audience_action", label: "ماذا تتوقع من الجمهور بعد تلقي الرسالة؟", type: "textarea", required: true },
        { id: "personality", label: "ما تصورك لشخصية العلامة ونبرة صوتها؟", type: "textarea", required: true },
      ] },
      { id: "visual", title: "الاتجاه البصري والمخرجات", fields: [
        { id: "likes", label: "ما الذي يعجبك في توجهك البصري الحالي؟", type: "textarea", required: false },
        { id: "dislikes", label: "ما الذي لا يعجبك ولا تريد الاستمرار عليه؟", type: "textarea", required: false },
        { id: "competitors", label: "من المنافسون أو البدائل في السوق؟", type: "textarea", required: true },
        { id: "deliverables", label: "ما التطبيقات والمخرجات المطلوبة عند الإطلاق؟", type: "textarea", required: true },
        { id: "one_word", label: "صف المشروع بكلمة واحدة", type: "text", required: true },
        { id: "references", label: "أرفق الهوية الحالية والمراجع والصور المهمة", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-brand-development",
    serviceId: "service-4",
    title: "بريف تطوير العلامة",
    description: "يرصد ما يجب الحفاظ عليه وما يجب تغييره، ويربط التطوير بهدف تجاري واضح.",
    enabled: true,
    sections: [
      { id: "current", title: "العلامة اليوم", fields: [
        { id: "brand_intro", label: "قدم العلامة الحالية ومنتجاتها أو خدماتها", type: "textarea", required: true },
        { id: "why_now", label: "لماذا تحتاج العلامة إلى التطوير الآن؟", type: "textarea", required: true },
        { id: "what_works", label: "ما الذي يعمل جيداً ويجب الحفاظ عليه؟", type: "textarea", required: true },
        { id: "what_fails", label: "ما الذي لم يعد يعمل أو يسبب مشكلة؟", type: "textarea", required: true },
        { id: "assets_keep", label: "هل توجد أصول أو رموز أو ألوان لا تريد فقدها؟", type: "textarea", required: false },
      ] },
      { id: "future", title: "الاتجاه القادم", fields: [
        { id: "business_goal", label: "ما الهدف التجاري الذي يجب أن يخدمه التطوير؟", type: "textarea", required: true },
        { id: "audience", label: "من الجمهور الحالي والجمهور الذي تريد الوصول إليه؟", type: "textarea", required: true },
        { id: "current_perception", label: "كيف ينظر السوق إلى العلامة الآن؟", type: "textarea", required: false },
        { id: "desired_perception", label: "ما الانطباع المطلوب بعد التطوير؟", type: "textarea", required: true },
      ] },
      { id: "scope", title: "النطاق والقيود", fields: [
        { id: "touchpoints", label: "ما أهم نقاط الاتصال التي تحتاج التغيير؟", type: "multiselect", required: true, options: ["الشعار", "التغليف", "الموقع", "المتجر", "المحتوى", "العروض والمطبوعات"] },
        { id: "constraints", label: "ما القيود القانونية أو التشغيلية أو التقنية؟", type: "textarea", required: false },
        { id: "launch", label: "متى يجب إطلاق النسخة المطورة؟", type: "date", required: true },
        { id: "references", label: "أرفق ملفات العلامة الحالية وأمثلة التطوير المرجعية", type: "file", required: true },
      ] },
    ],
  },
  {
    id: "brief-typeface",
    serviceId: "service-5",
    title: "بريف الخطوط الطباعية",
    description: "يحدد وظيفة الخط ولغاته وبيئات استخدامه وشخصيته ومتطلباته التقنية.",
    enabled: true,
    sections: [
      { id: "purpose", title: "الهدف والاستخدام", fields: [
        { id: "project_intro", label: "ما العلامة أو المشروع الذي سيستخدم الخط؟", type: "textarea", required: true },
        { id: "purpose", label: "ما المشكلة التي يجب أن يحلها الخط؟", type: "textarea", required: true },
        { id: "languages", label: "ما اللغات المطلوبة؟", type: "multiselect", required: true, options: ["العربية", "الإنجليزية", "الفرنسية", "لغات أخرى"] },
        { id: "audience", label: "من سيقرأ أو يستخدم هذا الخط؟", type: "textarea", required: true },
      ] },
      { id: "function", title: "الوظيفة التقنية", fields: [
        { id: "uses", label: "ما الاستخدامات الأساسية؟", type: "multiselect", required: true, options: ["شعار", "عناوين", "نصوص طويلة", "تغليف", "واجهات رقمية", "لوحات مكانية"] },
        { id: "environments", label: "أين سيعمل الخط؟", type: "multiselect", required: true, options: ["طباعة", "ويب", "تطبيق", "شاشات", "لافتات"] },
        { id: "characters", label: "هل توجد محارف أو أرقام أو رموز خاصة؟", type: "textarea", required: false },
        { id: "formats", label: "ما صيغ التسليم أو المتطلبات التقنية؟", type: "textarea", required: false },
      ] },
      { id: "character", title: "الشخصية والمرجع", fields: [
        { id: "personality", label: "ما الصفات التي يجب أن يعبر عنها الخط؟", type: "textarea", required: true },
        { id: "legibility", label: "ما أولوية الوضوح مقارنة بالتعبير؟", type: "scale", required: true },
        { id: "licensing", label: "من سيستخدم الخط وما نطاق الترخيص المطلوب؟", type: "textarea", required: true },
        { id: "deadline", label: "متى يلزم الاختبار أو التسليم؟", type: "date", required: true },
        { id: "references", label: "أرفق خطوطاً أو تطبيقات مرجعية", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-consulting",
    serviceId: "service-6",
    title: "بريف الاستشارة الإبداعية",
    description: "يحول المشكلة المفتوحة إلى قرار واضح ومخرجات استشارية قابلة للتنفيذ.",
    enabled: true,
    sections: [
      { id: "challenge", title: "التحدي والقرار", fields: [
        { id: "main_problem", label: "ما المشكلة أو الفرصة التي تريد العمل عليها؟", type: "textarea", required: true },
        { id: "decision", label: "ما القرار الذي تحتاج إلى اتخاذه؟", type: "textarea", required: true },
        { id: "why_now", label: "لماذا هذا الموضوع مهم الآن؟", type: "textarea", required: true },
        { id: "stakeholders", label: "من أصحاب المصلحة وصاحب القرار النهائي؟", type: "textarea", required: true },
      ] },
      { id: "context", title: "المعطيات والقيود", fields: [
        { id: "tried", label: "ما الذي جربتموه حتى الآن وما نتيجته؟", type: "textarea", required: false },
        { id: "evidence", label: "ما البيانات أو آراء العملاء المتاحة؟", type: "textarea", required: false },
        { id: "constraints", label: "ما القيود الزمنية أو المالية أو التشغيلية؟", type: "textarea", required: true },
        { id: "files", label: "أرفق المواد والتقارير ذات الصلة", type: "file", required: false },
      ] },
      { id: "outcome", title: "النتيجة المطلوبة", fields: [
        { id: "expected_outcome", label: "ما النتيجة التي تريد الخروج بها؟", type: "textarea", required: true },
        { id: "deliverable", label: "ما شكل المخرج الأنسب لك؟", type: "select", required: true, options: ["جلسة وملخص قرارات", "تقرير وتوصيات", "خارطة طريق", "ورشة عمل", "مراجعة وتوجيه"] },
        { id: "success", label: "كيف سنعرف أن الاستشارة نجحت؟", type: "textarea", required: true },
        { id: "deadline", label: "متى تحتاج القرار أو المخرج؟", type: "date", required: true },
      ] },
    ],
  },
];

const reusableBriefTemplates = [
  {
    id: "brief-single-output",
    serviceId: "any",
    title: "بريف مخرج واحد",
    description: "نسخة سريعة لقطعة واحدة مثل منشور أو تقرير أو كتيب أو إنفوجرافيك.",
    enabled: true,
    sections: [
      { id: "request", title: "الطلب", fields: [
        { id: "design_type", label: "ما نوع المخرج المطلوب؟", type: "select", required: true, options: ["منشور", "إنفوجرافيك", "تقرير", "كتيب", "عرض تقديمي", "أخرى"] },
        { id: "decision_maker", label: "من نقطة التواصل وصاحب الاعتماد؟", type: "text", required: true },
        { id: "importance", label: "ما درجة أهمية الطلب؟", type: "scale", required: true },
        { id: "deadline", label: "متى يلزم اكتمال التصميم؟", type: "date", required: true },
      ] },
      { id: "content", title: "المحتوى والنتيجة", fields: [
        { id: "goal", label: "ما الهدف الرئيسي من التصميم؟", type: "textarea", required: true },
        { id: "required_content", label: "ما المعلومات التي يجب أن يتضمنها؟", type: "textarea", required: true },
        { id: "channel", label: "أين سيستخدم المخرج وما مقاسه؟", type: "textarea", required: true },
        { id: "files", label: "أرفق النصوص والصور والهوية اللازمة", type: "file", required: true },
      ] },
    ],
  },
  {
    id: "brief-campaign",
    serviceId: "any",
    title: "بريف حملة إبداعية",
    description: "قالب للحملات يربط الهدف والجمهور والقنوات والمخرجات ومؤشرات النجاح.",
    enabled: true,
    sections: [
      { id: "summary", title: "ملخص الحملة", fields: [
        { id: "campaign_name", label: "ما اسم الحملة أو عنوانها المؤقت؟", type: "text", required: true },
        { id: "decision_maker", label: "من نقطة التواصل وصاحب الاعتماد؟", type: "text", required: true },
        { id: "importance", label: "ما درجة أهمية الحملة؟", type: "scale", required: true },
        { id: "launch", label: "ما تاريخ إطلاق الحملة؟", type: "date", required: true },
        { id: "goal", label: "ما الهدف الرئيسي من الحملة؟", type: "textarea", required: true },
      ] },
      { id: "audience", title: "الجمهور والرسالة", fields: [
        { id: "main_audience", label: "من الجمهور المستهدف؟", type: "textarea", required: true },
        { id: "secondary_audience", label: "هل يوجد جمهور ثانوي؟", type: "textarea", required: false },
        { id: "tone", label: "ما نبرة الصوت المقترحة؟", type: "textarea", required: true },
        { id: "value", label: "ما القيمة التي تضيفها الحملة؟", type: "textarea", required: true },
        { id: "problem", label: "ما المشكلة التي ستحلها الحملة؟", type: "textarea", required: true },
      ] },
      { id: "delivery", title: "التواصل والقياس", fields: [
        { id: "communication_objective", label: "ما هدف التواصل؟", type: "multiselect", required: true, options: ["وعي عام", "مشاركة أولية", "اكتساب", "بيع", "توسيع", "بناء علاقات", "متابعة", "تعليم"] },
        { id: "channels", label: "ما قنوات التواصل المطلوبة؟", type: "multiselect", required: true, options: ["مطبوعات", "فيديو", "بريد", "إعلانات خارجية", "منصات رقمية", "داخل الفروع", "رعاية"] },
        { id: "deliverables", label: "ما المخرجات والكميات المطلوبة؟", type: "textarea", required: true },
        { id: "must_include", label: "ما المعلومات التي يجب تضمينها؟", type: "textarea", required: true },
        { id: "success", label: "ما مؤشرات نجاح الحملة؟", type: "textarea", required: true },
        { id: "budget", label: "ما الميزانية المتوقعة؟", type: "text", required: false },
        { id: "files", label: "أرفق المواد المرجعية والمحتوى المتاح", type: "file", required: false },
      ] },
    ],
  },
];

const defaultSiteContent = {
  heroTitle: "نصنع علامات يصعب تجاوزها.",
  heroBody: "من الاستراتيجية والتسمية إلى الهوية والتجربة، نبني علامة واضحة تعيش في ذهن الناس وتعمل في السوق.",
  heroCta: "اطلب مشروعك",
  servicesTitle: "كل ما تحتاجه العلامة لتبدأ بوضوح.",
  workTitle: "علامات صممنا لها حضوراً خاصاً.",
  finalTitle: "مشروعك القادم يبدأ بسؤال جيد.",
  email: "w@u89des.com",
  phone: "+966 555 8 777 33",
  domain: "U89DES.COM",
  seoTitle: "U89 | صناعة وتطوير العلامات",
  seoDescription: "استوديو سعودي لصناعة وتسمية وتطوير العلامات التجارية والخطوط الطباعية.",
  indexable: true,
  acceptingRequests: true,
  requireBudget: true,
  requireDeadline: false,
  ownerNameAr: "عبد الوهاب بن سليمان السويد",
  ownerNameEn: "Abdulwahab Suliman Alsaweed",
  bankName: "مصرف الراجحي",
  bankAccount: "418608010094429",
  bankIban: "SA1480000418608010094429",
  vatRegistered: false,
  defaultCurrency: "SAR",
  collaboratorCurrencies: ["SAR", "USD", "EUR"],
  quoteValidityDays: 10,
  firstProofDays: 14,
  revisionRounds: "يحدد لكل مشروع",
  revisionDays: 7,
  restartDays: 10,
  finalizationDays: 14,
  services: serviceList.map(([title, description], index) => ({ id: `service-${index + 1}`, title, description, active: true })),
  briefTemplates: [...defaultBriefTemplates, ...reusableBriefTemplates],
  requestQuestions: [
    { id: "goal", label: "ما الذي تريد تحقيقه؟", type: "textarea", required: true, enabled: true },
    { id: "audience", label: "من الجمهور الذي تريد الوصول إليه؟", type: "textarea", required: false, enabled: true },
    { id: "budget", label: "الميزانية المتوقعة", type: "select", required: true, enabled: true, options: ["أقل من 10,000 ر.س", "10,000 إلى 25,000 ر.س", "25,000 إلى 50,000 ر.س", "أكثر من 50,000 ر.س"] },
    { id: "deadline", label: "الموعد المستهدف", type: "date", required: false, enabled: true },
  ],
  paymentPlans: [
    { id: "two-50", label: "دفعتان 50% / 50%", percentages: [50, 50] },
    { id: "three-40", label: "ثلاث دفعات 40% / 30% / 30%", percentages: [40, 30, 30] },
  ],
  serviceVisibility: [true, true, true, true, true, true],
  workVisibility: [true, true, true],
  maintenance: false,
  sectionVisibility: {
    statement: true,
    services: true,
    method: true,
    work: true,
    about: true,
  },
};

const retainerRequests = [
  { id: 1, title: "حملة افتتاح فرع العليا", client: "قصر التوابل", assignee: "ريم", due: "7 أغسطس", status: "جديد" },
  { id: 2, title: "منشورات العودة للمدارس", client: "أصناف", assignee: "مازن", due: "9 أغسطس", status: "يعمل عليه" },
  { id: 3, title: "تحديث قائمة المنتجات", client: "مامولا", assignee: "غير مسند", due: "11 أغسطس", status: "بانتظار الإسناد" },
  { id: 4, title: "إعلان منتج موسمي", client: "قصر التوابل", assignee: "ريم", due: "14 أغسطس", status: "مراجعة" },
];

const incomingProjectRequests = [
  { id: "REQ-0318", client: "شركة مدار", contact: "نورة العبدالله", service: "صناعة العلامة", serviceId: "service-3", project: "هوية منصة مدار", received: "منذ 45 دقيقة", status: "يحتاج قرارك" },
  { id: "REQ-0317", client: "نُزل أصيل", contact: "فهد السبيعي", service: "تسمية العلامة", serviceId: "service-2", project: "تسمية مشروع ضيافة", received: "أمس", status: "بانتظار معلومات" },
];

const defaultScenario = {
  id: "LIVE-0001",
  step: 0,
  createdAt: "5 أغسطس 2026",
  source: "نموذج الموقع",
  client: {
    name: "شهد القحطاني",
    company: "شركة سُرى للتقنية",
    email: "shahad@sura.sa",
    phone: "+966 55 410 7826",
    communication: "واتساب",
    notifications: "واتساب والبريد",
  },
  project: {
    name: "هوية منصة سُرى",
    serviceId: "service-3",
    service: "صناعة العلامة",
    goal: "إطلاق منصة تساعد العائلات على تنظيم الرحلات المحلية واكتشاف التجارب الموثوقة.",
    audience: "العائلات الشابة في المدن السعودية.",
    budget: "25,000 إلى 50,000 ر.س",
    deadline: "2026-11-15",
  },
  briefAnswers: {},
  quote: {
    id: "Q-0501",
    amount: "32000",
    currency: "SAR",
    paymentPlan: "two-50",
    scope: "استراتيجية مختصرة للعلامة، نظام هوية بصري، دليل استخدام، و8 تطبيقات للإطلاق.",
    validityDays: 10,
  },
  contract: { id: "C-0124", signedAt: null },
  payments: { first: false, final: false },
  collaborator: { name: "ريم السالم", task: "تطوير الاتجاه البصري وتجهيز بروفة الهوية", due: "12 أغسطس 2026" },
  proof: { version: 1, status: "لم ترفع", revisionNote: "" },
  delivery: { released: false, received: false },
  feedback: { rating: 0, note: "" },
  activity: [
    { label: "أرسلت شهد طلب صناعة العلامة من الموقع", actor: "العميل", at: "الآن" },
  ],
};

function scenarioFromRequest(data, settings) {
  const service = settings.services.find((item) => item.id === data.serviceId);
  return {
    ...defaultScenario,
    id: `LIVE-${String(Date.now()).slice(-4)}`,
    createdAt: "الآن",
    client: {
      name: data.name || "عميل جديد",
      company: data.organization || "منشأة جديدة",
      email: data.email || "",
      phone: data.phone || "",
      communication: data.communication || "واتساب",
      notifications: data.notifications || "واتساب",
    },
    project: {
      ...defaultScenario.project,
      name: data.project || `مشروع ${data.organization || "جديد"}`,
      serviceId: data.serviceId || "service-3",
      service: service?.title || "صناعة العلامة",
      goal: data.goal || "بانتظار مراجعة تفاصيل الطلب.",
      audience: data.audience || "لم يحدد بعد",
      budget: data.budget || "لم يحدد",
      deadline: data.deadline || "غير محدد",
    },
    activity: [{ label: `أرسل ${data.name || "العميل"} طلباً جديداً من الموقع`, actor: "العميل", at: "الآن" }],
  };
}

const initialBriefs = [
  { id: "BRF-0243", requestId: "REQ-0318", templateId: "brief-brand-build", client: "شركة مدار", contact: "نورة العبدالله", project: "هوية منصة مدار", service: "صناعة العلامة", status: "جاهز لمراجعتك", answered: 15, total: 17, updated: "منذ 12 دقيقة", answers: { project_intro: "منصة تربط أصحاب المشاريع بالمختصين المحليين.", field: "خدمات مهنية رقمية موجهة للسوق السعودي.", impact: "تختصر البحث وتزيد الثقة في اختيار مقدم الخدمة.", required: "الاستراتيجية والهوية البصرية وتطبيقات الإطلاق الأساسية.", launch: "2026-11-01", main_goal: "بناء علامة موثوقة تسهل الاختيار وتقلل التردد.", one_sentence: "المختص المناسب أقرب مما تتوقع.", main_audience: "أصحاب المشاريع الصغيرة في مرحلة التأسيس.", secondary_audience: "المختصون المستقلون ومكاتب الخدمات.", audience_action: "إنشاء طلب والتواصل مع مختص مناسب.", personality: "قريبة وواثقة وعملية من دون تعقيد.", likes: "وضوح المنتج وسهولة الوصول إلى الخدمة.", competitors: "منصات العمل الحر والأدلة المهنية المحلية.", deliverables: "هوية أساسية وواجهة إطلاق وقوالب تواصل.", one_word: "تمكين" } },
  { id: "BRF-0242", requestId: "REQ-0316", templateId: "brief-naming", client: "نُزل أصيل", contact: "فهد السبيعي", project: "تسمية مشروع ضيافة", service: "تسمية العلامة", status: "بانتظار إجابة العميل", answered: 5, total: 13, updated: "أرسل أمس", answers: { project_intro: "تجربة ضيافة ريفية في منطقة عسير.", naming_reason: "نحتاج اسماً مستقلاً قبل الإطلاق والحجز المباشر.", difference: "ضيافة هادئة مرتبطة بطبيعة عسير وثقافتها.", audience: "العائلات والأزواج الباحثون عن إقامة ريفية نوعية.", language: "عربي" } },
  { id: "BRF-0241", requestId: "REQ-0315", templateId: "brief-campaign", client: "قصر التوابل", contact: "سلمان الشمري", project: "حملة افتتاح فرع العليا", service: "حملة إبداعية", status: "معتمد", answered: 17, total: 17, updated: "3 أغسطس", answers: { campaign_name: "افتتاح العليا", decision_maker: "سلمان الشمري", importance: "5", launch: "2026-08-20", goal: "رفع الوعي بالفرع الجديد وتحفيز الزيارة خلال أسبوع الافتتاح.", main_audience: "العائلات وسكان الأحياء القريبة.", secondary_audience: "موظفو الشركات والزوار في منطقة العليا.", tone: "مرحبة وغنية بالنكهة من دون مبالغة.", value: "تجربة قريبة تجمع النكهة المعروفة مع موقع أسهل.", problem: "ضعف معرفة الجمهور بوجود الفرع الجديد.", communication_objective: ["وعي عام", "اكتساب"], channels: ["منصات رقمية", "داخل الفروع"], deliverables: "فيديو قصير و6 منشورات وشاشات داخل الفرع.", must_include: "الموقع وساعات العمل وعرض الافتتاح.", success: "الزيارات واستخدام رمز الحملة.", budget: "35,000 ر.س", files: "4 ملفات مرفوعة" } },
];

const invoices = [
  { id: "INV-2408", client: "شركة الذائقة", project: "سيد مندي", amount: "9,250", currency: "SAR", due: "8 أغسطس", status: "مستحقة", type: "فاتورة غير ضريبية" },
  { id: "INV-2394", client: "مجموعة أختر", project: "بخاري أختر", amount: "7,100", currency: "SAR", due: "12 أغسطس", status: "مجدولة", type: "فاتورة غير ضريبية" },
  { id: "INV-2378", client: "مخابز مامولا", project: "عقد أغسطس", amount: "6,500", currency: "SAR", due: "تم التحصيل", status: "مدفوعة", type: "فاتورة غير ضريبية" },
];

const collaboratorBills = [
  { id: "COL-014", collaborator: "ريم السالم", project: "سيد مندي", item: "3 تطبيقات هوية", amount: "1,050", currency: "SAR", status: "بانتظار الاعتماد" },
  { id: "COL-015", collaborator: "Lina Moretti", project: "مامولا", item: "معالجة 4 صور", amount: "220", currency: "USD", status: "مستحقة" },
  { id: "COL-016", collaborator: "Marc Vidal", project: "بخاري أختر", item: "موك أب واجهة", amount: "180", currency: "EUR", status: "مدفوعة" },
];

const initialDocuments = [
  { id: "Q-0482", type: "quote", title: "عرض سعر", client: "شركة أصناف للتجارة", contact: "أحمد البشري", project: "صناعة علامة وهوية بصرية", amount: "10850", currency: "SAR", paymentPlan: "two-50", status: "مسودة", updated: "اليوم" },
  { id: "C-0118", type: "contract", title: "عقد تقديم خدمات إبداعية", client: "مجموعة أختر", contact: "خالد أختر", project: "تطوير العلامة", amount: "14200", currency: "SAR", paymentPlan: "three-40", status: "يحتاج مراجعتك", updated: "منذ ساعتين" },
  { id: "Q-0479", type: "quote", title: "عرض سعر", client: "خلية فارس", contact: "ياسر المحيميد", project: "صناعة علامة تجارية وهوية بصرية", amount: "3000", currency: "SAR", paymentPlan: "two-50", status: "معتمد", updated: "30 أكتوبر" },
];

const team = [
  { name: "ريم السالم", role: "مصممة علامات", load: "3 مهام", focus: "قصر التوابل" },
  { name: "مازن الحربي", role: "مصمم محتوى", load: "2 مهام", focus: "أصناف" },
  { name: "سارة العتيبي", role: "كاتبة محتوى", load: "مهمة واحدة", focus: "مامولا" },
];

function Logo({ compact = false, onClick }) {
  const content = <><span>U89</span>{!compact && <small>استوديو العلامة</small>}</>;
  if (onClick) {
    return <button className={`brand-mark ${compact ? "compact" : ""}`} aria-label="العودة إلى موقع U89" onClick={onClick}>{content}</button>;
  }
  return <div className={`brand-mark ${compact ? "compact" : ""}`} aria-label="U89">{content}</div>;
}

function IconButton({ label, children, onClick, active = false }) {
  return (
    <button className={`icon-button ${active ? "active" : ""}`} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function ThemeButton({ theme, onToggle }) {
  return (
    <IconButton label={theme === "dark" ? "استخدام الوضع الفاتح" : "استخدام الوضع الداكن"} onClick={onToggle}>
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </IconButton>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle size={20} weight="fill" />
      <span>{message}</span>
    </div>
  );
}

function Modal({ title, children, onClose, size = "normal" }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section className={`modal-panel ${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <IconButton label="إغلاق" onClick={onClose}><X size={20} /></IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}

function ServiceRequestModal({ onClose, onSubmit, settings }) {
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSent(true);
    onSubmit(data);
  };

  return (
    <Modal title="ابدأ مشروعك" onClose={onClose}>
      {sent ? (
        <div className="success-state">
          <CheckCircle size={46} weight="fill" />
          <h3>وصل الطلب بوضوح</h3>
          <p>ستصلك خلال يوم عمل دعوة لمساحة مشروعك، ومعها الخطوة التالية فقط.</p>
          <button className="button primary" onClick={onClose}>تم</button>
        </div>
      ) : (
        <form className="request-form" onSubmit={submit}>
          <div className="field-row">
            <label>الاسم<input name="name" required placeholder="اسمك الكامل" /></label>
            <label>اسم المنشأة<input name="organization" required placeholder="اسم العلامة أو المنشأة" /></label>
          </div>
          <div className="field-row">
            <label>البريد الإلكتروني<input name="email" type="email" required dir="ltr" placeholder="name@company.com" /></label>
            <label>رقم الجوال<input name="phone" type="tel" required dir="ltr" placeholder="+966 5X XXX XXXX" /></label>
          </div>
          <div className="field-row">
            <label>التواصل المفضل<select name="communication" required defaultValue="واتساب"><option value="واتساب">واتساب</option><option value="البريد الإلكتروني">البريد الإلكتروني</option><option value="اتصال هاتفي">اتصال هاتفي</option></select></label>
            <label>إشعارات المشروع<select name="notifications" required defaultValue="واتساب"><option value="واتساب">واتساب</option><option value="البريد الإلكتروني">البريد الإلكتروني</option><option value="واتساب والبريد">واتساب والبريد</option></select></label>
          </div>
          <label>الخدمة المطلوبة
            <select name="serviceId" required defaultValue=""><option value="" disabled>اختر الخدمة</option>{(settings.services || []).filter((service) => service.active).map((service) => <option value={service.id} key={service.id}>{service.title}</option>)}</select>
          </label>
          <label>اسم المشروع أو العلامة<input name="project" required placeholder="مثال: هوية منصة سُرى" /></label>
          {(settings.requestQuestions || []).filter((question) => question.enabled).map((question) => <label key={question.id}>{question.label}
            {question.type === "textarea" && <textarea name={question.id} required={question.required} rows="4" placeholder="اكتب التفاصيل التي تساعدنا على فهم الطلب" />}
            {question.type === "date" && <input name={question.id} type="date" required={question.required} />}
            {question.type === "text" && <input name={question.id} type="text" required={question.required} />}
            {question.type === "select" && <select name={question.id} required={question.required} defaultValue=""><option value="" disabled>اختر الإجابة</option>{(question.options || []).map((option) => <option key={option}>{option}</option>)}</select>}
          </label>)}
          <label className="consent-field"><input type="checkbox" required /><span>أوافق على التواصل وإرسال إشعارات الطلب عبر القناة التي اخترتها.</span></label>
          <div className="form-note"><ShieldCheck size={19} /> تحفظ معلوماتك داخل مساحة خاصة بالمشروع.</div>
          <button className="button primary full" type="submit">إرسال الطلب <ArrowLeft size={18} /></button>
        </form>
      )}
    </Modal>
  );
}

function AccessModal({ onClose, onEnter }) {
  return (
    <Modal title="دخول المنصة" onClose={onClose} size="compact">
      <div className="access-panel">
        <p>كل مستخدم يدخل إلى مساحته الخاصة فقط. الخيارات هنا لعرض النموذج التجريبي.</p>
        <button onClick={() => onEnter("client")}><UserCircle size={24} /><span><strong>بوابة العميل</strong><small>المشاريع والبروفات والطلبات والفواتير</small></span><ArrowLeft size={18} /></button>
        <button onClick={() => onEnter("collaborator")}><UserFocus size={24} /><span><strong>مساحة المتعاون</strong><small>المهام والملفات والتسليمات المسندة</small></span><ArrowLeft size={18} /></button>
        <button onClick={() => onEnter("owner")}><LockKey size={24} /><span><strong>إدارة الاستوديو</strong><small>التشغيل والماليات والموقع والصلاحيات</small></span><ArrowLeft size={18} /></button>
      </div>
    </Modal>
  );
}

function SiteHeader({ theme, onTheme, onAccess, onRequest, acceptingRequests }) {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="التنقل الرئيسي">
        <a href="#services">الخدمات</a>
        <a href="#work">الأعمال</a>
        <a href="#about">عن U89</a>
      </nav>
      <div className="header-actions">
        <ThemeButton theme={theme} onToggle={onTheme} />
        <button className="button ghost header-login" onClick={onAccess}>دخول المنصة</button>
        <button className="button primary" onClick={onRequest} disabled={!acceptingRequests}>{acceptingRequests ? "اطلب مشروعك" : "الطلبات متوقفة"}</button>
      </div>
    </header>
  );
}

function BrandShowcase() {
  return (
    <div className="brand-showcase" aria-label="مجموعة من أعمال U89">
      <img className="showcase-main" src="/work-mandi.jpg" alt="تطبيقات علامة سيد مندي" />
      <img className="showcase-top" src="/work-bukhary.jpg" alt="تطبيقات علامة بخاري أختر" />
      <img className="showcase-bottom" src="/work-mamola.jpg" alt="تطبيقات علامة مامولا" />
      <div className="showcase-signature"><span>15+</span><small>سنة من التصميم<br />والبحث والتطوير</small></div>
    </div>
  );
}

function LandingPage({ theme, onTheme, onAccess, onRequest, content }) {
  const visible = content.sectionVisibility;
  if (content.maintenance) {
    return <div className="site-page maintenance-page"><header className="site-header"><Logo /><div /><div className="header-actions"><ThemeButton theme={theme} onToggle={onTheme} /><button className="button ghost header-login" onClick={onAccess}>دخول المنصة</button></div></header><main><Sparkle size={34} weight="fill" /><span>U89 Brand Studio</span><h1>نعيد ترتيب المساحة.</h1><p>الموقع التعريفي تحت تحديث قصير. مساحة العملاء والإدارة تعمل كالمعتاد.</p><button className="button ghost" onClick={onAccess}>دخول المنصة <ArrowLeft size={18} /></button></main></div>;
  }
  return (
    <div className="site-page">
      <SiteHeader theme={theme} onTheme={onTheme} onAccess={onAccess} onRequest={onRequest} acceptingRequests={content.acceptingRequests} />
      <main>
        <section className="hero-section marketing-hero">
          <div className="hero-copy rise-in">
            <span className="hero-kicker">U89 Brand Studio</span>
            <h1>{content.heroTitle}</h1>
            <p>{content.heroBody}</p>
            <div className="hero-actions">
              <button className="button primary large" onClick={onRequest} disabled={!content.acceptingRequests}>{content.acceptingRequests ? content.heroCta : "جدول المشاريع ممتلئ حالياً"} <ArrowLeft size={20} /></button>
              <a className="text-link" href="#work">شاهد أعمالنا <ArrowUpLeft size={18} /></a>
            </div>
          </div>
          <div className="hero-visual rise-in delay-1"><BrandShowcase /></div>
        </section>

        {visible.statement && <section className="statement-section">
          <p>خبرة تتجاوز 15 سنة في تحويل السؤال الإبداعي إلى علامة قابلة للحياة.</p>
          <div className="statement-rule" />
          <p>نبحث عن المعنى أولاً، ثم نصنع له اسماً وصوتاً وشكلاً يصعب تقليده.</p>
        </section>}

        {visible.services && <section className="services-section" id="services">
          <div className="section-heading">
            <h2>{content.servicesTitle}</h2>
            <p>نبدأ من جوهر العلامة، ثم نبني كل ما يجعلها مفهومة ومتماسكة وقابلة للنمو.</p>
          </div>
          <div className="services-mosaic">
            {(content.services || []).map((service, index) => service.active && (
              <article className={`service-item item-${index + 1}`} key={service.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>}

        {visible.method && <section className="method-section">
          <div className="method-intro"><Sparkle size={30} weight="fill" /><h2>لا نبدأ بالشعار.</h2><p>نبدأ بالسؤال الذي يغيّر طريقة رؤية الناس للعلامة.</p></div>
          <div className="method-points">
            <article><span>نفهم</span><h3>الشخصية والسوق والفرصة.</h3><p>نبحث عما يجب أن تمثله العلامة، ولمن، ولماذا ستهمهم.</p></article>
            <article><span>نصوغ</span><h3>الفكرة والاسم والتموضع.</h3><p>نحوّل البحث إلى قرار واضح يمكن أن يبنى عليه كل شيء.</p></article>
            <article><span>نعبّر</span><h3>بهوية لها صوت وحضور.</h3><p>نصمم نظاماً بصرياً يعيش بثبات عبر المنتج والمكان والتواصل.</p></article>
          </div>
        </section>}

        {visible.work && <section className="work-section" id="work">
          <div className="work-intro">
            <h2>{content.workTitle}</h2>
            <p>نماذج مختارة لعلامات صنعت من الطعام والثقافة والمكان تجربة متماسكة يمكن تذكرها.</p>
          </div>
          <div className="work-grid">
            {content.workVisibility[0] && <figure className="work-main"><img src="/work-mandi.jpg" alt="تطبيقات علامة سيد مندي" /><figcaption><span>سيد مندي</span><small>صناعة علامة وتغليف</small></figcaption></figure>}
            {content.workVisibility[1] && <figure><img src="/work-bukhary.jpg" alt="تطبيقات علامة بخاري أختر" /><figcaption><span>بخاري أختر</span><small>تطوير علامة</small></figcaption></figure>}
            {content.workVisibility[2] && <figure><img src="/work-mamola.jpg" alt="تطبيقات علامة مامولا" /><figcaption><span>مامولا</span><small>هوية ومحتوى</small></figcaption></figure>}
          </div>
        </section>}

        {visible.about && <section className="studio-about" id="about">
          <div className="about-mark">U89<span /></div>
          <div><h2>فضول قديم، وخبرة تعرف أين تبحث.</h2><p>بدأت الحكاية من مراقبة لوحات المحلات وفهم أثرها على الناس. اليوم نضع هذه الخبرة بين يدي كل علامة تريد أن تقول شيئاً واضحاً ومختلفاً.</p><a className="text-link" href={`mailto:${content.email}`}>تحدث معنا <ArrowLeft size={18} /></a></div>
        </section>}

        <section className="final-cta">
          <div><span>لديك فكرة أو علامة تحتاج اتجاهاً أوضح؟</span><h2>{content.finalTitle}</h2></div>
          <button className="button primary large" onClick={onRequest} disabled={!content.acceptingRequests}>{content.acceptingRequests ? content.heroCta : "جدول المشاريع ممتلئ حالياً"} <ArrowLeft size={20} /></button>
        </section>
      </main>
      <footer className="site-footer">
        <Logo />
        <div><a href={`mailto:${content.email}`}>{content.email}</a><a href={`tel:${content.phone.replace(/\s/g, "")}`}>{content.phone}</a></div>
        <button className="footer-access" onClick={onAccess}>دخول المنصة</button>
      </footer>
    </div>
  );
}

function StageTrack({ current }) {
  return (
    <div className="stage-track" aria-label={`المرحلة الحالية: ${stages[current]}`}>
      {stages.map((stage, index) => (
        <div className={`stage ${index < current ? "done" : ""} ${index === current ? "current" : ""}`} key={stage}>
          <span>{index < current ? <Check size={13} weight="bold" /> : index + 1}</span>
          <small>{stage}</small>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, note, icon: Icon }) {
  return (
    <article className="metric">
      <div className="metric-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function ScenarioCenter({ scenario, onReset, setSection, setRole }) {
  const current = scenarioMilestones[Math.min(scenario.step, scenarioMilestones.length - 1)];
  const jumpToAction = () => {
    if (current.role === "owner") {
      setRole("owner");
      setSection(current.section);
      return;
    }
    setRole(current.role);
  };
  return (
    <div className="dashboard-content page-stack scenario-page">
      <div className="page-title scenario-title">
        <div><span className="scenario-live-label"><Sparkle size={15} weight="fill" /> تجربة مترابطة</span><h1>جرّب المشروع من الطلب إلى المتابعة.</h1><p>كل إجراء هنا ينعكس مباشرة على الإدارة والعميل والمتعاون، ويبقى محفوظاً بعد تحديث الصفحة.</p></div>
        <button className="button ghost" onClick={onReset}><CircleNotch size={18} /> إعادة السيناريو</button>
      </div>

      <section className="scenario-command">
        <div className="scenario-command-main">
          <span>الإجراء التالي عند {scenarioRoleLabels[current.role]}</span>
          <h2>{current.label}</h2>
          <p>{current.description}</p>
          {scenario.step < scenarioMilestones.length - 1 ? <button className="button inverted" onClick={jumpToAction}>انتقل إلى الإجراء <ArrowLeft size={18} /></button> : <button className="button inverted" onClick={() => setSection("projects")}>فتح سجل المشروع <ArrowLeft size={18} /></button>}
        </div>
        <div className="scenario-command-project">
          <small>{scenario.id}</small>
          <strong>{scenario.project.name}</strong>
          <span>{scenario.client.company}</span>
          <StageTrack current={scenarioToProjectStage(scenario.step)} />
          <div className="scenario-progress-copy"><span>التقدم الفعلي</span><b>{Math.min(scenario.step, 13)} من 13</b></div>
          <div className="scenario-progress"><i style={{ width: `${Math.min(100, (scenario.step / 13) * 100)}%` }} /></div>
        </div>
      </section>

      <section className="scenario-grid">
        <div className="panel scenario-timeline-panel">
          <div className="panel-heading"><div><h2>المسار الكامل</h2><p>الخطوة النشطة فقط هي التي تحتاج انتباهك الآن.</p></div><span className="sample-label">حالة مشتركة</span></div>
          <div className="scenario-timeline">
            {scenarioMilestones.slice(0, 13).map((item, index) => <button key={item.label} className={`${index < scenario.step ? "done" : ""} ${index === scenario.step ? "current" : ""}`} onClick={() => { if (index !== scenario.step) return; if (item.role === "owner") setSection(item.section); else setRole(item.role); }} disabled={index !== scenario.step}>
              <span>{index < scenario.step ? <Check size={14} weight="bold" /> : index + 1}</span>
              <div><strong>{item.label}</strong><small>{scenarioRoleLabels[item.role]}</small></div>
              {index === scenario.step && <ArrowLeft size={16} />}
            </button>)}
          </div>
        </div>
        <aside className="scenario-side-stack">
          <section className="panel scenario-facts">
            <div className="panel-heading"><div><h2>بيانات التجربة</h2><p>يمكن تغييرها فعلياً خلال المسار.</p></div></div>
            <dl><div><dt>العميل</dt><dd>{scenario.client.name}</dd></div><div><dt>التواصل</dt><dd>{scenario.client.communication}</dd></div><div><dt>الخدمة</dt><dd>{scenario.project.service}</dd></div><div><dt>القيمة</dt><dd>{Number(scenario.quote.amount).toLocaleString("en-US")} {scenario.quote.currency}</dd></div><div><dt>المتعاون</dt><dd>{scenario.collaborator.name}</dd></div></dl>
          </section>
          <section className="panel scenario-activity">
            <div className="panel-heading"><div><h2>آخر الحركة</h2><p>سجل واحد يراه مدير المشروع.</p></div></div>
            <div>{scenario.activity.slice(0, 5).map((item, index) => <article key={`${item.label}-${index}`}><span><CheckCircle size={17} weight="fill" /></span><div><strong>{item.label}</strong><small>{item.actor}، {item.at}</small></div></article>)}</div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function ScenarioBriefReviewModal({ scenario, onClose, onApprove, canApprove }) {
  const answers = Object.entries(scenario.briefAnswers || {});
  return <Modal title={`مراجعة بريف ${scenario.project.name}`} onClose={onClose} size="wide">
    <div className="scenario-review-modal">
      <div className="scenario-review-main">
        <div className="scenario-review-intro"><span className="status-badge">جاهز لمراجعتك</span><h3>{scenario.client.company}</h3><p>راجع الإجابات باعتبارها مرجع النطاق الذي سيبنى عليه عرض السعر.</p></div>
        <div className="scenario-answer-list">{answers.map(([key, value]) => <article key={key}><small>{{ project_intro: "نبذة المشروع", impact: "الأثر المطلوب", main_goal: "الهدف", main_audience: "الجمهور", personality: "الشخصية", deliverables: "المخرجات", launch: "موعد الإطلاق", references: "المراجع" }[key] || key}</small><p>{value}</p></article>)}</div>
      </div>
      <aside className="scenario-review-aside"><ShieldCheck size={28} /><h3>{canApprove ? "قرارك يفتح التسعير" : "بريف معتمد"}</h3><p>{canApprove ? "بعد الاعتماد سينشأ عرض مرتبط بهذا البريف، وستنتقل المخرجات والموعد إليه." : "هذا هو مرجع النطاق الذي بُني عليه عرض السعر والعقد."}</p>{canApprove && <button className="button primary full" onClick={onApprove}>اعتماد وفتح العرض <ArrowLeft size={18} /></button>}<button className="button ghost full" onClick={onClose}>إغلاق</button></aside>
    </div>
  </Modal>;
}

function ScenarioQuotePanel({ scenario, onPatch, onAdvance, onToast }) {
  const quoteEditable = scenario.step === 3;
  const status = scenario.step < 3 ? "مقفل حتى اعتماد البريف" : scenario.step === 3 ? "مسودة تحتاج مراجعتك" : scenario.step === 4 ? "بانتظار العميل" : "اعتمده العميل";
  const updateQuote = (key, value) => onPatch({ quote: { ...scenario.quote, [key]: value } });
  return <section className="panel scenario-document-panel">
    <div className="panel-heading"><div><span className="scenario-live-label"><Sparkle size={14} weight="fill" /> المشروع التجريبي</span><h2>عرض {scenario.project.name}</h2><p>مرتبط بالبريف والعميل، ويتغير في بوابة العميل بعد الإرسال.</p></div><span className="status-badge">{status}</span></div>
    <div className="scenario-document-grid">
      <form onSubmit={(event) => { event.preventDefault(); onAdvance(4, "أرسل عبد الوهاب عرض السعر إلى العميل"); onToast("تم إرسال العرض وظهر فوراً في بوابة العميل"); }}>
        <label>نطاق العمل<textarea rows="4" value={scenario.quote.scope} disabled={!quoteEditable} onChange={(event) => updateQuote("scope", event.target.value)} /></label>
        <div className="field-row"><label>القيمة<input type="number" value={scenario.quote.amount} disabled={!quoteEditable} onChange={(event) => updateQuote("amount", event.target.value)} /></label><label>العملة<select value={scenario.quote.currency} disabled={!quoteEditable} onChange={(event) => updateQuote("currency", event.target.value)}><option>SAR</option><option>USD</option><option>EUR</option></select></label></div>
        {quoteEditable && <button className="button primary" type="submit"><PaperPlaneTilt size={18} /> إرسال العرض للعميل</button>}
        {scenario.step === 4 && <div className="scenario-waiting"><Clock size={19} /><span><strong>العرض لدى العميل الآن</strong><small>انتقل إلى معاينة العميل لاتخاذ القرار.</small></span></div>}
        {scenario.step >= 5 && <div className="scenario-waiting success"><CheckCircle size={19} weight="fill" /><span><strong>اعتمد العميل العرض</strong><small>أنشئ العقد تلقائياً من البنود المعتمدة.</small></span></div>}
      </form>
      <aside><header><FileText size={22} /><span><strong>عرض سعر {scenario.quote.id}</strong><small>صالح {scenario.quote.validityDays} أيام</small></span></header><h3>{scenario.project.service}</h3><p>{scenario.quote.scope}</p><div><span>الإجمالي</span><strong>{Number(scenario.quote.amount).toLocaleString("en-US")} {scenario.quote.currency}</strong></div><div className="preview-payments"><span><b>50%</b><small>عند التوقيع</small></span><span><b>50%</b><small>قبل التسليم</small></span></div></aside>
    </div>
  </section>;
}

function OwnerOverview({ onProject, onCapture, setSection }) {
  return (
    <div className="dashboard-content">
      <section className="today-grid">
        <article className="focus-card">
          <div className="focus-card-top"><span>مهمتك الآن</span><time>تحتاج 18 دقيقة</time></div>
          <div className="focus-card-body">
            <div>
              <p>سيد مندي</p>
              <h2>راجع البروفة الثانية قبل إرسالها.</h2>
              <span>جمعت ريم ملاحظات الهوية والتغليف في نسخة واحدة.</span>
            </div>
            <button className="button inverted" onClick={() => onProject(initialProjects[0])}>فتح البروفة <ArrowLeft size={18} /></button>
          </div>
          <div className="focus-card-next"><span>بعدها</span><strong>اعتماد عرض بخاري أختر</strong><time>11:30 ص</time></div>
        </article>
        <article className="money-card" onClick={() => setSection("finance")} role="button" tabIndex="0">
          <div className="money-head"><Wallet size={23} /><span>التحصيل هذا الشهر</span></div>
          <strong>24,850 <small>ر.س</small></strong>
          <p>لديك فاتورتان تحتاجان متابعة هذا الأسبوع.</p>
          <div className="money-split"><span>مستحق لك <b>16,350</b></span><span>للفريق <b>4,800</b></span></div>
        </article>
      </section>

      <section className="metrics-row">
        <Metric icon={Briefcase} label="مشاريع تتحرك" value="6" note="3 تحتاج قراراً منك" />
        <Metric icon={CheckCircle} label="اعتمادات معلقة" value="3" note="الأقدم منذ يومين" />
        <Metric icon={Tray} label="طلبات العقود" value="8" note="2 غير مسندة" />
        <Metric icon={ChartLineUp} label="توقع الشهر" value="41.2k" note="قبل مصروفات الفريق" />
      </section>

      <section className="dashboard-split">
        <div className="panel projects-panel">
          <div className="panel-heading">
            <div><h2>المشاريع التي تحتاج عينك</h2><p>مرتبة حسب القرار التالي، لا حسب آخر تحديث.</p></div>
            <button className="text-link" onClick={() => setSection("projects")}>كل المشاريع <ArrowLeft size={16} /></button>
          </div>
          <div className="project-rows">
            {initialProjects.map((project) => (
              <button className="project-row" key={project.id} onClick={() => onProject(project)}>
                <img src={project.image} alt="" />
                <span className="project-name"><strong>{project.name}</strong><small>{project.client}</small></span>
                <span className="project-next"><small>الخطوة التالية</small><strong>{project.next}</strong></span>
                <span className="project-due"><Clock size={16} /> {project.due}</span>
                <ArrowLeft size={18} />
              </button>
            ))}
          </div>
        </div>

        <aside className="panel activity-panel">
          <div className="panel-heading"><div><h2>ما تحرك وحده</h2><p>أتمه النظام أو الفريق دون مقاطعتك.</p></div></div>
          <div className="activity-list">
            <div><CheckCircle size={19} weight="fill" /><span><strong>توقيع العقد</strong><small>وقّع عميل بخاري أختر قبل 32 دقيقة.</small></span></div>
            <div><PaperPlaneTilt size={19} /><span><strong>متابعة تلقائية</strong><small>أرسل النظام تذكيراً لفاتورة سيد مندي.</small></span></div>
            <div><FileArrowUp size={19} /><span><strong>ملف جديد</strong><small>رفعت ريم تطبيقات قصر التوابل.</small></span></div>
          </div>
          <button className="capture-button" onClick={onCapture}><Plus size={18} /> التقط مهمة أو فكرة <kbd>⌘ K</kbd></button>
        </aside>
      </section>
    </div>
  );
}

function ProjectsView({ onProject, scenario, onAdvance, onToast }) {
  const [query, setQuery] = useState("");
  const filtered = initialProjects.filter((project) => `${project.name} ${project.client}`.includes(query));
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>المشاريع</h1><p>لكل مشروع قرار تالٍ ومالك واضح وملف مالي متصل.</p></div><button className="button primary"><Plus size={18} /> مشروع جديد</button></div>
      <section className="panel scenario-project-row">
        <span className="scenario-project-art"><img src="/work-mandi.jpg" alt="مرجع بصري للمشروع التجريبي" /></span>
        <div><span className="scenario-live-label"><Sparkle size={13} weight="fill" /> المشروع التجريبي</span><h2>{scenario.project.name}</h2><p>{scenario.client.company}، {scenario.project.service}</p><StageTrack current={scenarioToProjectStage(scenario.step)} /></div>
        <aside><small>الحالة الحالية</small><strong>{scenarioMilestones[Math.min(scenario.step, 13)].label}</strong>{scenario.step === 10 && <button className="button primary small" onClick={() => { onAdvance(11, "فتح عبد الوهاب ملفات التسليم النهائية للعميل", { delivery: { ...scenario.delivery, released: true } }); onToast("تم فتح حزمة التسليم في بوابة العميل"); }}>فتح التسليم للعميل</button>}</aside>
      </section>
      <div className="toolbar"><label className="search"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المشروع أو العميل" /></label><button className="filter-button">كل الحالات <CaretDown size={16} /></button></div>
      {filtered.length ? <div className="projects-grid">
        {filtered.map((project) => (
          <button className="project-card" key={project.id} onClick={() => onProject(project)}>
            <img src={project.image} alt={`مشروع ${project.name}`} />
            <div className="project-card-copy">
              <div><small>{project.type}</small><span className="status-badge">{project.status}</span></div>
              <h2>{project.name}</h2>
              <p>{project.client}</p>
              <StageTrack current={project.stage} />
              <div className="project-card-footer"><span><Clock size={16} /> {project.next}</span><strong>{project.value}</strong></div>
            </div>
          </button>
        ))}
      </div> : <div className="empty-state"><MagnifyingGlass size={36} /><h2>لا توجد نتيجة بهذا الاسم</h2><p>جرّب اسم العميل أو امسح عبارة البحث.</p></div>}
    </div>
  );
}

function RequestsView({ onToast, setSection, setRole, scenario, onAdvance }) {
  const [requests, setRequests] = useState(retainerRequests);
  const [projectRequests, setProjectRequests] = useState(incomingProjectRequests);
  const assign = (id, assignee) => {
    setRequests((items) => items.map((item) => item.id === id ? { ...item, assignee, status: "تم الإسناد" } : item));
    onToast(`تم إسناد الطلب إلى ${assignee}`);
  };
  const acceptProject = (id) => {
    setProjectRequests((items) => items.map((item) => item.id === id ? { ...item, status: "تم إنشاء البريف" } : item));
    onToast("تم قبول الطلب وإنشاء البريف المناسب للخدمة");
    window.setTimeout(() => setSection("briefs"), 450);
  };
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>طلبات العملاء</h1><p>راجع الطلب أولاً. بعد القبول ينشأ بريف الخدمة قبل أي عرض سعر.</p></div><button className="button primary"><Plus size={18} /> تسجيل طلب</button></div>
      <section className="panel scenario-request-panel">
        <div className="panel-heading"><div><span className="scenario-live-label"><Sparkle size={14} weight="fill" /> الطلب المتصل بالتجربة</span><h2>{scenario.project.name}</h2><p>{scenario.client.company}، أرسلته {scenario.client.name} عبر {scenario.source}.</p></div><span className="status-badge">{scenario.step === 0 ? "يحتاج قرارك" : "انتقل إلى البريف"}</span></div>
        <div className="scenario-request-details"><div><small>الخدمة</small><strong>{scenario.project.service}</strong></div><div><small>التواصل</small><strong>{scenario.client.communication}</strong></div><div><small>الميزانية</small><strong>{scenario.project.budget}</strong></div><div><small>الموعد</small><strong>{scenario.project.deadline}</strong></div></div>
        <blockquote>{scenario.project.goal}</blockquote>
        <div className="scenario-request-actions">{scenario.step === 0 ? <button className="button primary" onClick={() => { onAdvance(1, "قبل عبد الوهاب الطلب وأنشأ بريف صناعة العلامة"); onToast("تم قبول الطلب وإرسال البريف إلى بوابة العميل"); }}><Check size={18} /> قبول وإرسال البريف</button> : scenario.step === 1 ? <button className="button primary" onClick={() => setRole("client")}>افتح بوابة العميل <ArrowLeft size={18} /></button> : <button className="button ghost" onClick={() => setSection("scenario")}>عرض موقعه في السيناريو</button>}</div>
      </section>
      <section className="panel project-intake-panel">
        <div className="panel-heading"><div><h2>أمثلة طلبات أخرى</h2><p>تظل هذه البيانات مستقلة عن المشروع التجريبي الحي.</p></div><span className="sample-label">بيانات تجريبية</span></div>
        <div className="project-intake-list">{projectRequests.map((request) => <article key={request.id}>
          <span className="intake-icon"><Tray size={21} /></span>
          <span><strong>{request.project}</strong><small>{request.id} · {request.client}</small></span>
          <span><small>الخدمة</small><strong>{request.service}</strong></span>
          <span><small>وصل</small><strong>{request.received}</strong></span>
          <span className="status-badge">{request.status}</span>
          {request.status === "يحتاج قرارك" ? <button className="button primary small" onClick={() => acceptProject(request.id)}>قبول وإنشاء البريف</button> : <button className="button ghost small" onClick={() => setSection("briefs")}>فتح البريفات</button>}
        </article>)}</div>
      </section>
      <section className="retainer-summary">
        <div><span>عقود نشطة</span><strong>4</strong><small>إجمالي 26,000 ر.س شهرياً</small></div>
        <div><span>طلبات أغسطس</span><strong>17 من 28</strong><small>السعة المتبقية موزعة حسب العقد</small></div>
        <div className="retainer-note"><Handshake size={28} /><strong>لا طلب يضيع في المحادثات.</strong><p>كل عميل يطلب من بوابته، ويحدد الأولوية والموعد والملفات.</p></div>
      </section>
      <section className="panel request-board">
        <div className="panel-heading"><div><h2>طابور التنفيذ</h2><p>ابدأ بالأقرب للموعد أو غير المسند.</p></div><button className="filter-button">هذا الشهر <CaretDown size={16} /></button></div>
        <div className="request-table">
          {requests.map((request) => (
            <article className="request-row" key={request.id}>
              <div className="request-main"><span className={`request-state ${request.status === "جديد" || request.status === "بانتظار الإسناد" ? "attention" : ""}`}>{request.status}</span><strong>{request.title}</strong><small>{request.client}</small></div>
              <div><small>الموعد</small><strong>{request.due}</strong></div>
              <label><small>المسؤول</small><select value={request.assignee} onChange={(event) => assign(request.id, event.target.value)}><option>غير مسند</option><option>ريم</option><option>مازن</option><option>سارة</option></select></label>
              <button className="icon-button" aria-label="فتح الطلب"><ArrowLeft size={18} /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BriefFieldInput({ field, value, onChange }) {
  if (field.type === "textarea") return <textarea rows="4" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="اكتب إجابة واضحة ومباشرة" />;
  if (field.type === "date") return <input type="date" value={value || ""} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "select") return <select value={value || ""} onChange={(event) => onChange(event.target.value)}><option value="">اختر الإجابة</option>{(field.options || []).map((option) => <option key={option}>{option}</option>)}</select>;
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return <div className="brief-choice-grid">{(field.options || []).map((option) => <label key={option} className={selected.includes(option) ? "selected" : ""}><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])} />{option}</label>)}</div>;
  }
  if (field.type === "scale") return <div className="brief-scale" aria-label={field.label}>{[1, 2, 3, 4, 5].map((score) => <label key={score} className={Number(value) === score ? "selected" : ""}><input type="radio" name={field.id} checked={Number(value) === score} onChange={() => onChange(score)} />{score}</label>)}<small>1 منخفض، 5 مرتفع</small></div>;
  if (field.type === "file") return <label className="brief-file-input"><FileArrowUp size={19} /><span>{value || "رفع ملفات أو مراجع"}</span><input type="file" multiple onChange={(event) => onChange(event.target.files?.length ? `${event.target.files.length} ملفات مرفوعة` : "")} /></label>;
  return <input type="text" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="اكتب الإجابة" />;
}

function BriefCreateModal({ templates, onClose, onCreate }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || "");
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const template = templates.find((item) => item.id === templateId);
  const total = template?.sections.reduce((sum, section) => sum + section.fields.length, 0) || 0;
  return <Modal title="إنشاء بريف" onClose={onClose}>
    <form className="request-form brief-create-form" onSubmit={(event) => { event.preventDefault(); onCreate({ templateId, client, project, total }); }}>
      <label>قالب البريف<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{templates.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <div className="field-row"><label>العميل<input required value={client} onChange={(event) => setClient(event.target.value)} placeholder="اسم العميل أو المنشأة" /></label><label>المشروع<input required value={project} onChange={(event) => setProject(event.target.value)} placeholder="اسم المشروع" /></label></div>
      <div className="form-note"><List size={19} /> يحتوي القالب المختار على {total} سؤالاً موزعة على {template?.sections.length || 0} أقسام.</div>
      <button className="button primary full" type="submit">إنشاء المسودة <ArrowLeft size={18} /></button>
    </form>
  </Modal>;
}

function BriefEditorModal({ brief, template, onClose, onUpdate, onToast, onOpenQuote }) {
  const [answers, setAnswers] = useState(brief.answers || {});
  const [status, setStatus] = useState(brief.status);
  const fields = template.sections.flatMap((section) => section.fields);
  const answered = fields.filter((field) => {
    const value = answers[field.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const save = () => {
    onUpdate({ ...brief, answers, answered, status, updated: "الآن" });
    onToast("تم حفظ إجابات البريف وملاحظات المراجعة");
  };
  const approve = () => {
    const next = "معتمد";
    setStatus(next);
    onUpdate({ ...brief, answers, answered, status: next, updated: "الآن" });
    onToast("تم اعتماد البريف وفتح إنشاء عرض السعر");
  };
  return <Modal title={`${template.title} - ${brief.project}`} onClose={onClose} size="wide">
    <div className="brief-review-layout">
      <form className="brief-response-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <div className="brief-review-head"><span><small>{brief.id}</small><strong>{brief.client}</strong><b>{brief.contact}</b></span><span className="status-badge">{status}</span></div>
        {template.sections.map((section, sectionIndex) => <section className="brief-response-section" key={section.id}>
          <header><span>{sectionIndex + 1}</span><div><h3>{section.title}</h3><small>{section.fields.length} أسئلة</small></div></header>
          <div>{section.fields.map((field) => <div className="brief-answer-field" key={field.id}><span>{field.label}{field.required && <b>مطلوب</b>}</span><BriefFieldInput field={field} value={answers[field.id]} onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))} /></div>)}</div>
        </section>)}
        <div className="document-form-actions"><button type="button" className="button ghost" onClick={save}><FloppyDisk size={18} /> حفظ المراجعة</button>{status === "جاهز لمراجعتك" && <button type="button" className="button primary" onClick={approve}><ShieldCheck size={18} /> اعتماد البريف</button>}{status === "بانتظار إجابة العميل" && <button type="button" className="button primary" onClick={() => onToast("تم إرسال تذكير واحد للعميل عبر قناته المفضلة")}><PaperPlaneTilt size={18} /> تذكير العميل</button>}{status === "مسودة داخلية" && <button type="button" className="button primary" onClick={() => { setStatus("بانتظار إجابة العميل"); onUpdate({ ...brief, answers, answered, status: "بانتظار إجابة العميل", updated: "الآن" }); onToast("تم إرسال البريف إلى العميل"); }}><PaperPlaneTilt size={18} /> إرسال للعميل</button>}{status === "معتمد" && <button type="button" className="button primary" onClick={onOpenQuote}><FileText size={18} /> إنشاء عرض السعر</button>}</div>
      </form>
      <aside className="brief-review-aside">
        <div className="brief-progress-ring"><strong>{answered}</strong><span>من {fields.length}</span><small>إجابة مكتملة</small></div>
        <section><h3>بوابة قبل التسعير</h3><p>لا ينشأ عرض السعر حتى يصبح البريف معتمداً منك. بعدها ينتقل الهدف والنطاق والمخرجات والموعد تلقائياً إلى مسودة العرض.</p></section>
        <section><h3>ما سيغذي عرض السعر</h3><div className="brief-output-list"><span><Check size={16} /> الهدف والنتيجة</span><span><Check size={16} /> الجمهور والسياق</span><span><Check size={16} /> نطاق المخرجات</span><span><Check size={16} /> الموعد والقيود</span></div></section>
        <div className="document-rule-note"><ShieldCheck size={21} /><div><strong>اعتماد بشري إلزامي</strong><p>الإجابات تساعد على صياغة العرض، ولا تحدد السعر أو ترسل مستنداً تلقائياً.</p></div></div>
      </aside>
    </div>
  </Modal>;
}

function BriefsView({ settings, onToast, setSection, setRole, scenario, onAdvance }) {
  const templates = (settings.briefTemplates || [...defaultBriefTemplates, ...reusableBriefTemplates]).filter((template) => template.enabled);
  const [briefs, setBriefs] = useState(initialBriefs);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [scenarioReviewOpen, setScenarioReviewOpen] = useState(false);
  const updateBrief = (brief) => setBriefs((items) => items.map((item) => item.id === brief.id ? brief : item));
  const createBrief = ({ templateId, client, project, total }) => {
    const template = templates.find((item) => item.id === templateId);
    const next = { id: `BRF-${String(244 + briefs.length)}`, requestId: "يدوي", templateId, client, contact: "", project, service: template?.title.replace("بريف ", "") || "خدمة إبداعية", status: "مسودة داخلية", answered: 0, total, updated: "الآن", answers: {} };
    setBriefs((items) => [next, ...items]);
    setCreating(false);
    setSelected(next);
  };
  const selectedTemplate = selected ? templates.find((template) => template.id === selected.templateId) : null;
  return <div className="dashboard-content page-stack briefs-page">
    <div className="page-title"><div><h1>البريفات</h1><p>مرحلة إلزامية بعد قبول الطلب وقبل تسعير المشروع.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={18} /> إنشاء بريف</button></div>
    <section className="panel scenario-brief-panel">
      <div className="panel-heading"><div><span className="scenario-live-label"><Sparkle size={14} weight="fill" /> البريف المتصل بالتجربة</span><h2>{scenario.project.name}</h2><p>{scenario.client.company}، قالب بريف صناعة العلامة.</p></div><span className="status-badge">{scenario.step < 1 ? "لم يرسل" : scenario.step === 1 ? "بانتظار العميل" : scenario.step === 2 ? "جاهز لمراجعتك" : "معتمد"}</span></div>
      <div className="scenario-brief-stats"><div><strong>{Object.keys(scenario.briefAnswers || {}).length}</strong><span>إجابات محفوظة</span></div><div><strong>8</strong><span>أسئلة أساسية</span></div><div><strong>{scenario.client.notifications}</strong><span>قناة الإشعارات</span></div></div>
      <div className="scenario-brief-actions">
        {scenario.step === 1 && <button className="button primary" onClick={() => setRole("client")}>تعبئة البريف كعميل <ArrowLeft size={18} /></button>}
        {scenario.step === 2 && <button className="button primary" onClick={() => setScenarioReviewOpen(true)}>مراجعة واعتماد البريف <ArrowLeft size={18} /></button>}
        {scenario.step >= 3 && <button className="button ghost" onClick={() => setScenarioReviewOpen(true)}>عرض البريف المعتمد</button>}
        {scenario.step < 1 && <button className="button ghost" onClick={() => setSection("requests")}>العودة إلى الطلب</button>}
      </div>
    </section>
    <section className="brief-gate-flow">
      <div><Tray size={21} /><span><small>الطلب</small><strong>تراجعه وتقبله</strong></span></div><ArrowLeft size={17} />
      <div className="active"><List size={21} /><span><small>البريف</small><strong>يجيب العميل</strong></span></div><ArrowLeft size={17} />
      <div><ShieldCheck size={21} /><span><small>اعتمادك</small><strong>اكتمال النطاق</strong></span></div><ArrowLeft size={17} />
      <div><FileText size={21} /><span><small>عرض السعر</small><strong>يصاغ من البريف</strong></span></div>
    </section>
    <section className="brief-summary-strip"><div><strong>{briefs.filter((item) => item.status === "جاهز لمراجعتك").length}</strong><span>جاهزة لمراجعتك</span></div><div><strong>{briefs.filter((item) => item.status === "بانتظار إجابة العميل").length}</strong><span>بانتظار العميل</span></div><div><strong>{templates.length}</strong><span>قوالب فعالة</span></div><div className="brief-summary-note"><Sparkle size={23} /><span><strong>السؤال يظهر في وقته.</strong><small>العميل لا يرى إلا بريف الخدمة التي وافقت عليها.</small></span></div></section>
    <section className="panel brief-list-panel">
      <div className="panel-heading"><div><h2>البريفات الحالية</h2><p>ابدأ بالجاهز للمراجعة، ثم تابع البريفات المتوقفة.</p></div><span className="sample-label">بيانات تجريبية</span></div>
      <div className="brief-list">{briefs.map((brief) => <button key={brief.id} onClick={() => setSelected(brief)}><span className="brief-list-icon"><List size={21} /></span><span><strong>{brief.project}</strong><small>{brief.id} · {brief.client}</small></span><span><small>القالب</small><strong>{templates.find((item) => item.id === brief.templateId)?.title || brief.service}</strong></span><span className="brief-list-progress"><b>{brief.answered}/{brief.total}</b><small>إجابة</small></span><span className="status-badge">{brief.status}</span><ArrowLeft size={17} /></button>)}</div>
    </section>
    <div className="brief-gate-note"><LockKey size={23} /><div><strong>عرض السعر مقفل حتى اعتماد البريف.</strong><p>يمكنك تعديل أسئلة كل خدمة من إدارة الموقع، وحذف ما لا يلزم أو إضافة سؤال خاص بطريقتك.</p></div><button className="button ghost small" onClick={() => setSection("site-admin")}>تعديل القوالب</button></div>
    {creating && <BriefCreateModal templates={templates} onClose={() => setCreating(false)} onCreate={createBrief} />}
    {selected && selectedTemplate && <BriefEditorModal brief={selected} template={selectedTemplate} onClose={() => setSelected(null)} onUpdate={(brief) => { updateBrief(brief); setSelected(brief); }} onToast={onToast} onOpenQuote={() => { setSelected(null); setSection("documents"); onToast("فتحنا مركز العروض لإنشاء المسودة من البريف المعتمد"); }} />}
    {scenarioReviewOpen && <ScenarioBriefReviewModal scenario={scenario} canApprove={scenario.step === 2} onClose={() => setScenarioReviewOpen(false)} onApprove={() => { if (scenario.step === 2) { onAdvance(3, "اعتمد عبد الوهاب البريف وفتح عرض السعر"); setSection("documents"); onToast("تم اعتماد البريف وإنشاء مسودة العرض"); } setScenarioReviewOpen(false); }} />}
  </div>;
}

function DocumentEditorModal({ document, settings, onClose, onSave, onToast }) {
  const [draft, setDraft] = useState({
    scope: "تقديم الخدمة الإبداعية وفق نطاق البريف المعتمد والمخرجات الموضحة في هذا العرض.",
    payments: (settings.paymentPlans.find((plan) => plan.id === document.paymentPlan)?.percentages || [50, 50]),
    notes: "",
    ...document,
  });
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updatePayment = (index, value) => setDraft((current) => ({ ...current, payments: current.payments.map((amount, amountIndex) => amountIndex === index ? Number(value) : amount) }));
  const selectPlan = (id) => {
    const plan = settings.paymentPlans.find((item) => item.id === id);
    setDraft((current) => ({ ...current, paymentPlan: id, payments: plan?.percentages || current.payments }));
  };
  const amount = Number(draft.amount || 0).toLocaleString("en-US");
  const isContract = draft.type === "contract";
  const bankTail = settings.bankAccount?.slice(-4) || "";
  const save = () => {
    onSave(draft);
    onToast(`تم حفظ ${draft.title} كمسودة`);
    onClose();
  };

  return (
    <Modal title={`تحرير ${draft.title}`} onClose={onClose} size="wide">
      <div className="document-builder">
        <form className="document-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="field-row"><label>العميل<input value={draft.client} onChange={(event) => update("client", event.target.value)} /></label><label>المسؤول لدى العميل<input value={draft.contact} onChange={(event) => update("contact", event.target.value)} /></label></div>
          <label>الخدمة أو المشروع<input value={draft.project} onChange={(event) => update("project", event.target.value)} /></label>
          <label>وصف النطاق<textarea rows="4" value={draft.scope} onChange={(event) => update("scope", event.target.value)} /></label>
          <div className="field-row"><label>القيمة<input type="number" value={draft.amount} onChange={(event) => update("amount", event.target.value)} /></label><label>العملة<select value={draft.currency} onChange={(event) => update("currency", event.target.value)}>{settings.collaboratorCurrencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
          <label>خطة الدفعات<select value={draft.paymentPlan} onChange={(event) => selectPlan(event.target.value)}>{settings.paymentPlans.map((plan) => <option value={plan.id} key={plan.id}>{plan.label}</option>)}</select></label>
          <div className="payment-editor">{draft.payments.map((payment, index) => <label key={index}>الدفعة {index + 1}<span><input type="number" min="0" max="100" value={payment} onChange={(event) => updatePayment(index, event.target.value)} />%</span></label>)}</div>
          <label>ملاحظات خاصة بالمستند<textarea rows="3" value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="أي استثناء أو اتفاق خاص بهذا المشروع" /></label>
          <div className="document-form-actions"><button type="button" className="button ghost" onClick={() => onToast("تم تجهيز معاينة PDF داخل النموذج")}>معاينة PDF</button><button className="button primary" type="submit"><FloppyDisk size={18} /> حفظ المسودة</button></div>
        </form>

        <aside className="document-preview-sheet">
          <header><Logo compact /><div><strong>{draft.title}</strong><small>{draft.id}</small></div></header>
          <div className="document-party"><span><small>مقدم الخدمة</small><strong>{settings.ownerNameAr}</strong><b>{settings.ownerNameEn}</b></span><span><small>العميل</small><strong>{draft.client}</strong><b>{draft.contact}</b></span></div>
          <section><small>موضوع المستند</small><h3>{draft.project}</h3><p>{draft.scope}</p></section>
          <div className="document-total"><span>القيمة الإجمالية</span><strong>{amount} {draft.currency}</strong><small>{settings.vatRegistered ? "تراجع المعالجة الضريبية قبل الإصدار" : "مستند غير ضريبي"}</small></div>
          <section><small>جدول الدفعات</small><div className="preview-payments">{draft.payments.map((payment, index) => <span key={index}><b>{payment}%</b><small>الدفعة {index + 1}</small></span>)}</div></section>
          {isContract ? <section className="contract-clauses"><small>بنود العقد الأولية</small><p>تبدأ مدة التنفيذ بعد توقيع الطرفين واستلام الدفعة الأولى وتفاصيل العمل.</p><p>تقدم البروفة الأولى خلال {settings.firstProofDays} يوم عمل، وتنفذ التعديلات خلال {settings.revisionDays} أيام عمل، ويستغرق التأسيس من جديد {settings.restartDays} أيام عمل.</p><p>جولات التعديل: {settings.revisionRounds || "يحدد لكل مشروع"}، ويثبت العدد النهائي في هذا العقد قبل توقيعه.</p><p>تبقى الأفكار والمقترحات غير المعتمدة ملكاً لمقدم الخدمة، وتنتقل حقوق استخدام المخرجات النهائية بعد سداد كامل المستحقات.</p><p>تخضع الصياغة النهائية لمراجعة واعتماد مقدم الخدمة والعميل قبل التوقيع.</p></section> : <section className="contract-clauses"><small>الشروط الأولية</small><p>صلاحية العرض {settings.quoteValidityDays} أيام من تاريخ إصداره.</p><p>التنفيذ النهائي خلال {settings.finalizationDays} يوم عمل بعد اعتماد البروفات.</p><p>يصدر عقد مستقل بعد اعتماد العرض وقبل بدء العمل.</p></section>}
          <footer><span>{settings.email}<br />{settings.phone}</span><span>الحساب المحفوظ: •••• {bankTail}<br />{settings.bankName}</span></footer>
        </aside>
      </div>
    </Modal>
  );
}

function DocumentsView({ settings, onToast, scenario, onAdvance, onPatch }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selected, setSelected] = useState(null);
  const save = (document) => setDocuments((items) => items.map((item) => item.id === document.id ? { ...document, updated: "الآن" } : item));
  const createFromBrief = () => setSelected({ id: `Q-${String(483 + documents.length)}`, type: "quote", title: "عرض سعر", client: "بريف معتمد", contact: "", project: settings.services.find((service) => service.active)?.title || "خدمة إبداعية", amount: "0", currency: settings.defaultCurrency, paymentPlan: settings.paymentPlans[0].id, status: "مسودة من بريف", updated: "الآن" });
  const open = (document) => setSelected(document);

  return (
    <div className="dashboard-content page-stack documents-page">
      <div className="page-title"><div><h1>العروض والعقود</h1><p>ينشأ عرض السعر من بريف معتمد، ثم لا يخرج إلا بعد مراجعتك.</p></div><button className="button primary" onClick={createFromBrief}><Plus size={18} /> إنشاء من بريف معتمد</button></div>
      <section className="document-flow">
        <div><Tray size={22} /><span><small>الطلب</small><strong>مقبول</strong></span></div><ArrowLeft size={18} /><div><List size={22} /><span><small>البريف</small><strong>معتمد</strong></span></div><ArrowLeft size={18} /><div><FileText size={22} /><span><small>العرض</small><strong>تصاغ مسودته</strong></span></div><ArrowLeft size={18} /><div><Handshake size={22} /><span><small>العقد</small><strong>بعد قبول العرض</strong></span></div>
      </section>
      {scenario.step >= 3 && <ScenarioQuotePanel scenario={scenario} onPatch={onPatch} onAdvance={onAdvance} onToast={onToast} />}
      {scenario.step >= 5 && <section className="panel scenario-contract-row"><span className="document-type contract"><Handshake size={22} /></span><div><small>{scenario.contract.id}</small><strong>عقد تقديم خدمات إبداعية، {scenario.project.name}</strong><p>نشأ من العرض المعتمد ويحمل النطاق والدفعات نفسها.</p></div><span className="status-badge">{scenario.step === 5 ? "بانتظار توقيع العميل" : "موقع من الطرفين"}</span></section>}
      <section className="panel document-list-panel">
        <div className="panel-heading"><div><h2>المستندات الحالية</h2><p>النطاق والمخرجات والموعد تأتي من البريف، مع فصل العرض عن العقد.</p></div><span className="sample-label">بيانات تجريبية</span></div>
        <div className="document-list">{documents.map((document) => <button key={document.id} onClick={() => open(document)}><span className={`document-type ${document.type}`}><FileText size={21} /></span><span><strong>{document.title}</strong><small>{document.id} · {document.client}</small></span><span><small>المشروع</small><strong>{document.project}</strong></span><span><small>القيمة</small><strong>{Number(document.amount).toLocaleString("en-US")} {document.currency}</strong></span><span className="status-badge">{document.status}</span><ArrowLeft size={17} /></button>)}</div>
      </section>
      <div className="document-safety"><ShieldCheck size={24} /><div><strong>المسودة الذكية لا تعني الإرسال التلقائي.</strong><p>السعر والبنود والدفعات والتوقيع تبقى بقرارك. الصيغة القانونية النهائية تحتاج مراجعة مختص قبل اعتماد القالب الإنتاجي.</p></div></div>
      {selected && <DocumentEditorModal document={selected} settings={settings} onClose={() => setSelected(null)} onSave={(document) => { if (!documents.some((item) => item.id === document.id)) setDocuments((items) => [document, ...items]); else save(document); }} onToast={onToast} />}
    </div>
  );
}

function ClientsView() {
  const clients = [
    ["شركة الذائقة", "مشروع واحد", "9,250 ر.س مستحقة", "آخر تواصل اليوم"],
    ["مجموعة أختر", "مشروعان", "لا مستحقات متأخرة", "آخر تواصل أمس"],
    ["مخابز مامولا", "عقد مستمر", "6,500 ر.س شهرياً", "طلب جديد"],
    ["قصر التوابل", "عقد مستمر", "8,000 ر.س شهرياً", "طلبان قيد التنفيذ"],
  ];
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>العملاء</h1><p>العلاقة كاملة: المشاريع والعقود والفواتير والتواصل في ملف واحد.</p></div><button className="button primary"><Plus size={18} /> إضافة عميل</button></div>
      <div className="client-directory">
        {clients.map(([name, projects, money, note], index) => (
          <button className="client-entry" key={name}>
            <span className="client-avatar">{name.slice(0, 1)}</span>
            <span><strong>{name}</strong><small>{projects}</small></span>
            <span><small>الحساب</small><strong>{money}</strong></span>
            <span><small>الحالة</small><strong>{note}</strong></span>
            <span className={`health ${index === 0 ? "warn" : ""}`}>{index === 0 ? "يحتاج متابعة" : "العلاقة جيدة"}</span>
            <ArrowLeft size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

function FinanceEntryModal({ kind, settings, onClose, onSave }) {
  return <Modal title={kind === "client" ? "فاتورة عميل غير ضريبية" : "مطالبة خدمات متعاون"} onClose={onClose}>
    <form className="request-form" onSubmit={(event) => { event.preventDefault(); onSave(); onClose(); }}>
      {kind === "client" ? <div className="field-row"><label>العميل<input required placeholder="اسم العميل أو المنشأة" /></label><label>المشروع<input required placeholder="المشروع المرتبط" /></label></div> : <div className="field-row"><label>المتعاون<input required placeholder="اسم المتعاون" /></label><label>المشروع<input required placeholder="المشروع المرتبط" /></label></div>}
      {kind === "collaborator" && <label>القطعة أو الخدمة<input required placeholder="مثال: تصميم 3 منشورات" /></label>}
      <div className="field-row"><label>{kind === "collaborator" ? "سعر القطعة" : "المبلغ"}<input type="number" min="0" required /></label><label>العملة<select defaultValue={settings.defaultCurrency}>{settings.collaboratorCurrencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
      {kind === "collaborator" && <div className="field-row"><label>عدد القطع<input type="number" min="1" defaultValue="1" required /></label><label>تاريخ الاستحقاق<input type="date" required /></label></div>}
      {kind === "client" && <label>تاريخ الاستحقاق<input type="date" required /></label>}
      <div className="form-note"><ShieldCheck size={19} /> {kind === "client" ? "سيظهر المستند بوضوح على أنه غير ضريبي." : "تُسجل المطالبة كمبلغ مستحق على المشروع ولا تختلط بفواتير العملاء."}</div>
      <button className="button primary full" type="submit">حفظ المسودة <ArrowLeft size={18} /></button>
    </form>
  </Modal>;
}

function FinanceView({ onToast, settings, scenario, setRole }) {
  const [tab, setTab] = useState("clients");
  const [entryKind, setEntryKind] = useState(null);
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>الحسابات</h1><p>ما لك، وما عليك، وربحية كل مشروع دون ملف منفصل.</p></div><button className="button primary" onClick={() => setEntryKind(tab === "clients" ? "client" : "collaborator")}><Plus size={18} /> {tab === "clients" ? "فاتورة عميل" : "مطالبة متعاون"}</button></div>
      {scenario.step >= 6 && <section className="panel scenario-invoice-panel"><span className="invoice-icon"><Invoice size={22} /></span><div><span className="scenario-live-label"><Sparkle size={13} weight="fill" /> المشروع التجريبي</span><strong>{scenario.step === 9 ? "فاتورة الدفعة الأخيرة" : "فاتورة الدفعة الأولى"}</strong><small>{scenario.project.name}، {scenario.client.company}</small></div><div><small>القيمة</small><strong>{(Number(scenario.quote.amount) * 0.5).toLocaleString("en-US")} {scenario.quote.currency}</strong></div><span className={`payment-status ${scenario.step > 9 || (scenario.step > 6 && scenario.step < 9) ? "paid" : ""}`}>{scenario.step === 6 || scenario.step === 9 ? "مستحقة" : "مدفوعة"}</span>{(scenario.step === 6 || scenario.step === 9) && <button className="button primary small" onClick={() => setRole("client")}>فتح بوابة العميل</button>}</section>}
      <section className="finance-hero">
        <div className="finance-balance"><span>الرصيد المتوقع بعد الالتزامات</span><strong>36,420 <small>ر.س</small></strong><p>حتى نهاية أغسطس، بناء على العقود والفواتير المسجلة.</p></div>
        <div className="finance-pairs"><div><Receipt size={22} /><span>مستحقات العملاء<strong>16,350 SAR</strong></span></div><div><UsersThree size={22} /><span>دفعات المتعاونين<strong>4,800 SAR + عملات</strong></span></div><div><ChartLineUp size={22} /><span>هامش المشاريع<strong>31%</strong></span></div></div>
      </section>
      <section className="panel">
        <div className="panel-heading finance-heading"><div><h2>{tab === "clients" ? "فواتير العملاء" : "مستحقات المتعاونين"}</h2><p>{tab === "clients" ? "فواتير عادية غير ضريبية مرتبطة بالدفعات والمشاريع." : "تكلفة كل قطعة بالعملة التي يعمل بها المتعاون."}</p></div><div className="finance-tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>العملاء</button><button className={tab === "collaborators" ? "active" : ""} onClick={() => setTab("collaborators")}>المتعاونون</button></div></div>
        {tab === "clients" ? <div className="invoice-list">
          {invoices.map((invoice) => (
            <article key={invoice.id}>
              <span className="invoice-icon"><Invoice size={20} /></span>
              <span><strong>{invoice.id}</strong><small>{invoice.type} · {invoice.project}</small></span>
              <span><small>العميل</small><strong>{invoice.client}</strong></span>
              <span><small>الاستحقاق</small><strong>{invoice.due}</strong></span>
              <strong>{invoice.amount} {invoice.currency}</strong>
              <span className={`payment-status ${invoice.status === "مدفوعة" ? "paid" : ""}`}>{invoice.status}</span>
              {invoice.status !== "مدفوعة" && <button className="icon-button" aria-label="إرسال تذكير" onClick={() => onToast(`تم إرسال تذكير فاتورة ${invoice.id}`)}><PaperPlaneTilt size={18} /></button>}
            </article>
          ))}
        </div> : <div className="collaborator-bills">{collaboratorBills.map((bill) => <article key={bill.id}><span className="invoice-icon"><Coins size={20} /></span><span><strong>{bill.collaborator}</strong><small>{bill.id} · {bill.item}</small></span><span><small>المشروع</small><strong>{bill.project}</strong></span><strong>{bill.amount} {bill.currency}</strong><span className={`payment-status ${bill.status === "مدفوعة" ? "paid" : ""}`}>{bill.status}</span><button className="text-link" onClick={() => onToast(`تم فتح مطالبة ${bill.id}`)}>التفاصيل <ArrowLeft size={15} /></button></article>)}</div>}
      </section>
      <div className="currency-note"><Coins size={22} /><div><strong>العملات لا تُجمع مباشرة.</strong><p>يبقى كل رصيد بعملته الأصلية، وتظهر قيمته المرجعية بالريال فقط عند إعداد تقرير الربحية وسعر الصرف المسجل.</p></div></div>
      {entryKind && <FinanceEntryModal kind={entryKind} settings={settings} onClose={() => setEntryKind(null)} onSave={() => onToast(entryKind === "client" ? "تم حفظ فاتورة العميل كمسودة" : "تم حفظ مطالبة المتعاون")} />}
    </div>
  );
}

function TeamView({ scenario, setRole }) {
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>فريق العمل</h1><p>توزيع عادل يظهر المتاح قبل أن يتحول الضغط إلى تأخير.</p></div><button className="button primary"><Plus size={18} /> دعوة متعاون</button></div>
      {scenario.step >= 7 && <section className="panel scenario-team-task"><span className="person-avatar tone-1">{scenario.collaborator.name.slice(0, 1)}</span><div><span className="scenario-live-label"><Sparkle size={13} weight="fill" /> مهمة المشروع التجريبي</span><strong>{scenario.collaborator.task}</strong><small>{scenario.project.name}، التسليم {scenario.collaborator.due}</small></div><span className="status-badge">{scenario.step === 7 ? scenario.proof.revisionNote ? "تعديل مطلوب" : "قيد التنفيذ" : "تم رفع البروفة"}</span>{scenario.step === 7 && <button className="button primary small" onClick={() => setRole("collaborator")}>معاينة المتعاون</button>}</section>}
      <section className="team-layout">
        <div className="panel team-list">
          {team.map((person, index) => (
            <article key={person.name}>
              <span className={`person-avatar tone-${index + 1}`}>{person.name.slice(0, 1)}</span>
              <div><strong>{person.name}</strong><small>{person.role}</small></div>
              <div><small>الحمل الحالي</small><strong>{person.load}</strong></div>
              <div><small>التركيز</small><strong>{person.focus}</strong></div>
              <button className="text-link">عرض المهام <ArrowLeft size={15} /></button>
            </article>
          ))}
        </div>
        <aside className="capacity-card"><Target size={27} /><h2>السعة هذا الأسبوع</h2><strong>مريحة</strong><p>يمكنك قبول مشروع هوية صغير أو 5 طلبات تسويقية إضافية دون ضغط على الفريق.</p><button className="button inverted">فتح مخطط السعة</button></aside>
      </section>
    </div>
  );
}

function ProjectDrawer({ project, onClose, onToast }) {
  const [tab, setTab] = useState("overview");
  return (
    <div className="drawer-layer" onMouseDown={onClose}>
      <aside className="project-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label={`تفاصيل مشروع ${project.name}`}>
        <div className="drawer-cover"><img src={project.image} alt="" /><IconButton label="إغلاق" onClick={onClose}><X size={20} /></IconButton></div>
        <div className="drawer-title"><div><small>{project.type}</small><h2>{project.name}</h2><p>{project.client}</p></div><span className="status-badge">{project.status}</span></div>
        <StageTrack current={project.stage} />
        <div className="drawer-tabs"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>الملخص</button><button className={tab === "proofs" ? "active" : ""} onClick={() => setTab("proofs")}>البروفات</button><button className={tab === "finance" ? "active" : ""} onClick={() => setTab("finance")}>المالية</button></div>
        {tab === "overview" && <div className="drawer-content"><div className="next-decision"><Target size={24} /><span><small>القرار التالي</small><strong>{project.next}</strong><p>بعد الاعتماد ستصل المهمة تلقائياً إلى المسؤول التالي.</p></span></div><div className="drawer-facts"><div><small>موعد القرار</small><strong>{project.due}</strong></div><div><small>قيمة المشروع</small><strong>{project.value}</strong></div><div><small>المسؤول</small><strong>ريم السالم</strong></div><div><small>آخر تحديث</small><strong>منذ 32 دقيقة</strong></div></div><button className="button primary full" onClick={() => onToast("تم إرسال البروفة إلى العميل")}>إرسال البروفة للعميل</button></div>}
        {tab === "proofs" && <div className="drawer-content"><div className="proof-version"><img src={project.image} alt={`البروفة الثانية لمشروع ${project.name}`} /><div><strong>البروفة الثانية</strong><small>رفعتها ريم اليوم، 9:26 ص</small></div><span className="status-badge">جاهزة للإرسال</span></div><div className="comment-box"><strong>ملاحظة داخلية</strong><p>تم توحيد لون العبوة مع تطبيقات الواجهة. النسخة مناسبة للعرض.</p></div><button className="button primary full" onClick={() => onToast("تم إرسال البروفة إلى العميل")}>إرسال البروفة للعميل</button></div>}
        {tab === "finance" && <div className="drawer-content"><div className="drawer-facts"><div><small>قيمة العقد</small><strong>{project.value}</strong></div><div><small>المحصل</small><strong>50%</strong></div><div><small>تكلفة الفريق</small><strong>2,800 ر.س</strong></div><div><small>صافي متوقع</small><strong>6,450 ر.س</strong></div></div><div className="comment-box"><strong>الفاتورة التالية</strong><p>تُنشأ تلقائياً عند اعتماد البروفة النهائية.</p></div></div>}
      </aside>
    </div>
  );
}

function StudioSettingsView({ content, onSave, onToast }) {
  const [tab, setTab] = useState("identity");
  const [draft, setDraft] = useState(content);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updatePlan = (index, key, value) => setDraft((current) => ({ ...current, paymentPlans: current.paymentPlans.map((plan, planIndex) => planIndex === index ? { ...plan, [key]: value } : plan) }));
  const updatePlanPayment = (planIndex, paymentIndex, value) => setDraft((current) => ({ ...current, paymentPlans: current.paymentPlans.map((plan, index) => index === planIndex ? { ...plan, percentages: plan.percentages.map((payment, itemIndex) => itemIndex === paymentIndex ? Number(value) : payment) } : plan) }));
  const addPlan = () => setDraft((current) => ({ ...current, paymentPlans: [...current.paymentPlans, { id: `plan-${Date.now()}`, label: "خطة دفعات جديدة", percentages: [40, 30, 30] }] }));
  const removePlan = (index) => setDraft((current) => ({ ...current, paymentPlans: current.paymentPlans.filter((_, planIndex) => planIndex !== index) }));
  const toggleCurrency = (currency) => setDraft((current) => ({ ...current, collaboratorCurrencies: current.collaboratorCurrencies.includes(currency) ? current.collaboratorCurrencies.filter((item) => item !== currency) : [...current.collaboratorCurrencies, currency] }));
  const save = () => {
    onSave(draft);
    onToast("تم حفظ إعدادات العمل والمستندات");
  };

  return <div className="dashboard-content page-stack studio-settings-page">
    <div className="page-title"><div><h1>إعدادات العمل</h1><p>المصدر الواحد لبياناتك البنكية وقواعد العروض والعقود والعملات.</p></div><button className="button primary" onClick={save}><FloppyDisk size={18} /> حفظ الإعدادات</button></div>
    <div className="settings-tabs"><button className={tab === "identity" ? "active" : ""} onClick={() => setTab("identity")}>الهوية والحساب</button><button className={tab === "documents" ? "active" : ""} onClick={() => setTab("documents")}>قواعد المستندات</button><button className={tab === "finance" ? "active" : ""} onClick={() => setTab("finance")}>الدفعات والعملات</button></div>
    <section className="panel settings-panel">
      {tab === "identity" && <><div className="settings-section-title"><div><h2>بيانات مقدم الخدمة</h2><p>تظهر في العرض والعقد والفاتورة، ولا تظهر بيانات البنك في الموقع العام.</p></div><ShieldCheck size={24} /></div><div className="cms-fields"><label className="cms-field full">الاسم بالعربية<input value={draft.ownerNameAr} onChange={(event) => update("ownerNameAr", event.target.value)} /></label><label className="cms-field full">الاسم بالإنجليزية<input dir="ltr" value={draft.ownerNameEn} onChange={(event) => update("ownerNameEn", event.target.value)} /></label><label className="cms-field">البريد<input dir="ltr" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label><label className="cms-field">الجوال<input dir="ltr" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label><label className="cms-field">البنك<input value={draft.bankName} onChange={(event) => update("bankName", event.target.value)} /></label><label className="cms-field">رقم الحساب<input dir="ltr" value={draft.bankAccount} onChange={(event) => update("bankAccount", event.target.value)} /></label><label className="cms-field full">IBAN<input dir="ltr" value={draft.bankIban} onChange={(event) => update("bankIban", event.target.value)} /></label></div><label className="cms-toggle danger"><span><strong>مسجل في ضريبة القيمة المضافة</strong><small>{draft.vatRegistered ? "يجب تطبيق قواعد الفاتورة الضريبية قبل الإصدار" : "المستندات الحالية غير ضريبية"}</small></span><input type="checkbox" checked={draft.vatRegistered} onChange={(event) => update("vatRegistered", event.target.checked)} /></label></>}
      {tab === "documents" && <><div className="settings-section-title"><div><h2>المواعيد الافتراضية</h2><p>تملأ بها المسودة تلقائياً ويمكن تغييرها لكل مشروع.</p></div><FileText size={24} /></div><div className="cms-fields timeline-settings"><label className="cms-field">صلاحية العرض بالأيام<input type="number" value={draft.quoteValidityDays} onChange={(event) => update("quoteValidityDays", Number(event.target.value))} /></label><label className="cms-field">البروفة الأولى، أيام عمل<input type="number" value={draft.firstProofDays} onChange={(event) => update("firstProofDays", Number(event.target.value))} /></label><label className="cms-field">جولات التعديل الافتراضية<input value={draft.revisionRounds || ""} onChange={(event) => update("revisionRounds", event.target.value)} placeholder="مثال: جولتان" /></label><label className="cms-field">مدة التعديل، أيام عمل<input type="number" value={draft.revisionDays} onChange={(event) => update("revisionDays", Number(event.target.value))} /></label><label className="cms-field">التأسيس من جديد، أيام عمل<input type="number" value={draft.restartDays} onChange={(event) => update("restartDays", Number(event.target.value))} /></label><label className="cms-field">التنفيذ بعد الاعتماد، أيام عمل<input type="number" value={draft.finalizationDays} onChange={(event) => update("finalizationDays", Number(event.target.value))} /></label></div><div className="document-rule-note"><Handshake size={23} /><div><strong>العقد مستقل عن العرض.</strong><p>اعتماد العرض ينشئ مسودة عقد، ولا يبدأ المشروع إلا بعد توقيع العقد وتسجيل الدفعة الأولى.</p></div></div></>}
      {tab === "finance" && <><div className="settings-section-title"><div><h2>خطط الدفعات</h2><p>اختر الخطة في كل عرض، ثم عدّل النسب قبل الإرسال.</p></div><button className="button ghost small" onClick={addPlan}><Plus size={17} /> إضافة خطة</button></div><div className="payment-plan-list">{draft.paymentPlans.map((plan, planIndex) => <article key={plan.id}><div><label>اسم الخطة<input value={plan.label} onChange={(event) => updatePlan(planIndex, "label", event.target.value)} /></label><div className="payment-editor">{plan.percentages.map((payment, paymentIndex) => <label key={paymentIndex}>دفعة {paymentIndex + 1}<span><input type="number" min="0" max="100" value={payment} onChange={(event) => updatePlanPayment(planIndex, paymentIndex, event.target.value)} />%</span></label>)}</div></div><button aria-label={`حذف ${plan.label}`} onClick={() => removePlan(planIndex)}><X size={18} /></button></article>)}</div><div className="currency-settings"><h3>عملات المتعاونين</h3><p>تبقى المطالبة بعملتها، ولا تحول إلى الريال إلا في تقرير الربحية.</p><div>{["SAR", "USD", "EUR", "GBP", "AED"].map((currency) => <label key={currency} className={draft.collaboratorCurrencies.includes(currency) ? "active" : ""}><input type="checkbox" checked={draft.collaboratorCurrencies.includes(currency)} onChange={() => toggleCurrency(currency)} />{currency}</label>)}</div></div></>}
    </section>
  </div>;
}

function SiteAdminView({ content, onPublish, onPreview, onToast }) {
  const [tab, setTab] = useState("content");
  const [draft, setDraft] = useState(content);
  const tabs = [
    ["content", "المحتوى", FileText],
    ["services", "الخدمات", SquaresFour],
    ["work", "الأعمال", Briefcase],
    ["forms", "نموذج الطلب", Tray],
    ["briefs", "قوالب البريف", List],
    ["seo", "SEO والمشاركة", ChartLineUp],
    ["settings", "الإعدادات", SlidersHorizontal],
  ];
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateVisibility = (group, index, value) => setDraft((current) => ({
    ...current,
    [group]: current[group].map((item, itemIndex) => itemIndex === index ? value : item),
  }));
  const updateSection = (key, value) => setDraft((current) => ({
    ...current,
    sectionVisibility: { ...current.sectionVisibility, [key]: value },
  }));
  const updateService = (index, key, value) => setDraft((current) => ({ ...current, services: current.services.map((service, serviceIndex) => serviceIndex === index ? { ...service, [key]: value } : service) }));
  const addService = () => {
    const id = `service-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      services: [...current.services, { id, title: "خدمة جديدة", description: "اكتب وصفاً واضحاً للخدمة.", active: true }],
      briefTemplates: [...(current.briefTemplates || []), { id: `brief-${id}`, serviceId: id, title: "بريف الخدمة الجديدة", description: "أسئلة العميل بعد قبول الطلب وقبل عرض السعر.", enabled: true, sections: [{ id: `section-${Date.now()}`, title: "فهم الطلب", fields: [{ id: `field-${Date.now()}`, label: "ما النتيجة التي تريد تحقيقها؟", type: "textarea", required: true }] }] }],
    }));
  };
  const removeService = (index) => setDraft((current) => {
    const serviceId = current.services[index].id;
    return { ...current, services: current.services.filter((_, serviceIndex) => serviceIndex !== index), briefTemplates: (current.briefTemplates || []).filter((template) => template.serviceId !== serviceId) };
  });
  const updateQuestion = (index, key, value) => setDraft((current) => ({ ...current, requestQuestions: current.requestQuestions.map((question, questionIndex) => questionIndex === index ? { ...question, [key]: value } : question) }));
  const addQuestion = () => setDraft((current) => ({ ...current, requestQuestions: [...current.requestQuestions, { id: `question-${Date.now()}`, label: "سؤال جديد", type: "text", required: false, enabled: true }] }));
  const removeQuestion = (index) => setDraft((current) => ({ ...current, requestQuestions: current.requestQuestions.filter((_, questionIndex) => questionIndex !== index) }));
  const addBriefTemplate = () => setDraft((current) => ({ ...current, briefTemplates: [...(current.briefTemplates || []), { id: `brief-${Date.now()}`, serviceId: "any", title: "قالب بريف جديد", description: "حدد متى يستخدم هذا القالب.", enabled: true, sections: [{ id: `section-${Date.now()}`, title: "القسم الأول", fields: [{ id: `field-${Date.now()}`, label: "سؤال جديد", type: "textarea", required: true }] }] }] }));
  const updateBriefTemplate = (templateIndex, key, value) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, [key]: value } : template) }));
  const removeBriefTemplate = (templateIndex) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.filter((_, index) => index !== templateIndex) }));
  const addBriefSection = (templateIndex) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: [...template.sections, { id: `section-${Date.now()}`, title: "قسم جديد", fields: [] }] } : template) }));
  const updateBriefSection = (templateIndex, sectionIndex, key, value) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: template.sections.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, [key]: value } : section) } : template) }));
  const removeBriefSection = (templateIndex, sectionIndex) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: template.sections.filter((_, itemIndex) => itemIndex !== sectionIndex) } : template) }));
  const addBriefField = (templateIndex, sectionIndex) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: template.sections.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, fields: [...section.fields, { id: `field-${Date.now()}`, label: "سؤال جديد", type: "textarea", required: false }] } : section) } : template) }));
  const updateBriefField = (templateIndex, sectionIndex, fieldIndex, key, value) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: template.sections.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, fields: section.fields.map((field, questionIndex) => questionIndex === fieldIndex ? { ...field, [key]: value } : field) } : section) } : template) }));
  const removeBriefField = (templateIndex, sectionIndex, fieldIndex) => setDraft((current) => ({ ...current, briefTemplates: current.briefTemplates.map((template, index) => index === templateIndex ? { ...template, sections: template.sections.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, fields: section.fields.filter((_, questionIndex) => questionIndex !== fieldIndex) } : section) } : template) }));
  const publish = () => {
    onPublish(draft);
    onToast("تم نشر التغييرات على الموقع التعريفي");
  };

  return (
    <div className="dashboard-content page-stack site-admin-page">
      <div className="page-title site-admin-title">
        <div><span className="eyebrow">CMS</span><h1>إدارة الموقع</h1><p>غيّر المحتوى والأقسام ونموذج الطلب ومحركات البحث من مكان واحد.</p></div>
        <div className="site-admin-actions"><button className="button ghost" onClick={onPreview}><Globe size={18} /> معاينة الموقع</button><button className="button primary" onClick={publish}><FloppyDisk size={18} /> نشر التغييرات</button></div>
      </div>

      <div className="cms-status"><span><CheckCircle size={18} weight="fill" /> الموقع منشور</span><small>{draft.domain} · آخر تحديث الآن في النموذج</small></div>

      <section className="site-admin-layout">
        <nav className="cms-nav" aria-label="أقسام إدارة الموقع">
          {tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={19} /><span>{label}</span><ArrowLeft size={15} /></button>)}
        </nav>

        <div className="cms-editor">
          {tab === "content" && <>
            <div className="cms-editor-heading"><div><h2>محتوى الصفحة الرئيسية</h2><p>النصوص الأساسية التي يراها الزائر قبل إرسال الطلب.</p></div><span>الصفحة الرئيسية</span></div>
            <div className="cms-fields">
              <label className="cms-field full">العنوان الرئيسي<input value={draft.heroTitle} onChange={(event) => update("heroTitle", event.target.value)} /></label>
              <label className="cms-field full">وصف المقدمة<textarea rows="4" value={draft.heroBody} onChange={(event) => update("heroBody", event.target.value)} /></label>
              <label className="cms-field">نص زر الطلب<input value={draft.heroCta} onChange={(event) => update("heroCta", event.target.value)} /></label>
              <label className="cms-field">عنوان الخدمات<input value={draft.servicesTitle} onChange={(event) => update("servicesTitle", event.target.value)} /></label>
              <label className="cms-field">عنوان الأعمال<input value={draft.workTitle} onChange={(event) => update("workTitle", event.target.value)} /></label>
              <label className="cms-field">عنوان الدعوة الختامية<input value={draft.finalTitle} onChange={(event) => update("finalTitle", event.target.value)} /></label>
            </div>
            <div className="cms-section"><h3>إظهار أقسام الصفحة</h3><div className="cms-toggle-grid">
              {[["statement", "العبارة التعريفية"], ["services", "الخدمات"], ["method", "منهجية العمل"], ["work", "الأعمال المختارة"], ["about", "عن الاستوديو"]].map(([id, label]) => <label className="cms-toggle" key={id}><span><strong>{label}</strong><small>{draft.sectionVisibility[id] ? "ظاهر في الموقع" : "مخفي مؤقتاً"}</small></span><input type="checkbox" checked={draft.sectionVisibility[id]} onChange={(event) => updateSection(id, event.target.checked)} /></label>)}
            </div></div>
          </>}

          {tab === "services" && <>
            <div className="cms-editor-heading"><div><h2>الخدمات المعروضة</h2><p>أضف وعدّل واحذف أي خدمة، وحدد ما يظهر في الموقع ونموذج الطلب.</p></div><button className="button ghost small" onClick={addService}><Plus size={17} /> إضافة خدمة</button></div>
            <div className="service-editor-list">{draft.services.map((service, index) => <article className="service-editor-item" key={service.id}><span className="cms-list-index">{String(index + 1).padStart(2, "0")}</span><div><label>اسم الخدمة<input value={service.title} onChange={(event) => updateService(index, "title", event.target.value)} /></label><label>الوصف<textarea rows="2" value={service.description} onChange={(event) => updateService(index, "description", event.target.value)} /></label></div><div className="service-editor-actions"><label><input type="checkbox" checked={service.active} onChange={(event) => updateService(index, "active", event.target.checked)} /> ظاهرة</label><button aria-label={`حذف ${service.title}`} onClick={() => removeService(index)}><X size={17} /></button></div></article>)}</div>
          </>}

          {tab === "work" && <>
            <div className="cms-editor-heading"><div><h2>الأعمال المختارة</h2><p>تحكم بما يظهر في واجهة الموقع التعريفية.</p></div><button className="button ghost small" onClick={() => onToast("رفع مشروع جديد سيكون مربوطاً بمكتبة الملفات في النسخة الإنتاجية")}><Plus size={17} /> إضافة مشروع</button></div>
            <div className="cms-work-list">{initialProjects.map((project, index) => <label className="cms-work-item" key={project.id}><img src={project.image} alt="" /><span><strong>{project.name}</strong><small>{project.type}</small></span><input type="checkbox" checked={draft.workVisibility[index]} onChange={(event) => updateVisibility("workVisibility", index, event.target.checked)} /></label>)}</div>
          </>}

          {tab === "forms" && <>
            <div className="cms-editor-heading"><div><h2>نموذج طلب الخدمة</h2><p>بيانات التواصل ثابتة لحماية المتابعة، وبقية الأسئلة قابلة للتعديل والإضافة والحذف.</p></div><button className="button ghost small" onClick={addQuestion}><Plus size={17} /> إضافة سؤال</button></div>
            <div className="cms-toggle-stack">
              <label className="cms-toggle"><span><strong>استقبال طلبات جديدة</strong><small>عند إيقافه يظهر للزائر أن جدول المشاريع ممتلئ.</small></span><input type="checkbox" checked={draft.acceptingRequests} onChange={(event) => update("acceptingRequests", event.target.checked)} /></label>
            </div>
            <div className="fixed-contact-fields"><ShieldCheck size={22} /><div><strong>حقول التواصل الأساسية</strong><p>الاسم، المنشأة، البريد، الجوال، وسيلة التواصل وقناة الإشعارات. هذه الحقول مطلوبة دائماً.</p></div></div>
            <div className="question-editor-list">{draft.requestQuestions.map((question, index) => <article key={question.id}><div className="question-main"><label>السؤال<input value={question.label} onChange={(event) => updateQuestion(index, "label", event.target.value)} /></label><label>نوع الإجابة<select value={question.type} onChange={(event) => updateQuestion(index, "type", event.target.value)}><option value="text">نص قصير</option><option value="textarea">نص طويل</option><option value="date">تاريخ</option><option value="select">اختيارات</option></select></label></div>{question.type === "select" && <label className="question-options">الاختيارات<input value={(question.options || []).join("، ")} onChange={(event) => updateQuestion(index, "options", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>}<div className="question-actions"><label><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, "required", event.target.checked)} /> مطلوب</label><label><input type="checkbox" checked={question.enabled} onChange={(event) => updateQuestion(index, "enabled", event.target.checked)} /> ظاهر</label><button aria-label={`حذف سؤال ${question.label}`} onClick={() => removeQuestion(index)}><X size={17} /></button></div></article>)}</div>
            <div className="cms-note"><LockKey size={22} /><div><strong>من الطلب إلى مساحة العمل</strong><p>بعد قبول الطلب تنشئ الإدارة المشروع وترسل دعوة خاصة للعميل. تفاصيل المشروع لا تظهر أبداً في الموقع العام.</p></div></div>
          </>}

          {tab === "briefs" && <>
            <div className="cms-editor-heading"><div><h2>قوالب البريف</h2><p>لكل خدمة أسئلتها. ترسل بعد قبول الطلب، ويجب اعتماد الإجابات قبل إنشاء عرض السعر.</p></div><button className="button ghost small" onClick={addBriefTemplate}><Plus size={17} /> إضافة قالب</button></div>
            <div className="brief-template-editor-list">{(draft.briefTemplates || []).map((template, templateIndex) => <article className="brief-template-editor" key={template.id}>
              <header><span className="brief-template-mark"><List size={21} /></span><div><label>اسم القالب<input value={template.title} onChange={(event) => updateBriefTemplate(templateIndex, "title", event.target.value)} /></label><label>الخدمة<select value={template.serviceId} onChange={(event) => updateBriefTemplate(templateIndex, "serviceId", event.target.value)}><option value="any">قالب مشترك</option>{draft.services.map((service) => <option value={service.id} key={service.id}>{service.title}</option>)}</select></label></div><label className="brief-template-enabled"><input type="checkbox" checked={template.enabled} onChange={(event) => updateBriefTemplate(templateIndex, "enabled", event.target.checked)} /> فعال</label><button aria-label={`حذف قالب ${template.title}`} onClick={() => removeBriefTemplate(templateIndex)}><X size={18} /></button></header>
              <label className="brief-template-description">وصف الاستخدام<textarea rows="2" value={template.description} onChange={(event) => updateBriefTemplate(templateIndex, "description", event.target.value)} /></label>
              <div className="brief-section-editor-list">{template.sections.map((section, sectionIndex) => <section className="brief-section-editor" key={section.id}>
                <header><label>عنوان القسم<input value={section.title} onChange={(event) => updateBriefSection(templateIndex, sectionIndex, "title", event.target.value)} /></label><span>{section.fields.length} أسئلة</span><button aria-label={`حذف قسم ${section.title}`} onClick={() => removeBriefSection(templateIndex, sectionIndex)}><X size={17} /></button></header>
                <div>{section.fields.map((field, fieldIndex) => <article className="brief-question-editor" key={field.id}><span className="cms-list-index">{fieldIndex + 1}</span><div><label>السؤال<input value={field.label} onChange={(event) => updateBriefField(templateIndex, sectionIndex, fieldIndex, "label", event.target.value)} /></label>{["select", "multiselect"].includes(field.type) && <label>الاختيارات<input value={(field.options || []).join("، ")} onChange={(event) => updateBriefField(templateIndex, sectionIndex, fieldIndex, "options", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>}</div><label>نوع الإجابة<select value={field.type} onChange={(event) => updateBriefField(templateIndex, sectionIndex, fieldIndex, "type", event.target.value)}><option value="text">نص قصير</option><option value="textarea">نص طويل</option><option value="date">تاريخ</option><option value="select">اختيار واحد</option><option value="multiselect">اختيارات متعددة</option><option value="scale">مقياس 1-5</option><option value="file">رفع ملفات</option></select></label><div className="brief-question-actions"><label><input type="checkbox" checked={field.required} onChange={(event) => updateBriefField(templateIndex, sectionIndex, fieldIndex, "required", event.target.checked)} /> مطلوب</label><button aria-label={`حذف سؤال ${field.label}`} onClick={() => removeBriefField(templateIndex, sectionIndex, fieldIndex)}><X size={17} /></button></div></article>)}</div>
                <button className="add-brief-question" onClick={() => addBriefField(templateIndex, sectionIndex)}><Plus size={16} /> إضافة سؤال لهذا القسم</button>
              </section>)}</div>
              <button className="button ghost small add-brief-section" onClick={() => addBriefSection(templateIndex)}><Plus size={17} /> إضافة قسم</button>
            </article>)}</div>
            <div className="cms-note"><ShieldCheck size={22} /><div><strong>القالب ليس عرض سعر.</strong><p>الإجابات تصبح مرجع النطاق والتسعير، لكن السعر والمدة والدفعات لا تعتمد إلا بقرارك داخل مركز العروض.</p></div></div>
          </>}

          {tab === "seo" && <>
            <div className="cms-editor-heading"><div><h2>الظهور في البحث والمشاركة</h2><p>تحكم بالعنوان والوصف الذي يظهر في Google وعند مشاركة الرابط.</p></div><span>SEO</span></div>
            <div className="cms-fields">
              <label className="cms-field full">عنوان الموقع<input value={draft.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} /></label>
              <label className="cms-field full">وصف الموقع<textarea rows="4" value={draft.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} /></label>
            </div>
            <label className="cms-toggle"><span><strong>السماح لمحركات البحث بالفهرسة</strong><small>أوقفه فقط أثناء تجهيز نسخة غير منشورة.</small></span><input type="checkbox" checked={draft.indexable} onChange={(event) => update("indexable", event.target.checked)} /></label>
            <div className="seo-preview"><small>{draft.domain}</small><strong>{draft.seoTitle}</strong><p>{draft.seoDescription}</p></div>
          </>}

          {tab === "settings" && <>
            <div className="cms-editor-heading"><div><h2>الإعدادات العامة</h2><p>بيانات التواصل والدومين وحالة الموقع.</p></div><span>عام</span></div>
            <div className="cms-fields">
              <label className="cms-field full">الدومين<input dir="ltr" value={draft.domain} onChange={(event) => update("domain", event.target.value)} /></label>
              <label className="cms-field">البريد الإلكتروني<input dir="ltr" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
              <label className="cms-field">رقم التواصل<input dir="ltr" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            </div>
            <label className="cms-toggle danger"><span><strong>وضع الصيانة</strong><small>يوقف الواجهة العامة مؤقتاً ويُبقي مساحة الإدارة متاحة.</small></span><input type="checkbox" checked={draft.maintenance} onChange={(event) => update("maintenance", event.target.checked)} /></label>
          </>}
        </div>
      </section>
    </div>
  );
}

function CaptureModal({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    onClose();
  };
  return (
    <Modal title="التقاط سريع" onClose={onClose} size="compact">
      <form className="capture-form" onSubmit={submit}>
        <label>ما الذي لا تريد حمله في ذهنك؟<textarea autoFocus rows="3" value={text} onChange={(event) => setText(event.target.value)} placeholder="مثال: راجع أسماء الحملة مع سارة غداً" /></label>
        <div><small>سيصل إلى صندوقك لتحديد المشروع والمسؤول لاحقاً.</small><button className="button primary" type="submit">حفظ <ArrowLeft size={17} /></button></div>
      </form>
    </Modal>
  );
}

function Sidebar({ section, setSection, onSite }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top"><Logo onClick={onSite} /><span className="workspace-label">مساحة الإدارة</span></div>
      <nav aria-label="أقسام الإدارة">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={20} weight={section === item.id ? "fill" : "regular"} /><span>{item.label}</span>{item.id === "requests" && <b>2</b>}{item.id === "briefs" && <b>1</b>}</button>;
        })}
      </nav>
      <div className="sidebar-card"><Sparkle size={21} weight="fill" /><strong>وضع التركيز</strong><p>يعرض لك قراراً واحداً فقط، ويؤجل البقية حتى تنتهي.</p><button>ابدأ 25 دقيقة</button></div>
      <button className="back-to-site" onClick={onSite}><House size={19} /> الموقع التعريفي</button>
      <div className="profile-mini"><span>ع</span><div><strong>عبد الوهاب السويد</strong><small>مالك الاستوديو</small></div><CaretDown size={15} /></div>
    </aside>
  );
}

function AppTopbar({ theme, onTheme, role, setRole, onCapture, canPreview, onExit }) {
  return (
    <header className="app-topbar">
      {canPreview ? <>
        <div className="mobile-brand"><Logo compact /></div>
        <div className="role-switch" aria-label="معاينة صلاحيات المستخدمين">
          <button className={role === "owner" ? "active" : ""} onClick={() => setRole("owner")}>الإدارة</button>
          <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>معاينة العميل</button>
          <button className={role === "collaborator" ? "active" : ""} onClick={() => setRole("collaborator")}>معاينة المتعاون</button>
        </div>
      </> : <div className="portal-identity"><Logo compact /><span><strong>{role === "client" ? "بوابة العميل" : "مساحة المتعاون"}</strong><small>دخول خاص وآمن</small></span></div>}
      <div className="topbar-actions">
        {canPreview && role === "owner" && <button className="quick-capture" onClick={onCapture}><Plus size={18} /> التقاط سريع <kbd>⌘ K</kbd></button>}
        <ThemeButton theme={theme} onToggle={onTheme} />
        <IconButton label="الإشعارات"><Bell size={19} /><span className="notification-count">3</span></IconButton>
        {!canPreview && <button className="button ghost portal-exit" onClick={onExit}><SignOut size={18} /> تسجيل الخروج</button>}
      </div>
    </header>
  );
}

function OwnerApp({ section, setSection, setRole, onProject, onCapture, onToast, siteContent, onPublishSite, onSite, scenario, onScenarioAdvance, onScenarioPatch, onScenarioReset }) {
  if (section === "scenario") return <ScenarioCenter scenario={scenario} onReset={onScenarioReset} setSection={setSection} setRole={setRole} />;
  if (section === "projects") return <ProjectsView onProject={onProject} scenario={scenario} onAdvance={onScenarioAdvance} onToast={onToast} />;
  if (section === "requests") return <RequestsView onToast={onToast} setSection={setSection} setRole={setRole} scenario={scenario} onAdvance={onScenarioAdvance} />;
  if (section === "briefs") return <BriefsView settings={siteContent} onToast={onToast} setSection={setSection} setRole={setRole} scenario={scenario} onAdvance={onScenarioAdvance} />;
  if (section === "documents") return <DocumentsView settings={siteContent} onToast={onToast} scenario={scenario} onAdvance={onScenarioAdvance} onPatch={onScenarioPatch} />;
  if (section === "clients") return <ClientsView />;
  if (section === "finance") return <FinanceView onToast={onToast} settings={siteContent} scenario={scenario} setRole={setRole} />;
  if (section === "team") return <TeamView scenario={scenario} setRole={setRole} />;
  if (section === "studio-settings") return <StudioSettingsView content={siteContent} onSave={onPublishSite} onToast={onToast} />;
  if (section === "site-admin") return <SiteAdminView content={siteContent} onPublish={onPublishSite} onPreview={onSite} onToast={onToast} />;
  return <OwnerOverview onProject={onProject} onCapture={onCapture} setSection={setSection} />;
}

function ClientPortal({ onToast, scenario, onAdvance, onPatch }) {
  const [brief, setBrief] = useState(scenario.briefAnswers || {});
  const [agreed, setAgreed] = useState(false);
  const [proofNote, setProofNote] = useState(scenario.proof.revisionNote || "");
  const [rating, setRating] = useState(scenario.feedback.rating || 0);
  const [feedbackNote, setFeedbackNote] = useState(scenario.feedback.note || "");
  const fillExample = () => setBrief({
    project_intro: "منصة سعودية لتنظيم الرحلات المحلية وحجز التجارب الموثوقة للعائلات.",
    impact: "تقلل وقت البحث وتجمع التخطيط والحجز في تجربة واحدة.",
    main_goal: "بناء علامة موثوقة ومحببة تساعد على الإطلاق والنمو.",
    main_audience: "العائلات الشابة من 25 إلى 40 عاماً في المدن السعودية.",
    personality: "دافئة، ذكية، مطمئنة، وقريبة من الثقافة المحلية.",
    deliverables: "الاستراتيجية البصرية، الشعار، الألوان، الخطوط، دليل مختصر، و8 تطبيقات.",
    launch: "2026-11-15",
    references: "3 ملفات مرجعية مرفوعة",
  });
  const step = scenario.step;
  const amount = (Number(scenario.quote.amount) * 0.5).toLocaleString("en-US");
  let actionContent;

  if (step === 0) actionContent = <div className="portal-wait-state"><Clock size={36} /><h2>الطلب قيد المراجعة</h2><p>وصل الطلب إلى عبد الوهاب. سيظهر البريف هنا بعد قبول المشروع.</p></div>;
  if (step === 1) actionContent = <form className="client-brief-form" onSubmit={(event) => { event.preventDefault(); onPatch({ briefAnswers: brief }); onAdvance(2, `أكملت ${scenario.client.name} بريف المشروع`, { briefAnswers: brief }); onToast("تم إرسال البريف إلى عبد الوهاب للمراجعة"); }}>
    <div className="portal-action-heading"><div><span>مطلوب منك الآن</span><h2>بريف صناعة العلامة</h2><p>الإجابات هنا ستصبح مرجع النطاق قبل عرض السعر.</p></div><button type="button" className="button ghost small" onClick={fillExample}><Sparkle size={17} /> تعبئة مثال</button></div>
    <div className="client-brief-grid"><label>حدثنا عن المشروع<textarea required rows="3" value={brief.project_intro || ""} onChange={(event) => setBrief((current) => ({ ...current, project_intro: event.target.value }))} /></label><label>ما الأثر الذي تريد صنعه؟<textarea required rows="3" value={brief.impact || ""} onChange={(event) => setBrief((current) => ({ ...current, impact: event.target.value }))} /></label><label>ما الهدف الرئيسي؟<textarea required rows="3" value={brief.main_goal || ""} onChange={(event) => setBrief((current) => ({ ...current, main_goal: event.target.value }))} /></label><label>من الجمهور الرئيسي؟<textarea required rows="3" value={brief.main_audience || ""} onChange={(event) => setBrief((current) => ({ ...current, main_audience: event.target.value }))} /></label><label>صف شخصية العلامة<textarea required rows="3" value={brief.personality || ""} onChange={(event) => setBrief((current) => ({ ...current, personality: event.target.value }))} /></label><label>ما المخرجات المطلوبة؟<textarea required rows="3" value={brief.deliverables || ""} onChange={(event) => setBrief((current) => ({ ...current, deliverables: event.target.value }))} /></label><label>موعد الإطلاق<input required type="date" value={brief.launch || ""} onChange={(event) => setBrief((current) => ({ ...current, launch: event.target.value }))} /></label><label>المراجع والملفات<input type="text" value={brief.references || ""} placeholder="أسماء الملفات أو الروابط" onChange={(event) => setBrief((current) => ({ ...current, references: event.target.value }))} /></label></div>
    <button className="button primary" type="submit">إرسال البريف للمراجعة <ArrowLeft size={18} /></button>
  </form>;
  if (step === 2) actionContent = <div className="portal-wait-state"><ShieldCheck size={36} /><h2>البريف لدى عبد الوهاب</h2><p>حُفظت إجاباتك، وسيظهر عرض السعر هنا بعد مراجعة النطاق.</p></div>;
  if (step === 3) actionContent = <div className="portal-wait-state"><FileText size={36} /><h2>يُجهز عرض السعر</h2><p>اعتمد البريف، ويجري الآن تثبيت القيمة والدفعات قبل الإرسال.</p></div>;
  if (step === 4) actionContent = <div className="client-document-action"><div className="portal-action-heading"><div><span>يحتاج موافقتك</span><h2>عرض السعر {scenario.quote.id}</h2><p>راجع النطاق والقيمة وخطة الدفعات.</p></div><span className="status-badge">صالح {scenario.quote.validityDays} أيام</span></div><article className="client-quote-sheet"><small>{scenario.project.service}</small><h3>{scenario.project.name}</h3><p>{scenario.quote.scope}</p><div className="client-quote-total"><span>القيمة الإجمالية</span><strong>{Number(scenario.quote.amount).toLocaleString("en-US")} {scenario.quote.currency}</strong></div><div className="preview-payments"><span><b>50%</b><small>دفعة أولى</small></span><span><b>50%</b><small>قبل التسليم</small></span></div></article><button className="button primary" onClick={() => { onAdvance(5, `اعتمدت ${scenario.client.name} عرض السعر`); onToast("تم اعتماد العرض وتجهيز العقد للتوقيع"); }}>اعتماد العرض <Check size={18} /></button></div>;
  if (step === 5) actionContent = <div className="client-document-action"><div className="portal-action-heading"><div><span>التوقيع الإلكتروني التجريبي</span><h2>عقد تقديم الخدمات {scenario.contract.id}</h2><p>نطاق العرض المعتمد وخطة الدفع مرتبطان بهذا العقد.</p></div></div><div className="client-contract-clauses"><p>يبدأ التنفيذ بعد توقيع الطرفين واستلام الدفعة الأولى.</p><p>تقدم البروفة الأولى خلال 14 يوم عمل، والتعديل خلال 7 أيام عمل.</p><p>تنتقل حقوق استخدام المخرجات النهائية بعد سداد كامل المستحقات.</p><p>تثبت المخرجات والاستثناءات في هذا العقد قبل بدء العمل.</p></div><label className="consent-field"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>قرأت البنود وأوافق على توقيع العقد باسم {scenario.client.company}.</span></label><button className="button primary" disabled={!agreed} onClick={() => { onAdvance(6, `وقعت ${scenario.client.name} العقد`, { contract: { ...scenario.contract, signedAt: "الآن" } }); onToast("تم توقيع العقد وإصدار فاتورة الدفعة الأولى"); }}>توقيع العقد <Check size={18} /></button></div>;
  if (step === 6) actionContent = <div className="client-payment-action"><Receipt size={34} /><span>فاتورة غير ضريبية</span><h2>الدفعة الأولى</h2><strong>{amount} {scenario.quote.currency}</strong><p>بعد السداد يبدأ المشروع وتظهر المهمة في مساحة المتعاون.</p><button className="button primary" onClick={() => { onAdvance(7, `سددت ${scenario.client.name} الدفعة الأولى`, { payments: { ...scenario.payments, first: true } }); onToast("تم تسجيل الدفعة وفتح مرحلة التنفيذ"); }}>محاكاة السداد الآمن <ArrowLeft size={18} /></button></div>;
  if (step === 7) actionContent = <div className="portal-wait-state"><UserFocus size={36} /><h2>{scenario.proof.revisionNote ? "التعديل لدى الفريق" : "بدأ التنفيذ"}</h2><p>{scenario.proof.revisionNote ? `ملاحظة التعديل: ${scenario.proof.revisionNote}` : `تعمل ${scenario.collaborator.name} على البروفة الأولى، وسيصلك إشعار عند رفعها.`}</p></div>;
  if (step === 8) actionContent = <div className="client-proof-action"><div className="portal-action-heading"><div><span>يحتاج قرارك</span><h2>البروفة رقم {scenario.proof.version}</h2><p>راجع الاتجاه البصري ودوّن قراراً واحداً واضحاً.</p></div></div><img src="/work-mandi.jpg" alt={`بروفة ${scenario.project.name}`} /><label>ملاحظة التعديل<textarea rows="3" value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="اكتب ملاحظة محددة عند طلب التعديل" /></label><div><button className="button ghost" disabled={!proofNote.trim()} onClick={() => { onAdvance(7, `طلبت ${scenario.client.name} تعديلاً على البروفة`, { proof: { ...scenario.proof, status: "تعديل مطلوب", revisionNote: proofNote, version: scenario.proof.version + 1 } }); onToast("وصل طلب التعديل إلى مساحة المتعاون"); }}>طلب تعديل</button><button className="button primary" onClick={() => { onAdvance(9, `اعتمدت ${scenario.client.name} البروفة`, { proof: { ...scenario.proof, status: "معتمدة", revisionNote: "" } }); onToast("تم اعتماد البروفة وإصدار الدفعة الأخيرة"); }}>اعتماد البروفة <Check size={18} /></button></div></div>;
  if (step === 9) actionContent = <div className="client-payment-action"><Receipt size={34} /><span>فاتورة غير ضريبية</span><h2>الدفعة الأخيرة</h2><strong>{amount} {scenario.quote.currency}</strong><p>بعد السداد يجهز عبد الوهاب حزمة الملفات النهائية.</p><button className="button primary" onClick={() => { onAdvance(10, `سددت ${scenario.client.name} الدفعة الأخيرة`, { payments: { ...scenario.payments, final: true } }); onToast("تم تسجيل السداد وأصبح المشروع جاهزاً للتسليم"); }}>محاكاة السداد الآمن <ArrowLeft size={18} /></button></div>;
  if (step === 10) actionContent = <div className="portal-wait-state"><FolderOpen size={36} /><h2>تُجهز حزمة التسليم</h2><p>اكتملت الدفعات، ويجري الآن فحص الملفات وتنظيمها قبل فتحها لك.</p></div>;
  if (step === 11) actionContent = <div className="client-delivery-action"><CheckCircle size={38} weight="fill" /><span>التسليم النهائي جاهز</span><h2>حزمة الملفات النهائية</h2><p>{scenario.project.name}</p><div><button onClick={() => onToast("تم تنزيل ملف دليل الهوية التجريبي")}><FileText size={22} /><span><strong>دليل الهوية.pdf</strong><small>PDF، 18.4 MB</small></span><ArrowLeft size={17} /></button><button onClick={() => onToast("تم تنزيل حزمة الملفات التجريبية")}><FolderOpen size={22} /><span><strong>ملفات الهوية النهائية.zip</strong><small>ZIP، 126 MB</small></span><ArrowLeft size={17} /></button></div><button className="button primary" onClick={() => { onAdvance(12, `أكدت ${scenario.client.name} استلام الملفات`, { delivery: { released: true, received: true } }); onToast("تم تأكيد الاستلام وجدولة المتابعة"); }}>تأكيد الاستلام <Check size={18} /></button></div>;
  if (step === 12) actionContent = <form className="client-feedback-action" onSubmit={(event) => { event.preventDefault(); onAdvance(13, `أرسلت ${scenario.client.name} تقييم المشروع`, { feedback: { rating, note: feedbackNote } }); onToast("شكراً، اكتمل المشروع وسُجلت المتابعة"); }}><span>متابعة بعد التسليم</span><h2>كيف كانت التجربة؟</h2><p>تقييمك يغلق الحلقة ويُحفظ في ملف العميل.</p><div className="feedback-scale">{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} className={rating === score ? "active" : ""} onClick={() => setRating(score)}>{score}</button>)}</div><label>ملاحظة أخيرة<textarea rows="3" value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="ما الذي تريد أن نحافظ عليه أو نحسنه؟" /></label><button className="button primary" type="submit" disabled={!rating}>إرسال التقييم وإنهاء المشروع <Check size={18} /></button></form>;
  if (step >= 13) actionContent = <div className="portal-complete-state"><CheckCircle size={46} weight="fill" /><span>اكتمل المشروع</span><h2>شكراً يا {scenario.client.name.split(" ")[0]}.</h2><p>العقد والدفعات والبروفات والتسليم والتقييم محفوظة في سجل واحد.</p></div>;

  return <div className="portal-page dashboard-content scenario-client-portal">
    <section className="portal-welcome"><div><small>مرحباً، {scenario.client.name}</small><h1>{scenario.project.name}</h1><p>{scenario.project.service} مع عبد الوهاب السويد.</p></div><span className="status-badge">{scenarioMilestones[Math.min(step, 13)].label}</span></section>
    <section className="portal-project-progress"><StageTrack current={scenarioToProjectStage(step)} /><div><span>التقدم</span><strong>{Math.min(step, 13)} من 13</strong></div></section>
    <section className="panel client-current-action">{actionContent}</section>
    <section className="client-columns scenario-client-columns"><div className="panel timeline-panel"><div className="panel-heading"><div><h2>سجل المشروع</h2><p>آخر الإجراءات المشتركة بينك وبين الفريق.</p></div></div><div className="client-timeline">{scenario.activity.slice(0, 5).map((item, index) => <div className="done" key={`${item.label}-${index}`}><CheckCircle size={19} weight="fill" /><span><strong>{item.label}</strong><small>{item.actor}، {item.at}</small></span></div>)}</div></div><div className="panel client-files"><div className="panel-heading"><div><h2>المستندات</h2><p>تظهر تلقائياً عند بلوغ مرحلتها.</p></div></div>{step >= 2 && <button><List size={22} /><span><strong>البريف</strong><small>{step >= 3 ? "معتمد" : "بانتظار المراجعة"}</small></span><CheckCircle size={18} weight="fill" /></button>}{step >= 4 && <button><FileText size={22} /><span><strong>عرض السعر</strong><small>{step >= 5 ? "معتمد" : "بانتظار قرارك"}</small></span>{step >= 5 && <CheckCircle size={18} weight="fill" />}</button>}{step >= 6 && <button><Handshake size={22} /><span><strong>العقد</strong><small>موقع إلكترونياً</small></span><CheckCircle size={18} weight="fill" /></button>}</div></section>
  </div>;
}

function CollaboratorPortal({ onToast, scenario, onAdvance }) {
  const deliver = () => {
    if (scenario.step !== 7) return;
    onAdvance(8, `رفعت ${scenario.collaborator.name} البروفة رقم ${scenario.proof.version}`, { proof: { ...scenario.proof, status: "بانتظار العميل", revisionNote: "" } });
    onToast("تم رفع البروفة وظهرت فوراً في بوابة العميل");
  };
  return (
    <div className="dashboard-content page-stack collaborator-page">
      <section className="collaborator-head"><div><small>مساحتك اليوم</small><h1>مرحباً {scenario.collaborator.name.split(" ")[0]}، لديك مهمة واحدة الآن.</h1><p>ترى المطلوب والموعد والملفات فقط، من دون معلومات العميل المالية.</p></div><div><Clock size={27} /><span>موعد المهمة<strong>{scenario.collaborator.due}</strong></span></div></section>
      <section className="collaborator-layout">
        <div className="task-stack">
          <article className="task-card active scenario-collaborator-task">
            <div className="task-index">1</div>
            <div className="task-copy"><span>{scenario.project.name}</span><h2>{scenario.collaborator.task}</h2><p><CalendarBlank size={17} /> {scenario.collaborator.due}</p>{scenario.proof.revisionNote && <blockquote>{scenario.proof.revisionNote}</blockquote>}</div>
            <span className={`task-status ${scenario.step > 7 ? "done" : ""}`}>{scenario.step < 7 ? "لم تبدأ" : scenario.step === 7 ? scenario.proof.revisionNote ? "تعديل مطلوب" : "جاهزة للرفع" : "تم الرفع"}</span>
            <div className="task-actions">
              {scenario.step === 7 && <><label className="button ghost upload-button">اختيار ملف <FileArrowUp size={18} /><input type="file" onChange={deliver} /></label><button className="button primary" onClick={deliver}>رفع بروفة تجريبية <ArrowLeft size={18} /></button></>}
              {scenario.step > 7 && <span className="collaborator-delivered"><CheckCircle size={28} weight="fill" /> ينتظر قرار العميل</span>}
              {scenario.step < 7 && <span className="collaborator-locked"><LockKey size={20} /> تفتح بعد العقد والدفعة الأولى</span>}
            </div>
          </article>
          <article className="task-card muted-task"><div className="task-index">2</div><div className="task-copy"><span>أصناف</span><h2>قوالب منشورات العودة</h2><p><CalendarBlank size={17} /> غداً، 11:00 ص</p></div><span className="task-status">لاحقاً</span></article>
        </div>
        <aside className="brief-card"><div><FileText size={24} /><span><strong>ملخص المهمة الحالية</strong><small>من البريف المعتمد</small></span></div><h3>المطلوب</h3><p>{scenario.quote.scope}</p><h3>الهدف</h3><p>{scenario.briefAnswers.main_goal || scenario.project.goal}</p><h3>ملفات المصدر</h3><button onClick={() => onToast("تم فتح حزمة المصادر التجريبية")}><FolderOpen size={18} /> حزمة المشروع <ArrowLeft size={16} /></button><h3>التسليم</h3><p>ملف PDF للعرض وملفات المصدر المنظمة. لا حاجة لإرسالها عبر واتساب.</p></aside>
      </section>
    </div>
  );
}

function MobileNav({ section, setSection }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);
  const select = (id) => {
    setSection(id);
    setMoreOpen(false);
  };
  return (
    <>
      {moreOpen && <div className="mobile-more-menu">
        {moreItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => select(item.id)}><Icon size={19} /><span>{item.label}</span><ArrowLeft size={15} /></button>; })}
      </div>}
      <nav className="mobile-nav" aria-label="تنقل الجوال">
        {primaryItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => select(item.id)}><Icon size={20} weight={section === item.id ? "fill" : "regular"} /><span>{item.label.replace("نظرة اليوم", "اليوم").replace("طلبات العملاء", "الطلبات")}</span></button>; })}
        <button className={moreOpen || moreItems.some((item) => item.id === section) ? "active" : ""} onClick={() => setMoreOpen((value) => !value)}><List size={20} /><span>المزيد</span></button>
      </nav>
    </>
  );
}

function Workspace({ theme, onTheme, onSite, initialRole, siteContent, onPublishSite, scenario, onUpdateScenario, onResetScenario }) {
  const [role, setRole] = useState(initialRole);
  const canPreview = initialRole === "owner";
  const [section, setSection] = useState("overview");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const advanceScenario = (step, label, patch = {}) => onUpdateScenario((current) => ({
    ...current,
    ...patch,
    step,
    activity: [{ label, actor: scenarioRoleLabels[role], at: "الآن" }, ...current.activity],
  }));
  const patchScenario = (patch) => onUpdateScenario((current) => ({ ...current, ...patch }));
  const resetScenario = () => {
    onResetScenario();
    setRole("owner");
    setSection("scenario");
    showToast("بدأ سيناريو جديد من طلب الخدمة");
  };
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [role, section]);
  return (
    <div className="workspace">
      {canPreview && role === "owner" && <Sidebar section={section} setSection={setSection} onSite={onSite} />}
      <div className={`workspace-main ${role !== "owner" || !canPreview ? "portal-main" : ""}`}>
        <AppTopbar theme={theme} onTheme={onTheme} role={role} setRole={setRole} onCapture={() => setCaptureOpen(true)} canPreview={canPreview} onExit={onSite} />
        {canPreview && role === "owner" && <OwnerApp section={section} setSection={setSection} setRole={setRole} onProject={setSelectedProject} onCapture={() => setCaptureOpen(true)} onToast={showToast} siteContent={siteContent} onPublishSite={onPublishSite} onSite={onSite} scenario={scenario} onScenarioAdvance={advanceScenario} onScenarioPatch={patchScenario} onScenarioReset={resetScenario} />}
        {role === "client" && <ClientPortal onToast={showToast} scenario={scenario} onAdvance={advanceScenario} onPatch={patchScenario} />}
        {role === "collaborator" && <CollaboratorPortal onToast={showToast} scenario={scenario} onAdvance={advanceScenario} />}
      </div>
      {canPreview && role === "owner" && <MobileNav section={section} setSection={setSection} />}
      {canPreview && captureOpen && <CaptureModal onClose={() => setCaptureOpen(false)} onAdd={(text) => showToast(`تم حفظ: ${text}`)} />}
      {selectedProject && <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} onToast={showToast} />}
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("site");
  const initialTheme = useMemo(() => {
    const saved = window.localStorage.getItem("u89-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const [theme, setTheme] = useState(initialTheme);
  const [siteContent, setSiteContent] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("u89-site-content"));
      if (!saved) return defaultSiteContent;
      const merged = { ...defaultSiteContent, ...saved, sectionVisibility: { ...defaultSiteContent.sectionVisibility, ...saved.sectionVisibility } };
      if (saved.email === "W@U89DES.COM") merged.email = defaultSiteContent.email;
      if (!saved.revisionRounds) merged.revisionRounds = defaultSiteContent.revisionRounds;
      if (!Array.isArray(saved.briefTemplates)) merged.briefTemplates = defaultSiteContent.briefTemplates;
      return merged;
    } catch {
      return defaultSiteContent;
    }
  });
  const [scenario, setScenario] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("u89-demo-scenario"));
      if (!saved || typeof saved.step !== "number") return defaultScenario;
      return {
        ...defaultScenario,
        ...saved,
        client: { ...defaultScenario.client, ...saved.client },
        project: { ...defaultScenario.project, ...saved.project },
        quote: { ...defaultScenario.quote, ...saved.quote },
        contract: { ...defaultScenario.contract, ...saved.contract },
        payments: { ...defaultScenario.payments, ...saved.payments },
        collaborator: { ...defaultScenario.collaborator, ...saved.collaborator },
        proof: { ...defaultScenario.proof, ...saved.proof },
        delivery: { ...defaultScenario.delivery, ...saved.delivery },
        feedback: { ...defaultScenario.feedback, ...saved.feedback },
      };
    } catch {
      return defaultScenario;
    }
  });
  const [workspaceRole, setWorkspaceRole] = useState("owner");
  const [requestOpen, setRequestOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("u89-theme", next);
  };
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    window.localStorage.setItem("u89-demo-scenario", JSON.stringify(scenario));
  }, [scenario]);
  useEffect(() => {
    document.title = siteContent.seoTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", siteContent.seoDescription);
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", siteContent.indexable ? "index, follow" : "noindex, nofollow");
  }, [siteContent]);
  const enterWorkspace = (role) => {
    setWorkspaceRole(role);
    setAccessOpen(false);
    setView("workspace");
  };
  const openRequest = () => {
    if (siteContent.acceptingRequests) setRequestOpen(true);
  };
  const publishSite = (nextContent) => {
    setSiteContent(nextContent);
    window.localStorage.setItem("u89-site-content", JSON.stringify(nextContent));
  };

  return (
    <>
      {view === "site" ? (
        <LandingPage theme={theme} onTheme={toggleTheme} onAccess={() => setAccessOpen(true)} onRequest={openRequest} content={siteContent} />
      ) : (
        <Workspace theme={theme} onTheme={toggleTheme} onSite={() => setView("site")} initialRole={workspaceRole} siteContent={siteContent} onPublishSite={publishSite} scenario={scenario} onUpdateScenario={setScenario} onResetScenario={() => setScenario({ ...defaultScenario, activity: [...defaultScenario.activity] })} />
      )}
      {requestOpen && <ServiceRequestModal onClose={() => setRequestOpen(false)} onSubmit={(data) => setScenario(scenarioFromRequest(data, siteContent))} settings={siteContent} />}
      {accessOpen && <AccessModal onClose={() => setAccessOpen(false)} onEnter={enterWorkspace} />}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  checkPlatformConnection,
  authLanding,
  sendPasswordReset,
  setMyPassword,
  getCurrentAccess,
  loadPublishedSiteContent,
  loadStudioSettings,
  platformConfig,
  publishSiteContent,
  sendMagicLink,
  saveStudioSettings,
  signInWithPassword,
  signOutPlatform,
  submitPublicServiceRequest,
  subscribeToAuth,
  workflow,
} from "./lib/studio-platform";
import {
  LiveClientPortal,
  LiveCollaboratorPortal,
  LiveOwnerSection,
  useWorkspaceData,
} from "./LiveOperations";
import MarketingSite from "./MarketingSite";
import PortfolioDesk from "./PortfolioDesk";
import { authErrorMessage, needsFirstPassword, passwordValidation } from "./lib/auth-flow.js";
import ControlCenter, { buildControlModel, groupMoney, CommandPalette, FocusSession } from "./ControlCenter";
import "./control-center.css";
import { portfolioProjects } from "./portfolio-data";
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
  EnvelopeSimple,
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
  Printer,
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
  { label: "اختيار طريقة التنفيذ", role: "owner", section: "work-orders", description: "نفذ الطلب بنفسك، أرسله كاملاً لمتعاون، أو قسّمه إلى أجزاء مرتبطة بمنفذين مختلفين." },
  { label: "قرار العميل", role: "client", section: "projects", description: "بعد اعتمادك الداخلي، تصل البروفة للعميل ليعتمدها أو يطلب تعديلاً." },
  { label: "سداد الدفعة الأخيرة", role: "client", section: "finance", description: "أكمل الدفعة الأخيرة قبل تسليم الملفات." },
  { label: "إطلاق التسليم", role: "owner", section: "projects", description: "أكد اكتمال الحزمة وافتحها للعميل." },
  { label: "تأكيد الاستلام", role: "client", section: "projects", description: "نزّل الحزمة النهائية وأكد استلامها." },
  { label: "المتابعة", role: "client", section: "clients", description: "أرسل تقييم التجربة وأغلق المشروع." },
  { label: "مكتمل", role: "owner", section: "scenario", description: "اكتمل السيناريو وأصبحت كل السجلات مترابطة." },
];

const scenarioRoleLabels = {
  owner: "عبد الوهاب",
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

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : initialValue;
      if (key === "u89-work-orders" && Array.isArray(parsed)) {
        const seen = new Set();
        return parsed.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      }
      return parsed;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  if (key === "u89-work-orders" && Array.isArray(value)) {
    const seen = new Set();
    return [value.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }), setValue];
  }
  return [value, setValue];
}

const navItems = [
  { id: "overview", label: "نظرة اليوم", icon: SquaresFour },
  { id: "scenario", label: "التجربة الكاملة", icon: Target },
  { id: "projects", label: "المشاريع", icon: FolderOpen },
  { id: "work-orders", label: "التنفيذ والتفويض", icon: UserFocus },
  { id: "requests", label: "طلبات العملاء", icon: Tray },
  { id: "briefs", label: "البريفات", icon: List },
  { id: "documents", label: "العروض والعقود", icon: FileText },
  { id: "clients", label: "العملاء", icon: UsersThree },
  { id: "contact-inbox", label: "رسائل التواصل", icon: EnvelopeSimple },
  { id: "finance", label: "الحسابات", icon: Wallet },
  { id: "team", label: "المتعاونون", icon: UserFocus },
  { id: "access", label: "الحسابات والصلاحيات", icon: LockKey },
  { id: "studio-settings", label: "إعدادات العمل", icon: SlidersHorizontal },
  { id: "site-admin", label: "إدارة الموقع", icon: Globe },
  { id: "system", label: "الربط والإطلاق", icon: ShieldCheck },
];

const identityApplications = [
  "بطاقات العمل والمراسلات",
  "قوالب العروض التقديمية",
  "قوالب التواصل الاجتماعي",
  "المطبوعات التعريفية",
  "التغليف والملصقات",
  "الزي والمركبات",
  "اللوحات والواجهات",
  "الموقع أو الصفحة التعريفية",
  "تطبيقات أخرى يحددها العميل",
];

const serviceList = [
  {
    id: "service-3",
    title: "بناء العلامة",
    description: "مسار واحد مرن يجمع ما تحتاجه العلامة من الأساس حتى نظامها البصري.",
    selectionLabel: "اختر ما تحتاجه في هذه المرحلة",
    options: ["شخصية العلامة", "تسمية العلامة", "استراتيجية العلامة", "الهوية البصرية"],
    conditionalOption: "الهوية البصرية",
    conditionalLabel: "اختر تطبيقات الهوية التي تحتاجها",
    conditionalOptions: identityApplications,
    engagement: "project",
    active: true,
  },
  {
    id: "service-4",
    title: "تطوير العلامة",
    description: "نراجع العلامة القائمة ونحدد ما يبقى وما يتغير ثم نعيد بناء ما تحتاجه فقط.",
    selectionLabel: "ما الذي يحتاج إلى تطوير؟",
    options: ["تدقيق العلامة الحالية", "إعادة التموضع والاستراتيجية", "الشخصية والنبرة", "الاسم", "الهوية البصرية", "تحديث تطبيقات الهوية"],
    conditionalOption: "الهوية البصرية",
    conditionalLabel: "اختر التطبيقات التي يشملها التطوير",
    conditionalOptions: identityApplications,
    engagement: "project",
    active: true,
  },
  {
    id: "service-5",
    title: "الخطوط والحروف",
    description: "حلول طباعية مخصصة للعلامات من الشعار الكتابي إلى نظام خط متكامل.",
    selectionLabel: "اختر المخرجات المطلوبة",
    options: ["شعار كتابي", "حروف عنوان مخصصة", "خط عرض للعلامة", "عائلة خط متكاملة", "مواءمة خط عربي ولاتيني", "نظام طباعي للهوية"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-6",
    title: "التوجيه والاستشارة الإبداعية",
    description: "قرار إبداعي أو مراجعة أو قيادة تصميمية تساعد الفريق على التحرك بوضوح.",
    selectionLabel: "ما نوع الدعم الذي تحتاجه؟",
    options: ["مراجعة مشروع قائم", "بناء توجه إبداعي", "قيادة حملة", "ورشة عمل", "خارطة طريق تصميمية", "إشراف دوري على فريق"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-packaging",
    title: "تصميم التغليف",
    description: "نظام تغليف واضح وجذاب وقابل للتوسع من المنتج الأول إلى عائلة كاملة.",
    selectionLabel: "حدد نطاق التغليف",
    options: ["فكرة وتصميم عبوة", "ملصق منتج", "نظام عائلة منتجات", "هرمية المعلومات", "رسوم أو عناصر خاصة", "ملفات جاهزة للإنتاج"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-campaign",
    title: "الحملات والاتصال البصري",
    description: "فكرة الحملة ونظامها البصري وتطبيقاتها عبر القنوات التي تحتاجها.",
    selectionLabel: "اختر نطاق الحملة",
    options: ["الفكرة الإبداعية", "الرسالة والنبرة", "المشهد البصري الرئيسي", "قوالب المنصات", "إعلانات خارجية", "مواد الإطلاق", "دليل تنفيذ الحملة"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-digital",
    title: "تجارب العلامة الرقمية",
    description: "نحوّل العلامة إلى تجربة رقمية متماسكة في الموقع والواجهات والمنتجات.",
    selectionLabel: "اختر ما تحتاجه رقمياً",
    options: ["هيكلة المحتوى والتجربة", "موقع تعريفي", "صفحة إطلاق", "توجيه واجهة منتج", "مكتبة واجهات", "نظام تصميم رقمي"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-editorial",
    title: "التصميم التحريري والمعلوماتي",
    description: "تقارير وعروض وكتب وأدلة تجعل المحتوى الطويل واضحاً ومقنعاً.",
    selectionLabel: "اختر نوع المخرج",
    options: ["تقرير سنوي", "عرض تقديمي", "كتاب أو دليل", "كتيب أو ملف تعريفي", "كتالوج", "إنفوجرافيك ونظام معلومات"],
    engagement: "project",
    active: true,
  },
  {
    id: "service-retainer",
    title: "شراكة تصميم مستمرة",
    description: "عقد شهري أو سنوي يفتح للعميل مساحة طلبات مستمرة طوال مدة العقد.",
    selectionLabel: "ما الأعمال التي تريد طلبها خلال العقد؟",
    options: ["تصميم المحتوى", "الحملات الموسمية", "المواد البيعية", "العروض والتقارير", "تحديثات الموقع", "الاستشارة والتوجيه الإبداعي"],
    engagement: "retainer",
    billingOptions: ["شهري", "سنوي"],
    active: true,
  },
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
  {
    id: "brief-packaging",
    serviceId: "service-packaging",
    title: "بريف تصميم التغليف",
    description: "يربط المنتج والسوق ومتطلبات الإنتاج بنظام العبوة والمعلومات والمخرجات.",
    enabled: true,
    sections: [
      { id: "product", title: "المنتج والسوق", fields: [
        { id: "product_intro", label: "ما المنتج وما الذي يميزه؟", type: "textarea", required: true },
        { id: "audience", label: "من يشتريه وأين يراه؟", type: "textarea", required: true },
        { id: "competitors", label: "ما المنتجات المنافسة على الرف أو في المتجر؟", type: "textarea", required: true },
        { id: "variants", label: "كم منتجاً أو حجماً أو نكهة يشمل النطاق؟", type: "textarea", required: true },
      ] },
      { id: "production", title: "المحتوى والإنتاج", fields: [
        { id: "pack_type", label: "ما نوع العبوة ومقاساتها وخامتها؟", type: "textarea", required: true },
        { id: "required_content", label: "ما المعلومات النظامية والتجارية المطلوبة؟", type: "textarea", required: true },
        { id: "printer", label: "هل يوجد مورد أو قالب قص جاهز؟", type: "textarea", required: false },
        { id: "files", label: "أرفق الهوية والقوالب والصور والمحتوى", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-campaign-service",
    serviceId: "service-campaign",
    title: "بريف الحملة والاتصال البصري",
    description: "يحدد الهدف والرسالة والجمهور والقنوات والمخرجات قبل بناء فكرة الحملة.",
    enabled: true,
    sections: [
      { id: "campaign", title: "هدف الحملة", fields: [
        { id: "campaign_goal", label: "ما النتيجة التجارية أو الاتصالية المطلوبة؟", type: "textarea", required: true },
        { id: "audience", label: "من الجمهور وما الذي نريد منه أن يفعله؟", type: "textarea", required: true },
        { id: "message", label: "ما الرسالة أو العرض الذي يجب أن يصل؟", type: "textarea", required: true },
        { id: "launch", label: "متى تبدأ الحملة وكم تستمر؟", type: "textarea", required: true },
      ] },
      { id: "channels", title: "القنوات والمخرجات", fields: [
        { id: "channels", label: "ما القنوات التي ستعمل عليها الحملة؟", type: "multiselect", required: true, options: ["منصات رقمية", "فيديو", "إعلانات خارجية", "داخل الفروع", "مطبوعات", "بريد"] },
        { id: "deliverables", label: "ما المخرجات والكميات والمقاسات؟", type: "textarea", required: true },
        { id: "must_include", label: "ما العناصر أو المعلومات التي لا يمكن تغييرها؟", type: "textarea", required: false },
        { id: "files", label: "أرفق الهوية والمحتوى والمواد المتاحة", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-digital",
    serviceId: "service-digital",
    title: "بريف تجربة العلامة الرقمية",
    description: "يفهم المستخدم والمحتوى والوظائف والمنصات قبل تصميم الموقع أو الواجهة.",
    enabled: true,
    sections: [
      { id: "experience", title: "التجربة المطلوبة", fields: [
        { id: "product_intro", label: "ما المنتج أو الموقع وما دوره؟", type: "textarea", required: true },
        { id: "users", label: "من المستخدمون وما أهم احتياجاتهم؟", type: "textarea", required: true },
        { id: "main_action", label: "ما الإجراء الأهم الذي يجب أن ينجزه المستخدم؟", type: "textarea", required: true },
        { id: "pages", label: "ما الصفحات أو المسارات المتوقعة؟", type: "textarea", required: true },
      ] },
      { id: "delivery", title: "المحتوى والتقنية", fields: [
        { id: "content_status", label: "ما المحتوى المتاح وما الذي يحتاج إلى إعداد؟", type: "textarea", required: true },
        { id: "technology", label: "هل توجد منصة أو متطلبات تقنية محددة؟", type: "textarea", required: false },
        { id: "launch", label: "ما موعد الإطلاق المستهدف؟", type: "date", required: true },
        { id: "files", label: "أرفق الهوية والمحتوى والمراجع", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-editorial",
    serviceId: "service-editorial",
    title: "بريف التصميم التحريري والمعلوماتي",
    description: "ينظم الهدف والمحتوى والجمهور وشكل النشر قبل بناء النظام التحريري.",
    enabled: true,
    sections: [
      { id: "content", title: "المحتوى والقارئ", fields: [
        { id: "purpose", label: "ما وظيفة المخرج ومن سيقرأه؟", type: "textarea", required: true },
        { id: "content_size", label: "ما حجم المحتوى وحالته الحالية؟", type: "textarea", required: true },
        { id: "language", label: "ما اللغات المطلوبة؟", type: "multiselect", required: true, options: ["العربية", "الإنجليزية", "ثنائي اللغة", "لغات أخرى"] },
        { id: "structure", label: "هل توجد بنية أو أبواب أو أقسام معتمدة؟", type: "textarea", required: false },
      ] },
      { id: "format", title: "الشكل والتسليم", fields: [
        { id: "format", label: "هل المخرج مطبوع أم رقمي وما مقاسه؟", type: "textarea", required: true },
        { id: "visual_assets", label: "ما الصور والرسوم والبيانات المتاحة؟", type: "textarea", required: true },
        { id: "deadline", label: "ما موعد التسليم أو الطباعة؟", type: "date", required: true },
        { id: "files", label: "أرفق النصوص والجداول والهوية", type: "file", required: false },
      ] },
    ],
  },
  {
    id: "brief-retainer",
    serviceId: "service-retainer",
    title: "بريف شراكة التصميم المستمرة",
    description: "يحدد حجم الطلبات المتوقعة وطريقة ترتيبها واعتمادها خلال العقد الشهري أو السنوي.",
    enabled: true,
    sections: [
      { id: "needs", title: "الاحتياج المستمر", fields: [
        { id: "business_context", label: "ما طبيعة العمل ولماذا تحتاج شراكة تصميم مستمرة؟", type: "textarea", required: true },
        { id: "monthly_requests", label: "ما أنواع الطلبات والكميات المتوقعة كل شهر؟", type: "textarea", required: true },
        { id: "channels", label: "ما القنوات والفرق التي ستستخدم المخرجات؟", type: "textarea", required: true },
        { id: "existing_system", label: "هل توجد هوية وقوالب ونظام عمل قائم؟", type: "textarea", required: true },
      ] },
      { id: "operations", title: "التشغيل والاعتماد", fields: [
        { id: "requesters", label: "من يحق له رفع الطلبات ومن يعتمدها؟", type: "textarea", required: true },
        { id: "priorities", label: "كيف تفرّق بين الطلب العادي والعاجل؟", type: "textarea", required: true },
        { id: "response_time", label: "ما زمن الاستجابة والتسليم المتوقع؟", type: "textarea", required: true },
        { id: "files", label: "أرفق الهوية والقوالب وأمثلة الطلبات السابقة", type: "file", required: false },
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
  catalogVersion: 8,
  heroTitle: "نصنع الأثر الذي تحتاجه علامتك.",
  heroBody: "من الفكرة الأولى إلى حضور يتماسك، يُرى، ويُتذكر.",
  heroCta: "تواصل معنا",
  servicesTitle: "كيف أقدر أخدمك؟",
  workTitle: "أعمال مختارة",
  finalTitle: "لنتحدث عن علامتك.",
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
  bankAccount: "",
  bankIban: "",
  vatRegistered: false,
  defaultCurrency: "SAR",
  collaboratorCurrencies: ["SAR", "USD", "EUR"],
  quoteValidityDays: 10,
  firstProofDays: 14,
  revisionRounds: "يحدد لكل مشروع",
  revisionDays: 7,
  restartDays: 10,
  finalizationDays: 14,
  services: serviceList,
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
  serviceVisibility: serviceList.map(() => true),
  portfolioProjects,
  workVisibility: portfolioProjects.map(() => true),
  maintenance: false,
  sectionVisibility: {
    services: true,
    work: true,
    about: true,
  },
};

const retainerRequests = [
  { id: 1, title: "حملة افتتاح فرع العليا", client: "قصر التوابل", assignee: "عبد الوهاب", due: "7 أغسطس", status: "جديد" },
  { id: 2, title: "منشورات العودة للمدارس", client: "أصناف", assignee: "عبد الوهاب", due: "9 أغسطس", status: "في تنفيذ عبد الوهاب" },
  { id: 3, title: "تحديث قائمة المنتجات", client: "مامولا", assignee: "عبد الوهاب", due: "11 أغسطس", status: "بانتظار الفكرة" },
  { id: 4, title: "إعلان منتج موسمي", client: "قصر التوابل", assignee: "عبد الوهاب", due: "14 أغسطس", status: "مراجعة إبداعية" },
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
  creative: {
    executionMode: "owner_led",
    core: "السفر المحلي يبدأ من طمأنينة العائلة، لا من كثرة الخيارات.",
    rationale: "يبني عبد الوهاب الاتجاه حول فكرة تنظيم الرحلة بثقة، ثم يحولها بنفسه إلى نظام بصري وبروفة أولى.",
  },
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
      requestedOptions: Array.isArray(data.serviceOptions) ? data.serviceOptions : [],
      requestedApplications: Array.isArray(data.serviceApplications) ? data.serviceApplications : [],
      engagement: data.engagement || "project",
      billingCycle: data.billingCycle || null,
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
  { id: "COL-014", workOrderId: "WO-1030", collaborator: "ريم السالم", project: "نموذج تفويض تجريبي", item: "3 مقاسات إنتاجية", amount: "1,050", currency: "SAR", status: "بانتظار اعتماد المنجز" },
  { id: "COL-015", collaborator: "Lina Moretti", project: "نموذج تفويض تجريبي", item: "معالجة 4 صور", amount: "220", currency: "USD", status: "مستحقة" },
  { id: "COL-016", collaborator: "Marc Vidal", project: "نموذج تفويض تجريبي", item: "موك أب إنتاجي", amount: "180", currency: "EUR", status: "مدفوعة" },
];

const initialDocuments = [
  { id: "Q-0482", type: "quote", title: "عرض سعر", client: "شركة أصناف للتجارة", contact: "أحمد البشري", project: "صناعة علامة وهوية بصرية", amount: "10850", currency: "SAR", paymentPlan: "two-50", status: "مسودة", updated: "اليوم" },
  { id: "C-0118", type: "contract", title: "عقد تقديم خدمات إبداعية", client: "مجموعة أختر", contact: "خالد أختر", project: "تطوير العلامة", amount: "14200", currency: "SAR", paymentPlan: "three-40", status: "يحتاج مراجعتك", updated: "منذ ساعتين" },
  { id: "Q-0479", type: "quote", title: "عرض سعر", client: "خلية فارس", contact: "ياسر المحيميد", project: "صناعة علامة تجارية وهوية بصرية", amount: "3000", currency: "SAR", paymentPlan: "two-50", status: "معتمد", updated: "30 أكتوبر" },
];

const team = [
  { name: "ريم السالم", role: "متعاونة إنتاجية افتراضية", load: "لا مهام", focus: "متاحة عند التفويض" },
  { name: "مازن الحربي", role: "متعاون إنتاجي افتراضي", load: "لا مهام", focus: "متاح عند التفويض" },
  { name: "سارة العتيبي", role: "متعاونة كتابة افتراضية", load: "لا مهام", focus: "متاحة عند التفويض" },
];

const initialWorkOrders = [
  {
    id: "WO-1027",
    project: "سيد مندي",
    title: "تصميم نظام التغليف الأساسي",
    description: "تطوير واجهة العبوة الرئيسية والنسخ الخاصة بالأحجام الثلاثة، مع تثبيت الهرمية البصرية ومناطق المعلومات.",
    recommendations: "أبدأ من اتجاه الخط العربي المعتمد، وأخفف حضور الزخرفة. المهم أن تبقى العبوة واضحة من مسافة الرف.",
    creativeCore: "عبوة تتكلم بوضوح العلامة قبل أن تتكلم بزخرفتها.",
    creativeRationale: "المنتج يحتاج حضوراً قوياً على الرف، لذلك يقود الاسم التكوين وتأتي العناصر التراثية كطبقة دعم لا كموضوع بصري مستقل.",
    creativeNotes: "طورت الفكرة والهرمية والنظام والتطبيقات بنفسي. هذه الوقفة لمراجعة البروفة بعين المدير الإبداعي قبل إرسالها.",
    delegationScope: "",
    executionMode: "owner_led",
    creativeStage: "production",
    priority: "عالية",
    due: "2026-08-10",
    status: "internal_review",
    dispatched: false,
    clientApproval: true,
    assignees: [],
    files: ["بريف التغليف.pdf", "قالب القص.ai", "بروفة-02.pdf"],
    messages: [],
    proof: { title: "بروفة التغليف، النسخة 2", status: "internal_review", note: "خففت الزخرفة ورفعت وضوح اسم المنتج، وأراجع الآن توازن النظام على العبوات." },
  },
  {
    id: "WO-1028",
    project: "بخاري أختر",
    title: "تطبيقات واجهة الفرع",
    description: "تجهيز ثلاث تطبيقات للواجهة الخارجية واللوحة الجانبية وفق الهوية المعتمدة.",
    recommendations: "أختبر التكوين الأفقي في الواجهة الرئيسية مع مسافة أمان أكبر حول العلامة.",
    creativeCore: "",
    creativeRationale: "",
    creativeNotes: "مساحة خاصة لتطوير الفكرة والتكوين قبل تقرير إن كان التنفيذ يحتاج مساعدة.",
    delegationScope: "",
    executionMode: "owner_led",
    creativeStage: "exploration",
    priority: "عادية",
    due: "2026-08-13",
    status: "draft",
    dispatched: false,
    clientApproval: false,
    assignees: [],
    files: ["صور الموقع.zip"],
    messages: [],
    proof: null,
  },
  {
    id: "WO-1029",
    project: "مامولا",
    title: "تطوير دليل النبرة المختصر",
    description: "كتابة مبادئ النبرة مع أمثلة قبل وبعد لرسائل المنتج والتغليف وخدمة العملاء.",
    recommendations: "أحافظ على نبرة دافئة وخبيرة، وأتجنب العبارات الدعائية المبالغ فيها، مع أمثلة قابلة للاستخدام مباشرة.",
    creativeCore: "صوت يشبه رائحة المخبز: قريب، دافئ، وواثق من دون تكلّف.",
    creativeRationale: "بنيت الاتجاه الكتابي ليحوّل شخصية مامولا إلى قواعد وأمثلة قابلة للاستخدام من دون فقدان الدفء أو الدقة.",
    creativeNotes: "ثبتُّ المنطق والنبرة الأساسية وأعمل الآن على توسيع الأمثلة وربطها بالتطبيقات البصرية.",
    delegationScope: "",
    executionMode: "owner_led",
    creativeStage: "production",
    priority: "عادية",
    due: "2026-08-12",
    status: "owner_production",
    dispatched: false,
    clientApproval: false,
    assignees: [],
    files: ["دليل الشخصية.pdf", "أمثلة الرسائل.docx"],
    messages: [],
    proof: null,
  },
  {
    id: "WO-1030",
    project: "مشروع تجريبي",
    title: "تجهيز ثلاث مقاسات للنشر",
    description: "تطبيق التصميم المعتمد على المقاسات الثلاثة وتجهيز الملفات النهائية للنشر.",
    recommendations: "حافظي على التكوين كما هو، وعدّلي توزيع العناصر بما يناسب كل مقاس.",
    creativeCore: "",
    creativeRationale: "",
    creativeNotes: "",
    delegationScope: "",
    executionMode: "delegated",
    creativeStage: "production",
    priority: "عادية",
    due: "2026-08-16",
    status: "dispatched",
    dispatched: true,
    clientApproval: false,
    assignees: ["ريم السالم"],
    compensation: { "ريم السالم": { amount: "1050", currency: "SAR", status: "متفق عليه" } },
    files: ["التصميم-المعتمد.pdf"],
    messages: [{ id: "m-demo", author: "عبد الوهاب", body: "هذا هو التصميم المعتمد. جهزي المقاسات الثلاثة وارفعيها هنا.", at: "اليوم" }],
    proof: null,
  },
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

function NotificationCenter({ items, onClose, onRead }) {
  return <aside className="notification-center" aria-label="مركز الإشعارات"><header><div><small>القرارات والتحديثات</small><h2>الإشعارات</h2></div><IconButton label="إغلاق الإشعارات" onClick={onClose}><X size={18} /></IconButton></header>{items.length ? <div className="notification-list">{items.map((item) => <button key={item.id} className={item.read_at ? "read" : ""} onClick={() => onRead(item)}><span className="notification-dot" /><span><strong>{item.subject}</strong><p>{item.message}</p><small>{item.created_at ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at)) : "الآن"}</small></span></button>)}</div> : <div className="notification-empty"><Bell size={28} /><strong>لا توجد إشعارات جديدة</strong><p>سيظهر هنا فقط ما يحتاج معرفة أو قراراً.</p></div>}</aside>;
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

function QuickContactModal({ onClose }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok || !result.sent) throw new Error(result.error || "تعذر إرسال الرسالة");
      setStatus("sent");
    } catch (err) { setError(err.message || "تعذر الإرسال. حاول مرة أخرى."); setStatus(""); }
  };
  return <Modal title="تواصل معنا" onClose={onClose}>{status === "sent" ? <div className="success-state"><CheckCircle size={46} /><h3>وصلت رسالتك</h3><p>شكراً لتواصلك. سنرد عليك عبر وسيلة التواصل التي كتبتها.</p><button className="button primary" onClick={onClose}>تم</button></div> : <form className="request-form" onSubmit={submit}>
    <label className="request-honeypot" aria-hidden="true">الموقع<input name="website" tabIndex="-1" autoComplete="off" /></label>
    <label>اسمك<input name="name" maxLength={100} autoComplete="name" required /></label>
    <label>وسيلة التواصل<input name="contact" minLength={5} maxLength={200} placeholder="بريدك الإلكتروني أو رقم جوالك" required /></label>
    <label>رسالتك<textarea name="message" rows={5} maxLength={4000} required /></label>
    <small>نستخدم بياناتك للرد على رسالتك فقط.</small>
    {error && <p role="alert">{error}</p>}<button className="button primary" type="submit" disabled={status === "sending"}>{status === "sending" ? "جارٍ الإرسال..." : "إرسال الرسالة"}</button>
  </form>}</Modal>;
}

function ServiceRequestModal({ onClose, onSubmit, settings }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedConditionalOptions, setSelectedConditionalOptions] = useState([]);
  const [billingCycle, setBillingCycle] = useState("");
  const selectedService = (settings.services || []).find((service) => service.id === serviceId);
  const toggleOption = (value, setter) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const selectService = (value) => {
    setServiceId(value);
    setSelectedOptions([]);
    setSelectedConditionalOptions([]);
    setBillingCycle("");
    setError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.website) return;
    if (!selectedService) { setError("اختر الخدمة المطلوبة أولاً."); return; }
    if ((selectedService.options || []).length && !selectedOptions.length) { setError("اختر عنصراً واحداً على الأقل من نطاق الخدمة."); return; }
    if (selectedService.conditionalOption && selectedOptions.includes(selectedService.conditionalOption) && !selectedConditionalOptions.length) { setError("اختر تطبيقاً واحداً على الأقل ضمن الهوية البصرية."); return; }
    if (selectedService.engagement === "retainer" && !billingCycle) { setError("اختر مدة الشراكة الشهرية أو السنوية."); return; }
    setStatus("sending");
    setError("");
    try {
      await onSubmit({
        ...data,
        serviceId,
        serviceOptions: selectedOptions,
        serviceApplications: selectedConditionalOptions,
        engagement: selectedService.engagement || "project",
        billingCycle: selectedService.engagement === "retainer" ? billingCycle : null,
      });
      setStatus("sent");
    } catch (submitError) {
      setStatus("error");
      setError(submitError.message || "تعذر إرسال الطلب الآن. حاول مرة أخرى.");
    }
  };

  return (
    <Modal title="تواصل معنا" onClose={onClose}>
      {status === "sent" ? (
        <div className="success-state">
          <CheckCircle size={46} weight="fill" />
          <h3>وصلت رسالتك</h3>
          <p>سأتواصل معك خلال يوم عمل لمراجعة احتياج المشروع.</p>
          <button className="button primary" onClick={onClose}>تم</button>
        </div>
      ) : (
        <form className="request-form" onSubmit={submit}>
          <label className="request-honeypot" aria-hidden="true">الموقع<input name="website" tabIndex="-1" autoComplete="off" /></label>
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
            <label>طريقة استلام الرد<select name="notifications" required defaultValue="واتساب"><option value="واتساب">واتساب</option><option value="البريد الإلكتروني">البريد الإلكتروني</option><option value="واتساب والبريد">واتساب والبريد</option></select></label>
          </div>
          <label>الخدمة المطلوبة
            <select required value={serviceId} onChange={(event) => selectService(event.target.value)}><option value="" disabled>اختر الخدمة</option>{(settings.services || []).filter((service) => service.active).map((service) => <option value={service.id} key={service.id}>{service.title}</option>)}</select>
          </label>
          {selectedService && <section className="request-service-scope">
            <header><strong>{selectedService.selectionLabel || "حدد نطاق العمل"}</strong><small>يمكنك اختيار أكثر من عنصر</small></header>
            <div className="request-choice-grid">{(selectedService.options || []).map((option) => <label className={selectedOptions.includes(option) ? "selected" : ""} key={option}><input type="checkbox" checked={selectedOptions.includes(option)} onChange={() => toggleOption(option, setSelectedOptions)} /><span><Check size={15} /></span>{option}</label>)}</div>
            {selectedService.conditionalOption && selectedOptions.includes(selectedService.conditionalOption) && <div className="request-conditional-scope"><strong>{selectedService.conditionalLabel}</strong><div className="request-choice-grid applications">{(selectedService.conditionalOptions || []).map((option) => <label className={selectedConditionalOptions.includes(option) ? "selected" : ""} key={option}><input type="checkbox" checked={selectedConditionalOptions.includes(option)} onChange={() => toggleOption(option, setSelectedConditionalOptions)} /><span><Check size={15} /></span>{option}</label>)}</div></div>}
            {selectedService.engagement === "retainer" && <div className="request-billing-cycle"><strong>مدة الشراكة</strong><div>{(selectedService.billingOptions || ["شهري", "سنوي"]).map((option) => <label className={billingCycle === option ? "selected" : ""} key={option}><input type="radio" name="billingCycleChoice" checked={billingCycle === option} onChange={() => setBillingCycle(option)} />{option}<small>{option === "شهري" ? "احتياج إبداعي مستمر خلال الشهر" : "شراكة إبداعية ممتدة طوال السنة"}</small></label>)}</div></div>}
          </section>}
          <label>اسم المشروع أو العلامة<input name="project" required placeholder="مثال: هوية منصة سُرى" /></label>
          {(settings.requestQuestions || []).filter((question) => question.enabled).map((question) => <label key={question.id}>{question.label}
            {question.type === "textarea" && <textarea name={question.id} required={question.required} rows="4" placeholder="اكتب التفاصيل التي تساعدنا على فهم الطلب" />}
            {question.type === "date" && <input name={question.id} type="date" required={question.required} />}
            {question.type === "text" && <input name={question.id} type="text" required={question.required} />}
            {question.type === "select" && <select name={question.id} required={question.required} defaultValue=""><option value="" disabled>اختر الإجابة</option>{(question.options || []).map((option) => <option key={option}>{option}</option>)}</select>}
          </label>)}
          <label className="consent-field"><input type="checkbox" required /><span>أوافق على التواصل وإرسال إشعارات الطلب عبر القناة التي اخترتها.</span></label>
          <div className="form-note"><ShieldCheck size={19} /> معلوماتك محفوظة وتستخدم للتواصل بشأن طلبك فقط.</div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button primary full" type="submit" disabled={status === "sending"}>{status === "sending" ? <><CircleNotch size={18} className="spin" /> جارٍ الإرسال</> : <>إرسال <ArrowLeft size={18} /></>}</button>
        </form>
      )}
    </Modal>
  );
}

function AccessModal({ onClose, onEnter, connected, onAuthenticate }) {
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState(authLanding.error ? authErrorMessage({ code: "otp_expired" }) : "");
  const changeMethod = (next) => { setMethod(next); setStatus("idle"); setMessage(""); setPassword(""); };
  const authenticate = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const result = await onAuthenticate({ email, password, method });
      if (result?.magic || result?.reset) {
        setStatus("sent");
        setMessage(result.reset ? "إذا كان البريد مرتبطًا بحساب، ستصلك رسالة لتعيين كلمة مرور جديدة. افتح أحدث رسالة فقط." : "أرسلنا رابط الدخول إلى بريدك. افتحه على الجهاز الذي تريد الدخول منه، ولا تشارك الرابط.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(authErrorMessage(error));
    }
  };

  return (
    <Modal title="دخول المنصة" onClose={onClose} size="compact">
      {connected ? <form className="platform-login" onSubmit={authenticate}>
        <div className="connection-chip connected"><ShieldCheck size={18} weight="fill" /><span><strong>دخول آمن</strong><small>تحدد صلاحيتك تلقائياً بعد التحقق من الحساب</small></span></div>
        <div className="login-methods"><button disabled={status === "loading"} type="button" className={method === "password" ? "active" : ""} onClick={() => changeMethod("password")}>كلمة المرور</button><button disabled={status === "loading"} type="button" className={method === "magic" ? "active" : ""} onClick={() => changeMethod("magic")}>رابط على البريد</button></div>
        {method === "reset" && <p>استعادة كلمة المرور: أدخل بريد الحساب لتصلك رسالة التعيين.</p>}
        <label>البريد الإلكتروني<input type="email" dir="ltr" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        {method === "password" && <label>كلمة المرور<input type="password" dir="ltr" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>}
        {method === "password" && <button type="button" className="button ghost" disabled={status === "loading"} onClick={() => changeMethod("reset")}>نسيت كلمة المرور؟</button>}
        {message && <div className={`login-message ${status}`} role="status">{message}</div>}
        <button className="button primary full" type="submit" disabled={status === "loading" || status === "sent"}>{status === "loading" ? <><CircleNotch size={18} className="spin" /> جارٍ التحقق</> : method === "reset" ? "إرسال رابط الاستعادة" : method === "magic" ? "إرسال رابط الدخول" : "دخول"}</button>
        <p className="login-privacy"><LockKey size={16} /> لا يختار المستخدم دوره. الصلاحية تأتي من حسابه في قاعدة البيانات.</p>
      </form> : <div className="access-panel">
        <div className="connection-chip local"><ShieldCheck size={18} /><span><strong>وضع التجربة المحلية</strong><small>اختر دوراً لمعاينة الرحلة قبل ربط قاعدة البيانات</small></span></div>
        <button onClick={() => onEnter("client")}><UserCircle size={24} /><span><strong>بوابة العميل</strong><small>المشاريع والبروفات والطلبات والفواتير</small></span><ArrowLeft size={18} /></button>
        <button onClick={() => onEnter("collaborator")}><UserFocus size={24} /><span><strong>مساحة المتعاون</strong><small>المهام والملفات والتسليمات المسندة</small></span><ArrowLeft size={18} /></button>
        <button onClick={() => onEnter("owner")}><LockKey size={24} /><span><strong>مساحة عبد الوهاب</strong><small>التنفيذ والتفويض والعملاء والماليات والموقع</small></span><ArrowLeft size={18} /></button>
      </div>}
    </Modal>
  );
}

function PasswordSetupModal({ user, onComplete, onLogout }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [savedUser, setSavedUser] = useState(null);
  const save = async (event) => {
    event.preventDefault();
    const validation = passwordValidation(password, confirmation);
    if (validation) { setMessage(validation); return; }
    setBusy(true); setMessage("");
    try {
      const updated = await setMyPassword(password, confirmation);
      setPassword(""); setConfirmation(""); setSavedUser(updated);
    } catch (error) { setMessage(authErrorMessage(error)); }
    finally { setBusy(false); }
  };
  return <Modal title="تعيين كلمة المرور" size="compact" onClose={() => { if (!busy) savedUser ? onComplete(savedUser) : onLogout(); }}>
    {savedUser ? <div className="platform-login"><p role="status">تم حفظ كلمة المرور. يمكنك الدخول ببريدك وكلمة المرور من أي جهاز.</p><button className="button primary full" onClick={() => onComplete(savedUser)}>الدخول إلى مساحتي</button></div> : <form className="platform-login" onSubmit={save}>
      <p>اختر كلمة مرور خاصة بك. صلاحيات حسابك محددة مسبقًا ولا تتغير بهذه الخطوة.</p>
      <label>البريد الإلكتروني<input type="email" dir="ltr" value={user.email || ""} readOnly autoComplete="username" /></label>
      <label>كلمة المرور الجديدة<input type="password" dir="ltr" required minLength={12} maxLength={128} autoComplete="new-password" value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} /></label>
      <small>12 حرفًا على الأقل. يمكنك استخدام عبارة طويلة يسهل تذكرها.</small>
      <label>تأكيد كلمة المرور<input type="password" dir="ltr" required autoComplete="new-password" value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} /></label>
      {message && <p role="alert" className="form-error">{message}</p>}
      <button type="submit" className="button primary full" disabled={busy}>{busy ? "جارٍ الحفظ" : "حفظ كلمة المرور"}</button>
      <button type="button" className="button ghost" disabled={busy} onClick={onLogout}>خروج</button>
    </form>}
  </Modal>;
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
        <div><span className="scenario-live-label"><Sparkle size={15} weight="fill" /> تجربة مترابطة</span><h1>جرّب المشروع من الطلب إلى المتابعة.</h1><p>كل قرار ينتقل بين عبد الوهاب والعميل، ولا تدخل مساحة المتعاون إلا إذا اختار عبد الوهاب تفويض جزء من التنفيذ.</p></div>
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
            <dl><div><dt>العميل</dt><dd>{scenario.client.name}</dd></div><div><dt>التواصل</dt><dd>{scenario.client.communication}</dd></div><div><dt>الخدمة</dt><dd>{scenario.project.service}</dd></div><div><dt>القيمة</dt><dd>{Number(scenario.quote.amount).toLocaleString("en-US")} {scenario.quote.currency}</dd></div><div><dt>القيادة والتنفيذ</dt><dd>{scenario.creative?.executionMode === "owner_led" ? "عبد الوهاب" : "عبد الوهاب مع تنفيذ مفوض"}</dd></div></dl>
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
          <div className="focus-card-top"><span>مساحتك الآن</span><time>جلسة تركيز 45 دقيقة</time></div>
          <div className="focus-card-body">
            <div>
              <p>سيد مندي</p>
              <h2>راجع اتجاه التغليف بعين المدير الإبداعي.</h2>
              <span>صممت النظام والبروفة بنفسك. القرار الآن: تطويرها أكثر أو تجهيزها للعميل.</span>
            </div>
            <button className="button inverted" onClick={() => setSection("work-orders")}>فتح التنفيذ والتفويض <ArrowLeft size={18} /></button>
          </div>
          <div className="focus-card-next"><span>بعدها</span><strong>تطوير فكرة واجهة بخاري أختر</strong><time>جلسة مستقلة</time></div>
        </article>
        <article className="money-card" onClick={() => setSection("finance")} role="button" tabIndex="0">
          <div className="money-head"><Wallet size={23} /><span>التحصيل هذا الشهر</span></div>
          <strong>24,850 <small>ر.س</small></strong>
          <p>لديك فاتورتان تحتاجان متابعة هذا الأسبوع.</p>
          <div className="money-split"><span>مستحق لك <b>16,350</b></span><span>تكلفة إنتاجية تجريبية <b>4,800</b></span></div>
        </article>
      </section>

      <section className="metrics-row">
        <Metric icon={Sparkle} label="أعمال إبداعية" value="3" note="كلها بقيادتك وتنفيذك" />
        <Metric icon={CheckCircle} label="اتجاهات تحتاج قرارك" value="2" note="لا تنتقل لأحد تلقائياً" />
        <Metric icon={Tray} label="طلبات بانتظار البداية" value="2" note="تدخل معملك بعد قرارك" />
        <Metric icon={ChartLineUp} label="توقع الشهر" value="41.2k" note="قبل أي مساعدة إنتاجية" />
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
          <div className="panel-heading"><div><h2>ما حفظه النظام عنك</h2><p>أتمه النظام إداريًا من دون أن يقاطع وقتك الإبداعي.</p></div></div>
          <div className="activity-list">
            <div><CheckCircle size={19} weight="fill" /><span><strong>توقيع العقد</strong><small>وقّع عميل بخاري أختر قبل 32 دقيقة.</small></span></div>
            <div><PaperPlaneTilt size={19} /><span><strong>متابعة تلقائية</strong><small>أرسل النظام تذكيراً لفاتورة سيد مندي.</small></span></div>
            <div><FloppyDisk size={19} /><span><strong>دفتر الفكرة محفوظ</strong><small>حفظ النظام آخر ملاحظاتك على اتجاه مامولا.</small></span></div>
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
  const [requests, setRequests] = usePersistentState("u89-retainer-requests", retainerRequests);
  const [projectRequests, setProjectRequests] = usePersistentState("u89-project-requests", incomingProjectRequests);
  useEffect(() => {
    const migrationKey = "u89-retainer-creative-lead-v2";
    if (localStorage.getItem(migrationKey) === "done") return;
    setRequests((items) => items.map((item) => retainerRequests.find((seed) => seed.id === item.id) || item));
    localStorage.setItem(migrationKey, "done");
  }, [setRequests]);
  const startExecution = (id) => {
    setRequests((items) => items.map((item) => item.id === id ? { ...item, assignee: "عبد الوهاب", status: "بانتظار قرار التنفيذ" } : item));
    onToast("فتح الطلب في مركز التنفيذ. اختر الآن: تنفيذه، تفويضه كاملاً، أو تقسيمه");
    setSection("work-orders");
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
        <div className="panel-heading"><div><h2>طلبات العقود قبل العمل</h2><p>افتح الطلب واتخذ قرار التنفيذ مباشرة. إضافة الفكرة والتوجيه اختيارية.</p></div><button className="filter-button">هذا الشهر <CaretDown size={16} /></button></div>
        <div className="request-table">
          {requests.map((request) => (
            <article className="request-row" key={request.id}>
              <div className="request-main"><span className={`request-state ${request.status === "جديد" || request.status === "بانتظار الإسناد" ? "attention" : ""}`}>{request.status}</span><strong>{request.title}</strong><small>{request.client}</small></div>
              <div><small>الموعد</small><strong>{request.due}</strong></div>
              <div><small>القيادة الإبداعية</small><strong>عبد الوهاب</strong></div>
              <button className="button primary small" onClick={() => startExecution(request.id)}>اختيار طريقة التنفيذ <ArrowLeft size={16} /></button>
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
  const [briefs, setBriefs] = usePersistentState("u89-briefs", initialBriefs);
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

const documentLines = (value) => String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);

function LocalProjectDocument({ document, settings, onClose, onEdit }) {
  const isContract = document.type === "contract";
  const payments = document.payments || settings.paymentPlans.find((plan) => plan.id === document.paymentPlan)?.percentages || [50, 50];
  const deliverables = documentLines(document.deliverables || "المخرجات المحددة في البريف المعتمد\nملفات التسليم النهائية المتفق عليها\nنسخة مهيأة للاستخدام من كل مخرج نهائي");
  const exclusions = documentLines(document.exclusions || "الطباعة والإنتاج والتراخيص الخارجية\nأي مخرج غير مثبت في نطاق هذا المستند");
  const terms = [
    `يبدأ التنفيذ بعد توقيع الطرفين وتسجيل الدفعة الأولى واستلام تفاصيل العمل والملفات اللازمة.`,
    `تقدم البروفة الأولى خلال ${document.firstProofDays || settings.firstProofDays} يوم عمل، وتنفذ التعديلات خلال ${document.revisionDays || settings.revisionDays} أيام عمل.`,
    `عدد جولات التعديل: ${document.revisionRounds || settings.revisionRounds || 2}، ويستغرق التأسيس من جديد ${document.restartDays || settings.restartDays} أيام عمل.`,
    `تبقى الأفكار والمقترحات غير المعتمدة ملكاً لمقدم الخدمة، وتنتقل حقوق استخدام المخرجات النهائية بعد سداد كامل المستحقات.`,
    `تعتمد المخرجات والمواعيد والقيمة وخطة الدفعات الواردة في هذا المستند، وأي إضافة لاحقة تحتاج اتفاقاً مكتوباً مستقلاً.`,
  ];
  const amount = Number(document.amount || 0).toLocaleString("en-US");
  const bankTail = settings.bankAccount?.slice(-4) || "";

  return <div className="modal-layer print-layer" onMouseDown={onClose}><section className="modal-panel wide print-modal" onMouseDown={(event) => event.stopPropagation()}><div className="print-actions"><div><small>معاينة المستند الكامل</small><strong>{document.title}، {document.id}</strong></div><span>{onEdit && <button className="button ghost" onClick={onEdit}><FileText size={18} /> تعديل الصياغة</button>}<button className="button ghost" onClick={onClose}>إغلاق</button><button className="button primary" onClick={() => window.print()}><Printer size={18} /> طباعة أو حفظ PDF</button></span></div><article className="print-document local-project-document"><header><div className="print-brand">U89<span>استوديو العلامة</span></div><div><small>{document.title}</small><strong>{document.id}</strong><time>5 أغسطس 2026</time></div></header><section className="print-parties"><div><small>مقدم الخدمة</small><strong>{settings.ownerNameAr}</strong><span>{settings.ownerNameEn}</span><span>{settings.email}</span><span>{settings.phone}</span></div><div><small>العميل</small><strong>{document.client}</strong><span>{document.contact || "يحدد من ملف العميل"}</span></div></section><section className="print-subject"><small>موضوع المستند</small><h1>{document.project}</h1><p>{document.scope || "تقديم الخدمة الإبداعية وفق نطاق البريف المعتمد والمخرجات الموضحة في هذا المستند."}</p></section><section className="print-columns"><div><small>المخرجات المشمولة</small>{deliverables.map((item) => <p key={item}>{item}</p>)}</div><div><small>غير المشمول</small>{exclusions.map((item) => <p key={item}>{item}</p>)}</div></section>{isContract ? <section className="print-terms"><h2>بنود العقد</h2>{terms.map((term, index) => <p key={term}><b>{index + 1}.</b> {term}</p>)}{document.notes && <p><b>{terms.length + 1}.</b> {document.notes}</p>}<div className="print-signatures"><span><small>مقدم الخدمة</small><strong>عبد الوهاب بن سليمان السويد</strong><time>التوقيع: __________________</time></span><span><small>العميل</small><strong>{document.contact || document.client}</strong><time>التوقيع: __________________</time></span></div></section> : <section className="print-terms"><h2>المدة والتعديلات</h2><p>البروفة الأولى خلال {document.firstProofDays || settings.firstProofDays} يوم عمل.</p><p>تنفذ التعديلات خلال {document.revisionDays || settings.revisionDays} أيام عمل. عدد جولات التعديل: {document.revisionRounds || settings.revisionRounds || 2}.</p><p>التنفيذ النهائي خلال {document.finalizationDays || settings.finalizationDays} يوم عمل بعد اعتماد البروفات.</p><p>صلاحية العرض {document.validityDays || settings.quoteValidityDays} أيام من تاريخ الإصدار.</p><p>قبول العرض ينشئ عقداً مستقلاً، ولا يبدأ التنفيذ قبل توقيع العقد وتسجيل الدفعة الأولى.</p>{document.notes && <p>ملاحظة خاصة: {document.notes}</p>}</section>}<section className="print-total"><span>الإجمالي</span><strong>{amount} {document.currency}</strong><div>{payments.map((payment, index) => <span key={index}>الدفعة {index + 1}: {payment}%</span>)}</div></section><footer><span>{isContract ? "عقد خدمات إبداعية، يراجع قبل التوقيع النهائي" : "عرض سعر غير ضريبي، وليس فاتورة"}</span><span>{settings.bankName}{bankTail ? `، الحساب المنتهي بـ ${bankTail}` : "، بيانات التحويل تضبط من لوحة الإدارة"}</span></footer></article></section></div>;
}

function DocumentEditorModal({ document, settings, onClose, onSave, onToast }) {
  const [previewing, setPreviewing] = useState(false);
  const [draft, setDraft] = useState({
    scope: "تقديم الخدمة الإبداعية وفق نطاق البريف المعتمد والمخرجات الموضحة في هذا العرض.",
    deliverables: "المخرجات المحددة في البريف المعتمد\nملفات التسليم النهائية المتفق عليها\nنسخة مهيأة للاستخدام من كل مخرج نهائي",
    exclusions: "الطباعة والإنتاج والتراخيص الخارجية\nأي مخرج غير مثبت في نطاق هذا المستند",
    payments: (settings.paymentPlans.find((plan) => plan.id === document.paymentPlan)?.percentages || [50, 50]),
    notes: "",
    firstProofDays: settings.firstProofDays,
    revisionDays: settings.revisionDays,
    restartDays: settings.restartDays,
    finalizationDays: settings.finalizationDays,
    validityDays: settings.quoteValidityDays,
    revisionRounds: settings.revisionRounds || 2,
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

  return <>
    <Modal title={`تحرير ${draft.title}`} onClose={onClose} size="wide">
      <div className="document-builder">
        <form className="document-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="field-row"><label>العميل<input value={draft.client} onChange={(event) => update("client", event.target.value)} /></label><label>المسؤول لدى العميل<input value={draft.contact} onChange={(event) => update("contact", event.target.value)} /></label></div>
          <label>الخدمة أو المشروع<input value={draft.project} onChange={(event) => update("project", event.target.value)} /></label>
          <label>وصف النطاق<textarea rows="4" value={draft.scope} onChange={(event) => update("scope", event.target.value)} /></label>
          <div className="field-row"><label>المخرجات المشمولة، كل مخرج في سطر<textarea rows="4" value={draft.deliverables} onChange={(event) => update("deliverables", event.target.value)} /></label><label>غير المشمول، كل بند في سطر<textarea rows="4" value={draft.exclusions} onChange={(event) => update("exclusions", event.target.value)} /></label></div>
          <div className="field-row"><label>القيمة<input type="number" value={draft.amount} onChange={(event) => update("amount", event.target.value)} /></label><label>العملة<select value={draft.currency} onChange={(event) => update("currency", event.target.value)}>{settings.collaboratorCurrencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
          <label>خطة الدفعات<select value={draft.paymentPlan} onChange={(event) => selectPlan(event.target.value)}>{settings.paymentPlans.map((plan) => <option value={plan.id} key={plan.id}>{plan.label}</option>)}</select></label>
          <div className="payment-editor">{draft.payments.map((payment, index) => <label key={index}>الدفعة {index + 1}<span><input type="number" min="0" max="100" value={payment} onChange={(event) => updatePayment(index, event.target.value)} />%</span></label>)}</div>
          <div className="field-row"><label>البروفة الأولى، يوم عمل<input type="number" min="1" value={draft.firstProofDays} onChange={(event) => update("firstProofDays", event.target.value)} /></label><label>مدة التعديل، يوم عمل<input type="number" min="1" value={draft.revisionDays} onChange={(event) => update("revisionDays", event.target.value)} /></label></div>
          <div className="field-row"><label>جولات التعديل<input type="number" min="0" value={draft.revisionRounds} onChange={(event) => update("revisionRounds", event.target.value)} /></label><label>{isContract ? "إعادة التأسيس، يوم عمل" : "صلاحية العرض، يوم"}<input type="number" min="1" value={isContract ? draft.restartDays : draft.validityDays} onChange={(event) => update(isContract ? "restartDays" : "validityDays", event.target.value)} /></label></div>
          <label>ملاحظات خاصة بالمستند<textarea rows="3" value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="أي استثناء أو اتفاق خاص بهذا المشروع" /></label>
          <div className="document-form-actions"><button type="button" className="button ghost" onClick={() => setPreviewing(true)}><Printer size={18} /> فتح المعاينة الكاملة</button><button className="button primary" type="submit"><FloppyDisk size={18} /> حفظ المسودة</button></div>
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
    {previewing && <LocalProjectDocument document={draft} settings={settings} onClose={() => setPreviewing(false)} />}
  </>;
}

function DocumentsView({ settings, onToast, scenario, onAdvance, onPatch }) {
  const [documents, setDocuments] = usePersistentState("u89-documents", initialDocuments);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const save = (document) => setDocuments((items) => items.map((item) => item.id === document.id ? { ...document, updated: "الآن" } : item));
  const createFromBrief = () => setSelected({ id: `Q-${String(483 + documents.length)}`, type: "quote", title: "عرض سعر", client: "بريف معتمد", contact: "", project: settings.services.find((service) => service.active)?.title || "خدمة إبداعية", amount: "0", currency: settings.defaultCurrency, paymentPlan: settings.paymentPlans[0].id, status: "مسودة من بريف", updated: "الآن" });
  const open = (document) => setPreview(document);

  return (
    <div className="dashboard-content page-stack documents-page">
      <div className="page-title"><div><h1>مركز المستندات</h1><p>افتح العرض أو العقد كاملاً، راجع صيغته، ثم احفظه أو أرسله بقرارك.</p></div><button className="button primary" onClick={createFromBrief}><Plus size={18} /> إنشاء من بريف معتمد</button></div>
      <section className="document-flow">
        <div><Tray size={22} /><span><small>الطلب</small><strong>مقبول</strong></span></div><ArrowLeft size={18} /><div><List size={22} /><span><small>البريف</small><strong>معتمد</strong></span></div><ArrowLeft size={18} /><div><FileText size={22} /><span><small>العرض</small><strong>تصاغ مسودته</strong></span></div><ArrowLeft size={18} /><div><Handshake size={22} /><span><small>العقد</small><strong>بعد قبول العرض</strong></span></div>
      </section>
      {scenario.step >= 3 && <ScenarioQuotePanel scenario={scenario} onPatch={onPatch} onAdvance={onAdvance} onToast={onToast} />}
      {scenario.step >= 5 && <section className="panel scenario-contract-row"><span className="document-type contract"><Handshake size={22} /></span><div><small>{scenario.contract.id}</small><strong>عقد تقديم خدمات إبداعية، {scenario.project.name}</strong><p>نشأ من العرض المعتمد ويحمل النطاق والدفعات نفسها.</p></div><span className="status-badge">{scenario.step === 5 ? "بانتظار توقيع العميل" : "موقع من الطرفين"}</span><button className="text-link" onClick={() => setPreview({ id: scenario.contract.id, type: "contract", title: "عقد تقديم خدمات إبداعية", client: scenario.client.company, contact: scenario.client.name, project: scenario.project.name, amount: scenario.quote.amount, currency: scenario.quote.currency, paymentPlan: scenario.quote.paymentPlan || "two-50", status: scenario.step === 5 ? "بانتظار التوقيع" : "موقع", scope: scenario.quote.scope })}>فتح العقد كاملاً <ArrowLeft size={16} /></button></section>}
      <section className="panel document-list-panel">
        <div className="panel-heading"><div><h2>المستندات الحالية</h2><p>النطاق والمخرجات والموعد تأتي من البريف، مع فصل العرض عن العقد.</p></div><span className="sample-label">بيانات تجريبية</span></div>
        <div className="document-list">{documents.map((document) => <button key={document.id} onClick={() => open(document)}><span className={`document-type ${document.type}`}><FileText size={21} /></span><span><strong>{document.title}</strong><small>{document.id} · {document.client}</small></span><span><small>المشروع</small><strong>{document.project}</strong></span><span><small>القيمة</small><strong>{Number(document.amount).toLocaleString("en-US")} {document.currency}</strong></span><span className="status-badge">{document.status}</span><span className="document-open-label">فتح المستند كاملاً <ArrowLeft size={16} /></span></button>)}</div>
      </section>
      <div className="document-safety"><ShieldCheck size={24} /><div><strong>المسودة الذكية لا تعني الإرسال التلقائي.</strong><p>السعر والبنود والدفعات والتوقيع تبقى بقرارك. الصيغة القانونية النهائية تحتاج مراجعة مختص قبل اعتماد القالب الإنتاجي.</p></div></div>
      {selected && <DocumentEditorModal document={selected} settings={settings} onClose={() => setSelected(null)} onSave={(document) => { if (!documents.some((item) => item.id === document.id)) setDocuments((items) => [document, ...items]); else save(document); }} onToast={onToast} />}
      {preview && <LocalProjectDocument document={preview} settings={settings} onClose={() => setPreview(null)} onEdit={() => { setSelected(preview); setPreview(null); }} />}
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
    <form className="request-form" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget))); onClose(); }}>
      {kind === "client" ? <div className="field-row"><label>العميل<input name="client" required placeholder="اسم العميل أو المنشأة" /></label><label>المشروع<input name="project" required placeholder="المشروع المرتبط" /></label></div> : <div className="field-row"><label>المتعاون<input name="collaborator" required placeholder="اسم المتعاون" /></label><label>المشروع<input name="project" required placeholder="المشروع المرتبط" /></label></div>}
      {kind === "collaborator" && <label>القطعة أو الخدمة<input name="item" required placeholder="مثال: تصميم 3 منشورات" /></label>}
      <div className="field-row"><label>{kind === "collaborator" ? "سعر القطعة" : "المبلغ"}<input name="amount" type="number" min="0" step="0.01" required /></label><label>العملة<select name="currency" defaultValue={settings.defaultCurrency}>{settings.collaboratorCurrencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
      {kind === "collaborator" && <div className="field-row"><label>عدد القطع<input name="quantity" type="number" min="1" defaultValue="1" required /></label><label>تاريخ الاستحقاق<input name="due" type="date" required /></label></div>}
      {kind === "client" && <label>تاريخ الاستحقاق<input name="due" type="date" required /></label>}
      <div className="form-note"><ShieldCheck size={19} /> {kind === "client" ? "سيظهر المستند بوضوح على أنه غير ضريبي." : "تُسجل المطالبة كمبلغ مستحق على المشروع ولا تختلط بفواتير العملاء."}</div>
      <button className="button primary full" type="submit">حفظ المسودة <ArrowLeft size={18} /></button>
    </form>
  </Modal>;
}

function LocalFinancialDocument({ kind, record, settings, onClose }) {
  const isClaim = kind === "claim";
  return <Modal title={isClaim ? "فاتورة تقديم خدمة" : "فاتورة عميل غير ضريبية"} onClose={onClose} size="wide"><div className="local-document-viewer"><div className="print-actions"><div><small>معاينة المستند الكامل</small><strong>{record.id}</strong></div><span><button className="button primary" onClick={() => window.print()}><Printer size={18} /> طباعة أو حفظ PDF</button></span></div><article className="print-document local-finance-document"><header><div className="print-brand">U89<span>استوديو العلامة</span></div><div><small>{isClaim ? "فاتورة تقديم خدمة" : "فاتورة عادية غير ضريبية"}</small><strong>{record.id}</strong><time>5 أغسطس 2026</time></div></header><section className="print-parties"><div><small>{isClaim ? "الجهة المستفيدة" : "مقدم الخدمة"}</small><strong>{isClaim ? settings.ownerNameAr : settings.ownerNameAr}</strong><span>{settings.email}</span><span>{settings.phone}</span></div><div><small>{isClaim ? "المتعاون" : "العميل"}</small><strong>{isClaim ? record.collaborator : record.client}</strong><span>{record.project}</span></div></section><section className="print-subject"><small>البيان</small><h1>{isClaim ? record.item : record.project}</h1><p>{isClaim ? "خدمات إبداعية منفذة ضمن طلب العمل المرتبط بالمشروع." : `${record.type} مرتبطة بالمشروع والدفعة المتفق عليها.`}</p></section><section className="print-columns"><div><small>تاريخ الاستحقاق</small><p>{record.due || "غير محدد"}</p></div><div><small>الحالة</small><p>{record.status}</p></div></section><section className="print-total"><span>الإجمالي</span><strong>{record.amount} {record.currency}</strong></section><footer><span>{isClaim ? "مستند لضبط مستحقات المتعاون" : "فاتورة عادية غير ضريبية، وليست فاتورة ضريبية"}</span><span>{settings.bankName || "بيانات التحويل تضبط من لوحة الإدارة"}</span></footer></article></div></Modal>;
}

function FinanceView({ onToast, settings, scenario, setRole }) {
  const [tab, setTab] = useState("clients");
  const [entryKind, setEntryKind] = useState(null);
  const [selectedFinancial, setSelectedFinancial] = useState(null);
  const [clientInvoices, setClientInvoices] = usePersistentState("u89-invoices", invoices);
  const [teamClaims, setTeamClaims] = usePersistentState("u89-collaborator-claims", collaboratorBills);
  const receivable = groupMoney(clientInvoices.filter((item) => ["مستحقة", "متأخرة"].includes(item.status)));
  const scheduled = groupMoney(clientInvoices.filter((item) => item.status === "مجدولة"));
  const payable = groupMoney(teamClaims.filter((item) => item.status === "مستحقة"));
  const renderBalances = (balances, empty) => Object.keys(balances).length
    ? Object.entries(balances).map(([currency, amount]) => <strong key={currency} dir="ltr">{amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} <small>{currency}</small></strong>)
    : <strong>{empty}</strong>;
  const saveEntry = (kind, data) => {
    if (kind === "client") {
      const next = {
        id: `INV-${String(Date.now()).slice(-6)}`,
        client: data.client,
        project: data.project,
        amount: Number(data.amount).toLocaleString("en-US"),
        currency: data.currency,
        due: data.due,
        status: "مسودة",
        type: "فاتورة غير ضريبية",
      };
      setClientInvoices((items) => [next, ...items]);
      onToast("تم حفظ فاتورة العميل كمسودة");
      return;
    }
    const total = Number(data.amount) * Number(data.quantity || 1);
    const next = {
      id: `COL-${String(Date.now()).slice(-6)}`,
      collaborator: data.collaborator,
      project: data.project,
      item: `${data.item}، ${data.quantity || 1} قطعة`,
      amount: total.toLocaleString("en-US"),
      currency: data.currency,
      due: data.due,
      status: "مسودة",
    };
    setTeamClaims((items) => [next, ...items]);
    onToast("تم حفظ مطالبة المتعاون وربطها بالمشروع");
  };
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>الحسابات</h1><p>ما لك، وما عليك، وربحية كل مشروع دون ملف منفصل.</p></div><button className="button primary" onClick={() => setEntryKind(tab === "clients" ? "client" : "collaborator")}><Plus size={18} /> {tab === "clients" ? "فاتورة عميل" : "مطالبة متعاون"}</button></div>
      {scenario.step >= 6 && <section className="panel scenario-invoice-panel"><span className="invoice-icon"><Invoice size={22} /></span><div><span className="scenario-live-label"><Sparkle size={13} weight="fill" /> المشروع التجريبي</span><strong>{scenario.step === 9 ? "فاتورة الدفعة الأخيرة" : "فاتورة الدفعة الأولى"}</strong><small>{scenario.project.name}، {scenario.client.company}</small></div><div><small>القيمة</small><strong>{(Number(scenario.quote.amount) * 0.5).toLocaleString("en-US")} {scenario.quote.currency}</strong></div><span className={`payment-status ${scenario.step > 9 || (scenario.step > 6 && scenario.step < 9) ? "paid" : ""}`}>{scenario.step === 6 || scenario.step === 9 ? "مستحقة" : "مدفوعة"}</span>{(scenario.step === 6 || scenario.step === 9) && <button className="button primary small" onClick={() => setRole("client")}>فتح بوابة العميل</button>}</section>}
      <section className="finance-hero">
        <div className="finance-balance"><span>مستحقات العملاء غير المحصّلة</span>{renderBalances(receivable, "لا توجد مستحقات")}<p>من الفواتير المسجلة، كل عملة مستقلة. المسودات والمبالغ المجدولة خارج المستحق الحالي.</p></div>
        <div className="finance-pairs"><div><UsersThree size={22} /><span>مستحقات المتعاونين{renderBalances(payable, "لا توجد مستحقات")}</span></div><div><Clock size={22} /><span>دفعات العملاء المجدولة{renderBalances(scheduled, "لا توجد دفعات مجدولة")}</span></div></div>
      </section>
      <section className="panel">
        <div className="panel-heading finance-heading"><div><h2>{tab === "clients" ? "فواتير العملاء" : "مستحقات المتعاونين"}</h2><p>{tab === "clients" ? "فواتير عادية غير ضريبية مرتبطة بالدفعات والمشاريع." : "تكلفة كل قطعة بالعملة التي يعمل بها المتعاون."}</p></div><div className="finance-tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>العملاء</button><button className={tab === "collaborators" ? "active" : ""} onClick={() => setTab("collaborators")}>المتعاونون</button></div></div>
        {tab === "clients" ? <div className="invoice-list">
          {clientInvoices.map((invoice) => (
            <article key={invoice.id}>
              <span className="invoice-icon"><Invoice size={20} /></span>
              <span><strong>{invoice.id}</strong><small>{invoice.type} · {invoice.project}</small></span>
              <span><small>العميل</small><strong>{invoice.client}</strong></span>
              <span><small>الاستحقاق</small><strong>{invoice.due}</strong></span>
              <strong>{invoice.amount} {invoice.currency}</strong>
              <span className={`payment-status ${invoice.status === "مدفوعة" ? "paid" : ""}`}>{invoice.status}</span>
              <button className="text-link finance-open-doc" onClick={() => setSelectedFinancial({ kind: "invoice", record: invoice })}>فتح الفاتورة <ArrowLeft size={15} /></button>
              {invoice.status !== "مدفوعة" && <button className="icon-button" aria-label="إرسال تذكير" onClick={() => onToast(`تم إرسال تذكير فاتورة ${invoice.id}`)}><PaperPlaneTilt size={18} /></button>}
            </article>
          ))}
        </div> : <div className="collaborator-bills">{teamClaims.map((bill) => <article key={bill.id}><span className="invoice-icon"><Coins size={20} /></span><span><strong>{bill.collaborator}</strong><small>{bill.id} · {bill.item}</small></span><span><small>المشروع</small><strong>{bill.project}</strong></span><strong>{bill.amount} {bill.currency}</strong><span className={`payment-status ${bill.status === "مدفوعة" ? "paid" : ""}`}>{bill.status}</span><button className="text-link" onClick={() => setSelectedFinancial({ kind: "claim", record: bill })}>فتح فاتورة الخدمة <ArrowLeft size={15} /></button></article>)}</div>}
      </section>
      <div className="currency-note"><Coins size={22} /><div><strong>العملات لا تُجمع مباشرة.</strong><p>يبقى كل رصيد بعملته الأصلية، وتظهر قيمته المرجعية بالريال فقط عند إعداد تقرير الربحية وسعر الصرف المسجل.</p></div></div>
      {entryKind && <FinanceEntryModal kind={entryKind} settings={settings} onClose={() => setEntryKind(null)} onSave={(data) => saveEntry(entryKind, data)} />}
      {selectedFinancial && <LocalFinancialDocument kind={selectedFinancial.kind} record={selectedFinancial.record} settings={settings} onClose={() => setSelectedFinancial(null)} />}
    </div>
  );
}

function WorkOrdersView({ scenario, setRole, onToast, onAdvance, targetId }) {
  const [orders, setOrders] = usePersistentState("u89-work-orders", initialWorkOrders);
  const [teamClaims, setTeamClaims] = usePersistentState("u89-collaborator-claims", collaboratorBills);
  const [selectedId, setSelectedId] = useState(orders.find((item) => !item.parentId)?.id || "");
  useEffect(() => { if (targetId && orders.some((item) => item.id === targetId)) setSelectedId(targetId); }, [targetId]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [ownerProofFile, setOwnerProofFile] = useState(null);
  const [ownerProofNote, setOwnerProofNote] = useState("");
  const selectedSource = orders.find((item) => item.id === selectedId) || orders[0];
  const selected = selectedSource ? { recommendations: "", creativeNotes: "", executionMode: "owner_led", assignees: [], compensation: {}, files: [], messages: [], ...selectedSource } : null;
  const parent = selected?.parentId ? orders.find((item) => item.id === selected.parentId) : null;
  const parts = selected ? orders.filter((item) => item.parentId === selected.id) : [];
  const rootOrders = orders.filter((item) => !item.parentId);
  const collaborators = team.map((person) => person.name);
  const updateOrder = (id, patch) => setOrders((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));

  useEffect(() => {
    const migrationKey = "u89-compensation-and-services-v4";
    if (localStorage.getItem(migrationKey) === "done") return;
    setOrders((items) => {
      const demo = initialWorkOrders.find((item) => item.id === "WO-1030");
      const normalized = items.map((item) => {
        const next = { recommendations: "", creativeNotes: "", executionMode: item.assignees?.length ? "delegated" : "owner_led", assignees: [], compensation: {}, files: [], messages: [], ...item };
        if (item.id === demo.id && !Object.keys(next.compensation || {}).length) next.compensation = demo.compensation;
        return next;
      });
      return normalized.some((item) => item.id === demo.id) ? normalized : [...normalized, demo];
    });
    setTeamClaims((items) => items.map((item) => item.id === "COL-014" ? { ...collaboratorBills[0], ...item, workOrderId: "WO-1030" } : item));
    localStorage.setItem(migrationKey, "done");
  }, [setOrders, setTeamClaims]);

  useEffect(() => {
    const migrationKey = "u89-client-revision-v5";
    if (localStorage.getItem(migrationKey)) return;
    setOrders((items) => {
      const seen = new Set();
      return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    });
    localStorage.setItem(migrationKey, "done");
  }, [setOrders]);

  useEffect(() => {
    if (scenario.step !== 7 || orders.some((item) => item.id === "WO-SCENARIO")) return;
    const scenarioOrder = {
      id: "WO-SCENARIO", project: scenario.project.name, title: "البروفة الأولى", description: scenario.quote.scope,
      recommendations: "", creativeNotes: "", executionMode: "owner_led", priority: "عالية", due: scenario.collaborator.due,
      status: "draft", dispatched: false, clientApproval: true, assignees: [], compensation: {}, files: ["البريف المعتمد.pdf", "حزمة المصادر.zip"], messages: [], proof: null,
    };
    setOrders((items) => items.some((item) => item.id === scenarioOrder.id) ? items : [scenarioOrder, ...items]);
    setSelectedId(scenarioOrder.id);
  }, [orders, scenario, setOrders]);

  const create = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = {
      id: `WO-${Date.now().toString().slice(-6)}`, project: values.get("project"), title: values.get("title"), description: values.get("description"),
      recommendations: values.get("idea") || "", creativeNotes: "", executionMode: "owner_led", priority: values.get("priority"), due: values.get("due"),
      status: "draft", dispatched: false, clientApproval: values.get("clientApproval") === "on", assignees: [], compensation: {}, files: [], messages: [], proof: null,
    };
    setOrders((items) => [next, ...items]);
    setSelectedId(next.id);
    setCreating(false);
    onToast("أضيف العمل. اختر طريقة تنفيذه مباشرة");
  };
  const chooseExecutionMode = (mode) => {
    updateOrder(selected.id, { executionMode: mode, ...(mode !== "delegated" ? { assignees: [], compensation: {} } : {}) });
    onToast(mode === "owner_led" ? "اخترت تنفيذه بنفسك" : mode === "delegated" ? "اختر المتعاون ثم أرسل الطلب كاملاً" : "أضف أجزاء العمل واربط كل جزء بمتعاون");
  };
  const toggleAssignee = (name) => {
    const removing = selected.assignees.includes(name);
    const compensation = { ...selected.compensation };
    if (removing) delete compensation[name];
    else compensation[name] = compensation[name] || { amount: "", currency: "SAR", status: "متفق عليه" };
    updateOrder(selected.id, { assignees: removing ? selected.assignees.filter((item) => item !== name) : [...selected.assignees, name], compensation });
  };
  const updateCompensation = (name, patchValue) => updateOrder(selected.id, { compensation: { ...selected.compensation, [name]: { amount: "", currency: "SAR", status: "متفق عليه", ...(selected.compensation[name] || {}), ...patchValue } } });
  const startOwner = () => {
    updateOrder(selected.id, { status: "owner_production", executionMode: "owner_led", dispatched: false });
    onToast("أصبح العمل في قائمة تنفيذك. تستطيع إضافة فكرة أو ملفات متى احتجت");
  };
  const dispatch = () => {
    if (!selected.assignees.length) { onToast("اختر متعاوناً واحداً على الأقل"); return; }
    if (selected.assignees.some((name) => Number(selected.compensation[name]?.amount || 0) <= 0)) { onToast("حدد مبلغاً لكل متعاون قبل الإرسال"); return; }
    updateOrder(selected.id, {
      dispatched: true, status: "dispatched", executionMode: "delegated",
      messages: [{ id: `m-${Date.now()}`, author: "النظام", body: "وجّه عبد الوهاب هذا الطلب إلى المتعاون المحدد.", at: "الآن", system: true }, ...selected.messages],
    });
    onToast("وصل الطلب الآن إلى لوحة المتعاون");
  };
  const addPart = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const assignee = values.get("assignee");
    if (!assignee) { onToast("اختر المتعاون لهذا الجزء"); return; }
    const part = {
      id: `WO-${Date.now().toString().slice(-6)}`, parentId: selected.id, workKind: "part", project: selected.project,
      title: values.get("title"), description: values.get("description"), recommendations: values.get("idea") || selected.recommendations || "",
      creativeNotes: "", executionMode: "delegated", priority: values.get("priority"), due: values.get("due"), status: "dispatched", dispatched: true,
      clientApproval: false, assignees: [assignee], compensation: { [assignee]: { amount: values.get("collaboratorAmount"), currency: values.get("collaboratorCurrency"), status: "متفق عليه" } }, files: [...selected.files], messages: [{ id: `m-${Date.now()}`, author: "النظام", body: `وجّه عبد الوهاب هذا الجزء إلى ${assignee} بعد تثبيت أجره.`, at: "الآن", system: true }], proof: null,
    };
    setOrders((items) => [part, ...items.map((item) => item.id === selected.id ? { ...item, executionMode: "split", status: "owner_production" } : item)]);
    event.currentTarget.reset();
    onToast(`أُرسل الجزء إلى ${assignee} وارتبط بالعمل الأساسي`);
  };
  const addMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    updateOrder(selected.id, { messages: [...selected.messages, { id: `m-${Date.now()}`, author: "عبد الوهاب", body: message.trim(), at: "الآن" }] });
    setMessage("");
    onToast("وصل التوجيه إلى غرفة هذا العمل");
  };
  const addFile = (file) => {
    if (!file) return;
    updateOrder(selected.id, { files: [...selected.files, file.name] });
    onToast("أُرفق الملف بهذا العمل");
  };
  const submitOwnerProof = () => {
    if (!ownerProofFile) { onToast("اختر ملف البروفة أولاً"); return; }
    updateOrder(selected.id, { status: "internal_review", files: [...selected.files, ownerProofFile.name], proof: { title: ownerProofFile.name, status: "internal_review", note: ownerProofNote || "بروفة جاهزة لقرار عبد الوهاب." } });
    setOwnerProofFile(null);
    setOwnerProofNote("");
    onToast("حُفظت البروفة للمراجعة قبل مشاركة العميل");
  };
  const reviewProof = (decision) => {
    if (decision === "changes_requested" && !reviewNote.trim()) { onToast("اكتب ملاحظة التعديل أولاً"); return; }
    const ownerWork = !selected.dispatched;
    if (decision === "changes_requested") {
      updateOrder(selected.id, { status: ownerWork ? "owner_production" : "changes_requested", proof: { ...selected.proof, status: "changes_requested" }, messages: ownerWork ? selected.messages : [...selected.messages, { id: `m-${Date.now()}`, author: "عبد الوهاب", body: reviewNote, at: "الآن", decision: true }] });
      onToast(ownerWork ? "أعدت البروفة إلى تنفيذك" : "وصلت ملاحظة التعديل إلى المتعاون");
    } else {
      updateOrder(selected.id, { status: selected.clientApproval ? "client_review" : "completed", proof: { ...selected.proof, status: "approved" }, messages: selected.dispatched ? [...selected.messages, { id: `m-${Date.now()}`, author: "عبد الوهاب", body: selected.clientApproval ? "اعتمدت العمل وأرسلته للعميل." : "اعتمدت العمل وأغلقته.", at: "الآن", decision: true }] : selected.messages });
      if (selected.dispatched) {
        setTeamClaims((items) => {
          const additions = [...new Set(selected.assignees)].filter((name) => !items.some((item) => item.workOrderId === selected.id && item.collaborator === name)).map((name, index) => ({
            id: `COL-${Date.now().toString().slice(-5)}-${index + 1}`,
            workOrderId: selected.id,
            collaborator: name,
            project: selected.project,
            item: selected.title,
            amount: String(selected.compensation[name]?.amount || 0),
            currency: selected.compensation[name]?.currency || "SAR",
            status: "مستحقة",
          }));
          return [...additions, ...items.map((item) => item.workOrderId === selected.id && !["مدفوعة", "paid"].includes(item.status) ? { ...item, status: "مستحقة" } : item)];
        });
      }
      onToast(selected.clientApproval ? "اعتمدت العمل وأرسلته للعميل" : "اعتمدت العمل وأغلقته");
      if (selected.id === "WO-SCENARIO") onAdvance(8, "اعتمد عبد الوهاب البروفة وأرسلها للعميل", { proof: { ...scenario.proof, status: "بانتظار العميل", revisionNote: "" } });
    }
    setReviewNote("");
  };

  const routeClientRevision = (route) => {
    const clientNote = selected.proof?.clientNote || scenario.proof.revisionNote || "طلب العميل تعديلاً على البروفة.";
    if (route === "owner") {
      updateOrder(selected.id, { status: "owner_production", executionMode: "owner_led", dispatched: false });
      onToast("انتقل التعديل إلى قائمة تنفيذك ولم يصل للمتعاون");
    } else {
      updateOrder(selected.id, {
        status: "changes_requested",
        proof: { ...selected.proof, status: "changes_requested" },
        messages: [...selected.messages, { id: `m-${Date.now()}`, author: "عبد الوهاب", body: reviewNote.trim() || clientNote, at: "الآن", decision: true }],
      });
      onToast("وصل التعديل إلى المتعاون بعد قرارك");
    }
    setReviewNote("");
  };

  const statusLabel = { draft: "بانتظار قرارك", creative_development: "بانتظار قرارك", direction_ready: "بانتظار قرارك", owner_production: "في تنفيذك", dispatched: "وصل للمتعاون", in_progress: "قيد التنفيذ", internal_review: "بانتظار مراجعتك", changes_requested: "تعديل مطلوب", client_revision: "طلب تعديل من العميل", client_review: "لدى العميل", completed: "مكتمل" };
  const ownerActive = orders.filter((item) => (!item.dispatched || item.status === "client_revision") && !item.parentId && !["completed", "cancelled", "client_review"].includes(item.status)).length;
  const delegated = orders.filter((item) => item.dispatched && !["completed", "cancelled"].includes(item.status)).length;

  return <div className="dashboard-content page-stack work-orders-page simple-execution-page">
    <div className="page-title"><div><span className="creative-director-kicker">قرار التنفيذ بيدك</span><h1>التنفيذ والتفويض</h1><p>لا توجد مراحل إلزامية. افتح العمل ثم نفذه، أرسله كاملاً، أو قسّمه إلى أجزاء.</p></div><button className="button primary" onClick={() => setCreating((value) => !value)}><Plus size={18} /> إضافة عمل</button></div>
    <section className="simple-flow-banner"><span><b>1</b><small>وصل الطلب</small></span><span><b>2</b><small>اختر طريقة التنفيذ</small></span><span><b>3</b><small>أرسل فقط إذا قررت</small></span></section>
    <section className="work-order-kpis"><span><small>لديك</small><strong>{ownerActive}</strong></span><span><small>مفوضة</small><strong>{delegated}</strong></span><span><small>أجزاء مرتبطة</small><strong>{orders.filter((item) => item.parentId).length}</strong></span><span className={orders.some((item) => ["internal_review", "client_revision"].includes(item.status)) ? "attention" : ""}><small>تحتاج مراجعتك</small><strong>{orders.filter((item) => ["internal_review", "client_revision"].includes(item.status)).length}</strong></span></section>

    {creating && <form className="panel work-order-create simple-work-create" onSubmit={create}><div className="work-order-form-intro"><span><Plus size={20} /></span><div><h2>أضف العمل كما وصل</h2><p>يكفي عنوان ومطلوب واضح. الفكرة والتوجيه اختياريان.</p></div></div><div className="field-row"><label>المشروع<select name="project" defaultValue={scenario.project.name}>{[scenario.project.name, ...initialProjects.map((item) => item.name)].filter((value, index, values) => values.indexOf(value) === index).map((name) => <option key={name}>{name}</option>)}</select></label><label>عنوان العمل<input name="title" required placeholder="مثال: تصميم منشور إطلاق" /></label></div><label>المطلوب<textarea name="description" rows="3" required placeholder="صف النتيجة المطلوبة ببساطة" /></label><label>فكرتي أو توجيهي، اختياري<textarea name="idea" rows="3" placeholder="اتركه فارغاً إذا كان الطلب مباشراً" /></label><div className="field-row"><label>الأولوية<select name="priority"><option>عادية</option><option>عالية</option><option>عاجلة</option><option>منخفضة</option></select></label><label>الموعد<input type="date" name="due" /></label></div><label className="work-order-client-toggle"><input type="checkbox" name="clientApproval" /><span><strong>يحتاج اعتماد العميل بعد مراجعتي</strong><small>لن تصل أي نتيجة للعميل تلقائياً.</small></span></label><button className="button primary" type="submit">إضافة واختيار التنفيذ</button></form>}

    {orders.length > 0 && selected && <section className="work-order-command simple-work-command"><aside className="work-order-index"><header><strong>الأعمال</strong><small>{rootOrders.length} طلبات رئيسية</small></header>{rootOrders.map((order) => { const childCount = orders.filter((item) => item.parentId === order.id).length; const childLabel = childCount === 1 ? " · جزء واحد" : childCount > 1 ? ` · ${childCount} أجزاء` : ""; return <button key={order.id} className={selected.id === order.id || selected.parentId === order.id ? "active" : ""} onClick={() => setSelectedId(order.id)}><span><small>{order.id}</small><strong>{order.title}</strong><em>{order.project}{childLabel}</em></span><span className="status-badge">{statusLabel[order.status] || order.status}</span><div>{!order.dispatched && <i className="owner-avatar">ع</i>}{(order.assignees || []).map((name) => <i key={name}>{name.slice(0, 1)}</i>)}</div></button>; })}</aside><section className="panel work-order-room simple-work-room"><header className="work-order-room-head"><div>{parent && <button className="text-link" onClick={() => setSelectedId(parent.id)}>العودة إلى العمل الأساسي</button>}<span>{selected.id}، {selected.project}</span><h2>{selected.title}</h2></div><span className="status-badge">{statusLabel[selected.status] || selected.status}</span></header>
      {!selected.dispatched && !["completed", "client_review", "internal_review", "client_revision"].includes(selected.status) && <section className="simple-execution-decision"><header><small>قرار واحد فقط</small><h3>كيف تريد تنفيذ هذا العمل؟</h3><p>يمكنك تغيير القرار ما دام لم يُرسل لمتعاون.</p></header><div className="execution-mode-options"><button className={selected.executionMode === "owner_led" ? "active" : ""} onClick={() => chooseExecutionMode("owner_led")}><strong>أنفذه بنفسي</strong><small>يبقى في قائمتي</small></button><button className={selected.executionMode === "delegated" ? "active" : ""} onClick={() => chooseExecutionMode("delegated")}><strong>أرسله كاملاً</strong><small>لمتعاون أختاره</small></button><button className={selected.executionMode === "split" ? "active" : ""} onClick={() => chooseExecutionMode("split")}><strong>أقسمه إلى أجزاء</strong><small>كل جزء لمتعاون</small></button></div></section>}

      <section className="work-order-brief-block"><small>{selected.parentId ? "جزء من العمل" : "المطلوب"}</small><p>{selected.description}</p>{selected.recommendations && <blockquote><strong>فكرة أو توجيه من عبد الوهاب</strong>{selected.recommendations}</blockquote>}<div className="work-order-meta"><span><small>الأولوية</small><strong>{selected.priority}</strong></span><span><small>الموعد</small><strong>{selected.due || "غير محدد"}</strong></span><span><small>المنفذ</small><strong>{selected.dispatched ? selected.assignees.join("، ") : "عبد الوهاب"}</strong></span>{selected.dispatched && selected.assignees.map((name) => <span key={name}><small>أجر {name.split(" ")[0]}</small><strong>{Number(selected.compensation[name]?.amount || 0).toLocaleString("en-US")} {selected.compensation[name]?.currency || "SAR"}</strong></span>)}</div></section>

      {!selected.dispatched && !["completed", "client_review", "internal_review", "client_revision"].includes(selected.status) && <details className="optional-owner-note" open={Boolean(selected.recommendations || selected.creativeNotes)}><summary><span><strong>إضافة فكرة أو توجيه</strong><small>اختياري، ولا يمنع التفويض إذا تركته فارغاً</small></span><Plus size={18} /></summary><label>الفكرة أو التوجيه<textarea rows="4" value={selected.recommendations} onChange={(event) => updateOrder(selected.id, { recommendations: event.target.value })} placeholder="اكتب فقط ما يفيد التنفيذ" /></label><label>ملاحظات خاصة بي<textarea rows="3" value={selected.creativeNotes} onChange={(event) => updateOrder(selected.id, { creativeNotes: event.target.value })} placeholder="لا تظهر للمتعاون" /></label></details>}

      {!selected.dispatched && selected.executionMode === "owner_led" && !["completed", "client_review", "internal_review", "client_revision"].includes(selected.status) && <div className="simple-owner-action"><button className="button primary" onClick={startOwner}><UserFocus size={18} /> وضعه في قائمة تنفيذي</button></div>}

      {!selected.dispatched && selected.executionMode === "delegated" && <section className="simple-delegation-box"><div><small>تفويض مباشر</small><h3>اختر المتعاون وحدد أجره ثم أرسل</h3><p>الفكرة ليست حقلاً إلزامياً. الأجر هو آخر خطوة قبل وصول العمل للمتعاون.</p></div><div className="work-order-assignee-checks">{collaborators.map((name, index) => <label className={selected.assignees.includes(name) ? "selected" : ""} key={name}><input type="checkbox" checked={selected.assignees.includes(name)} onChange={() => toggleAssignee(name)} /><span>{name.slice(0, 1)}</span><b>{name}</b><small>{team[index].role}</small></label>)}</div>{selected.assignees.length > 0 && <div className="assignment-compensation"><header><div><strong>الأجر المتفق عليه</strong><small>يصبح مستحقاً عند اعتماد المنجز.</small></div><Coins size={20} /></header>{selected.assignees.map((name) => <div className="assignment-compensation-row" key={name}><span><b>{name}</b><small>لهذا العمل</small></span><label>المبلغ<input type="number" min="0.01" step="0.01" value={selected.compensation[name]?.amount || ""} onChange={(event) => updateCompensation(name, { amount: event.target.value })} /></label><label>العملة<select value={selected.compensation[name]?.currency || "SAR"} onChange={(event) => updateCompensation(name, { currency: event.target.value })}><option>SAR</option><option>USD</option><option>EUR</option></select></label></div>)}</div>}<button className="button primary" disabled={!selected.assignees.length || selected.assignees.some((name) => Number(selected.compensation[name]?.amount || 0) <= 0)} onClick={dispatch}><PaperPlaneTilt size={18} /> تثبيت الأجر وإرسال الطلب</button></section>}

      {!selected.dispatched && selected.executionMode === "split" && <section className="simple-split-box"><header><div><small>تجزئة العمل</small><h3>أضف جزءاً واربطه بمن سينفذه</h3><p>كل جزء له غرفة وأجر مستقلان، ويبقى مرتبطاً بهذا الطلب.</p></div><span>{parts.length === 1 ? "جزء واحد" : `${parts.length} أجزاء`}</span></header><form onSubmit={addPart}><div className="field-row"><label>اسم الجزء<input name="title" required placeholder="مثال: تجهيز المقاسات" /></label><label>المتعاون<select name="assignee" required defaultValue=""><option value="" disabled>اختر المتعاون</option>{collaborators.map((name) => <option key={name}>{name}</option>)}</select></label></div><label>المطلوب في هذا الجزء<textarea name="description" rows="3" required placeholder="ما الذي سيسلمه المتعاون؟" /></label><label>توجيه لهذا الجزء، اختياري<textarea name="idea" rows="2" /></label><div className="field-row"><label>أجر هذا الجزء<input name="collaboratorAmount" type="number" min="0.01" step="0.01" required /></label><label>العملة<select name="collaboratorCurrency" defaultValue="SAR"><option>SAR</option><option>USD</option><option>EUR</option></select></label></div><div className="field-row"><label>الأولوية<select name="priority"><option>عادية</option><option>عالية</option><option>عاجلة</option></select></label><label>الموعد<input name="due" type="date" /></label></div><button className="button primary" type="submit"><Plus size={18} /> تثبيت الأجر وإرسال الجزء</button></form></section>}

      {parts.length > 0 && <section className="linked-work-parts"><header><div><h3>أجزاء هذا العمل</h3><p>افتح أي جزء لمتابعة نقاشه وبروفاته ومستحقه.</p></div></header>{parts.map((part) => { const name = part.assignees[0]; return <button key={part.id} onClick={() => setSelectedId(part.id)}><span><small>{part.id}</small><strong>{part.title}</strong><em>{name}، {Number(part.compensation?.[name]?.amount || 0).toLocaleString("en-US")} {part.compensation?.[name]?.currency || "SAR"}</em></span><span className="status-badge">{statusLabel[part.status] || part.status}</span><ArrowLeft size={17} /></button>; })}</section>}

      {selected.status === "owner_production" && selected.executionMode === "owner_led" && <section className="owner-proof-station"><div><span>تنفيذك</span><h3>ارفع البروفة عندما تصبح جاهزة</h3><p>هذه الخطوة اختيارية حتى تكون لديك نتيجة تحتاج اعتماداً أو إرسالاً للعميل.</p></div><label>ملف البروفة<input type="file" onChange={(event) => setOwnerProofFile(event.target.files?.[0] || null)} /></label><label>ملاحظة<textarea rows="3" value={ownerProofNote} onChange={(event) => setOwnerProofNote(event.target.value)} /></label><button className="button primary" disabled={!ownerProofFile} onClick={submitOwnerProof}><FileArrowUp size={18} /> رفع للمراجعة</button></section>}

      {selected.status === "internal_review" && <section className="work-order-proof-gate"><div><span>قرارك مطلوب</span><h3>{selected.proof?.title}</h3><p>{selected.proof?.note}</p></div><button className="button ghost" onClick={() => onToast("تم فتح بروفة التجربة")}>فتح ملف البروفة</button><label>ملاحظة القرار<textarea rows="3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="اكتب ملاحظة إذا أردت تعديلاً" /></label><div className="live-actions"><button className="button ghost" onClick={() => reviewProof("changes_requested")}>{selected.dispatched ? "طلب تعديل من المتعاون" : "إعادتها إلى تنفيذي"}</button><button className="button primary" onClick={() => reviewProof("approved")}><Check size={17} /> {selected.clientApproval ? "اعتماد وإرسال للعميل" : "اعتماد وإنهاء العمل"}</button></div></section>}
      {selected.status === "client_revision" && <section className="work-order-proof-gate client-revision-gate"><div><span>وصلت ملاحظة من العميل</span><h3>أنت تقرر من ينفذ التعديل</h3><p>{selected.proof?.clientNote || scenario.proof.revisionNote}</p></div><label>توجيهك للمتعاون، اختياري<textarea rows="3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="أضف تفسيرك، أو أرسل ملاحظة العميل كما هي" /></label><div className="live-actions"><button className="button ghost" onClick={() => routeClientRevision("owner")}><UserFocus size={17} /> سأتولى التعديل بنفسي</button>{selected.dispatched && selected.assignees.length > 0 && <button className="button primary" onClick={() => routeClientRevision("collaborator")}><PaperPlaneTilt size={17} /> إرسال التعديل للمتعاون</button>}</div><small className="revision-control-note">المتعاون لا يرى طلب التعديل ولا يبدأه حتى تختار إرساله.</small></section>}

      <section className="work-order-room-columns"><div><div className="work-order-section-title"><div><h3>الملفات</h3><p>المراجع والملفات المرتبطة بهذا العمل.</p></div><label className="button ghost small upload-button">إرفاق ملف <FileArrowUp size={16} /><input type="file" onChange={(event) => addFile(event.target.files?.[0])} /></label></div><div className="work-order-file-list">{selected.files.length ? selected.files.map((file) => <button key={file} onClick={() => onToast(`تم فتح ${file}`)}><FileText size={19} /><span><strong>{file}</strong><small>ملف داخل العمل</small></span><ArrowLeft size={16} /></button>) : <p className="work-order-empty-line">لا توجد ملفات بعد.</p>}</div></div>{selected.dispatched ? <div><div className="work-order-section-title"><div><h3>غرفة العمل</h3><p>نقاشك المباشر مع المتعاون في هذا الطلب فقط.</p></div></div><div className="work-order-thread">{selected.messages.map((item) => <article className={`${item.author === "عبد الوهاب" ? "mine" : ""} ${item.system ? "system" : ""} ${item.decision ? "decision" : ""}`} key={item.id}><header><strong>{item.author}</strong><time>{item.at}</time></header><p>{item.body}</p></article>)}</div><form className="work-order-composer" onSubmit={addMessage}><textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب توجيهاً أو رداً" /><div><span /><button className="button primary small" type="submit">إرسال</button></div></form></div> : <div className="creative-private-journal"><LockKey size={25} /><h3>لم يُرسل لمتعاون</h3><p>سيبقى خاصاً بك حتى تضغط زر الإرسال بنفسك.</p></div>}</section>
      {selected.dispatched && <button className="text-link work-order-preview-link" onClick={() => setRole("collaborator")}>فتح داشبورد المتعاون <ArrowLeft size={16} /></button>}
    </section></section>}
  </div>;
}

function TeamView({ scenario, setRole }) {
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>المتعاونون الاختياريون</h1><p>دليل للمساعدة الإنتاجية عند الحاجة. لا يبدأ أي تكليف من هنا ولا يشارك أحد في بناء فكرتك تلقائياً.</p></div><button className="button primary"><Plus size={18} /> دعوة متعاون</button></div>
      {scenario.step >= 7 && scenario.creative?.executionMode !== "owner_led" && <section className="panel scenario-team-task"><span className="person-avatar tone-1">{scenario.collaborator.name.slice(0, 1)}</span><div><span className="scenario-live-label"><Sparkle size={13} weight="fill" /> تنفيذ إنتاجي مفوض</span><strong>{scenario.collaborator.task}</strong><small>الاتجاه الإبداعي من عبد الوهاب، التسليم {scenario.collaborator.due}</small></div><span className="status-badge">{scenario.step === 7 ? "قيد التنفيذ" : "تم رفع البروفة"}</span>{scenario.step === 7 && <button className="button primary small" onClick={() => setRole("collaborator")}>معاينة المتعاون</button>}</section>}
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
        <aside className="capacity-card"><Target size={27} /><h2>سعتك الإبداعية هذا الأسبوع</h2><strong>محكومة بوقت التركيز</strong><p>يحسب النظام قدرتك من جلسات البحث والتصميم والقرارات، لا من عدد المتعاونين المتاحين.</p><button className="button inverted">فتح مخطط وقتي</button></aside>
      </section>
    </div>
  );
}

function SystemCenterView({ access }) {
  const [checking, setChecking] = useState(true);
  const [connection, setConnection] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);
  const runChecks = async () => {
    setChecking(true);
    try {
      const result = await checkPlatformConnection();
      setConnection(result);
      try {
        const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
        const contentType = response.headers.get("content-type") || "";
        setServerHealth(contentType.includes("application/json") ? await response.json() : null);
      } catch {
        setServerHealth(null);
      }
    } finally {
      setChecking(false);
    }
  };
  useEffect(() => {
    runChecks();
  }, []);

  const databaseReady = Boolean(connection?.database);
  const authReady = Boolean(access?.session);
  const serverChecks = serverHealth?.checks || {};
  const readiness = [
    { label: "قاعدة البيانات", description: "السجلات والعملاء والمشاريع محفوظة مركزياً", ready: databaseReady },
    { label: "تسجيل الدخول", description: "الدور والصلاحية مرتبطان بالحساب", ready: authReady },
    { label: "تخزين الملفات", description: "حاوية خاصة للمصادر والبروفات والتسليم", ready: databaseReady },
    { label: "البريد", description: "إرسال الإشعارات من الخادم عبر Resend", ready: Boolean(serverChecks.email) },
    { label: "واتساب", description: "قالب Meta معتمد لتحديثات المشروع", ready: Boolean(serverChecks.whatsapp) },
    { label: "طابور الإشعارات", description: "معالجة دورية مع إعادة المحاولة وسجل الأخطاء", ready: Boolean(serverChecks.notifications) },
  ];
  const readyCount = readiness.filter((item) => item.ready).length;

  return <div className="dashboard-content page-stack system-center-page">
    <div className="page-title"><div><h1>الربط والإطلاق</h1><p>مكان واحد يوضح ما يعمل فعلياً وما يحتاج مفتاح خدمة قبل استقبال بيانات حقيقية.</p></div><button className="button primary" onClick={runChecks} disabled={checking}>{checking ? <CircleNotch size={18} className="spin" /> : <ShieldCheck size={18} />} فحص الربط</button></div>
    <section className={`system-status-hero ${platformConfig.configured ? "connected" : "local"}`}>
      <div><span>{platformConfig.configured ? "وضع التشغيل المتصل" : "وضع التجربة المحلية"}</span><h2>{platformConfig.configured ? connection?.message || "جارٍ فحص المنصة" : "الموقع يعمل الآن دون نقل بيانات خارج الجهاز"}</h2><p>{platformConfig.configured ? `المساحة: ${access?.workspace?.name || platformConfig.workspaceSlug}` : "أضف مفاتيح Supabase إلى Vercel، ثم طبق ملف قاعدة البيانات للانتقال إلى التشغيل المشترك."}</p></div>
      <strong>{readyCount}<small>من {readiness.length}</small></strong>
    </section>
    <section className="system-readiness-grid">
      {readiness.map((item) => <article key={item.label} className={item.ready ? "ready" : "pending"}><span>{item.ready ? <Check size={18} weight="bold" /> : <Clock size={18} />}</span><div><strong>{item.label}</strong><p>{item.description}</p></div><small>{item.ready ? "جاهز" : "بانتظار الربط"}</small></article>)}
    </section>
    <section className="system-columns">
      <div className="panel system-security"><div className="panel-heading"><div><h2>الحماية المطبقة</h2><p>القواعد موجودة داخل قاعدة البيانات وليست مجرد إخفاء عناصر الواجهة.</p></div><LockKey size={24} /></div><div className="security-points"><span><ShieldCheck size={19} /><strong>عبد الوهاب، المالك والمدير الإبداعي</strong><small>الفكرة والاتجاه والتنفيذ وإدارة التشغيل والمستندات</small></span><span><ShieldCheck size={19} /><strong>العميل</strong><small>مشاريعه وفواتيره والملفات المنشورة له فقط</small></span><span><ShieldCheck size={19} /><strong>المتعاون</strong><small>الجزء الإنتاجي المفوض وملفاته دون مسودات الفكرة أو مالية العميل</small></span><span><ShieldCheck size={19} /><strong>المحاسب</strong><small>الفواتير والمطالبات دون صلاحيات الموقع</small></span></div></div>
      <aside className="panel launch-next"><Target size={27} /><h2>الخطوة التشغيلية التالية</h2>{platformConfig.configured ? <><strong>{authReady ? "اختبار حسابات حقيقية" : "إنشاء أول حساب مالك"}</strong><p>{authReady ? "أنشئ حساب عميل ومتعاون، ثم نفذ مشروع قبول قبل فتح الطلبات العامة." : "سجل المستخدم في Supabase، ثم اربطه بعضوية owner داخل مساحة U89."}</p></> : <><strong>إنشاء مشروع Supabase</strong><p>طبق ملف الترحيل، أضف مفاتيح المتصفح والخادم إلى Vercel، ثم أعد النشر.</p></>}<div className="launch-file-list"><span><FileText size={18} /> supabase/migrations</span><span><FileText size={18} /> .env.example</span><span><FileText size={18} /> vercel.json</span></div></aside>
    </section>
    {connection?.error && <div className="system-error"><ShieldCheck size={20} /><div><strong>تفصيل الفحص</strong><p>{connection.error}</p></div></div>}
  </div>;
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
        {tab === "overview" && <div className="drawer-content"><div className="next-decision"><Target size={24} /><span><small>قرارك الإبداعي التالي</small><strong>{project.next}</strong><p>يبقى المسار لديك. لا ينتقل العمل إلى أي شخص إلا إذا اخترت لاحقاً تفويض نطاق إنتاجي.</p></span></div><div className="drawer-facts"><div><small>موعد القرار</small><strong>{project.due}</strong></div><div><small>قيمة المشروع</small><strong>{project.value}</strong></div><div><small>المدير الإبداعي والمصمم</small><strong>عبد الوهاب السويد</strong></div><div><small>آخر تحديث</small><strong>منذ 32 دقيقة</strong></div></div><button className="button primary full" onClick={() => onToast("تم إرسال البروفة إلى العميل")}>إرسال البروفة للعميل</button></div>}
        {tab === "proofs" && <div className="drawer-content"><div className="proof-version"><img src={project.image} alt={`البروفة الثانية لمشروع ${project.name}`} /><div><strong>البروفة الثانية</strong><small>حفظها عبد الوهاب اليوم، 9:26 ص</small></div><span className="status-badge">جاهزة لقرارك</span></div><div className="comment-box"><strong>ملاحظة عبد الوهاب</strong><p>وحّدت لون العبوة مع تطبيقات الواجهة، وأراجع الآن جاهزية النسخة للعرض.</p></div><button className="button primary full" onClick={() => onToast("تم إرسال البروفة إلى العميل")}>إرسال البروفة للعميل</button></div>}
        {tab === "finance" && <div className="drawer-content"><div className="drawer-facts"><div><small>قيمة العقد</small><strong>{project.value}</strong></div><div><small>المحصل</small><strong>50%</strong></div><div><small>تكلفة تنفيذ مفوض</small><strong>لا يوجد</strong></div><div><small>الصافي قبل المصروفات</small><strong>يحسب آلياً</strong></div></div><div className="comment-box"><strong>الفاتورة التالية</strong><p>تُنشأ تلقائياً عند اعتماد البروفة النهائية.</p></div></div>}
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
  const save = async () => {
    try {
      await onSave(draft);
      onToast("تم حفظ إعدادات العمل والمستندات");
    } catch (error) {
      onToast(error.message || "تعذر حفظ الإعدادات في قاعدة البيانات");
    }
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

function SiteAdminView({ content, onPublish, onPreview, onToast, access }) {
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
  const updateVisibility = (group, index, value) => setDraft((current) => {
    const source = current[group] || [];
    return {
      ...current,
      [group]: Array.from({ length: Math.max(source.length, index + 1) }, (_, itemIndex) => itemIndex === index ? value : source[itemIndex] !== false),
    };
  });
  const updateSection = (key, value) => setDraft((current) => ({
    ...current,
    sectionVisibility: { ...current.sectionVisibility, [key]: value },
  }));
  const updateService = (index, key, value) => setDraft((current) => ({ ...current, services: current.services.map((service, serviceIndex) => serviceIndex === index ? { ...service, [key]: value } : service) }));
  const addService = () => {
    const id = `service-${Date.now()}`;
    setDraft((current) => ({
      ...current,
      services: [...current.services, { id, title: "خدمة جديدة", description: "اكتب وصفاً واضحاً للخدمة.", selectionLabel: "اختر ما تحتاجه", options: ["مخرج أول"], engagement: "project", active: true }],
      briefTemplates: [...(current.briefTemplates || []), { id: `brief-${id}`, serviceId: id, title: "بريف الخدمة الجديدة", description: "أسئلة العميل بعد قبول الطلب وقبل عرض السعر.", enabled: true, sections: [{ id: `section-${Date.now()}`, title: "فهم الطلب", fields: [{ id: `field-${Date.now()}`, label: "ما النتيجة التي تريد تحقيقها؟", type: "textarea", required: true }] }] }],
    }));
  };
  const removeService = (index) => setDraft((current) => {
    const serviceId = current.services[index].id;
    return { ...current, services: current.services.filter((_, serviceIndex) => serviceIndex !== index), briefTemplates: (current.briefTemplates || []).filter((template) => template.serviceId !== serviceId) };
  });
  const updatePortfolioProject = (index, key, value) => setDraft((current) => ({
    ...current,
    portfolioProjects: current.portfolioProjects.map((project, projectIndex) => projectIndex === index ? { ...project, [key]: value } : project),
  }));
  const updatePortfolioPalette = (index, key, value) => setDraft((current) => ({
    ...current,
    portfolioProjects: current.portfolioProjects.map((project, projectIndex) => projectIndex === index ? {
      ...project,
      palette: { ...(project.palette || {}), [key]: value },
    } : project),
  }));
  const updatePortfolioGallery = (index, value) => setDraft((current) => ({
    ...current,
    portfolioProjects: current.portfolioProjects.map((project, projectIndex) => {
      if (projectIndex !== index) return project;
      const existing = project.gallery || [];
      const gallery = value.split("\n").map((src) => src.trim()).filter(Boolean).map((src, imageIndex) => ({
        src,
        alt: existing[imageIndex]?.alt || `تطبيق من مشروع ${project.name}`,
        layout: existing[imageIndex]?.layout || (imageIndex === 0 ? "wide" : imageIndex % 3 === 1 ? "tall" : "standard"),
      }));
      return { ...project, gallery };
    }),
  }));
  const addPortfolioProject = () => setDraft((current) => ({
    ...current,
    portfolioProjects: [...current.portfolioProjects, {
      id: `portfolio-${Date.now()}`,
      name: "مشروع جديد",
      nameEn: "New Project",
      cover: "/portfolio/bukhary-logo.webp",
      category: "صناعة علامة",
      statement: "اكتب الفكرة التي تقود دراسة الحالة.",
      story: "اكتب قصة المشروع ودورك فيه من البداية حتى التطبيقات.",
      scope: ["شخصية العلامة", "صناعة العلامة"],
      consulting: [],
      palette: { surface: "#edf0e8", ink: "#151814", accent: "#b7d43b" },
      gallery: [{ src: "/portfolio/bukhary-hero.webp", alt: "تطبيق من المشروع", layout: "wide" }],
    }],
    workVisibility: [...(current.workVisibility || []), true],
  }));
  const removePortfolioProject = (index) => setDraft((current) => ({
    ...current,
    portfolioProjects: current.portfolioProjects.filter((_, projectIndex) => projectIndex !== index),
    workVisibility: (current.workVisibility || []).filter((_, projectIndex) => projectIndex !== index),
  }));
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
  const publish = async () => {
    try {
      await onPublish(draft);
      onToast("تم نشر التغييرات على الموقع التعريفي");
    } catch (error) {
      onToast(error.message || "تعذر نشر التغييرات");
    }
  };

  return (
    <div className="dashboard-content page-stack site-admin-page">
      <div className="page-title site-admin-title">
        <div><span className="eyebrow">CMS</span><h1>إدارة الموقع</h1><p>غيّر المحتوى والأقسام ونموذج الطلب ومحركات البحث من مكان واحد.</p></div>
        <div className="site-admin-actions"><button className="button ghost" onClick={onPreview}><Globe size={18} /> معاينة الموقع</button>{!(tab === "work" && access) && <button className="button primary" onClick={publish}><FloppyDisk size={18} /> نشر التغييرات</button>}</div>
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
              <label className="cms-field">نص زر التواصل<input value={draft.heroCta} onChange={(event) => update("heroCta", event.target.value)} /></label>
              <label className="cms-field">عنوان الخدمات<input value={draft.servicesTitle} onChange={(event) => update("servicesTitle", event.target.value)} /></label>
              <label className="cms-field">عنوان الأعمال<input value={draft.workTitle} onChange={(event) => update("workTitle", event.target.value)} /></label>
            </div>
            <div className="cms-section"><h3>إظهار أقسام الصفحة</h3><div className="cms-toggle-grid">
              {[["services", "الخدمات"], ["work", "الأعمال المختارة"], ["about", "نبذة شخصية"]].map(([id, label]) => <label className="cms-toggle" key={id}><span><strong>{label}</strong><small>{draft.sectionVisibility[id] ? "ظاهر في الموقع" : "مخفي مؤقتاً"}</small></span><input type="checkbox" checked={draft.sectionVisibility[id]} onChange={(event) => updateSection(id, event.target.checked)} /></label>)}
            </div></div>
          </>}

          {tab === "services" && <>
            <div className="cms-editor-heading"><div><h2>الخدمات المعروضة</h2><p>أضف وعدّل واحذف أي خدمة، وحدد ما يظهر في الموقع ونموذج الطلب.</p></div><button className="button ghost small" onClick={addService}><Plus size={17} /> إضافة خدمة</button></div>
            <div className="service-editor-list">{draft.services.map((service, index) => <article className="service-editor-item service-editor-expanded" key={service.id}><span className="cms-list-index">{String(index + 1).padStart(2, "0")}</span><div><div className="field-row"><label>اسم الخدمة<input value={service.title} onChange={(event) => updateService(index, "title", event.target.value)} /></label><label>نوع التعاقد<select value={service.engagement || "project"} onChange={(event) => updateService(index, "engagement", event.target.value)}><option value="project">مشروع محدد</option><option value="retainer">طلبات مفتوحة بعقد</option></select></label></div><label>الوصف<textarea rows="2" value={service.description} onChange={(event) => updateService(index, "description", event.target.value)} /></label><label>عنوان الاختيارات<input value={service.selectionLabel || ""} onChange={(event) => updateService(index, "selectionLabel", event.target.value)} /></label><label>خيارات نطاق الخدمة، افصل بينها بعلامة ،<textarea rows="3" value={(service.options || []).join("، ")} onChange={(event) => updateService(index, "options", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>{(service.options || []).includes("الهوية البصرية") && <label>تطبيقات الهوية التي تظهر عند اختيار الهوية البصرية<textarea rows="3" value={(service.conditionalOptions || identityApplications).join("، ")} onChange={(event) => { updateService(index, "conditionalOption", "الهوية البصرية"); updateService(index, "conditionalLabel", "اختر تطبيقات الهوية التي تحتاجها"); updateService(index, "conditionalOptions", event.target.value.split("،").map((item) => item.trim()).filter(Boolean)); }} /></label>}{service.engagement === "retainer" && <label>مدد التعاقد المتاحة<input value={(service.billingOptions || ["شهري", "سنوي"]).join("، ")} onChange={(event) => updateService(index, "billingOptions", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>}</div><div className="service-editor-actions"><label><input type="checkbox" checked={service.active} onChange={(event) => updateService(index, "active", event.target.checked)} /> ظاهرة</label><button aria-label={`حذف ${service.title}`} onClick={() => removeService(index)}><X size={17} /></button></div></article>)}</div>
          </>}

          {tab === "work" && access && <PortfolioDesk access={access} />}
          {tab === "work" && !access && <>
            <div className="cms-editor-heading"><div><h2>الأعمال المختارة</h2><p>المشاريع ودراسات الحالة التي تظهر في واجهة الموقع التعريفية.</p></div><button className="button ghost small" onClick={addPortfolioProject}><Plus size={17} /> إضافة مشروع</button></div>
            <div className="cms-portfolio-editor">{(draft.portfolioProjects || []).map((project, index) => <article className="cms-portfolio-item" key={project.id}>
              <img src={project.cover} alt="" />
              <div className="cms-portfolio-fields">
                <div className="field-row"><label>اسم المشروع<input value={project.name} onChange={(event) => updatePortfolioProject(index, "name", event.target.value)} /></label><label>الاسم بالإنجليزية<input dir="ltr" value={project.nameEn || ""} onChange={(event) => updatePortfolioProject(index, "nameEn", event.target.value)} /></label></div>
                <label>تصنيف المشروع<input value={project.category || ""} onChange={(event) => updatePortfolioProject(index, "category", event.target.value)} /></label>
                <label>الفكرة الرئيسية لدراسة الحالة<textarea rows="2" value={project.statement || ""} onChange={(event) => updatePortfolioProject(index, "statement", event.target.value)} /></label>
                <label>قصة المشروع ودورك فيه<textarea rows="4" value={project.story || ""} onChange={(event) => updatePortfolioProject(index, "story", event.target.value)} /></label>
                <label>نطاق العمل كما يظهر داخل المشروع<textarea rows="3" value={(project.scope || []).join("، ")} onChange={(event) => updatePortfolioProject(index, "scope", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>
                <label>تفاصيل الاستشارات الإبداعية<textarea rows="2" value={(project.consulting || []).join("، ")} onChange={(event) => updatePortfolioProject(index, "consulting", event.target.value.split("،").map((item) => item.trim()).filter(Boolean))} /></label>
                <label>صورة الشعار<input dir="ltr" value={project.cover} onChange={(event) => updatePortfolioProject(index, "cover", event.target.value)} /></label>
                <label>صور دراسة الحالة، رابط واحد في كل سطر<textarea dir="ltr" rows="5" value={(project.gallery || []).map((image) => image.src).join("\n")} onChange={(event) => updatePortfolioGallery(index, event.target.value)} /></label>
                <div className="field-row cms-palette-fields">
                  <label>لون الخلفية<input dir="ltr" type="color" value={project.palette?.surface || "#edf0e8"} onChange={(event) => updatePortfolioPalette(index, "surface", event.target.value)} /></label>
                  <label>لون النص<input dir="ltr" type="color" value={project.palette?.ink || "#151814"} onChange={(event) => updatePortfolioPalette(index, "ink", event.target.value)} /></label>
                  <label>لون الحركة<input dir="ltr" type="color" value={project.palette?.accent || "#b7d43b"} onChange={(event) => updatePortfolioPalette(index, "accent", event.target.value)} /></label>
                </div>
              </div>
              <div className="cms-portfolio-actions"><label><input type="checkbox" checked={draft.workVisibility?.[index] !== false} onChange={(event) => updateVisibility("workVisibility", index, event.target.checked)} /> ظاهر</label><button aria-label={`حذف ${project.name}`} onClick={() => removePortfolioProject(index)}><X size={18} /></button></div>
            </article>)}</div>
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
        <label>ما الذي لا تريد حمله في ذهنك؟<textarea autoFocus rows="3" value={text} onChange={(event) => setText(event.target.value)} placeholder="مثال: اختبر اسم الحملة غداً قبل تثبيت الاتجاه" /></label>
        <div><small>سيصل إلى صندوقك لتحديد المشروع والمرحلة الإبداعية لاحقاً.</small><button className="button primary" type="submit">حفظ <ArrowLeft size={17} /></button></div>
      </form>
    </Modal>
  );
}

function Sidebar({ section, setSection, onSite, onFocus, counts }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top"><Logo onClick={onSite} /><span className="workspace-label">استوديو عبد الوهاب</span></div>
      <nav aria-label="أقسام الإدارة">
        {[{ label: "يومي والعمل", ids: ["overview", "contact-inbox", "requests", "projects", "work-orders", "briefs"] }, { label: "العلاقات والمال", ids: ["documents", "finance", "clients", "team"] }, { label: "الاستوديو", ids: ["access", "studio-settings", "site-admin", "system", "scenario"] }].map((group) => <div className="cc-nav-group" key={group.label}><small>{group.label}</small>{group.ids.map((id) => navItems.find((item) => item.id === id)).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={20} weight={section === item.id ? "fill" : "regular"} /><span>{item.label}</span>{counts?.[item.id] > 0 && <b>{counts[item.id]}</b>}</button>;
        })}</div>)}
      </nav>
      <div className="sidebar-card"><Target size={21} /><strong>مساحة للتركيز</strong><p>جلسة واحدة لعمل تختاره.</p><button onClick={onFocus}>ابدأ 25 دقيقة</button></div>
      <button className="back-to-site" onClick={onSite}><House size={19} /> الموقع التعريفي</button>
      <div className="profile-mini"><span>ع</span><div><strong>عبد الوهاب السويد</strong><small>المدير الإبداعي والمصمم</small></div><CaretDown size={15} /></div>
    </aside>
  );
}

function AppTopbar({ theme, onTheme, role, setRole, onCapture, onSearch, canPreview, onExit, connected, onLogout, notificationCount, notificationsOpen, onNotifications }) {
  return (
    <header className="app-topbar">
      {canPreview ? <>
        <button className="mobile-brand" onClick={onExit} aria-label="العودة للموقع التعريفي"><Logo compact /></button>
        {!connected && <div className="role-switch" aria-label="معاينة صلاحيات المستخدمين">
          <button className={role === "owner" ? "active" : ""} onClick={() => setRole("owner")}>عبد الوهاب</button>
          <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>معاينة العميل</button>
          <button className={role === "collaborator" ? "active" : ""} onClick={() => setRole("collaborator")}>معاينة المتعاون</button>
        </div>}
      </> : <div className="portal-identity"><Logo compact /><span><strong>{role === "client" ? "بوابة العميل" : "مساحة المتعاون"}</strong><small>دخول خاص وآمن</small></span></div>}
      <div className="topbar-actions">
        {canPreview && role === "owner" && <><button className="icon-button" aria-label="البحث والانتقال السريع" onClick={onSearch}><MagnifyingGlass size={20} /></button><button className="quick-capture" onClick={onCapture}><Plus size={18} /> التقاط سريع <kbd>⌘ ⇧ K</kbd></button></>}
        <ThemeButton theme={theme} onToggle={onTheme} />
        <button type="button" className={`icon-button ${notificationsOpen ? "active" : ""}`} aria-label="الإشعارات" title="الإشعارات" onClick={onNotifications}><Bell size={19} />{notificationCount > 0 && <span className="notification-count">{notificationCount > 9 ? "9+" : notificationCount}</span>}</button>
        {connected && <button className="button ghost portal-exit" onClick={onLogout}><SignOut size={18} /> خروج</button>}
        {!canPreview && !connected && <button className="button ghost portal-exit" onClick={onExit}><SignOut size={18} /> تسجيل الخروج</button>}
      </div>
    </header>
  );
}

function OwnerApp({ section, setSection, setRole, onProject, onCapture, onToast, siteContent, onPublishSite, onSite, scenario, onScenarioAdvance, onScenarioPatch, onScenarioReset, platformAccess, liveData, onRefreshLiveData, targetId }) {
  if (liveData && !["studio-settings", "site-admin", "system"].includes(section)) return <LiveOwnerSection section={section} targetId={targetId} data={liveData} access={platformAccess} refresh={onRefreshLiveData} onToast={onToast} setSection={setSection} ownerName={siteContent.ownerNameAr} />;
  if (section === "scenario") return <ScenarioCenter scenario={scenario} onReset={onScenarioReset} setSection={setSection} setRole={setRole} />;
  if (section === "projects") return <ProjectsView onProject={onProject} scenario={scenario} onAdvance={onScenarioAdvance} onToast={onToast} />;
  if (section === "work-orders") return <WorkOrdersView scenario={scenario} targetId={targetId} setRole={setRole} onToast={onToast} onAdvance={onScenarioAdvance} />;
  if (section === "requests") return <RequestsView onToast={onToast} setSection={setSection} setRole={setRole} scenario={scenario} onAdvance={onScenarioAdvance} />;
  if (section === "briefs") return <BriefsView settings={siteContent} onToast={onToast} setSection={setSection} setRole={setRole} scenario={scenario} onAdvance={onScenarioAdvance} />;
  if (section === "documents") return <DocumentsView settings={siteContent} onToast={onToast} scenario={scenario} onAdvance={onScenarioAdvance} onPatch={onScenarioPatch} />;
  if (section === "clients") return <ClientsView />;
  if (section === "finance") return <FinanceView onToast={onToast} settings={siteContent} scenario={scenario} setRole={setRole} />;
  if (section === "team") return <TeamView scenario={scenario} setRole={setRole} />;
  if (section === "access") return <div className="dashboard-content"><section className="panel"><h1>الحسابات والصلاحيات</h1><p>سجّل الدخول بالحساب المتصل لإدارة الحسابات الحقيقية.</p></section></div>;
  if (section === "contact-inbox") return <div className="dashboard-content"><section className="panel"><h1>رسائل التواصل</h1><p>سجّل الدخول بالحساب المتصل لقراءة الرسائل.</p></section></div>;
  if (section === "studio-settings") return <StudioSettingsView content={siteContent} onSave={onPublishSite} onToast={onToast} />;
  if (section === "site-admin") return <SiteAdminView content={siteContent} onPublish={onPublishSite} onPreview={onSite} onToast={onToast} access={platformAccess} />;
  if (section === "system") return <SystemCenterView access={platformAccess} />;
  return <OwnerOverview onProject={onProject} onCapture={onCapture} setSection={setSection} />;
}

function ClientPortal({ onToast, scenario, onAdvance, onPatch }) {
  const [brief, setBrief] = useState(scenario.briefAnswers || {});
  const [agreed, setAgreed] = useState(false);
  const [proofNote, setProofNote] = useState(scenario.proof.revisionNote || "");
  const [rating, setRating] = useState(scenario.feedback.rating || 0);
  const [feedbackNote, setFeedbackNote] = useState(scenario.feedback.note || "");
  const [, setOrders] = usePersistentState("u89-work-orders", initialWorkOrders);
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
  const requestRevision = () => {
    const note = proofNote.trim();
    if (!note) return;
    setOrders((items) => items.map((item) => item.id === "WO-SCENARIO" ? {
      ...item,
      status: "client_revision",
      proof: { ...(item.proof || {}), status: "changes_requested", clientNote: note },
    } : item));
    onAdvance(7, `طلبت ${scenario.client.name} تعديلاً على البروفة`, { proof: { ...scenario.proof, status: "تعديل مطلوب", revisionNote: note, version: scenario.proof.version + 1 } });
    onToast("وصل طلب التعديل إلى عبد الوهاب وينتظر قراره قبل إرساله لأي متعاون");
  };
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
  if (step === 6) actionContent = <div className="client-payment-action"><Receipt size={34} /><span>فاتورة غير ضريبية</span><h2>الدفعة الأولى</h2><strong>{amount} {scenario.quote.currency}</strong><p>بعد السداد يبدأ عبد الوهاب مرحلة البحث وبناء الفكرة والاتجاه الإبداعي.</p><button className="button primary" onClick={() => { onAdvance(7, `سددت ${scenario.client.name} الدفعة الأولى`, { payments: { ...scenario.payments, first: true } }); onToast("تم تسجيل الدفعة وفتح المعمل الإبداعي لعبد الوهاب"); }}>محاكاة السداد الآمن <ArrowLeft size={18} /></button></div>;
  if (step === 7) actionContent = <div className="portal-wait-state"><UserFocus size={36} /><h2>{scenario.proof.revisionNote ? "يطور عبد الوهاب البروفة" : "العمل في المعمل الإبداعي"}</h2><p>{scenario.proof.revisionNote ? `ملاحظة المراجعة الداخلية: ${scenario.proof.revisionNote}` : "يبني عبد الوهاب الفكرة والاتجاه البصري ويصمم البروفة الأولى. لن يصلك إلا ما اعتمده هو بنفسه."}</p></div>;
  if (step === 8) actionContent = <div className="client-proof-action"><div className="portal-action-heading"><div><span>يحتاج قرارك</span><h2>البروفة رقم {scenario.proof.version}</h2><p>راجع الاتجاه البصري ودوّن قراراً واحداً واضحاً.</p></div></div><img src="/work-mandi.jpg" alt={`بروفة ${scenario.project.name}`} /><label>ملاحظة التعديل<textarea rows="3" value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="اكتب ملاحظة محددة عند طلب التعديل" /></label><div><button className="button ghost" disabled={!proofNote.trim()} onClick={requestRevision}>طلب تعديل</button><button className="button primary" onClick={() => { onAdvance(9, `اعتمدت ${scenario.client.name} البروفة`, { proof: { ...scenario.proof, status: "معتمدة", revisionNote: "" } }); onToast("تم اعتماد البروفة وإصدار الدفعة الأخيرة"); }}>اعتماد البروفة <Check size={18} /></button></div></div>;
  if (step === 9) actionContent = <div className="client-payment-action"><Receipt size={34} /><span>فاتورة غير ضريبية</span><h2>الدفعة الأخيرة</h2><strong>{amount} {scenario.quote.currency}</strong><p>بعد السداد يجهز عبد الوهاب حزمة الملفات النهائية.</p><button className="button primary" onClick={() => { onAdvance(10, `سددت ${scenario.client.name} الدفعة الأخيرة`, { payments: { ...scenario.payments, final: true } }); onToast("تم تسجيل السداد وأصبح المشروع جاهزاً للتسليم"); }}>محاكاة السداد الآمن <ArrowLeft size={18} /></button></div>;
  if (step === 10) actionContent = <div className="portal-wait-state"><FolderOpen size={36} /><h2>تُجهز حزمة التسليم</h2><p>اكتملت الدفعات، ويجري الآن فحص الملفات وتنظيمها قبل فتحها لك.</p></div>;
  if (step === 11) actionContent = <div className="client-delivery-action"><CheckCircle size={38} weight="fill" /><span>التسليم النهائي جاهز</span><h2>حزمة الملفات النهائية</h2><p>{scenario.project.name}</p><div><button onClick={() => onToast("تم تنزيل ملف دليل الهوية التجريبي")}><FileText size={22} /><span><strong>دليل الهوية.pdf</strong><small>PDF، 18.4 MB</small></span><ArrowLeft size={17} /></button><button onClick={() => onToast("تم تنزيل حزمة الملفات التجريبية")}><FolderOpen size={22} /><span><strong>ملفات الهوية النهائية.zip</strong><small>ZIP، 126 MB</small></span><ArrowLeft size={17} /></button></div><button className="button primary" onClick={() => { onAdvance(12, `أكدت ${scenario.client.name} استلام الملفات`, { delivery: { released: true, received: true } }); onToast("تم تأكيد الاستلام وجدولة المتابعة"); }}>تأكيد الاستلام <Check size={18} /></button></div>;
  if (step === 12) actionContent = <form className="client-feedback-action" onSubmit={(event) => { event.preventDefault(); onAdvance(13, `أرسلت ${scenario.client.name} تقييم المشروع`, { feedback: { rating, note: feedbackNote } }); onToast("شكراً، اكتمل المشروع وسُجلت المتابعة"); }}><span>متابعة بعد التسليم</span><h2>كيف كانت التجربة؟</h2><p>تقييمك يغلق الحلقة ويُحفظ في ملف العميل.</p><div className="feedback-scale">{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} className={rating === score ? "active" : ""} onClick={() => setRating(score)}>{score}</button>)}</div><label>ملاحظة أخيرة<textarea rows="3" value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="ما الذي تريد أن نحافظ عليه أو نحسنه؟" /></label><button className="button primary" type="submit" disabled={!rating}>إرسال التقييم وإنهاء المشروع <Check size={18} /></button></form>;
  if (step >= 13) actionContent = <div className="portal-complete-state"><CheckCircle size={46} weight="fill" /><span>اكتمل المشروع</span><h2>شكراً يا {scenario.client.name.split(" ")[0]}.</h2><p>العقد والدفعات والبروفات والتسليم والتقييم محفوظة في سجل واحد.</p></div>;

  return <div className="portal-page dashboard-content scenario-client-portal">
    <section className="portal-welcome"><div><small>مرحباً، {scenario.client.name}</small><h1>{scenario.project.name}</h1><p>{scenario.project.service} مع عبد الوهاب السويد.</p></div><span className="status-badge">{scenarioMilestones[Math.min(step, 13)].label}</span></section>
    <section className="portal-project-progress"><StageTrack current={scenarioToProjectStage(step)} /><div><span>التقدم</span><strong>{Math.min(step, 13)} من 13</strong></div></section>
    <section className="panel client-current-action">{actionContent}</section>
    <section className="client-columns scenario-client-columns"><div className="panel timeline-panel"><div className="panel-heading"><div><h2>سجل المشروع</h2><p>آخر الإجراءات المشتركة بينك وبين عبد الوهاب.</p></div></div><div className="client-timeline">{scenario.activity.slice(0, 5).map((item, index) => <div className="done" key={`${item.label}-${index}`}><CheckCircle size={19} weight="fill" /><span><strong>{item.label}</strong><small>{item.actor}، {item.at}</small></span></div>)}</div></div><div className="panel client-files"><div className="panel-heading"><div><h2>المستندات</h2><p>تظهر تلقائياً عند بلوغ مرحلتها.</p></div></div>{step >= 2 && <button><List size={22} /><span><strong>البريف</strong><small>{step >= 3 ? "معتمد" : "بانتظار المراجعة"}</small></span><CheckCircle size={18} weight="fill" /></button>}{step >= 4 && <button><FileText size={22} /><span><strong>عرض السعر</strong><small>{step >= 5 ? "معتمد" : "بانتظار قرارك"}</small></span>{step >= 5 && <CheckCircle size={18} weight="fill" />}</button>}{step >= 6 && <button><Handshake size={22} /><span><strong>العقد</strong><small>موقع إلكترونياً</small></span><CheckCircle size={18} weight="fill" /></button>}</div></section>
  </div>;
}

function CollaboratorPortal({ onToast, scenario, onAdvance }) {
  const [orders, setOrders] = usePersistentState("u89-work-orders", initialWorkOrders);
  const [claims] = usePersistentState("u89-collaborator-claims", collaboratorBills);
  const [activePerson, setActivePerson] = useState(scenario.collaborator.name);
  const [tab, setTab] = useState("active");
  const visible = orders.filter((item) => item.dispatched && item.assignees.includes(activePerson));
  const activeTasks = visible.filter((item) => !["completed", "cancelled", "client_revision", "owner_production"].includes(item.status));
  const completedTasks = visible.filter((item) => item.status === "completed");
  const personClaims = claims.filter((item) => item.collaborator === activePerson);
  const unpaidClaims = personClaims.filter((item) => item.status !== "مدفوعة");
  const unpaidByCurrency = unpaidClaims.reduce((totals, item) => ({ ...totals, [item.currency]: (totals[item.currency] || 0) + Number(String(item.amount).replaceAll(",", "")) }), {});
  const [selectedId, setSelectedId] = useState(activeTasks[0]?.id || visible[0]?.id || "");
  const [message, setMessage] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const selectedSource = visible.find((item) => item.id === selectedId) || activeTasks[0] || visible[0];
  const selected = selectedSource ? { creativeCore: "", creativeRationale: "", delegationScope: "", compensation: {}, ...selectedSource } : null;
  const updateOrder = (id, patch) => setOrders((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  useEffect(() => {
    if (!visible.some((item) => item.id === selectedId)) setSelectedId(activeTasks[0]?.id || visible[0]?.id || "");
  }, [activePerson, activeTasks, selectedId, visible]);
  useEffect(() => {
    if (scenario.step !== 7 || scenario.creative?.executionMode === "owner_led" || orders.some((item) => item.id === "WO-SCENARIO")) return;
    const scenarioOrder = {
      id: "WO-SCENARIO",
      project: scenario.project.name,
      title: scenario.collaborator.task,
      description: scenario.quote.scope,
      recommendations: "ابدئي من البريف المعتمد، وارفعي البروفة هنا لي قبل أي مشاركة مع العميل.",
      priority: "عالية",
      due: scenario.collaborator.due,
      status: scenario.proof.revisionNote ? "changes_requested" : "in_progress",
      dispatched: true,
      clientApproval: true,
      assignees: [scenario.collaborator.name],
      compensation: { [scenario.collaborator.name]: { amount: "3200", currency: "SAR", status: "متفق عليه" } },
      files: ["البريف المعتمد.pdf", "حزمة المصادر.zip"],
      messages: [{ id: "scenario-owner-message", author: "عبد الوهاب", body: "هذا طلب العمل الخاص بالبروفة. ارفعي النسخة هنا لأراجعها داخلياً أولاً.", at: "الآن" }],
      proof: null,
    };
    setOrders((items) => items.some((item) => item.id === scenarioOrder.id) ? items : [scenarioOrder, ...items]);
    setSelectedId(scenarioOrder.id);
  }, [orders, scenario, setOrders]);
  const sendMessage = (event) => {
    event.preventDefault();
    if (!selected || !message.trim()) return;
    updateOrder(selected.id, { messages: [...selected.messages, { id: `m-${Date.now()}`, author: activePerson, body: message.trim(), at: "الآن" }] });
    setMessage("");
    onToast("وصلت رسالتك إلى عبد الوهاب داخل طلب العمل");
  };
  const deliver = () => {
    if (!selected) return;
    if (!proofFile) { onToast("اختر ملف البروفة أولاً"); return; }
    updateOrder(selected.id, {
      status: "internal_review",
      files: [...selected.files, proofFile.name],
      proof: { title: proofFile.name, status: "internal_review", note: proofNote || "بروفة جديدة للمراجعة الداخلية" },
      messages: [...selected.messages, { id: `m-${Date.now()}`, author: activePerson, body: proofNote || "رفعت بروفة جديدة لاعتماد عبد الوهاب.", at: "الآن" }],
    });
    setProofFile(null);
    setProofNote("");
    onToast("وصلت البروفة إلى عبد الوهاب فقط، ولم تصل إلى العميل");
  };
  const statusLabel = { dispatched: "جديد لديك", in_progress: "قيد التنفيذ", internal_review: "لدى عبد الوهاب", changes_requested: "تعديل أرسله عبد الوهاب", client_review: "اعتمد داخلياً", completed: "مكتمل" };
  const sampleHistory = [{ id: "H-021", title: "تجهيز ملفات حملة رقمية", project: "مشروع تجريبي سابق", completed: "28 يوليو 2026" }, { id: "H-018", title: "معالجة صور المنتجات", project: "مشروع تجريبي سابق", completed: "11 يوليو 2026" }];
  return <div className="dashboard-content page-stack collaborator-page collaborator-dashboard-page"><section className="collaborator-head"><div><small>لوحة المتعاون</small><h1>مرحباً {activePerson.split(" ")[0]}</h1><p>هنا أعمالك الحالية، سجلك السابق، فواتير الخدمة، والمبالغ التي لم تُحوّل لك.</p></div><label>معاينة حساب<select value={activePerson} onChange={(event) => setActivePerson(event.target.value)}>{team.map((person) => <option key={person.name}>{person.name}</option>)}</select></label></section>
    <section className="collaborator-dashboard-kpis"><article><small>أعمال نشطة</small><strong>{activeTasks.length}</strong><span>مرسلة إليك فقط</span></article><article><small>أعمال سابقة</small><strong>{completedTasks.length + sampleHistory.length}</strong><span>السجل المكتمل</span></article><article className="money"><small>غير محول لك</small><strong>{Object.keys(unpaidByCurrency).length || 0}</strong><span>{Object.entries(unpaidByCurrency).map(([currency, value]) => `${value.toLocaleString("en-US")} ${currency}`).join(" · ") || "لا توجد مستحقات"}</span></article><article><small>فواتير الخدمة</small><strong>{personClaims.length}</strong><span>{unpaidClaims.length} تحت الإجراء</span></article></section>
    <nav className="collaborator-dashboard-tabs"><button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>أعمالي الحالية</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>الأعمال السابقة</button><button className={tab === "invoices" ? "active" : ""} onClick={() => setTab("invoices")}>فواتيري ومستحقاتي</button></nav>

    {tab === "active" && <section className="panel collaborator-task-dashboard"><div className="panel-heading"><div><h2>الأعمال المرسلة إليك</h2><p>لن يظهر هنا أي طلب قبل أن يختارك عبد الوهاب ويثبت أجرك ويضغط الإرسال.</p></div><span>{activeTasks.length}</span></div>{activeTasks.length ? <div className="collaborator-task-list">{activeTasks.map((item) => { const term = item.compensation?.[activePerson]; return <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><span><small>{item.id} · {item.project}</small><strong>{item.title}</strong><em>{item.description}</em></span><span><b>{term?.amount ? `${Number(term.amount).toLocaleString("en-US")} ${term.currency}` : item.due || "بلا موعد"}</b><i className="status-badge">{statusLabel[item.status] || item.status}</i></span></button>; })}</div> : <div className="empty-state compact"><CheckCircle size={30} /><h2>لا توجد أعمال نشطة</h2><p>ستظهر هنا فور إرسالها من عبد الوهاب.</p></div>}</section>}

    {tab === "history" && <section className="panel collaborator-history"><div className="panel-heading"><div><h2>الأعمال السابقة</h2><p>مرجع سريع لما أنجزته وتاريخ إغلاقه.</p></div></div>{[...completedTasks.map((item) => ({ id: item.id, title: item.title, project: item.project, completed: item.due || "مكتمل" })), ...sampleHistory].map((item) => <article key={item.id}><CheckCircle size={20} weight="fill" /><span><strong>{item.title}</strong><small>{item.project}</small></span><time>{item.completed}</time></article>)}</section>}

    {tab === "invoices" && <section className="panel collaborator-own-invoices"><div className="panel-heading"><div><h2>فواتير تقديم الخدمة</h2><p>كل مبلغ بعملته الأصلية، مع حالة الاستحقاق والتحويل.</p></div></div>{personClaims.length ? personClaims.map((claim) => <article key={claim.id}><span className="invoice-icon"><Coins size={20} /></span><span><strong>{claim.item}</strong><small>{claim.id} · {claim.project}</small></span><strong>{claim.amount} {claim.currency}</strong><span className={`payment-status ${claim.status === "مدفوعة" ? "paid" : ""}`}>{claim.status}</span><button className="text-link" onClick={() => onToast(`تم فتح فاتورة الخدمة ${claim.id}`)}>فتح الفاتورة <ArrowLeft size={15} /></button></article>) : <div className="empty-state compact"><Receipt size={30} /><h2>لا توجد فواتير بعد</h2><p>تُنشأ فاتورة الخدمة تلقائياً بعد اعتماد عبد الوهاب للمنجز.</p></div>}</section>}

    {tab === "active" && selected && <section className="collaborator-work-layout collaborator-selected-room"><main><section className="panel collaborator-brief"><span>{selected.id}، {selected.project}</span><div className="collaborator-direction-owner"><small>صاحب الطلب والمراجع النهائي</small><strong>عبد الوهاب بن سليمان السويد</strong></div><h2>{selected.title}</h2><div className="delegated-scope"><small>المطلوب منك</small><p>{selected.delegationScope || selected.description}</p></div>{selected.recommendations && <blockquote><strong>فكرة أو توجيه من عبد الوهاب</strong>{selected.recommendations}</blockquote>}<div className="work-order-meta"><span><small>الأولوية</small><strong>{selected.priority}</strong></span><span><small>الموعد</small><strong>{selected.due || "غير محدد"}</strong></span><span><small>أجرك المتفق عليه</small><strong>{selected.compensation?.[activePerson]?.amount ? `${Number(selected.compensation[activePerson].amount).toLocaleString("en-US")} ${selected.compensation[activePerson].currency}` : "غير محدد"}</strong></span></div>{selected.status === "dispatched" && <button className="button primary" onClick={() => updateOrder(selected.id, { status: "in_progress" })}>بدء العمل</button>}{selected.status === "internal_review" && <div className="form-note"><Clock size={18} /> البروفة لدى عبد الوهاب بانتظار قراره.</div>}</section><section className="panel collaborator-files"><div className="panel-heading"><div><h2>ملفات العمل</h2><p>الملفات التي أرفقها عبد الوهاب لهذا الطلب.</p></div></div><div className="work-order-file-list">{selected.files.length ? selected.files.map((file) => <button key={file} onClick={() => onToast(`تم فتح ${file}`)}><FileText size={19} /><span><strong>{file}</strong><small>ملف مرتبط بالعمل</small></span><ArrowLeft size={16} /></button>) : <p className="work-order-empty-line">لا توجد ملفات مرفقة.</p>}</div></section>{["dispatched", "in_progress", "changes_requested"].includes(selected.status) && <section className="panel collaborator-proof-upload"><span>تسليم لعبد الوهاب</span><h2>ارفع البروفة أو النتيجة</h2><p>لا تصل للعميل مباشرة. يراجعها عبد الوهاب أولاً.</p><label>ملف<input type="file" onChange={(event) => setProofFile(event.target.files?.[0] || null)} /></label><label>ملاحظة<textarea rows="3" value={proofNote} onChange={(event) => setProofNote(event.target.value)} /></label><button className="button primary" onClick={deliver}><FileArrowUp size={18} /> رفع للمراجعة</button></section>}</main><aside><section className="panel collaborator-thread-panel"><div className="panel-heading"><div><h2>النقاش مع عبد الوهاب</h2><p>خاص بهذا العمل فقط.</p></div></div><div className="work-order-thread">{selected.messages.map((item) => <article className={item.author === activePerson ? "mine" : ""} key={item.id}><header><strong>{item.author}</strong><time>{item.at}</time></header><p>{item.body}</p></article>)}</div><form className="work-order-composer" onSubmit={sendMessage}><textarea rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب سؤالك أو تحديثك" /><div><span /><button className="button primary small" type="submit">إرسال</button></div></form></section><section className="panel collaborator-scope-note"><h2>المبلغ والمسار المالي</h2><p>المبلغ مثبت قبل إرسال العمل. عند اعتماد عبد الوهاب للمنجز يتحول تلقائياً إلى فاتورة خدمة مستحقة.</p></section></aside></section>}
  </div>;
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

function Workspace({ theme, onTheme, onSite, initialRole, siteContent, onPublishSite, scenario, onUpdateScenario, onResetScenario, platformAccess, onLogout }) {
  const [role, setRole] = useState(initialRole);
  const canPreview = initialRole === "owner";
  const [section, setSection] = useState("overview");
  const [targetId, setTargetId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusTask, setFocusTask] = useState(null);
  const [notes, setNotes] = usePersistentState(`u89-capture-notes-${platformAccess?.user?.id || "local"}`, []);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [localReadNotifications, setLocalReadNotifications] = useState([]);
  const liveWorkspace = useWorkspaceData(platformAccess);
  const controlModel = useMemo(() => buildControlModel({ liveData: platformAccess ? liveWorkspace.data || {} : null, seeds: { orders: initialWorkOrders, invoices, claims: collaboratorBills, requests: retainerRequests }, scenario }), [platformAccess, liveWorkspace.data, section, scenario]);
  const navigate = (nextSection, id = null) => { setTargetId(id); setSection(nextSection); };
  useEffect(() => {
    if (!canPreview || role !== "owner") return;
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (event.shiftKey) setCaptureOpen(true); else setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setFocusTask(null); }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [role, canPreview]);
  const localNotifications = [
    { id: "local-proof", subject: "بروفة تحتاج مراجعتك", message: "البروفة الثانية لمشروع سيد مندي جاهزة للقرار.", created_at: new Date().toISOString() },
    { id: "local-quote", subject: "عرض سعر بانتظار الاعتماد", message: "راجع نطاق عرض بخاري أختر قبل الإرسال.", created_at: new Date().toISOString() },
    { id: "local-invoice", subject: "دفعة تحتاج تحققاً", message: "وصل إيصال تحويل ويحتاج مطابقة قبل تسجيل التحصيل.", created_at: new Date().toISOString() },
  ].map((item) => localReadNotifications.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item);
  const personalNotifications = platformAccess ? (liveWorkspace.data?.notifications || []).filter((item) => item.recipient_user_id === platformAccess.user.id) : localNotifications;
  const unreadNotificationCount = personalNotifications.filter((item) => !item.read_at).length;
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
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem("u89-work-orders") || "[]");
      window.localStorage.setItem("u89-work-orders", JSON.stringify(savedOrders.filter((item) => item.id !== "WO-SCENARIO")));
    } catch {
      window.localStorage.removeItem("u89-work-orders");
    }
    onResetScenario();
    setRole("owner");
    setSection("scenario");
    showToast("بدأ سيناريو جديد من طلب الخدمة");
  };
  const readNotification = async (item) => {
    if (!item.read_at) {
      if (platformAccess) {
        try { await workflow.markNotificationRead(item.id); await liveWorkspace.refresh(); } catch (error) { showToast(error.message); }
      } else {
        setLocalReadNotifications((current) => [...new Set([...current, item.id])]);
      }
    }
  };
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [role, section]);
  return (
    <div className={`workspace ${canPreview && role === "owner" ? "studio-workspace" : ""}`}>
      {canPreview && role === "owner" && <Sidebar section={section} setSection={navigate} onSite={onSite} onFocus={() => setFocusTask({ title: "مساحة لعملك الإبداعي", section: "work-orders" })} counts={{ requests: controlModel.requestCount, overview: controlModel.decisions.length }} />}
      <div className={`workspace-main ${role !== "owner" || !canPreview ? "portal-main" : ""}`}>
        <AppTopbar theme={theme} onTheme={onTheme} role={role} setRole={setRole} onCapture={() => setCaptureOpen(true)} onSearch={() => setSearchOpen(true)} canPreview={canPreview} onExit={onSite} connected={Boolean(platformAccess?.session)} onLogout={onLogout} notificationCount={unreadNotificationCount} notificationsOpen={notificationsOpen} onNotifications={() => setNotificationsOpen(true)} />
        {notificationsOpen && <NotificationCenter items={personalNotifications} onClose={() => setNotificationsOpen(false)} onRead={readNotification} />}
        {platformAccess && liveWorkspace.loading && <div className="workspace-loading"><div /><div /><div /><span>جارٍ تحميل مساحة العمل</span></div>}
        {platformAccess && liveWorkspace.error && <div className="workspace-error-state"><ShieldCheck size={32} /><h2>تعذر تحميل مساحة العمل</h2><p>{liveWorkspace.error}</p><button className="button primary" onClick={liveWorkspace.refresh}>إعادة المحاولة</button></div>}
        {(!platformAccess || (!liveWorkspace.loading && !liveWorkspace.error)) && canPreview && role === "owner" && (section === "overview" ? <ControlCenter model={controlModel} onNavigate={navigate} onCapture={() => setCaptureOpen(true)} onFocus={setFocusTask} notes={notes} onToggleNote={(id) => setNotes((items) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item))} onSearch={() => setSearchOpen(true)} /> : <OwnerApp targetId={targetId} section={section} setSection={navigate} setRole={setRole} onProject={setSelectedProject} onCapture={() => setCaptureOpen(true)} onToast={showToast} siteContent={siteContent} onPublishSite={onPublishSite} onSite={onSite} scenario={scenario} onScenarioAdvance={advanceScenario} onScenarioPatch={patchScenario} onScenarioReset={resetScenario} platformAccess={platformAccess} liveData={platformAccess ? liveWorkspace.data : null} onRefreshLiveData={liveWorkspace.refresh} />)}
        {(!platformAccess || (!liveWorkspace.loading && !liveWorkspace.error)) && role === "client" && (platformAccess ? <LiveClientPortal data={liveWorkspace.data || {}} access={platformAccess} refresh={liveWorkspace.refresh} onToast={showToast} /> : <ClientPortal onToast={showToast} scenario={scenario} onAdvance={advanceScenario} onPatch={patchScenario} />)}
        {(!platformAccess || (!liveWorkspace.loading && !liveWorkspace.error)) && role === "collaborator" && (platformAccess ? <LiveCollaboratorPortal data={liveWorkspace.data || {}} access={platformAccess} refresh={liveWorkspace.refresh} onToast={showToast} /> : <CollaboratorPortal onToast={showToast} scenario={scenario} onAdvance={advanceScenario} />)}
      </div>
      {canPreview && role === "owner" && <MobileNav section={section} setSection={navigate} />}
      {canPreview && role === "owner" && captureOpen && <CaptureModal onClose={() => setCaptureOpen(false)} onAdd={(text) => { setNotes((items) => [{ id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString(), done: false }, ...items]); showToast("حُفظت الفكرة في صندوق أفكارك على هذا الجهاز"); }} />}
      {canPreview && role === "owner" && searchOpen && <CommandPalette sections={navItems} orders={controlModel.orders} onNavigate={navigate} onClose={() => setSearchOpen(false)} onCapture={() => setCaptureOpen(true)} />}
      {canPreview && role === "owner" && focusTask && <FocusSession task={focusTask} onClose={() => setFocusTask(null)} onOpen={() => { navigate(focusTask.section || "work-orders", focusTask.targetId); setFocusTask(null); }} />}
      {selectedProject && <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} onToast={showToast} />}
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("site");
  const [platformAccess, setPlatformAccess] = useState(null);
  const [passwordSetup, setPasswordSetup] = useState(authLanding.password);
  const initialTheme = useMemo(() => {
    const saved = window.localStorage.getItem("u89-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const [theme, setTheme] = useState(initialTheme);
  const [siteContent, setSiteContent] = useState(() => {
    // Production must wait for published settings, never a cached demo configuration.
    if (platformConfig.configured) return { ...defaultSiteContent, acceptingRequests: false };
    try {
      const saved = JSON.parse(window.localStorage.getItem("u89-site-content"));
      if (!saved) return defaultSiteContent;
      const merged = { ...defaultSiteContent, ...saved, sectionVisibility: { ...defaultSiteContent.sectionVisibility, ...saved.sectionVisibility } };
      if (saved.email === "W@U89DES.COM") merged.email = defaultSiteContent.email;
      if (!saved.revisionRounds) merged.revisionRounds = defaultSiteContent.revisionRounds;
      if (!Array.isArray(saved.briefTemplates)) merged.briefTemplates = defaultSiteContent.briefTemplates;
      if (Number(saved.catalogVersion || 0) < defaultSiteContent.catalogVersion) {
        const savedServices = Object.fromEntries((saved.services || []).map((service) => [service.id, service]));
        merged.catalogVersion = defaultSiteContent.catalogVersion;
        merged.services = defaultSiteContent.services.map((service) => ({ ...service, active: savedServices[service.id]?.active ?? service.active }));
        merged.briefTemplates = defaultSiteContent.briefTemplates;
        merged.heroTitle = defaultSiteContent.heroTitle;
        merged.heroBody = defaultSiteContent.heroBody;
        merged.heroCta = defaultSiteContent.heroCta;
        merged.servicesTitle = defaultSiteContent.servicesTitle;
        merged.workTitle = defaultSiteContent.workTitle;
        merged.finalTitle = defaultSiteContent.finalTitle;
        merged.portfolioProjects = defaultSiteContent.portfolioProjects;
        merged.workVisibility = defaultSiteContent.workVisibility;
      }
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
  const [accessOpen, setAccessOpen] = useState(() => window.location.hash === "#studio" || /^\/(workspace|portal)(\/|$)/.test(window.location.pathname));
  const roleForWorkspace = (role) => ["owner", "manager", "accountant"].includes(role) ? "owner" : role;
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("u89-theme", next);
  };
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);
  useEffect(() => {
    const syncPrivateEntry = () => {
      if (window.location.hash === "#studio" && view === "site") setAccessOpen(true);
    };
    syncPrivateEntry();
    window.addEventListener("hashchange", syncPrivateEntry);
    return () => window.removeEventListener("hashchange", syncPrivateEntry);
  }, [view]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    window.localStorage.setItem("u89-demo-scenario", JSON.stringify(scenario));
  }, [scenario]);
  useEffect(() => {
    if (!platformConfig.configured) return undefined;
    let active = true;
    const applyAccess = async (session, event) => {
      if (event === "PASSWORD_RECOVERY" && active) setPasswordSetup(true);
      if (!session) {
        if (active) { setPlatformAccess(null); setPasswordSetup(false); setView("site"); if (window.location.hash === "#studio" || /^\/(workspace|portal)(\/|$)/.test(window.location.pathname) || authLanding.error || authLanding.password) setAccessOpen(true); }
        return;
      }
      try {
        const access = await getCurrentAccess();
        if (!active) return;
        if (!access) { setPlatformAccess(null); setView("site"); setAccessOpen(true); return; }
        if (["owner", "manager", "accountant"].includes(access.role)) {
          const privateSettings = await loadStudioSettings(access.workspaceId);
          if (privateSettings && active) setSiteContent((current) => ({ ...current, ...privateSettings }));
        }
        setPlatformAccess(access);
        if (needsFirstPassword(access.user)) setPasswordSetup(true);
        setWorkspaceRole(roleForWorkspace(access.role));
        setAccessOpen(false);
        setView("workspace");
      } catch {
        if (active) { setPlatformAccess(null); setView("site"); setAccessOpen(true); }
      }
    };
    getCurrentAccess().then((access) => {
      if (!active || !access) return;
      setPlatformAccess(access);
      if (needsFirstPassword(access.user)) setPasswordSetup(true);
      setWorkspaceRole(roleForWorkspace(access.role));
      if (window.location.hash === "#studio" || /^\/(workspace|portal)(\/|$)/.test(window.location.pathname)) {
        setAccessOpen(false);
        setView("workspace");
      }
      if (["owner", "manager", "accountant"].includes(access.role)) {
        loadStudioSettings(access.workspaceId).then((privateSettings) => {
          if (privateSettings && active) setSiteContent((current) => ({ ...current, ...privateSettings }));
        }).catch(() => {});
      }
    }).catch(() => {});
    const unsubscribe = subscribeToAuth(applyAccess);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!platformConfig.configured) return;
    loadPublishedSiteContent().then((published) => {
      if (!published) return;
      const upgradedPublished = Number(published.catalogVersion || 0) < defaultSiteContent.catalogVersion
        ? {
            ...published,
            catalogVersion: defaultSiteContent.catalogVersion,
            heroTitle: defaultSiteContent.heroTitle,
            heroBody: defaultSiteContent.heroBody,
            heroCta: defaultSiteContent.heroCta,
            servicesTitle: defaultSiteContent.servicesTitle,
            workTitle: defaultSiteContent.workTitle,
            finalTitle: defaultSiteContent.finalTitle,
            services: defaultSiteContent.services,
            portfolioProjects: published.portfolioProjects || defaultSiteContent.portfolioProjects,
            workVisibility: published.workVisibility || defaultSiteContent.workVisibility,
          }
        : published;
      setSiteContent((current) => ({
        ...current,
        ...upgradedPublished,
        sectionVisibility: { ...current.sectionVisibility, ...upgradedPublished.sectionVisibility },
      }));
    }).catch(() => {});
  }, []);
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
  const authenticate = async ({ email, password, method }) => {
    if (method === "reset") {
      await sendPasswordReset(email);
      return { reset: true };
    }
    if (method === "magic") {
      await sendMagicLink(email);
      return { magic: true };
    }
    await signInWithPassword(email, password);
    const access = await getCurrentAccess();
    let effectiveSettings = siteContent;
    if (["owner", "manager", "accountant"].includes(access.role)) {
      const privateSettings = await loadStudioSettings(access.workspaceId);
      if (privateSettings) {
        effectiveSettings = { ...siteContent, ...privateSettings };
        setSiteContent(effectiveSettings);
      }
    }
    if (access.role === "owner") {
      await saveStudioSettings(access.workspaceId, effectiveSettings);
    }
    setPlatformAccess(access);
    enterWorkspace(roleForWorkspace(access.role));
    return { access };
  };
  const logout = async () => {
    await signOutPlatform();
    setPlatformAccess(null);
    setWorkspaceRole("owner");
    setView("site");
  };
  const openRequest = () => {
    setRequestOpen(true);
  };
  const publishSite = async (nextContent) => {
    if (platformConfig.configured && !platformAccess?.workspaceId) throw new Error("انتهت جلسة الدخول. سجّل الدخول قبل نشر التغييرات.");
    if (platformAccess?.workspaceId) {
      await Promise.all([
        publishSiteContent(platformAccess.workspaceId, nextContent),
        saveStudioSettings(platformAccess.workspaceId, nextContent),
      ]);
    }
    setSiteContent(nextContent);
    window.localStorage.setItem("u89-site-content", JSON.stringify(nextContent));
  };
  const submitRequest = async (data) => {
    const service = siteContent.services.find((item) => item.id === data.serviceId);
    const payload = { ...data, serviceName: service?.title || "خدمة إبداعية" };
    if (platformConfig.configured) await submitPublicServiceRequest(payload);
    setScenario(scenarioFromRequest(payload, siteContent));
  };

  return (
    <>
      {view === "site" || (platformConfig.configured && !platformAccess) ? (
        <MarketingSite theme={theme} onTheme={toggleTheme} onRequest={openRequest} content={siteContent} />
      ) : (
        <Workspace theme={theme} onTheme={toggleTheme} onSite={() => setView("site")} initialRole={workspaceRole} siteContent={siteContent} onPublishSite={publishSite} scenario={scenario} onUpdateScenario={setScenario} onResetScenario={() => setScenario({ ...defaultScenario, activity: [...defaultScenario.activity] })} platformAccess={platformAccess} onLogout={logout} />
      )}
      {requestOpen && <QuickContactModal onClose={() => setRequestOpen(false)} />}
      {accessOpen && !(passwordSetup && platformAccess) && <AccessModal onClose={() => setAccessOpen(false)} onEnter={enterWorkspace} connected={platformConfig.configured} onAuthenticate={authenticate} />}
      {passwordSetup && platformAccess && <PasswordSetupModal user={platformAccess.user} onLogout={logout} onComplete={(user) => { setPlatformAccess((current) => current ? { ...current, user } : current); setPasswordSetup(false); setAccessOpen(false); window.history.replaceState(null, "", `${window.location.pathname}#studio`); setView("workspace"); }} />}
    </>
  );
}

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
  FolderOpen,
  Handshake,
  House,
  Invoice,
  List,
  MagnifyingGlass,
  Moon,
  PaperPlaneTilt,
  Plus,
  Receipt,
  ShieldCheck,
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
    stage: 4,
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
    stage: 3,
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
    stage: 3,
    next: "مراجعة دليل النبرة",
    due: "الخميس، 1:00 م",
    value: "22,000 ر.س",
    image: "/work-mamola.jpg",
    accent: "sand",
  },
];

const stages = ["الطلب", "العرض", "العقد", "التنفيذ", "البروفات", "التسليم", "المتابعة"];

const navItems = [
  { id: "overview", label: "نظرة اليوم", icon: SquaresFour },
  { id: "projects", label: "المشاريع", icon: FolderOpen },
  { id: "requests", label: "طلبات العملاء", icon: Tray },
  { id: "clients", label: "العملاء", icon: UsersThree },
  { id: "finance", label: "الحسابات", icon: Wallet },
  { id: "team", label: "فريق العمل", icon: UserFocus },
];

const serviceList = [
  ["شخصية العلامة", "نحدد الشخصية التي يتذكرها الناس ويتفاعلون معها."],
  ["تسمية العلامة", "نصنع اسماً مناسباً للتموضع وقابلاً للنمو."],
  ["صناعة العلامة", "نحوّل الفكرة إلى نظام بصري وتجربة متكاملة."],
  ["تطوير العلامة", "نراجع الموجود ونبني مساراً أوضح للمستقبل."],
  ["الخطوط الطباعية", "نصمم صوتاً بصرياً خاصاً يثبت حضور العلامة."],
  ["الاستشارات الإبداعية", "نربط التصميم بالمحتوى والحملات والتجربة."],
];

const retainerRequests = [
  { id: 1, title: "حملة افتتاح فرع العليا", client: "قصر التوابل", assignee: "ريم", due: "7 أغسطس", status: "جديد" },
  { id: 2, title: "منشورات العودة للمدارس", client: "أصناف", assignee: "مازن", due: "9 أغسطس", status: "يعمل عليه" },
  { id: 3, title: "تحديث قائمة المنتجات", client: "مامولا", assignee: "غير مسند", due: "11 أغسطس", status: "بانتظار الإسناد" },
  { id: 4, title: "إعلان منتج موسمي", client: "قصر التوابل", assignee: "ريم", due: "14 أغسطس", status: "مراجعة" },
];

const invoices = [
  { id: "INV-2408", client: "شركة الذائقة", project: "سيد مندي", amount: "9,250", due: "8 أغسطس", status: "مستحقة" },
  { id: "INV-2394", client: "مجموعة أختر", project: "بخاري أختر", amount: "7,100", due: "12 أغسطس", status: "مجدولة" },
  { id: "INV-2378", client: "مخابز مامولا", project: "عقد أغسطس", amount: "6,500", due: "تم التحصيل", status: "مدفوعة" },
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

function ServiceRequestModal({ onClose, onSubmit }) {
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    setSent(true);
    onSubmit();
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
            <label>الاسم<input required placeholder="اسمك الكامل" /></label>
            <label>اسم المنشأة<input required placeholder="اسم العلامة أو المنشأة" /></label>
          </div>
          <label>الخدمة المطلوبة
            <select defaultValue="brand-making">
              <option value="brand-making">صناعة علامة جديدة</option>
              <option value="brand-development">تطوير علامة قائمة</option>
              <option value="retainer">عقد تسويقي مستمر</option>
              <option value="consulting">استشارة إبداعية</option>
            </select>
          </label>
          <label>ما الذي تريد تحقيقه؟
            <textarea required rows="4" placeholder="اكتب النتيجة التي تتمنى الوصول إليها، وليس قائمة التصاميم فقط." />
          </label>
          <div className="form-note"><ShieldCheck size={19} /> تحفظ معلوماتك داخل مساحة خاصة بالمشروع.</div>
          <button className="button primary full" type="submit">إرسال الطلب <ArrowLeft size={18} /></button>
        </form>
      )}
    </Modal>
  );
}

function SiteHeader({ theme, onTheme, onOpenApp, onRequest }) {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="التنقل الرئيسي">
        <a href="#services">الخدمات</a>
        <a href="#system">طريقة العمل</a>
        <a href="#work">الأعمال</a>
      </nav>
      <div className="header-actions">
        <ThemeButton theme={theme} onToggle={onTheme} />
        <button className="button ghost header-login" onClick={onOpenApp}>دخول مساحة العمل</button>
        <button className="button primary" onClick={onRequest}>ابدأ مشروعك</button>
      </div>
    </header>
  );
}

function LivePreview({ onOpenApp }) {
  return (
    <div className="live-preview" aria-label="معاينة حية لمساحة العمل">
      <div className="preview-top">
        <div><span className="status-dot" /> مهمتك الآن</div>
        <span>الثلاثاء</span>
      </div>
      <div className="preview-focus">
        <span>سيد مندي</span>
        <h3>راجع البروفة الثانية</h3>
        <p>وصلت ملاحظات العميل مجمعة في نقطة واحدة.</p>
        <button onClick={onOpenApp}>فتح البروفة <ArrowLeft size={17} /></button>
      </div>
      <div className="preview-line">
        <div><CheckCircle size={18} weight="fill" /> عرض السعر معتمد</div>
        <time>09:40</time>
      </div>
      <div className="preview-line">
        <div><Clock size={18} /> دفعة عقد بخاري أختر</div>
        <time>غداً</time>
      </div>
      <div className="preview-footer"><Command size={17} /> التقط أي فكرة دون مغادرة ما تعمل عليه</div>
    </div>
  );
}

function LandingPage({ theme, onTheme, onOpenApp, onRequest }) {
  return (
    <div className="site-page">
      <SiteHeader theme={theme} onTheme={onTheme} onOpenApp={onOpenApp} onRequest={onRequest} />
      <main>
        <section className="hero-section">
          <div className="hero-copy rise-in">
            <span className="hero-kicker">U89 Studio OS</span>
            <h1>أصنع العلامة.<br /><em>والنظام يمسك المشروع.</em></h1>
            <p>من الطلب حتى التحصيل والمتابعة، كل خطوة في مكان واحد واضح للعميل والفريق.</p>
            <div className="hero-actions">
              <button className="button primary large" onClick={onRequest}>ابدأ مشروعك <ArrowLeft size={20} /></button>
              <button className="text-link" onClick={onOpenApp}>شاهد مساحة العمل <ArrowUpLeft size={18} /></button>
            </div>
          </div>
          <div className="hero-visual rise-in delay-1">
            <div className="lime-orbit" />
            <LivePreview onOpenApp={onOpenApp} />
          </div>
        </section>

        <section className="statement-section">
          <p>خبرة تتجاوز 15 سنة في تحويل السؤال الإبداعي إلى علامة قابلة للحياة.</p>
          <div className="statement-rule" />
          <p>هذه المرة، تتحول التجربة نفسها إلى طريقة عمل تحمي التركيز.</p>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading">
            <h2>العلامة ليست ملفاً.<br />إنها منظومة قرارات.</h2>
            <p>الخدمات مأخوذة من ممارسة U89 الفعلية، وتدخل كلها في مسار واحد يمكن متابعته.</p>
          </div>
          <div className="services-mosaic">
            {serviceList.map(([title, text], index) => (
              <article className={`service-item item-${index + 1}`} key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="system-section" id="system">
          <div className="system-copy">
            <h2>طريق واضح من أول رسالة إلى آخر دفعة.</h2>
            <p>العميل يرى ما يعنيه، والفريق يرى ما عليه، وأنت ترى القرار التالي فقط.</p>
            <button className="button inverted" onClick={onOpenApp}>افتح النموذج التفاعلي <ArrowLeft size={18} /></button>
          </div>
          <div className="system-path">
            {stages.map((stage, index) => (
              <div className="path-step" key={stage}>
                <span>{index + 1}</span>
                <strong>{stage}</strong>
                <small>{["ملخص ذكي", "نطاق وتسعير", "توقيع ودفعة", "مهام ومسؤول", "ملاحظات مجمعة", "ملفات وفاتورة", "رضا وفرصة جديدة"][index]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="work-section" id="work">
          <div className="work-intro">
            <h2>عمل حقيقي، داخل نظام حقيقي.</h2>
            <p>تتحول هذه المشاريع من صور جميلة إلى ملفات حية بعقود وبروفات ومدفوعات وقرارات موثقة.</p>
          </div>
          <div className="work-grid">
            <figure className="work-main">
              <img src="/work-mandi.jpg" alt="تطبيقات علامة سيد مندي" />
              <figcaption><span>سيد مندي</span><small>صناعة علامة وتغليف</small></figcaption>
            </figure>
            <figure>
              <img src="/work-bukhary.jpg" alt="تطبيقات علامة بخاري أختر" />
              <figcaption><span>بخاري أختر</span><small>تطوير علامة</small></figcaption>
            </figure>
            <figure>
              <img src="/work-mamola.jpg" alt="تطبيقات علامة مامولا" />
              <figcaption><span>مامولا</span><small>هوية ومحتوى</small></figcaption>
            </figure>
          </div>
        </section>

        <section className="focus-section">
          <div className="focus-quote">
            <Sparkle size={34} weight="fill" />
            <h2>النظام لا يطلب منك أن تتذكر.</h2>
            <p>يجمع المتابعة، يذكّر العميل، ويرتب الأعمال حسب أثرها. يبقى ذهنك للفكرة التي تستحقه.</p>
          </div>
          <div className="focus-features">
            <div><Target size={24} /><strong>مهمة واحدة الآن</strong><span>واجهة يومية تقلل تبديل السياق.</span></div>
            <div><Bell size={24} /><strong>متابعة تلقائية</strong><span>تذكير بالموافقات والدفعات بلا مطاردة.</span></div>
            <div><Tray size={24} /><strong>صندوق طلبات موحد</strong><span>كل طلب يدخل بصيغة قابلة للتنفيذ.</span></div>
            <div><Coins size={24} /><strong>صورة مالية واحدة</strong><span>مستحقات العملاء والمتعاونين في نفس المشروع.</span></div>
          </div>
        </section>

        <section className="final-cta">
          <div>
            <span>جاهز لترتيب المشروع من بدايته؟</span>
            <h2>دع العمل الإبداعي يأخذ المساحة الأكبر.</h2>
          </div>
          <button className="button primary large" onClick={onRequest}>ابدأ مشروعك <ArrowLeft size={20} /></button>
        </section>
      </main>
      <footer className="site-footer">
        <Logo />
        <div><a href="mailto:W@U89DES.COM">W@U89DES.COM</a><a href="tel:+966555877733">+966 555 8 777 33</a></div>
        <p>صناعة العلامات وإدارة رحلتها.</p>
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

function ProjectsView({ onProject }) {
  const [query, setQuery] = useState("");
  const filtered = initialProjects.filter((project) => `${project.name} ${project.client}`.includes(query));
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>المشاريع</h1><p>لكل مشروع قرار تالٍ ومالك واضح وملف مالي متصل.</p></div><button className="button primary"><Plus size={18} /> مشروع جديد</button></div>
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

function RequestsView({ onToast }) {
  const [requests, setRequests] = useState(retainerRequests);
  const assign = (id, assignee) => {
    setRequests((items) => items.map((item) => item.id === id ? { ...item, assignee, status: "تم الإسناد" } : item));
    onToast(`تم إسناد الطلب إلى ${assignee}`);
  };
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>طلبات العملاء</h1><p>طلبات العقود المستمرة تتحول مباشرة إلى مهام قابلة للإسناد.</p></div><button className="button primary"><Plus size={18} /> تسجيل طلب</button></div>
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

function FinanceView({ onToast }) {
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>الحسابات</h1><p>ما لك، وما عليك، وربحية كل مشروع دون ملف منفصل.</p></div><button className="button primary"><Plus size={18} /> فاتورة جديدة</button></div>
      <section className="finance-hero">
        <div className="finance-balance"><span>الرصيد المتوقع بعد الالتزامات</span><strong>36,420 <small>ر.س</small></strong><p>حتى نهاية أغسطس، بناء على العقود والفواتير المسجلة.</p></div>
        <div className="finance-pairs"><div><Receipt size={22} /><span>مستحقات العملاء<strong>16,350 ر.س</strong></span></div><div><UsersThree size={22} /><span>دفعات المتعاونين<strong>4,800 ر.س</strong></span></div><div><ChartLineUp size={22} /><span>هامش المشاريع<strong>31%</strong></span></div></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h2>الفواتير الأخيرة</h2><p>المتابعة التلقائية مفعلة للفواتير المستحقة.</p></div><button className="filter-button">تصدير التقرير</button></div>
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <article key={invoice.id}>
              <span className="invoice-icon"><Invoice size={20} /></span>
              <span><strong>{invoice.id}</strong><small>{invoice.project}</small></span>
              <span><small>العميل</small><strong>{invoice.client}</strong></span>
              <span><small>الاستحقاق</small><strong>{invoice.due}</strong></span>
              <strong>{invoice.amount} ر.س</strong>
              <span className={`payment-status ${invoice.status === "مدفوعة" ? "paid" : ""}`}>{invoice.status}</span>
              {invoice.status !== "مدفوعة" && <button className="icon-button" aria-label="إرسال تذكير" onClick={() => onToast(`تم إرسال تذكير فاتورة ${invoice.id}`)}><PaperPlaneTilt size={18} /></button>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamView() {
  return (
    <div className="dashboard-content page-stack">
      <div className="page-title"><div><h1>فريق العمل</h1><p>توزيع عادل يظهر المتاح قبل أن يتحول الضغط إلى تأخير.</p></div><button className="button primary"><Plus size={18} /> دعوة متعاون</button></div>
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
          return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={20} weight={section === item.id ? "fill" : "regular"} /><span>{item.label}</span>{item.id === "requests" && <b>2</b>}</button>;
        })}
      </nav>
      <div className="sidebar-card"><Sparkle size={21} weight="fill" /><strong>وضع التركيز</strong><p>يعرض لك قراراً واحداً فقط، ويؤجل البقية حتى تنتهي.</p><button>ابدأ 25 دقيقة</button></div>
      <button className="back-to-site" onClick={onSite}><House size={19} /> الموقع التعريفي</button>
      <div className="profile-mini"><span>ع</span><div><strong>عبدالوهاب السويد</strong><small>مالك الاستوديو</small></div><CaretDown size={15} /></div>
    </aside>
  );
}

function AppTopbar({ theme, onTheme, role, setRole, onCapture }) {
  return (
    <header className="app-topbar">
      <div className="mobile-brand"><Logo compact /></div>
      <div className="role-switch" aria-label="تبديل واجهة المستخدم">
        <button className={role === "owner" ? "active" : ""} onClick={() => setRole("owner")}>الإدارة</button>
        <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>واجهة العميل</button>
        <button className={role === "collaborator" ? "active" : ""} onClick={() => setRole("collaborator")}>واجهة المتعاون</button>
      </div>
      <div className="topbar-actions">
        <button className="quick-capture" onClick={onCapture}><Plus size={18} /> التقاط سريع <kbd>⌘ K</kbd></button>
        <ThemeButton theme={theme} onToggle={onTheme} />
        <IconButton label="الإشعارات"><Bell size={19} /><span className="notification-count">3</span></IconButton>
      </div>
    </header>
  );
}

function OwnerApp({ section, setSection, onProject, onCapture, onToast }) {
  if (section === "projects") return <ProjectsView onProject={onProject} />;
  if (section === "requests") return <RequestsView onToast={onToast} />;
  if (section === "clients") return <ClientsView />;
  if (section === "finance") return <FinanceView onToast={onToast} />;
  if (section === "team") return <TeamView />;
  return <OwnerOverview onProject={onProject} onCapture={onCapture} setSection={setSection} />;
}

function ClientPortal({ onToast }) {
  const [proofState, setProofState] = useState("waiting");
  const [requestOpen, setRequestOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const approve = () => {
    setProofState("approved");
    onToast("تم اعتماد البروفة وتحديث مسار المشروع");
  };
  return (
    <div className="portal-page dashboard-content">
      <section className="portal-welcome"><div><small>صباح الخير، خالد</small><h1>كل شيء يمشي كما اتفقنا.</h1><p>مشروع سيد مندي الآن عند قرار واحد منك.</p></div><button className="button primary" onClick={() => setRequestOpen(true)}><Plus size={18} /> طلب جديد</button></section>
      <section className="client-project-hero">
        <div className="client-project-copy"><span className="status-badge">{proofState === "approved" ? "تم الاعتماد" : "بانتظار قرارك"}</span><h2>سيد مندي</h2><p>صناعة العلامة والتغليف</p><StageTrack current={proofState === "approved" ? 5 : 4} /></div>
        <div className="client-decision">
          {proofState === "approved" ? <><CheckCircle size={40} weight="fill" /><h3>شكراً، تم الاعتماد.</h3><p>انتقل المشروع إلى تجهيز الملفات النهائية والفاتورة.</p></> : <><span>يحتاج قرارك</span><h3>البروفة الثانية جاهزة</h3><p>راجع تطبيقات العبوة والواجهة، ثم اعتمد أو اطلب تعديلاً واحداً واضحاً.</p><button className="button inverted" onClick={() => setProofOpen(true)}>مراجعة البروفة <ArrowLeft size={18} /></button></>}
        </div>
      </section>
      <section className="client-columns">
        <div className="panel timeline-panel"><div className="panel-heading"><div><h2>آخر ما حدث</h2><p>تحديثات مفهومة بلا مصطلحات داخلية.</p></div></div><div className="client-timeline"><div className="done"><CheckCircle size={19} weight="fill" /><span><strong>رفع البروفة الثانية</strong><small>اليوم، 9:26 ص</small></span></div><div className="done"><CheckCircle size={19} weight="fill" /><span><strong>تجميع ملاحظات البروفة الأولى</strong><small>3 أغسطس</small></span></div><div><Clock size={19} /><span><strong>الفاتورة النهائية</strong><small>بعد اعتماد البروفة</small></span></div></div></div>
        <div className="panel client-files"><div className="panel-heading"><div><h2>الملفات والفواتير</h2><p>كل نسخة محفوظة، ولا روابط ضائعة.</p></div></div><button><FileText size={22} /><span><strong>ملخص المشروع.pdf</strong><small>معتمد عند بدء المشروع</small></span><ArrowLeft size={17} /></button><button><Invoice size={22} /><span><strong>فاتورة الدفعة الأولى</strong><small>مدفوعة، 9,250 ر.س</small></span><CheckCircle size={18} weight="fill" /></button></div>
      </section>
      {proofOpen && <Modal title="البروفة الثانية" onClose={() => setProofOpen(false)} size="wide"><div className="proof-modal"><img src="/work-mandi.jpg" alt="البروفة الثانية لمشروع سيد مندي" /><div className="proof-actions"><div><h3>هوية العبوة وتطبيقات الواجهة</h3><p>راجع اللون، وضوح الاسم، وطريقة حضور العلامة عند الاستخدام.</p></div><textarea rows="3" placeholder="اكتب طلب التعديل هنا عند الحاجة" /><div><button className="button ghost" onClick={() => { setProofOpen(false); onToast("تم إرسال طلب التعديل إلى عبدالوهاب"); }}>طلب تعديل</button><button className="button primary" onClick={() => { approve(); setProofOpen(false); }}>اعتماد البروفة <Check size={18} /></button></div></div></div></Modal>}
      {requestOpen && <Modal title="طلب جديد ضمن العقد" onClose={() => setRequestOpen(false)}><form className="request-form" onSubmit={(event) => { event.preventDefault(); setRequestOpen(false); onToast("وصل الطلب الجديد إلى طابور التنفيذ"); }}><label>عنوان الطلب<input required placeholder="مثال: حملة افتتاح الفرع" /></label><label>النتيجة المطلوبة<textarea rows="4" required placeholder="ما الذي يجب أن ينجح بعد تنفيذ هذا الطلب؟" /></label><div className="field-row"><label>الأولوية<select><option>عادية</option><option>مرتفعة</option></select></label><label>الموعد المطلوب<input type="date" required /></label></div><button className="button primary full" type="submit">إرسال الطلب <ArrowLeft size={18} /></button></form></Modal>}
    </div>
  );
}

function CollaboratorPortal({ onToast }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: "تطبيق واجهات سيد مندي", project: "سيد مندي", due: "اليوم، 2:00 م", status: "يعمل عليه" },
    { id: 2, title: "قوالب منشورات العودة", project: "أصناف", due: "غداً، 11:00 ص", status: "جاهز للبدء" },
    { id: 3, title: "موك أب العبوة الموسمية", project: "قصر التوابل", due: "الخميس", status: "بانتظار ملف" },
  ]);
  const start = (id) => setTasks((items) => items.map((item) => item.id === id ? { ...item, status: "يعمل عليه" } : item));
  const deliver = (id) => {
    setTasks((items) => items.map((item) => item.id === id ? { ...item, status: "تم الرفع" } : item));
    onToast("تم رفع الملف وإشعار عبدالوهاب للمراجعة");
  };
  return (
    <div className="dashboard-content page-stack collaborator-page">
      <section className="collaborator-head"><div><small>مساحتك اليوم</small><h1>مرحباً ريم، لديك مهمة واحدة الآن.</h1><p>لن تظهر بقية المهام كعاجلة ما دمتِ تعملين على الحالية.</p></div><div><Clock size={27} /><span>الوقت المحجوز اليوم<strong>4 ساعات و30 دقيقة</strong></span></div></section>
      <section className="collaborator-layout">
        <div className="task-stack">
          {tasks.map((task, index) => (
            <article className={`task-card ${index === 0 ? "active" : ""}`} key={task.id}>
              <div className="task-index">{index + 1}</div>
              <div className="task-copy"><span>{task.project}</span><h2>{task.title}</h2><p><CalendarBlank size={17} /> {task.due}</p></div>
              <span className={`task-status ${task.status === "تم الرفع" ? "done" : ""}`}>{task.status}</span>
              <div className="task-actions">
                {task.status === "جاهز للبدء" && <button className="button ghost" onClick={() => start(task.id)}>بدء المهمة</button>}
                {task.status === "يعمل عليه" && <label className="button primary upload-button">رفع التسليم <FileArrowUp size={18} /><input type="file" onChange={() => deliver(task.id)} /></label>}
                {task.status === "بانتظار ملف" && <button className="button ghost" onClick={() => onToast("تم تذكير صاحب المهمة بالملف الناقص")}>طلب الملف</button>}
                {task.status === "تم الرفع" && <CheckCircle size={28} weight="fill" />}
              </div>
            </article>
          ))}
        </div>
        <aside className="brief-card"><div><FileText size={24} /><span><strong>ملخص المهمة الحالية</strong><small>نسخة واحدة واضحة</small></span></div><h3>المطلوب</h3><p>تطبيق الهوية على واجهة فرع واحد وعبوتين، مع الحفاظ على وضوح الاسم من مسافة بعيدة.</p><h3>ملفات المصدر</h3><button><FolderOpen size={18} /> حزمة الهوية النهائية <ArrowLeft size={16} /></button><h3>التسليم</h3><p>ملف PDF للعرض وملفات AI منظمة. لا حاجة لإرسالها عبر واتساب.</p></aside>
      </section>
    </div>
  );
}

function MobileNav({ section, setSection }) {
  return (
    <nav className="mobile-nav" aria-label="تنقل الجوال">
      {navItems.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={20} weight={section === item.id ? "fill" : "regular"} /><span>{item.label.replace("نظرة اليوم", "اليوم").replace("طلبات العملاء", "الطلبات")}</span></button>; })}
    </nav>
  );
}

function Workspace({ theme, onTheme, onSite }) {
  const [role, setRole] = useState("owner");
  const [section, setSection] = useState("overview");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [role, section]);
  return (
    <div className="workspace">
      {role === "owner" && <Sidebar section={section} setSection={setSection} onSite={onSite} />}
      <div className={`workspace-main ${role !== "owner" ? "portal-main" : ""}`}>
        <AppTopbar theme={theme} onTheme={onTheme} role={role} setRole={setRole} onCapture={() => setCaptureOpen(true)} />
        {role === "owner" && <OwnerApp section={section} setSection={setSection} onProject={setSelectedProject} onCapture={() => setCaptureOpen(true)} onToast={showToast} />}
        {role === "client" && <ClientPortal onToast={showToast} />}
        {role === "collaborator" && <CollaboratorPortal onToast={showToast} />}
      </div>
      {role === "owner" && <MobileNav section={section} setSection={setSection} />}
      {captureOpen && <CaptureModal onClose={() => setCaptureOpen(false)} onAdd={(text) => showToast(`تم حفظ: ${text}`)} />}
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
  const [requestOpen, setRequestOpen] = useState(false);
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

  return (
    <>
      {view === "site" ? (
        <LandingPage theme={theme} onTheme={toggleTheme} onOpenApp={() => setView("workspace")} onRequest={() => setRequestOpen(true)} />
      ) : (
        <Workspace theme={theme} onTheme={toggleTheme} onSite={() => setView("site")} />
      )}
      {requestOpen && <ServiceRequestModal onClose={() => setRequestOpen(false)} onSubmit={() => {}} />}
    </>
  );
}

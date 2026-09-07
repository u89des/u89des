import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  Plus,
  List,
  Moon,
  Sparkle,
  Sun,
  X,
} from "@phosphor-icons/react";
import { portfolioProjects as defaultPortfolioProjects } from "./portfolio-data";
import { shuffleProjects } from "./lib/project-order";

const servicePathDefinitions = [
  {
    id: "build",
    title: "علامة جديدة",
    description: "اسم واضح، استراتيجية عملية، وهوية قابلة للنمو.",
    serviceIds: ["service-3", "service-5"],
  },
  {
    id: "develop",
    title: "تطوير علامة قائمة",
    description: "دراسة العلامة وإعادة تموضعها وتطوير النظام البصري الذي تحتاجه.",
    serviceIds: ["service-4"],
  },
  {
    id: "expand",
    title: "توسيع حضور العلامة",
    description: "تغليف وحملات وتجارب رقمية وتصميم تحريري متصل بالهوية.",
    serviceIds: ["service-packaging", "service-campaign", "service-digital", "service-editorial"],
  },
  {
    id: "partner",
    title: "استشارات وقيادة إبداعية",
    description: "توجيه إبداعي أو شراكة تصميم شهرية وسنوية للعلامات القائمة.",
    serviceIds: ["service-6", "service-retainer"],
  },
];

function CreativeLogo() {
  return (
    <a className="kinetic-brand" href="#top" aria-label="العودة إلى بداية الموقع">
      <img src="/u89-logo.svg" alt="" />
      <span>عبد الوهاب السويد</span>
    </a>
  );
}

function BrandIntro() {
  return (
    <div className="exhibit-intro" aria-hidden="true">
      <div className="exhibit-intro-mark">
        <img src="/u89-logo.svg" alt="" />
      </div>
    </div>
  );
}

function CaseStudy({ project, projects, onClose, onSelectProject }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!project) return undefined;
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('.case-study-close')?.focus();
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll('button, a[href], [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus?.();
    };
  }, [project, onClose]);

  if (!project) return null;

  const projectIndex = projects.findIndex((item) => item.id === project.id);
  const nextProject = projects[(projectIndex + 1) % projects.length];
  const gallery = project.gallery?.length
    ? project.gallery
    : [{ src: project.cover, alt: `هوية ${project.name}`, layout: "wide" }];
  const palette = project.palette || { surface: "#edf0e8", ink: "#151814", accent: "#b7d43b" };

  return (
    <div
      ref={dialogRef}
      className="case-study-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`project-${project.id}`}
      style={{
        "--case-surface": palette.surface,
        "--case-ink": palette.ink,
        "--case-accent": palette.accent,
      }}
    >
      <article className="case-study">
        <header className="case-study-nav">
          <button className="case-study-brand" onClick={() => onSelectProject(project)} aria-label={`بداية مشروع ${project.name}`}>
            <img src="/u89-logo.svg" alt="" />
            <span>{project.name}</span>
          </button>
          <button className="case-study-close" onClick={onClose} aria-label="إغلاق المشروع">
            <span>إغلاق</span>
            <X size={21} />
          </button>
        </header>

        <main>
          <section className="case-study-hero">
            <div className="case-study-title">
              <span>{project.category || "صناعة علامة"}</span>
              <h1 id={`project-${project.id}`}>{project.name}</h1>
              <p dir="ltr">{project.nameEn}</p>
              <small>تصميم وتوجيه إبداعي: عبد الوهاب السويد</small>
            </div>
            <figure className="case-study-logo-stage logo-crop">
              <img src={project.cover} alt={`شعار ${project.name}`} />
            </figure>
          </section>

          <section className="case-study-story">
            <h2>{project.statement || `بناء الحضور البصري لعلامة ${project.name}.`}</h2>
            <p>{project.story || "بناء علامة متماسكة تمتد من الفكرة إلى النظام البصري وتطبيقاته."}</p>
          </section>

          <section className="case-study-gallery" aria-label={`تطبيقات مشروع ${project.name}`}>
            {gallery.map((image, index) => (
              <figure className={`case-study-image case-study-image-${image.layout || "standard"}`} key={`${image.src}-${index}`}>
                <img src={image.src} alt={image.alt || `تطبيق من مشروع ${project.name}`} loading={index === 0 ? "eager" : "lazy"} />
              </figure>
            ))}
          </section>

          <section className="case-study-scope">
            <h2>النطاق الكامل</h2>
            <div className="case-study-scope-groups">
              <div>
                <h3>بناء العلامة</h3>
                <ul>{(project.scope || []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              {(project.consulting || []).length > 0 && (
                <div>
                  <h3>الاستشارات الإبداعية</h3>
                  <ul>{project.consulting.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
            </div>
          </section>

          {nextProject && nextProject.id !== project.id && (
            <section className="case-study-next">
              <button onClick={() => onSelectProject(nextProject)} aria-label={`عرض مشروع ${nextProject.name}`}>
                <span>المشروع التالي</span>
                <strong>{nextProject.name}</strong>
                <figure className="logo-crop"><img src={nextProject.cover} alt={`شعار ${nextProject.name}`} loading="lazy" /></figure>
                <ArrowLeft size={30} />
              </button>
            </section>
          )}
        </main>
      </article>
    </div>
  );
}

function MaintenancePage({ theme, onTheme }) {
  return (
    <div className="creative-site kinetic-site creative-maintenance" id="top">
      <header className="kinetic-header">
        <CreativeLogo />
        <button className="kinetic-icon-button" aria-label={theme === "dark" ? "استخدام الوضع الفاتح" : "استخدام الوضع الداكن"} onClick={onTheme}>
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>
      <main>
        <Sparkle size={30} weight="fill" />
        <h1>أعيد ترتيب التجربة.</h1>
        <p>أراجع الأعمال والتجربة البصرية، وأعود قريباً بنسخة أكثر اكتمالاً.</p>
      </main>
    </div>
  );
}

function ExhibitHero({ projects, content, onSelect }) {
  const [index, setIndex] = useState(0);
  const step = (direction) => setIndex((value) => (value + direction + projects.length) % projects.length);
  const ordered = projects.map((_, slot) => projects[(slot + index) % projects.length]);
  return (
    <section className={`journey ${projects.length ? "" : "journey-empty"}`} id="work" aria-labelledby="creative-hero-title" style={{ "--journey-length": Math.max(2, projects.length) }}>
      <div className="journey-sticky">
        <div className="journey-copy">
          <h1 id="creative-hero-title">{content.heroTitle || "نصنع الأثر الذي تحتاجه علامتك."}</h1>
          <p>{content.heroBody || "من الفكرة الأولى إلى حضور يتماسك، يُرى، ويُتذكر."}</p>
        </div>
        {projects.length > 0 && <div className="journey-stage">
          <div className="journey-backdrop" aria-hidden="true" />
          {ordered.map((project, slot) => <button className="journey-card" key={project.id}
            style={{ "--slot": slot, "--arrival-start": `${slot < 3 ? 0 : 24 + (slot - 3) * (60 / Math.max(1, projects.length - 3))}%`, "--arrival-end": `${slot < 3 ? 22 : 24 + (slot - 2) * (60 / Math.max(1, projects.length - 3))}%`, "--card-surface": project.palette?.surface || "#e9eae6", "--card-ink": project.palette?.ink || "#252823" }}
            onClick={() => onSelect(project)} aria-label={`عرض تفاصيل مشروع ${project.name}`}>
            <span className="journey-card-label">{project.name}<ArrowUpLeft size={22} /></span>
            <span className="journey-card-image logo-crop"><img src={project.cover} alt={`شعار ${project.name}`} loading={slot < 3 ? "eager" : "lazy"} /></span>
          </button>)}
          <div className="journey-controls">
            <button onClick={() => step(-1)} aria-label="الشعار السابق"><ArrowRight size={21} /></button>
            <button onClick={() => step(1)} aria-label="الشعار التالي"><ArrowLeft size={21} /></button>
          </div>
        </div>}
      </div>
    </section>
  );
}

function Reveal({ children, className = "" }) {
  const element = useRef(null);
  useEffect(() => {
    const node = element.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    node.dataset.reveal = "waiting";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { node.dataset.reveal = "visible"; observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className={`exhibit-reveal ${className}`}>{children}</div>;
}

export default function MarketingSite({ theme, onTheme, onRequest, content }) {
  const [deckSeed] = useState(() => Math.floor(Math.random() * 4294967296));
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showBrandIntro, setShowBrandIntro] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowBrandIntro(false),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1700);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  const projects = useMemo(() => {
    const source = Array.isArray(content.portfolioProjects) && content.portfolioProjects.length
      ? content.portfolioProjects : defaultPortfolioProjects;
    return shuffleProjects(source.filter((_, index) => content.workVisibility?.[index] !== false), deckSeed);
  }, [content.portfolioProjects, content.workVisibility, deckSeed]);
  const services = useMemo(() => (content.services || []).filter((service) => service.active), [content.services]);
  const servicePaths = useMemo(() => servicePathDefinitions.map((path) => ({
    ...path,
    services: path.serviceIds.map((id) => services.find((service) => service.id === id)).filter(Boolean),
  })).filter((path) => path.services.length), [services]);
  const visible = content.sectionVisibility || {};
  const closeMenu = () => setMenuOpen(false);
  if (content.maintenance) return <MaintenancePage theme={theme} onTheme={onTheme} />;

  return (
    <div className="creative-site exhibit-site" id="top">
      {showBrandIntro && <BrandIntro />}
      <div inert={selectedProject ? true : undefined}>
        <a className="exhibit-skip" href="#work">انتقل إلى الأعمال</a>
        <header className="exhibit-header">
          <a className="exhibit-brand" href="#top" aria-label="العودة إلى بداية الموقع"><img src="/u89-logo.svg" alt="عبد الوهاب السويد" /></a>
          <nav className={menuOpen ? "is-open" : ""} id="exhibit-navigation" aria-label="التنقل الرئيسي">
            <a href="#work" onClick={closeMenu}>الأعمال</a>
            <a href="#services" onClick={closeMenu}>الخدمات</a>
            <a href="#about" onClick={closeMenu}>عني</a>
          </nav>
          <div className="exhibit-header-actions">
            <button className="exhibit-theme" aria-label={theme === "dark" ? "استخدام الوضع الفاتح" : "استخدام الوضع الداكن"} onClick={onTheme}>{theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}</button>
            <button className="exhibit-menu" aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen} aria-controls="exhibit-navigation" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={24} /> : <List size={24} />}</button>
          </div>
        </header>
        <main>
          <ExhibitHero projects={visible.work === false ? [] : projects} content={content} onSelect={setSelectedProject} />
          {visible.services !== false && <section className="exhibit-services" id="services">
            <Reveal><h2>{content.servicesTitle || "كيف أقدر أخدمك؟"}</h2></Reveal>
            <div className="exhibit-services-layout">
              <div className="exhibit-service-sign" aria-hidden="true"><span>فكرة.</span><span>هوية.</span><span>أثر.</span></div>
              <div className="exhibit-service-options">
                {servicePaths.map((path, index) => <details className="exhibit-service" key={path.id} name="service" open={index === 0 ? true : undefined}>
                  <summary>{path.title}<Plus size={23} /></summary>
                  <div className="exhibit-service-body"><p>{path.description}</p><div>{path.services.map((service) => <span key={service.id}>{service.title}</span>)}</div></div>
                </details>)}
                <button className="exhibit-contact" onClick={onRequest}>
                  <span>تواصل معنا</span><ArrowUpLeft size={36} />
                </button>
              </div>
            </div>
          </section>}
          {visible.about !== false && <section className="exhibit-about" id="about">
            <Reveal className="exhibit-about-content">
              <p>عبد الوهاب السويد</p>
              <h2>مصمم علامات.<br />مدير إبداعي.</h2>
              <span>خبرة تمتد لأكثر من خمسة عشر عاماً في بناء هويات لمشاريع من قطاعات مختلفة.</span>
            </Reveal>
          </section>}
        </main>
        <footer className="exhibit-footer"><span>عبد الوهاب بن سليمان السويد</span><a href="#top" aria-label="العودة إلى بداية الموقع">{content.domain || "U89DES.COM"} <ArrowUpLeft size={18} /></a><span>© {new Date().getFullYear()}</span></footer>
      </div>
      <CaseStudy key={selectedProject?.id || "closed-project"} project={selectedProject} projects={projects} onClose={() => setSelectedProject(null)} onSelectProject={setSelectedProject} />
    </div>
  );
}

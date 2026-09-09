import { useEffect, useMemo, useRef, useState } from "react";
import MarketingSite from "./MarketingSite";
import "./work-preview.css";
import { visiblePortfolio } from "./showcase-data";
import { sectionIsVisible } from "./section-visibility";

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function LogoArchive({ projects }) {
  const logos = useMemo(() => shuffle([...new Set(projects.map((item) => item.cover).filter(Boolean))]), [projects]);
  const [visibleLogos, setVisibleLogos] = useState(() => logos.slice(0, 16));
  const logoCursor = useRef(16);
  const lastChangedCell = useRef(-1);

  useEffect(() => {
    if (logos.length <= 16 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    logos.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
    const timer = window.setInterval(() => {
      setVisibleLogos((current) => {
        let cell = Math.floor(Math.random() * current.length);
        while (cell === lastChangedCell.current) cell = Math.floor(Math.random() * current.length);
        lastChangedCell.current = cell;

        const occupied = new Set(current);
        let replacement = logos[logoCursor.current % logos.length];
        let attempts = 0;
        while (occupied.has(replacement) && attempts < logos.length) {
          logoCursor.current += 1;
          replacement = logos[logoCursor.current % logos.length];
          attempts += 1;
        }
        logoCursor.current += 1;
        const next = [...current];
        next[cell] = replacement;
        return next;
      });
    }, 1250);
    return () => window.clearInterval(timer);
  }, [logos]);

  return (
    <section className="logo-archive" id="logos" aria-labelledby="logos-title">
      <div className="logo-archive-heading">
        <h2 id="logos-title">شعارات</h2>
        <p>نماذج مختارة من العلامات التي صممتها.</p>
      </div>
      <div className="logo-grid" aria-label="مجموعة شعارات تتغير تدريجياً">
        {visibleLogos.map((src, index) => (
          <figure className="logo-cell" key={`${src}-${index}`} style={{ "--logo-index": index }}>
            <img src={src} alt="شعار من تصميم عبد الوهاب السويد" loading="eager" />
          </figure>
        ))}
      </div>
    </section>
  );
}

function CampaignPreview({ projects, typography = false }) {
  const frames = projects.flatMap((item) => [{ src: item.cover, alt: item.name }, ...(item.gallery || [])]).filter((item) => item.src);
  return (
    <section className="campaign-preview" id={typography ? "typography" : "campaigns"} aria-labelledby={typography ? "typography-title" : "campaigns-title"}>
      <div className="campaign-copy">
        <h2 id={typography ? "typography-title" : "campaigns-title"}>{typography ? "الخطوط الطباعية" : "الحملة كتتابع بصري."}</h2>
        <p>{typography ? "حروف صُممت لتمنح الكلمات شخصيتها." : "مشاهد متصلة توضح الفكرة وإيقاعها عبر القنوات."}</p>
      </div>
      <div className="campaign-track">
        {frames.map((frame, index) => (
          <figure key={`${frame.src}-${index}`} className={`campaign-frame campaign-frame-${index % 4 + 1}`}>
            <img src={frame.src} alt={frame.alt} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function WorkPreview({ theme, onTheme, onRequest, content }) {
  const logos = useMemo(() => visiblePortfolio(content, "logo"), [content]);
  const campaigns = useMemo(() => visiblePortfolio(content, "campaign"), [content]);
  const typography = useMemo(() => visiblePortfolio(content, "typography"), [content]);
  return (
    <MarketingSite
      theme={theme}
      onTheme={onTheme}
      onRequest={onRequest}
      content={content}
      afterWork={(
        <div className="work-preview-additions">
          {sectionIsVisible(content, "logos") && logos.length > 0 && <LogoArchive key={JSON.stringify(logos.map((item) => item.cover))} projects={logos} />}
          {sectionIsVisible(content, "campaigns") && campaigns.length > 0 && <CampaignPreview projects={campaigns} />}
          {sectionIsVisible(content, "typography") && typography.length > 0 && <CampaignPreview projects={typography} typography />}
        </div>
      )}
    />
  );
}

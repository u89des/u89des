import { useEffect, useMemo, useRef, useState } from "react";
import MarketingSite from "./MarketingSite";
import "./work-preview.css";

const logoFiles = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 36, 37, 38, 41, 42, 43, 46, 49, 62, 63,
  73, 80, 83, 85, 99,
].map((number) => `/logos-original/Artboard ${number}-2.svg`);

const campaignFrames = [
  { src: "/portfolio/bukhary-posters.webp", alt: "ملصقات بخاري أختر" },
  { src: "/portfolio/spices-billboard.webp", alt: "حملة قصر التوابل" },
  { src: "/portfolio/tashkeela-van.webp", alt: "حملة ششاي على المركبة" },
  { src: "/portfolio/bukhary-billboard.webp", alt: "لوحة بخاري أختر الإعلانية" },
];

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function LogoArchive() {
  const logos = useMemo(() => shuffle(logoFiles), []);
  const [visibleLogos, setVisibleLogos] = useState(() => logos.slice(0, 16));
  const logoCursor = useRef(16);
  const lastChangedCell = useRef(-1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
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

function CampaignPreview() {
  return (
    <section className="campaign-preview" id="campaigns" aria-labelledby="campaigns-title">
      <div className="campaign-copy">
        <h2 id="campaigns-title">الحملة كتتابع بصري.</h2>
        <p>مشاهد متصلة توضح الفكرة وإيقاعها عبر القنوات.</p>
      </div>
      <div className="campaign-track">
        {campaignFrames.map((frame, index) => (
          <figure key={frame.src} className={`campaign-frame campaign-frame-${index + 1}`}>
            <img src={frame.src} alt={frame.alt} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function WorkPreview({ theme, onTheme, onRequest, content }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "تصور معرض الأعمال | عبد الوهاب السويد";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <MarketingSite
      theme={theme}
      onTheme={onTheme}
      onRequest={onRequest}
      content={content}
      afterWork={(
        <div className="work-preview-additions">
          <LogoArchive />
          <CampaignPreview />
        </div>
      )}
    />
  );
}

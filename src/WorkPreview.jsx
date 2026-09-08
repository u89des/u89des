import { useEffect, useMemo, useState } from "react";
import MarketingSite from "./MarketingSite";
import "./work-preview.css";

const logoFiles = Array.from(
  { length: 43 },
  (_, index) => `/logos-rendered/logo-${String(index + 1).padStart(2, "0")}.webp`,
);

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
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setRound((value) => value + 1), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleLogos = Array.from({ length: 16 }, (_, index) => logos[(round * 16 + index) % logos.length]);

  return (
    <section className="logo-archive" id="logos" aria-labelledby="logos-title">
      <div className="logo-archive-heading">
        <h2 id="logos-title">شعارات</h2>
        <p>نماذج مختارة من العلامات التي صممتها.</p>
      </div>
      <div className="logo-grid" aria-label="مجموعة شعارات تتغير كل خمس ثوانٍ">
        {visibleLogos.map((src, index) => (
          <figure className="logo-cell" key={`${round}-${src}-${index}`} style={{ "--logo-index": index }}>
            <img src={src} alt="شعار من تصميم عبد الوهاب السويد" loading={round === 0 ? "eager" : "lazy"} />
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

function TypePreview() {
  const [typeSize, setTypeSize] = useState(104);
  const [typeWeight, setTypeWeight] = useState(650);
  return (
    <section className="type-preview" id="type" aria-labelledby="type-title">
      <div className="type-heading">
        <h2 id="type-title">الخط مساحة للتجربة.</h2>
        <p>اكتب، غيّر الحجم والوزن، وشاهد شخصية الخط وهي تعمل.</p>
      </div>
      <div className="type-lab">
        <div className="type-canvas" contentEditable suppressContentEditableWarning role="textbox" aria-label="اكتب لتجربة الخط" spellCheck="false" style={{ fontSize: `${typeSize}px`, fontWeight: typeWeight }}>
          اكتب أثرك هنا
        </div>
        <div className="type-controls">
          <label>
            <span>الحجم</span>
            <input type="range" min="48" max="180" value={typeSize} onChange={(event) => setTypeSize(Number(event.target.value))} />
            <output>{typeSize}</output>
          </label>
          <div className="weight-controls" aria-label="وزن الخط">
            {[300, 500, 650, 800].map((weight) => (
              <button type="button" key={weight} className={typeWeight === weight ? "is-active" : ""} onClick={() => setTypeWeight(weight)} aria-pressed={typeWeight === weight}>
                {weight}
              </button>
            ))}
          </div>
        </div>
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
          <TypePreview />
        </div>
      )}
    />
  );
}

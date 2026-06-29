/* ============ Healthy Happy Hair — icons, motifs, block renderer ============ */

/* ---- inline icons (stroke = currentColor) ---- */
const Ic = {
  menu:   <path d="M3 6h18M3 12h18M3 18h18" />,
  close:  <path d="M6 6l12 12M18 6L6 18" />,
  sun:    <g><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></g>,
  type:   <g><path d="M5 7V5h14v2M12 5v14M9 19h6"/></g>,
  bookmark: <path d="M6 4h12v17l-6-4.2L6 21V4z"/>,
  bookmarkLine: <path d="M6 4h12v17l-6-4.2L6 21V4z" fill="none"/>,
  chevL:  <path d="M15 5l-7 7 7 7"/>,
  chevR:  <path d="M9 5l7 7-7 7"/>,
  list:   <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>,
  spark:  <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/>,
  leaf:   <path d="M5 19c0-7 5-13 14-14 0 9-5 14-14 14zM5 19c3.5-4 6-6 10-8"/>,
};
function Svg({ d, vb="0 0 24 24", sw=1.6, fill="none", ...p }) {
  return <svg viewBox={vb} fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>;
}

/* ---- botanical line motifs ---- */
function Sprig({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M40 72 V20" />
      <path d="M40 30c-9 0-15-5-16-13 9-1 15 4 16 13z" />
      <path d="M40 42c9 0 15-5 16-13-9-1-15 4-16 13z" />
      <path d="M40 52c-8 0-13-4-14-11 8-1 13 4 14 11z" />
      <path d="M40 20c0-6 3-11 8-13 1 6-2 11-8 13z" />
      <circle cx="40" cy="14" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function LeafGlyph({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21c0-8 4-15 8-17-1 9-3 14-8 17z" />
      <path d="M12 21c0-8-4-15-8-17 1 9 3 14 8 17z" />
      <path d="M12 21V8" />
    </svg>
  );
}
function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <i></i>
      <LeafGlyph />
      <i></i>
    </div>
  );
}

/* callout icon by label */
function calloutIcon(label) {
  const l = label.toLowerCase();
  if (l.includes("did you know") || l.includes("fun fact")) return Ic.spark;
  if (l.includes("tip")) return Ic.leaf;
  if (l.includes("science")) return Ic.spark;
  return Ic.spark;
}

/* ---- rich text: bold "Lead-in: rest", soft line breaks ---- */
function richText(text) {
  // split on \n into lines
  const lines = text.split("\n");
  return lines.map((line, li) => {
    let node;
    const m = line.match(/^([A-Z][A-Za-z0-9 ,'’/&()\-]{1,42}?):\s+(.*)$/);
    if (m && m[2] && m[1].split(" ").length <= 6) {
      node = <React.Fragment><b className="lede">{m[1]}:</b> {m[2]}</React.Fragment>;
    } else if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      node = parts.map((p, pi) => pi % 2 === 1 ? <b key={pi}>{p}</b> : p);
    } else {
      node = line;
    }
    return <React.Fragment key={li}>{li > 0 && <br />}{node}</React.Fragment>;
  });
}

/* ---- block renderer ---- */
function Block({ b, idx, isFirstPara }) {
  switch (b.type) {
    case "p": {
      const cls = isFirstPara ? "drop" : "";
      return <p className={cls}>{richText(b.text)}</p>;
    }
    case "em": return <p style={{fontStyle:"italic", color:"var(--ink-2)", fontWeight:300}}>{richText(b.text)}</p>;
    case "h2": return <h2 className="sec">{b.text}</h2>;
    case "h3": return <h3 className="sub">{b.text}</h3>;
    case "h4": return <h4 className="tag">{b.text}</h4>;
    case "label": return <p className="range-label">{richText(b.text)}</p>;
    case "list":
      return (
        <ul className="bul">
          {b.items.map((it, i) => <li key={i}>{richText(it)}</li>)}
        </ul>
      );
    case "callout":
      return (
        <aside className="callout">
          <div className="clabel"><Svg d={calloutIcon(b.label)} sw={1.5} />{b.label}</div>
          <p>{richText(b.text)}</p>
        </aside>
      );
    case "figure":
      return (
        <figure className={"figure" + (b.image ? " figure--img" : "") + (b.wide ? " figure--wide" : "")}>
          {b.image ? (
            <div className="figure-plate">
              <img src={b.image} alt={b.alt || b.caption} loading="lazy" style={b.maxWidth ? {maxWidth: b.maxWidth + 'px'} : undefined} />
            </div>
          ) : (
            <Sprig />
          )}
          <figcaption className="fcap">{b.caption}</figcaption>
          {!b.image && <div className="fnote">illustration placeholder</div>}
        </figure>
      );
    default: return null;
  }
}

/* render a unit's blocks; mark the first paragraph for drop-cap */
function Prose({ blocks }) {
  let firstParaDone = false;
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        const isFirst = b.type === "p" && !firstParaDone;
        if (isFirst) firstParaDone = true;
        return <Block key={i} b={b} idx={i} isFirstPara={isFirst} />;
      })}
    </div>
  );
}

window.HHHRender = { Ic, Svg, Sprig, LeafGlyph, Ornament, Prose, Block, richText };

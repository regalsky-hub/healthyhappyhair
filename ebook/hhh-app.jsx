/* ============ Healthy Happy Hair — reader app ============ */
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { Ic, Svg, Sprig, LeafGlyph, Ornament, Prose } = window.HHHRender;

const SIZE_LEVELS = [16, 17.5, 19, 20.5, 22, 24];
const WIDTH_LEVELS = { narrow: "34rem", normal: "39rem", wide: "45rem" };
const ROMAN = ["", "One", "Two", "Three", "Four", "Five", "Six"];
const pad2 = (n) => String(n).padStart(2, "0");

/* ---------- model ---------- */
function useBookModel() {
  return useMemo(() => {
    const base = window.BOOK.units;
    const nav = [{ type: "cover", id: "cover" }, { type: "colophon", id: "colophon" }];
    let partCount = 0;
    const chaptersByPart = {};
    let curPartId = null;
    base.forEach((u) => {
      if (u.type === "part") {
        partCount += 1;
        const id = "part-" + partCount;
        curPartId = id;
        chaptersByPart[id] = [];
        nav.push({ ...u, id, partNo: partCount });
      } else if (u.type === "chapter") {
        const id = "ch-" + u.num;
        if (curPartId) chaptersByPart[curPartId].push({ id, num: u.num, title: u.title });
        nav.push({ ...u, id });
      } else {
        nav.push({ ...u, id: u.type });
      }
    });
    return { nav, chaptersByPart };
  }, []);
}

/* ---------- persisted prefs ---------- */
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem("hhh_prefs") || "{}"); } catch { return {}; }
}

/* ---------- views ---------- */
function CoverView({ onBegin }) {
  const B = window.BOOK;
  return (
    <div className="cover fade-enter">
      <div className="cover-card cover-card--img">
        <img src="../assets/cover.png" alt="Healthy Happy Hair by Aida Sol" style={{width:"100%",height:"auto",display:"block",borderRadius:"4px"}} />
        <div className="cover-foot" style={{marginTop:"1.25rem"}}>
          <button className="btn-begin" onClick={onBegin}>Begin Reading</button>
        </div>
        <a className="btn-backsite" href="../index.html">← Back to the book site</a>
      </div>
    </div>
  );
}

function ColophonView() {
  const B = window.BOOK;
  return (
    <div className="page-wrap fade-enter">
      <div className="colo">
        <div className="ck">Healthy Happy Hair</div>
        <h2>{B.subtitle}</h2>
        <Ornament />
        <p className="tight">Copyright © {B.year} by {B.author}. All rights reserved. No part of this book may be reproduced, stored in a retrieval system, or transmitted in any form or by any means without prior written permission from the author, except for brief quotations used in reviews.</p>
        <hr />
        <div className="ck">Disclaimer</div>
        <p>This book is intended for educational and informational purposes only. It does not constitute or replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making any changes to your health, diet, supplements, or hair care routine.</p>
        <p>While every effort has been made to ensure accuracy, the author and publisher make no representations or warranties regarding the completeness, reliability, or suitability of the information provided. Readers are solely responsible for their own decisions and outcomes.</p>
        <p className="tight">Always perform a patch test before applying new oils, herbs, or topical ingredients to assess suitability for your skin and scalp.</p>
        <p className="tight">Published by Aida Sol</p>
      </div>
    </div>
  );
}

function PartView({ unit, chapters, onJump }) {
  return (
    <div className="partview fade-enter">
      <div className="inner">
        <div className="plabel">Part {ROMAN[unit.partNo] || unit.partNo}</div>
        <div className="pnum">{unit.partNo}</div>
        <h1>{unit.titleParts.join(" ")}</h1>
        <Sprig className="motif" />
        <div className="chips">
          {chapters.map((c) => (
            <button key={c.id} className="chip" onClick={() => onJump(c.id)}>
              <span className="cn">Ch {pad2(c.num)}</span>
              <span className="ct">{titleCase(c.title)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function titleCase(t) {
  if (!t) return t;
  // ALL-CAPS chapter titles -> Title Case
  if (t === t.toUpperCase()) {
    const small = new Set(["and", "or", "the", "of", "for", "to", "a", "with", "your", "not", "you", "doing", "it"]);
    return t.toLowerCase().split(" ").map((w, i) => {
      const core = w.replace(/[^a-z]/gi, "");
      if (i > 0 && small.has(core)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }
  return t;
}

function ChapterView({ unit }) {
  const isChapter = unit.type === "chapter";
  const eyebrow = isChapter
    ? <React.Fragment>{unit.part}<span className="dot"></span>Chapter {pad2(unit.num)}</React.Fragment>
    : (unit.type === "intro" ? "Introduction" : "In Closing");
  return (
    <div className="page-wrap fade-enter">
      <div className="page">
        <header className="opener">
          <div className="eyebrow">{eyebrow}</div>
          {isChapter && <div className="chno">{pad2(unit.num)}</div>}
          <h1>{titleCase(unit.title)}</h1>
          {unit.subtitle && <div className="sub">{unit.subtitle}</div>}
          <div className="rule"></div>
        </header>
        <Prose blocks={unit.blocks} />
      </div>
    </div>
  );
}

/* ---------- settings popover ---------- */
function SettingsPop({ theme, setTheme, sizeIdx, setSizeIdx, width, setWidth, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest("[data-settings-btn]")) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const themes = [
    { id: "day", label: "Day", sw: "#FCF9F1" },
    { id: "sepia", label: "Sepia", sw: "#F0E2C4" },
    { id: "night", label: "Night", sw: "#211D16" },
  ];
  return (
    <div className="pop fade-enter" ref={ref} style={{ animationDuration: ".22s" }}>
      <h4>Theme</h4>
      <div className="seg">
        {themes.map((t) => (
          <button key={t.id} className={theme === t.id ? "on" : ""} onClick={() => setTheme(t.id)}>
            <span className="sw" style={{ background: t.sw }}></span>{t.label}
          </button>
        ))}
      </div>
      <h4>Text Size</h4>
      <div className="size-row">
        <button className="s1" onClick={() => setSizeIdx(Math.max(0, sizeIdx - 1))}>A</button>
        <div className="sval">{Math.round(SIZE_LEVELS[sizeIdx])} px</div>
        <button className="s2" onClick={() => setSizeIdx(Math.min(SIZE_LEVELS.length - 1, sizeIdx + 1))}>A</button>
      </div>
      <h4 style={{ marginTop: 18 }}>Column Width</h4>
      <div className="widerow">
        {Object.keys(WIDTH_LEVELS).map((w) => (
          <button key={w} className={width === w ? "on" : ""} onClick={() => setWidth(w)}>
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- TOC drawer ---------- */
function Drawer({ open, onClose, nav, current, bookmarks, onJump }) {
  return (
    <React.Fragment>
      <div className={"scrim" + (open ? " show" : "")} onClick={onClose}></div>
      <nav className={"drawer" + (open ? " show" : "")} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="dt">Contents<span>Healthy Happy Hair</span></div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Svg d={Ic.close} /></button>
        </div>
        <div className="drawer-body">
          {nav.map((u) => {
            if (u.type === "part") {
              return (
                <button key={u.id} className="toc-part" style={{ width: "100%", background: "none", border: 0, cursor: "pointer" }} onClick={() => onJump(u.id)}>
                  <span>Part {ROMAN[u.partNo] || u.partNo}</span><i></i>
                </button>
              );
            }
            const isSpecial = u.type === "intro" || u.type === "conclusion" || u.type === "cover" || u.type === "colophon";
            const label = u.type === "cover" ? "Cover"
              : u.type === "colophon" ? "Disclaimer"
              : u.type === "intro" ? "The Living Crown"
              : u.type === "conclusion" ? titleCase(u.title)
              : titleCase(u.title);
            const num = u.type === "chapter" ? pad2(u.num) : (u.type === "intro" ? "—" : "");
            return (
              <button key={u.id} className={"toc-item" + (current === u.id ? " active" : "") + (isSpecial ? " toc-special" : "")} onClick={() => onJump(u.id)}>
                {num && <span className="tn">{num}</span>}
                {!num && <span className="tn"></span>}
                <span className="tt">{label}</span>
                {bookmarks[u.id] && <Svg className="bm" d={Ic.bookmark} fill="currentColor" sw={0} />}
              </button>
            );
          })}
        </div>
      </nav>
    </React.Fragment>
  );
}

/* ---------- tweaks layer (design exploration) ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#4E6B54",
  "headingFont": "'Cormorant Garamond', serif",
  "bodyFont": "'Spectral', Georgia, serif",
  "dropCaps": true
}/*EDITMODE-END*/;

function TweaksLayer() {
  const hasTweaks = !!window.useTweaks;
  if (!hasTweaks) return null;
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent-base", t.accent);
    r.style.setProperty("--font-display", t.headingFont);
    r.style.setProperty("--font-body", t.bodyFont);
    document.body.classList.toggle("no-dropcaps", !t.dropCaps);
  }, [t.accent, t.headingFont, t.bodyFont, t.dropCaps]);
  const { TweaksPanel, TweakSection, TweakColor, TweakSelect, TweakToggle } = window;
  return (
    <TweaksPanel>
      <TweakSection label="Palette" />
      <TweakColor label="Accent" value={t.accent}
        options={["#4E6B54", "#B0673F", "#7A4A63", "#46587E", "#4A463F"]}
        onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Typography" />
      <TweakSelect label="Headings" value={t.headingFont}
        options={[{ value: "'Cormorant Garamond', serif", label: "Cormorant" }, { value: "'Marcellus', serif", label: "Marcellus" }, { value: "'Newsreader', serif", label: "Newsreader" }]}
        onChange={(v) => setTweak("headingFont", v)} />
      <TweakSelect label="Body" value={t.bodyFont}
        options={[{ value: "'Spectral', Georgia, serif", label: "Spectral" }, { value: "'Newsreader', Georgia, serif", label: "Newsreader" }, { value: "'Marcellus', serif", label: "Marcellus" }]}
        onChange={(v) => setTweak("bodyFont", v)} />
      <TweakToggle label="Drop caps" value={t.dropCaps} onChange={(v) => setTweak("dropCaps", v)} />
    </TweaksPanel>
  );
}

/* ---------- main app ---------- */
function App() {
  const { nav, chaptersByPart } = useBookModel();
  const prefs0 = useMemo(loadPrefs, []);
  const [index, setIndex] = useState(prefs0.index ?? 0);
  const [theme, setTheme] = useState(prefs0.theme ?? "day");
  const [sizeIdx, setSizeIdx] = useState(prefs0.sizeIdx ?? 2);
  const [width, setWidth] = useState(prefs0.width ?? "normal");
  const [bookmarks, setBookmarks] = useState(prefs0.bookmarks ?? {});
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [scrollFrac, setScrollFrac] = useState(0);
  const readerRef = useRef(null);

  const unit = nav[index];
  const curId = unit.id;

  // apply theme + sizing to root
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", theme);
    r.style.setProperty("--reading-size", SIZE_LEVELS[sizeIdx] + "px");
    r.style.setProperty("--measure", WIDTH_LEVELS[width]);
  }, [theme, sizeIdx, width]);

  // persist
  useEffect(() => {
    localStorage.setItem("hhh_prefs", JSON.stringify({ index, theme, sizeIdx, width, bookmarks }));
  }, [index, theme, sizeIdx, width, bookmarks]);

  // scroll to top on unit change + reset scroll frac
  useEffect(() => {
    if (readerRef.current) readerRef.current.scrollTop = 0;
    setScrollFrac(0);
  }, [index]);

  const onScroll = useCallback(() => {
    const el = readerRef.current; if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollFrac(max > 12 ? Math.min(1, el.scrollTop / max) : 0);
  }, []);

  const go = useCallback((dir) => {
    setIndex((i) => Math.max(0, Math.min(nav.length - 1, i + dir)));
  }, [nav.length]);

  const jumpTo = useCallback((id) => {
    const i = nav.findIndex((u) => u.id === id);
    if (i >= 0) setIndex(i);
    setDrawer(false);
  }, [nav]);

  const toggleBookmark = useCallback(() => {
    setBookmarks((b) => { const n = { ...b }; if (n[curId]) delete n[curId]; else n[curId] = true; return n; });
  }, [curId]);

  // keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.target.closest("input,textarea")) return;
      if (e.key === "ArrowRight") { go(1); }
      else if (e.key === "ArrowLeft") { go(-1); }
      else if (e.key === "t" || e.key === "T") { setDrawer((d) => !d); }
      else if (e.key === "b" || e.key === "B") { toggleBookmark(); }
      else if (e.key === "Escape") { setDrawer(false); setSettings(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, toggleBookmark]);

  const overall = (index + scrollFrac) / (nav.length - 1);

  // chapter label for topbar
  const tbChapter = unit.type === "chapter" ? "Chapter " + pad2(unit.num) + " · " + titleCase(unit.title)
    : unit.type === "part" ? "Part " + (ROMAN[unit.partNo] || unit.partNo)
    : unit.type === "intro" ? "Introduction"
    : unit.type === "conclusion" ? "Conclusion"
    : unit.type === "colophon" ? "Disclaimer" : "";

  const prevUnit = nav[index - 1];
  const nextUnit = nav[index + 1];
  const unitShort = (u) => !u ? "" : u.type === "chapter" ? "Ch " + pad2(u.num)
    : u.type === "part" ? "Part " + (ROMAN[u.partNo] || u.partNo)
    : u.type === "cover" ? "Cover" : u.type === "colophon" ? "Disclaimer"
    : u.type === "intro" ? "Introduction" : "Conclusion";

  let main;
  if (unit.type === "cover") main = <CoverView onBegin={() => go(1)} />;
  else if (unit.type === "colophon") main = <ColophonView />;
  else if (unit.type === "part") main = <PartView unit={unit} chapters={chaptersByPart[unit.id] || []} onJump={jumpTo} />;
  else main = <ChapterView unit={unit} />;

  return (
    <div className="app">
      <div className="progress-top"><i style={{ width: (overall * 100).toFixed(2) + "%" }}></i></div>

      <header className="topbar">
        <button className="iconbtn" data-toc onClick={() => setDrawer(true)} aria-label="Contents"><Svg d={Ic.menu} /></button>
        <div className="tb-title"><span className="wm-heal">Heal</span><span className="wm-thy">thy</span> <span className="wm-happy">Happy</span> <span className="wm-hair">Hair</span></div>
        <div className="tb-center"><div className="tb-chapter">{tbChapter}</div></div>
        <div className="tb-actions">
          <button className={"iconbtn" + (bookmarks[curId] ? " on" : "")} onClick={toggleBookmark} aria-label="Bookmark">
            <Svg d={Ic.bookmark} fill={bookmarks[curId] ? "currentColor" : "none"} sw={bookmarks[curId] ? 0 : 1.6} />
          </button>
          <button className={"iconbtn" + (settings ? " on" : "")} data-settings-btn onClick={() => setSettings((s) => !s)} aria-label="Settings"><Svg d={Ic.type} /></button>
        </div>
        {settings && <SettingsPop theme={theme} setTheme={setTheme} sizeIdx={sizeIdx} setSizeIdx={setSizeIdx} width={width} setWidth={setWidth} onClose={() => setSettings(false)} />}
      </header>

      <div className="scene">
        <div className="reader" ref={readerRef} onScroll={onScroll} key={index}>
          {main}
        </div>
        <div className="botnav">
          <button className="nav-btn" disabled={index === 0} onClick={() => go(-1)}>
            <Svg d={Ic.chevL} /><span className="lbl">{unitShort(prevUnit)}</span>
          </button>
          <div className="pill">{unit.type === "chapter" ? pad2(unit.num) + " / 20" : tbChapter}</div>
          <button className="nav-btn" disabled={index === nav.length - 1} onClick={() => go(1)}>
            <span className="lbl">{unitShort(nextUnit)}</span><Svg d={Ic.chevR} />
          </button>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} nav={nav} current={curId} bookmarks={bookmarks} onJump={jumpTo} />
      <TweaksLayer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

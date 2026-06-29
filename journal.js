/* ============================================================
   Healthy Happy Hair — Companion Journal
   Interactivity + autosave + add-page
   ============================================================ */
(function(){
  const KEY = 'hhh-companion-journal-v1';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ store = {}; }

  const savedEl = document.querySelector('.saved');
  let flashT;
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){}
    if(savedEl){
      savedEl.classList.add('flash');
      clearTimeout(flashT);
      flashT = setTimeout(()=>savedEl.classList.remove('flash'), 900);
    }
  }
  function set(k,v){ if(!k) return; store[k]=v; persist(); }
  function get(k){ return store[k]; }

  /* ---- SVG helpers ---- */
  const MOUTHS = [
    'M9 17 Q15 23 21 17',
    'M10 18 Q15 21 20 18',
    'M10 18 L20 18',
    'M10 20 Q15 17.5 20 20',
    'M9 21 Q15 15 21 21'
  ];
  function faceSVG(i){
    return '<svg viewBox="0 0 30 30" aria-hidden="true">'+
      '<circle class="r" cx="15" cy="15" r="12.2"/>'+
      '<line x1="11" y1="11.4" x2="11" y2="13"/>'+
      '<line x1="19" y1="11.4" x2="19" y2="13"/>'+
      '<path d="'+MOUTHS[i]+'"/></svg>';
  }
  const GLASS='M3 2.4 L13 2.4 L11.4 20 L4.6 20 Z';

  /* ---- Init dynamic widgets inside a root element ---- */
  function initWidgets(root){
    // render face scales
    root.querySelectorAll('.scale[data-faces]').forEach(s=>{
      const labels = (s.getAttribute('data-faces')||'1,2,3,4,5').split(',');
      s.innerHTML = labels.map((lab,i)=>(
        '<div class="face" data-v="'+i+'">'+faceSVG(i)+'<span class="num">'+lab.trim()+'</span></div>'
      )).join('');
    });
    // render water glasses
    root.querySelectorAll('.glasses[data-count]').forEach(g=>{
      const n=+g.getAttribute('data-count')||10;
      let h='';
      for(let i=0;i<n;i++) h+='<span class="glass"><svg viewBox="0 0 16 22" aria-hidden="true"><path class="fill" d="'+GLASS+'"/><path class="cup" d="'+GLASS+'"/></svg></span>';
      g.innerHTML=h;
    });
    // render dot scales
    root.querySelectorAll('.dots[data-n]').forEach(d=>{
      const n=+d.getAttribute('data-n')||5;
      let h=''; for(let i=0;i<n;i++) h+='<span class="d" data-v="'+i+'">'+(i+1)+'</span>';
      d.innerHTML=h;
    });
  }

  /* ---- Wire interactivity for all [data-k] elements inside root ---- */
  function wireFields(root){
    // Text inputs / contenteditable
    root.querySelectorAll('[data-k]').forEach(el=>{
      const k = el.getAttribute('data-k');
      const tag = el.tagName.toLowerCase();
      const editable = el.isContentEditable || el.classList.contains('write');
      if(editable){
        if(get(k)!=null) el.innerHTML = get(k);
        el.addEventListener('input', ()=> set(k, el.innerHTML));
      } else if(tag==='input' || tag==='textarea'){
        if(get(k)!=null) el.value = get(k);
        el.addEventListener('input', ()=> set(k, el.value));
      }
    });

    // Checkboxes
    root.querySelectorAll('.chk[data-k]').forEach(el=>{
      const k = el.getAttribute('data-k');
      if(get(k)) el.classList.add('on');
      el.setAttribute('role','checkbox');
      el.setAttribute('tabindex','0');
      const toggle=()=>{ const on=el.classList.toggle('on'); set(k,on?1:0); el.setAttribute('aria-checked',on); };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); toggle(); }});
    });

    // Single-choice: pills
    root.querySelectorAll('.pillset[data-k]').forEach(group=>{
      const k = group.getAttribute('data-k');
      const items = [...group.querySelectorAll('.pill')];
      const saved = get(k);
      items.forEach(it=>{
        const val = it.getAttribute('data-v');
        if(saved!=null && String(saved)===val) it.classList.add('on');
        it.addEventListener('click', ()=>{
          const already = it.classList.contains('on');
          items.forEach(x=>x.classList.remove('on'));
          if(already){ set(k,null); }
          else { it.classList.add('on'); set(k,val); }
        });
      });
    });

    // Single-choice: face scales
    root.querySelectorAll('.scale[data-k]').forEach(group=>{
      const k = group.getAttribute('data-k');
      const items = [...group.querySelectorAll('.face')];
      const saved = get(k);
      items.forEach((it,i)=>{
        const val = it.getAttribute('data-v') || String(i);
        if(saved!=null && String(saved)===val) it.classList.add('on');
        it.addEventListener('click', ()=>{
          const already = it.classList.contains('on');
          items.forEach(x=>x.classList.remove('on'));
          if(already){ set(k,null); }
          else { it.classList.add('on'); set(k,val); }
        });
      });
    });

    // Single-choice: dot scales
    root.querySelectorAll('.dotscale[data-k]').forEach(group=>{
      const k = group.getAttribute('data-k');
      const items = [...group.querySelectorAll('.dots .d')];
      const saved = get(k);
      items.forEach((it,i)=>{
        const val = it.getAttribute('data-v') || String(i);
        if(saved!=null && String(saved)===val) it.classList.add('on');
        it.addEventListener('click', ()=>{
          const already = it.classList.contains('on');
          items.forEach(x=>x.classList.remove('on'));
          if(already){ set(k,null); }
          else { it.classList.add('on'); set(k,val); }
        });
      });
    });

    // Water glasses
    root.querySelectorAll('.glasses[data-k]').forEach(group=>{
      const k = group.getAttribute('data-k');
      const items=[...group.querySelectorAll('.glass')];
      const saved = +get(k)||0;
      items.forEach((g,i)=>{ if(i<saved) g.classList.add('on'); });
      items.forEach((g,i)=>{
        g.addEventListener('click', ()=>{
          const filled = items.filter(x=>x.classList.contains('on')).length;
          const target = (i+1===filled) ? i : i+1;
          items.forEach((x,j)=> x.classList.toggle('on', j<target));
          set(k, target);
        });
      });
    });

    // Ruler ticks
    root.querySelectorAll('.ruler[data-units]').forEach(r=>{
      const units = +r.getAttribute('data-units');
      const h = r.clientHeight;
      for(let i=0;i<=units;i++){
        const y = h - (h*i/units);
        const maj = document.createElement('div');
        maj.className='tick maj'; maj.style.top = y+'px'; r.appendChild(maj);
        const num=document.createElement('div');
        num.className='tnum'; num.style.top=y+'px'; num.textContent=i; r.appendChild(num);
        if(i<units){
          const ym = h - (h*(i+0.5)/units);
          const mn=document.createElement('div'); mn.className='tick min'; mn.style.top=ym+'px'; r.appendChild(mn);
        }
      }
    });
  }

  /* ---- Initial render & wire for the whole document ---- */
  initWidgets(document);
  wireFields(document);

  /* ---- Contents rail: active highlight ---- */
  function buildRailObserver(){
    const links = [...document.querySelectorAll('.rail a[href^="#"]')];
    const map = new Map();
    links.forEach(a=>{ const t=document.querySelector(a.getAttribute('href')); if(t) map.set(t,a); });
    if(window._railIO) window._railIO.disconnect();
    window._railIO = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          links.forEach(l=>l.classList.remove('active'));
          const a=map.get(en.target); if(a) a.classList.add('active');
        }
      });
    }, { rootMargin:'-45% 0px -50% 0px', threshold:0 });
    map.forEach((a,t)=> window._railIO.observe(t));
  }
  buildRailObserver();

  document.querySelector('.rail__list').addEventListener('click', e=>{
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const t = document.querySelector(a.getAttribute('href'));
    if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
  });

  /* ---- Print / Save / Download ---- */
  const btnPrint    = document.querySelector('#btnPrint');
  const btnPDF      = document.querySelector('#btnPDF');
  const btnDownload = document.querySelector('#btnDownload');

  if(btnPrint) btnPrint.addEventListener('click', () => window.print());

  if(btnPDF) btnPDF.addEventListener('click', () => {
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2E2A25;color:#FAF7F2;font-size:13px;padding:10px 18px;border-radius:8px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);pointer-events:none;';
    tip.textContent = 'In the print dialog, set Destination → Save as PDF';
    document.body.appendChild(tip);
    setTimeout(() => { window.print(); document.body.removeChild(tip); }, 700);
  });

  if(btnDownload) btnDownload.addEventListener('click', () => {
    const storeData = localStorage.getItem(KEY) || '{}';
    const injectScript = '<script>try{localStorage.setItem("' + KEY + '",' + JSON.stringify(storeData) + ');}catch(e){}<\/script>';
    let html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    html = html.replace('</head>', injectScript + '</head>');
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'Healthy Happy Hair Companion Journal.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  /* ================================================================
     ADD-A-PAGE FEATURE
     ================================================================ */
  const PAGE_TEMPLATES = [
    { id:'p3', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#557355" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M13 6v-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="12" y1="13" x2="20" y2="13"/><line x1="12" y1="17" x2="20" y2="17"/><line x1="12" y1="21" x2="16" y2="21"/></svg>', label:'Wash Day Log', desc:'Track routine, products & results' },
    { id:'p4', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#557355" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="13" r="6"/><path d="M16 19v8"/><path d="M12 23h8"/><path d="M10 10 Q8 6 10 4"/><path d="M22 10 Q24 6 22 4"/></svg>', label:'Scalp & Shedding', desc:'Weekly scalp condition tracker' },
    { id:'p6', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#557355" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8 Q16 4 23 8 L23 20 Q16 26 9 20 Z"/><path d="M13 16 Q16 14 19 16"/><line x1="16" y1="11" x2="16" y2="14"/></svg>', label:'Protective Style Log', desc:'Install, wear & take-down notes' },
    { id:'p7', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#D29A2E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 26 Q16 6 25 26"/><line x1="10" y1="20" x2="22" y2="20"/><circle cx="16" cy="13" r="1.5" fill="#D29A2E"/></svg>', label:'Nutrient Planner', desc:'Hair-loving meals & supplements' },
    { id:'p8', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#557355" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5 A11 11 0 1 1 5 16"/><path d="M5 9 L5 16 L11 16"/><line x1="16" y1="10" x2="16" y2="16"/><line x1="16" y1="16" x2="20" y2="19"/></svg>', label:'Mind–Body Check-in', desc:'Mood, sleep, stress & cycle' },
    { id:'p9', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#DD7E33" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5 L18.5 12 L26 12 L20 17 L22.5 24 L16 20 L9.5 24 L12 17 L6 12 L13.5 12 Z"/></svg>', label:'Trigger & Flare-up', desc:'Catch patterns & signals early' },
    { id:'ptLined', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#6E655A" stroke-width="1.8" stroke-linecap="round"><rect x="7" y="5" width="18" height="22" rx="2"/><line x1="11" y1="11" x2="21" y2="11"/><line x1="11" y1="15" x2="21" y2="15"/><line x1="11" y1="19" x2="21" y2="19"/><line x1="11" y1="23" x2="17" y2="23"/></svg>', label:'Lined page', desc:'Blank ruled page for free notes' },
    { id:'ptBlank', icon:'<svg viewBox="0 0 32 32" fill="none" stroke="#9A9082" stroke-width="1.8" stroke-linecap="round"><rect x="7" y="5" width="18" height="22" rx="2"/></svg>', label:'Blank page', desc:'Completely empty page' },
  ];

  // Load saved added pages list
  let addedPages = [];
  try { addedPages = JSON.parse(store.__addedPages || '[]'); } catch(e){ addedPages = []; }

  function savePageList(){
    store.__addedPages = JSON.stringify(addedPages);
    persist();
  }

  /* Remap all data-k attrs in a cloned element so they're unique */
  function remapKeys(root, uid){
    root.querySelectorAll('[data-k]').forEach(el=>{
      const orig = el.getAttribute('data-k');
      el.setAttribute('data-k', uid + '__' + orig);
    });
  }

  /* Add a page nav link to the rail */
  function addNavLink(uid, label, pageNum){
    const list = document.querySelector('.rail__list');
    const a = document.createElement('a');
    a.href = '#' + uid;
    a.innerHTML = '<span class="n">'+pageNum+'</span><span>'+label+'</span>';
    list.appendChild(a);
  }

  /* Remove a page (called by delete button) */
  function removePage(uid){
    // Remove from DOM
    const page = document.getElementById(uid);
    if(page) page.remove();
    // Remove nav link
    const link = document.querySelector('.rail a[href="#'+uid+'"]');
    if(link) link.remove();
    // Remove from list
    addedPages = addedPages.filter(p=>p.uid !== uid);
    savePageList();
    buildRailObserver();
  }

  /* Clone a template page and insert it into the sheet */
  function createPage(templateId, uid, animate){
    const template = document.getElementById(templateId);
    if(!template) return null;

    const clone = template.cloneNode(true);
    clone.id = uid;
    clone.style.display = ''; // remove the display:none from hidden templates
    clone.removeAttribute('data-screen-label');
    clone.setAttribute('data-screen-label', uid);

    // Remap all data-k to be unique
    remapKeys(clone, uid);

    // Remove existing page number text and replace
    const pgno = clone.querySelector('.pageno');
    if(pgno) pgno.remove();

    // Add a delete button
    const del = document.createElement('button');
    del.className = 'page-delete';
    del.title = 'Remove this page';
    del.setAttribute('aria-label', 'Remove page');
    del.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener('click', ()=>{
      if(confirm('Remove this page? Your notes will be lost.')) removePage(uid);
    });
    clone.appendChild(del);

    // Re-render dynamic widgets before wiring
    initWidgets(clone);
    wireFields(clone);

    if(animate) clone.classList.add('page-entering');

    return clone;
  }

  /* Insert page into the sheet and update nav */
  function insertPage(templateId, uid, label){
    const sheet = document.querySelector('.sheet');
    const addBtn = document.querySelector('.add-page-area');

    const clone = createPage(templateId, uid, true);
    if(!clone) return;

    sheet.insertBefore(clone, addBtn);

    // Count existing pages for nav number
    const pageCount = document.querySelectorAll('.sheet .page').length;
    addNavLink(uid, label, String(pageCount).padStart(2,'0'));
    buildRailObserver();

    // Animate in
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        clone.classList.remove('page-entering');
        clone.scrollIntoView({ behavior:'smooth', block:'center' });
      });
    });
  }

  /* Restore previously added pages on load */
  function restorePages(){
    addedPages.forEach(({templateId, uid, label})=>{
      const clone = createPage(templateId, uid, false);
      if(!clone) return;
      const sheet = document.querySelector('.sheet');
      const addBtn = document.querySelector('.add-page-area');
      sheet.insertBefore(clone, addBtn);
      const pageCount = document.querySelectorAll('.sheet .page').length;
      addNavLink(uid, label, String(pageCount).padStart(2,'0'));
    });
    if(addedPages.length > 0) buildRailObserver();
  }

  /* ---- Build the Add Page UI ---- */
  function buildAddPageUI(){
    const sheet = document.querySelector('.sheet');

    // Container at the bottom of the sheet
    const area = document.createElement('div');
    area.className = 'add-page-area';

    const trigger = document.createElement('button');
    trigger.className = 'add-page-btn';
    trigger.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      '<span>Add a page</span>';

    // Picker popover
    const picker = document.createElement('div');
    picker.className = 'add-page-picker';
    picker.setAttribute('aria-hidden','true');

    const pickerHead = document.createElement('div');
    pickerHead.className = 'add-page-picker__head';
    pickerHead.textContent = 'Choose a page to add';
    picker.appendChild(pickerHead);

    const grid = document.createElement('div');
    grid.className = 'add-page-picker__grid';

    PAGE_TEMPLATES.forEach(tmpl=>{
      const card = document.createElement('button');
      card.className = 'add-page-card';
      card.innerHTML =
        '<span class="add-page-card__icon">'+tmpl.icon+'</span>'+
        '<span class="add-page-card__label">'+tmpl.label+'</span>'+
        '<span class="add-page-card__desc">'+tmpl.desc+'</span>';
      card.addEventListener('click', ()=>{
        const uid = tmpl.id + '_' + Date.now();
        addedPages.push({ templateId: tmpl.id, uid, label: tmpl.label });
        savePageList();
        insertPage(tmpl.id, uid, tmpl.label);
        closePicker();
      });
      grid.appendChild(card);
    });

    picker.appendChild(grid);
    area.appendChild(trigger);
    area.appendChild(picker);
    sheet.appendChild(area);

    let open = false;
    function openPicker(){
      open = true;
      picker.classList.add('open');
      picker.setAttribute('aria-hidden','false');
      trigger.classList.add('active');
    }
    function closePicker(){
      open = false;
      picker.classList.remove('open');
      picker.setAttribute('aria-hidden','true');
      trigger.classList.remove('active');
    }
    trigger.addEventListener('click', e=>{ e.stopPropagation(); open ? closePicker() : openPicker(); });
    document.addEventListener('click', e=>{ if(open && !picker.contains(e.target)) closePicker(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && open) closePicker(); });
  }

  buildAddPageUI();
  restorePages();

})();

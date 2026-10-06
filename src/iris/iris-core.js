/* ════════════════════════════════════════════════════════════════════════════════
   IRIS core — GENERATED from the reference build's AI panel script
   (kisu1311.github.io/dashboard-enhancement-ai-chat, Option 1, the `ai*` block),
   comments stripped. Do not hand-edit: change iris-build/build-core.js (workspace root, not published) and rebuild.
   It runs as a CLASSIC script on purpose — its markup calls these functions from
   inline onclick="" handlers, so they must be globals. Every host call goes through
   window.IRIS (src/iris/host.js); the ServiceOps copy replaces the ObserveOps copy.
   ════════════════════════════════════════════════════════════════════════════════ */
function toast(m){ IRIS.toast(m); }
function rng(seed){ let s=seed; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
const AI_SPARK_PATH = "<path style=\"fill:url(#aisprkg)\" d=\"M23.9609 0C24.463 0 24.9009 0.343385 25.0235 0.830769C25.3981 2.32146 25.8918 3.77968 26.4997 5.19138C28.0889 8.88369 30.2695 12.1152 33.038 14.8837C35.808 17.6529 39.0388 19.8336 42.7303 21.4228C44.1424 22.0305 45.6008 22.5241 47.0917 22.899C47.5791 23.0215 47.9217 23.4587 47.9217 23.9609C47.9217 24.463 47.5791 24.9009 47.091 25.0235C45.6003 25.3981 44.142 25.8918 42.7303 26.4997C39.038 28.0889 35.8073 30.2695 33.038 33.038C30.2695 35.808 28.0889 39.0388 26.4997 42.7303C25.8917 44.1423 25.3978 45.6008 25.0228 47.0917C24.9634 47.3285 24.8267 47.5388 24.6344 47.6891C24.442 47.8395 24.205 47.9213 23.9609 47.9217C23.4587 47.9217 23.0215 47.5791 22.899 47.091C22.5241 45.6003 22.0302 44.142 21.422 42.7303C19.8336 39.038 17.6537 35.8073 14.8837 33.038C12.1145 30.2695 8.88369 28.0889 5.19138 26.4997C3.77962 25.8917 2.32142 25.3978 0.830769 25.0228C0.593936 24.9636 0.383619 24.8271 0.233136 24.6349C0.0826532 24.4426 0.000608909 24.2057 0 23.9616C0 23.4594 0.343385 23.0223 0.830769 22.8997C2.32148 22.5248 3.7797 22.0309 5.19138 21.4228C8.88369 19.8343 12.1152 17.6537 14.8837 14.8844C17.6529 12.1159 19.8336 8.88443 21.4228 5.19212C22.0305 3.78034 22.5241 2.32213 22.899 0.831508C22.958 0.594415 23.0946 0.38384 23.287 0.233201C23.4793 0.082561 23.7165 0.000485916 23.9609 0Z\"/>";
const AI_SPARK = '<svg viewBox="0 0 48 48">' + AI_SPARK_PATH + '</svg>';
const AI_SPARK_TRAIL = '<circle class="aitrail" cx="24" cy="24" r="29" pathLength="100" stroke-dasharray="26 100"/>';
function aiSparkPaint(){
  document.querySelectorAll('svg[data-aispark]').forEach(el => {
    el.setAttribute('viewBox', '0 0 48 48');
    el.innerHTML = (el.classList.contains('aisprk') ? AI_SPARK_TRAIL : '') + AI_SPARK_PATH;
  });
}
/* the Log Explorer is ObserveOps-only — Iris never runs in it */
function lxK(n){ return String(n); }
function lxAiqParse(){ return null; }
function lxAiqExpr(){ return ''; }
function lxAiqRangeName(){ return ''; }
function lxAiqRows(){ return ''; }
function lxAiqCommit(){}
function lxCsvCell(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function lxFileStamp(){ const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
function lxDownload(name, text, type){
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type }));
        a.download = name; document.body.appendChild(a); a.click(); a.remove(); return true; } catch(e){ return false; }
}
/* the reference's tooltip — data-tip, with a keycap tail ("Send  ↵") — scoped to Iris */
let tipEl = null, tipT = null, tipCur = null;
const IRIS_TIP_SCOPE = '#aiPanel, #aiPeek, #sbAI';
function tipBox(){
  if (!tipEl){ tipEl = document.createElement('div'); tipEl.className = 'tipbox iris-tip'; document.body.appendChild(tipEl); }
  return tipEl;
}
function tipFor(el){
  const t = el.closest && el.closest('[data-tip],[title]');
  if (!t || !t.closest(IRIS_TIP_SCOPE)) return null;
  if (t.hasAttribute('title')){
    const v = t.getAttribute('title');
    if (v && !t.getAttribute('data-tip')) t.setAttribute('data-tip', v);
    t.removeAttribute('title');
  }
  return t.getAttribute('data-tip') ? t : null;
}
function tipEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tipShow(t){
  const raw = t.getAttribute('data-tip'); if (!raw) return;
  const b = tipBox();
  const m = raw.match(/^(.*?)\s{2,}(\S+)$/);
  b.innerHTML = m ? tipEsc(m[1]) + '<span class="tipk">' + tipEsc(m[2]) + '</span>' : tipEsc(raw);
  b.classList.add('on');
  const r = t.getBoundingClientRect(), bw = b.offsetWidth, bh = b.offsetHeight, gap = 8;
  let x, y;
  if (t.closest('#sbAI')){ x = r.right + gap; y = r.top + r.height/2 - bh/2; }
  else { x = r.left + r.width/2 - bw/2; y = (r.bottom + gap + bh < innerHeight) ? r.bottom + gap : r.top - gap - bh; }
  b.style.left = Math.max(6, Math.min(x, innerWidth  - bw - 6)) + 'px';
  b.style.top  = Math.max(6, Math.min(y, innerHeight - bh - 6)) + 'px';
}
function tipHide(){ clearTimeout(tipT); tipCur = null; if (tipEl) tipEl.classList.remove('on'); }
document.addEventListener('mouseover', e => {
  const t = tipFor(e.target);
  if (!t){ if (tipCur) tipHide(); return; }
  if (t === tipCur) return;
  tipHide(); tipCur = t;
  tipT = setTimeout(()=>{ if (tipCur === t && t.isConnected) tipShow(t); }, 320);
});
document.addEventListener('mouseout', e => { if (tipCur && !tipCur.contains(e.relatedTarget)) tipHide(); });
document.addEventListener('mousedown', tipHide);
addEventListener('scroll', tipHide, true);
/* the reference's Escape ladder, for the panel's rungs only */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const p = document.getElementById('aiPanel');
  if (!p || !p.classList.contains('on')) return;
  if (typeof aiDelPending !== 'undefined' && aiDelPending) return aiDelCancel();
  if (p.classList.contains('aifs') && p.classList.contains('aihson')) return aiHsClose();
  if (p.classList.contains('aifs')) return aiFsTog();
  return aiClose();
});
const AI_LOGO = '<svg class="mdlogo" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13.9922 9.99629V0.167969C19.0183 1.00752 22.981 4.97021 23.8205 9.99629H13.9922Z" fill="#F37564"/><path d="M23.9888 12.2574C23.8545 18.7612 18.5373 24 12 24C5.46269 24 0 18.6269 0 12C0 11.3172 0.0559702 10.6455 0.16791 9.99624C1.10821 4.41045 5.91045 0.123134 11.7426 0V4.95895C8.68656 5.0709 6.12314 7.15298 5.29478 9.98504C5.10448 10.6119 5.00373 11.2836 5.00373 11.9888C5.00373 15.8731 8.13808 19.0186 12 19.0186C12.694 19.0186 13.3657 18.9179 14.0038 18.7276C16.8134 17.8881 18.8843 15.3134 18.9962 12.2462H24L23.9888 12.2574Z" fill="currentColor"/></svg>';
function aiInLogs(){
  const v = document.getElementById('view-logexp');
  return !!(v && v.classList.contains('on'));
}
function aiLogScope(){
  const g = (typeof LX_GROUPS !== 'undefined' ? LX_GROUPS : []).slice()
              .sort((a, b) => b.c - a.c);
  const total = g.reduce((n, x) => n + x.c, 0);
  const sev = (typeof LX_FIELDS !== 'undefined'
    ? (LX_FIELDS.find(f => f[0] === 'event.severity') || [])[1] : null) || [];
  return { g: g, total: total, top: g[0], types: g.length, sev: sev,
           range: (document.getElementById('lxRl') || {}).textContent || 'Today' };
}
const AI_CTA_LOGS = [
  ['flag',  'ERROR logs in the last 30 minutes',        'ERROR logs in the last 30 minutes'],
  ['info',  'Failed SSH logins today',                  'Failed SSH logins today'],
  ['wand',  'How many warnings from 192.0.2.165 today?','How many warnings from 192.0.2.165 today?']
];
function aiScope(){ return IRIS.facts(); }


function aiMetrics(){ return IRIS.facts().metrics; }
const aiPct = d => (d > 0 ? 'up ' : 'down ') + Math.abs(d) + '%';
const AI_T = {
  summary:  { ic:'spark', step: s => 'Read ' + s.n + ' widgets and ranked what matters',
              title: () => 'Dashboard summary' },
  rank:     { ic:'flag',  step: () => 'Ranked for your role · deadline first',
              title: () => 'Work on this first' },
  metric:   { ic:'info',  step: () => 'Checked it against its normal range',
              title: m => m.n.charAt(0).toUpperCase() + m.n.slice(1) },
  diff:     { ic:'clock', step: () => 'Diffed every metric against your last visit',
              title: () => 'What changed since your last visit' },
  attention:{ ic:'spark', step: () => 'Ranked for your role, worst first',
              title: () => 'What needs attention' },
  build:    { ic:'wand',  step: () => 'Configured from your description',
              title: n => 'Here’s a preview — ' + n }
};
function aiRoute(q){
  const t = (q || '').toLowerCase();
  if (/summar|handover|overview of this|what does this dashboard/.test(t)) return 'summary';
  if (/work on first|work on|prioriti|first\??$|where do i start/.test(t))  return 'rank';
  if (/chang(ed|e)d? since|last visit|last looked|diff/.test(t))            return 'diff';
  if (/needs? attention|what.?s wrong|anything wrong|worth watching/.test(t))return 'attention';
  if (/\b(create|make|new|build|set ?up|start)\b/.test(t) && /\bdashboard\b/.test(t)
      && !/dashboard\s+with\s+\S+\s*(,|\band\b)/.test(t)) return 'newdash';
  if (/build|create|generate|add a widget|chart of|graph of|grid of|make (a|me)|set up|dashboard with/.test(t)
      || /\badd\b.*\b(chart|widget|graph|grid|donut|gauge|table|map|top ?n|kpi|heat ?map|stream|tile|panel)\b/.test(t))
    return 'build';
  return 'metric';
}
function aiPickMetric(q){
  const ms = aiMetrics();
  if (!ms.length) return null;
  const t = (q || '').toLowerCase();
  return ms.find(m => t.includes(m.n.split(' ')[0].toLowerCase())) || ms[0];
}
function aiSumFacts(){
  const f = IRIS.facts();
  f.pc = (v, t) => t ? Math.round(v / t * 100) : 0;
  return f;
}
function aiBuildAnswer(type, q){
  const s = aiScope(), ms = aiMetrics();
  const inv = m => '<a class="aiinv" onclick="aiInvestigate(' +
    JSON.stringify(m.src || m.n).replace(/"/g, '&quot;') + ')">Investigate →</a>';
  if (type === 'summary'){
    const ws = (WIDGETS[curG] || []).filter(w => w.title && w.t !== 'note');
    const names = ws.slice(0, 3).map(w => w.title).join(', ');
    const f = aiSumFacts();
    const li = [];
    if (f.open != null) li.push('<b>' + f.open + '</b> open requests' +
      (f.overdue != null ? ' — <b>' + f.overdue + '</b> overdue (' + f.pc(f.overdue, f.open) + '%)' : '') +
      (f.unassigned != null ? ', ' + f.unassigned + ' unassigned' : ''));
    else f.kpis.slice(0, 2).forEach(k => li.push('<b>' + aiEsc(k.v) + '</b> ' + aiEsc(k.n)));
    if (f.sla) li.push('SLA compliance is <b>' + aiEsc(f.sla) + '</b>' + (f.slaBad ? ' — below its target' : ' — on target'));
    if (f.top) li.push('<b>' + aiEsc(f.top.n) + '</b> is the single biggest share of ' + aiEsc(f.top.w) + ' — <b>' +
      f.top.v + '</b> on its own');
    const worst = f.metrics.find(m => m.bad && m.d > 0);
    if (worst) li.push('Most of the pressure is on <b>' + aiEsc(worst.n) + '</b>, ' + aiPct(worst.d) + ' week-over-week');
    li.push('The rest of the board is inside its normal band');
    return { step: AI_T.summary.step(s), ic: 'spark', title: AI_T.summary.title(),
      html: '<div class="aisumeta">' + aiEsc(s.dash) + ' \u00b7 ' +
          ws.length + ' widget' + (ws.length === 1 ? '' : 's') + ' \u00b7 ' +
          aiEsc(s.time) + '</div>' +
        '<p>Covers ' + names + (ws.length > 3 ? ' and <b>' + (ws.length - 3) + '</b> more' : '') + '.</p>' +
        '<h4>How it reads right now</h4><ul>' +
        li.map(x => '<li>' + x + '</li>').join('') + '</ul>',
      fu: ['What should I work on first?', 'What changed since I last looked', 'Draft a status update'] };
  }
  if (type === 'rank'){
    return { step: AI_T.rank.step(), ic: 'flag', title: AI_T.rank.title(),
      html: '<ol class="airank">' + ms.slice(0, 5).map((m, i) =>
        '<li><span class="rn">' + (i + 1) + '</span><div><b>' + m.n + ' ' + aiPct(m.d) + ' week-over-week</b>' +
        '<i>' + (m.bad ? 'Moving the wrong way week-over-week.' : 'Inside its normal band.') + '</i>' + inv(m) + '</div></li>').join('') + '</ol>',
      fu: ['Turn this into a recovery plan', 'Draft a status update', 'What needs attention'] };
  }
  if (type === 'diff'){
    return { step: AI_T.diff.step(), ic: 'clock', title: AI_T.diff.title(),
      sub: '<span class="aisub2">◷ Last visit: 2 days ago at 9:12 AM</span>',
      html: '<div class="aidelta">' + (function(){
        const by = ms.slice().sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
        const rows = by.slice(0, 3);
        const best = ms.slice().sort((a,b)=>a.d-b.d)[0];
        if (best && !best.bad && rows.indexOf(best) < 0) rows.push(best);
        return rows;
      })().map(m =>
        '<div class="aidr"><span class="ar ' + (m.bad ? 'up' : 'dn') + '">' + (m.d > 0 ? '↑' : '↓') + ' ' +
        (m.d > 0 ? '+' : '') + m.d + '%</span><b>' + m.n + '</b><i>Now ' + m.v + '</i></div>').join('') + '</div>',
      fu: ['Why did that rise?', 'Show the records behind it', 'Turn this into a recovery plan'] };
  }
  if (type === 'attention'){
    return { step: AI_T.attention.step(), ic: 'spark',
      title: AI_T.attention.title(), sub: '<span class="aiupd">updated just now</span>',
      html: ms.slice(0, 3).map(m =>
        '<div class="aiatt"><b>' + m.n + ' ' + aiPct(m.d) + ' week-over-week</b>' +
        '<span class="chip">▦ ' + m.src + '</span>' + inv(m) + '</div>').join(''),
      fu: ['What should I work on first?', 'What changed since I last looked', 'Draft a status update'] };
  }
  if (type === 'newdash') return { newdash: aiDashSpec(q) };
  if (type === 'build') return { build: aiBuildSpec(q) };
  const m = aiPickMetric(q);
  if (!m) return { step: 'Looked at this dashboard', ic: 'info', title: 'Nothing to report',
                   html: '<p>This board has no counters I can compare against a baseline.</p>', fu: ['Summarise this dashboard'] };
  return { step: AI_T.metric.step(), ic: 'info', title: AI_T.metric.title(m),
    html: '<p><b>' + m.n + '</b> is currently <b>' + m.v + '</b>, ' + aiPct(m.d) + ' vs last week.</p>' +
      '<p>' + (m.bad
        ? 'It’s flagged as needing attention — this is one to act on rather than watch.'
        : 'It’s inside its normal band — worth watching, not acting on.') + '</p>' +
      '<p>For context, this counts ' + m.def + '.</p>' + inv(m),
    fu: ['Show the requests behind ' + m.n, 'Which technicians own most of it?', 'Build a widget for ' + m.n.toLowerCase()] };
}
const AI_CHART_WORD = [
  [/\bgrid\b|\btable\b/i, 5], [/time.?series|over time|\btrend\b/i, 2], [/\bline\b/i, 2], [/\bbar\b/i, 1],
  [/\bcolumn\b/i, 0], [/\bdoughnut\b|\bdonut\b|\bpie\b/i, 3], [/\bkpi\b|\bnumber\b/i, 4]
];
function aiBuildSpec(q){
  const s = String(q || '');
  let chart = 0;
  for (const [re, i] of AI_CHART_WORD) if (re.test(s)) { chart = i; break; }
  const multi = s.match(/dashboard\s+with\s+(.+?)(?:\s+widgets?)?$/i);
  if (multi){
    const parts = multi[1].split(/,|\band\b/).map(x => x.trim()).filter(Boolean);
    if (parts.length > 1){
      return { dash: true, chart: chart,
               items: parts.map(p => p.charAt(0).toUpperCase() + p.slice(1) + (/request|ticket|sla|technician/i.test(p) ? '' : ' requests')) };
    }
  }
  let name = (s.match(/(?:grid|chart|graph|widget)\s+(?:of|for)\s+(.+)$/i)
           || s.match(/(?:of|for)\s+(.+)$/i) || [])[1] || 'Overdue requests';
  name = name.replace(/\s+for\s+the\s+last\s+.+$/i, '')
             .replace(/\s+(?:through|via|using|from|in)\s+(?:the\s+)?chat\b/i, '')
             .replace(/\s+widgets?$/i, '').replace(/[?.]$/, '').trim();
  return { name: name || 'Overdue requests', chart: chart };
}
function aiLogQ(q){
  const t = String(q || '').trim();
  if (/^why\b/i.test(t)) return null;
  if (/noisi|busiest|loudest|summar|overview|severity mix/i.test(t)) return null;
  if (typeof lxAiqParse !== 'function') return null;
  const m = lxAiqParse(t);
  if (!m) return null;
  if (!m.clauses.length && !m.agg && /^(which|what|who|how|when)\b/i.test(t)) return null;
  return m;
}
function aiLogQHTML(g){
  const rn = lxAiqRangeName(g.range), expr = lxAiqExpr(g);
  return { step: g.agg ? 'Converted your question into a log query'
                       : 'Converted your question into a log filter', ic: 'wand',
    title: g.agg ? 'Log query' : 'Log search query',
    html: '<p>Here is what I would run on <b>Log Search</b>. Nothing is applied yet.</p>' +
      '<div class="ailq' + (expr ? '' : ' all') + '">' + (expr ? aiEsc(expr) : 'All events') + '</div>' +
      lxAiqRows(g) +
      '<div class="ailqm">Time range · <b>' + aiEsc(rn || 'unchanged') + '</b></div>',
    lq: g,
    fu: ['Which log type is noisiest?', 'Give me a summary of these logs'] };
}
function aiLogQApply(i){
  const m = aiThread[i]; const g = m && m.lq; if (!g || g.applied) return;
  if (typeof lxAiqCommit !== 'function') return;
  g.applied = 1;
  lxAiqCommit(g);
  aiRender();
}
function aiLogQEdit(i){
  const m = aiThread[i]; const g = m && m.lq; if (!g) return;
  const el = document.getElementById('aiIn');
  if (el){ el.value = g.q; aiGrow(el); el.focus(); }
}
function aiLogKind(q, type){
  const t = String(q || '').toLowerCase();
  if (/noisi|busiest|loudest|top |most |which log type|by volume|rank/.test(t)) return 'rank';
  if (/severit|error|critical|warning|\blevel|debug|informational/.test(t))    return 'metric';
  if (/summar|overview|what.?s coming|what is coming|what.?s happening/.test(t)) return 'summary';
  return (type === 'rank' || type === 'attention') ? 'rank' : (type === 'metric' ? 'metric' : 'summary');
}
function aiLogAnswer(type, q){
  type = aiLogKind(q, type);
  const L = aiLogScope(), top = L.g.slice(0, 5);
  const pct = v => Math.round(v / L.total * 100) + '%';
  if (type === 'rank' || type === 'attention'){
    return { step: 'Ranked ' + L.types + ' log types by volume', ic: 'flag',
      title: 'Noisiest log types',
      html: '<ol class="airank">' + top.map((g, i) =>
        '<li><span class="rn">' + (i + 1) + '</span><div><b>' + aiEsc(g.n) + ' — ' + lxK(g.c) +
        ' events</b><i>' + pct(g.c) + ' of everything ingested over ' + aiEsc(L.range) +
        '.</i><a class="aiinv" onclick="lxPickType(' +
        JSON.stringify(g.kids[0][0]).replace(/"/g, '&quot;') + ')">Open in Log Search →</a></div></li>').join('') +
        '</ol>',
      fu: ['What severities am I seeing?', 'Summarise these logs', 'Build a widget of log events by type'] };
  }
  if (type === 'metric'){
    const sev = L.sev.slice(0, 5), tot = L.sev.reduce((n, x) => n + x[1], 0) || 1;
    return { step: 'Read the severity breakdown', ic: 'info', title: 'Severity mix',
      html: '<div class="aidelta">' + sev.map(x =>
        '<div class="aidr"><span class="ar ' + (/err|crit|alert|emerg/i.test(x[0]) ? 'up' : 'dn') + '">' +
        Math.round(x[1] / tot * 100) + '%</span><b>' + aiEsc(x[0]) + '</b><i>' +
        x[1].toLocaleString() + ' events</i></div>').join('') + '</div>' +
        '<p>Parsed from <b>event.severity</b> over ' + aiEsc(L.range) + '.</p>',
      fu: ['Which log type is noisiest?', 'Summarise these logs'] };
  }
  return { step: 'Read ' + L.types + ' log types and ranked what matters', ic: 'spark',
    title: 'Log summary', html:
      '<h4>What is coming in</h4><ul>' +
      '<li><b>' + lxK(L.total) + '</b> events across <b>' + L.types + '</b> log types, ' +
        aiEsc(L.range).toLowerCase() + '</li>' +
      '<li>Busiest is <b>' + aiEsc(L.top.n) + '</b> at <b>' + lxK(L.top.c) + '</b> (' +
        pct(L.top.c) + ' of the total)</li>' +
      '<li>Top five together are <b>' +
        pct(top.reduce((n, g) => n + g.c, 0)) + '</b> of everything</li></ul>' +
      '<h4>How it reads</h4><ul>' +
      '<li>' + top.slice(1, 4).map(g => aiEsc(g.n) + ' (' + lxK(g.c) + ')').join(', ') +
        ' follow the leader</li>' +
      '<li>The long tail is <b>' + (L.types - 5) + '</b> quieter types</li></ul>',
    fu: ['Which log type is noisiest?', 'What severities am I seeing?',
         'Build a widget of log events by type'] };
}
const AI_DASH_CATS = () => IRIS.cats();
const AI_DASH_FONTS = ['Small', 'Medium', 'Large'];
function aiDashSpec(q){
  const s = String(q || '');
  let n = (s.match(/(?:called|named|for)\s+"?([^"?.]+)"?\s*$/i) || [])[1] || '';
  n = n.replace(/\bdashboard\b/ig, '').trim();
  return { name: n || 'New dashboard', cat: AI_DASH_CATS()[0] || 'Service Desk',
           sec: 'Private', font: 'Small', hgap: 10, vgap: 10, row: 60,
           land: false, state: 'plan' };
}
function aiDashSet(k, v){
  const d = aiDashState(); if (!d) return;
  d[k] = v; aiRender();
}
function aiDashState(){
  for (let i = aiThread.length - 1; i >= 0; i--) if (aiThread[i].r === 'dash') return aiThread[i].d;
  return null;
}
const AI_DASH_FU = [
  [/sla|breach|response|resolution/i, [
    'Build an SLA violated chart by priority',
    'Build a resolution time trend chart',
    'Build a Top N of technicians by overdue requests' ]],
  [/technician|team|workload|agent/i, [
    'Build a technician workload chart',
    'Build a Top N of technicians by open requests',
    'Build a resolved requests trend chart' ]],
  [/change|cab|release/i, [
    'Build a changes by status donut',
    'Build a Top N of change categories',
    'Build an emergency changes KPI' ]],
  [/problem|incident|major/i, [
    'Build an incidents by priority chart',
    'Build a problems by status donut',
    'Build a reopened requests trend chart' ]],
  [/asset|patch|hardware|software|contract/i, [
    'Build an assets by status donut',
    'Build a patch compliance chart',
    'Build a Top N of expiring contracts' ]],
];
function aiDashFu(d){
  const hit = AI_DASH_FU.find(([re]) => re.test(d.name || ''));
  return hit ? hit[1] : [
    'Build an open requests by status donut',
    'Build a requests by priority chart',
    'Build a Top N of technicians by open requests' ];
}
function aiDashFuGo(btn){
  const q = btn.textContent.replace(/^\u203a?\s*/, '').trim();
  const d = aiDashState();
  if (d && d.name && DASH_INDEX[d.name]) aiDashGo(d.name);
  aiPush(q);
}
function aiDashFuPick(btn){
  const q = btn.textContent.replace(/^›\s*/, '').trim();
  const el = document.getElementById('aiIn');
  if (el){ el.value = q; el.focus(); aiMentIn(el); }
  toast('Queued — approve the dashboard, then send it');
}
function aiDashHTML(d, i){
  if (d.state === 'done'){
    const nq = aiEsc(d.name).replace(/"/g, '&quot;');
    const tw = aiTwOn(aiThread[i], 'done');
    return '<div class="aistep">Created</div>' +
      '<div class="aians' + (tw ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="done"' +
        (tw ? ' onclick="aiTwSkip()"' : '') + '><div class="aiat"><span class="sp"><svg viewBox="0 0 24 24" class="ln">' +
        AI_IC.wand + '</svg></span>Dashboard created — “' + aiEsc(d.name) + '”</div>' +
      '<div class="aiab"><p>Your new dashboard <b>“' + aiEsc(d.name) + '”</b> has been created in <b>' +
        aiEsc(d.cat) + '</b>.</p>' +
      '<p>You can view it here: <a class="ailink" onclick="aiDashGo(&quot;' + nq + '&quot;)">' +
        aiEsc(d.name) + '</a></p>' +
      '<p>It is currently empty — add widgets and they go straight onto the board.</p></div>' +
      aiFbHTML(i, 0,
        undefined,
        '<button class="wlbl" title="Undo — delete “' + aiEsc(d.name).replace(/"/g,'&quot;') + '”" ' +
          'onclick="aiDashUndo()"><svg viewBox="0 0 24 24" class="ln">' +
          '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>' +
          '<span>Undo</span></button>') +
      (i === aiThread.length - 1
        ? '<div class="aiful">Follow ups</div>' +
          '<button class="aifu" onclick="aiDashAddW(&quot;' + nq + '&quot;)">' +
            '<span class="cv">\u203a</span>Add a widget</button>' +
          aiDashFu(d).map(q => '<button class="aifu" onclick="aiDashFuGo(this)">' +
            '<span class="cv">\u203a</span>' + aiEsc(q) + '</button>').join('')
        : '') +
      '</div>';
  }
  if (d.state === 'cancelled'){
    const twc = aiTwOn(aiThread[i], 'cancel');
    return '<div class="aistep">Cancelled</div>' +
      '<div class="aians' + (twc ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="cancel"' +
        (twc ? ' onclick="aiTwSkip()"' : '') + '><div class="aiab"><p>Nothing was created.</p></div>' +
      '<div class="aiacts"><button class="aialt" onclick="aiDashSet(\'state\',\'plan\')">Show the plan again</button></div></div>';
  }
  const editing = d.state === 'edit';
  const fld = (label, inner) => '<div class="aidf"><span class="k">' + label + '</span>' + inner + '</div>';
  const ro   = v => '<b>' + aiEsc(String(v)) + '</b>';
  const params = editing
    ? fld('Dashboard Name', '<input value="' + aiEsc(d.name).replace(/"/g,'&quot;') +
          '" oninput="aiDashSet(\'name\',this.value)" />') +
      fld('Category', '<select onchange="aiDashSet(\'cat\',this.value)">' +
          AI_DASH_CATS().map(c => '<option' + (c===d.cat?' selected':'') + '>' + c + '</option>').join('') + '</select>') +
      fld('Security', '<span class="aiseg">' + ['Public','Private'].map(x =>
          '<button class="' + (d.sec===x?'on':'') + '" onclick="aiDashSet(\'sec\',\'' + x + '\')">' + x + '</button>').join('') + '</span>')
    : fld('Dashboard Name', ro(d.name)) + fld('Category', ro(d.cat)) + fld('Security', ro(d.sec));
  const twp = aiTwOn(aiThread[i], 'plan');
  return (d.tk ? '' : '<div class="aistep">Planned a new dashboard</div>') +
    '<div class="aians' + (twp ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="plan"' +
      (twp ? ' onclick="aiTwSkip()"' : '') + '><div class="aiat"><span class="sp"><svg viewBox="0 0 24 24" class="ln">' +
      AI_IC.wand + '</svg></span>Plan · Create dashboard</div>' +
    '<div class="aiab"><ol class="aidsteps">' +
      '<li>Create a dashboard named <b>' + aiEsc(d.name) + '</b> in category <b>' + aiEsc(d.cat) + '</b></li>' +
      '<li>Set visibility to <b>' + aiEsc(d.sec) + '</b></li>' +
    '</ol></div>' +
    '<div class="aidform">' + params + '</div>' +
    '<div class="aidwarn">⚠ This creates a new dashboard. Existing dashboards are not touched.</div>' +
    aiFbHTML(i, 0) +
    '<div class="aiful">Follow ups</div>' +
    '<button class="aifu" onclick="aiDashSet(\'state\',\'cancelled\')">' +
      '<span class="cv">›</span>Cancel — don’t create it</button>' +
    '</div>';
}
function aiDashApprove(){
  const d = aiDashState(); if (!d) return;
  const name = (d.name || '').trim();
  if (!name){ toast('Dashboard Name is required'); aiDashSet('state', 'edit'); return; }
  if (DASH_INDEX[name]){
    toast('“' + name + '” already exists — rename it in Edit'); aiDashSet('state', 'edit'); return;
  }
  const p = d.sec === 'Private' ? 1 : 0;
  d.prev = dashState.cur;
  IRIS.createDash({ name: name, cat: d.cat, sec: d.sec });
  d.name = name; d.state = 'done';
  aiRender();
  toast('✓ Dashboard “' + name + '” created in ' + d.cat + (p ? ' · Private' : ' · Public') +
    ' · header ' + d.font + ' · gaps ' + d.hgap + '/' + d.vgap + 'px · row ' + d.row + 'px' +
    (d.land ? ' · default landing' : ''));
}
function aiDashGo(name){
  if (!DASH_INDEX[name]){ toast('“' + name + '” is not there any more'); return; }
  const p = document.getElementById('aiPanel');
  if (p && p.classList.contains('aifs')) aiFsTog();
  IRIS.go(name);
}
function aiDashAddW(name){
  aiDashGo(name);
  if (!DASH_INDEX[name]) return;
  aiClose(); IRIS.openAddWidget();
}
function aiDashUndo(){
  const d = aiDashState(); if (!d || d.state !== 'done') return;
  const name = d.name;
  const here = dashState.cur === name;
  IRIS.deleteDash(name);
  if (here && d.prev && DASH_INDEX[d.prev]) IRIS.go(d.prev);
  d.state = 'cancelled';
  aiRender();
  toast('Undone — “' + name + '” was removed');
}
const AI_GROUPS = ['By priority', 'By status', 'By technician', 'By technician group', 'By category', 'By site'];
const AI_CHARTS = ['Column', 'Bar', 'Line', 'Doughnut', 'KPI', 'Table'];
let aiBuildState = null;
const AI_CLAR = [
  { k:'group', q:'How should I group it?',
    sub:'That’s the one thing I can’t read from your description.', opts: AI_GROUPS },
  { k:'states', q:'Which states should it count?', multi:1, def:[0],
    sub:'Pick as many as you need — each one becomes its own series.',
    opts:['Open','In Progress','Pending','Overdue'] },
  { k:'range', q:'Over what time range?',
    sub:'The widget inherits the dashboard’s range unless you pin one.',
    opts:['Follow the dashboard','Last 1 hour','Last 24 hours','Last 7 days','Last 30 days'] },
  { k:'chart', q:'How should it be drawn?',
    sub:'You can still switch this on the preview.',
    opts:['Column','Bar','Line','Doughnut','KPI','Table'] },
];
function aiAskGroup(name, chart){
  aiThread.push({ r:'clarify', name:name, chart:chart || 0, step:0, ans:{},
                  sel:null, free:'', msel:[] });
  aiClarRestore(aiThread[aiThread.length - 1]);
  aiRender();
}
function aiClarCur(){
  for (let i = aiThread.length - 1; i >= 0; i--) if (aiThread[i].r === 'clarify') return aiThread[i];
  return null;
}
function aiClarPick(i){
  const c = aiClarCur(); if (!c) return;
  c.sel = i; c.free = '';
  aiRender();
}
function aiClarFree(el){
  const c = aiClarCur(); if (!c) return;
  c.free = el.value; c.sel = el.value.trim() ? -1 : null;
  const stf = AI_CLAR[c.step];
  if (stf && stf.multi && el.value.trim() && c.msel.length){ c.msel = []; aiRender(); return; }
  const card = document.querySelector('.aicq');
  if (card) card.querySelectorAll('.aicqo').forEach((b, i) =>
    b.classList.toggle('on', c.sel === i));
  const fr = document.querySelector('.aicqf');
  if (fr) fr.classList.toggle('on', c.sel === -1);
}
function aiClarKey(e){
  e.stopPropagation();
  if (e.key === 'Enter'){ e.preventDefault(); aiClarNext(); }
}
function aiClarRestore(c){
  const st = AI_CLAR[c.step]; if (!st) return;
  const prev = c.ans[st.k];
  if (st.multi){
    if (prev === undefined){ c.msel = (st.def || [0]).slice(); c.sel = null; c.free = ''; return; }
    const names = String(prev).split(' + ');
    const idx = names.map(n => st.opts.indexOf(n)).filter(i => i > -1);
    if (!idx.length){ c.msel = []; c.sel = -1; c.free = prev; return; }
    c.msel = idx; c.sel = null; c.free = '';
    return;
  }
  c.msel = [];
  if (prev === undefined){ c.sel = null; c.free = ''; return; }
  const i = st.opts.indexOf(prev);
  if (i > -1){ c.sel = i; c.free = ''; }
  else { c.sel = -1; c.free = prev; }
}
function aiClarBack(){
  const c = aiClarCur(); if (!c || !c.step) return;
  c.step--; aiClarRestore(c);
  aiRender();
}
function aiClarSkip(){ aiClarNext(1); }
function aiClarNext(skip){
  const c = aiClarCur(); if (!c) return;
  const st = AI_CLAR[c.step];
  if (st.multi){
    const picked = (c.sel === -1 && c.free.trim()) ? c.free.trim()
                 : c.msel.map(i => st.opts[i]).join(' + ');
    if (!skip && picked) c.ans[st.k] = picked;
    else if (c.ans[st.k] === undefined) c.ans[st.k] = (st.def || [0]).map(i => st.opts[i]).join(' + ');
    c.step++; c.sel = null; c.free = ''; c.msel = [];
    if (c.step < AI_CLAR.length){ aiClarRestore(c); aiRender(); return; }
    return aiClarLand(c);
  }
  if (!skip && c.sel === null && !c.free.trim()) skip = 1;
  if (!skip) c.ans[st.k] = (c.sel === -1 && c.free.trim()) ? c.free.trim() : st.opts[c.sel];
  else if (c.ans[st.k] === undefined) c.ans[st.k] = st.opts[st.def ? st.def[0] : 0];
  c.step++; c.sel = null; c.free = ''; c.msel = [];
  if (c.step < AI_CLAR.length){ aiClarRestore(c); aiRender(); return; }
  return aiClarLand(c);
}
function aiClarLand(c){
  const ix = aiThread.indexOf(c);
  if (ix >= 0) aiThread.splice(ix, 1);
  aiThread.push({ r:'me', t: AI_CLAR.map(x => c.ans[x.k]).filter(Boolean).join(' · ') });
  const cs = AI_CLAR.find(x => x.k === 'chart');
  const ci = cs ? cs.opts.indexOf(c.ans.chart) : -1;
  aiBuildState = { name: c.name, group: c.ans.group, range: c.ans.range,
                   states: c.ans.states, chart: ci > -1 ? ci : (c.chart || 0) };
  aiThread.push({ r:'build', b: aiBuildState });
  aiRender();
  aiBuildAuto();
}
function aiPickGroup(i){
  const c = aiClarCur(); if (!c) return;
  c.ans.group = AI_GROUPS[i]; c.step = 1; c.sel = 0; c.free = '';
  aiRender();
}
function aiBuildChart(i){
  if (!aiBuildState) return;
  aiBuildState.chart = i; aiRender();
}
let aiAuto = false, aiThread = [], aiBusy = false;
function aiSetBusy(v){
  aiBusy = !!v;
  const box = document.querySelector('.aiinbox');
  if (box) box.classList.toggle('gen', aiBusy);
  const b = document.getElementById('aiSendBtn');
  if (b){
    b.classList.toggle('aisndstop', aiBusy);
    b.innerHTML = aiBusy ? AI_STOP_SVG : AI_SEND_SVG;
    b.setAttribute('data-tip', aiBusy ? 'Stop generating' : 'Send  ↵');
    b.removeAttribute('title');
  }
}
const AI_SEND_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12l16-7-7 16-2-7-7-2Z"/></svg>';
const AI_STOP_SVG =
  '<svg viewBox="9 9 6 6"><rect x="9" y="9" width="6" height="6" rx="1"/></svg>';
function aiSendOrStop(){ aiBusy ? aiStop() : aiSend(); }
function aiStop(){
  aiTkCancel(); aiAgStop();
  const last = aiThread[aiThread.length - 1];
  if (last && (last.r === 'tk' || (last.r === 'agent' && last.a.state === 'run'))) aiThread.pop();
  const q = (aiThread.filter(m => m.r === 'me').pop() || {}).t || '';
  aiThread.push({ r:'stopped', q: q });
  aiSetBusy(false);
  aiRender();
  toast('Stopped');
}
function aiStopGo(i){
  const m = aiThread[i]; if (!m) return;
  const q = m.q; aiThread.pop();
  const last = aiThread[aiThread.length - 1];
  if (last && last.r === 'me' && last.t === q) aiThread.pop();
  aiRender();
  aiPush(q);
}
function aiStopEdit(i){
  const m = aiThread[i]; if (!m) return;
  const el = document.getElementById('aiIn');
  if (el){ el.value = m.q; aiGrow(el); el.focus(); }
}
function aiStopHTML(m, i){
  return '<div class="aistop"><span class="ic"><svg viewBox="0 0 24 24">' +
    '<rect x="7" y="7" width="10" height="10" rx="2"/></svg></span>' +
    'Stopped before it finished. Nothing was created.' +
    '<div class="aiacts">' +
      '<button class="aialt" onclick="aiStopGo(' + i + ')">Continue</button>' +
      '<button class="aialt" onclick="aiStopEdit(' + i + ')">Edit prompt</button>' +
    '</div></div>';
}
const AI_WHO = IRIS.user();
const AI_MODULES = ['All modules', 'Dashboard', 'Requests', 'Problems', 'Changes',
                    'Releases', 'Assets', 'Projects', 'Knowledge', 'Reports'];
let aiScopeSel = ['Dashboard'], aiScopeCur = 'Dashboard', aiCtxItems = [];
function aiScopeSync(){
  if (!aiScopeSel.length) aiScopeSel = ['All modules'];
  aiScopeCur = aiScopeSel.join(', ');
}
function aiScopeHas(mod){
  return aiScopeSel.indexOf('All modules') > -1 || aiScopeSel.indexOf(mod) > -1;
}
function aiScopeChip(){
  return aiScopeSel.length > 1 ? aiScopeSel[0] + ' +' + (aiScopeSel.length - 1) : aiScopeSel[0];
}
const AI_CLIP = '<svg class="fic" viewBox="0 0 24 24"><path d="M21.4 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
const AI_NEEDS = [
  [/\bproblems?\b|root cause|known error/i,           'Problems'],
  [/\bchanges?\b|\bcab\b|change window/i,              'Changes'],
  [/\breleases?\b|deployment|rollout/i,               'Releases'],
  [/\bassets?\b|hardware|software licen|patch|contract/i, 'Assets'],
  [/\bprojects?\b|milestone|task board/i,             'Projects'],
  [/\bknowledge\b|\bkb\b|article/i,                    'Knowledge'],
  [/\brequests?\b|tickets?|incidents?|\bsla\b|overdue|unassigned|technician/i, 'Requests']
];
function aiScopeNeeds(q){
  if (aiScopeHas('All modules')) return null;
  for (const [re, mod] of AI_NEEDS) if (re.test(q) && !aiScopeHas(mod)) return mod;
  return null;
}
const AI_DOMAIN = /request|ticket|incident|problem|change|release|sla|breach|overdue|due|unassigned|assign|technician|group|queue|backlog|priority|urgent|status|open|pending|resolv|reopen|close|csat|satisfaction|mttr|response|resolution|escalat|category|site|requester|approval|asset|patch|contract|project|knowledge|dashboard|widget|report|counter|metric|trend|volume|spike|anomaly|forecast|build|create|make|generate|chart|grid|graph|table|kpi|summar|explain|what changed|attention|first|status update|recovery plan|handover/i;
function aiInScope(q){ return AI_DOMAIN.test(String(q || '')); }
function aiCtxBar(){
  const el = document.getElementById('aiCtx'); if (!el) return;
  aiCtxFloor();
  const floor = aiCtxIsFloor();
  el.innerHTML =
    aiCtxItems.map((c, i) =>
      '<span class="aictx" title="' +
        (floor ? 'Default context — the chat reads every module until you pin something'
               : aiEsc(c.k) + ': ' + aiEsc(c.n)) + '">' +
      '<svg class="tic" viewBox="0 0 24 24" style="color:' + (AI_ENT_C[c.k] || 'var(--teal)') + '">' +
        aiEntIc(c.k) + '</svg>' +
      '<span class="nm">' + aiEsc(c.n) + '</span>' +
      (floor ? '' :
        '<button title="Remove from context" onclick="aiCtxRemove(' + i + ')">✕</button>') +
      '</span>').join('');
}
function aiCtxIsFloor(){
  return aiCtxItems.length === 1 && aiCtxItems[0].k === 'module' && aiCtxItems[0].n === 'All modules';
}
function aiCtxFloor(){
  if (aiCtxItems.length) return;
  aiCtxItems = [{ n: 'All modules', k: 'module' }];
  aiScopeSel = ['All modules']; aiScopeSync(); aiScopeLine();
}
function aiScopeMenu(ev){
  ev.stopPropagation();
  const old = document.getElementById('aiScopeM');
  if (old){ old.remove(); return; }
  const m = document.createElement('div');
  m.className = 'aicmd up'; m.id = 'aiScopeM';
  m.innerHTML = aiScopeMenuHTML();
  document.querySelector('.aicomp').appendChild(m);
  setTimeout(() => document.addEventListener('mousedown', aiScopeAway), 0);
}
const AI_BOX   = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>';
const AI_BOXON = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.4 12.2l2.6 2.5 4.6-5.1"/></svg>';
function aiScopeMenuHTML(){
  return '<div class="hd">Context · global, and any module with it</div>' +
    '<div class="mnote">Type <b>@</b> in the box to pin one dashboard, widget, monitor, ' +
      'metric, service or incident.</div>' +
    AI_MODULES.map((n, i) => (i === 1 ? '<hr>' : '') +
      '<button class="' + (aiScopeSel.indexOf(n) > -1 ? 'on' : '') + '" onclick="aiScopePick(' +
      JSON.stringify(n).replace(/"/g, '&quot;') + ',event)"><span class="k">' +
      (aiScopeSel.indexOf(n) > -1 ? AI_BOXON : AI_BOX) + '</span>' + n + '</button>').join('');
}
function aiScopeAway(e){
  if (e.target.closest('#aiScopeM') || e.target.closest('.aiscp')) return;
  const m = document.getElementById('aiScopeM'); if (m) m.remove();
  document.removeEventListener('mousedown', aiScopeAway);
}
function aiScopePick(n, ev){
  if (ev) ev.stopPropagation();
  const set = new Set(aiScopeSel);
  if (set.has(n)) set.delete(n); else set.add(n);
  aiScopeSel = AI_MODULES.filter(x => set.has(x));
  aiScopeSync();
  const m = document.getElementById('aiScopeM'); if (m) m.innerHTML = aiScopeMenuHTML();
  aiCtxBar();
  toast(aiScopeHas('All modules') ? 'Context: every module'
      : aiScopeSel.length > 1 ? 'Context: ' + aiScopeSel.length + ' modules — ' + aiScopeCur
      : 'Context: ' + aiScopeCur + ' only');
}
const AI_ENT_IC = {
  technician:'<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  group:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  request:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  sla:'<path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"/><path d="M9 17H4v5"/>',
  dashboard:'<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  widget:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  monitor:'<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  metric:'<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  service:'<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  incident:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  alert:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  module:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
  file:'<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>'
};
function aiEntIc(k){ return AI_ENT_IC[/^file/.test(k || '') ? 'file' : k] || AI_ENT_IC.file; }
const AI_ENT_C = { technician:'var(--green)', group:'var(--cyan)', request:'var(--orange)', sla:'var(--purple)',
                   dashboard:'var(--teal)', widget:'var(--blue)', monitor:'var(--green)',
                   metric:'var(--purple)', service:'var(--cyan)', incident:'var(--red)',
                   alert:'var(--red)', pattern:'var(--orange)',
                   module:'var(--ai-2)' };
const AI_ENT_FIXED = [
  {t:'technician', n:'Priya Nair',                   s:'Service Desk · 14 open'},
  {t:'technician', n:'Rahul Shah',                   s:'Network · 11 open'},
  {t:'technician', n:'Sneha Iyer',                   s:'Hardware · 9 open'},
  {t:'group',      n:'Service Desk',                 s:'Technician group · 6 members'},
  {t:'group',      n:'Network Operations',           s:'Technician group · 4 members'},
  {t:'request',    n:'#REQ-4821 · VPN drops on Wi-Fi', s:'Urgent · overdue 2h'},
  {t:'request',    n:'#REQ-4805 · Laptop not booting', s:'High · due today'},
  {t:'request',    n:'#INC-1290 · Email outage',     s:'Urgent · major incident'},
  {t:'sla',        n:'Urgent — 4h resolution',       s:'SLA policy · 3 at risk'},
  {t:'sla',        n:'High — 8h resolution',         s:'SLA policy · 1 violated'}
];
const AI_MOD_S = { 'All modules':'the whole product', 'Dashboard':'boards and widgets',
  'Requests':'tickets, SLAs and technicians', 'Problems':'root causes and known errors',
  'Changes':'change requests and CAB', 'Releases':'deployments and rollouts',
  'Assets':'hardware, software and patches', 'Projects':'projects and tasks',
  'Knowledge':'articles and FAQs', 'Reports':'scheduled and saved reports' };
function aiEntList(){
  const cur = dashState.cur;
  const dash = [];
  DASH_GROUPS.forEach(g => g.items.forEach(it =>
    dash.push({ t:'dashboard', n: it[0], s: (it[0] === cur ? 'this dashboard · ' : '') + g.name })));
  dash.sort((a, b) => (b.n === cur) - (a.n === cur));
  const mods = AI_MODULES.map(n => ({ t:'module', n: n,
    s: aiScopeSel.indexOf(n) > -1 ? 'Module · already in context'
                                  : 'Module · ' + (AI_MOD_S[n] || '') }));
  const out = dash.length ? [dash.shift()].concat(mods, dash) : mods;
  const gi = (typeof curG === 'number' ? curG : 0);
  ((typeof WIDGETS !== 'undefined' && WIDGETS[gi]) || []).forEach(w => {
    if (w.title && w.t !== 'note') out.push({ t:'widget', n: w.title, s: (w.t || 'widget') + ' · ' + cur });
  });
  return out.concat(AI_ENT_FIXED);
}
let aiMent = [], aiMentSel = 0;
let aiMentSeed = -1;
function aiMentIn(t){
  aiGrow(t);
  const upto = t.value.slice(0, t.selectionStart);
  const m = /@([\w.\- ]{0,28})$/.exec(upto);
  if (!m){ aiMentHide(); aiSuggIn(t.value); return; }
  aiSuggHide();
  aiMentShow(m[1]);
}
const AI_SUGG_BASE = [
  'Summarise this dashboard', 'What should I work on first?',
  'What changed since I last looked', 'What needs attention',
  'Draft a status update', 'Turn this into a recovery plan',
  'Create a time-series widget for SLA metrics',
  'Build a line chart of requests created for the last 30 days',
  'Create a widget for requests by priority', 'Add a chart of overdue requests',
  'Build me a grid of open requests', 'Make a dashboard with open, overdue and unassigned requests',
  'Create a dashboard called SLA watch'
];
const AI_SUGG_LOGS = [
  'Summarise these logs', 'Which log type is noisiest?',
  'What severities am I seeing?', 'Build a widget of log events by type'
];
let aiSuggL = [], aiSuggSel = -1;
function aiSuggPool(){
  const gi = (typeof curG === 'number' ? curG : 0);
  const ws = ((typeof WIDGETS !== 'undefined' && WIDGETS[gi]) || [])
    .filter(w => w.title).slice(0, 8).map(w => 'Explain “' + w.title + '”');
  return aiInLogs() ? AI_SUGG_LOGS.concat(AI_SUGG_BASE) : AI_SUGG_BASE.concat(ws);
}
function aiSuggIn(v){
  const t = String(v || '').trim().toLowerCase();
  if (aiBusy || t.length < 2){ aiSuggHide(); return; }
  const seen = {}, hits = [];
  aiSuggPool().forEach(p => {
    const l = p.toLowerCase();
    if (seen[l] || l === t) return;
    const i = l.indexOf(t);
    if (i < 0) return;
    seen[l] = 1; hits.push({ p: p, i: i });
  });
  hits.sort((a, b) => a.i - b.i || a.p.length - b.p.length);
  aiSuggL = hits.slice(0, 4).map(h => h.p);
  aiSuggSel = -1;
  aiSuggRender();
}
function aiSuggRender(){
  const el = document.getElementById('aiSugg'); if (!el) return;
  if (!aiSuggL.length){ el.className = 'aisugg'; el.innerHTML = ''; return; }
  el.className = 'aisugg on';
  el.innerHTML = '<span class="hd">Suggestions</span>' + aiSuggL.map((p, i) =>
    '<button class="aifu' + (i === aiSuggSel ? ' sel' : '') + '" onmousedown="event.preventDefault()" ' +
    'onclick="aiSuggPick(' + i + ')"><span class="cv">›</span>' + aiEsc(p) + '</button>').join('');
}
function aiSuggHide(){ aiSuggL = []; aiSuggSel = -1; aiSuggRender(); }
function aiSuggPick(i){
  const p = aiSuggL[i]; if (!p) return;
  const el = document.getElementById('aiIn');
  if (el){ el.value = p; aiGrow(el); }
  aiSuggHide();
  aiSend();
}
function aiMentShow(q){
  const s = String(q || '').trim().toLowerCase();
  aiMent = aiEntList().filter(e => !s || e.n.toLowerCase().indexOf(s) > -1).slice(0, 34);
  aiMentSel = 0;
  aiMentPaint();
}
function aiMentPaint(){
  if (!aiMent.length){ aiMentHide(); return; }
  let el = document.getElementById('aiMentM');
  if (!el){
    el = document.createElement('div');
    el.className = 'aicmd up ment'; el.id = 'aiMentM';
    document.querySelector('.aicomp').appendChild(el);
    setTimeout(() => document.addEventListener('mousedown', aiMentAway), 0);
  }
  el.innerHTML = '<div class="hd">Add context · type to filter, ↑↓ to choose, ↵ to pin</div>' +
    aiMent.map((e, i) =>
      '<button class="' + (i === aiMentSel ? 'sel' : '') + '" onmousedown="event.preventDefault()" ' +
      'onclick="aiMentPick(' + i + ')"><span class="k"><i style="background:' +
      (AI_ENT_C[e.t] || 'var(--teal)') + '"></i></span><b>' + aiEsc(e.n) +
      '</b><i class="sb">' + aiEsc(e.s) + '</i></button>').join('');
  const sel = el.querySelector('button.sel'); if (sel) sel.scrollIntoView({ block:'nearest' });
}
function aiMentHide(){
  const el = document.getElementById('aiMentM'); if (el) el.remove();
  document.removeEventListener('mousedown', aiMentAway);
  aiMent = [];
  aiMentUnseed();
}
function aiMentAway(e){ if (!e.target.closest('#aiMentM')) aiMentHide(); }
function aiMentPick(i){
  const e = aiMent[i], t = document.getElementById('aiIn');
  if (!e || !t) return;
  const upto = t.value.slice(0, t.selectionStart);
  const m = /@([\w.\- ]{0,28})$/.exec(upto);
  const cut = m ? upto.length - m[0].length : upto.length;
  t.value = t.value.slice(0, cut) + t.value.slice(t.selectionStart);
  t.selectionStart = t.selectionEnd = cut;
  aiMentHide();
  aiCtxAdd(e.n, e.t);
  if (e.t === 'module'){
    if (aiScopeSel.indexOf(e.n) < 0) aiScopeSel.push(e.n);
    aiScopeSync(); aiScopeLine();
  }
  aiGrow(t); t.focus();
  toast(e.t === 'module' ? 'Reading ' + aiScopeCur
                         : 'Pinned ' + e.t + ' “' + e.n + '” to the context');
}
function aiCtxAdd(name, kind){
  if (aiCtxItems.some(c => c.n === name)) return;
  aiCtxItems.push({ n: name, k: kind || 'context' });
  aiCtxBar();
}
function aiCtxRemove(i){
  const gone = aiCtxItems.splice(i, 1)[0];
  if (gone && gone.k === 'module'){
    aiScopeSel = aiScopeSel.filter(x => x !== gone.n);
    aiScopeSync(); aiScopeLine();
  }
  aiCtxBar();
  toast(aiCtxIsFloor()
    ? 'Removed “' + gone.n + '” — reading all modules now'
    : 'Removed “' + gone.n + '” from context');
}
function aiCtxRender(){ aiCtxBar(); }
function aiCtxDrop(i){ aiCtxRemove(i); }
function aiCtxReset(){ aiCtxItems = []; aiCtxBar(); }
function aiScopeFrom(where){
  if (where === 'global'){ aiScopeSel = ['All modules']; aiScopeSync(); aiCtxItems = []; return; }
  if (where === 'alert'){ aiScopeSel = ['Alerts']; aiScopeSync();
                          aiCtxItems = [{n:'this alert', k:'alert'}]; return; }
  if (where === 'logs'){ aiScopeSel = ['Logs']; aiScopeSync();
                         aiCtxItems = [{n:'Log Explorer', k:'module'}]; return; }
  aiScopeSel = ['Dashboard']; aiScopeSync();
  const s = aiScope();
  aiCtxItems = [{ n: s.dash, k: 'dashboard' }];
}
function aiOutHTML(){
  return { step: 'Checked what I can answer', ic: 'info', title: 'Outside what I can see',
    html: '<p>I answer questions about your <b>ServiceOps</b> data — requests, SLAs, ' +
      'technicians, problems, changes, assets and dashboards.</p>' +
      '<p>I can’t help with anything outside the product.</p>',
    fu: ['What needs attention', 'Which requests are overdue?', 'Summarise this dashboard'] };
}
function aiMismatchHTML(need){
  return { step: 'Checked your scope', ic: 'info', title: 'That needs ' + need + ' data',
    html: '<p>Your context is set to <b>' + aiEsc(aiScopeCur) + '</b>, and this question needs <b>' +
      aiEsc(need) + '</b> data too.</p>',
    scopeAsk: need,
    fu: [] };
}
function aiScopeExpand(need){
  const set = new Set(aiScopeSel.filter(x => x !== 'All modules'));
  set.add(need);
  aiScopeSel = AI_MODULES.filter(x => set.has(x));
  aiScopeSync();
  aiCtxBar();
  const last = aiThread[aiThread.length - 1];
  const q = (aiThread.filter(m => m.r === 'me').pop() || {}).t || '';
  aiThread.pop();
  toast('Context now includes ' + need + ' — reading ' + aiScopeCur);
  aiPush(q);
}
function aiScopeKeep(){
  aiThread.pop();
  aiThread.push(Object.assign({ r:'ai' }, {
    step: 'Kept your context', ic: 'info', title: 'Staying in ' + aiScopeCur,
    html: '<p>Left as <b>' + aiEsc(aiScopeCur) + '</b>. Ask again once you add the module, ' +
      'or use the Context chip above the box — it takes more than one.</p>', fu: [] }));
  aiRender();
}
function aiOpen(where){
  document.getElementById('aiScrim').classList.add('on');
  document.getElementById('aiPanel').classList.add('on');
  if (!aiThread.length && (!aiCtxItems.length || aiCtxIsFloor())) aiScopeFrom(where || 'module');
  aiCtxBar(); aiScopeLine(); aiSetName(aiChatName); aiRender(); aiSuggHide();
  aiSplitPaint();
  setTimeout(()=>document.getElementById('aiIn').focus(), 120);
}
const AI_FS_OUT = '<svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>';
const AI_FS_IN  = '<svg viewBox="0 0 24 24"><path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/></svg>';
function aiFsTog(){
  const p = document.getElementById('aiPanel'); if (!p) return false;
  const on = p.classList.toggle('aifs');
  const b = document.getElementById('aiFsBtn');
  if (b){
    b.innerHTML = on ? AI_FS_IN : AI_FS_OUT;
    b.setAttribute('data-tip', on ? 'Exit full screen' : 'Expand to full screen');
  }
  if (on) aiSplit = false;
  aiSplitPaint();
  const t = document.getElementById('aiIn'); if (t) t.focus();
  return on;
}
function aiClose(){
  aiTkFlush(); aiAgFlush(); aiDicStop(1);
  aiHdMenuClose();
  document.getElementById('aiScrim').classList.remove('on');
  document.getElementById('aiPanel').classList.remove('on');
  aiSplitPaint();
}
function aiEsc(t){ return (t||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
let aiChatName = 'New chat', aiNamed = false, aiRenaming = false;
function aiClarPaint(){
  const el = document.getElementById('aiClarDock'); if (!el) return;
  const c = aiClarCur();
  const live = c && aiThread.indexOf(c) === aiThread.length - 1;
  el.innerHTML = live ? aiClarifyHTML(c) : '';
  el.classList.toggle('on', !!live);
  const p = document.getElementById('aiPanel');
  if (p) p.classList.toggle('aiclar', !!live);
}
function aiPendPaint(){
  const el = document.getElementById('aiPend'); if (!el) return;
  if (AI_TW){ el.className = 'aipend'; el.innerHTML = ''; return; }
  let p = null;
  for (let i = aiThread.length - 1; i >= 0 && !p; i--){
    const m = aiThread[i];
    if (m.r === 'agent' && m.a && m.a.state === 'card' &&
        (m.a.bs || []).some(b => b.k === 'card')){
      const a = m.a;
      p = { t: a.chartName ? aiEsc(a.chartName) + ' widget ready' : 'Widget ready',
            s: a.ctrs ? 'avg of ' + a.ctrs.map(c => c.c).join(', ') : '',
            edit: 'aiAgEdit(' + i + ')', ok: 'aiAgAccept(' + i + ')' };
    } else if (m.r === 'dash' && m.d && (m.d.state === 'plan' || m.d.state === 'edit')){
      const d = m.d, sub = 'Category ' + d.cat + ' · ' + d.sec;
      p = d.state === 'edit'
        ? { t: 'Editing “' + aiEsc(d.name) + '”', s: sub,
            ok: "aiDashSet('state','plan')", okl: 'Done editing' }
        : { t: 'Dashboard ready — “' + aiEsc(d.name) + '”', s: sub,
            edit: "aiDashSet('state','edit')", ok: 'aiDashApprove()' };
    } else if (m.r === 'build' && m.b && !m.b.added){
      const b = m.b, dash = aiScope().dash;
      p = b.dash
        ? { t: b.items.length + ' widgets ready', s: b.items.join(', ') + ' · adding to “' + dash + '”',
            edit: 'aiChange()', ok: 'aiBuildAdd()' }
        : { t: aiEsc((AI_CHARTS[b.chart] || 'Widget').toLowerCase()) + ' widget ready',
            s: b.name + ' ' + b.group.toLowerCase() + ' · adding to “' + dash + '”',
            edit: 'aiChange()', ok: 'aiBuildAdd()' };
    } else if (m.r === 'ai' && m.lq && !m.lq.applied){
      p = { t: m.lq.agg ? 'Log query ready' : 'Log filter ready',
            s: (lxAiqExpr(m.lq) || 'All events') +
               (m.lq.range ? ' · ' + lxAiqRangeName(m.lq.range) : ''),
            edit: 'aiLogQEdit(' + i + ')', ok: 'aiLogQApply(' + i + ')' };
    }
  }
  if (!p){ el.className = 'aipend'; el.innerHTML = ''; return; }
  el.className = 'aipend on';
  el.innerHTML =
    '<span class="aipendt"><b>' + p.t + '</b>' +
      (p.s ? '<i title="' + aiEsc(p.s).replace(/"/g, '&quot;') + '">' + aiEsc(p.s) + '</i>' : '') + '</span>' +
    '<span class="aipenda">' +
      (p.edit ? '<button class="aiagb" onclick="' + p.edit + '">' +
        '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4"/></svg>Edit</button>' : '') +
      '<button class="aiagb pri" onclick="' + p.ok + '">' +
        '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' + (p.okl || 'Accept') + '</button>' +
    '</span>';
}
function aiLogoPaint(){
  document.querySelectorAll('.brandmark').forEach(el => { if (!el.firstElementChild) el.innerHTML = AI_LOGO; });
}
function aiNewBtnPaint(){
  const b = document.getElementById('aiNewBtn'); if (!b) return;
  b.classList.toggle('hide', !aiThread.length);
}
function aiHelpBtnPaint(){
  const b = document.getElementById('aiHelpBtn'); if (!b) return;
  b.classList.toggle('hide', !aiThread.length);
}
function aiSetName(v){
  aiChatName = v;
  const el = document.getElementById('aiChatName');
  if (el && !aiRenaming) el.textContent = v;
}
function aiRename(){
  const el = document.getElementById('aiChatName');
  if (!el || aiRenaming) return;
  aiRenaming = true;
  const trg = document.getElementById('aiTitleBtn'); if (trg) trg.classList.add('ren');
  const cur = aiChatName;
  el.outerHTML = '<input class="ainin" id="aiNameIn" maxlength="60" />';
  const inp = document.getElementById('aiNameIn');
  inp.value = cur; inp.focus(); inp.select();
  inp.onkeydown = e => { if(e.key==='Enter') aiRenameDone(true); if(e.key==='Escape') aiRenameDone(false); };
  inp.onblur = () => aiRenameDone(true);
}
function aiRenameDone(save){
  const inp = document.getElementById('aiNameIn'); if(!inp) return;
  inp.onblur = null; inp.onkeydown = null;
  aiRenaming = false;
  const v = inp.value.trim();
  if (save && v){ aiChatName = v; aiNamed = true; }
  inp.outerHTML = '<b id="aiChatName"></b>';
  document.getElementById('aiChatName').textContent = aiChatName;
  const trg = document.getElementById('aiTitleBtn'); if (trg) trg.classList.remove('ren');
  if (save && v) toast('Chat renamed to “' + v + '”');
}
const AI_MI = {
  pen  :'<svg viewBox="0 0 24 24"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
  bin  :'<svg viewBox="0 0 24 24"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  doc  :'<svg viewBox="0 0 24 24"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
  life :'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>',
  ext  :'<svg class="ext" viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  mag  :'<svg viewBox="0 0 24 24"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
  chat :'<svg viewBox="0 0 24 24"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
};
const AI_SPARK_MI = '<svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.8c.3.9 1 1.6 1.9 1.9L20.4 10l-4.8 1.7c-.9.3-1.6 1-1.9 1.9L12 18.4l-1.7-4.8c-.3-.9-1-1.6-1.9-1.9L3.6 10l4.8-1.7c.9-.3 1.6-1 1.9-1.9L12 2Z"/></svg>';
function aiHdMenu(id, trigger, html, side){
  const open = document.getElementById(id);
  aiHdMenuClose();
  if (open) return;
  const m = document.createElement('div');
  m.className = 'aihm ' + (side || 'left'); m.id = id;
  m.innerHTML = html;
  m.addEventListener('click', e => e.stopPropagation());
  document.querySelector('.aihd').appendChild(m);
  const t = document.getElementById(trigger);
  if (t) t.classList.add(trigger === 'aiTitleBtn' ? 'open' : 'on');
  setTimeout(() => document.addEventListener('mousedown', aiHdAway), 0);
}
function aiHdAway(e){
  if (e.target.closest('.aihm') || e.target.closest('#aiTitleBtn') ||
      e.target.closest('#aiHelpBtn')) return;
  aiHdMenuClose();
}
function aiHdMenuClose(){
  aiChatPeekOff();
  document.querySelectorAll('.aihd .aihm').forEach(m => m.remove());
  const t = document.getElementById('aiTitleBtn'); if (t) t.classList.remove('open');
  const hb = document.getElementById('aiHelpBtn'); if (hb) hb.classList.remove('on');
  aiLayPaint();
  document.removeEventListener('mousedown', aiHdAway);
}
function aiChatMenu(ev){
  if (aiRenaming) return;
  ev.stopPropagation();
  aiFile();
  aiHdMenu('aiChatM', 'aiTitleBtn', aiChatMenuHTML(), 'left');
}
const AI_CHAT_RECENT = 6;
function aiChatMenuHTML(){
  return '<label class="srch" onclick="event.stopPropagation()">' + AI_MI.mag +
      '<input id="aiChatQ" placeholder="Search AI chats\u2026" oninput="aiChatList()" ' +
      'onkeydown="event.stopPropagation();if(event.key===\'Escape\'){aiHdMenuClose()}" /></label>' +
    '<div id="aiChatList">' + aiChatListHTML('') + '</div>' +
    (AI_CHATS.length > AI_CHAT_RECENT
      ? '<hr><button class="all" onclick="aiChatShowAll()">' + AI_MI.clock +
        '<span class="nm">Show all</span><span class="ch">' + AI_CHATS.length + ' ›</span></button>'
      : '');
}
function aiChatShowAll(){ aiHdMenuClose(); aiHistOpen(); }
function aiChatList(){
  const host = document.getElementById('aiChatList'); if (!host) return;
  const q = (document.getElementById('aiChatQ') || {}).value || '';
  host.innerHTML = aiChatListHTML(q);
}
function aiChatListHTML(q){
  const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  let list = AI_CHATS.filter(c => !rx || rx.test(c.n) || rx.test(aiChatFirstQ(c)))
                     .slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  list = list.slice(0, AI_CHAT_RECENT);
  if (!list.length) return '<div class="empty">' + (q
    ? 'No chat matches \u201c' + aiEsc(q) + '\u201d.'
    : 'Nothing yet. A chat is listed here once you have asked it something.') + '</div>';
  let out = '', band = null;
  list.forEach(c => {
    const g = aiChatBand(c.t);
    if (g !== band){ band = g; out += '<div class="grp">' + aiEsc(g) + '</div>'; }
    out += '<div class="conv' + (c.id === aiChatId ? ' cur' : '') + '" role="button" tabindex="0" ' +
      'onclick="aiHdMenuClose();aiHistGo(' + c.id + ')" ' +
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();aiHdMenuClose();aiHistGo(' + c.id + ')}" ' +
      'onmouseenter="aiChatPeek(' + c.id + ',this)" onmouseleave="aiChatPeekOff()">' +
      '<span class="cb">' + AI_MI.chat + '</span>' +
      '<span class="nm">' + aiEsc(c.n) + '</span>' +
      '<span class="when">' + aiEsc(aiChatWhen(c.t)) + '</span>' +
      '<span class="acts">' +
        '<i data-tip="Rename" onclick="event.stopPropagation();aiChatRenRow(' + c.id + ',this)">' + AI_MI.pen + '</i>' +
        '<i data-tip="Delete" class="del" onclick="event.stopPropagation();aiChatDelRow(' + c.id + ')">' + AI_MI.bin + '</i>' +
      '</span></div>';
  });
  return out;
}
function aiChatFirstQ(c){ return ((c.msgs || []).find(m => m.r === 'me') || {}).t || ''; }
function aiChatBand(t){
  if (!t) return 'Earlier';
  const d = new Date(t), n = new Date();
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return M[d.getMonth()] + ' ' + d.getDate() + (d.getFullYear() === n.getFullYear() ? '' : ' ' + d.getFullYear());
}
function aiChatWhen(t){
  if (!t) return '';
  const d = new Date(t), mins = Math.round((Date.now() - t) / 60000);
  if (aiChatBand(t) === 'Today'){
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min' + (mins === 1 ? '' : 's') + ' ago';
    const h = Math.round(mins / 60);
    return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
  }
  let h = d.getHours(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap;
}
function aiChatAge(t){
  if (!t) return '';
  const m = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (m < 1) return 'now';
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h';
  const d = Math.floor(h / 24); if (d < 7)  return d + 'd';
  const w = Math.floor(d / 7);  if (w < 52) return w + 'w';
  return Math.floor(d / 365) + 'y';
}
let aiHsQ = '';
function aiHsToggle(){
  const p = document.getElementById('aiPanel'); if (!p) return;
  if (p.classList.contains('aihson')) aiHsClose(); else aiHsOpen();
}
function aiHsOpen(){
  const p = document.getElementById('aiPanel'), h = document.getElementById('aiHs');
  if (!p || !h) return;
  aiHdMenuClose();
  p.classList.add('aihson');
  aiHsQ = ''; h.innerHTML = '';
  aiHsPaint(); aiHsBtnPaint();
  const q = document.getElementById('aiHsQ'); if (q) q.focus();
}
function aiHsClose(){
  const p = document.getElementById('aiPanel'); if (!p) return;
  p.classList.remove('aihson');
  aiHsBtnPaint();
}
function aiHsBtnPaint(){
  const p = document.getElementById('aiPanel'), b = document.getElementById('aiHsBtn');
  if (!p || !b) return;
  if (!b.firstChild) b.innerHTML = AI_MI.clock;
  const on = p.classList.contains('aihson');
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute('data-tip', on ? 'Hide history' : 'History');
}
function aiHsPaint(){
  const p = document.getElementById('aiPanel'), h = document.getElementById('aiHs');
  if (!p || !h || !p.classList.contains('aihson')) return;
  aiFile();
  const l = document.getElementById('aiHsL');
  if (l){ l.innerHTML = aiHsListHTML(aiHsQ); return; }
  h.innerHTML =
    '<div class="aihshd"><b>Chat history</b>' +
      '<button class="aihb" data-tip="Hide history" onclick="aiHsClose()">' +
        '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button></div>' +
    '<div class="aihssr">' + AI_MI.mag +
      '<input id="aiHsQ" placeholder="Search…" value="' + aiEsc(aiHsQ) +
      '" oninput="aiHsFilter()"></div>' +
    '<div class="aihsl" id="aiHsL">' + aiHsListHTML(aiHsQ) + '</div>';
}
function aiHsListHTML(q){
  const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const list = AI_CHATS.filter(c => !rx || rx.test(c.n) || rx.test(aiChatFirstQ(c)))
                       .slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  if (!list.length) return '<div class="aihsnone">' + (q
    ? 'No chat matches “' + aiEsc(q) + '”.'
    : 'No chats yet. Ask something and it will be saved here.') + '</div>';
  let out = '', band = null;
  list.forEach(c => {
    const g = aiChatBand(c.t);
    if (g !== band){ band = g; out += '<div class="aihsb">' + aiEsc(g) + '</div>'; }
    out += '<button class="aihsr' + (c.id === aiChatId ? ' on' : '') +
      '" data-tip="' + aiEsc(aiChatSummary(c)).replace(/"/g, '&quot;') +
      '" onclick="aiHsGo(' + c.id + ')">' +
      '<span class="nm">' + aiEsc(c.n) + '</span>' +
      '<span class="ag">' + aiEsc(aiChatAge(c.t)) + '</span></button>';
  });
  return out;
}
function aiHsFilter(){
  const inp = document.getElementById('aiHsQ'); if (!inp) return;
  aiHsQ = inp.value;
  const l = document.getElementById('aiHsL');
  if (l) l.innerHTML = aiHsListHTML(aiHsQ);
}
function aiHsGo(id){
  aiFile();
  const c = AI_CHATS.find(x => x.id === id); if (!c) return;
  aiChatId = c.id; aiThread = c.msgs.slice(); aiNamed = true; aiSetName(c.n);
  aiHistShown = false;
  aiRender();
}
function aiChatRenRow(id, el){
  const c = AI_CHATS.find(x => x.id === id); if (!c || !el) return;
  const row = el.closest('.conv') || el.closest('.aihfr'); if (!row) return;
  const host = row.querySelector('.nm') || row.querySelector('.tt b');
  if (!host || row.classList.contains('ren')) return;
  const cur = c.n, keep = host.className;
  row.classList.add('ren');
  host.outerHTML = '<span class="nmwrap"><input class="nmin" maxlength="60" />' +
    '<i class="act ok" title="Save"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></i>' +
    '<i class="act cx" title="Cancel"><svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></i></span>';
  const inp = row.querySelector('.nmin');
  inp.value = cur; inp.focus(); inp.select();
  const done = save => {
    inp.onblur = null; inp.onkeydown = null; inp.onclick = null;
    const v = inp.value.trim();
    row.classList.remove('ren');
    if (save && v && v !== cur){
      c.n = v;
      if (id === aiChatId){ aiChatName = v; aiNamed = true; aiSetName(v); }
      toast('Chat renamed to \u201c' + v + '\u201d');
    }
    if (document.getElementById('aiChatList')) aiChatList();
    if (aiHistShown) aiHistFilter();
  };
  ['ok','cx'].forEach(k => {
    const b = row.querySelector('.nmwrap .' + k); if (!b) return;
    b.onmousedown = e => e.preventDefault();
    b.onclick = e => { e.stopPropagation(); done(k === 'ok'); };
  });
  inp.onclick = e => e.stopPropagation();
  inp.onkeydown = e => {
    e.stopPropagation();
    if (e.key === 'Enter'){ e.preventDefault(); done(true); }
    else if (e.key === 'Escape'){ e.preventDefault(); done(false); }
  };
  inp.onblur = () => done(true);
}
let aiDelPending = null;
function aiDelAsk(id, how){
  const c = AI_CHATS.find(x => x.id === id);
  const name = c ? c.n : aiChatName;
  const n = c ? (c.msgs || []).filter(m => m.r === 'me').length : aiThread.filter(m => m.r === 'me').length;
  aiDelPending = { id: id, how: how || 'row' };
  aiHdMenuClose(); aiChatPeekOff();
  let el = document.getElementById('aiDel');
  if (!el){
    el = document.createElement('div'); el.id = 'aiDel'; el.className = 'aidelsc';
    el.onclick = e => { if (e.target === el) aiDelCancel(); };
    document.getElementById('aiPanel').appendChild(el);
  }
  el.innerHTML = '<div class="aidel" role="dialog" aria-modal="true" aria-labelledby="aiDelT">' +
    '<div class="aidelt" id="aiDelT">Delete \u201c' + aiEsc(name) + '\u201d?</div>' +
    '<div class="aidelb">This removes the conversation' +
      (n ? ' and its ' + n + ' question' + (n === 1 ? '' : 's') : '') +
      '. It can\u2019t be undone.</div>' +
    '<div class="aidela">' +
      '<button class="aialt" id="aiDelNo" onclick="aiDelCancel()">Cancel</button>' +
      '<button class="aidelgo" onclick="aiDelGo()">Delete</button>' +
    '</div></div>';
  el.classList.add('on');
  const b = document.getElementById('aiDelNo'); if (b) b.focus();
}
function aiDelCancel(){
  aiDelPending = null;
  const el = document.getElementById('aiDel'); if (el){ el.classList.remove('on'); el.innerHTML = ''; }
}
function aiDelGo(){
  const p = aiDelPending; aiDelCancel(); if (!p) return;
  if (p.how === 'cur') aiChatDelCurDo();
  else if (p.how === 'hist') aiHistDelDo(p.id);
  else aiChatDelRowDo(p.id);
}
function aiChatDelRow(id){ aiDelAsk(id, 'row'); }
function aiChatDelRowDo(id){
  const i = AI_CHATS.findIndex(c => c.id === id); if (i < 0) return;
  const n = AI_CHATS[i].n;
  AI_CHATS.splice(i, 1);
  if (id === aiChatId){
    aiTkCancel(); aiAgStop(); aiDicStop(1);
    aiThread.length = 0; aiBuildState = null; aiSetBusy(false);
    aiNamed = false; aiSetName('New chat'); aiRender();
  }
  aiChatPeekOff();
  const m = document.getElementById('aiChatM');
  if (m) m.innerHTML = aiChatMenuHTML(); else aiChatList();
  toast('Deleted “' + n + '”');
}
let aiPeekT = null;
function aiPanelLeft(){
  const p = document.getElementById('aiPanel'); if (!p) return innerWidth;
  if (p.classList.contains('aifs')) return 0;
  const w = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ai-w')) || 420;
  if (p.classList.contains('aifloat')) return AIF.x !== null ? AIF.x : innerWidth - 20 - w;
  return innerWidth - w;
}
function aiChatPeek(id, row){
  clearTimeout(aiPeekT);
  aiPeekT = setTimeout(() => {
    const c = AI_CHATS.find(x => x.id === id); if (!c) return;
    aiChatPeekOff(1);
    const el = document.createElement('div');
    el.className = 'aihov'; el.id = 'aiPeek';
    el.innerHTML = '<div class="h">' +
      '<b>' + aiEsc(c.n) + '</b></div>' +
      '<p>' + aiEsc(aiChatSummary(c)) + '</p>' +
      '<div class="f">' + c.asked + ' message' + (c.asked === 1 ? '' : 's') +
      ' · ' + aiEsc(aiChatBand(c.t)) + ' ' + aiEsc(aiChatWhen(c.t)) + '</div>';
    document.body.appendChild(el);
    const r = row.getBoundingClientRect(), pl = aiPanelLeft(), w = el.offsetWidth;
    el.style.left = (pl - w - 12 > 8 ? pl - w - 12 : Math.min(innerWidth - w - 8, pl + 12)) + 'px';
    el.style.top  = Math.max(8, Math.min(r.top - 6, innerHeight - el.offsetHeight - 8)) + 'px';
  }, 260);
}
function aiChatPeekOff(keepTimer){
  if (!keepTimer) clearTimeout(aiPeekT);
  const el = document.getElementById('aiPeek'); if (el) el.remove();
}
function aiChatSummary(c){
  if (c.sum) return c.sum;
  const q = aiChatFirstQ(c);
  const a = (c.msgs || []).filter(m => m.r === 'ai' || m.r === 'a').length;
  return q ? 'Started with “' + q + '”' + (a ? ' — ' + a + ' answer' + (a === 1 ? '' : 's') + ' so far.' : '.')
           : 'No questions asked in this chat yet.';
}
function aiChatDelCur(){ aiDelAsk(aiChatId, 'cur'); }
function aiChatDelCurDo(){
  const n = aiChatName;
  const i = AI_CHATS.findIndex(c => c.id === aiChatId);
  if (i >= 0) AI_CHATS.splice(i, 1);
  aiChatId++;
  aiTkCancel(); aiAgStop(); aiDicStop(1);
  aiThread.length = 0; aiBuildState = null; aiSetBusy(false);
  aiNamed = false; aiSetName('New chat');
  aiRender();
  toast('Deleted “' + n + '”');
}
const AI_HELP = [
  { href:'https://docs.motadata.com/', ic:AI_MI.doc,  l:'Documentation' },
  { href:'https://support.motadata.com/',                  ic:AI_MI.life, l:'Support' }
];
function aiHelpMenu(ev){
  ev.stopPropagation();
  const row = (href, ic, label) =>
    '<button onclick="aiHdMenuClose();window.open(' + JSON.stringify(href).replace(/"/g,'&quot;') +
    ',\'_blank\',\'noopener\')">' + ic + '<span class="nm">' + label + '</span>' + AI_MI.ext + '</button>';
  const own = aiThread.length
    ? '<button onclick="aiHdMenuClose();aiRename()">' + AI_MI.pen +
        '<span class="nm">Rename chat</span></button>' +
      '<button class="del" onclick="aiHdMenuClose();aiChatDelCur()">' + AI_MI.bin +
        '<span class="nm">Delete chat</span></button><hr>'
    : '';
  aiHdMenu('aiHelpM', 'aiHelpBtn',
    own + AI_HELP.map(h => row(h.href, h.ic, h.l)).join(''),
    'right');
}
let aiSplit = false;
const AI_LAY_PIP = '<svg viewBox="0 0 24 24"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/><rect width="10" height="7" x="12" y="13" rx="2" fill="currentColor" stroke="none" opacity=".22"/></svg>';
const AI_LAY_SQ  = '<svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor" stroke="none" opacity=".22"/></svg>';
const AI_LAY_WIN = '<svg viewBox="0 0 24 24"><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/><rect width="14" height="14" x="8" y="8" rx="2"/><rect width="14" height="14" x="8" y="8" rx="2" fill="currentColor" stroke="none" opacity=".22"/></svg>';
const AI_LAY = [
  ['floating', 'Floating',    AI_LAY_WIN],
  ['full',     'Full screen', AI_LAY_SQ],
];
const AI_TICK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
function aiPanelOpen(){
  const p = document.getElementById('aiPanel');
  return !!p && p.classList.contains('on');
}
function aiLayCur(){
  const p = document.getElementById('aiPanel');
  if (p && p.classList.contains('aifs')) return 'full';
  return aiSplit ? 'sidebar' : 'floating';
}
function aiSplitPaint(){
  const open = aiPanelOpen(), cur = aiLayCur();
  document.body.classList.toggle('aisplit', cur === 'sidebar' && open);
  document.body.classList.toggle('aifloat', cur === 'floating' && open);
  const p = document.getElementById('aiPanel');
  if (p) p.classList.toggle('aifloat', cur === 'floating');
  aiFloatApply();
  aiFabPaint();
  aiLayPaint();
}
function aiLayOther(){ return aiLayCur() === 'full' ? 'floating' : 'full'; }
function aiLayPaint(){
  const b = document.getElementById('aiLayBtn'); if (!b) return;
  const to = aiLayOther(), row = AI_LAY.find(r => r[0] === to) || AI_LAY[0];
  b.innerHTML = row[2];
  b.classList.remove('on');
  b.setAttribute('data-tip', row[1]);
}
function aiLayTog(ev){
  ev.stopPropagation();
  aiHdMenuClose();
  aiLaySet(aiLayOther());
}
function aiLayMenu(ev){
  ev.stopPropagation();
  const cur = aiLayCur();
  aiHdMenu('aiLayM', 'aiLayBtn', AI_LAY.map(r =>
    '<button class="' + (r[0] === cur ? 'cur' : '') + '" onclick="aiHdMenuClose();aiLaySet(\'' + r[0] + '\')">' +
    r[2] + '<span class="nm">' + r[1] + '</span>' +
    (r[0] === cur ? '<span class="tick">' + AI_TICK + '</span>' : '') + '</button>').join(''), 'right');
}
const AIF = { x:null, y:null, w:null, h:null };
const AI_MIN_W = 440, AI_MIN_H = 550,
      AI_SIDE_MIN = 340, AI_SIDE_MAX = 760;
function aiRailW(){
  const v = parseFloat(getComputedStyle(document.body).getPropertyValue('--rail-w'));
  return Number.isFinite(v) ? v : 64;
}
function aiFMinW(){
  const w = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ai-w'));
  return Math.min(AI_MIN_W, AI_COMPACT_W, Number.isFinite(w) ? w : AI_MIN_W, innerWidth - AI_EDGE * 2);
}
function aiFMinH(){ return Math.min(AI_MIN_H, innerHeight - AI_EDGE * 2); }
function aiFMaxW(){
  return Math.max(aiFMinW(), innerWidth - aiRailW() - AI_EDGE * 2);
}
function aiFMaxH(){ return Math.max(aiFMinH(), innerHeight - AI_EDGE * 2); }
let aiDrag = null;
function aiFabPaint(){
  const f = document.getElementById('cwFab'), p = document.getElementById('aiPanel');
  if (!f) return;
  const on = p && p.classList.contains('on') && p.classList.contains('aifloat');
  if (!on){ document.body.classList.remove('aifabshift'); return; }
  const r = f.getBoundingClientRect();
  if (!r.width){ document.body.classList.remove('aifabshift'); return; }
  const dl = innerWidth - 20 - r.width, dr = innerWidth - 20;
  const dt = innerHeight - 72 - r.height, db = innerHeight - 72;
  const c = p.getBoundingClientRect();
  const hit = c.right > dl && c.left < dr && c.bottom > dt && c.top < db;
  document.body.classList.toggle('aifabshift', hit);
  if (hit) document.documentElement.style.setProperty('--cwfab-r',
    Math.round(Math.max(20, innerWidth - c.left + 16)) + 'px');
}
function aiFloatApply(){
  const p = document.getElementById('aiPanel'); if (!p) return;
  ['left','top','right','bottom','width','height'].forEach(k => { p.style[k] = ''; });
  if (!p.classList.contains('aifloat') || AIF.x === null) return;
  p.style.left = AIF.x + 'px';  p.style.top    = AIF.y + 'px';
  p.style.right = 'auto';       p.style.bottom = 'auto';
  p.style.width = AIF.w + 'px'; p.style.height = AIF.h + 'px';
}
function aiFloatSeed(){
  const r = document.getElementById('aiPanel').getBoundingClientRect();
  AIF.x = Math.round(r.left); AIF.y = Math.round(r.top);
  AIF.w = Math.round(r.width); AIF.h = Math.round(r.height);
}
const AI_EDGE = 20;
function aiClamp(){
  AIF.w = Math.max(aiFMinW(), Math.min(AIF.w, aiFMaxW()));
  AIF.h = Math.max(aiFMinH(), Math.min(AIF.h, aiFMaxH()));
  const xMin = aiRailW() + AI_EDGE;
  AIF.x = Math.max(xMin, Math.min(AIF.x, Math.max(xMin, innerWidth - AIF.w - AI_EDGE)));
  AIF.y = Math.max(AI_EDGE, Math.min(AIF.y, Math.max(AI_EDGE, innerHeight - AIF.h - AI_EDGE)));
}
const AI_COMPACT_W = 380;
const AI_COMPACT_MAX = 720;
function aiCompactH(){
  const p = document.getElementById('aiPanel'), b = document.getElementById('aiBody');
  if (!p || !b) return AIF.h;
  const chrome = p.getBoundingClientRect().height - b.clientHeight;
  const em = b.querySelector('.aiempty'), prev = em ? em.style.minHeight : '';
  if (em) em.style.minHeight = '0';
  const cs = getComputedStyle(b), last = b.lastElementChild;
  const natural = last ? last.getBoundingClientRect().bottom - b.getBoundingClientRect().top + b.scrollTop
    + parseFloat(cs.paddingBottom) : 0;
  if (em) em.style.minHeight = prev;
  return Math.round(Math.max(aiFMinH(), Math.min(AI_COMPACT_MAX, aiFMaxH(), chrome + natural)));
}
function aiDragStart(e){
  const p = document.getElementById('aiPanel');
  if (!p.classList.contains('aifloat')) return;
  if (e.target.closest('button,input,a,.aihttl,.aihm')) return;
  if (AIF.x === null) aiFloatSeed();
  aiDrag = { m:'move', mx:e.clientX, my:e.clientY, x:AIF.x, y:AIF.y, w:AIF.w, h:AIF.h,
             cp: AIF.h > aiCompactH() + 2 };
  document.body.classList.add('aidragmv');
  aiRzBind(e);
}
function aiRzStart(e, m){
  const p = document.getElementById('aiPanel');
  if (!p.classList.contains('aifloat')){
    if (m !== 'w') return;
    aiDrag = { m:'side', mx:e.clientX, w:p.getBoundingClientRect().width };
    aiRzBind(e); return;
  }
  if (AIF.x === null) aiFloatSeed();
  aiDrag = { m:m, mx:e.clientX, my:e.clientY, x:AIF.x, y:AIF.y, w:AIF.w, h:AIF.h };
  ['n','s','e','w'].forEach(k => document.body.classList.toggle('aidrag' + k, m.includes(k)));
  aiRzBind(e);
}
function aiRzBind(e){
  e.preventDefault(); e.stopPropagation();
  document.body.classList.add('aidragging');
  addEventListener('mousemove', aiRzMove);
  addEventListener('mouseup', aiRzEnd);
}
function aiRzMove(e){
  if (!aiDrag) return;
  const dx = e.clientX - aiDrag.mx, dy = e.clientY - aiDrag.my;
  if (aiDrag.m === 'side'){
    const w = Math.max(AI_SIDE_MIN, Math.min(AI_SIDE_MAX, Math.round(aiDrag.w - dx)));
    document.documentElement.style.setProperty('--ai-w', w + 'px');
    return;
  }
  if (aiDrag.m === 'move'){
    if (aiDrag.cp && Math.abs(dx) + Math.abs(dy) > 4){
      aiDrag.cp = false;
      const p = document.getElementById('aiPanel');
      const nw = Math.max(aiFMinW(), Math.min(aiDrag.w, AI_COMPACT_W));
      const pw = p.style.width; p.style.width = nw + 'px';
      const nh = Math.min(aiDrag.h, aiCompactH());
      p.style.width = pw;
      const grab = aiDrag.mx - aiDrag.x;
      if (grab > nw - 24) aiDrag.x += grab - (nw - 24);
      aiDrag.w = nw; aiDrag.h = nh;
      p.classList.add('aicompacting');
      clearTimeout(aiDrag.ct); aiDrag.ct = setTimeout(() => p.classList.remove('aicompacting'), 380);
    }
    AIF.x = aiDrag.x + dx; AIF.y = aiDrag.y + dy;
    AIF.w = aiDrag.w; AIF.h = aiDrag.h;
    aiClamp();
    AIF.w = aiDrag.w; AIF.h = aiDrag.h;
    aiFloatApply(); aiFabPaint();
    aiDockGhost();
    document.body.classList.toggle('aidockr', e.clientX >= innerWidth - AI_DOCK_ZONE);
    return;
  }
  const M = aiDrag.m;
  if (M.includes('w')){
    const w = Math.max(aiFMinW(), Math.min(aiFMaxW(), aiDrag.w - dx));
    AIF.w = w; AIF.x = aiDrag.x + (aiDrag.w - w);
  }
  if (M.includes('n')){
    const h = Math.max(aiFMinH(), Math.min(aiFMaxH(), aiDrag.h - dy));
    AIF.h = h; AIF.y = aiDrag.y + (aiDrag.h - h);
  }
  if (M.includes('e')) AIF.w = Math.max(aiFMinW(),
    Math.min(aiFMaxW(), innerWidth  - AI_EDGE - aiDrag.x, aiDrag.w + dx));
  if (M.includes('s')) AIF.h = Math.max(aiFMinH(),
    Math.min(aiFMaxH(), innerHeight - AI_EDGE - aiDrag.y, aiDrag.h + dy));
  aiClamp(); aiFloatApply(); aiFabPaint();
}
const AI_DOCK_ZONE = 72;
function aiDockGhost(){
  if (document.getElementById('aiDockGhost')) return;
  const g = document.createElement('div'); g.id = 'aiDockGhost'; g.className = 'aidockghost';
  g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
}
function aiRzEnd(){
  const d = aiDrag; aiDrag = null;
  document.body.classList.remove('aidragging');
  ['n','s','e','w','mv'].forEach(k => document.body.classList.remove('aidrag' + k));
  const dock = d && d.m === 'move' && document.body.classList.contains('aidockr');
  document.body.classList.remove('aidockr');
  if (dock){ AIF.x = AIF.y = AIF.w = AIF.h = null; aiFloatApply(); aiFabPaint(); }
  removeEventListener('mousemove', aiRzMove);
  removeEventListener('mouseup', aiRzEnd);
  if (!d) return;
  if (d.m === 'side') toast('Sidebar width ' + Math.round(parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--ai-w'))) + 'px');
  else if (d.m !== 'move') toast('Chat ' + AIF.w + ' × ' + AIF.h + 'px');
}
function aiRzReset(){
  const p = document.getElementById('aiPanel');
  if (p && p.classList.contains('aifloat')){
    AIF.x = AIF.y = AIF.w = AIF.h = null; aiFloatApply(); toast('Chat size reset');
  } else {
    document.documentElement.style.removeProperty('--ai-w'); toast('Sidebar width reset');
  }
}
addEventListener('resize', () => {
  aiFabPaint();
  if (AIF.x === null) return;
  aiClamp(); aiFloatApply();
});
function aiLaySet(k){
  if (k === 'sidebar') k = 'floating';
  if (k === aiLayCur()) return;
  const p = document.getElementById('aiPanel'), wasFs = p && p.classList.contains('aifs');
  if (k === 'full'){
    if (!wasFs) aiFsTog();
    aiSplit = false;
    aiSplitPaint();
  } else {
    if (wasFs) aiFsTog();
    aiSplit = (k === 'sidebar');
    aiSplitPaint();
  }
  toast(k === 'floating' ? 'Floating — the chat floats over the board' : 'Full screen');
}
function aiNewChat(){
  aiFile();
  aiChatId++;
  aiTkCancel(); aiAgStop(); aiDicStop(1);
  aiThread.length = 0; aiBuildState = null; aiSetBusy(false);
  aiNamed = false; aiSetName('New chat');
  aiRender();
  const el = document.getElementById('aiIn'); if (el) el.focus();
  toast('New chat');
}
function aiAutoName(q){
  if (aiNamed) return;
  let n = String(q || '').replace(/\s+/g,' ').trim();
  if (!n) return;
  if (n.length > 42) n = n.slice(0,42).replace(/\s\S*$/,'') + '…';
  aiSetName(n.charAt(0).toUpperCase() + n.slice(1));
}
function aiScopeLine(){
  const el = document.getElementById('aiScopeLine');
  if (!el) return;
  const s = aiScope();
  el.textContent = s.dash + ' · ' + s.n + ' widget' + (s.n === 1 ? '' : 's');
}
const AI_CTA = [
  ['spark', 'Summarise this dashboard',
            'Give me a summary of this dashboard'],
  ['line',  'Build a line chart of requests created for the last 30 days',
            'Build a line chart of requests created for the last 30 days'],
  ['board', 'Create a new dashboard',
            'Create a dashboard called SLA watch'],
  ['spark', 'Generate a widget',
            'Build me a chart of overdue requests'],
  ['line',  'Build a time-series widget for',
            'Build a time-series widget for']
];
const AI_IC = {
  bulb :'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  spark:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
  wand :'<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/>',
  flag :'<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  info :'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  grid :'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  board:'<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>',
  line :'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>'
};
function aiRender(){
  const b = document.getElementById('aiBody');
  aiScopeLine();
  aiNewBtnPaint(); aiHelpBtnPaint(); aiPendPaint(); aiClarPaint(); aiHsBtnPaint(); aiHsPaint(); aiHistPaint();
  aiFadeBind(); aiTypedPaint();
  if(!aiThread.length){
    b.innerHTML = '<div class="aiempty">' +
      '<span class="aibig">' + AI_SPARK + '</span>' +
      '<h3 class="aihi">What can I do for you, ' + aiEsc(AI_WHO) + '?</h3>' +
      (aiInLogs()
        ? '<p>Ask about the logs on this screen, or describe a search — a severity, a ' +
          'time window, a host — and I\'ll build the query.</p>'
        : '') +
      (aiInLogs() ? AI_CTA_LOGS : AI_CTA).map(([, label], i) =>
        '<button class="aicta" onclick="aiAsk(' + i + ')">' + label + '</button>').join('') +
      '<div class="aihelpl">' + AI_HELP.map(h =>
        '<button onclick="window.open(' + JSON.stringify(h.href).replace(/"/g,'&quot;') +
        ',\'_blank\',\'noopener\')">' + h.ic + '<span>' + h.l + '</span>' + AI_MI.ext +
        '</button>').join('') + '</div>' +
    '</div>';
    return;
  }
  b.innerHTML = aiThread.map((m, i) => {
      if (m.r === 'me')   return '<div class="aiuw"><div class="aiu">' + aiEsc(m.t) + '</div>' +
        '<div class="aiuact"><button title="Copy prompt" onclick="aiCopyMe(this)">' +
        '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/>' +
        '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div></div>';
      if (m.r === 'wait') return '<div class="aistep">' + aiEsc(m.step || 'Thinking…') + '</div>' +
                                 '<div class="aidots"><span></span><span></span><span></span></div>';
      if (m.r === 'stopped') return aiStopHTML(m, i);
      if (m.r === 'tk')      return aiTkHTML(m, i);
      if (m.r === 'agent')   return aiAgHTML(m.a, i);
      if (m.r === 'clarify') return '';
      if (m.r === 'dash')    return aiDashHTML(m.d, i);
      if (m.r === 'build')   return aiPreviewHTML(m.b, i);
      return aiAnswerHTML(m, i);
    }).join('');
  b.scrollTop = b.scrollHeight;
  const runAg = aiThread.find(m => m.r === 'agent' && m.a && m.a.state === 'run');
  const runTk = aiThread.find(m => m.r === 'tk' && m.run);
  const t0 = runAg ? runAg.a.t0 : (runTk ? runTk.t0 : 0);
  if (t0) aiLdStart(t0); else aiLdStop();
  aiTkFadeBind();
  aiSayFade();
  aiTwBind();
  aiPendPaint();
}
let aiSayPrev = '', aiSayT = null;
function aiSayFade(){
  const el = document.querySelector('.aiagsay.live');
  if (!el){ aiSayPrev = ''; clearTimeout(aiSayT); aiSayT = null; return; }
  const now = el.textContent;
  if (now === aiSayPrev) return;
  if (!aiSayPrev){ aiSayPrev = now; el.classList.add('aisayin'); return; }
  const prev = aiSayPrev; aiSayPrev = now;
  el.textContent = prev;
  el.classList.add('aisayswap');
  clearTimeout(aiSayT);
  aiSayT = setTimeout(() => {
    const e = document.querySelector('.aiagsay.live.aisayswap');
    if (e) e.textContent = now;
  }, 190);
}
const AI_TW_STEP = 38;
const AI_TW_LEAD = 100;
const AI_TW_FADE = 420;
const AI_TW_GAP  = 60;
const AI_TW_MAX  = 4200;
const AI_TW_SKIP = '.aiat,.aiagch,.aistep,.aifb,.aiful,.aifu,.aiacts,.aichips,.aiprev,' +
                   '.aidashp,.aiagpl,button,input,select,textarea,svg,img';
const AI_TW_BLK  = 'div,p,h1,h2,h3,h4,ul,ol,li,section,blockquote';
let AI_TW = null;
function aiTwReduce(){
  try { return matchMedia('(prefers-reduced-motion:reduce)').matches; } catch(e){ return false; }
}
function aiTwOn(m, k){ return !!m && !(m.tw && m.tw[k]) && !aiTwReduce(); }
function aiTwMark(m, k){ if (!m) return; (m.tw = m.tw || {})[k] = 1; m.twT = 0; }
function aiTwWalk(node, c){
  let nx;
  for (let n = node.firstChild; n; n = nx){
    nx = n.nextSibling;
    if (n.nodeType === 3){
      if (!n.nodeValue) continue;
      const parts = n.nodeValue.split(/(\s+)/), f = document.createDocumentFragment();
      for (let j = 0; j < parts.length; j++){
        const p = parts[j];
        if (!p) continue;
        if (!/\S/.test(p)){ f.appendChild(document.createTextNode(p)); continue; }
        const w = document.createElement('span');
        w.className = 'aitww aitwx'; w.textContent = p;
        c.chars.push(w);
        f.appendChild(w);
      }
      n.parentNode.replaceChild(f, n);
      continue;
    }
    if (n.nodeType !== 1) continue;
    if (n.matches(AI_TW_SKIP)){ c.hide.push({ e: n, at: c.chars.length, tx: 0 }); continue; }
    if (!n.matches(AI_TW_BLK)){ aiTwWalk(n, c); continue; }
    const rec = { e: n, at: c.chars.length, tx: 0 };
    c.hide.push(rec);
    const mark = c.hide.length, n0 = c.chars.length;
    aiTwWalk(n, c);
    rec.tx = c.chars.length > n0;
    if (rec.tx && !c.hide.slice(mark).some(h => h.tx)) c.cuts.push(rec.at);
  }
}
function aiTwPrep(els){
  const c = { chars: [], hide: [], cuts: [] };
  for (let r = 0; r < els.length; r++) aiTwWalk(els[r], c);
  if (!c.chars.length) return null;
  const n = c.chars.length;
  c.cuts.sort((a, b) => a - b);
  const bs = c.cuts.filter((v, j) => j === 0 || v !== c.cuts[j - 1]);
  if (!bs.length || bs[0] !== 0) bs.unshift(0);
  const blocks = bs.map((s, j) => ({ s: s, e: j + 1 < bs.length ? bs[j + 1] : n }));
  let stp = AI_TW_STEP, gap = AI_TW_GAP;
  const room = AI_TW_MAX - AI_TW_LEAD - AI_TW_FADE;
  const cur  = n * stp + (blocks.length - 1) * gap;
  if (cur > room && cur > 0){ const f = room / cur; stp *= f; gap *= f; }
  let tt = AI_TW_LEAD;
  blocks.forEach((b, j) => {
    b.t0 = tt; tt += (b.e - b.s) * stp; b.t1 = tt;
    if (j < blocks.length - 1) tt += gap;
  });
  return { chars: c.chars, hide: c.hide, blocks: blocks, n: n,
           stp: stp, dur: tt + AI_TW_FADE, tm: 0, first: 1, k0: 0 };
}
function aiTwAt(S, t){
  if (t <= AI_TW_LEAD) return 0;
  for (let j = 0; j < S.blocks.length; j++){
    const b = S.blocks[j];
    if (t < b.t1) return b.s + Math.floor((t - b.t0) / S.stp);
    if (j === S.blocks.length - 1 || t < S.blocks[j + 1].t0) return b.e;
  }
  return S.n;
}
function aiTwSet(S, j, on, quiet){
  const c = S.chars[j];
  if (!on){ c.classList.remove('on', 'new'); return; }
  if (c.classList.contains('on')) return;
  c.classList.add('on');
  if (!quiet) c.classList.add('new');
}
function aiTwPaint(S, k){
  if (S.first || k < S.k0)
    for (let j = 0; j < S.n; j++) aiTwSet(S, j, j < k, !!S.first);
  else
    for (let j = S.k0; j < k && j < S.n; j++) aiTwSet(S, j, true, false);
  S.k0 = k;
  S.hide.forEach(h => {
    const hid = h.tx ? k <= h.at : k < h.at;
    if (!hid && !h.tx && h.e.classList.contains('aitwh') && !S.first) h.e.classList.add('aitwin');
    h.e.classList.toggle('aitwh', hid);
  });
  S.first = 0;
  const b = document.getElementById('aiBody');
  if (b && b.scrollHeight - b.scrollTop - b.clientHeight < 140) b.scrollTop = b.scrollHeight;
}
function aiTwStep(){
  const S = AI_TW; if (!S) return;
  if (!S.els[0].isConnected){ aiTwStop(); return; }
  const t = Date.now() - S.t0, m = aiThread[S.i];
  if (m) m.twT = t;
  aiTwPaint(S, aiTwAt(S, t));
  if (t >= S.dur){ aiTwDone(); return; }
  S.tm = setTimeout(aiTwStep, 16);
}
function aiTwStart(els){
  aiTwStop();
  const i = +els[0].dataset.tw, k = els[0].dataset.twk || 'ans', m = aiThread[i];
  const S = aiTwPrep(els);
  if (!S){ els.forEach(e => e.classList.remove('aitw')); aiTwMark(m, k); return; }
  S.els = els; S.i = i; S.k = k;
  AI_TW = S;
  S.t0 = Date.now() - ((m && m.twT) || 0);
  aiTwStep();
}
function aiTwStop(){ if (AI_TW){ clearTimeout(AI_TW.tm); AI_TW = null; } }
function aiTwDone(){
  const S = AI_TW; if (!S) return;
  clearTimeout(S.tm);
  aiTwPaint(S, S.n);
  S.els.forEach(e => { e.classList.remove('aitw'); e.removeAttribute('onclick'); });
  aiTwMark(aiThread[S.i], S.k);
  AI_TW = null;
  aiPendPaint();
  const b = document.getElementById('aiBody');
  if (b && b.scrollHeight - b.scrollTop - b.clientHeight < 220) b.scrollTop = b.scrollHeight;
}
function aiTwSkip(){
  if (!AI_TW) return;
  const s = window.getSelection && window.getSelection();
  if (s && !s.isCollapsed) return;
  aiTwDone();
}
function aiTwBind(){
  const all = document.querySelectorAll('#aiBody .aitw');
  if (!all.length){ aiTwStop(); return; }
  const id = all[0].dataset.tw;
  const els = Array.prototype.filter.call(all, e => e.dataset.tw === id);
  if (AI_TW && AI_TW.els.length === els.length && AI_TW.els[0] === els[0]) return;
  aiTwStart(els);
}
function aiAnswerHTML(m, i){
  const tw = aiTwOn(m, 'ans');
  return (m.tk ? '' : '<div class="aistep">' + aiEsc(m.step) + '</div>') +
    '<div class="aians' + (tw ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="ans"' +
      (tw ? ' onclick="aiTwSkip()"' : '') + '>' +
      '<div class="aiat"><span class="sp"><svg viewBox="0 0 24 24" class="ln">' + (AI_IC[m.ic] || AI_IC.info) + '</svg></span>' +
        aiEsc(m.title) + (m.sub || '') + '</div>' +
      '<div class="aiab">' + m.html + '</div>' +
      (m.scopeAsk ? '<div class="aiacts">' +
         '<button class="aiadd" onclick="aiScopeExpand(' + JSON.stringify(m.scopeAsk).replace(/"/g,'&quot;') + ')">' +
         'Expand to ' + aiEsc(m.scopeAsk) + ' + ' + aiEsc(aiScopeCur) + '</button>' +
         '<button class="aialt" onclick="aiScopeKeep()">Keep ' + aiEsc(aiScopeCur) + ' only</button></div>' : '') +
      aiFbHTML(i, m.fb) +
      (m.fu && m.fu.length ? '<div class="aiful">Follow ups</div>' +
        m.fu.map(q => '<button class="aifu" onclick="aiFollow(this)"><span class="cv">›</span>' +
          aiEsc(q) + '</button>').join('') : '') +
    '</div>';
}
function aiClarifyHTML(m){
  const st = AI_CLAR[m.step] || AI_CLAR[0];
  const mul = !!st.multi, sel = m.msel || [];
  const on = i => sel.indexOf(i) > -1;
  const q = m.step === 0 ? 'How should I group \u201c' + aiEsc(m.name) + '\u201d?' : aiEsc(st.q);
  return '<div class="aicq">' +
    '<div class="aicqh">' +
      '<button class="aicqb"' + (m.step ? '' : ' disabled') +
        ' onclick="aiClarBack()" data-tip="Previous question">' +
        '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<span class="aicqt">' + q + '</span>' +
      '<span class="aicqn"><b>' + (m.step + 1) + '</b> / ' + AI_CLAR.length + '</span>' +
      '<button class="aicqc" onclick="aiClarDismiss()" data-tip="Cancel">' +
        '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
    '</div>' +
    '<div class="aicqs">' + aiEsc(st.sub) + '</div>' +
    '<div class="aicqpg"><i style="width:' +
      Math.round((m.step + 1) / AI_CLAR.length * 100) + '%"></i></div>' +
    st.opts.map((o, i) => '<button class="aicqo' + (mul ? (on(i) ? ' on' : '') :
      (m.sel === i ? ' on' : '')) + '" role="' + (mul ? 'checkbox" aria-checked="' +
      (on(i) ? 'true' : 'false') : 'button" aria-pressed="false') + '"' +
      ' onclick="aiClarGo(' + i + ')">' +
      (mul ? '<span class="aicqck">' + (on(i) ? AI_TICK : '') + '</span>'
           : '<span class="aicqi">' + (i + 1) + '</span>') +
      aiEsc(o) + '</button>').join('') +
    '<label class="aicqf' + (m.sel === -1 ? ' on' : '') + '">' +
      '<span class="aicqp"><svg viewBox="0 0 24 24"><path d="M13 21h8"/>' +
      '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352' +
      'a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg></span>' +
      '<input value="' + aiEsc(m.free).replace(/"/g,'&quot;') + '" ' +
      'placeholder="Something else\u2026" oninput="aiClarFree(this)" ' +
      'onkeydown="aiClarKey(event)" />' +
    '</label>' +
    '<div class="aicqd">' +
      '<button class="aicqsk" onclick="aiClarSkip()">Skip</button>' +
      (mul ? '<button class="aicqok" onclick="aiClarNext()">Done' +
        (sel.length ? ' <span>' + sel.length + '</span>' : '') + '</button>' : '') +
    '</div>' +
  '</div>';
}
function aiClarGo(i){
  const c = aiClarCur(); if (!c) return;
  const st = AI_CLAR[c.step];
  if (st && st.multi){
    const at = c.msel.indexOf(i);
    if (at > -1) c.msel.splice(at, 1); else c.msel.push(i);
    c.msel.sort((a, b) => a - b);
    if (c.msel.length){ c.free = ''; c.sel = null; }
    aiRender();
    return;
  }
  c.sel = i; c.free = '';
  aiClarNext();
}
function aiClarDismiss(){
  const c = aiClarCur(); if (!c) return;
  const ix = aiThread.indexOf(c);
  if (ix >= 0) aiThread.splice(ix, 1);
  aiSetBusy(false); aiRender();
  toast('Cancelled \u2014 nothing was built');
}
const AI_CTR = { open:'status = Open', 'in progress':'status = In Progress',
                 pending:'status = Pending', overdue:'due date < now' };
function aiCounters(v){
  return String(v).split(' + ').map(n => AI_CTR[n.trim().toLowerCase()] || n.trim()).join(', ');
}
function aiPreviewHTML(b, bi){
  const s = aiScope();
  if (b.dash) return aiPreviewDashHTML(b, bi, s);
  const name = b.name.charAt(0).toUpperCase() + b.name.slice(1);
  const tw = aiTwOn(aiThread[bi], 'prev');
  return '<div class="aistep">Configured from your description</div>' +
    '<div class="aians' + (tw ? ' aitw' : '') + '" data-tw="' + bi + '" data-twk="prev"' +
      (tw ? ' onclick="aiTwSkip()"' : '') + '>' +
      '<div class="aiat"><span class="sp"><svg viewBox="0 0 24 24" class="ln">' + AI_IC.wand + '</svg></span>' +
        'Here’s a preview — ' + aiEsc(name) + ' ' + aiEsc(b.group.toLowerCase()) + '</div>' +
      '<div class="aimeta">Request · Count Of · ' + AI_CHARTS[b.chart] + ' chart</div>' +
      '<div class="aiprev"><div class="aiph">' + aiEsc(name) + ' ' + aiEsc(b.group.toLowerCase()) +
        '<span>Preview</span></div><div class="aipb">' + aiPrevArt(b.chart) + '</div></div>' +
      '<div class="aichips">' + AI_CHARTS.map((c, i) =>
        '<button class="aich' + (i === b.chart ? ' on' : '') + '" onclick="aiBuildChart(' + i + ')">' + c + '</button>').join('') + '</div>' +
      '<div class="aiq"><span><b>Module</b> = Request</span><span><b>Group</b> = ' + aiEsc(b.group) + '</span>' +
        (b.states ? '<span><b>Conditions</b> = ' + aiEsc(aiCounters(b.states)) + '</span>' : '') +
        (b.range && b.range !== 'Follow the dashboard'
          ? '<span><b>Range</b> = ' + aiEsc(b.range) + '</span>' : '') + '</div>' +
      '<div class="aiacts">' +
        '<button class="aialt" onclick="aiAddTo()">Add to another</button>' +
        '<button class="aialt" onclick="aiChange()">Change something ›</button>' +
      '</div>' + aiFbHTML(bi, 0) +
    '</div>';
}
function aiPreviewDashHTML(b, bi, s){
  const tw = aiTwOn(aiThread[bi], 'prev');
  return (b.tk ? '' : '<div class="aistep">Planned ' + b.items.length + ' widgets from your description</div>') +
    '<div class="aians' + (tw ? ' aitw' : '') + '" data-tw="' + bi + '" data-twk="prev"' +
      (tw ? ' onclick="aiTwSkip()"' : '') + '>' +
      '<div class="aiat"><span class="sp"><svg viewBox="0 0 24 24" class="ln">' + AI_IC.wand + '</svg></span>' +
        'Here’s a preview — a dashboard with ' + b.items.length + ' widgets</div>' +
      '<div class="aimeta">' + b.items.map(aiEsc).join(' · ') + '</div>' +
      '<div class="aidashp">' + b.items.map((n, i) =>
        '<div class="aidpc"><div class="hd">' + aiEsc(n) + '</div>' +
        '<div class="bd">' + aiPrevArt((b.chart + i) % 3) + '</div></div>').join('') + '</div>' +
      '<div class="aiq"><span><b>Module</b> = Request</span><span><b>Widgets</b> = ' + b.items.length + '</span></div>' +
      '<div class="aiacts">' +
        '<button class="aialt" onclick="aiAddTo()">Add to another</button>' +
      '</div>' + aiFbHTML(bi, 0) +
    '</div>';
}
function aiPrevArt(kind){
  const v = [72, 54, 88, 41, 63, 30];
  if (kind === 2) return '<svg viewBox="0 0 220 74"><path d="M4 62 40 40 76 50 112 20 148 34 184 14 216 26" fill="none" stroke="var(--ai-2)" stroke-width="2.4"/></svg>';
  if (kind === 3) return '<svg viewBox="0 0 220 74"><circle cx="110" cy="37" r="26" fill="none" stroke="var(--chip)" stroke-width="12"/><circle cx="110" cy="37" r="26" fill="none" stroke="var(--ai-2)" stroke-width="12" stroke-dasharray="110 163" transform="rotate(-90 110 37)"/></svg>';
  if (kind === 4) return '<div class="aikpi">' + (aiScope().overdue != null ? aiScope().overdue : 18) + '<span>overdue requests</span></div>';
  if (kind === 5) return '<div class="aitbl">' + ['Urgent','High','Medium'].map((r, i) =>
    '<div><span>' + r + '</span><b>' + v[i] + '</b></div>').join('') + '</div>';
  const horiz = kind === 1;
  return '<svg viewBox="0 0 220 74">' + v.map((x, i) => horiz
    ? '<rect x="4" y="' + (4 + i * 11.5) + '" width="' + (x * 2) + '" height="8" rx="2" fill="var(--ai-2)" opacity="' + (0.4 + i * 0.1) + '"/>'
    : '<rect x="' + (10 + i * 35) + '" y="' + (70 - x * 0.72) + '" width="22" height="' + (x * 0.72) + '" rx="3" fill="var(--ai-2)" opacity="' + (0.45 + i * 0.09) + '"/>'
  ).join('') + '</svg>';
}
function aiChange(){
  const b = aiBuildState; if (!b) return;
  for (let i = aiThread.length - 1; i >= 0; i--)
    if (aiThread[i].r === 'build'){ aiThread.splice(i, 1); break; }
  aiAskGroup(b.name);
}
function aiFbHTML(i, fb, k, extra){
  const fn = (k === undefined) ? 'aiFeed(' + i + ',' : 'aiAgFb(' + i + ',' + k + ',';
  const cp = (k === undefined) ? 'aiCopy(this)' : 'aiAgCopy(this)';
  return '<div class="aifb">' +
    '<button class="' + (fb===1?'on':'') + '" title="Good answer" onclick="' + fn + '1)"><svg viewBox="0 0 24 24"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg></button>' +
    '<button class="dn ' + (fb===-1?'on':'') + '" title="Bad answer" onclick="' + fn + '-1)"><svg viewBox="0 0 24 24"><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/></svg></button>' +
    '<button title="Copy" onclick="' + cp + '"><svg viewBox="0 0 24 24" class="ln"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>' +
    (extra || '') + '</div>';
}
function aiCopyMe(btn){
  const w = btn.closest('.aiuw'), b = w && w.querySelector('.aiu');
  if (b && navigator.clipboard) navigator.clipboard.writeText((b.innerText || '').trim()).catch(()=>{});
  toast('Prompt copied');
}
function aiCopy(btn){
  const box = btn.closest('.aians').querySelector('.aiab, .aiprev');
  if (navigator.clipboard) navigator.clipboard.writeText((box.innerText||'').trim()).catch(()=>{});
  toast('Answer copied');
}
function aiFollow(btn){ aiPush(btn.textContent.replace(/^›\s*/, '').trim()); }
function aiAsk(i){ const L = aiInLogs() ? AI_CTA_LOGS : AI_CTA; aiPush(L[i][2]); }
function aiHash(s){
  let h = 0; s = String(s || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}
function aiPace(q){ return [1, 1.15, 1.34][aiHash(q) % 3]; }
function aiStepMs(label, pace){
  const t = (label && typeof label === 'object') ? (label.s || '') : String(label || '');
  return Math.round((1250 + (t.length % 5) * 270) * (pace || 1));
}
let aiTkT = [], aiTkFin = null;
function aiTkStop(){ aiTkT.forEach(clearTimeout); aiTkT.length = 0; }
function aiTkCancel(){ aiTkStop(); aiTkFin = null; }
function aiTkFlush(){ const f = aiTkFin; aiTkStop(); aiTkFin = null; if (f) f(); }
function aiTkSkip(){ aiTkFlush(); }
function aiTkTog(i){
  const m = aiThread[i];
  if (!m || m.r !== 'tk' || m.run) return;
  m.open = !m.open; aiRender();
}
function aiTkPlan(type, q){
  const s = aiScope(), ms = aiMetrics(), nm = n => '“' + n + '”';
  if (type === 'logs'){
    const L = aiLogScope();
    return { head: 'Analyzing your logs', st: [
      { s:'Reading log types', am:L.types + ' types', dt:[
        ['Window', L.range], ['Busiest type', L.top.n] ]},
      { s:'Totalling events', am:lxK(L.total), dt:[
        ['Top contributor', L.top.n],
        ['Share of the window', L.total ? Math.round(L.top.c / L.total * 100) + '%' : '—'] ]},
      { s:'Checking the severity mix', am:'5 levels' },
      { s:'Composing the answer' } ] };
  }
  if (type === 'widget'){
    const W = ((typeof WIDGETS !== 'undefined' && WIDGETS[WAI_AI.gi]) || [])[WAI_AI.i] || {};
    const wt = String(W.title || 'this widget').replace(/<[^>]*>/g, '');
    const where = ungrouped ? ((document.getElementById('dashTitle') || {}).textContent || '—')
                            : (TABS[WAI_AI.gi] || '—');
    const nums = W.items ? W.items.slice(0, 4).map(x => [String(x[0]), String(x[1])])
               : W.v     ? [['Value', String(W.v).replace(/<[^>]*>/g, '')],
                            ['Delta', String(W.d || '—').replace(/<[^>]*>/g, '')]]
               : W.n     ? [['Cells', String(W.n)]]
               : W.max   ? [['Scale', String(W.max) + (W.u || '')]] : [];
    return { head: 'Reading “' + wt + '”', st: [
      { s:'Reading the widget', am:(W.t || 'widget'), dt:[
        ['Title', wt], ['Type', W.t || '—'], ['On', where] ]},
      { s:'Reading its numbers', am:nums.length ? nums.length + ' values' : 'no series', dt:nums },
      { s:'Checking the time range',
        am:(trSelIdx >= 0 ? TR_PRESETS[trSelIdx][0] : 'custom') },
      { s:'Composing the summary' } ] };
  }
  if (type === 'summary'){
    const gi = (typeof curG === 'number' ? curG : 0);
    const ws = ((typeof WIDGETS !== 'undefined' && WIDGETS[gi]) || []).filter(w => w.title);
    return { head: 'Analyzing this dashboard', st: [
      { s:'Reading widgets', am:ws.length + ' widgets',
        dt: ws.slice(0, 4).map(w => [w.title, w.t || 'widget']) },
      { s:'Checking the request counters',
        am:(s.overdue != null ? s.overdue + ' overdue' : s.kpis.length + ' counters'), dt:
        s.kpis.slice(0, 3).map(k => [k.n, String(k.v)]).concat([['Time range', s.time]]) },
      { s:'Composing the summary' } ] };
  }
  if (type === 'rank') return { head: 'Working out what to do first', st: [
      { s:'Reading counters', am:ms.length + ' counters',
        dt: ms.slice(0, 4).map(x => [x.n, String(x.v)]) },
      { s:'Ranking by movement', am:'7d',
        dt: ms.slice(0, 3).map(x => [x.n, (x.d > 0 ? '+' : '') + x.d + '%']) },
      { s:'Drafting the top ' + Math.min(5, ms.length), am:Math.min(5, ms.length) + ' items' } ] };
  if (type === 'diff') return { head: 'Diffing against your last visit', st: [
      { s:'Loading your last visit', am:'2 days ago', dt:[
        ['Seen at', '9:12 AM'], ['Board', s.dash], ['Time range', s.time] ]},
      { s:'Comparing counters', am:ms.length + ' counters',
        dt: ms.slice(0, 4).map(x => [x.n, (x.d > 0 ? '+' : '') + x.d + '%']) },
      { s:'Keeping the biggest movers', am:'4 rows' } ] };
  if (type === 'attention') return { head: 'Working out what needs attention', st: [
      { s:'Reading counters', am:ms.length + ' counters',
        dt: ms.slice(0, 4).map(x => [x.n, x.src || '—']) },
      { s:'Checking normal bands', am:'7d baseline',
        dt: ms.slice(0, 3).map(x => [x.n, (x.d > 0 ? '+' : '') + x.d + '% vs normal']) },
      { s:'Ranking for your role', am:'by impact' } ] };
  if (type === 'newdash'){
    const d = aiDashSpec(q);
    const taken = (typeof DASH_INDEX !== 'undefined' && DASH_INDEX[d.name]);
    return { head: 'Planning the dashboard', st: [
      { s:'Reading the request', am:'1 board', dt:[ ['Requested name', d.name],
        ['Type', 'New dashboard'] ]},
      { s:'Checking the name',
        am:taken ? 'conflict' : 'free', warn:taken ? 1 : 0,
        dt:[ ['Requested name', d.name],
             ['Result', taken ? 'A dashboard with this name exists' : 'Available'] ]},
      { s:'Filling the form', am:d.cat, dt:[
        ['Category', d.cat], ['Security', d.sec],
        ['Row height', (d.row || 60) + 'px'], ['Default landing', d.land ? 'yes' : 'no'] ]},
      { s:'What changes', am:'1 board', dt:[
        ['Boards added', '1'], ['Boards modified', '0'], ['Widgets touched', '0'] ]} ] };
  }
  if (type === 'build'){
    const b = aiBuildSpec(q);
    if (b.dash) return { head: 'Designing the dashboard', st: [
      'Reading your description — ' + b.items.length + ' widgets',
      'Matching each one to a visualization',
      'Drawing the preview' ] };
    return { head: 'Designing the widget', st: [
      'Reading your description — ' + nm(b.name),
      'Choosing a visualization — ' + (AI_CHARTS[b.chart] || AI_CHARTS[0]),
      'Checking what I still need from you' ] };
  }
  const m = aiPickMetric(q);
  if (m) return { head: 'Checking one counter', st: [
      'Matching your question to a counter on this board',
      'Reading ' + m.n + ' off ' + nm(m.src),
      'Comparing it with the same window last week' ] };
  return { head: 'Working on it', st: [
      'Reading ' + nm(s.dash),
      'Looking for a counter that matches the question',
      'Composing an answer' ] };
}
function aiTkStart(type, q, land){
  const p = aiTkPlan(type, q);
  const tk = { r:'tk', head:p.head, done:p.head, st:p.st, n:1, run:1, open:1,
               t0:Date.now(), ms:0 };
  aiThread.push(tk);
  aiRender();
  aiTkCancel();
  aiTkFin = function(){
    aiTkStop(); aiTkFin = null;
    tk.n = tk.st.length; tk.run = 0; tk.open = 0;
    tk.ms = Date.now() - tk.t0;
    land(tk);
  };
  if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches){
    aiTkT.push(setTimeout(() => { if (aiTkFin) aiTkFin(); }, 500));
    return tk;
  }
  const pace = aiPace(q);
  let t = 0;
  for (let k = 1; k < tk.st.length; k++){
    t += aiStepMs(tk.st[k - 1], pace);
    aiTkT.push(setTimeout(() => { tk.n = k + 1; aiRender(); }, t));
  }
  t += aiStepMs(tk.st[tk.st.length - 1], pace);
  aiTkT.push(setTimeout(() => { if (aiTkFin) aiTkFin(); }, t));
  return tk;
}
function aiTkPlain(m, mi){
  return m.st.slice(0, m.n).map((raw, k) => {
    const st = aiTrStep(raw);
    const running = !!m.run && k === m.n - 1;
    const bad = !running && st.warn;
    const ic = running ? '<span class="aitksp"></span>'
             : bad ? AI_TR_X : AI_TK_TICK;
    return '<div class="aitki' + (running ? ' now' : ' done') + '">' +
        '<span class="ic">' + ic + '</span>' +
        '<span class="tx">' + aiEsc(st.s) + '</span>' +
        (st.am ? '<span class="aitkam">' + aiEsc(st.am) + '</span>' : '') +
      '</div>' +
      (st.dt && st.dt.length
        ? '<div class="aitksub">' + st.dt.map(d =>
            '<div><span class="l">' + aiEsc(d[0]) + '</span>' +
            '<span class="m">' + aiEsc(d[1] || '') + '</span></div>').join('') + '</div>'
        : '');
  }).join('');
}
function aiTrStep(x){ return typeof x === 'string' ? { s:x } : x; }
const AI_TR_X  = '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const AI_TR_OK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
const AI_TR_RE = '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>';
const AI_TR_CV = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const AI_TR_RING = '<svg class="rg" viewBox="0 0 24 24"><circle class="tr" cx="12" cy="12" r="11"/>' +
  '<circle class="ar" cx="12" cy="12" r="11"/></svg>';
function aiTrRows(m, mi){
  return m.st.slice(0, m.n).map((raw, k) => {
    const st = aiTrStep(raw);
    const running = !!m.run && k === m.n - 1;
    const done = !running;
    const bad = done && st.warn;
    const has = !!(st.dt && st.dt.length);
    const open = has && (m.opn && m.opn[k] !== undefined ? m.opn[k] : running);
    const badge = running || !done
      ? '<span class="aitrm">' + AI_TR_RING + '<b>' + (k + 1) + '</b></span>'
      : '<span class="aitrk ' + (bad ? 'no' : 'ok') + '">' + (bad ? AI_TR_X : AI_TR_OK) + '</span>';
    const pill = !done ? ''
      : bad ? '<span class="aitrp no">Conflict <span class="sp">' + AI_TR_RE + '</span></span>'
            : '<span class="aitrp ok">Completed</span>';
    return '<div class="aitrr' + (running ? ' run' : '') + (has ? ' can' : '') +
        (open ? ' op' : '') + '" style="animation-delay:' + (k * 80) + 'ms">' +
      '<button class="aitrb" type="button" aria-expanded="' + (open ? 'true' : 'false') + '"' +
        (has ? ' onclick="aiTrTog(' + mi + ',' + k + ')"' : ' tabindex="-1"') + '>' +
        badge +
        '<span class="aitrl">' + aiEsc(st.s) + '</span>' +
        (st.am ? '<span class="aitra">' + aiEsc(st.am) + '</span>' : '') +
        pill +
        (has ? '<span class="aitrc">' + AI_TR_CV + '</span>' : '') +
      '</button>' +
      (has ? '<div class="aitrd"><div><div class="aitrdi"><span class="ln" aria-hidden="true"></span>' +
        '<div class="rows">' + st.dt.map((d, j) =>
          '<div class="aitrdr" style="animation-delay:' + (120 + j * 100) + 'ms">' +
            '<span class="l">' + aiEsc(d[0]) + '</span>' +
            '<span class="m">' + aiEsc(d[1] || '') + '</span></div>').join('') +
        '</div></div></div></div>' : '') +
    '</div>';
  }).join('');
}
function aiTrTog(mi, k){
  const m = aiThread[mi]; if (!m) return;
  const st = aiTrStep(m.st[k]); if (!st.dt) return;
  m.opn = m.opn || {};
  const running = !!m.run && k === m.n - 1;
  const cur = m.opn[k] !== undefined ? m.opn[k] : running;
  m.opn[k] = !cur;
  aiRender();
}
const AI_TK_TICK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
function aiTkHTML(m, i){
  const rows = aiTkPlain(m, i);
  if (m.run){
    return '<div class="aitk bx run">' +
      '<div class="aitkh">' + aiLdHTML(m.head) +
        '<button class="aitksk" title="Show the answer now" onclick="aiTkSkip()">Skip</button></div>' +
      '</div>';
  }
  return '<div class="aitk bx cl' + (m.open ? ' op' : '') + '">' +
    '<button class="aitkh pill" aria-expanded="' + (m.open ? 'true' : 'false') +
      '" title="' + (m.open ? 'Hide' : 'Show') + ' how this was worked out" onclick="aiTkTog(' + i + ')">' +
      '<span class="aitkt">' + aiEsc(aiTkSummary(m)) + '</span>' +
      '<span class="aitkc"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></span>' +
    '</button>' + (m.open ? '<div class="aitkl tr">' + rows + '</div>' : '') + '</div>';
}
const AI_TK_VERB = { reading:'Read', read:'Read', listing:'Listed', listed:'Listed',
  checking:'Checked', checked:'Checked', totalling:'Totalled', fetched:'Fetched',
  fetching:'Fetched', searching:'Searched', searched:'Searched', ranking:'Ranked',
  ranked:'Ranked', composing:'Composed', composed:'Composed', comparing:'Compared',
  diffing:'Diffed', grouped:'Grouped', grouping:'Grouped', noted:'Noted', looked:'Looked',
  planning:'Planned', planned:'Planned', designing:'Designed', converted:'Converted' };
function aiTkKinds(labels){
  const n = {}, order = [];
  labels.forEach(l => {
    const k = AI_TK_VERB[String(l || '').trim().split(/\s+/)[0].toLowerCase()];
    if (!k) return;
    if (n[k] === undefined){ n[k] = 0; order.push(k); }
    n[k]++;
  });
  return order.slice(0, 2).map(k => k + (n[k] > 1 ? ' ' + n[k] + 'x' : ''));
}
const AI_TK_NAME = 'Thought';
function aiTkSummary(m){ return AI_TK_NAME; }
const AI_AG_FAM = [
  { re:/\bsla\b|breach|violat|response time|resolution time/i, key:'SLA', unit:'count', ctrs:[
      { c:'request.sla.violated',       l:'SLA violated',        avg:'7',     col:'var(--ai-2)' },
      { c:'request.first.response.time',l:'First response time', avg:'1.8 h', col:'var(--teal)' },
      { c:'request.resolution.time',    l:'Resolution time',     avg:'9.4 h', col:'var(--blue)' } ] },
  { re:/overdue|\bdue\b|late/i, key:'Overdue', unit:'count', ctrs:[
      { c:'request.overdue',            l:'Overdue requests',    avg:'18', col:'var(--ai-2)' },
      { c:'request.due.24h',            l:'Due in 24 hours',     avg:'24', col:'var(--teal)' } ],
    live: s => [
      { c:'request.overdue',            l:'Overdue requests',    avg:String(s.overdue != null ? s.overdue : 18), col:'var(--ai-2)' },
      { c:'request.due.24h',            l:'Due in 24 hours',     avg:'24', col:'var(--teal)' } ] },
  { re:/technician|workload|assign|agent/i, key:'Technician load', unit:'count', ctrs:[
      { c:'request.open.by.technician', l:'Open per technician', avg:'11', col:'var(--ai-2)' },
      { c:'request.unassigned',         l:'Unassigned',          avg:'12', col:'var(--teal)' } ],
    live: s => [
      { c:'request.open.by.technician', l:'Open per technician', avg:'11', col:'var(--ai-2)' },
      { c:'request.unassigned',         l:'Unassigned',          avg:String(s.unassigned != null ? s.unassigned : 12), col:'var(--teal)' } ] },
  { re:/csat|satisfaction|feedback|survey/i, key:'CSAT', unit:'%', ctrs:[
      { c:'request.csat.score',         l:'CSAT',                avg:'4.3 / 5', col:'var(--ai-2)' },
      { c:'request.survey.responses',   l:'Survey responses',    avg:'128',     col:'var(--teal)' } ] },
  { re:/reopen/i, key:'Reopened', unit:'count', ctrs:[
      { c:'request.reopened',           l:'Reopened requests',   avg:'7',  col:'var(--ai-2)' },
      { c:'request.resolved',           l:'Resolved',            avg:'38', col:'var(--teal)' } ] },
  { re:/\bchanges?\b|\bcab\b/i, key:'Change', unit:'count', ctrs:[
      { c:'change.open',                l:'Open changes',        avg:'16', col:'var(--ai-2)' },
      { c:'change.emergency',           l:'Emergency changes',   avg:'3',  col:'var(--teal)' } ] },
  { re:/\bproblems?\b|incident/i, key:'Incident', unit:'count', ctrs:[
      { c:'request.incident.open',      l:'Open incidents',      avg:'42', col:'var(--ai-2)' },
      { c:'problem.open',               l:'Open problems',       avg:'6',  col:'var(--teal)' } ] },
  { re:/\bassets?\b|patch|hardware|contract/i, key:'Asset', unit:'count', ctrs:[
      { c:'asset.in.use',               l:'Assets in use',       avg:'1,284', col:'var(--ai-2)' },
      { c:'patch.missing',              l:'Missing patches',     avg:'57',    col:'var(--teal)' } ] },
  { re:/\bopen\b|backlog|queue|pending/i, key:'Backlog', unit:'count', ctrs:[
      { c:'request.open',               l:'Open requests',       avg:'248', col:'var(--ai-2)' },
      { c:'request.pending',            l:'Pending',             avg:'31',  col:'var(--teal)' } ],
    live: s => [
      { c:'request.open',               l:'Open requests',       avg:String(s.open != null ? s.open : 248), col:'var(--ai-2)' },
      { c:'request.pending',            l:'Pending',             avg:'31', col:'var(--teal)' } ] },
  { re:/creat|incoming|volume|trend|time.?series|requests?/i, key:'Request volume', unit:'count', ctrs:[
      { c:'request.created',            l:'Created',             avg:'64', col:'var(--ai-2)' },
      { c:'request.resolved',           l:'Resolved',            avg:'58', col:'var(--teal)' },
      { c:'request.closed',             l:'Closed',              avg:'51', col:'var(--blue)' } ] }
];
function aiAgFam(q){ return AI_AG_FAM.find(f => f.re.test(String(q || ''))) || null; }
let aiAgT = [];
function aiAgStop(){ aiAgT.forEach(clearTimeout); aiAgT.length = 0; }
function aiAgFlush(){
  aiAgStop();
  aiThread.forEach(m => {
    if (m.r !== 'agent' || m.a.state !== 'run') return;
    m.a.n = m.a.bs.length; m.a.state = 'card'; aiSetBusy(false);
  });
}
function aiAgStart(q, sp, fam){
  const s = aiScope();
  const a = { kind:'widget', fam: fam.key, ctrs: (fam.live ? fam.live(s) : fam.ctrs), unit: fam.unit,
    chartName: /time.?series/i.test(q) ? 'time-series' : (AI_CHARTS[sp.chart] || 'Line').toLowerCase(),
    title: (sp.name || fam.key + ' metrics').replace(/^./, c => c.toUpperCase()),
    board: s.dash, target: s.dash,
    time: s.time, seed: 4207, state:'run', n:1, bs:[], open:{}, pace: aiPace(q),
    t0: Date.now(),
    label: 'Designing the ' + (/time.?series/i.test(q) ? 'time-series' :
      (AI_CHARTS[sp.chart] || 'Line').toLowerCase()) + ' widget' };
  a.bs = aiAgPairSays(aiAgBeats(a));
  aiThread.push({ r:'agent', a: a });
  aiRender();
  aiAgRun(a);
}
function aiAgPairSays(bs){
  let last = null;
  bs.forEach(b => {
    if (b.k === 'tool'){ last = b; return; }
    if (b.k === 'say' && last && !last.say) last.say = b.x;
  });
  return bs;
}
function aiAgBeats(a){
  const cs = a.ctrs.map(c => c.c), n = cs.length;
  return [
    { k:'tool', t:'Reasoning', ms:1900, st:[
      'Read the request — a ' + a.chartName + ' widget for ' + a.fam + ' metrics',
      'Context is ' + aiScopeCur + ' · building on “' + a.board + '”',
      'Data source: Request module — that is where ' + a.fam + ' fields live' ] },
    { k:'say', ms:1150, x:'Let me find the right ' + a.fam +
      ' counters and work out how the widget should be configured.' },
    { k:'tool', t:'Searched counters, read the widget reference', ms:2700, st:[
      'Searched the Request module for “' + a.fam.toLowerCase() + '”',
      'Matched ' + n + ' counters — ' + cs.join(', '),
      'Read Create Widget: X-Axis, Y-Axis Function, Y-Axis Column, Conditions',
      'Chose Count Of over the dashboard’s own time range' ] },
    { k:'say', ms:1150, x:'Let me check those counters are actually reporting before I build anything.' },
    { k:'tool', t:'Fetched counter data', ms:2400, st:[
      'Queried ' + n + ' counters over ' + a.time,
      'All ' + n + ' returned data — no gaps in the window' ] },
    { k:'say', ms:1150, x:'The ' + a.fam + ' counters are reporting. Let me add the ' +
      a.chartName + ' widget to “' + a.board + '”.' },
    { k:'tool', t:'Prepared the widget', ms:1500, st:[ 'Built the query and the preview below' ] },
    { k:'card', ms:0 }
  ];
}
function aiAgSumStart(q){
  const s = aiScope();
  const a = { kind:'summary', board:s.dash, time:s.time, n:1, state:'run', bs:[], open:{},
    t0: Date.now(),
    label: 'Reading “' + s.dash + '”',
              pace: aiPace(q), ans: aiBuildAnswer('summary', q), nw:s.n,
              open:s.open, overdue:s.overdue };
  a.bs = aiAgPairSays(aiAgSumBeats(a, s));
  aiThread.push({ r:'agent', a: a });
  aiRender();
  aiAgRun(a);
}
function aiAgSumBeats(a, s){
  const gi = (typeof curG === 'number' ? curG : 0);
  const ws = ((typeof WIDGETS !== 'undefined' && WIDGETS[gi]) || []).filter(w => w.title && w.t !== 'note');
  const named = ws.slice(0, 3).map(w => w.title).join(', ');
  return [
    { k:'tool', t:'Reasoning', ms:1900, st:[
      'Read the request — a summary of this dashboard',
      'Context is ' + aiScopeCur + ' · board “' + a.board + '”',
      'A summary reads the board; it changes nothing, so there is nothing to approve' ] },
    { k:'say', ms:1150, x:'Let me read what is actually on “' + a.board + '” before I summarise it.' },
    { k:'tool', t:'Read the board', ms:2700, st:[
      'Listed ' + ws.length + ' widgets — ' + named + (ws.length > 3 ? ' and ' + (ws.length - 3) + ' more' : ''),
      'Grouped them by what they measure',
      'Noted the time range — ' + a.time ] },
    { k:'say', ms:1150, x:'Now let me see how it is reading right now.' },
    { k:'tool', t:'Fetched the counters behind it', ms:2400, st:[
      (s.kpis[0] ? s.kpis[0].n + ' — ' + s.kpis[0].v : 'No counters on this board'),
      (s.kpis[1] ? s.kpis[1].n + ' — ' + s.kpis[1].v : 'Charts and lists read as they are'),
      'Compared each against its normal band' ] },
    { k:'say', ms:1150, x:'Here is how the board reads.' },
    { k:'scard', ms:0 }
  ];
}
function aiAgDashBeats(a, d){
  const taken = (typeof DASH_INDEX !== 'undefined' && DASH_INDEX[d.name]);
  return [
    { k:'tool', t:'Reasoning', ms:1900, st:[
      'Read the request — a new dashboard called “' + d.name + '”',
      'Context is ' + aiScopeCur + ' · creating alongside “' + a.board + '”',
      'A dashboard is shared, so this needs your approval before anything is made' ] },
    { k:'say', ms:1150, x:'Let me check the name is free and fill the form from your defaults.' },
    { k:'tool', t:'Checked the name', ms:2200, st:[
      'Looked “' + d.name + '” up in the dashboard list',
      taken ? 'A dashboard with this name already exists — flagged it'
            : 'The name is not taken' ] },
    { k:'say', ms:1150, x: taken
      ? 'That name is already in use — you will want to change it before approving.'
      : 'The name is free. Now the settings.' },
    { k:'tool', t:'Filled the Create Dashboard form', ms:2400, st:[
      'Category — ' + d.cat,
      'Security — ' + d.sec,
      'Row height ' + (d.row || 60) + 'px · gaps ' + d.hgap + '/' + d.vgap + 'px',
      'Default landing — ' + (d.land ? 'yes' : 'no') ] },
    { k:'say', ms:1150, x:'Here is the plan. Nothing is created until you approve it.' }
  ];
}
function aiAgDashStart(q){
  const s = aiScope(), d = aiDashSpec(q);
  const a = { kind:'dash', board:s.dash, time:s.time, n:1, state:'run', bs:[], open:{},
    t0: Date.now(), pace: aiPace(q), d: d,
    label: 'Planning “' + d.name + '”' };
  a.bs = aiAgPairSays(aiAgDashBeats(a, d));
  aiThread.push({ r:'agent', a: a });
  aiRender();
  aiAgRun(a);
}
function aiAgDashLand(a){
  if (a.landed) return;
  a.landed = 1; a.state = 'done';
  a.d.tk = 1;
  aiThread.push({ r:'dash', d: a.d });
  aiSetBusy(false);
}
function aiAgRun(a){
  aiAgStop();
  let t = 0;
  const pace = a.pace || 1;
  for (let k = 1; k < a.bs.length; k++){
    t += (a.bs[k - 1].ms || 600) * pace;
    aiAgT.push(setTimeout(() => { a.n = k + 1; aiRender(); }, t));
  }
  aiAgT.push(setTimeout(() => {
    if (a.kind === 'dash'){ aiAgDashLand(a); aiRender(); return; }
    a.state = (a.state === 'run') ? 'card' : a.state;
    if (a.state === 'card') aiSetBusy(false);
    aiRender();
  }, t + 40));
}
function aiAgSkip(i){
  const m = aiThread[i]; if (!m || m.r !== 'agent') return;
  const a = m.a;
  aiAgStop();
  a.n = a.bs.length;
  if (a.kind === 'dash'){ aiAgDashLand(a); aiRender(); return; }
  if (a.state === 'run'){ a.state = 'card'; aiSetBusy(false); }
  else if (a.state === 'adding') a.state = 'done';
  aiRender();
}
function aiAgTog(i, k){
  const m = aiThread[i]; if (!m || m.r !== 'agent') return;
  m.a.open[k] = !m.a.open[k]; aiRender();
}
function aiAgFb(i, k, v){
  const m = aiThread[i]; if (!m || m.r !== 'agent') return;
  const b = m.a.bs[k]; if (!b) return;
  b.fb = (b.fb === v ? 0 : v); aiRender();
  if (b.fb === 1) toast('Marked helpful');
  else if (b.fb === -1) toast('Thanks — logged, and used to tune future answers');
}
function aiAgCopy(btn){
  const box = btn.closest('.aiagblk');
  if (box && navigator.clipboard) navigator.clipboard.writeText((box.innerText || '').trim()).catch(()=>{});
  toast('Copied');
}
function aiAgShare(ev, i){
  ev.stopPropagation();
  const open = document.getElementById('aiAgM');
  if (open){ open.remove(); return; }
  const m = aiThread[i]; if (!m) return;
  const el = document.createElement('div');
  el.className = 'aiagm'; el.id = 'aiAgM';
  el.innerHTML = (m.a.kind === 'summary')
    ? '<button onclick="aiAgShareDo(' + i + ',\'copy\')">Copy summary<i>⌘C</i></button>' +
      '<hr><div class="hd">Use within ServiceOps</div>' +
      '<button onclick="aiAgShareDo(' + i + ',\'report\')">Add to a report</button>' +
      '<button onclick="aiAgShareDo(' + i + ',\'pdf\')">Export as PDF</button>'
    : '<div class="hd">Use within ServiceOps</div>' +
      '<button onclick="aiAgShareDo(' + i + ',\'dash\')">Add to another dashboard</button>' +
      '<button onclick="aiAgShareDo(' + i + ',\'report\')">Add to a report</button>' +
      '<button onclick="aiAgShareDo(' + i + ',\'csv\')">Export as CSV</button>';
  const host = ev.target.closest('.aifb') || ev.target.closest('.aiagc')
            || ev.target.closest('.aiagblk');
  if (!host) return;
  host.appendChild(el);
  setTimeout(() => document.addEventListener('mousedown', aiAgShareAway), 0);
}
function aiAgDest(ev, i){
  ev.stopPropagation();
  const gone = document.getElementById('aiAgM'); if (gone) gone.remove();
  const m = aiThread[i]; if (!m) return;
  const el = document.createElement('div');
  el.className = 'aiagm dest'; el.id = 'aiAgM';
  el.innerHTML = '<div class="hd">Put this widget on</div>' +
    DASH_GROUPS.map(g =>
      '<div class="gp">' + aiEsc(g.name) + '</div>' +
      g.items.map(it => {
        const n = it[0], on = (n === m.a.target);
        return '<button class="' + (on ? 'on' : '') + '" onclick="aiAgDestPick(' + i + ',' +
          JSON.stringify(n).replace(/"/g, '&quot;') + ')"><span class="k">' +
          (on ? AI_TK_TICK : '') + '</span>' + aiEsc(n) +
          (n === dashState.cur ? '<i>open</i>' : '') + '</button>';
      }).join('')).join('');
  const host = ev.target.closest('.aiagfu') || ev.target.closest('.aiagpl') ||
               ev.target.closest('.aiagc');
  if (!host) return;
  host.appendChild(el);
  setTimeout(() => document.addEventListener('mousedown', aiAgShareAway), 0);
}
function aiAgDestPick(i, name){
  const el = document.getElementById('aiAgM'); if (el) el.remove();
  document.removeEventListener('mousedown', aiAgShareAway);
  const m = aiThread[i]; if (!m) return;
  if (m.a.saved){ aiAgPlaceOn(i, name); return; }
  m.a.target = name;
  aiRender();
}
function aiAgPlaceOn(i, name){
  const m = aiThread[i]; if (!m) return;
  const a = m.a, nm = a.saved || a.title;
  if (name !== dashState.cur) IRIS.go(name);
  setTimeout(() => IRIS.addWidget(nm, 'line', { series: a.ctrs.map(c => c.l) }), 60);
  a.placed = name;
  aiRender();
}
function aiAgShareAway(e){
  if (e.target.closest('#aiAgM')) return;
  const m = document.getElementById('aiAgM'); if (m) m.remove();
  document.removeEventListener('mousedown', aiAgShareAway);
}
function aiAgShareDo(i, what){
  const el = document.getElementById('aiAgM'); if (el) el.remove();
  document.removeEventListener('mousedown', aiAgShareAway);
  const m = aiThread[i]; if (!m) return;
  const a = m.a;
  if (a.kind === 'summary'){
    const box = document.querySelector('#aiBody .aiagsum');
    if (what === 'copy'){
      if (navigator.clipboard) navigator.clipboard.writeText(box ? (box.innerText || '').trim() : '').catch(()=>{});
      toast('Summary copied');
    }
    else if (what === 'report'){
      toast('Reports — scheduling is configured there; this prototype stores no schedules');
    }
    else {
      const txt = box ? (box.innerText || '').trim() : '';
      const name = 'summary-' + String(a.board).toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + lxFileStamp() + '.txt';
      toast(lxDownload(name, txt, 'text/plain')
        ? 'Exported the summary of “' + a.board + '” to ' + name
        : 'The browser blocked the download — open this page over http rather than file://');
    }
    return;
  }
  const q = a.ctrs.map(c => c.c).join(', ');
  if (what === 'copy'){
    if (navigator.clipboard) navigator.clipboard.writeText('avg of ' + q).catch(()=>{});
    toast('Query copied — avg of ' + q);
  }
  else if (what === 'dash'){ aiBuildState = { name:a.title, group:a.fam, chart:2 }; aiAddTo(); }
  else if (what === 'report'){
    toast('Reports — “' + a.title + '” can be scheduled there');
  }
  else {
    const csv = [['Counter','Label','Average']].concat(a.ctrs.map(c => [c.c, c.l, c.avg]))
      .map(r => r.map(lxCsvCell).join(',')).join('\r\n');
    const name = String(a.title).toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + lxFileStamp() + '.csv';
    toast(lxDownload(name, csv, 'text/csv')
      ? 'Exported ' + a.ctrs.length + ' counters to ' + name
      : 'The browser blocked the download — open this page over http rather than file://');
  }
}
function aiAgAccept(i){
  const m = aiThread[i]; if (!m || m.a.state !== 'card') return;
  const a = m.a;
  const tgt = a.target || aiScope().dash;
  const moved = (tgt !== dashState.cur);
  aiAgLib(a);
  if (moved) IRIS.go(tgt);
  a.board = tgt; a.placed = tgt;
  setTimeout(() => IRIS.addWidget(a.saved || a.title, 'line', { series: a.ctrs.map(c => c.l) }), 60);
  a.state = 'adding';
  a.bs = a.bs.concat([
    { k:'tool', t:'Added the widget', ms:2000, st:[
      'Saved “' + (a.saved || a.title) + '” to Created by me',
      'Added it to “' + tgt + '”',
      moved ? 'Opened “' + tgt + '” to place it — it was not the board in front of you'
            : 'Placed it at the end of the board you were on',
      'Registered it in history — ⌘Z reverses it' ] },
    { k:'sum', ms:0 }
  ]);
  aiRender();
  aiAgTail(a);
}
function aiAgLib(a){
  let n = a.title, k = 2;
  if (typeof W_USER !== 'undefined'){
    while (W_USER.some(x => x[0] === n)) n = a.title + ' (' + (k++) + ')';
    W_USER.push([n, 'line']);
  }
  a.saved = n;
  return n;
}
function aiAgTail(a){
  aiAgStop();
  let t = 0;
  for (let k = a.n; k < a.bs.length; k++){
    t += (a.bs[k - 1].ms || 1400) * (a.pace || 1);
    aiAgT.push(setTimeout(() => { a.n = k + 1; if (a.n >= a.bs.length) a.state = 'done'; aiRender(); }, t));
  }
}
function aiAgUndoable(a){ return !!(a && (a.placed || a.saved)); }
function aiAgUndo(i){
  const m = aiThread[i]; if (!m || !m.a) return;
  const a = m.a, did = [];
  if (a.placed){
    IRIS.undoAdd();
    did.push('taken off “' + a.placed + '”');
    a.placed = null;
  }
  if (a.saved && typeof W_USER !== 'undefined'){
    const k = W_USER.findIndex(x => x[0] === a.saved);
    if (k > -1) W_USER.splice(k, 1);
    did.push('removed from your widget library');
    a.saved = null;
  }
  if (!did.length){ toast('Nothing left to undo here'); return; }
  aiRender();
  toast('Undone — ' + did.join(' and '));
}
function aiAgSave(i){
  const m = aiThread[i]; if (!m || m.a.state !== 'card') return;
  const a = m.a;
  const n = aiAgLib(a);
  a.state = 'adding';
  a.bs = a.bs.concat([
    { k:'tool', t:'Saved the widget', ms:2000, st:[
      'Saved “' + n + '” to Created by me',
      'It is a definition, not a placement — no dashboard was changed',
      'Reachable from Add Widget → Created by me' ] },
    { k:'sum', ms:0 }
  ]);
  aiRender();
  aiAgTail(a);
  toast('Saved “' + n + '” to Created by me — not placed on a dashboard');
}
function aiAgReject(i){
  const m = aiThread[i]; if (!m || m.a.state !== 'card') return;
  m.a.state = 'rejected'; aiAgStop(); aiRender();
  toast('Nothing was added');
}
function aiAgRetry(i){
  const m = aiThread[i]; if (!m) return;
  const a = m.a;
  a.state = 'run'; a.n = 1; a.open = {};
  a.bs = aiAgPairSays(aiAgBeats(a));
  aiRender(); aiAgRun(a);
}
function aiAgChart(a){
  const W = 452, H = 132, L = 26, R = 6, T = 8, B = 20;
  const iw = W - L - R, ih = H - T - B, N = 90;
  const grid = [0, 1, 2, 3, 4].map(v =>
    '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ih - v / 4 * ih) + '" y2="' + (T + ih - v / 4 * ih) +
    '" stroke="var(--border)" stroke-width="1"/>' +
    '<text x="' + (L - 6) + '" y="' + (T + ih - v / 4 * ih + 3.5) + '" text-anchor="end" ' +
    'font-size="8.5" fill="var(--muted)">' + v + '</text>').join('');
  const ticks = ['−45m', '−30m', '−15m', 'now'].map((s, i) =>
    '<text x="' + (L + iw * (i / 3)) + '" y="' + (H - 5) + '" text-anchor="' +
    (i === 0 ? 'start' : i === 3 ? 'end' : 'middle') + '" font-size="8.5" ' +
    'fill="var(--muted)">' + s + '</text>').join('');
  const lines = a.ctrs.map((c, ci) => {
    const r = rng(a.seed + ci * 97), base = 1.4 - ci * 0.35;
    let d = '';
    for (let i = 0; i < N; i++){
      const spike = r() > 0.9 ? r() * 2.4 : 0;
      const v = Math.max(0.05, base + (r() - 0.45) * 0.7 + spike);
      d += (i ? 'L' : 'M') + (L + iw * (i / (N - 1))).toFixed(1) + ' ' +
           (T + ih - Math.min(v, 4) / 4 * ih).toFixed(1) + ' ';
    }
    return '<path d="' + d + '" fill="none" stroke="' + c.col + '" stroke-width="1.2" opacity=".9"/>';
  }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
    aiEsc(a.fam) + ' counters over the last 45 minutes">' + grid + lines + ticks + '</svg>' +
    '<div class="aiaglg">' + a.ctrs.map(c =>
      '<span><i style="background:' + c.col + '"></i>' + aiEsc(c.l) + ' <b>avg ' + c.avg + '</b></span>').join('') +
    '</div>';
}
const AI_LD_DELAY = Array.from({ length: 9 }, (_, i) =>
  ((i % 3) + Math.abs(Math.floor(i / 3) - 1)) * 90);
const AI_LD_CLS = { think:'aidpb', create:'aidcs', query:'aidss' };
let AI_LD_KIND = 'think';
const AI_LD_MARK = () => '<span class="aildm" aria-hidden="true"><span class="aidotm ' +
  (AI_LD_CLS[AI_LD_KIND] || 'aidpb') + '">' + '<i></i>'.repeat(25) + '</span></span>';
let aiLdLast = '';
function aiLdHTML(label){
  const fresh = !document.querySelector('.aildl') || label !== aiLdLast;
  aiLdLast = label;
  return AI_LD_MARK() + '<span class="aildl' + (fresh ? ' fresh' : '') + '">' + aiEsc(label) + '</span>' +
    '<span class="aildt" id="aiLdClock">0.0s</span>';
}
function aiLdFmt(ms){
  const t = ms / 1000;
  return t < 60 ? t.toFixed(1) + 's'
                : Math.floor(t / 60) + 'm ' + (t % 60).toFixed(1) + 's';
}
let aiLdT = null;
function aiLdStart(t0){
  aiLdStop();
  if (!t0) return;
  aiLdT = setInterval(() => {
    const el = document.getElementById('aiLdClock');
    if (!el){ aiLdStop(); return; }
    el.textContent = aiLdFmt(Date.now() - t0);
  }, 100);
}
function aiLdStop(){ if (aiLdT){ clearInterval(aiLdT); aiLdT = null; } }
const AI_AG_SPIN = '<span class="aitksp"></span>';
function aiAgSummary(a, pre, steps){ return AI_TK_NAME; }
function aiAgHTML(a, i){
  const out = [];
  const N = Math.min(a.n, a.bs.length);
  const cardIx = a.bs.findIndex(x => x.k === 'card' || x.k === 'scard');
  const pre = [], says = [];
  for (let k = 0; k < N; k++){
    const b = a.bs[k];
    if (cardIx > -1 && k > cardIx) break;
    if (b.k === 'tool') pre.push(b);
    else if (b.k === 'say') says.push([k, b]);
  }
  if (pre.length){
    const steps = pre.reduce((s, b) => s + b.st.length, 0);
    const running = a.state === 'run';
    const op = !!a.open.think;
    const cur = pre[pre.length - 1];
    const lbl = (cur && cur.t && cur.t !== 'Reasoning') ? cur.t : (a.label || 'Reasoning');
    const head = running
      ? aiLdHTML(lbl)
      : '<span class="aitkt">' + aiEsc(aiAgSummary(a, pre, steps)) + '</span>';
    const liveSay = (running && says.length) ? says[says.length - 1][1].x : '';
    out.push('<div class="aitk bx ' + (running ? 'run' : 'cl') + (op ? ' op' : '') + '">' +
      (running
        ? '<div class="aitkh">' + head +
            '<button class="aitksk" title="Show the result now" onclick="aiAgSkip(' + i + ')">Skip</button>' +
          '</div>' + (liveSay ? '<p class="aiagsay live">' + aiEsc(liveSay) + '</p>' : '')
        : '<button class="aitkh pill" onclick="aiAgTog(' + i + ',\'think\')" aria-expanded="' + op + '">' + head +
          '<span class="aitkc"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></span></button>') +
      (op && !running ? '<div class="aitkl">' + pre.map(b =>
        '<div class="aitkg">' + aiEsc(b.t) + '</div>' + b.st.map(s =>
          '<div class="aitki done"><span class="ic">' + AI_TK_TICK + '</span>' + aiEsc(s) + '</div>'
        ).join('') + (b.say ? '<p class="aiagsl">' + aiEsc(b.say) + '</p>' : '')
      ).join('') + '</div>' : '') + '</div>');
  }
  for (let k = 0; k < N; k++){
    const b = a.bs[k];
    if (b.k === 'say') continue;
    if (b.k === 'tool'){
      if (cardIx < 0 || k < cardIx) continue;
      const running = a.state === 'adding' && k === a.n - 1;
      const op = !!a.open[k];
      const head = '<span class="aitkm">' + (running ? AI_AG_SPIN : AI_SPARK) + '</span>' +
        '<span class="aitkt">' + aiEsc(b.t) + '</span>' +
        '<span class="aitkn">' + b.st.length + ' step' + (b.st.length > 1 ? 's' : '') + '</span>';
      out.push('<div class="aitk ' + (running ? 'run' : 'cl') + (op ? ' op' : '') + '">' +
        (running
          ? '<div class="aitkh">' + head + '</div>'
          : '<button class="aitkh" onclick="aiAgTog(' + i + ',' + k + ')" aria-expanded="' + op + '">' + head +
            '<span class="aitkc"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></span></button>') +
        (op ? '<div class="aitkl">' + b.st.map(s =>
          '<div class="aitki done"><span class="ic">' + AI_TK_TICK + '</span>' +
          '<span class="tx">' + aiEsc(s) + '</span></div>').join('') +
          '</div>' : '') + '</div>');
      continue;
    }
    if (b.k === 'card'){
      if (a.state === 'rejected'){
        out.push('<p class="aiagrj">Rejected — nothing was added to “' + aiEsc(a.board) + '”.</p>' +
          '<div class="aiacts"><button class="aialt" onclick="aiAgRetry(' + i + ')">Try again</button>' +
          '<button class="aialt" onclick="aiChangeAg(' + i + ')">Build something else</button></div>');
        continue;
      }
      const made = (a.state === 'adding' || a.state === 'done');
      const shut = made && a.open.card === false;
      out.push('<div class="aiagc">' +
        '<div class="aiagch">' +
          (made ? '<svg class="ok" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' : '') +
          '<b>' + (made ? (a.placed ? 'Created Widget' : 'Saved Widget') : 'Create Widget') + '</b>' +
          (made
            ? '<button class="aiagib" data-tip="' + (shut ? 'Show' : 'Hide') + ' the preview" onclick="aiAgCard(' + i + ')">' +
              '<svg viewBox="0 0 24 24"><path d="' + (shut ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6') + '"/></svg></button>'
            : '') +
        '</div>' +
        (shut ? '' : '<div class="aiagcb">' + aiAgChart(a) + '</div>') +
      '</div>' +
      (made ? '' :
        aiFbHTML(i, b.fb || 0, k,
          '<button data-tip="Use this elsewhere" onclick="aiAgShare(event,' + i + ')">' +
          '<svg viewBox="0 0 24 24" class="ln"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/>' +
          '<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></button>')) +
      (made ? '' :
        '<div class="aiagblk aiagfu"><div class="aiful">Follow ups</div>' +
          '<button class="aifu" onclick="aiAgDest(event,' + i + ')"><span class="cv">\u203a</span>' +
            'Adding to \u201c' + aiEsc(a.target || a.board) + '\u201d \u2014 put it somewhere else</button>' +
          '<button class="aifu" onclick="aiAgSave(' + i + ')"><span class="cv">\u203a</span>' +
            'Save it to the library without adding it</button>' +
          '<button class="aifu" onclick="aiAgReject(' + i + ')"><span class="cv">\u203a</span>' +
            'Reject it and build something else</button></div>'));
      continue;
    }
    if (b.k === 'scard'){
      const tw = aiTwOn(aiThread[i], 'sum');
      out.push('<div class="aiagc sum' + (tw ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="sum"' +
        (tw ? ' onclick="aiTwSkip()"' : '') + '>' +
        '<div class="aiagch">' +
          '<span class="aiagmk">' + AI_SPARK + '</span>' +
          '<b class="gro">Dashboard summary</b>' +
        '</div>' +
        '<div class="aiagcb aiab aiagsum">' + a.ans.html + '</div>' +
      '</div>' +
      '<div class="aiagblk' + (tw ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="sum">' +
        aiFbHTML(i, b.fb || 0, k,
          '<button data-tip="Use this elsewhere" onclick="aiAgShare(event,' + i + ')">' +
          '<svg viewBox="0 0 24 24" class="ln"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/>' +
          '<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></button>') +
        (a.ans.fu && a.ans.fu.length ? '<div class="aiful">Follow ups</div>' +
          a.ans.fu.map(q => '<button class="aifu" onclick="aiFollow(this)"><span class="cv">›</span>' +
            aiEsc(q) + '</button>').join('') : '') +
      '</div>');
      continue;
    }
    if (b.k === 'sum'){
      const nm = a.saved || a.title;
      const twa = aiTwOn(aiThread[i], 'wsum');
      out.push('<div class="aiagblk' + (twa ? ' aitw' : '') + '" data-tw="' + i + '" data-twk="wsum"' +
        (twa ? ' onclick="aiTwSkip()"' : '') + '><p class="aiagsay">The ' + aiEsc(a.fam) + ' ' + a.chartName +
        ' widget is saved to your widget library as <b>' + aiEsc(nm) + '</b>' +
        (a.placed
          ? ', and added to your <b>' + aiEsc(a.placed) + '</b> dashboard.'
          : '. It is <b>not on a dashboard</b> — saving keeps the definition, placing it is a ' +
            'separate step.') + ' It shows ' +
        (a.ctrs.length === 3 ? 'three' : a.ctrs.length === 2 ? 'two' : a.ctrs.length) +
        ' counters as line charts:</p><ul class="aiab">' +
        a.ctrs.map(c => '<li><b>' + aiEsc(c.l) + '</b> (<code>' + aiEsc(c.c) + '</code>) — avg ' +
          aiEsc(c.avg) + '</li>').join('') + '</ul>' +
        '<p class="aiagsay">' + (a.placed
          ? 'You can <a class="ailink" onclick="aiInvestigate(' +
            JSON.stringify(nm).replace(/"/g, '&quot;') + ')">view the widget on the dashboard</a>. '
          : 'Find it under <b>Add Widget → Created by me</b>, or put it on a dashboard now. ') +
        '</p>' +
        aiFbHTML(i, b.fb || 0, k, aiAgUndoable(a)
          ? '<button class="wlbl" title="Undo — reverse what was just done" ' +
            'onclick="aiAgUndo(' + i + ')"><svg viewBox="0 0 24 24" class="ln">' +
            '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>' +
            '<span>Undo</span></button>'
          : '') +
        '<div class="aiagpl"><div class="aiful">Follow ups</div>' +
          (a.placed ? '' :
            '<button class="aifu" onclick="aiAgDest(event,' + i + ')"><span class="cv">\u203a</span>' +
              'Put it on a dashboard</button>') +
          '<button class="aifu" onclick="aiAgMore()"><span class="cv">\u203a</span>' +
            'Add another widget</button>' +
          '<button class="aifu" onclick="aiAgEdit(' + i + ')"><span class="cv">\u203a</span>' +
            'Change the counters</button>' +
        '</div></div>');
    }
  }
  if (a.state === 'adding' || (a.state === 'run' && !pre.length))
    out.push('<div class="aiagsk"><button class="aitksk" title="Show the result now" ' +
      'onclick="aiAgSkip(' + i + ')">Skip</button></div>');
  return out.join('');
}
function aiAgCard(i){
  const m = aiThread[i]; if (!m) return;
  m.a.open.card = (m.a.open.card === false) ? true : false;
  aiRender();
}
function aiAgEdit(i){
  const m = aiThread[i]; if (!m) return;
  const el = document.getElementById('aiIn');
  el.value = 'Build a ' + m.a.chartName + ' widget for ' + m.a.fam.toLowerCase() + ' metrics';
  aiGrow(el); el.focus();
  toast('Edit the request and send it again');
}
function aiChangeAg(i){
  const el = document.getElementById('aiIn');
  el.value = 'Build a '; aiGrow(el); el.focus();
}
function aiAgMore(){
  const el = document.getElementById('aiIn');
  el.value = 'Build a time-series widget for '; aiGrow(el); el.focus();
}
function aiPush(text){
  if (aiBusy) return;
  aiAutoName(text);
  if (!aiInScope(text)){
    aiThread.push({ r:'me', t:text }, { r:'wait', step:'Checking what I can answer' });
    aiRender(); aiSetBusy(true);
    setTimeout(() => { aiThread.pop(); aiThread.push(Object.assign({ r:'ai' }, aiOutHTML()));
      aiSetBusy(false); aiRender(); }, 500);
    return;
  }
  const type = aiRoute(text);
  const logq = aiInLogs() && aiLogQ(text);
  AI_LD_KIND = logq ? 'query'
    : (type === 'newdash' || type === 'build') ? 'create' : 'think';
  const need = (type === 'build' || type === 'newdash' || logq) ? null : aiScopeNeeds(text);
  if (need){
    aiThread.push({ r:'me', t:text }, { r:'wait', step:'Checking your scope' });
    aiRender(); aiSetBusy(true);
    setTimeout(() => { aiThread.pop(); aiThread.push(Object.assign({ r:'ai' }, aiMismatchHTML(need)));
      aiSetBusy(false); aiRender(); }, 500);
    return;
  }
  aiSetBusy(true);
  aiThread.push({ r:'me', t:text });
  aiRender();
  if (logq){
    aiTkStart('logs', text, tk => {
      const a = aiLogQHTML(logq);
      a.tk = 1; tk.done = a.step;
      aiThread.push(Object.assign({ r:'ai' }, a));
      aiSetBusy(false); aiRender();
    });
    return;
  }
  if (aiInLogs() && (type === 'summary' || type === 'rank' || type === 'metric' ||
                     type === 'attention')){
    aiTkStart('logs', text, tk => {
      const a = aiLogAnswer(type, text);
      a.tk = 1; tk.done = a.step;
      aiThread.push(Object.assign({ r:'ai' }, a));
      aiSetBusy(false); aiRender();
    });
    return;
  }
  if (type === 'summary'){ aiAgSumStart(text); return; }
  if (type === 'newdash'){ aiAgDashStart(text); return; }
  if (type === 'build'){
    const sp = aiBuildSpec(text), fam = sp.dash ? null : aiAgFam(text);
    if (fam){ aiAgStart(text, sp, fam); return; }
  }
  aiTkStart(type, text, tk => {
    const a = aiBuildAnswer(type, text);
    if (a.newdash){
      a.newdash.tk = 1;
      tk.done = 'Planned a new dashboard';
      aiThread.push({ r:'dash', d: a.newdash });
      aiSetBusy(false); aiRender();
      return;
    }
    if (a.build){
      aiSetBusy(false);
      if (a.build.dash){
        aiBuildState = a.build; aiBuildState.tk = 1;
        tk.done = 'Planned ' + a.build.items.length + ' widgets from your description';
        aiThread.push({ r:'build', b: aiBuildState });
        aiRender();
        aiBuildAuto();
      } else {
        aiBuildState = null;
        tk.done = 'Read your description';
        aiAskGroup(a.build.name, a.build.chart);
      }
      return;
    }
    a.tk = 1;
    tk.done = a.step || tk.head;
    aiThread.push(Object.assign({ r:'ai' }, a));
    aiSetBusy(false); aiRender();
  });
}
function aiSend(){
  const el = document.getElementById('aiIn');
  const v = el.value.trim(); if(!v) return;
  el.value = ''; aiGrow(el);
  aiSuggHide();
  aiPush(v);
}
function aiGrow(t){ t.style.height='auto'; t.style.height = Math.min(150, t.scrollHeight) + 'px';
  aiTypedPaint(); }
function aiTypedPaint(){
  const t = document.getElementById('aiIn'), box = document.querySelector('.aiinbox');
  if (!t || !box) return;
  box.classList.toggle('typed', !!t.value.trim());
}
let AI_CHATS = [], aiChatId = 1;
function aiFile(){
  if (!aiThread.length) return;
  const asked = aiThread.filter(m => m.r === 'me').length;
  const found = AI_CHATS.find(c => c.id === aiChatId);
  const rec = { id: aiChatId, n: aiChatName, msgs: aiThread.slice(), asked: asked, t: Date.now() };
  if (found) Object.assign(found, rec); else AI_CHATS.unshift(rec);
}
const AI_MIN = 60000, AI_HR = 60 * AI_MIN, AI_DAY = 24 * AI_HR;
[ ['Summarise Helpdesk Overview', 4, 6 * AI_MIN,
   'Read the widgets on Helpdesk Overview and ranked what matters — 18 overdue and 12 unassigned requests lead it.'],
  ['Add requests by priority to this board', 3, 48 * AI_MIN,
   'Built a Column widget from Requests grouped by priority, previewed it, and added it to Helpdesk Overview.'],
  ['Why are 18 requests overdue?', 5, 3 * AI_HR,
   'Traced the overdue count to the Network and Access categories — 11 of the 18 sit with two technician groups.'],
  ['Create an SLA Watch dashboard', 6, 1 * AI_DAY + 2 * AI_HR,
   'Created the dashboard in the Service Desk category, public, with a 60px row height, then seeded it with four widgets.'],
  ['Clone the SLA compliance widget', 2, 1 * AI_DAY + 5 * AI_HR,
   'Cloned SLA Compliance as “Copy of SLA Compliance” and opened the editor on it.'],
  ['Which technicians are overloaded?', 3, 3 * AI_DAY + 4 * AI_HR,
   'Listed technicians by open requests — Priya, Rahul and Sneha carry 41% of the queue between them.'],
  ['Explain the Requests by Category chart', 2, 9 * AI_DAY + 6 * AI_HR,
   'Explained what each bar counts, how categories are assigned, and why Software leads with 58 open.'],
  ['Export the SLA widgets to PDF', 2, 41 * AI_DAY + 2 * AI_HR,
   'Walked through Export ▸ PDF for the five SLA widgets and what the scheduled version would carry.'],
  ['First pass at the Executive Summary board', 3, 285 * AI_DAY,
   'Sketched the original Executive Summary dashboard — six widgets, Leadership category, restricted to start with.'],
].forEach(([n, asked, ago, sum], i) => {
  AI_CHATS.push({ id: 900 + i, n: n, msgs: [{ r:'me', t:n }], asked: asked, t: Date.now() - ago, sum: sum });
});
let aiHistShown = false;
const AI_FADE = 30;
function aiFadeEl(el){
  if (!el) return 0;
  const past = el.scrollHeight - el.scrollTop - el.clientHeight;
  el.style.setProperty('--aifade-t', (el.scrollTop > 2 ? AI_FADE : 0) + 'px');
  el.style.setProperty('--aifade-b', (past > 2 ? AI_FADE : 0) + 'px');
  return past;
}
function aiTkFadeBind(){
  document.querySelectorAll('#aiBody .aitk.op .aitkl').forEach(el => {
    if (!el._fade){
      el._fade = 1;
      el.addEventListener('scroll', () => aiFadeEl(el), {passive:true});
    }
    aiFadeEl(el);
    requestAnimationFrame(() => aiFadeEl(el));
  });
}
function aiFade(){
  const b = document.getElementById('aiBody'); if (!b) return;
  const past = aiFadeEl(b);
  const j = document.getElementById('aiToBot');
  if (j) j.classList.toggle('on', past > 64);
}
function aiToBottom(){
  const b = document.getElementById('aiBody'); if (!b) return;
  b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' });
}
function aiFadeBind(){
  const b = document.getElementById('aiBody'); if (!b) return;
  if (!b._fade){
    b._fade = 1;
    b.addEventListener('scroll', aiFade, {passive:true});
    window.addEventListener('resize', aiFade);
  }
  aiFade();
  requestAnimationFrame(aiFade);
}
function aiHistPaint(){
  const p = document.getElementById('aiPanel');
  if (p) p.classList.toggle('aihist', !!aiHistShown);
  const n = document.getElementById('aiHdHistN');
  if (n) n.textContent = AI_CHATS.length + ' chat' + (AI_CHATS.length === 1 ? '' : 's');
}
function aiHistOpen(){
  aiFile();
  aiHistShown = true; aiHistPaint();
  const host = document.getElementById('aiBody'); if (!host) return;
  host.innerHTML = aiHistFullHTML('');
  host.scrollTop = 0;
  const q = document.getElementById('aiHistQ'); if (q) q.focus();
}
function aiHistFullHTML(q){
  const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const list = AI_CHATS.filter(c => !rx || rx.test(c.n) || rx.test(aiChatFirstQ(c)))
                       .slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  let rows = '', band = null;
  list.forEach(c => {
    const g = aiChatBand(c.t);
    if (g !== band){ band = g; rows += '<div class="aihfg">' + aiEsc(g) + '</div>'; }
    rows += '<div class="aihfr' + (c.id === aiChatId ? ' cur' : '') + '" onclick="aiHistGo(' + c.id + ')">' +
      '<span class="tt"><b>' + aiEsc(c.n) + '</b><span class="sm">' + aiEsc(aiChatSummary(c)) + '</span></span>' +
      '<span class="rt">' + aiEsc(aiChatWhen(c.t)) + '</span>' +
      '<span class="ac">' +
        '<i data-tip="Rename" onclick="event.stopPropagation();aiChatRenRow(' + c.id + ',this)">' + AI_MI.pen + '</i>' +
        '<i data-tip="Delete" class="del" onclick="event.stopPropagation();aiHistDel(' + c.id + ')">' + AI_MI.bin + '</i>' +
      '</span></div>';
  });
  return '<div class="aihf">' +
    '<div class="aihfs">' + AI_MI.mag +
      '<input id="aiHistQ" placeholder="Search AI chats…" value="' + aiEsc(q) + '" oninput="aiHistFilter()"></div>' +
    (list.length ? rows : '<div class="aihfe">' + (q
      ? 'No chat matches “' + aiEsc(q) + '”.'
      : 'No earlier chats yet. Ask something and it will be saved here.') + '</div>') +
  '</div>';
}
function aiHistFilter(){
  const inp = document.getElementById('aiHistQ'); if (!inp) return;
  const v = inp.value, pos = inp.selectionStart;
  document.getElementById('aiBody').innerHTML = aiHistFullHTML(v);
  const n = document.getElementById('aiHistQ');
  if (n){ n.focus(); n.setSelectionRange(pos, pos); }
}
function aiHistClose(){ aiHistShown = false; aiHistPaint(); aiRender(); }
function aiHistGo(id){
  aiFile();
  const c = AI_CHATS.find(x => x.id === id); if (!c) return;
  aiChatId = c.id; aiThread = c.msgs.slice(); aiNamed = true; aiSetName(c.n);
  aiHistShown = false; aiHistPaint();
  aiRender();
}
function aiHistDel(id){ aiDelAsk(id, 'hist'); }
function aiHistDelDo(id){
  const i = AI_CHATS.findIndex(c => c.id === id); if (i < 0) return;
  const n = AI_CHATS[i].n;
  AI_CHATS.splice(i, 1);
  if (id === aiChatId){ aiThread.length = 0; aiNamed = false; aiSetName('New chat'); }
  aiHistOpen();
  toast('Deleted “' + n + '”');
}
const AI_UP_OK  = /\.(png|jpe?g|gif|webp|svg|log|txt|pdf|csv|json)$/i;
const AI_UP_SAY = 'attach an image, log, PDF, CSV or JSON';
function aiUpPick(){
  aiPlusClose();
  const el = document.getElementById('aiUpIn');
  if (el){ el.value = ''; el.click(); }
}
let aiPlusSel = -1;
const AI_PLUS = [
  { ic:'<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
    l:'Mention dashboards, monitors or modules', fn:'aiPlusCtx()' }
];
function aiPlusMenu(ev){
  if (ev) ev.stopPropagation();
  if (document.getElementById('aiPlusM')){ aiPlusClose(); return; }
  aiMentHide(); aiSuggHide();
  aiPlusSel = -1;
  const el = document.createElement('div');
  el.className = 'aicmd up aiplusm'; el.id = 'aiPlusM'; el.setAttribute('role', 'menu');
  document.querySelector('.aicomp').appendChild(el);
  aiPlusPaint();
  setTimeout(() => document.addEventListener('mousedown', aiPlusAway), 0);
}
function aiPlusPaint(){
  const el = document.getElementById('aiPlusM'); if (!el) return;
  el.innerHTML = AI_PLUS.map((r, i) =>
    '<button role="menuitem" class="' + (i === aiPlusSel ? 'sel' : '') + '" ' +
      'onmousedown="event.preventDefault()" onmouseenter="aiPlusHover(' + i + ')" ' +
      'onclick="' + r.fn + '"><svg viewBox="0 0 24 24">' + r.ic + '</svg>' +
      '<span>' + r.l + '</span></button>').join('');
}
function aiPlusHover(i){ aiPlusSel = i; aiPlusPaint(); }
function aiPlusRun(i){
  const r = AI_PLUS[i]; if (!r) return;
  if (r.fn === 'aiUpPick()') aiUpPick(); else aiPlusCtx();
}
function aiPlusOpen(){ return !!document.getElementById('aiPlusM'); }
function aiPlusClose(){
  const m = document.getElementById('aiPlusM'); if (m) m.remove();
  document.removeEventListener('mousedown', aiPlusAway);
}
function aiPlusAway(e){
  const t = e.target;
  if (t && t.closest && (t.closest('#aiPlusM') || t.closest('#aiPlusBtn'))) return;
  aiPlusClose();
}
function aiPlusCtx(){
  aiPlusClose();
  const t = document.getElementById('aiIn'); if (!t) return;
  t.focus();
  const at = t.selectionStart;
  t.value = t.value.slice(0, at) + '@' + t.value.slice(t.selectionEnd);
  t.selectionStart = t.selectionEnd = at + 1;
  aiMentSeed = at;
  aiGrow(t);
  aiMentShow('');
}
function aiMentUnseed(){
  const at = aiMentSeed; aiMentSeed = -1;
  if (at < 0) return;
  const t = document.getElementById('aiIn'); if (!t) return;
  if (t.value.charAt(at) !== '@') return;
  const span = t.value.slice(at, t.selectionStart);
  if (!/^@[\w.\-]*$/.test(span)) return;
  t.value = t.value.slice(0, at) + t.value.slice(at + span.length);
  t.selectionStart = t.selectionEnd = at;
  aiGrow(t);
}
function aiUpSize(b){
  if (b < 1024) return b + ' B';
  if (b < 1048576) return Math.round(b / 1024) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
function aiUpAdd(inp){
  const fs = Array.prototype.slice.call(inp.files || []);
  inp.value = '';
  if (!fs.length) return;
  const ok = fs.filter(f => AI_UP_OK.test(f.name)), bad = fs.filter(f => !AI_UP_OK.test(f.name));
  const before = aiCtxItems.length;
  ok.forEach(f => aiCtxAdd(f.name, 'file · ' + aiUpSize(f.size)));
  const n = aiCtxItems.length - before;
  if (n){
    let m = n === 1 ? 'Attached ' + ok[0].name + ' · ' + aiUpSize(ok[0].size)
                    : 'Attached ' + n + ' files';
    if (bad.length) m += ' · skipped ' + bad.length + ' unsupported';
    toast(m);
  }
  else if (bad.length) toast('Can’t read ' + bad[0].name + ' — ' + AI_UP_SAY);
  else toast('Already attached');
  const el = document.getElementById('aiIn'); if (el) el.focus();
}
function aiFeed(i, v){
  const m = aiThread[i]; if (!m) return;
  m.fb = (m.fb === v ? 0 : v);
  aiRender();
  if (m.fb === 1) toast('Marked helpful');
  else if (m.fb === -1) toast('Thanks — logged, and used to tune future answers');
}
function aiInvestigate(src){
  if (!IRIS.tiles().some(t => String(t.title).replace(/<[^>]*>/g, '') === src)){ toast('“' + src + '” is not on this dashboard'); return; }
  aiClose();
  IRIS.investigate(src);
}
function aiCmdAway(e){
  if (e.target.closest('#aiCmdMenu')) return;
  const m = document.getElementById('aiCmdMenu'); if (m) m.remove();
  document.removeEventListener('mousedown', aiCmdAway);
}
function aiAddTo(){
  const list = DASH_GROUPS.flatMap(g => g.items.map(it => it[0]))
                          .filter(n => n !== aiScope().dash);
  if (!list.length){ toast('There is no other dashboard to add it to'); return; }
  const m = document.getElementById('aiCmdMenu');
  if (m) m.remove();
  const el = document.createElement('div');
  el.className = 'aicmd up'; el.id = 'aiCmdMenu';
  el.innerHTML = '<div class="hd">Add to which dashboard?</div>' + list.map(n =>
    '<button onclick="aiAddToPick(' + JSON.stringify(n).replace(/"/g, '&quot;') + ')">' +
    '<span class="k">▦</span>' + n + '</button>').join('');
  document.querySelector('.aicomp').appendChild(el);
  setTimeout(() => document.addEventListener('mousedown', aiCmdAway), 0);
}
function aiAddToPick(name){
  const m = document.getElementById('aiCmdMenu'); if (m) m.remove();
  document.removeEventListener('mousedown', aiCmdAway);
  const b = aiBuildState; if (!b || b.added) return;
  const VIS = ['hbars','hbars','line','donut','big','rows'];
  b.added = 1;
  aiClose();
  IRIS.go(name);
  setTimeout(() => {
    if (b.dash){ b.items.forEach((n, i) => IRIS.addWidget(n, VIS[(b.chart + i) % VIS.length] || 'line')); return; }
    IRIS.addWidget(b.name.charAt(0).toUpperCase() + b.name.slice(1) + ' ' + b.group.toLowerCase(),
          VIS[b.chart] || 'line', { group: b.group });
  }, 60);
}
function aiBuildAdd(){
  const b = aiBuildState; if (!b || b.added) return;
  const VIS = ['hbars','hbars','line','donut','big','rows'];
  b.added = 1;
  aiClose();
  if (b.dash) b.items.forEach((n, i) => IRIS.addWidget(n, VIS[(b.chart + i) % VIS.length] || 'line'));
  else IRIS.addWidget(b.name.charAt(0).toUpperCase() + b.name.slice(1) + ' ' + b.group.toLowerCase(),
             VIS[b.chart] || 'line', { group: b.group });
  aiRender();
}
function aiBuildAuto(){ if (aiAuto) aiBuildAdd(); }
function aiToggleAuto(){
  aiAuto = !aiAuto;
  document.getElementById('aiAuto').classList.toggle('on', aiAuto);
  toast(aiAuto ? 'Auto-approve ON — a widget build applies straight away'
               : 'Auto-approve OFF — a pending build waits for Accept');
}
const AI_DICT = [
  'Summarise this dashboard for a handover',
  'Create a time-series widget for SLA metrics',
  'What needs attention right now',
  'Create a dashboard called SLA watch'
];
let aiDicOn = false, aiDicT = [], aiDicN = 0;
function aiDicTog(){ aiDicOn ? aiDicStop(1) : aiDicStart(); }
function aiDicStart(){
  const el = document.getElementById('aiIn'), m = document.getElementById('aiMic');
  if (!el || aiDicOn) return;
  aiDicOn = true;
  if (m){ m.classList.add('on'); m.setAttribute('data-tip', 'Stop dictating'); }
  el.placeholder = 'Listening…';
  const words = AI_DICT[aiDicN++ % AI_DICT.length].split(' ');
  const base = el.value.trim() ? el.value.trim() + ' ' : '';
  words.forEach((w, k) => aiDicT.push(setTimeout(() => {
    el.value = base + words.slice(0, k + 1).join(' ');
    aiGrow(el);
    if (k === words.length - 1) aiDicStop(0);
  }, 250 * (k + 1))));
}
function aiDicStop(manual){
  aiDicT.forEach(clearTimeout); aiDicT.length = 0;
  if (!aiDicOn) return;
  aiDicOn = false;
  const m = document.getElementById('aiMic');
  if (m){ m.classList.remove('on'); m.setAttribute('data-tip', 'Dictate'); }
  const el = document.getElementById('aiIn');
  if (el){ el.placeholder = 'Ask, build and act — type @ to add context'; el.focus(); }
  toast(manual ? 'Dictation stopped — the words are in the box'
               : 'Dictated — check it, then press ↵ to send');
}
function aiKey(e){
  if (aiPlusOpen()){
    if (e.key === 'ArrowDown'){ e.preventDefault();
      aiPlusSel = aiPlusSel < 0 ? 0 : (aiPlusSel + 1) % AI_PLUS.length; aiPlusPaint(); return; }
    if (e.key === 'ArrowUp'){   e.preventDefault();
      aiPlusSel = aiPlusSel < 0 ? AI_PLUS.length - 1 : (aiPlusSel - 1 + AI_PLUS.length) % AI_PLUS.length;
      aiPlusPaint(); return; }
    if (e.key === 'Enter' || e.key === 'Tab'){ e.preventDefault();
      aiPlusRun(aiPlusSel < 0 ? 0 : aiPlusSel); return; }
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); aiPlusClose(); return; }
  }
  if (aiMent.length){
    if (e.key === 'ArrowDown'){ e.preventDefault(); aiMentSel = (aiMentSel + 1) % aiMent.length; aiMentPaint(); return; }
    if (e.key === 'ArrowUp'){   e.preventDefault(); aiMentSel = (aiMentSel - 1 + aiMent.length) % aiMent.length; aiMentPaint(); return; }
    if (e.key === 'Enter' || e.key === 'Tab'){ e.preventDefault(); aiMentPick(aiMentSel); return; }
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); aiMentHide(); return; }
  }
  if (aiSuggL.length){
    if (e.key === 'ArrowDown'){ e.preventDefault(); aiSuggSel = (aiSuggSel + 1) % aiSuggL.length; aiSuggRender(); return; }
    if (e.key === 'ArrowUp'){   e.preventDefault(); aiSuggSel = (aiSuggSel <= 0 ? aiSuggL.length : aiSuggSel) - 1; aiSuggRender(); return; }
    if (e.key === 'Escape'){    e.preventDefault(); e.stopPropagation(); aiSuggHide(); return; }
    if (e.key === 'Tab' && aiSuggSel < 0){ e.preventDefault(); aiSuggPick(0); return; }
    if (e.key === 'Enter' && !e.shiftKey && aiSuggSel > -1){ e.preventDefault(); aiSuggPick(aiSuggSel); return; }
  }
  if (e.key === 'Escape' && aiDicOn){ e.stopPropagation(); e.preventDefault(); aiDicStop(1); return; }
  if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); aiDicStop(1); aiSend(); }
}
aiLogoPaint();
aiSparkPaint();
(function aiSparkIntro(){
  const el = document.querySelector('#sbAI .aisprk'); if (!el) return;
  el.classList.add('aiplay');
  setTimeout(() => el.classList.remove('aiplay'), 1500);
})();

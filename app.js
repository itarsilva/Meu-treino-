'use strict';

/* =========================================================
   Meu Treino — app para acompanhar treinos
   Dados ficam salvos no próprio aparelho (localStorage).
   ========================================================= */

const STORAGE_KEY = 'meu-treino:v1';
const REST_SECONDS = 40; // descanso entre séries, igual para todos os exercícios
const DEFAULT_GOALS = { workouts: 5, minutes: 300, sets: 100 };
const PLAN_VERSION = 2;

/* Plano de hipertrofia de 5 dias, montado a partir da avaliação física
   (dores em costas/quadril, hipercifose, ombros rodados para dentro,
   flexibilidade abaixo da média, coxa esquerda menor).
   Formato de cada linha: "Exercício | séries×repetições". */
/* Exercícios do aquecimento, na ordem, com a dose de cada um. */
const WARMUP_ITEMS = [
  { name: 'Gato-camelo', dose: '10 vezes' },
  { name: 'Rotação torácica', dose: '8 por lado' },
  { name: 'Alongamento de posteriores', dose: '30 s cada perna' },
  { name: 'Alongamento de flexores do quadril', dose: '30 s cada lado' },
  { name: 'Rotação externa com elástico', dose: '15 vezes' },
];
const WARMUP = 'Aquecimento (8 min): gato-camelo e rotação torácica, alongamento de posteriores e flexores do quadril, rotação externa de ombro com elástico.';
const PLAN_ROUTINES = () => [
  { id: uid(), name: 'Dia 1 — Costas e postura', note: WARMUP, exercises: [
    'Puxada frontal aberta | 3×10-12',
    'Remada apoiada no banco inclinado | 3×10-12',
    'Remada baixa com triângulo | 3×10-12',
    'Face pull na polia | 3×15',
    'Crucifixo inverso | 3×15',
    'Rosca direta | 3×10-12',
    'Dead bug | 3×10',
  ] },
  { id: uid(), name: 'Dia 2 — Pernas (quadríceps)', note: WARMUP + ' Sem agachamento com barra nas costas por enquanto, para poupar a coluna.', exercises: [
    'Leg press 45° | 4×10-12',
    'Agachamento búlgaro (começar pela esquerda) | 3×10',
    'Cadeira extensora | 3×12-15',
    'Mesa flexora | 3×12',
    'Panturrilha sentado | 4×15',
    'Prancha lateral (segundos) | 3×30',
  ] },
  { id: uid(), name: 'Dia 3 — Peito e ombros', note: WARMUP + ' Ombros para trás e para baixo em todos os empurrões.', exercises: [
    'Supino inclinado com halteres | 4×8-12',
    'Supino reto na máquina | 3×10-12',
    'Crucifixo na polia | 3×12-15',
    'Desenvolvimento sentado com halteres | 3×10-12',
    'Elevação lateral | 3×12-15',
    'Tríceps na polia | 3×12',
    'Face pull na polia | 2×15',
  ] },
  { id: uid(), name: 'Dia 4 — Pernas (posterior e glúteo)', note: WARMUP + ' No stiff, carga leve e coluna neutra; pare se doer a lombar.', exercises: [
    'Elevação pélvica | 4×10-12',
    'Stiff com halteres | 3×10',
    'Cadeira flexora | 3×12',
    'Leg press unilateral (começar pela esquerda) | 3×12',
    'Cadeira abdutora | 3×15',
    'Panturrilha em pé | 4×12-15',
    'Pallof press | 3×12',
  ] },
  { id: uid(), name: 'Dia 5 — Costas, peito e braços', note: WARMUP, exercises: [
    'Puxada com triângulo | 3×10-12',
    'Remada unilateral com halter | 3×10-12',
    'Supino inclinado na máquina | 3×10',
    'Rotação externa com elástico | 3×15',
    'Rosca martelo | 3×10-12',
    'Rosca Scott | 3×10-12',
    'Tríceps francês | 3×10-12',
    'Bird dog | 3×10',
  ] },
];
const DEFAULT_ROUTINES = PLAN_ROUTINES();
const OLD_DEFAULT_NAMES = ['Treino A — Peito e Tríceps', 'Treino B — Costas e Bíceps', 'Treino C — Pernas e Ombros'];

/** "Supino | 3×10-12" -> { name, target: { sets: 3, reps: '10-12' } } */
function parseLine(line) {
  const [rawName, rawTarget = ''] = String(line).split('|');
  const name = rawName.trim();
  const m = rawTarget.trim().match(/^(\d+)\s*[x×]\s*(.+)$/i);
  return { name, target: m ? { sets: Math.min(10, +m[1]), reps: m[2].trim() } : null };
}

/* ---------- Frases de incentivo ---------- */
const DAILY_PHRASES = [
  'Músculo se constrói com constância, não com pressa.',
  'Cada série conta. Hoje é mais um tijolo.',
  'O treino de hoje é o físico de daqui a seis meses.',
  'Disciplina é fazer mesmo quando a vontade não aparece.',
  'Você não precisa ser extremo, só precisa ser consistente.',
  'Progresso pequeno ainda é progresso.',
  'Mais 1 repetição ou mais 1 kg. É assim que se cresce.',
  'Quem treina com regularidade sempre chega lá.',
  'Comer bem e dormir bem também é treinar.',
  'O corpo muda devagar. Continue aparecendo.',
  'Você está construindo um hábito, não só um corpo.',
  'Treino feito é melhor que treino perfeito.',
  'A barra não fica mais leve. Você fica mais forte.',
  'Foco na técnica. A carga vem depois.',
  'Seu único adversário é o você da semana passada.',
  'Cansado? Vá mesmo assim. Depois agradece.',
  'Ganhar massa é paciência com intensidade.',
  'Grandes resultados nascem de dias comuns bem feitos.',
  'Sem desculpas hoje. Só mais um treino.',
  'Proteína no prato, carga na barra, sono em dia.',
  'Quem anota, evolui. Continue registrando.',
  'Lembre por que você começou.',
  'Forte não se nasce. Forte se constrói.',
  'Um dia de cada vez, uma série de cada vez.',
];

const FINISH_PHRASES = [
  'Treino concluído! Mais um passo rumo ao seu objetivo.',
  'Mandou bem! Agora é comer e descansar para crescer.',
  'Feito! A constância está do seu lado.',
  'Missão cumprida. O músculo agradece.',
  'Excelente! Hoje você venceu a preguiça.',
  'Treino no bolso. Bora bater a meta da semana!',
];

const GOAL_PHRASES = [
  'Meta semanal de treinos batida! Que semana!',
  'Você fechou a meta de treinos da semana. Orgulho!',
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function phraseOfDay() {
  const d = new Date();
  const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return DAILY_PHRASES[day % DAILY_PHRASES.length];
}

/** Maior carga já registrada num exercício (treinos salvos). */
function bestKg(name) {
  const key = name.trim().toLowerCase();
  let best = 0;
  state.workouts.forEach((w) => w.exercises.forEach((e) => {
    if (e.name.trim().toLowerCase() !== key) return;
    e.sets.forEach((s) => { if (s.done && num(s.kg) > best) best = num(s.kg); });
  }));
  return best;
}

const ROUTINE_COLORS = ['var(--pink)', 'var(--green)', 'var(--cyan)', 'var(--yellow)'];

/* ---------- Ícones (traço, estilo SF Symbols) ---------- */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  summary: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>'),
  history: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  trend: svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  dumbbell: svg('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  chevron: svg('<path d="M9 5l7 7-7 7"/>', 'width="16" height="16"'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  scale: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0l-2.5 3"/>'),
  paste: svg('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>'),
  upload: svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
};

const TABS = [
  { id: 'treino', label: 'Resumo', icon: ICON.summary },
  { id: 'historico', label: 'Histórico', icon: ICON.history },
  { id: 'progresso', label: 'Progresso', icon: ICON.trend },
  { id: 'rotinas', label: 'Rotinas', icon: ICON.list },
];

let state = load();
let tab = 'treino';
let progressExercise = null;
let progressMode = 'cargas';

/* ---------- Persistência ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const st = { workouts: d.workouts || [], routines: d.routines ?? DEFAULT_ROUTINES, current: d.current || null, goals: { ...DEFAULT_GOALS, ...d.goals }, plan: d.plan || 1, body: d.body || [], prefs: { haptics: true, sound: true, ...d.prefs } };
      // Quem ainda usa as rotinas de exemplo antigas recebe o plano da avaliação.
      if (st.plan < PLAN_VERSION) {
        const untouched = st.routines.every((r) => OLD_DEFAULT_NAMES.includes(r.name));
        if (untouched) { st.routines = PLAN_ROUTINES(); st.goals = { ...DEFAULT_GOALS }; }
        st.plan = PLAN_VERSION;
      }
      return st;
    }
  } catch (e) { /* sem armazenamento disponível */ }
  return { workouts: [], routines: DEFAULT_ROUTINES, current: null, goals: { ...DEFAULT_GOALS }, plan: PLAN_VERSION, body: [], prefs: { haptics: true, sound: true } };
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
}

/* ---------- Utilidades ---------- */

const $view = document.getElementById('view');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function num(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
function fmtNum(n) {
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
function fmtDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('pt-BR', opts).replace(/\./g, '');
}
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
function minutesBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
}
function clock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const p = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
function volume(w) {
  return w.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).reduce((a, s) => a + num(s.kg) * num(s.reps), 0), 0);
}
function doneSets(w) {
  return w.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);
}
function startOfWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
  return d;
}
function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Última vez que o exercício foi feito (para mostrar como referência). */
function lastPerformance(name) {
  const key = name.trim().toLowerCase();
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const ex = state.workouts[i].exercises.find((e) => e.name.trim().toLowerCase() === key);
    if (ex) {
      const sets = ex.sets.filter((s) => s.done);
      if (sets.length) return sets;
    }
  }
  return null;
}

function allExerciseNames() {
  const names = new Map();
  state.routines.forEach((r) => r.exercises.forEach((l) => { const n = parseLine(l).name; names.set(n.toLowerCase(), n); }));
  state.workouts.forEach((w) => w.exercises.forEach((e) => names.set(e.name.toLowerCase(), e.name)));
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function newExercise(line) {
  const { name, target } = parseLine(line);
  const prev = lastPerformance(name);
  const count = target ? target.sets : (prev ? prev.length : 3);
  const sets = Array.from({ length: count }, (_, i) => {
    const p = prev && (prev[i] || prev[prev.length - 1]);
    return { kg: p ? p.kg : '', reps: p ? p.reps : '', done: false };
  });
  return target ? { name, target, sets } : { name, sets };
}

/** Rotina sugerida para hoje: a seguinte à última feita. */
function nextRoutineId() {
  if (!state.routines.length) return null;
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const idx = state.routines.findIndex((r) => r.id === state.workouts[i].routineId);
    if (idx >= 0) return state.routines[(idx + 1) % state.routines.length].id;
  }
  return state.routines[0].id;
}

function header(title, eyebrow = todayLabel()) {
  return `<p class="eyebrow">${esc(eyebrow)}</p><h1 class="large-title">${esc(title)}</h1>`;
}

function emptyState(icon, color, title, text) {
  return `<div class="empty"><div class="icon-badge" style="--c:${color}">${icon}</div><h3>${title}</h3><p class="muted">${text}</p></div>`;
}

/* ---------- Anéis de atividade ---------- */

function rings(values) {
  // values: [{pct, color}] de fora para dentro
  const size = 132, stroke = 14, gap = 3;
  return `<svg class="rings" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    ${values.map((v, i) => {
      const r = size / 2 - stroke / 2 - i * (stroke + gap);
      const c = 2 * Math.PI * r;
      const pct = Math.min(1, Math.max(0, v.pct));
      return `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${v.color}" stroke-opacity=".22" stroke-width="${stroke}"/>
        ${pct > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${v.color}" stroke-width="${stroke}"
          stroke-dasharray="${(c * pct).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ''}`;
    }).join('')}
  </svg>`;
}

/* ---------- Telas ---------- */

function render() {
  document.getElementById('tabbar').innerHTML = TABS.map((t) =>
    `<button data-tab="${t.id}" class="${t.id === tab ? 'active' : ''}" aria-current="${t.id === tab ? 'page' : 'false'}">${t.icon}${t.label}</button>`
  ).join('');
  const views = { treino: viewTreino, historico: viewHistorico, progresso: viewProgresso, rotinas: viewRotinas };
  $view.innerHTML = views[tab]();
  if (window.ExAnim) $view.querySelectorAll('canvas[data-icon]').forEach((c) => ExAnim.icon(c, c.dataset.icon));
}

function viewTreino() {
  return state.current ? viewLive() : viewResumo();
}

function viewResumo() {
  const since = startOfWeek();
  const week = state.workouts.filter((w) => new Date(w.date) >= since);
  const g = state.goals;
  const done = {
    workouts: week.length,
    minutes: week.reduce((a, w) => a + (w.duration || 0), 0),
    sets: week.reduce((a, w) => a + doneSets(w), 0),
  };

  return `
    ${header('Resumo')}
    <div class="card rings-card">
      ${rings([
        { pct: done.workouts / g.workouts, color: 'var(--pink)' },
        { pct: done.minutes / g.minutes, color: 'var(--ring-green)' },
        { pct: done.sets / g.sets, color: 'var(--ring-cyan)' },
      ])}
      <div class="ring-legend">
        <div><div class="label">Treinos</div><div class="value c-pink">${done.workouts}/${g.workouts}</div></div>
        <div><div class="label">Minutos</div><div class="value c-green">${done.minutes}/${g.minutes}<small> MIN</small></div></div>
        <div><div class="label">Séries</div><div class="value c-cyan">${done.sets}/${g.sets}</div></div>
      </div>
    </div>
    <p class="tiny muted" style="margin:-4px 4px 0">Metas desta semana · ajuste em Rotinas</p>

    <div class="card quote">
      <p class="eyebrow c-yellow">Frase do dia</p>
      <p class="quote-text">${esc(phraseOfDay())}</p>
    </div>

    ${weightRow()}

    <h2 class="section-title">Começar treino</h2>
    <div class="wk-list">
      ${routineIcons().map(({ r, key }) => {
        const m = r.name.match(/^(.+?)\s+[—-]\s+(.+)$/);
        const next = r.id === nextRoutineId();
        return `
        <button class="wk-card" data-action="start" data-id="${r.id}" aria-label="Iniciar ${esc(r.name)}">
          <span class="wk-top">
            ${key ? `<canvas class="wk-icon" data-icon="${key}" aria-hidden="true"></canvas>` : `<span class="wk-icon wk-icon-fallback">${ICON.dumbbell}</span>`}
            <span class="wk-play" aria-hidden="true">${ICON.play}</span>
          </span>
          ${m ? `<span class="wk-eyebrow">${esc(m[1])}</span>` : ''}
          <span class="wk-title">${esc(m ? m[2] : r.name)}</span>
          <span class="wk-sub">${next ? '<span class="wk-next">Próximo</span>' : ''}${plural(r.exercises.length, 'exercício', 'exercícios')}</span>
        </button>`;
      }).join('')}
    </div>
    <div class="list">
      <button class="list-row" data-action="start-empty">
        <span class="icon-badge" style="--c:var(--muted)">${ICON.plus}</span>
        <span class="body"><span class="title">Treino livre</span></span>
        <span class="chev">${ICON.chevron}</span>
      </button>
    </div>
  `;
}

/** "Antes de começar": aquecimento com botão Ver em cada exercício + cuidados da rotina. */
/** Exercício aberto? Sem escolha do usuário, abre o primeiro que ainda não terminou. */
function isOpen(cur, ei) {
  const ex = cur.exercises[ei];
  if (typeof ex.open === 'boolean') return ex.open;
  const first = cur.exercises.findIndex((e) => !e.sets.length || e.sets.some((x) => !x.done));
  return ei === first;
}

function fixOpenStates(cur) {
  cur.exercises.forEach((e, i) => { e.open = isOpen(cur, i); });
}

function progressRing(done, total) {
  const r = 13, c = 2 * Math.PI * r, pct = total ? done / total : 0;
  return `<svg class="mini-ring" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="${r}" class="mini-track"/>
    ${pct > 0 ? `<circle cx="16" cy="16" r="${r}" class="mini-bar" stroke-dasharray="${(c * pct).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 16 16)"/>` : ''}
    ${pct >= 1 ? '<path d="M10.5 16.5l3.5 3.5 7.5-8" class="mini-check"/>' : `<text x="16" y="20.5" text-anchor="middle" class="mini-num">${done}</text>`}
  </svg>`;
}

function noteCard(note) {
  // o aquecimento aparece em todo treino (rotinas, treino livre e rotinas novas); minimizado até tocar
  const hasWarm = true;
  const open = !!(state.current && state.current.warmOpen);
  const extra = note.replace(WARMUP, '').replace(/^Aquecimento[^.]*\./, '').trim();
  return `
    <div class="card note">
      <button class="fold-head" data-action="toggle-warm" aria-expanded="${open}">
        <span class="grow">
          <span class="eyebrow c-cyan" style="display:block">Antes de começar</span>
          <span class="fold-title">Aquecimento · 8 min</span>
          ${open ? '' : `<span class="tiny muted">${WARMUP_ITEMS.length} exercícios · toque para ver</span>`}
        </span>
        <span class="chev fold-chev ${open ? 'open' : ''}">${ICON.chevron}</span>
      </button>
      ${hasWarm && open ? `
        <div class="warm-list">
          ${WARMUP_ITEMS.map((w, i) => `
            <div class="warm-row">
              <span class="warm-n">${i + 1}</span>
              <span class="grow"><span class="warm-name">${esc(w.name)}</span><span class="tiny muted">${esc(w.dose)}</span></span>
              ${hasDemo(w.name) ? `<button class="demo-btn" data-action="demo" data-name="${esc(w.name)}" data-dose="${esc(w.dose)}" aria-label="Ver como fazer ${esc(w.name)}">${ICON.play}Ver</button>` : ''}
            </div>`).join('')}
        </div>` : ''}
      ${extra ? `<p class="small muted">${esc(extra)}</p>` : ''}
    </div>`;
}

/** Bonequinho de cada rotina: o primeiro exercício com animação, sem repetir entre rotinas. */
function routineIcons() {
  const used = new Set();
  return state.routines.map((r) => {
    const keys = r.exercises.map((l) => (window.ExAnim ? ExAnim.animFor(parseLine(l).name) : null)).filter(Boolean);
    const key = keys.find((k) => !used.has(k)) || keys[0] || null;
    if (key) used.add(key);
    return { r, key };
  });
}

function weightRow() {
  const w = bodySorted().filter((e) => e.weight > 0);
  const last = w[w.length - 1];
  const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const days = last ? Math.max(0, Math.round((dayStart(Date.now()) - dayStart(last.date)) / 864e5)) : null;
  const sub = !last ? 'Toque para registrar seu peso'
    : days >= 7 ? `Último há ${plural(days, 'dia', 'dias')} · hora de se pesar`
    : `${fmtNum(last.weight)} kg · ${days === 0 ? 'hoje' : `há ${plural(days, 'dia', 'dias')}`}`;
  return `<div class="list" style="margin-top:12px">
    <button class="list-row" data-action="go-body">
      <span class="icon-badge" style="--c:var(--pink)">${ICON.scale}</span>
      <span class="body"><span class="title" style="display:block">Peso corporal</span><span class="small ${!last || days >= 7 ? 'c-yellow' : 'muted'}">${sub}</span></span>
      <span class="chev">${ICON.chevron}</span>
    </button></div>`;
}

function viewLive() {
  const cur = state.current;
  return `
    <div class="live">
      <input class="plain eyebrow" style="font-size:13px;color:var(--muted)" value="${esc(cur.name)}" aria-label="Nome do treino" data-field="name">
      <div class="elapsed" id="elapsed">${clock(Date.now() - new Date(cur.startedAt))}</div>
      <div class="live-stats">
        <div><div class="value c-cyan">${doneSets(cur)}</div><div class="label">Séries</div></div>
        <div><div class="value c-green">${fmtNum(volume(cur))}<small> KG</small></div><div class="label">Volume</div></div>
        <div><div class="value c-pink">${cur.exercises.length}</div><div class="label">Exercícios</div></div>
      </div>
    </div>
    ${staleCard(cur)}
    ${noteCard(cur.note || '')}

    ${cur.exercises.map((ex, ei) => {
      const prev = lastPerformance(ex.name);
      const done = ex.sets.filter((x) => x.done).length, total = ex.sets.length;
      const complete = total > 0 && done === total;
      if (!isOpen(cur, ei)) {
        return `
      <section class="card exercise mini ${complete ? 'complete' : ''}" data-ex="${ei}">
        <button class="fold-head" data-action="toggle-ex" data-ei="${ei}" aria-expanded="false" aria-label="Abrir ${esc(ex.name)}">
          ${progressRing(done, total)}
          <span class="grow">
            <span class="fold-title">${esc(ex.name)}</span>
            <span class="tiny muted">${complete ? 'Concluído' : `${done} de ${total} séries`}${ex.target ? ` · meta ${ex.target.sets}×${esc(ex.target.reps)}` : ''}</span>
          </span>
          <span class="chev fold-chev">${ICON.chevron}</span>
        </button>
      </section>`;
      }
      return `
      <section class="card exercise" data-ex="${ei}">
        <div class="exercise-head">
          <button class="fold-head inline" data-action="toggle-ex" data-ei="${ei}" aria-expanded="true" aria-label="Minimizar ${esc(ex.name)}">
            <h3>${esc(ex.name)}</h3><span class="chev fold-chev open">${ICON.chevron}</span>
          </button>
          ${hasDemo(ex.name) ? `<button class="demo-btn" data-action="demo" data-name="${esc(ex.name)}" aria-label="Ver como fazer ${esc(ex.name)}">${ICON.play}Ver</button>` : ''}
          <button class="icon-btn" data-action="remove-ex" data-ei="${ei}" aria-label="Remover exercício">${ICON.trash}</button>
        </div>
        ${ex.target ? `<p class="target">Meta · ${ex.target.sets} × ${esc(ex.target.reps)}</p>` : ''}
        ${prev ? `<p class="last-time">Última vez · ${prev.map((s) => `${fmtNum(num(s.kg))} × ${num(s.reps)}`).join('  ')}</p>` : ''}
        <div class="set-head"><span>#</span><span>kg</span><span>reps</span><span></span></div>
        ${ex.sets.map((s, si) => `
          <div class="set-row ${s.done ? 'done' : ''}">
            <span class="n">${si + 1}</span>
            <input inputmode="decimal" value="${esc(s.kg)}" placeholder="–" aria-label="Carga série ${si + 1}" data-ei="${ei}" data-si="${si}" data-k="kg">
            <input inputmode="numeric" value="${esc(s.reps)}" placeholder="${esc(ex.target ? ex.target.reps : '–')}" aria-label="Repetições série ${si + 1}" data-ei="${ei}" data-si="${si}" data-k="reps">
            <button class="check ${s.done ? 'on' : ''}" data-action="toggle-set" data-ei="${ei}" data-si="${si}" aria-label="Concluir série ${si + 1}" aria-pressed="${s.done}">${ICON.check}</button>
          </div>`).join('')}
        <div class="set-actions">
          <button class="pill-btn" data-action="add-set" data-ei="${ei}">+ Adicionar série</button>
          <span class="grow"></span>
          <button class="pill-btn minus" data-action="remove-set" data-ei="${ei}" ${ex.sets.length <= 1 ? 'disabled' : ''}>Remover</button>
        </div>
      </section>`;
    }).join('')}

    <div class="card add-ex">
      <input id="new-ex" class="grow" list="ex-list" placeholder="Adicionar exercício" autocomplete="off">
      <button class="pill-btn go" data-action="add-ex" aria-label="Adicionar exercício">Adicionar</button>
      <datalist id="ex-list">${allExerciseNames().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    </div>

    <div class="spacer"></div>
    <button class="btn primary" data-action="finish">Finalizar treino</button>
    <button class="btn text" data-action="cancel">Descartar</button>
    ${switchCard(cur)}
  `;
}

function staleCard(cur) {
  const h = (Date.now() - new Date(cur.startedAt)) / 36e5;
  if (h < 4) return '';
  const when = h >= 20 ? 'desde ontem' : `há ${Math.floor(h)} horas`;
  return `
    <div class="card stale">
      <p class="small"><strong>Este treino está aberto ${when}.</strong> Esqueceu de finalizar? Para ver os outros dias, finalize ou descarte este.</p>
      <div class="row">
        <button class="pill-btn go grow" data-action="finish">Finalizar e salvar</button>
        <button class="pill-btn grow" data-action="cancel">Descartar</button>
      </div>
    </div>`;
}

/** Lista dos outros dias durante um treino, para trocar sem precisar descartar antes. */
function switchCard(cur) {
  const others = state.routines.filter((r) => r.id !== cur.routineId);
  if (!others.length) return '';
  const open = !!cur.switchOpen;
  return `
    <div class="card switch">
      <button class="fold-head" data-action="toggle-switch" aria-expanded="${open}">
        <span class="grow"><span class="fold-title">Trocar de treino</span><span class="tiny muted">${plural(others.length, 'outro treino', 'outros treinos')}</span></span>
        <span class="chev fold-chev ${open ? 'open' : ''}">${ICON.chevron}</span>
      </button>
      ${open ? `<div class="warm-list">${others.map((r) => `
        <button class="warm-row switch-row" data-action="switch" data-id="${r.id}">
          <span class="icon-badge" style="--c:var(--ring-green);width:30px;height:30px">${ICON.dumbbell}</span>
          <span class="grow"><span class="warm-name">${esc(r.name)}</span><span class="tiny muted">${plural(r.exercises.length, 'exercício', 'exercícios')}</span></span>
          <span class="chev">${ICON.chevron}</span>
        </button>`).join('')}</div>` : ''}
    </div>`;
}

function viewHistorico() {
  if (!state.workouts.length) {
    return header('Histórico') + emptyState(ICON.history, 'var(--pink)', 'Nenhum treino ainda', 'Finalize um treino e ele aparece aqui.');
  }
  const groups = new Map();
  [...state.workouts].reverse().forEach((w) => {
    const key = new Date(w.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  });

  return `
    ${header('Histórico', plural(state.workouts.length, 'treino', 'treinos'))}
    ${[...groups].map(([month, list]) => `
      <p class="section-label">${esc(month)}</p>
      <div class="list">
        ${list.map((w) => `
          <details class="list-item">
            <summary class="list-row">
              <span class="icon-badge">${ICON.dumbbell}</span>
              <span class="body">
                <span class="title" style="display:block">${esc(w.name)}</span>
                <span class="small muted">${w.duration} min · ${plural(doneSets(w), 'série', 'séries')}</span>
              </span>
              <span class="trailing">
                <span class="value c-green" style="display:block">${fmtNum(volume(w))} kg</span>
                <span class="tiny muted">${fmtDate(w.date)}</span>
              </span>
            </summary>
            <div class="history-detail">
              ${w.exercises.filter((ex) => ex.sets.some((s) => s.done)).map((ex) => `
                <div>
                  <div class="ex-name">${esc(ex.name)}</div>
                  <div class="ex-sets">${ex.sets.filter((s) => s.done).map((s) => `${fmtNum(num(s.kg))} kg × ${num(s.reps)}`).join(' · ')}</div>
                </div>`).join('')}
              <button class="link-danger" data-action="delete-workout" data-id="${w.id}">Excluir treino</button>
            </div>
          </details>`).join('')}
      </div>`).join('')}
  `;
}

function segmented() {
  const opt = (id, label) => `<button class="seg ${progressMode === id ? 'on' : ''}" data-action="mode" data-mode="${id}" aria-pressed="${progressMode === id}">${label}</button>`;
  return `<div class="segmented" role="group" aria-label="Tipo de progresso">${opt('cargas', 'Cargas')}${opt('corpo', 'Corpo')}</div>`;
}

function viewProgresso() {
  return progressMode === 'corpo' ? viewCorpo() : viewCargas();
}

function viewCargas() {
  const names = [...new Set(state.workouts.flatMap((w) => w.exercises.filter((e) => e.sets.some((s) => s.done && num(s.kg) > 0)).map((e) => e.name)))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (!names.length) {
    return header('Progresso') + segmented() + emptyState(ICON.trend, 'var(--ring-green)', 'Sem dados ainda', 'Registre alguns treinos para ver sua evolução.');
  }
  if (!progressExercise || !names.includes(progressExercise)) {
    // Começa pelo primeiro exercício do treino mais recente.
    const recent = [...state.workouts].reverse().flatMap((w) => w.exercises.map((e) => e.name)).find((n) => names.includes(n));
    progressExercise = recent || names[0];
  }

  const points = [];
  state.workouts.forEach((w) => {
    const ex = w.exercises.find((e) => e.name === progressExercise);
    if (!ex) return;
    const sets = ex.sets.filter((s) => s.done && num(s.kg) > 0);
    if (!sets.length) return;
    points.push({
      date: w.date,
      best: Math.max(...sets.map((s) => num(s.kg))),
      orm: Math.max(...sets.map((s) => num(s.kg) * (1 + num(s.reps) / 30))), // 1RM estimado (Epley)
      vol: sets.reduce((a, s) => a + num(s.kg) * num(s.reps), 0),
    });
  });

  const pr = Math.max(...points.map((p) => p.best));
  const orm = Math.max(...points.map((p) => p.orm));
  const diff = pr - points[0].best;
  const lastVol = points[points.length - 1].vol;

  return `
    ${header('Progresso', 'Evolução de carga')}
    ${segmented()}
    <div class="chips" role="tablist">
      ${names.map((n) => `<button class="chip ${n === progressExercise ? 'on' : ''}" data-action="pick" data-name="${esc(n)}" role="tab" aria-selected="${n === progressExercise}">${esc(n)}</button>`).join('')}
    </div>
    <div class="metrics">
      <div class="metric"><div class="label">Recorde</div><div class="value c-pink">${fmtNum(pr)}<small> KG</small></div></div>
      <div class="metric"><div class="label">1RM estimado</div><div class="value c-yellow">${fmtNum(Math.round(orm))}<small> KG</small></div></div>
      <div class="metric"><div class="label">Desde o início</div><div class="value c-green">${diff >= 0 ? '+' : ''}${fmtNum(diff)}<small> KG</small></div></div>
      <div class="metric"><div class="label">Volume recente</div><div class="value c-cyan">${fmtNum(lastVol)}<small> KG</small></div></div>
    </div>
    <div class="card">
      <div class="row between">
        <div class="label" style="font-weight:600">Maior carga</div>
        <div class="tiny muted">${plural(points.length, 'treino', 'treinos')}</div>
      </div>
      ${points.length >= 2 ? chart(points, { key: 'best', label: `Evolução da maior carga em ${progressExercise}` }) : '<p class="small muted" style="margin-top:8px">Faça esse exercício em pelo menos 2 treinos para ver o gráfico.</p>'}
    </div>
  `;
}

function chart(points, { key, label, unit = 'kg', timeScale = false, band = null }) {
  const W = 600, H = 300, P = { l: 8, r: 72, t: 20, b: 44 };
  const vals = points.map((p) => p[key]);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (band) { min = Math.min(min, ...band.map((b) => b[1]), ...band.map((b) => b[2])); max = Math.max(max, ...band.map((b) => b[1]), ...band.map((b) => b[2])); }
  if (max - min < 2) { const mid = (min + max) / 2; min = mid - 1; max = mid + 1; }
  const pad = (max - min) * 0.15;
  min = Math.max(0, min - pad); max += pad;
  const t0 = new Date(points[0].date).getTime(), t1 = new Date(points[points.length - 1].date).getTime();
  const xt = (t) => P.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - P.l - P.r);
  const x = (i) => timeScale ? xt(new Date(points[i].date).getTime()) : P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const fine = max - min < 10;
  const tickFmt = (v) => fmtNum(fine ? Math.round(v * 10) / 10 : Math.round(v));
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  // band: [[time, low, high], ...] — faixa de ritmo ideal
  const bandPath = band ? `M${band.map((b) => `${xt(b[0]).toFixed(1)},${y(b[2]).toFixed(1)}`).join(' L')} L${[...band].reverse().map((b) => `${xt(b[0]).toFixed(1)},${y(b[1]).toFixed(1)}`).join(' L')} Z` : '';
  const labelIdx = [...new Set([0, points.length - 1])];
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
      <defs><linearGradient id="area-${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="stop-a"/><stop offset="1" class="stop-b"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/>
        <text x="${W - P.r + 10}" y="${y(t) + 7}">${tickFmt(t)}</text>`).join('')}
      ${band ? `<path class="band" d="${bandPath}"/>` : `<path class="area" fill="url(#area-${key})" d="${area}"/>`}
      <path class="line" d="${line}"/>
      ${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p[key])}" r="6"><title>${fmtDate(p.date)}: ${fmtNum(p[key])} ${unit}</title></circle>`).join('')}
      ${labelIdx.map((i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="${i === 0 ? 'start' : 'end'}">${fmtDate(points[i].date, { day: 'numeric', month: 'short' })}</text>`).join('')}
    </svg>`;
}

/* ---------- Corpo: peso e medidas ---------- */

const MEASURES = [
  { k: 'arm', label: 'Braço contraído' },
  { k: 'chest', label: 'Tórax' },
  { k: 'waist', label: 'Cintura' },
  { k: 'thighR', label: 'Coxa direita' },
  { k: 'thighL', label: 'Coxa esquerda' },
  { k: 'calf', label: 'Panturrilha' },
];

function bodySorted() {
  return [...state.body].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Ritmo de ganho (kg/semana) entre o registro mais antigo das últimas ~4 semanas e o atual. */
function weightRate(list) {
  const w = list.filter((e) => e.weight > 0);
  if (w.length < 2) return null;
  const last = w[w.length - 1];
  const lastT = new Date(last.date).getTime();
  const base = w.find((e) => lastT - new Date(e.date).getTime() <= 35 * 864e5) || w[0];
  const days = (lastT - new Date(base.date).getTime()) / 864e5;
  if (base === last || days < 6) return null;
  return { perWeek: (last.weight - base.weight) / (days / 7), days };
}

function rateStatus(r) {
  if (!r) return null;
  const v = r.perWeek;
  if (v < 0.15) return { cls: 'warn', title: 'Abaixo do ritmo', tip: 'Coma cerca de 200 kcal a mais por dia e confira a proteína.' };
  if (v > 0.6) return { cls: 'fast', title: 'Acima do ritmo', tip: 'Ganho rápido tende a vir com mais gordura. Reduza uns 150–200 kcal.' };
  return { cls: 'good', title: 'No ritmo', tip: 'Ganho entre 0,25 e 0,5 kg por semana. Continue assim.' };
}

function viewCorpo() {
  const list = bodySorted();
  const weights = list.filter((e) => e.weight > 0);
  const last = weights[weights.length - 1];
  const first = weights[0];
  const r = weightRate(list);
  const st = rateStatus(r);

  // faixa ideal (+0,25 a +0,5 kg/semana) a partir do primeiro registro
  let band = null;
  if (weights.length >= 2) {
    const t0 = new Date(first.date).getTime(), t1 = new Date(last.date).getTime();
    const wk = (t1 - t0) / (7 * 864e5);
    band = [[t0, first.weight, first.weight], [t1, first.weight + 0.25 * wk, first.weight + 0.5 * wk]];
  }

  const latestOf = (k) => { for (let i = list.length - 1; i >= 0; i--) if (list[i][k] > 0) return list[i]; return null; };
  const firstOf = (k) => list.find((e) => e[k] > 0) || null;
  const hasMeasures = MEASURES.some((m) => latestOf(m.k));
  const tR = latestOf('thighR'), tL = latestOf('thighL');

  return `
    ${header('Progresso', 'Peso e medidas')}
    ${segmented()}

    ${last ? `
    <div class="metrics">
      <div class="metric"><div class="label">Peso atual</div><div class="value c-pink">${fmtNum(last.weight)}<small> KG</small></div><div class="tiny muted">${fmtDate(last.date)}</div></div>
      <div class="metric"><div class="label">Desde o início</div><div class="value c-green">${last.weight - first.weight >= 0 ? '+' : ''}${fmtNum(Math.round((last.weight - first.weight) * 10) / 10)}<small> KG</small></div><div class="tiny muted">desde ${fmtDate(first.date, { day: 'numeric', month: 'short' })}</div></div>
    </div>
    ${st ? `
    <div class="card status ${st.cls}">
      <div class="row between"><span class="status-pill">${st.title}</span><span class="value-sm">${r.perWeek >= 0 ? '+' : ''}${fmtNum(Math.round(r.perWeek * 100) / 100)} kg/semana</span></div>
      <p class="small muted">${st.tip}</p>
    </div>` : '<p class="tiny muted" style="margin:-2px 4px 12px">Registre o peso por pelo menos 1 semana para ver se o ganho está no ritmo.</p>'}
    <div class="card">
      <div class="row between">
        <div style="font-weight:600">Peso corporal</div>
        <div class="tiny muted">${plural(weights.length, 'registro', 'registros')}</div>
      </div>
      ${weights.length >= 2
        ? chart(weights, { key: 'weight', label: 'Evolução do peso corporal', timeScale: true, band }) + '<p class="tiny muted legend"><span class="swatch"></span>Faixa ideal: +0,25 a +0,5 kg por semana</p>'
        : '<p class="small muted" style="margin-top:8px">Com 2 registros o gráfico aparece aqui.</p>'}
    </div>` : emptyState(ICON.scale, 'var(--pink)', 'Registre seu peso', 'Pese-se 1 vez por semana, de manhã e em jejum, e anote aqui. Dá para incluir as medidas da sua avaliação com a data dela.')}

    <p class="section-label">Novo registro</p>
    <div class="card body-form">
      <div class="form-grid">
        <label for="b-date">Data<input id="b-date" type="date" value="${todayInput()}" max="${todayInput()}"></label>
        <label for="b-weight">Peso (kg)<input id="b-weight" inputmode="decimal" placeholder="${last ? fmtNum(last.weight) : '66,0'}"></label>
      </div>
      <details class="measures-toggle">
        <summary><span>Medidas em cm (opcional)</span><span class="chev">${ICON.chevron}</span></summary>
        <div class="form-grid">
          ${MEASURES.map((m) => `<label for="b-${m.k}">${m.label}<input id="b-${m.k}" inputmode="decimal" placeholder="${latestOf(m.k) ? fmtNum(latestOf(m.k)[m.k]) : '–'}"></label>`).join('')}
        </div>
      </details>
      <button class="btn primary" data-action="save-body">Salvar registro</button>
    </div>

    ${hasMeasures ? `
    <p class="section-label">Medidas</p>
    <div class="list">
      ${MEASURES.map((m) => {
        const l = latestOf(m.k); if (!l) return '';
        const f = firstOf(m.k); const d = Math.round((l[m.k] - f[m.k]) * 10) / 10;
        // na cintura, diminuir é bom; nas demais, aumentar é bom
        const good = m.k === 'waist' ? d <= 0 : d >= 0;
        return `<div class="measure-row"><span class="grow">${m.label}</span>
          <span class="mv">${fmtNum(l[m.k])} cm</span>
          <span class="md ${d === 0 ? 'muted' : good ? 'c-green' : 'c-pink'}">${f === l ? '' : `${d > 0 ? '+' : ''}${fmtNum(d)}`}</span></div>`;
      }).join('')}
    </div>
    ${tR && tL ? `<p class="tiny muted" style="margin:0 4px 12px">Diferença entre as coxas: ${fmtNum(Math.abs(Math.round((tR.thighR - tL.thighL) * 10) / 10))} cm. Os exercícios de uma perna por vez ajudam a equilibrar.</p>` : ''}` : ''}

    ${list.length ? `
    <p class="section-label">Registros</p>
    <div class="list">
      ${[...list].reverse().map((e) => `
        <div class="measure-row">
          <span class="grow">${fmtDate(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span class="mv">${e.weight > 0 ? `${fmtNum(e.weight)} kg` : 'medidas'}</span>
          <button class="icon-btn" data-action="delete-body" data-id="${e.id}" aria-label="Excluir registro">${ICON.trash}</button>
        </div>`).join('')}
    </div>` : ''}
  `;
}

function exerciseLibrary() {
  const seen = new Set();
  const warm = { name: 'Aquecimento (antes de todo treino)', items: WARMUP_ITEMS.filter((w) => hasDemo(w.name)).map((w) => ({ name: w.name, dose: w.dose })) };
  warm.items.forEach((w) => seen.add(w.name));
  const groups = [warm, ...state.routines.map((r) => ({
    name: r.name,
    items: r.exercises.map(parseLine).filter((e) => hasDemo(e.name) && !seen.has(e.name) && seen.add(e.name)),
  }))].filter((g) => g.items.length);
  if (!groups.length) return '';
  return `
    <p class="section-label">Como fazer cada exercício</p>
    ${groups.map((g) => `
      <details class="lib-group">
      <summary class="list fold-head lib-head">
        <span class="grow"><span class="fold-title">${esc(g.name)}</span><span class="tiny muted">${plural(g.items.length, 'exercício', 'exercícios')}</span></span>
        <span class="chev fold-chev">${ICON.chevron}</span>
      </summary>
      <div class="list">
        ${g.items.map((e) => `
          <button class="list-row" data-action="demo" data-name="${esc(e.name)}" ${e.dose ? `data-dose="${esc(e.dose)}"` : ''} style="min-height:52px">
            <span class="icon-badge" style="--c:var(--ring-green);width:30px;height:30px">${ICON.play}</span>
            <span class="body"><span class="title" style="display:block">${esc(e.name)}</span></span>
            ${e.target ? `<span class="tiny muted">${e.target.sets}×${esc(e.target.reps)}</span>` : e.dose ? `<span class="tiny muted">${esc(e.dose)}</span>` : ''}
            <span class="chev">${ICON.chevron}</span>
          </button>`).join('')}
      </div>
      </details>`).join('')}`;
}

function viewRotinas() {
  const g = state.goals;
  return `
    ${header('Rotinas', 'Seus treinos fixos')}
    ${state.routines.map((r, i) => `
      <details class="card routine-edit fold">
        <summary class="fold-head">
          <span class="icon-badge" style="--c:${ROUTINE_COLORS[i % ROUTINE_COLORS.length]}">${ICON.dumbbell}</span>
          <span class="grow"><span class="fold-title">${esc(r.name)}</span><span class="tiny muted">${plural(r.exercises.length, 'exercício', 'exercícios')} · toque para editar</span></span>
          <span class="chev fold-chev">${ICON.chevron}</span>
        </summary>
        <div class="row">
          <input class="plain grow" value="${esc(r.name)}" data-routine="${r.id}" data-k="name" aria-label="Nome da rotina">
          <button class="icon-btn" data-action="delete-routine" data-id="${r.id}" aria-label="Excluir rotina">${ICON.trash}</button>
        </div>
        <textarea rows="${Math.max(3, r.exercises.length)}" data-routine="${r.id}" data-k="exercises" placeholder="Supino reto | 3×10-12" aria-label="Exercícios">${esc(r.exercises.join('\n'))}</textarea>
        <textarea rows="2" data-routine="${r.id}" data-k="note" placeholder="Observação (opcional)" aria-label="Observação da rotina">${esc(r.note || '')}</textarea>
      </details>`).join('')}
    <p class="tiny muted" style="margin:-2px 4px 12px">Um exercício por linha. Para definir a meta, use: Exercício | séries×repetições</p>
    <button class="btn tinted" data-action="add-routine">${ICON.plus} Nova rotina</button>
    <div class="spacer"></div>
    <button class="btn tinted" data-action="load-plan">Restaurar plano da avaliação</button>

    ${exerciseLibrary()}

    <p class="section-label">Avisos</p>
    <div class="list">
      <div class="goal-row"><label for="p-hap">Vibrar ao concluir série, exercício e treino</label><input id="p-hap" type="checkbox" class="toggle" data-pref="haptics" ${state.prefs?.haptics !== false ? 'checked' : ''}></div>
      <div class="goal-row"><label for="p-snd">Bipe no fim do descanso</label><input id="p-snd" type="checkbox" class="toggle" data-pref="sound" ${state.prefs?.sound !== false ? 'checked' : ''}></div>
    </div>
    <p class="tiny muted" style="margin:0 4px 12px">No iPhone (iOS 18 ou mais novo) a vibração é um toque curto. O bipe não toca com o celular no silencioso.</p>

    <p class="section-label">Metas semanais</p>
    <div class="list">
      <div class="goal-row"><label for="g-w" class="c-pink">Treinos</label><input id="g-w" inputmode="numeric" value="${g.workouts}" data-goal="workouts"></div>
      <div class="goal-row"><label for="g-m" class="c-green">Minutos</label><input id="g-m" inputmode="numeric" value="${g.minutes}" data-goal="minutes"></div>
      <div class="goal-row"><label for="g-s" class="c-cyan">Séries</label><input id="g-s" inputmode="numeric" value="${g.sets}" data-goal="sets"></div>
    </div>

    <p class="section-label">Dados</p>
    <div class="list">
      <button class="list-row" data-action="export">
        <span class="icon-badge" style="--c:var(--cyan)">${ICON.download}</span>
        <span class="body"><span class="title">Exportar backup</span></span>
        <span class="chev">${ICON.chevron}</span>
      </button>
      <label class="list-row">
        <span class="icon-badge" style="--c:var(--cyan)">${ICON.upload}</span>
        <span class="body"><span class="title">Importar arquivo de backup</span></span>
        <span class="chev">${ICON.chevron}</span>
        <input type="file" accept="application/json,.json" data-action="import" hidden>
      </label>
      <button class="list-row" data-action="paste-import">
        <span class="icon-badge" style="--c:var(--cyan)">${ICON.paste}</span>
        <span class="body"><span class="title">Colar backup</span></span>
        <span class="chev">${ICON.chevron}</span>
      </button>
    </div>
    <p class="tiny muted" style="margin:0 4px">Seus dados ficam só neste aparelho. Exportar baixa um arquivo e copia o backup; guarde numa nota para não perder nada.</p>
  `;
}

/* ---------- Ações ---------- */

function scrollToEx(ei) {
  const el = document.querySelector(`[data-ex="${ei}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function startWorkout(routine) {
  Feedback.keepAwake(true);
  state.current = {
    name: routine ? routine.name : 'Treino livre',
    routineId: routine ? routine.id : null,
    note: routine && routine.note ? routine.note : '',
    startedAt: new Date().toISOString(),
    exercises: routine ? routine.exercises.map(newExercise) : [],
  };
  save(); render();
  window.scrollTo(0, 0);
}

function finishWorkout() {
  const cur = state.current;
  const exercises = cur.exercises.filter((e) => e.sets.some((s) => s.done));
  if (!exercises.length) {
    toast('Conclua pelo menos uma série antes de finalizar.');
    return;
  }
  const now = new Date().toISOString();
  let duration = minutesBetween(cur.startedAt, now);
  // treino esquecido aberto: estima pelo número de séries (~2,5 min cada)
  if (duration > 240) duration = Math.max(20, Math.round(exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0) * 2.5));
  state.workouts.push({ id: uid(), name: cur.name, routineId: cur.routineId || null, date: now, duration, exercises });
  state.current = null;
  stopTimer();
  save();
  tab = 'historico';
  render();
  window.scrollTo(0, 0);
  const since = startOfWeek();
  const weekCount = state.workouts.filter((w) => new Date(w.date) >= since).length;
  Feedback.vibrate([120, 70, 120, 70, 260]);
  Feedback.keepAwake(false);
  toast(weekCount === state.goals.workouts ? pick(GOAL_PHRASES) : pick(FINISH_PHRASES), 4000);
}

const actions = {
  start: (el) => startWorkout(state.routines.find((r) => r.id === el.dataset.id)),
  'start-empty': () => startWorkout(null),
  'add-ex': () => {
    const input = document.getElementById('new-ex');
    const name = input.value.trim();
    if (!name) return input.focus();
    fixOpenStates(state.current);
    state.current.exercises.forEach((e) => { e.open = false; });
    state.current.exercises.push({ ...newExercise(name), open: true });
    save(); render();
  },
  'remove-ex': async (el) => {
    if (!await ask('Remover este exercício do treino?', 'Remover')) return;
    state.current.exercises.splice(+el.dataset.ei, 1);
    save(); render();
  },
  'add-set': (el) => {
    const sets = state.current.exercises[+el.dataset.ei].sets;
    const last = sets[sets.length - 1] || { kg: '', reps: '' };
    sets.push({ kg: last.kg, reps: last.reps, done: false });
    save(); render();
  },
  'remove-set': (el) => {
    const sets = state.current.exercises[+el.dataset.ei].sets;
    if (sets.length > 1) sets.pop();
    save(); render();
  },
  'toggle-ex': (el) => {
    const cur = state.current; fixOpenStates(cur);
    const ex = cur.exercises[+el.dataset.ei];
    ex.open = !ex.open;
    save(); render();
    if (ex.open) scrollToEx(+el.dataset.ei);
  },
  'toggle-switch': () => { state.current.switchOpen = !state.current.switchOpen; save(); render(); },
  switch: (el) => {
    const r = state.routines.find((x) => x.id === el.dataset.id);
    if (!r) return;
    const hasDone = doneSets(state.current) > 0;
    openSheet(`
      <p class="sheet-msg">Começar ${esc(r.name)}? O treino atual (${esc(state.current.name)}) vai ser ${hasDone ? 'salvo ou descartado' : 'descartado, pois nenhuma série foi feita'}.</p>
      ${hasDone ? '<button class="sheet-btn" data-sheet="save">Salvar o atual e começar</button>' : ''}
      <button class="sheet-btn destructive" data-sheet="discard">Descartar o atual e começar</button>`, (v) => {
      if (v !== 'save' && v !== 'discard') return;
      if (v === 'save') {
        const cur = state.current;
        const exercises = cur.exercises.filter((e) => e.sets.some((x) => x.done));
        const now = new Date().toISOString();
        let duration = minutesBetween(cur.startedAt, now);
        if (duration > 240) duration = Math.max(20, Math.round(doneSets(cur) * 2.5));
        state.workouts.push({ id: uid(), name: cur.name, routineId: cur.routineId || null, date: now, duration, exercises });
      }
      state.current = null; stopTimer();
      startWorkout(r);
      toast(v === 'save' ? 'Treino anterior salvo. Bom treino!' : `Começando ${r.name}`);
    });
  },
  'toggle-warm': () => { state.current.warmOpen = !state.current.warmOpen; save(); render(); },
  'toggle-set': (el) => {
    const cur = state.current; fixOpenStates(cur);
    const ei = +el.dataset.ei;
    const set = cur.exercises[ei].sets[+el.dataset.si];
    set.done = !set.done;
    // exercício terminou: minimiza e abre o próximo que falta
    let nextOpen = -1;
    if (set.done && cur.exercises[ei].sets.every((x) => x.done)) {
      cur.exercises[ei].open = false;
      const order = [...cur.exercises.keys()].slice(ei + 1).concat([...cur.exercises.keys()].slice(0, ei));
      nextOpen = order.find((i) => cur.exercises[i].sets.some((x) => !x.done)) ?? -1;
      if (nextOpen >= 0) cur.exercises[nextOpen].open = true;
    }
    save(); render();
    if (nextOpen >= 0) setTimeout(() => scrollToEx(nextOpen), 350);
    if (set.done) {
      startTimer();
      const ex = state.current.exercises[+el.dataset.ei];
      const exDone = ex.sets.every((x) => x.done);
      Feedback.vibrate(exDone ? [80, 60, 80] : 20);
      const prev = bestKg(ex.name);
      const kg = num(set.kg);
      const firstToday = ex.sets.filter((x) => x.done && num(x.kg) >= kg).length === 1;
      if (prev > 0 && kg > prev && num(set.reps) > 0 && firstToday) {
        toast(`Novo recorde no ${ex.name}: ${fmtNum(kg)} kg! Você está mais forte.`, 4000);
      } else if (exDone) {
        toast(`${ex.name} concluído! ✓`, 2600);
      }
    }
  },
  finish: finishWorkout,
  cancel: async () => {
    if (!await ask('Descartar este treino? O que foi registrado será perdido.', 'Descartar treino')) return;
    state.current = null; stopTimer(); save(); render();
  },
  'delete-workout': async (el) => {
    if (!await ask('Excluir este treino do histórico?', 'Excluir treino')) return;
    state.workouts = state.workouts.filter((w) => w.id !== el.dataset.id);
    save(); render();
  },
  demo: (el) => showDemo(el.dataset.name, el.dataset.dose),
  pick: (el) => { progressExercise = el.dataset.name; render(); },
  mode: (el) => { progressMode = el.dataset.mode; render(); },
  'go-body': () => { tab = 'progresso'; progressMode = 'corpo'; render(); window.scrollTo(0, 0); },
  'save-body': () => {
    const val = (id) => { const el = document.getElementById(id); return el ? num(el.value) : 0; };
    const dateStr = document.getElementById('b-date').value || todayInput();
    const entry = { id: uid(), date: `${dateStr}T12:00:00`, weight: val('b-weight') };
    MEASURES.forEach((m) => { const v = val(`b-${m.k}`); if (v > 0) entry[m.k] = v; });
    if (!(entry.weight > 0) && !MEASURES.some((m) => entry[m.k])) {
      toast('Preencha o peso ou pelo menos uma medida.');
      return;
    }
    if (entry.weight > 0 && (entry.weight < 30 || entry.weight > 250)) {
      toast('Confira o peso: use quilos, por exemplo 66,2.');
      return;
    }
    // um registro por dia: junta com o que já existe na mesma data
    const same = state.body.find((e) => e.date.slice(0, 10) === dateStr);
    if (same) Object.keys(entry).forEach((k) => { if (k !== 'id' && k !== 'date' && entry[k] > 0) same[k] = entry[k]; });
    else state.body.push(entry);
    save(); render();
    const r = weightRate(bodySorted());
    const st = rateStatus(r);
    toast(st && st.cls === 'good' ? 'Registro salvo. Você está no ritmo certo!' : 'Registro salvo. Quem anota, evolui.');
  },
  'delete-body': async (el) => {
    if (!await ask('Excluir este registro de peso e medidas?', 'Excluir registro')) return;
    state.body = state.body.filter((e) => e.id !== el.dataset.id);
    save(); render();
  },
  'load-plan': async () => {
    if (!await ask('Trocar suas rotinas pelo plano de 5 dias da avaliação? Seu histórico não muda.', 'Usar plano', false)) return;
    state.routines = PLAN_ROUTINES();
    state.goals = { ...DEFAULT_GOALS };
    save(); render();
    toast('Plano de 5 dias carregado.');
  },
  'add-routine': () => {
    state.routines.push({ id: uid(), name: 'Nova rotina', exercises: [] });
    save(); render();
  },
  'delete-routine': async (el) => {
    if (!await ask('Excluir esta rotina?', 'Excluir rotina')) return;
    state.routines = state.routines.filter((r) => r.id !== el.dataset.id);
    save(); render();
  },
  export: () => {
    const json = JSON.stringify(state);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json)
        .then(() => toast('Backup copiado. Cole numa nota ou mensagem para guardar.'))
        .catch(() => {});
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `meu-treino-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'paste-import': () => {
    openSheet(`
      <p class="sheet-msg">Cole aqui o texto do backup.</p>
      <textarea id="paste-box" rows="5" placeholder="{&quot;workouts&quot;: …}"></textarea>
      <button class="sheet-btn" data-sheet="paste-ok">Importar</button>`, (v) => { if (v === 'paste-ok') importText(document.getElementById('paste-box').value); });
  },
  'timer-add': () => { timerEnd += 15000; timerTotal += 15000; tickTimer(); },
  'timer-stop': () => stopTimer(),
  'timer-min': () => showRest(false),
  'timer-expand': () => { if (timerId) showRest(true); },
};

async function importText(txt) {
  let d;
  try {
    d = JSON.parse(txt);
    if (!Array.isArray(d.workouts)) throw new Error('formato');
  } catch (err) {
    toast('Backup inválido. Use um backup exportado pelo Meu Treino.');
    return;
  }
  // espera a folha anterior fechar antes de abrir a confirmação
  await new Promise((r) => setTimeout(r, 250));
  if (!await ask(`Importar ${plural(d.workouts.length, 'treino', 'treinos')}? Isso substitui os dados atuais.`, 'Importar', false)) return;
  state = { workouts: d.workouts, routines: d.routines ?? DEFAULT_ROUTINES, current: d.current || null, goals: { ...DEFAULT_GOALS, ...d.goals }, plan: PLAN_VERSION, body: d.body || [] };
  save(); render();
  toast('Backup importado.');
}

/* ---------- Folha de confirmação e avisos (no lugar de confirm/alert) ---------- */

const $sheet = document.getElementById('sheet');
const $sheetBody = document.getElementById('sheet-body');
let sheetDone = null;

function openSheet(html, onChoose, cancelLabel = 'Cancelar') {
  $sheetBody.innerHTML = html;
  $sheet.querySelector('.sheet-btn.cancel').textContent = cancelLabel;
  sheetDone = onChoose;
  $sheet.hidden = false;
  requestAnimationFrame(() => $sheet.classList.add('open'));
  const first = $sheetBody.querySelector('textarea, button');
  if (first) first.focus();
}

function closeSheet(value) {
  if (window.ExAnim) ExAnim.stop();
  $sheet.classList.remove('open');
  setTimeout(() => { $sheet.hidden = true; }, 200);
  const done = sheetDone; sheetDone = null;
  if (done) done(value);
}

const hasDemo = (name) => !!(window.ExAnim && ExAnim.animFor(name));

function showDemo(name, dose) {
  const key = ExAnim.animFor(name);
  if (!key) return;
  const pat = ExAnim.PATTERNS[key];
  const plan = state.routines.flatMap((r) => r.exercises.map(parseLine)).find((e) => e.name === name && e.target);
  openSheet(`
    <div class="demo">
      <canvas class="demo-canvas" id="demo-canvas" role="img" aria-label="Animação do exercício ${esc(name)}"></canvas>
      <h3 class="demo-title">${esc(name)}</h3>
      ${dose ? `<p class="target" style="text-align:center">${esc(dose)}</p>`
        : plan ? `<p class="target" style="text-align:center">Meta · ${plan.target.sets} × ${esc(plan.target.reps)}</p>` : ''}
      <ul class="demo-tips">${pat.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="demo-legend tiny muted">
        <span><span class="hl-swatch arrow"></span>caminho e direção do movimento</span>
      </div>
    </div>`, null, 'Fechar');
  ExAnim.play(document.getElementById('demo-canvas'), key);
}

function ask(message, okLabel, destructive = true) {
  return new Promise((resolve) => {
    openSheet(`<p class="sheet-msg">${esc(message)}</p>
      <button class="sheet-btn ${destructive ? 'destructive' : ''}" data-sheet="ok">${esc(okLabel)}</button>`,
      (v) => resolve(v === 'ok'));
  });
}

$sheet.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sheet]');
  if (b) closeSheet(b.dataset.sheet);
  else if (e.target === $sheet) closeSheet('cancel');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$sheet.hidden) closeSheet('cancel'); });

let toastId = null;
function toast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastId);
  toastId = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 250); }, ms);
}

/* ---------- Avisos: vibração, bipe e tela acesa ---------- */

const Feedback = (() => {
  let iosLabel = null, actx = null, wake = null;
  const prefs = () => (state.prefs || { haptics: true, sound: true });

  // iPhone (iOS 18+): alternar um "switch" escondido dá um toque de vibração.
  // Só funciona dentro de um toque na tela.
  function iosTick() {
    if (!iosLabel) {
      iosLabel = document.createElement('label');
      iosLabel.setAttribute('aria-hidden', 'true');
      iosLabel.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
      iosLabel.innerHTML = '<input type="checkbox" switch tabindex="-1">';
      document.body.appendChild(iosLabel);
    }
    iosLabel.click();
  }

  /** pattern em ms, como navigator.vibrate. Android vibra o padrão; iPhone dá um toque. */
  function vibrate(pattern) {
    if (!prefs().haptics) return;
    try { if (navigator.vibrate && navigator.vibrate(pattern)) return; } catch (e) { /* bloqueado */ }
    try { iosTick(); } catch (e) { /* sem suporte */ }
  }

  // o áudio precisa ser liberado por um toque; depois o bipe toca sozinho no fim do descanso
  function unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!actx && AC) actx = new AC();
      if (actx && actx.state === 'suspended') actx.resume();
    } catch (e) { /* sem áudio */ }
  }
  function beep(times = 3) {
    if (!prefs().sound || !actx) return;
    try {
      const t0 = actx.currentTime + 0.02;
      for (let i = 0; i < times; i++) {
        const t = t0 + i * 0.22, osc = actx.createOscillator(), g = actx.createGain();
        osc.type = 'sine'; osc.frequency.value = i === times - 1 ? 1320 : 880;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(g); g.connect(actx.destination);
        osc.start(t); osc.stop(t + 0.18);
      }
    } catch (e) { /* ignora */ }
  }

  // mantém a tela acesa durante o treino, para o timer não parar
  async function keepAwake(on) {
    try {
      if (on && !wake && navigator.wakeLock && document.visibilityState === 'visible') {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => { wake = null; });
      } else if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  document.addEventListener('visibilitychange', () => { if (state.current) keepAwake(true); });
  document.addEventListener('pointerdown', unlock, { passive: true });

  return { vibrate, beep, keepAwake };
})();

/* ---------- Timer de descanso ---------- */

let timerEnd = 0, timerTotal = 0, timerId = null;
const $timer = document.getElementById('timer');
const $timerValue = document.getElementById('timer-value');
const $timerBar = document.getElementById('timer-bar');
const RING_LEN = 2 * Math.PI * 15;
const $big = document.getElementById('rest-big');
const $bigValue = document.getElementById('rb-value');
const $bigBar = document.getElementById('rb-bar');
const $bigNext = document.getElementById('rb-next');
const BIG_LEN = 2 * Math.PI * 100;
let restMini = false;

/** Texto da próxima série a fazer, para mostrar durante o descanso. */
function nextSetLabel() {
  const cur = state.current; if (!cur) return '';
  for (const ex of cur.exercises) {
    const i = ex.sets.findIndex((x) => !x.done);
    if (i >= 0) return `Próxima: ${ex.name} · série ${i + 1} de ${ex.sets.length}`;
  }
  return 'Todas as séries feitas. Finalize o treino!';
}

function showRest(big) {
  restMini = !big;
  $big.hidden = !big;
  $timer.classList.toggle('hidden', big);
  document.body.classList.toggle('resting', big);
}

function startTimer() {
  timerTotal = REST_SECONDS * 1000;
  timerEnd = Date.now() + timerTotal;
  $bigNext.textContent = nextSetLabel();
  showRest(true);
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 250);
  tickTimer();
}

function tickTimer() {
  const leftMs = Math.max(0, timerEnd - Date.now());
  const left = Math.ceil(leftMs / 1000);
  $timerValue.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $timerBar.style.strokeDashoffset = (RING_LEN * (1 - leftMs / timerTotal)).toFixed(2);
  // tela cheia: número gigante em segundos (ou m:ss acima de 1 minuto)
  $bigValue.textContent = left >= 60 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : String(left);
  $bigBar.style.strokeDashoffset = (BIG_LEN * (1 - leftMs / timerTotal)).toFixed(2);
  $big.classList.toggle('ending', left <= 5 && left > 0);
  if (left === 0) {
    Feedback.vibrate([250, 120, 250]);
    Feedback.beep(3);
    stopTimer();
    toast('Descanso acabou. Bora para a próxima série! 💪', 3000);
  }
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  $timer.classList.add('hidden');
  $big.hidden = true;
  $big.classList.remove('ending');
  document.body.classList.remove('resting');
}

// Cronômetro do treino em andamento (atualiza só o número, sem redesenhar a tela).
setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && state.current) el.textContent = clock(Date.now() - new Date(state.current.startedAt));
}, 1000);

/* ---------- Eventos ---------- */

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { tab = tabBtn.dataset.tab; render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('button[data-action]');
  if (el && actions[el.dataset.action]) { actions[el.dataset.action](el); return; }
  if (e.target.closest('#timer')) actions['timer-expand']();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'new-ex') actions['add-ex']();
});

// Edição de campos: salva sem redesenhar (para não perder o foco do teclado).
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.k && t.dataset.ei !== undefined) {
    state.current.exercises[+t.dataset.ei].sets[+t.dataset.si][t.dataset.k] = t.value;
    save();
  } else if (t.dataset.field === 'name' && state.current) {
    state.current.name = t.value;
    save();
  } else if (t.dataset.routine) {
    const r = state.routines.find((x) => x.id === t.dataset.routine);
    if (!r) return;
    if (t.dataset.k === 'name') r.name = t.value;
    else if (t.dataset.k === 'note') r.note = t.value;
    else r.exercises = t.value.split('\n').map((s) => s.trim()).filter(Boolean);
    save();
  } else if (t.dataset.goal) {
    const v = Math.round(num(t.value));
    if (v > 0) { state.goals[t.dataset.goal] = v; save(); }
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.pref) {
    state.prefs = { haptics: true, sound: true, ...state.prefs, [t.dataset.pref]: t.checked };
    save();
    if (t.checked) (t.dataset.pref === 'sound' ? Feedback.beep(2) : Feedback.vibrate(30));
    return;
  }
  if (t.dataset.action === 'import' && t.files[0]) {
    t.files[0].text().then(importText);
    t.value = '';
  }
});

/* ---------- Início ---------- */

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

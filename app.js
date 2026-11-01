'use strict';

/* =========================================================
   Meu Treino — app para acompanhar treinos
   Dados ficam salvos no próprio aparelho (localStorage).
   ========================================================= */

const STORAGE_KEY = 'meu-treino:v1';
const REST_SECONDS = 90;
const DEFAULT_GOALS = { workouts: 4, minutes: 180, sets: 60 };

const DEFAULT_ROUTINES = [
  { id: uid(), name: 'Treino A — Peito e Tríceps', exercises: ['Supino reto', 'Supino inclinado com halteres', 'Crucifixo', 'Tríceps na polia', 'Tríceps francês'] },
  { id: uid(), name: 'Treino B — Costas e Bíceps', exercises: ['Puxada frontal', 'Remada curvada', 'Remada baixa', 'Rosca direta', 'Rosca martelo'] },
  { id: uid(), name: 'Treino C — Pernas e Ombros', exercises: ['Agachamento livre', 'Leg press', 'Cadeira extensora', 'Mesa flexora', 'Desenvolvimento', 'Elevação lateral'] },
];

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

/* ---------- Persistência ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { workouts: d.workouts || [], routines: d.routines ?? DEFAULT_ROUTINES, current: d.current || null, goals: { ...DEFAULT_GOALS, ...d.goals } };
    }
  } catch (e) { /* sem armazenamento disponível */ }
  return { workouts: [], routines: DEFAULT_ROUTINES, current: null, goals: { ...DEFAULT_GOALS } };
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
  state.routines.forEach((r) => r.exercises.forEach((n) => names.set(n.toLowerCase(), n)));
  state.workouts.forEach((w) => w.exercises.forEach((e) => names.set(e.name.toLowerCase(), e.name)));
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function newExercise(name) {
  const prev = lastPerformance(name);
  const sets = prev
    ? prev.map((s) => ({ kg: s.kg, reps: s.reps, done: false }))
    : Array.from({ length: 3 }, () => ({ kg: '', reps: '', done: false }));
  return { name, sets };
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

    <h2 class="section-title">Começar treino</h2>
    <div class="list">
      ${state.routines.map((r, i) => `
        <button class="list-row" data-action="start" data-id="${r.id}">
          <span class="icon-badge" style="--c:${ROUTINE_COLORS[i % ROUTINE_COLORS.length]}">${ICON.dumbbell}</span>
          <span class="body">
            <span class="title" style="display:block">${esc(r.name)}</span>
            <span class="small muted">${plural(r.exercises.length, 'exercício', 'exercícios')}</span>
          </span>
          <span class="pill-btn go" aria-hidden="true">Iniciar</span>
        </button>`).join('')}
      <button class="list-row" data-action="start-empty">
        <span class="icon-badge" style="--c:var(--muted)">${ICON.plus}</span>
        <span class="body"><span class="title">Treino livre</span></span>
        <span class="chev">${ICON.chevron}</span>
      </button>
    </div>
  `;
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
    <div class="spacer"></div>

    ${cur.exercises.map((ex, ei) => {
      const prev = lastPerformance(ex.name);
      return `
      <section class="card exercise">
        <div class="exercise-head">
          <h3>${esc(ex.name)}</h3>
          <button class="icon-btn" data-action="remove-ex" data-ei="${ei}" aria-label="Remover exercício">${ICON.trash}</button>
        </div>
        ${prev ? `<p class="last-time">Última vez · ${prev.map((s) => `${fmtNum(num(s.kg))} × ${num(s.reps)}`).join('  ')}</p>` : ''}
        <div class="set-head"><span>#</span><span>kg</span><span>reps</span><span></span></div>
        ${ex.sets.map((s, si) => `
          <div class="set-row ${s.done ? 'done' : ''}">
            <span class="n">${si + 1}</span>
            <input inputmode="decimal" value="${esc(s.kg)}" placeholder="–" aria-label="Carga série ${si + 1}" data-ei="${ei}" data-si="${si}" data-k="kg">
            <input inputmode="numeric" value="${esc(s.reps)}" placeholder="–" aria-label="Repetições série ${si + 1}" data-ei="${ei}" data-si="${si}" data-k="reps">
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
  `;
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

function viewProgresso() {
  const names = [...new Set(state.workouts.flatMap((w) => w.exercises.filter((e) => e.sets.some((s) => s.done && num(s.kg) > 0)).map((e) => e.name)))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (!names.length) {
    return header('Progresso') + emptyState(ICON.trend, 'var(--ring-green)', 'Sem dados ainda', 'Registre alguns treinos para ver sua evolução.');
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
      ${points.length >= 2 ? chart(points) : '<p class="small muted" style="margin-top:8px">Faça esse exercício em pelo menos 2 treinos para ver o gráfico.</p>'}
    </div>
  `;
}

function chart(points) {
  const W = 600, H = 300, P = { l: 8, r: 64, t: 20, b: 44 };
  const vals = points.map((p) => p.best);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 5; max += 5; }
  const pad = (max - min) * 0.15;
  min = Math.max(0, min - pad); max += pad;
  const x = (i) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.best).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const labelIdx = [...new Set([0, points.length - 1])];
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução da maior carga em ${esc(progressExercise)}">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="stop-a"/><stop offset="1" class="stop-b"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/>
        <text x="${W - P.r + 10}" y="${y(t) + 7}">${fmtNum(Math.round(t))}</text>`).join('')}
      <path class="area" d="${area}"/>
      <path class="line" d="${line}"/>
      ${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.best)}" r="6"><title>${fmtDate(p.date)}: ${fmtNum(p.best)} kg</title></circle>`).join('')}
      ${labelIdx.map((i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="${i === 0 ? 'start' : 'end'}">${fmtDate(points[i].date, { day: 'numeric', month: 'short' })}</text>`).join('')}
    </svg>`;
}

function viewRotinas() {
  const g = state.goals;
  return `
    ${header('Rotinas', 'Seus treinos fixos')}
    ${state.routines.map((r, i) => `
      <div class="card routine-edit">
        <div class="row">
          <span class="icon-badge" style="--c:${ROUTINE_COLORS[i % ROUTINE_COLORS.length]}">${ICON.dumbbell}</span>
          <input class="plain grow" value="${esc(r.name)}" data-routine="${r.id}" data-k="name" aria-label="Nome da rotina">
          <button class="icon-btn" data-action="delete-routine" data-id="${r.id}" aria-label="Excluir rotina">${ICON.trash}</button>
        </div>
        <textarea rows="${Math.max(3, r.exercises.length)}" data-routine="${r.id}" data-k="exercises" placeholder="Um exercício por linha" aria-label="Exercícios">${esc(r.exercises.join('\n'))}</textarea>
      </div>`).join('')}
    <button class="btn tinted" data-action="add-routine">${ICON.plus} Nova rotina</button>

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

function startWorkout(routine) {
  state.current = {
    name: routine ? routine.name : 'Treino livre',
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
  state.workouts.push({ id: uid(), name: cur.name, date: now, duration: minutesBetween(cur.startedAt, now), exercises });
  state.current = null;
  stopTimer();
  save();
  tab = 'historico';
  render();
  window.scrollTo(0, 0);
  const since = startOfWeek();
  const weekCount = state.workouts.filter((w) => new Date(w.date) >= since).length;
  toast(weekCount === state.goals.workouts ? pick(GOAL_PHRASES) : pick(FINISH_PHRASES), 4000);
}

const actions = {
  start: (el) => startWorkout(state.routines.find((r) => r.id === el.dataset.id)),
  'start-empty': () => startWorkout(null),
  'add-ex': () => {
    const input = document.getElementById('new-ex');
    const name = input.value.trim();
    if (!name) return input.focus();
    state.current.exercises.push(newExercise(name));
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
  'toggle-set': (el) => {
    const set = state.current.exercises[+el.dataset.ei].sets[+el.dataset.si];
    set.done = !set.done;
    save(); render();
    if (set.done) {
      startTimer();
      if (navigator.vibrate) navigator.vibrate(15);
      const ex = state.current.exercises[+el.dataset.ei];
      const prev = bestKg(ex.name);
      const kg = num(set.kg);
      const firstToday = ex.sets.filter((x) => x.done && num(x.kg) >= kg).length === 1;
      if (prev > 0 && kg > prev && num(set.reps) > 0 && firstToday) {
        toast(`Novo recorde no ${ex.name}: ${fmtNum(kg)} kg! Você está mais forte.`, 4000);
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
  pick: (el) => { progressExercise = el.dataset.name; render(); },
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
  state = { workouts: d.workouts, routines: d.routines ?? DEFAULT_ROUTINES, current: d.current || null, goals: { ...DEFAULT_GOALS, ...d.goals } };
  save(); render();
  toast('Backup importado.');
}

/* ---------- Folha de confirmação e avisos (no lugar de confirm/alert) ---------- */

const $sheet = document.getElementById('sheet');
const $sheetBody = document.getElementById('sheet-body');
let sheetDone = null;

function openSheet(html, onChoose) {
  $sheetBody.innerHTML = html;
  sheetDone = onChoose;
  $sheet.hidden = false;
  requestAnimationFrame(() => $sheet.classList.add('open'));
  const first = $sheetBody.querySelector('textarea, button');
  if (first) first.focus();
}

function closeSheet(value) {
  $sheet.classList.remove('open');
  setTimeout(() => { $sheet.hidden = true; }, 200);
  const done = sheetDone; sheetDone = null;
  if (done) done(value);
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

/* ---------- Timer de descanso ---------- */

let timerEnd = 0, timerTotal = 0, timerId = null;
const $timer = document.getElementById('timer');
const $timerValue = document.getElementById('timer-value');
const $timerBar = document.getElementById('timer-bar');
const RING_LEN = 2 * Math.PI * 15;

function startTimer() {
  timerTotal = REST_SECONDS * 1000;
  timerEnd = Date.now() + timerTotal;
  $timer.classList.remove('hidden');
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 250);
  tickTimer();
}

function tickTimer() {
  const leftMs = Math.max(0, timerEnd - Date.now());
  const left = Math.ceil(leftMs / 1000);
  $timerValue.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $timerBar.style.strokeDashoffset = (RING_LEN * (1 - leftMs / timerTotal)).toFixed(2);
  if (left === 0) {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    stopTimer();
  }
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  $timer.classList.add('hidden');
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
  if (el && actions[el.dataset.action]) actions[el.dataset.action](el);
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
    else r.exercises = t.value.split('\n').map((s) => s.trim()).filter(Boolean);
    save();
  } else if (t.dataset.goal) {
    const v = Math.round(num(t.value));
    if (v > 0) { state.goals[t.dataset.goal] = v; save(); }
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
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

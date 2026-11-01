'use strict';

/* =========================================================
   Meu Treino — app para acompanhar treinos
   Dados ficam salvos no próprio aparelho (localStorage).
   ========================================================= */

const STORAGE_KEY = 'meu-treino:v1';
const REST_SECONDS = 90;

const DEFAULT_ROUTINES = [
  { id: uid(), name: 'Treino A — Peito e Tríceps', exercises: ['Supino reto', 'Supino inclinado com halteres', 'Crucifixo', 'Tríceps na polia', 'Tríceps francês'] },
  { id: uid(), name: 'Treino B — Costas e Bíceps', exercises: ['Puxada frontal', 'Remada curvada', 'Remada baixa', 'Rosca direta', 'Rosca martelo'] },
  { id: uid(), name: 'Treino C — Pernas e Ombros', exercises: ['Agachamento livre', 'Leg press', 'Cadeira extensora', 'Mesa flexora', 'Desenvolvimento', 'Elevação lateral'] },
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
      const data = JSON.parse(raw);
      return { workouts: data.workouts || [], routines: data.routines || [], current: data.current || null };
    }
  } catch (e) { /* sem armazenamento disponível */ }
  return { workouts: [], routines: DEFAULT_ROUTINES, current: null };
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

function fmtDate(iso, opts = { weekday: 'short', day: '2-digit', month: 'short' }) {
  return new Date(iso).toLocaleDateString('pt-BR', opts);
}

function minutesBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
}

function volume(workout) {
  return workout.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter((s) => s.done).reduce((s2, s) => s2 + num(s.kg) * num(s.reps), 0), 0);
}

function doneSets(workout) {
  return workout.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);
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
    : [{ kg: '', reps: '', done: false }, { kg: '', reps: '', done: false }, { kg: '', reps: '', done: false }];
  return { name, sets };
}

/* ---------- Telas ---------- */

function render() {
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const views = { treino: viewTreino, historico: viewHistorico, progresso: viewProgresso, rotinas: viewRotinas };
  $view.innerHTML = views[tab]();
}

function viewTreino() {
  const cur = state.current;
  if (!cur) {
    const week = state.workouts.filter((w) => Date.now() - new Date(w.date) < 7 * 864e5).length;
    const last = state.workouts[state.workouts.length - 1];
    return `
      <div class="stats">
        <div class="stat"><strong>${state.workouts.length}</strong><span>treinos</span></div>
        <div class="stat"><strong>${week}</strong><span>últimos 7 dias</span></div>
        <div class="stat"><strong>${last ? fmtDate(last.date, { day: '2-digit', month: '2-digit' }) : '—'}</strong><span>último</span></div>
      </div>
      <h2>Começar treino</h2>
      ${state.routines.map((r) => `
        <div class="card row between">
          <div class="grow">
            <h3>${esc(r.name)}</h3>
            <p class="muted">${r.exercises.length} exercícios</p>
          </div>
          <button class="primary" data-action="start" data-id="${r.id}">Iniciar</button>
        </div>`).join('')}
      <button class="block" data-action="start-empty">+ Treino livre (sem rotina)</button>
    `;
  }

  return `
    <div class="card stack">
      <input id="w-name" value="${esc(cur.name)}" aria-label="Nome do treino" data-field="name">
      <p class="muted">Começou às ${new Date(cur.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        · ${doneSets(cur)} séries feitas · ${fmtNum(volume(cur))} kg de volume</p>
    </div>

    ${cur.exercises.map((ex, ei) => {
      const prev = lastPerformance(ex.name);
      return `
      <div class="card">
        <div class="row between">
          <h3 class="grow">${esc(ex.name)}</h3>
          <button class="small ghost danger" data-action="remove-ex" data-ei="${ei}" aria-label="Remover exercício">🗑</button>
        </div>
        ${prev ? `<p class="prev">Última vez: ${prev.map((s) => `${fmtNum(num(s.kg))}kg×${num(s.reps)}`).join(' · ')}</p>` : ''}
        <table class="sets">
          <thead><tr><th>Série</th><th>Carga (kg)</th><th>Reps</th><th>✓</th></tr></thead>
          <tbody>
            ${ex.sets.map((s, si) => `
              <tr class="${s.done ? 'done' : ''}">
                <td>${si + 1}</td>
                <td><input inputmode="decimal" value="${esc(s.kg)}" placeholder="0" data-ei="${ei}" data-si="${si}" data-k="kg"></td>
                <td><input inputmode="numeric" value="${esc(s.reps)}" placeholder="0" data-ei="${ei}" data-si="${si}" data-k="reps"></td>
                <td><button class="check ${s.done ? 'on' : ''}" data-action="toggle-set" data-ei="${ei}" data-si="${si}" aria-label="Marcar série">✓</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="row" style="margin-top:8px">
          <button class="small grow" data-action="add-set" data-ei="${ei}">+ Série</button>
          <button class="small" data-action="remove-set" data-ei="${ei}" ${ex.sets.length <= 1 ? 'disabled' : ''}>− Série</button>
        </div>
      </div>`;
    }).join('')}

    <div class="card stack">
      <div class="row">
        <input id="new-ex" class="grow" list="ex-list" placeholder="Adicionar exercício…">
        <button data-action="add-ex">Adicionar</button>
      </div>
      <datalist id="ex-list">${allExerciseNames().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    </div>

    <button class="primary block" data-action="finish">Finalizar e salvar treino</button>
    <p></p>
    <button class="block danger" data-action="cancel">Descartar treino</button>
  `;
}

function viewHistorico() {
  if (!state.workouts.length) {
    return `<div class="empty"><div class="big">📅</div><p>Nenhum treino salvo ainda.</p><p>Finalize um treino para ele aparecer aqui.</p></div>`;
  }
  const list = [...state.workouts].reverse();
  return `
    <h2>Histórico</h2>
    ${list.map((w) => `
      <details class="card">
        <summary class="row between">
          <div class="grow">
            <h3>${esc(w.name)}</h3>
            <p class="muted">${fmtDate(w.date)} · ${w.duration} min · ${doneSets(w)} séries · ${fmtNum(volume(w))} kg</p>
          </div>
          <span class="muted">▾</span>
        </summary>
        <div class="stack" style="margin-top:10px">
          ${w.exercises.map((ex) => {
            const sets = ex.sets.filter((s) => s.done);
            if (!sets.length) return '';
            return `<div><strong>${esc(ex.name)}</strong>
              <div class="chips" style="margin-top:4px">${sets.map((s) => `<span class="chip">${fmtNum(num(s.kg))} kg × ${num(s.reps)}</span>`).join('')}</div></div>`;
          }).join('')}
          <button class="small danger" data-action="delete-workout" data-id="${w.id}">Excluir treino</button>
        </div>
      </details>`).join('')}
    ${backupCard()}
  `;
}

function viewProgresso() {
  const names = [...new Set(state.workouts.flatMap((w) => w.exercises.filter((e) => e.sets.some((s) => s.done)).map((e) => e.name)))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (!names.length) {
    return `<div class="empty"><div class="big">📈</div><p>Sem dados de progresso ainda.</p><p>Registre alguns treinos para ver sua evolução.</p></div>`;
  }
  if (!progressExercise || !names.includes(progressExercise)) progressExercise = names[0];

  const points = [];
  state.workouts.forEach((w) => {
    const ex = w.exercises.find((e) => e.name === progressExercise);
    if (!ex) return;
    const sets = ex.sets.filter((s) => s.done && num(s.kg) > 0);
    if (!sets.length) return;
    const best = Math.max(...sets.map((s) => num(s.kg)));
    // 1RM estimado (fórmula de Epley)
    const orm = Math.max(...sets.map((s) => num(s.kg) * (1 + num(s.reps) / 30)));
    points.push({ date: w.date, best, orm });
  });

  const pr = points.length ? Math.max(...points.map((p) => p.best)) : 0;
  const orm = points.length ? Math.max(...points.map((p) => p.orm)) : 0;
  const first = points[0]?.best ?? 0;
  const diff = pr - first;

  return `
    <h2>Progresso</h2>
    <select data-field="progress">
      ${names.map((n) => `<option ${n === progressExercise ? 'selected' : ''}>${esc(n)}</option>`).join('')}
    </select>
    <p></p>
    <div class="stats">
      <div class="stat"><strong>${fmtNum(pr)}</strong><span>recorde (kg)</span></div>
      <div class="stat"><strong>${fmtNum(orm)}</strong><span>1RM estimado</span></div>
      <div class="stat"><strong>${diff >= 0 ? '+' : ''}${fmtNum(diff)}</strong><span>desde o início</span></div>
    </div>
    <div class="card">
      <p class="muted">Maior carga por treino (kg)</p>
      ${points.length >= 2 ? chart(points) : '<p class="muted">Registre esse exercício em pelo menos 2 treinos para ver o gráfico.</p>'}
    </div>
  `;
}

function chart(points) {
  const W = 600, H = 280, P = { l: 56, r: 16, t: 16, b: 40 };
  const vals = points.map((p) => p.best);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 5; max += 5; }
  const pad = (max - min) * 0.1;
  min = Math.max(0, min - pad); max += pad;
  const x = (i) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.best).toFixed(1)}`).join(' ');
  const labelIdx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução de carga">
      ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/>
        <text x="${P.l - 8}" y="${y(t) + 7}" text-anchor="end">${fmtNum(Math.round(t))}</text>`).join('')}
      <path class="line" d="${path}"/>
      ${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.best)}" r="6"><title>${fmtDate(p.date)}: ${fmtNum(p.best)} kg</title></circle>`).join('')}
      ${labelIdx.map((i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="${i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}">${fmtDate(points[i].date, { day: '2-digit', month: '2-digit' })}</text>`).join('')}
    </svg>`;
}

function viewRotinas() {
  return `
    <h2>Minhas rotinas</h2>
    <p class="muted">Monte seus treinos fixos (A, B, C…). Um exercício por linha.</p>
    ${state.routines.map((r) => `
      <div class="card stack">
        <input value="${esc(r.name)}" data-routine="${r.id}" data-k="name" aria-label="Nome da rotina">
        <textarea rows="${Math.max(3, r.exercises.length)}" data-routine="${r.id}" data-k="exercises" aria-label="Exercícios">${esc(r.exercises.join('\n'))}</textarea>
        <button class="small danger" data-action="delete-routine" data-id="${r.id}">Excluir rotina</button>
      </div>`).join('')}
    <button class="block" data-action="add-routine">+ Nova rotina</button>
    ${backupCard()}
  `;
}

function backupCard() {
  return `
    <h2>Backup</h2>
    <div class="card stack">
      <p class="muted">Seus dados ficam só neste aparelho. Exporte de vez em quando para não perder nada.</p>
      <div class="row">
        <button class="grow" data-action="export">⬇ Exportar</button>
        <label class="btn grow" style="text-align:center">⬆ Importar
          <input type="file" accept="application/json" data-action="import" hidden>
        </label>
      </div>
    </div>`;
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
  cur.exercises = cur.exercises.filter((e) => e.sets.some((s) => s.done));
  if (!cur.exercises.length) {
    alert('Marque pelo menos uma série como feita (✓) antes de salvar.');
    return;
  }
  const now = new Date().toISOString();
  state.workouts.push({ id: uid(), name: cur.name, date: now, duration: minutesBetween(cur.startedAt, now), exercises: cur.exercises });
  state.current = null;
  stopTimer();
  save();
  tab = 'historico';
  render();
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
  'remove-ex': (el) => {
    if (!confirm('Remover este exercício do treino?')) return;
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
    if (set.done) startTimer();
  },
  finish: finishWorkout,
  cancel: () => {
    if (!confirm('Descartar este treino? O que foi registrado será perdido.')) return;
    state.current = null; stopTimer(); save(); render();
  },
  'delete-workout': (el) => {
    if (!confirm('Excluir este treino do histórico?')) return;
    state.workouts = state.workouts.filter((w) => w.id !== el.dataset.id);
    save(); render();
  },
  'add-routine': () => {
    state.routines.push({ id: uid(), name: 'Nova rotina', exercises: [] });
    save(); render();
  },
  'delete-routine': (el) => {
    if (!confirm('Excluir esta rotina?')) return;
    state.routines = state.routines.filter((r) => r.id !== el.dataset.id);
    save(); render();
  },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `meu-treino-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'timer-add': () => { timerEnd += 15000; tickTimer(); },
  'timer-stop': () => stopTimer(),
};

/* ---------- Timer de descanso ---------- */

let timerEnd = 0, timerId = null;
const $timer = document.getElementById('timer');
const $timerValue = document.getElementById('timer-value');

function startTimer() {
  timerEnd = Date.now() + REST_SECONDS * 1000;
  $timer.classList.remove('hidden');
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 250);
  tickTimer();
}

function tickTimer() {
  const left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
  $timerValue.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
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
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.field === 'progress') { progressExercise = t.value; render(); }
  if (t.dataset.action === 'import' && t.files[0]) {
    t.files[0].text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (!Array.isArray(data.workouts)) throw new Error('formato');
        if (!confirm(`Importar ${data.workouts.length} treinos? Isso substitui os dados atuais.`)) return;
        state = { workouts: data.workouts, routines: data.routines || [], current: data.current || null };
        save(); render();
      } catch (err) {
        alert('Arquivo inválido. Use um arquivo exportado pelo Meu Treino.');
      }
    });
  }
});

/* ---------- Início ---------- */

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

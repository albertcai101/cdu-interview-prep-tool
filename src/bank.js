import { QUESTIONS } from './questions.js';

const KEY = 'cdu-question-bank';
let n = 0;
export const newId = () => `${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const defaultBank = () => QUESTIONS.map((x) => ({ id: newId(), cat: x.cat, q: x.q, on: true, custom: false }));

const clean = (x) =>
  x && typeof x.q === 'string' && x.q.trim()
    ? { id: x.id || newId(), cat: (x.cat || 'Uncategorized').trim() || 'Uncategorized', q: x.q.trim(), on: x.on !== false, custom: !!x.custom }
    : null;

export function loadBank() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw).map(clean).filter(Boolean);
      if (arr.length) return arr;
    }
  } catch { /* fall through */ }
  return defaultBank();
}

export function saveBank(bank) {
  try { localStorage.setItem(KEY, JSON.stringify(bank)); } catch { /* quota/private mode */ }
}

export const parseImport = (text) => {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : data.questions;
  return arr.map((x) => clean({ ...x, id: undefined, custom: true })).filter(Boolean);
};

/** mode: 'varied' (distinct categories first), 'random', or 'order' */
export function drawQuestions(bank, n, mode = 'varied') {
  const pool = bank.filter((x) => x.on);
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
  if (mode === 'order') return pool.slice(0, n);
  if (mode === 'random') return shuffle(pool).slice(0, n);
  const byCat = {};
  pool.forEach((x) => (byCat[x.cat] ||= []).push(x));
  const picks = shuffle(Object.keys(byCat)).map((c) => shuffle(byCat[c])[0]);
  const out = picks.slice(0, n);
  if (out.length < n) {
    const rest = shuffle(pool.filter((x) => !out.includes(x)));
    out.push(...rest.slice(0, n - out.length));
  }
  return shuffle(out);
}

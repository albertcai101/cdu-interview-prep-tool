import { useMemo, useRef, useState } from 'react';
import { defaultBank, newId, parseImport } from './bank.js';

const MODES = [
  ['varied', 'Varied: one per category when possible'],
  ['random', 'Fully random'],
  ['order', 'In list order'],
];

export default function QuestionBank({ bank, setBank, settings, setSetting, go, back }) {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // id being edited
  const [draft, setDraft] = useState({ cat: '', q: '' });
  const [bulk, setBulk] = useState('');
  const [bulkCat, setBulkCat] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef();

  const cats = useMemo(() => [...new Set(bank.map((x) => x.cat))], [bank]);
  const shown = bank.filter(
    (x) => (cat === 'all' || x.cat === cat) && (!search || (x.q + x.cat).toLowerCase().includes(search.toLowerCase()))
  );
  const enabled = bank.filter((x) => x.on).length;

  const patch = (id, p) => setBank(bank.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const add = () => {
    if (!draft.q.trim()) return;
    setBank([{ id: newId(), cat: draft.cat.trim() || 'Uncategorized', q: draft.q.trim(), on: true, custom: true }, ...bank]);
    setDraft({ cat: draft.cat, q: '' });
  };
  const addBulk = () => {
    const lines = bulk.split('\n').map((l) => l.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean);
    if (!lines.length) return;
    const c = bulkCat.trim() || 'Uncategorized';
    setBank([...lines.map((q) => ({ id: newId(), cat: c, q, on: true, custom: true })), ...bank]);
    setBulk('');
    flash(`Added ${lines.length} question${lines.length > 1 ? 's' : ''}`);
  };
  const setShown = (on) => {
    const ids = new Set(shown.map((x) => x.id));
    setBank(bank.map((x) => (ids.has(x.id) ? { ...x, on } : x)));
  };
  const removeShown = () => {
    if (!shown.length || !confirm(`Delete ${shown.length} question(s) currently shown?`)) return;
    const ids = new Set(shown.map((x) => x.id));
    setBank(bank.filter((x) => !ids.has(x.id)));
    setCat('all');
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(bank.map(({ cat, q, on }) => ({ cat, q, on })), null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'question-bank.json' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importJson = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const items = parseImport(await f.text());
      if (!items.length) throw new Error('no questions found');
      setBank([...items, ...bank]);
      flash(`Imported ${items.length} questions`);
    } catch (err) {
      flash(`Import failed: ${err.message}`);
    }
  };
  const reset = () => {
    if (confirm('Reset to the built-in questions? Your custom questions will be removed.')) { setBank(defaultBank()); setCat('all'); }
  };

  const need = settings.count;
  return (
    <div className="card wide bank">
      <h2>Question bank</h2>
      <p className="lead">
        {enabled} of {bank.length} questions enabled. Saved in this browser. Paste real questions
        from your invitation, friends, or the program, and switch off the ones you don’t want drawn.
      </p>
      {enabled < need && <div className="err">Only {enabled} enabled, but the interview uses {need}. Enable more or lower the question count.</div>}
      {msg && <div className="note">{msg}</div>}

      <h3>Selection</h3>
      <div className="grid">
        <label>How questions are drawn
          <select value={settings.mode} onChange={(e) => setSetting('mode', e.target.value)}>
            {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>Questions per interview
          <select value={settings.count} onChange={(e) => setSetting('count', +e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      </div>

      <h3>Add a question</h3>
      <div className="add">
        <input list="cats" placeholder="Category (optional)" value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })} />
        <textarea rows="2" placeholder="Type the question…" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
        <button className="primary" onClick={add} disabled={!draft.q.trim()}>Add</button>
      </div>
      <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>

      <details>
        <summary>Paste many (one per line)</summary>
        <input list="cats" placeholder="Category for all" value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} />
        <textarea rows="5" placeholder={'1. First question…\n2. Second question…'} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <button onClick={addBulk} disabled={!bulk.trim()}>Add all</button>
      </details>

      <h3>Questions</h3>
      <div className="filters">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories ({bank.length})</option>
          {cats.map((c) => <option key={c} value={c}>{c} ({bank.filter((x) => x.cat === c).length})</option>)}
        </select>
        <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setShown(true)}>Enable shown</button>
        <button onClick={() => setShown(false)}>Disable shown</button>
        <button onClick={removeShown}>Delete shown</button>
      </div>

      {shown.length === 0 && <p className="fine">No questions match.</p>}
      {shown.map((x) => (
        <div className={`qrow ${x.on ? '' : 'off'}`} key={x.id}>
          <input type="checkbox" checked={x.on} onChange={(e) => patch(x.id, { on: e.target.checked })} aria-label="Include in interviews" />
          {editing === x.id ? (
            <div className="edit">
              <input list="cats" value={x.cat} onChange={(e) => patch(x.id, { cat: e.target.value })} />
              <textarea rows="3" value={x.q} onChange={(e) => patch(x.id, { q: e.target.value })} />
              <button onClick={() => setEditing(null)}>Done</button>
            </div>
          ) : (
            <>
              <div className="qtext"><small>{x.cat}{x.custom ? ' · custom' : ''}</small><p>{x.q}</p></div>
              <div className="qact">
                <button onClick={() => setEditing(x.id)}>Edit</button>
                <button onClick={() => setBank(bank.filter((b) => b.id !== x.id))}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}

      <h3>Backup</h3>
      <div className="row" style={{ marginTop: 0 }}>
        <button onClick={exportJson}>Export JSON</button>
        <button onClick={() => fileRef.current.click()}>Import JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
        <button onClick={reset}>Reset to built-in</button>
      </div>
      <div className="row">
        <button className="primary" onClick={back}>Done</button>
      </div>
    </div>
  );
}

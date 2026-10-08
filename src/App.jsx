import { useEffect, useRef, useState, useCallback } from 'react';
import { QUESTIONS, CATEGORIES, PRACTICE_QUESTION, TIPS } from './questions.js';
import { saveSession, listSessions, deleteSession } from './db.js';

const DEFAULTS = { prep: 45, resp: 120, count: 3, retake: false };
const loadSettings = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('cdu-settings') || '{}') };
  } catch {
    return DEFAULTS;
  }
};
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
const pickMime = () =>
  ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(
    (t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)
  ) || '';

function drawQuestions(n) {
  // One question per distinct category, shuffled — like a varied real set.
  const cats = [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, n);
  return cats.map((c) => {
    const pool = QUESTIONS.filter((q) => q.cat === c);
    return pool[Math.floor(Math.random() * pool.length)];
  });
}

/* ---------- media hook ---------- */
function useMedia() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState({ cams: [], mics: [] });
  const [camId, setCamId] = useState('');
  const [micId, setMicId] = useState('');
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(
    async (cam = camId, mic = micId) => {
      stop();
      setError('');
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: cam ? { deviceId: { exact: cam } } : { width: 1280, height: 720 },
          audio: mic ? { deviceId: { exact: mic }, echoCancellation: true } : { echoCancellation: true },
        });
        streamRef.current = s;
        setStream(s);
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          cams: all.filter((d) => d.kind === 'videoinput'),
          mics: all.filter((d) => d.kind === 'audioinput'),
        });
      } catch (e) {
        setError(
          e.name === 'NotAllowedError'
            ? 'Camera/microphone access was blocked. Click the camera icon in the address bar, allow access, then retry.'
            : e.name === 'NotFoundError'
            ? 'No camera or microphone was found.'
            : `Could not start camera/mic: ${e.message}`
        );
      }
    },
    [camId, micId, stop]
  );

  useEffect(() => stop, [stop]);
  return { stream, error, devices, camId, micId, setCamId, setMicId, start, stop };
}

function Video({ stream, className = '' }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} className={`live ${className}`} autoPlay muted playsInline />;
}

function MicMeter({ stream }) {
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    let raf;
    const tick = () => {
      an.getByteTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
      setLvl(Math.min(1, peak / 64));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      ctx.close();
    };
  }, [stream]);
  return (
    <div className="meter" aria-label="Microphone level">
      <div style={{ width: `${lvl * 100}%` }} />
    </div>
  );
}

/* ---------- screens ---------- */
function Home({ go, settings, setSettings }) {
  const set = (k, v) => {
    const n = { ...settings, [k]: v };
    setSettings(n);
    localStorage.setItem('cdu-settings', JSON.stringify(n));
  };
  return (
    <div className="card wide">
      <h1>Video Interview Simulator</h1>
      <p className="lead">
        Practice the one-way recorded interview: a situational question appears, you get a short
        time to think, then your webcam and microphone record your answer. No live interviewer, no
        pausing, and (in realistic mode) no re-recording.
      </p>

      <div className="how">
        <div><b>1</b><span>Read the question</span></div>
        <div><b>2</b><span>Prep timer counts down</span></div>
        <div><b>3</b><span>Recording starts automatically</span></div>
        <div><b>4</b><span>Auto-submits when time ends</span></div>
      </div>

      <h3>Timing (adjust to match your invitation)</h3>
      <div className="grid">
        <label>Prep time
          <select value={settings.prep} onChange={(e) => set('prep', +e.target.value)}>
            {[0, 15, 30, 45, 60, 90, 120].map((v) => <option key={v} value={v}>{v === 0 ? 'None' : `${v} sec`}</option>)}
          </select>
        </label>
        <label>Response time
          <select value={settings.resp} onChange={(e) => set('resp', +e.target.value)}>
            {[60, 90, 120, 150, 180, 240, 300, 360, 420, 480, 600].map((v) => <option key={v} value={v}>{fmt(v)}</option>)}
          </select>
        </label>
        <label>Questions
          <select value={settings.count} onChange={(e) => set('count', +e.target.value)}>
            {[1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.retake} onChange={(e) => set('retake', e.target.checked)} />
          Allow re-record (easy mode)
        </label>
      </div>

      <div className="row">
        <button className="primary" onClick={() => go('setup')}>Start mock interview</button>
        <button onClick={() => go('history')}>My recordings</button>
        <button onClick={() => go('tips')}>Tips</button>
      </div>
      <p className="fine">
        Recordings stay in your browser on this computer (never uploaded). Exact timing and
        platform for your interview aren’t public, so confirm them in your invitation.
      </p>
    </div>
  );
}

function Setup({ media, go }) {
  const { stream, error, devices, camId, micId, setCamId, setMicId, start } = media;
  useEffect(() => {
    if (!stream) start();
    // eslint-disable-next-line
  }, []);
  return (
    <div className="card wide">
      <h2>System check</h2>
      <p className="lead">Confirm your camera, microphone and lighting before you begin.</p>
      {error && <div className="err">{error}</div>}
      <div className="stage small">{stream ? <Video stream={stream} /> : <div className="ph">Waiting for camera…</div>}</div>
      <p className="fine">Speak and watch the bar move:</p>
      <MicMeter stream={stream} />
      <div className="grid">
        <label>Camera
          <select value={camId} onChange={(e) => { setCamId(e.target.value); start(e.target.value, micId); }}>
            <option value="">Default</option>
            {devices.cams.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
          </select>
        </label>
        <label>Microphone
          <select value={micId} onChange={(e) => { setMicId(e.target.value); start(camId, e.target.value); }}>
            <option value="">Default</option>
            {devices.mics.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Mic'}</option>)}
          </select>
        </label>
      </div>
      <ul className="check-list">
        <li>Face centered, camera at eye level</li><li>Light in front of you, not behind</li>
        <li>Quiet room, notifications off</li><li>Plugged in, stable internet</li>
      </ul>
      <div className="row">
        <button onClick={() => go('home')}>Back</button>
        {error && <button onClick={() => start()}>Retry</button>}
        <button className="primary" disabled={!stream} onClick={() => go('details')}>Continue</button>
      </div>
    </div>
  );
}

function Details({ settings, go, begin }) {
  return (
    <div className="card wide">
      <h2>Assessment details</h2>
      <table className="det">
        <tbody>
          <tr><td>Format</td><td>One-way video interview (situational)</td></tr>
          <tr><td>Questions</td><td>{settings.count}</td></tr>
          <tr><td>Prep time per question</td><td>{settings.prep ? `${settings.prep} seconds` : 'None'}</td></tr>
          <tr><td>Response time per question</td><td>{fmt(settings.resp)}</td></tr>
          <tr><td>Approx. total</td><td>{Math.ceil((settings.count * (settings.prep + settings.resp)) / 60)} min</td></tr>
        </tbody>
      </table>
      <ul className="rules">
        <li>The question stays on screen during prep and recording.</li>
        <li>Recording starts <b>automatically</b> when prep time ends.</li>
        <li>Your answer <b>submits automatically</b> when time is up, or press Submit early.</li>
        <li>{settings.retake ? 'Easy mode: you may re-record after each answer.' : 'You cannot re-record or go back, just like the real thing.'}</li>
      </ul>
      <div className="row">
        <button onClick={() => go('setup')}>Back</button>
        <button onClick={() => begin(true)}>Try a practice question</button>
        <button className="primary" onClick={() => begin(false)}>Begin interview</button>
      </div>
    </div>
  );
}

/** One question: prep phase -> record phase -> done. */
function QuestionRun({ stream, q, index, total, settings, practice, onDone }) {
  const [phase, setPhase] = useState('prep');
  const prep = practice ? Math.min(settings.prep, 20) : settings.prep;
  const resp = practice ? Math.min(settings.resp, 30) : settings.resp;
  const [left, setLeft] = useState(prep);
  const rec = useRef(null);
  const chunks = useRef([]);
  const startedAt = useRef(0);
  const finished = useRef(false);

  const startRec = useCallback(() => {
    chunks.current = [];
    const mime = pickMime();
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      const blob = new Blob(chunks.current, { type: r.mimeType || 'video/webm' });
      setPhase('review');
      setResult({ blob, seconds: Math.round((Date.now() - startedAt.current) / 1000) });
    };
    r.start(1000);
    rec.current = r;
    startedAt.current = Date.now();
    setPhase('record');
    setLeft(resp);
  }, [stream, resp]);

  const [result, setResult] = useState(null);

  // countdown driver
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'record') return;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'prep' && left <= 0) startRec();
    if (phase === 'record' && left <= 0) stopRec();
    // eslint-disable-next-line
  }, [left, phase]);

  useEffect(() => { if (prep === 0 && phase === 'prep') startRec(); /* eslint-disable-next-line */ }, []);
  useEffect(() => () => { if (rec.current?.state === 'recording') { rec.current.onstop = null; rec.current.stop(); } }, []);

  const stopRec = () => {
    if (rec.current?.state === 'recording') rec.current.stop();
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone({ q, ...result });
  };
  const redo = () => { setResult(null); setLeft(prep); if (prep) setPhase('prep'); else startRec(); };

  const total_ = phase === 'prep' ? prep : resp;
  const pct = Math.max(0, Math.min(100, (left / total_) * 100));
  const urgent = left <= 10 && phase !== 'review';

  return (
    <div className="run">
      <div className="topbar">
        <span>{practice ? 'Practice question' : `Question ${index + 1} of ${total}`}</span>
        <span className={`pill ${phase}`}>
          {phase === 'prep' ? 'PREPARE' : phase === 'record' ? <><i className="dot" />RECORDING</> : 'COMPLETE'}
        </span>
      </div>
      <div className="qbox"><small>{q.cat}</small><p>{q.q}</p></div>

      <div className="stage">
        {phase === 'review' && result ? (
          <ReviewPlayer blob={result.blob} />
        ) : (
          <Video stream={stream} />
        )}
        {phase !== 'review' && (
          <div className={`timer ${urgent ? 'urgent' : ''}`}>
            <span>{phase === 'prep' ? 'Time to prepare' : 'Time remaining'}</span>
            <b>{fmt(left)}</b>
          </div>
        )}
      </div>
      {phase !== 'review' && <div className="bar"><div className={phase} style={{ width: `${pct}%` }} /></div>}

      <div className="row center">
        {phase === 'prep' && <button className="primary" onClick={startRec}>Start recording now</button>}
        {phase === 'record' && <button className="primary" onClick={stopRec}>Submit answer</button>}
        {phase === 'review' && (
          <>
            {(settings.retake || practice) && <button onClick={redo}>Re-record</button>}
            <button className="primary" onClick={finish}>
              {practice ? 'Done with practice' : index + 1 < total ? 'Next question' : 'Finish interview'}
            </button>
          </>
        )}
      </div>
      {phase === 'review' && !settings.retake && !practice && (
        <p className="fine center">Answer submitted. (In the real interview you wouldn’t see a playback; review it later under My recordings.)</p>
      )}
    </div>
  );
}

function ReviewPlayer({ blob, className = '' }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return <video className={`live play ${className}`} src={url} controls playsInline />;
}

function Interview({ media, settings, practiceFirst, go }) {
  const [qs] = useState(() => (practiceFirst ? [PRACTICE_QUESTION] : drawQuestions(settings.count)));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const practice = practiceFirst;

  const done = async (a) => {
    if (practice) return go('details');
    const all = [...answers, a];
    if (i + 1 < qs.length) {
      setAnswers(all);
      setI(i + 1);
    } else {
      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        settings: { prep: settings.prep, resp: settings.resp },
        answers: all.map((x) => ({ cat: x.q.cat, q: x.q.q, blob: x.blob, seconds: x.seconds })),
        notes: '',
      };
      try { await saveSession(session); } catch (e) { console.warn('save failed', e); }
      media.stop();
      go('summary', session);
    }
  };

  return <QuestionRun key={i} stream={media.stream} q={qs[i]} index={i} total={qs.length} settings={settings} practice={practice} onDone={done} />;
}

function Summary({ session, go }) {
  return (
    <div className="card wide">
      <h2>Interview complete</h2>
      <p className="lead">Your answers are saved on this device. Watch them back honestly. What’s your eye contact like? Did you use your time? Was there a clear structure?</p>
      <SessionView session={session} />
      <div className="row">
        <button onClick={() => go('home')}>Home</button>
        <button className="primary" onClick={() => go('setup')}>Run another mock</button>
      </div>
    </div>
  );
}

const SELF_CHECK = [
  'Looked at the camera',
  'Clear structure (beginning / middle / end)',
  'Considered everyone affected',
  'Showed my values (integrity, empathy, equity)',
  'Gave a concrete action plan',
  'Used most of my time',
  'Steady pace, few filler words',
];

function SessionView({ session }) {
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState(session.notes || '');
  useEffect(() => {
    const t = setTimeout(() => saveSession({ ...session, notes }).catch(() => {}), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [notes]);
  const dl = (a, n) => {
    const url = URL.createObjectURL(a.blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `drew-mock-q${n + 1}.${a.blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      {session.answers.map((a, n) => (
        <div className="ans" key={n}>
          <small>{a.cat} · answered for {fmt(a.seconds)} of {fmt(session.settings.resp)}</small>
          <p>{a.q}</p>
          <ReviewPlayer blob={a.blob} />
          <button onClick={() => dl(a, n)}>Download</button>
        </div>
      ))}
      <h3>Self-review checklist</h3>
      <div className="checks">
        {SELF_CHECK.map((c) => (
          <label key={c}><input type="checkbox" checked={!!checks[c]} onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })} /> {c}</label>
        ))}
      </div>
      <h3>Notes to self</h3>
      <textarea rows="4" placeholder="What to improve next time…" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </>
  );
}

function History({ go }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const refresh = () => listSessions().then(setList).catch(() => setList([]));
  useEffect(() => { refresh(); }, []);
  if (open) return (
    <div className="card wide">
      <h2>{new Date(open.date).toLocaleString()}</h2>
      <SessionView session={open} />
      <div className="row"><button onClick={() => setOpen(null)}>Back to list</button></div>
    </div>
  );
  return (
    <div className="card wide">
      <h2>My recordings</h2>
      {list === null && <p>Loading…</p>}
      {list?.length === 0 && <p className="lead">No sessions yet. Complete a mock interview to see it here.</p>}
      {list?.map((s) => (
        <div className="hist" key={s.id}>
          <div><b>{new Date(s.date).toLocaleString()}</b><br /><small>{s.answers.length} answers</small></div>
          <div className="row">
            <button onClick={() => setOpen(s)}>Review</button>
            <button onClick={async () => { if (confirm('Delete this session?')) { await deleteSession(s.id); refresh(); } }}>Delete</button>
          </div>
        </div>
      ))}
      <div className="row"><button onClick={() => go('home')}>Home</button></div>
    </div>
  );
}

function Tips({ go }) {
  return (
    <div className="card wide">
      <h2>Tips for one-way situational interviews</h2>
      {TIPS.map((t) => <div className="tip" key={t.t}><b>{t.t}</b><p>{t.d}</p></div>)}
      <h3>Question themes in this simulator</h3>
      <ul className="rules">{CATEGORIES.map((c) => <li key={c}>{c}</li>)}</ul>
      <div className="row"><button onClick={() => go('home')}>Home</button></div>
    </div>
  );
}

/* ---------- app ---------- */
export default function App() {
  const [screen, setScreen] = useState('home');
  const [payload, setPayload] = useState(null);
  const [settings, setSettings] = useState(loadSettings);
  const [practice, setPractice] = useState(false);
  const [runId, setRunId] = useState(0);
  const media = useMedia();

  const go = (s, p) => {
    setPayload(p ?? null);
    setScreen(s);
    if (s === 'home' || s === 'history' || s === 'tips') media.stop();
  };
  const begin = (isPractice) => { setPractice(isPractice); setRunId((n) => n + 1); setScreen('run'); };

  if (!navigator.mediaDevices?.getUserMedia)
    return <main><div className="card"><div className="err">This browser can’t access the camera. Use a recent Chrome, Edge, Safari or Firefox over https or localhost.</div></div></main>;

  return (
    <>
      <header><span className="logo">◆</span> CDU Interview Practice <small>unofficial simulator</small></header>
      <main>
        {screen === 'home' && <Home go={go} settings={settings} setSettings={setSettings} />}
        {screen === 'setup' && <Setup media={media} go={go} />}
        {screen === 'details' && <Details settings={settings} go={go} begin={begin} />}
        {screen === 'run' && <Interview key={runId} media={media} settings={settings} practiceFirst={practice} go={go} />}
        {screen === 'summary' && <Summary session={payload} go={go} />}
        {screen === 'history' && <History go={go} />}
        {screen === 'tips' && <Tips go={go} />}
      </main>
    </>
  );
}

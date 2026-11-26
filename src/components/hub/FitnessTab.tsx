import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Play, Pause, Square, Volume2, Undo2, Check, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BleepAudio, COUNTDOWN, DEADLINES, PROTOCOL, STEPS, completedAt, score, targetAt } from '@/lib/fitness/bleepTest';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Player = { id: string; child_name: string };
type Run = { id: string; players: Player[]; scores: Record<string, number>; pending: Record<string, number | null>; elapsed: number };
type History = { player_id: string; completed_shuttles: number; session_id: string; fitness_sessions: { started_at: string; status: string } | null };

export default function FitnessTab({ teamSlug }: { teamSlug: string }) {
  const { user } = useAuth();
  const key = `pafc-fitness:${user?.id}:${teamSlug}`;
  const [roster, setRoster] = useState<Player[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<History[]>([]);
  const [view, setView] = useState<'run' | 'progress'>('run');
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const audio = useRef<BleepAudio | null>(null);
  const section = useRef<HTMLElement | null>(null);
  const current = useRef<Run | null>(null);
  const saving = useRef(false);
  const wake = useRef<WakeLockSentinel | null>(null);

  const persist = useCallback((next: Run | null) => {
    current.current = next;
    setRun(next);
    try { if (next) localStorage.setItem(key, JSON.stringify(next)); else localStorage.removeItem(key); }
    catch { setNotice('Phone storage is unavailable. Keep this page open until all results are saved.'); }
  }, [key]);

  const load = useCallback(async () => {
    const [players, permission, results] = await Promise.all([
      supabase.rpc('get_fitness_roster', { _team: teamSlug }),
      supabase.rpc('can_manage_fitness', { _team: teamSlug }),
      supabase.from('fitness_results').select('player_id, completed_shuttles, session_id, fitness_sessions!inner(started_at,status,team_slug)').eq('fitness_sessions.team_slug', teamSlug).order('recorded_at', { ascending: false }),
    ]);
    if (players.error || permission.error || results.error) { setError('Unable to load fitness records. Please try again.'); setLoading(false); return; }
    setRoster(players.data ?? []); setSelected((players.data ?? []).map(p => p.id));
    setCanManage(permission.data === true); if (!permission.data) setView('progress');
    setHistory((results.data ?? []) as History[]); setLoading(false);
  }, [teamSlug]);

  useEffect(() => {
    void load();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const restored = JSON.parse(saved) as Run;
        if (restored.id && Array.isArray(restored.players) && restored.scores && restored.pending && Number.isFinite(restored.elapsed)) {
          current.current = restored; setRun(restored); setElapsed(restored.elapsed);
          setNotice('Your previous test is paused. Resume it or finish and save the recorded results.');
        }
      }
    } catch { setError('The previous test could not be restored.'); }
    return () => {
      const latest = current.current;
      if (latest) {
        const updated = { ...latest, elapsed: audio.current?.elapsed ?? latest.elapsed };
        try { localStorage.setItem(key, JSON.stringify(updated)); } catch { /* Already warned on writes. */ }
      }
      void audio.current?.close(); audio.current = null;
      void wake.current?.release();
    };
  }, [key, load]);

  const flush = useCallback(async () => {
    // Finish must wait for an in-flight dropout or undo save before draining the queue.
    while (saving.current) await new Promise(resolve => window.setTimeout(resolve, 50));
    saving.current = true;
    try {
      const snapshot = current.current;
      if (!snapshot) return true;
      for (const [playerId, value] of Object.entries(snapshot.pending)) {
        const response = value === null
          ? await supabase.from('fitness_results').delete().eq('session_id', snapshot.id).eq('player_id', playerId)
          : await supabase.from('fitness_results').upsert({ session_id: snapshot.id, player_id: playerId, completed_shuttles: value }, { onConflict: 'session_id,player_id' });
        if (response.error) { setError('Results are kept on this phone but have not all saved yet. Check your connection and retry.'); return false; }
        const latest = current.current;
        if (latest && latest.pending[playerId] === value) {
          const pending = { ...latest.pending }; delete pending[playerId]; persist({ ...latest, pending });
        }
      }
      setError(''); return Object.keys(current.current?.pending ?? {}).length === 0;
    } finally { saving.current = false; }
  }, [persist]);

  useEffect(() => { const timer = window.setInterval(() => { if (Object.keys(current.current?.pending ?? {}).length) void flush(); }, 10000); return () => clearInterval(timer); }, [flush]);

  async function keepAwake() {
    try { if ('wakeLock' in navigator) wake.current = await navigator.wakeLock.request('screen'); }
    catch { setNotice('Keep your phone screen on and this page open during the test.'); }
  }
  const pause = useCallback(async (message?: string) => {
    const player = audio.current;
    if (player) { await player.pause(); const latest = current.current; if (latest) persist({ ...latest, elapsed: player.elapsed }); }
    setRunning(false); void wake.current?.release(); wake.current = null;
    if (message) setNotice(message);
  }, [persist]);

  useEffect(() => {
    function hidden() { if (document.hidden && audio.current?.running) void pause('Test paused because you left this page. Keep the screen on while running.'); }
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [pause]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const player = audio.current; if (!player) return;
      if (!player.running) { void pause('Audio was interrupted. Resume when the squad is ready.'); return; }
      const now = Math.min(player.elapsed, DEADLINES.at(-1) ?? player.elapsed);
      setElapsed(now);
      const latest = current.current;
      if (latest && Math.floor(now) !== Math.floor(latest.elapsed)) persist({ ...latest, elapsed: now });
      if (now >= (DEADLINES.at(-1) ?? Infinity)) void pause('Test complete. Finish and save the remaining players.');
    }, 100);
    return () => clearInterval(timer);
  }, [running, pause, persist]);

  async function testSpeaker() {
    try { audio.current ??= new BleepAudio(); await audio.current.test(); setNotice('Sound check played. Confirm you heard it on your speaker before starting.'); }
    catch { setError('Sound could not start. Check your phone volume and try again.'); }
  }
  async function start() {
    setBusy(true); setError('');
    try {
      audio.current ??= new BleepAudio();
      // Unlock audio inside the tap, before waiting for the network on mobile.
      await audio.current.test();
      const response = await supabase.from('fitness_sessions').insert({ team_slug: teamSlug, protocol: PROTOCOL }).select('id').single();
      if (response.error) throw response.error;
      const next = { id: response.data.id, players: roster.filter(p => selected.includes(p.id)), scores: {}, pending: {}, elapsed: 0 };
      persist(next); setElapsed(0); setNotice('');
      window.scrollTo({ top: Math.max(0, (section.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 112), behavior: 'instant' });
      await audio.current.start(); setRunning(true); await keepAwake();
    } catch { setError('The test could not start. Check your connection and sound, then try again.'); }
    finally { setBusy(false); }
  }
  async function resume() {
    try {
      if (audio.current) await audio.current.resume();
      else { audio.current = new BleepAudio(); await audio.current.start(current.current?.elapsed ?? elapsed); }
      setRunning(true); setNotice(''); await keepAwake();
    } catch { setError('Audio could not resume. Try again.'); }
  }
  function record(playerId: string, undo = false) {
    const latest = current.current; if (!latest) return;
    const count = completedAt(audio.current?.elapsed ?? elapsed);
    const scores = { ...latest.scores };
    if (undo) delete scores[playerId]; else scores[playerId] = count;
    persist({ ...latest, scores, pending: { ...latest.pending, [playerId]: undo ? null : count }, elapsed: audio.current?.elapsed ?? elapsed });
    void flush();
  }
  async function finish() {
    if (!window.confirm('Finish this test? Remaining runners will be recorded at the last completed shuttle.')) return;
    setBusy(true); await pause();
    const latest = current.current;
    if (!latest) { setBusy(false); return; }
    const count = completedAt(audio.current?.elapsed ?? latest.elapsed);
    const scores = { ...latest.scores }; const pending = { ...latest.pending };
    for (const player of latest.players) if (scores[player.id] === undefined) { scores[player.id] = count; pending[player.id] = count; }
    persist({ ...latest, scores, pending });
    const saved = await flush();
    if (saved) {
      const response = await supabase.from('fitness_sessions').update({ status: 'completed', finished_at: new Date().toISOString() }).eq('id', latest.id);
      if (response.error) setError('Results saved, but the test could not be finished. Retry finish and save.');
      else { await audio.current?.close(); audio.current = null; persist(null); setView('progress'); setNotice('Test saved.'); await load(); }
    }
    setBusy(false);
  }

  const completed = completedAt(elapsed);
  const target = targetAt(elapsed);
  const out = Object.keys(run?.scores ?? {}).length;
  const pendingCount = Object.keys(run?.pending ?? {}).length;
  if (loading) return <div className="py-12 text-muted-foreground"><Loader2 className="inline h-5 w-5 animate-spin mr-2" />Loading fitness...</div>;
  return <section ref={section} className="space-y-6">
    <header className="flex items-center justify-between gap-3 flex-wrap">
      <div><h2 className="font-display text-3xl flex items-center gap-2"><Activity className="h-7 w-7 text-primary" />Fitness</h2><p className="text-sm text-muted-foreground mt-1">20 metre bleep test</p></div>
      {canManage && <div className="flex gap-1 bg-secondary rounded-md p-1"><Button size="sm" variant={view === 'run' ? 'default' : 'ghost'} onClick={() => setView('run')}><Play />Test</Button><Button size="sm" variant={view === 'progress' ? 'default' : 'ghost'} onClick={() => setView('progress')}><TrendingUp />Progress</Button></div>}
    </header>
    {error && <div role="alert" className="text-destructive text-sm space-y-2"><p>{error}</p><Button variant="outline" size="sm" onClick={() => run ? void flush() : void load()}>Retry</Button></div>}
    {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
    {view === 'run' && canManage && <>
      {!run ? <>
        <div className="flex flex-wrap gap-3 items-center"><Button variant="outline" onClick={testSpeaker}><Volume2 />Test speaker</Button><span className="text-sm text-muted-foreground">20m apart · 8.5 km/h start · 5 second countdown</span></div>
        <p className="text-sm text-muted-foreground">Pair your Bluetooth speaker in your phone settings. Keep this page open and the screen on. Warm up first; stop if unwell.</p>
        <div className="flex items-center justify-between"><h3 className="font-display text-xl">Tonight’s runners <span className="text-primary">{selected.length}</span></h3><Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === roster.length ? [] : roster.map(p => p.id))}>{selected.length === roster.length ? 'Clear all' : 'Select all'}</Button></div>
        {!roster.length && <p className="text-muted-foreground">No registered players found for this team.</p>}
        <div className="grid sm:grid-cols-2 gap-2">{roster.map(p => <label key={p.id} className="flex items-center gap-3 bg-secondary/40 rounded-md p-4 cursor-pointer"><Checkbox checked={selected.includes(p.id)} onCheckedChange={checked => setSelected(previous => checked ? [...previous, p.id] : previous.filter(id => id !== p.id))} /><span className="font-medium">{p.child_name}</span></label>)}</div>
        <Button size="lg" disabled={!selected.length || busy} onClick={start} className="w-full sm:w-auto">{busy ? <Loader2 className="animate-spin" /> : <Play />}Start bleep test</Button>
      </> : <>
        <div className="bg-secondary/40 rounded-lg p-5 text-center space-y-3">
          <p className="text-sm uppercase text-muted-foreground">{elapsed < COUNTDOWN ? 'Get ready' : running ? 'Running' : 'Paused'}</p>
          {elapsed < COUNTDOWN ? <div className="font-display text-6xl text-primary">{Math.max(0, Math.ceil(COUNTDOWN - elapsed))}</div> : <div className="flex justify-center gap-8"><div><p className="font-display text-5xl text-primary">{target?.level}</p><p className="text-xs text-muted-foreground">Level</p></div><div><p className="font-display text-5xl">{target?.shuttle}</p><p className="text-xs text-muted-foreground">Shuttle underway</p></div></div>}
          <p className="text-sm text-muted-foreground">Last completed: <strong className="text-foreground">{score(completed)}</strong> · {run.players.length - out} running · {Math.floor(Math.max(0, elapsed - COUNTDOWN) / 60)}:{String(Math.floor(Math.max(0, elapsed - COUNTDOWN) % 60)).padStart(2, '0')}</p>
          <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => running ? void pause() : void resume()} disabled={busy || completed === STEPS.length}>{running ? <Pause /> : <Play />}{running ? 'Pause' : 'Resume'}</Button><Button variant="secondary" onClick={finish} disabled={busy}><Square />{busy ? 'Saving...' : 'Finish & save'}</Button></div>
        </div>
        <div className="flex justify-between items-center gap-2 text-sm"><h3 className="font-display text-xl">Runners</h3><span className="text-muted-foreground">{pendingCount ? `${pendingCount} waiting to save` : 'All recorded results saved'}</span></div>
        <div className="grid sm:grid-cols-2 gap-2">{run.players.map(p => {
          const result = run.scores[p.id];
          return <div key={p.id} className="flex gap-1 min-w-0">
            <Button className="flex-1 h-auto min-h-16 justify-between whitespace-normal text-left px-4" variant={result === undefined ? 'outline' : 'secondary'} disabled={result !== undefined || busy || (!running && elapsed === 0)} onClick={() => record(p.id)}><span className="break-words">{p.child_name}</span>{result === undefined ? <span className="text-xs text-muted-foreground shrink-0">Running</span> : <span className="flex items-center gap-1 text-primary shrink-0"><Check />{score(result)}</span>}</Button>
            {result !== undefined && <Button className="h-auto min-h-16" variant="ghost" size="icon" title={`Undo result for ${p.child_name}`} aria-label={`Undo result for ${p.child_name}`} disabled={busy} onClick={() => record(p.id, true)}><Undo2 /></Button>}
          </div>;
        })}</div>
      </>}
    </>}
    {view === 'progress' && <div className="space-y-6">
      {!roster.length && <p className="text-muted-foreground">No linked players found for this team.</p>}
      {roster.map(p => {
        const entries = history.filter(h => h.player_id === p.id && h.fitness_sessions?.status === 'completed').sort((a,b) => (a.fitness_sessions?.started_at ?? '').localeCompare(b.fitness_sessions?.started_at ?? ''));
        const latest = entries.at(-1); const previous = entries.at(-2);
        const difference = latest && previous ? latest.completed_shuttles - previous.completed_shuttles : null;
        const chart = entries.map((h, i) => ({ test: i + 1, shuttles: h.completed_shuttles, date: new Date(h.fitness_sessions?.started_at ?? '').toLocaleDateString('en-GB'), result: score(h.completed_shuttles) }));
        return <article key={p.id} className="border-b border-border pb-6 space-y-3">
          <div className="flex justify-between items-start gap-3"><h3 className="font-display text-xl break-words">{p.child_name}</h3>{latest && <div className="text-right shrink-0"><strong className="font-display text-2xl text-primary">{score(latest.completed_shuttles)}</strong><p className="text-xs text-muted-foreground">{difference === null ? 'First test' : difference === 0 ? 'Same as last test' : `${difference > 0 ? '+' : ''}${difference} shuttles since last test`}</p></div>}</div>
          {!entries.length ? <p className="text-sm text-muted-foreground">No completed tests yet.</p> : <>
            {entries.length > 1 && <div className="h-40 w-full text-primary"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><XAxis dataKey="test" stroke="currentColor" fontSize={11} tickLine={false} /><YAxis stroke="currentColor" width={32} fontSize={11} allowDecimals={false} /><Tooltip content={({ active, payload }) => { const data = payload?.[0]?.payload; return active && data ? <div className="bg-popover text-popover-foreground border border-border rounded-md p-2 text-sm">{data.date}: {data.result} ({data.shuttles} shuttles)</div> : null; }} /><Line dataKey="shuttles" stroke="currentColor" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-muted-foreground"><tr><th className="text-left py-2 font-normal">Date</th><th className="text-right font-normal">Level.Shuttle</th><th className="text-right font-normal">Distance</th></tr></thead><tbody>{[...entries].reverse().map(h => <tr key={h.session_id} className="border-t border-border"><td className="py-2">{new Date(h.fitness_sessions?.started_at ?? '').toLocaleDateString('en-GB')}</td><td className="text-right text-primary">{score(h.completed_shuttles)}</td><td className="text-right">{h.completed_shuttles * 20}m</td></tr>)}</tbody></table></div>
          </>}
        </article>;
      })}
    </div>}
  </section>;
}

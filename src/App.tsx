import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Activity, BookOpen, CalendarDays, Check, ChevronLeft,
  ChevronRight, Dumbbell, Flag, Flame, Leaf, Music2, RotateCcw, ShieldCheck,
  Sparkles, Target, TrendingUp, Waves, Weight
} from "lucide-react";

type Tab = "dashboard" | "manifesto" | "daily" | "weekly" | "music" | "months";
type Habit = { id: string; group: string; title: string; criterion: string };
type DailyRecord = Record<string, Record<string, boolean>>;
type MonthlyTask = { id: string; label: string; done: boolean; detail?: string };
type Track = { id: number; title: string; status: string; notes: string };
type DailyWeights = Record<string, string>;
type DailyBodyFat = Record<string, string>;
const trackStatuses = ["Idea", "Composición", "Estructura", "Producción", "Producción avanzada", "Mezcla", "Master", "Finalizado"];
const ALBUM_TRACK_COUNT = 7;
function defaultTracks(count = 0): Track[] {
  return Array.from({ length: ALBUM_TRACK_COUNT }, (_, i) => ({ id: i + 1, title: `Tema ${String(i + 1).padStart(2, "0")}`, status: i < count ? "Producción avanzada" : "Idea", notes: "" }));
}
function loadTracks(): Track[] {
  // Migrate existing v0.3/v0.4 tracklists without touching the other local records.
  const saved = storage.read<Track[] | null>("wa-album-project-v1", null);
  if (Array.isArray(saved) && saved.length) {
    return saved.slice(0, ALBUM_TRACK_COUNT).map((track, index) => ({ ...track, id: index + 1 }));
  }
  return defaultTracks(storage.read("wa-album-tracks-v1", 0));
}
function loadMonthly(): Record<string, MonthlyTask[]> {
  const saved = storage.read<Record<string, MonthlyTask[]>>("wa-monthly-v1", monthTasks);
  // Update the existing December milestone label while preserving its checked state.
  if (saved["2026-12"]) {
    saved["2026-12"] = saved["2026-12"].map(task => task.id === "album"
      ? { ...task, label: "Hito musical: álbum de 7 temas finalizado" }
      : task);
  }
  return saved;
}

const START = "2026-10-13";
const END = "2026-12-31";
const habits: Habit[] = [
  { id: "digital", group: "MAÑANA", title: "Soberanía digital", criterion: "Cero móvil al despertar + 5–10 min de movilidad suave." },
  { id: "nutrition", group: "NUTRICIÓN", title: "Déficit limpio", criterion: "≈ 2.000 kcal · proteína ≥150 g · grasas totales <40 g." },
  { id: "biology", group: "BIOLOGÍA", title: "Softmaxxing", criterion: "Rutina personal de mañana completada." },
  { id: "movement", group: "MOVIMIENTO", title: "Paso y carga", criterion: "≥10.000 pasos + sesión programada (PPL o deporte)." },
  { id: "music", group: "MÚSICA", title: "Deep work", criterion: "60–90 min de composición o producción concentrada." },
  { id: "reading", group: "LECTURA", title: "Mente", criterion: "15–20 páginas de lectura sin pantallas." },
  { id: "night", group: "NOCHE", title: "Cierre circadiano", criterion: "Rutina nocturna y 5–10 min de estiramientos." }
];

const monthTasks: Record<string, MonthlyTask[]> = {
  "2026-10": [
    { id: "book", label: "Cerrar los libros que están a medias", done: false },
    { id: "nature", label: "Excursión / naturaleza", done: false, detail: "Plan y fecha" },
    { id: "culture", label: "Plan cultural potente", done: false, detail: "Cine, concierto o exposición" },
    { id: "social1", label: "Plan social consciente 1", done: false },
    { id: "social2", label: "Plan social consciente 2", done: false },
    { id: "social3", label: "Plan social consciente 3", done: false }
  ],
  "2026-11": [
    { id: "book", label: "Libro del mes", done: false, detail: "Título" },
    { id: "nature", label: "Excursión / naturaleza", done: false, detail: "Plan y fecha" },
    { id: "culture", label: "Plan cultural potente", done: false, detail: "Cine, concierto o exposición" },
    { id: "social1", label: "Plan social consciente 1", done: false },
    { id: "social2", label: "Plan social consciente 2", done: false },
    { id: "social3", label: "Plan social consciente 3", done: false },
    { id: "music", label: "Hito musical: 6–7 temas en producción avanzada", done: false }
  ],
  "2026-12": [
    { id: "book", label: "Libro del mes", done: false, detail: "Título" },
    { id: "nature", label: "Excursión / naturaleza", done: false, detail: "Plan y fecha" },
    { id: "culture", label: "Plan cultural potente", done: false, detail: "Cine, concierto o exposición" },
    { id: "social1", label: "Plan social consciente 1", done: false },
    { id: "social2", label: "Plan social consciente 2", done: false },
    { id: "social3", label: "Plan social consciente 3", done: false },
    { id: "physical", label: "Hito físico final: revisar peso y composición corporal", done: false },
    { id: "album", label: "Hito musical: álbum de 7 temas finalizado", done: false }
  ]
};
const monthNames: Record<string, string> = { "2026-10": "Octubre", "2026-11": "Noviembre", "2026-12": "Diciembre" };
const storage = {
  read<T>(key: string, fallback: T): T {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
    catch { return fallback; }
  },
  write(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
};
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
function shiftDate(date: string, delta: number) {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function initialCampaignDate() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today < START ? START : today > END ? END : today;
}
function daysBetween(a: string, b: string) {
  return Math.floor((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}
function getWeek(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = shiftDate(date, mondayOffset);
  const sunday = shiftDate(monday, 6);
  return { start: monday < START ? START : monday, end: sunday > END ? END : sunday };
}

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedDate, setSelectedDate] = useState(() => initialCampaignDate());
  const [daily, setDaily] = useState<DailyRecord>(() => storage.read("wa-daily-v1", {}));
  const [dailyWeights, setDailyWeights] = useState<DailyWeights>(() => storage.read("wa-daily-weight-v1", {}));
  const [dailyBodyFat, setDailyBodyFat] = useState<DailyBodyFat>(() => storage.read("wa-daily-bodyfat-v1", {}));
  const [monthly, setMonthly] = useState<Record<string, MonthlyTask[]>>(loadMonthly);
  const [weekly, setWeekly] = useState<Record<string, Record<string, string>>>(() => storage.read("wa-weekly-v1", {}));
  const [month, setMonth] = useState("2026-10");
  const [weight, setWeight] = useState("82.8");
  const [bodyFat, setBodyFat] = useState("23.7");
  const [albumTracks, setAlbumTracks] = useState<number>(() => storage.read("wa-album-tracks-v1", 0));
  const [tracks, setTracks] = useState<Track[]>(loadTracks);

  useEffect(() => storage.write("wa-daily-v1", daily), [daily]);
  useEffect(() => storage.write("wa-daily-weight-v1", dailyWeights), [dailyWeights]);
  useEffect(() => storage.write("wa-daily-bodyfat-v1", dailyBodyFat), [dailyBodyFat]);
  useEffect(() => storage.write("wa-monthly-v1", monthly), [monthly]);
  useEffect(() => storage.write("wa-weekly-v1", weekly), [weekly]);
  useEffect(() => storage.write("wa-album-tracks-v1", albumTracks), [albumTracks]);
  useEffect(() => storage.write("wa-album-project-v1", tracks), [tracks]);
  useEffect(() => {
    const count = tracks.filter(t => ["Producción avanzada", "Mezcla", "Master", "Finalizado"].includes(t.status)).length;
    if (count !== albumTracks) setAlbumTracks(count);
  }, [tracks]);
  const advancedTracks = tracks.filter(t => ["Producción avanzada", "Mezcla", "Master", "Finalizado"].includes(t.status)).length;
  const finishedTracks = tracks.filter(t => t.status === "Finalizado").length;
  const albumProgress = Math.round(tracks.reduce((sum, t) => sum + (Math.max(0, trackStatuses.indexOf(t.status)) / (trackStatuses.length - 1)) * 100, 0) / tracks.length);

  const todayChecks = daily[selectedDate] ?? {};
  const checkedCount = habits.filter(h => todayChecks[h.id]).length;
  const campaignDay = Math.max(1, Math.min(80, daysBetween(START, selectedDate) + 1));
  const elapsedDays = Math.max(1, Math.min(80, daysBetween(START, selectedDate) + 1));
  const dashboardDays = useMemo(() => {
    const count = Math.min(7, elapsedDays);
    return Array.from({ length: count }, (_, i) => {
      const date = shiftDate(selectedDate, -(count - 1 - i));
      const done = habits.filter(h => daily[date]?.[h.id]).length;
      return { date, done, pct: Math.round(done / habits.length * 100), label: new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "") };
    });
  }, [daily, selectedDate, elapsedDays]);
  const weekAverage = Math.round(dashboardDays.reduce((sum, d) => sum + d.pct, 0) / Math.max(1, dashboardDays.length));
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < elapsedDays; i++) {
      const date = shiftDate(selectedDate, -i);
      if (habits.every(h => daily[date]?.[h.id])) count++;
      else break;
    }
    return count;
  }, [daily, selectedDate, elapsedDays]);
  const weightPoints = useMemo(() => {
    // Preserve historical weekly measurements; daily entries take precedence on matching dates.
    const byDate = new Map<string, number>();
    Object.entries(weekly).forEach(([key, data]) => {
      const date = key.split("_")[0];
      const value = Number(String(data.weight ?? "").replace(",", "."));
      if (date <= selectedDate && Number.isFinite(value) && value > 0) byDate.set(date, value);
    });
    Object.entries(dailyWeights).forEach(([date, raw]) => {
      const value = Number(String(raw).replace(",", "."));
      if (date <= selectedDate && Number.isFinite(value) && value > 0) byDate.set(date, value);
    });
    return [...byDate.entries()].map(([date, weight]) => ({ date, weight })).sort((a, b) => a.date.localeCompare(b.date));
  }, [weekly, dailyWeights, selectedDate]);
  const recentWeights = weightPoints.filter(p => daysBetween(p.date, selectedDate) >= 0 && daysBetween(p.date, selectedDate) <= 6);
  const movingAverage7 = recentWeights.length ? recentWeights.reduce((sum, p) => sum + p.weight, 0) / recentWeights.length : null;
  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1] : null;
  const baselineWeight = 82.8;
  const goalWeight = 76.5;
  const weightChange = latestWeight ? latestWeight.weight - baselineWeight : null;
  const goalProgress = latestWeight ? Math.max(0, Math.min(100, ((baselineWeight - latestWeight.weight) / (baselineWeight - goalWeight)) * 100)) : 0;
  const bodyFatPoints = Object.entries(dailyBodyFat)
    .filter(([date, raw]) => date <= selectedDate && Number.isFinite(Number(String(raw).replace(",", "."))) && Number(String(raw).replace(",", ".")) > 0 && Number(String(raw).replace(",", ".")) < 100)
    .map(([date, raw]) => ({ date, value: Number(String(raw).replace(",", ".")) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestBodyFat = bodyFatPoints.length ? bodyFatPoints[bodyFatPoints.length - 1] : null;
  const monthDone = (monthly[month] ?? []).filter(t => t.done).length;
  const monthTotal = (monthly[month] ?? []).length;
  const week = getWeek(selectedDate);
  const weekKey = `${week.start}_${week.end}`;
  const weekData = weekly[weekKey] ?? {};

  function toggleHabit(id: string) {
    setDaily(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] ?? {}), [id]: !(prev[selectedDate]?.[id]) } }));
  }
  function updateWeekly(key: string, value: string) {
    setWeekly(prev => ({ ...prev, [weekKey]: { ...(prev[weekKey] ?? {}), [key]: value } }));
  }
  function toggleMonthTask(id: string) {
    setMonthly(prev => ({ ...prev, [month]: (prev[month] ?? []).map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  }
  function editMonthTask(id: string, label: string) {
    setMonthly(prev => ({ ...prev, [month]: (prev[month] ?? []).map(t => t.id === id ? { ...t, label } : t) }));
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ daily, dailyWeights, dailyBodyFat, monthly, weekly, albumTracks, tracks, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "winter-arc-backup.json"; a.click(); URL.revokeObjectURL(url);
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      const merge = <T extends Record<string, unknown>>(current: T, incoming: unknown): T => {
        if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return current;
        return { ...current, ...(incoming as Record<string, unknown>) } as T;
      };
      if (data.daily) setDaily(prev => merge(prev as Record<string, unknown>, data.daily) as DailyRecord);
      if (data.dailyWeights) setDailyWeights(prev => merge(prev as Record<string, unknown>, data.dailyWeights) as DailyWeights);
      if (data.dailyBodyFat) setDailyBodyFat(prev => merge(prev as Record<string, unknown>, data.dailyBodyFat) as DailyBodyFat);
      if (data.weekly) setWeekly(prev => merge(prev as Record<string, unknown>, data.weekly) as Record<string, Record<string, string>>);
      if (data.monthly && typeof data.monthly === "object") {
        const incoming = data.monthly as Record<string, MonthlyTask[]>;
        setMonthly(prev => ({ ...prev, ...incoming }));
      }
      if (Array.isArray(data.tracks)) setTracks(data.tracks.slice(0, ALBUM_TRACK_COUNT) as Track[]);
      else if (typeof data.albumTracks === "number") setAlbumTracks(Math.max(0, Math.min(ALBUM_TRACK_COUNT, data.albumTracks)));
      alert("Copia importada. Los registros del archivo se han combinado con los datos locales.");
    } catch {
      alert("No se ha podido importar el archivo. Selecciona una copia JSON exportada desde Winter Arc.");
    }
  }
  function resetData() {
    if (!confirm("¿Borrar todos los registros locales de Winter Arc? Esta acción no se puede deshacer.")) return;
    setDaily({}); setDailyWeights({}); setDailyBodyFat({}); setMonthly(monthTasks); setWeekly({}); setAlbumTracks(0); setTracks(defaultTracks());
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">WA</div><div><div className="brand-name">WINTER ARC</div><div className="brand-sub">PERSONAL OS · 2026</div></div></div>
      <div className="side-label">TU CUADERNO</div>
      <NavButton active={tab === "dashboard"} icon={<Activity size={17}/>} label="Dashboard" onClick={() => setTab("dashboard")} />
      <NavButton active={tab === "manifesto"} icon={<Flag size={17}/>} label="Manifiesto" onClick={() => setTab("manifesto")} />
      <NavButton active={tab === "daily"} icon={<Check size={17}/>} label="Ritual diario" onClick={() => setTab("daily")} />
      <NavButton active={tab === "weekly"} icon={<TrendingUp size={17}/>} label="Auditoría semanal" onClick={() => setTab("weekly")} />
      <NavButton active={tab === "months"} icon={<CalendarDays size={17}/>} label="Retos mensuales" onClick={() => setTab("months")} />
      <NavButton active={tab === "music"} icon={<Music2 size={17}/>} label="Estudio musical" onClick={() => setTab("music")} />
      <div className="sidebar-bottom">
        <div className="side-progress"><span>CAMPAÑA</span><b>DÍA {campaignDay} / 80</b><div className="progress-track"><div style={{ width: `${campaignDay / 80 * 100}%` }}/></div></div>
        <button className="text-button" onClick={exportData}>Exportar copia JSON ↗</button>
        <label className="text-button import-button">Importar copia JSON ↥<input type="file" accept="application/json,.json" onChange={e => { void importData(e.target.files?.[0]); e.currentTarget.value = ""; }}/></label>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="mobile-brand"><span className="brand-mark">WA</span><span>WINTER ARC</span></div>
        <div className="topbar-meta"><span className="live-dot"/> <span>13 OCT — 31 DIC 2026</span><span className="topbar-sep">/</span><span>80 DÍAS DE EJECUCIÓN</span></div>
        <button className="icon-button reset-button" title="Restablecer datos" onClick={resetData}><RotateCcw size={16}/></button>
      </header>

      {tab === "dashboard" && <section className="page dashboard-page">
        <div className="eyebrow"><span>00 / CENTRO DE MANDO</span><span>WINTER ARC · 2026</span></div>
        <div className="dashboard-welcome">
          <div><span className="hero-kicker">13 OCTUBRE — 31 DICIEMBRE</span><h1>La intención se mide<br/><em>en acciones.</em></h1><p>Tu campaña, de un vistazo. Elige la siguiente acción y vuelve al trabajo.</p></div>
          <div className="dashboard-day"><span>DÍA DE CAMPAÑA</span><strong>{String(campaignDay).padStart(2, "0")}<small> / 80</small></strong><div className="progress-track"><div style={{width: `${campaignDay / 80 * 100}%`}}/></div><span>{Math.round(campaignDay / 80 * 100)}% DEL RECORRIDO</span></div>
        </div>
        <div className="dashboard-kpis">
          <Kpi icon={<Check size={17}/>} label="HOY" value={`${checkedCount}/7`} note={`${Math.round(checkedCount / habits.length * 100)}% de hábitos`} accent="amber"/>
          <Kpi icon={<Activity size={17}/>} label="MEDIA · 7 DÍAS" value={`${weekAverage}%`} note="Cumplimiento diario" accent="sage"/>
          <Kpi icon={<Flame size={17}/>} label="RACHA PERFECTA" value={`${streak}`} note={streak === 1 ? "día consecutivo" : "días consecutivos"} accent="rust"/>
          <Kpi icon={<Music2 size={17}/>} label="ÁLBUM" value={`${advancedTracks}/${ALBUM_TRACK_COUNT}`} note={`${finishedTracks} finalizados`} accent="blue"/>
        </div>
        <div className="dashboard-grid">
          <section className="chart-card">
            <div className="chart-card-head"><div><span className="eyebrow">CONSTANCIA</span><h2>Últimos días</h2></div><span className="chart-legend"><i/> Hábitos completados</span></div>
            <div className="bar-chart" role="img" aria-label="Porcentaje de hábitos completados en los últimos días">
              {dashboardDays.map(d => <div className="bar-column" key={d.date} title={`${d.date}: ${d.pct}%`}>
                <span className="bar-value">{d.pct}%</span><div className="bar-track"><div className="bar-fill" style={{height: `${d.pct}%`}}/></div><span className="bar-label">{d.label}</span>
              </div>)}
            </div>
            <div className="chart-footnote"><span>{dashboardDays.length} días del periodo</span><b>{weekAverage}% de media</b></div>
          </section>
          <section className="chart-card weight-card">
            <div className="chart-card-head"><div><span className="eyebrow">COMPOSICIÓN CORPORAL</span><h2>Evolución del peso</h2></div><Weight size={18}/></div>
            {weightPoints.length >= 2 ? <WeightChart points={weightPoints}/> : <div className="chart-empty"><div className="empty-icon"><TrendingUp size={21}/></div><b>Tu tendencia empieza aquí</b><p>Registra tu peso desde el ritual diario. Con dos o más registros verás la tendencia.</p><button className="inline-action" onClick={() => setTab("daily")}>Registrar peso <ArrowRight size={14}/></button></div>}
            {weightPoints.length === 1 && <div className="single-weight"><b>{weightPoints[0].weight.toLocaleString("es-ES")} kg</b><span>Primer registro · añade otra medición para ver la tendencia.</span></div>}
            <div className="body-metrics-strip">
              <div><span>MEDIA MÓVIL · 7 DÍAS</span><b>{movingAverage7 !== null ? `${movingAverage7.toLocaleString("es-ES", { maximumFractionDigits: 1 })} kg` : "—"}</b><small>{recentWeights.length ? `${recentWeights.length} medición(es) en la ventana` : "Registra tu peso para calcularla"}</small></div>
              <div><span>CAMBIO DESDE 82,8 KG</span><b>{weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toLocaleString("es-ES", { maximumFractionDigits: 1 })} kg` : "—"}</b><small>{weightChange !== null ? `${Math.round(goalProgress)}% del recorrido hacia 76,5 kg` : "Punto de partida"}</small></div>
              <div><span>GRASA CORPORAL</span><b>{latestBodyFat ? `${latestBodyFat.value.toLocaleString("es-ES", { maximumFractionDigits: 1 })}%` : "—"}</b><small>{latestBodyFat ? `Último dato · ${latestBodyFat.date.slice(5).replace("-", "/")}` : "Registro opcional diario"}</small></div>
            </div>
          </section>
        </div>
        <div className="dashboard-bottom-grid">
          <section className="dashboard-panel">
            <div className="chart-card-head"><div><span className="eyebrow">SIGUIENTE ACCIÓN</span><h2>Ritual de hoy</h2></div><button className="inline-action" onClick={() => setTab("daily")}>Abrir checklist <ArrowRight size={14}/></button></div>
            <div className="mini-habits">{habits.map(h => <button key={h.id} className="mini-habit" onClick={() => { setTab("daily"); }}><span className={`mini-check ${todayChecks[h.id] ? "done" : ""}`}>{todayChecks[h.id] && <Check size={12}/>}</span><span>{h.title}</span><small>{todayChecks[h.id] ? "HECHO" : "PENDIENTE"}</small></button>)}</div>
          </section>
          <section className="dashboard-panel">
            <div className="chart-card-head"><div><span className="eyebrow">OBJETIVOS DEL MES</span><h2>{monthNames[month]}</h2></div><button className="inline-action" onClick={() => setTab("months")}>Ver retos <ArrowRight size={14}/></button></div>
            <div className="monthly-progress-large"><div><strong>{monthDone}<small> / {monthTotal}</small></strong><span>RETOS COMPLETADOS</span></div><div className="progress-track"><div style={{width: `${monthTotal ? monthDone / monthTotal * 100 : 0}%`}}/></div></div>
            {(monthly[month] ?? []).filter(t => !t.done).slice(0, 3).map(t => <div className="upcoming-task" key={t.id}><span className="task-bullet"/><span>{t.label}</span></div>)}
            {monthDone === monthTotal && <p className="all-done"><Check size={14}/> Has completado todos los retos de este mes.</p>}
          </section>
        </div>
        <div className="dashboard-note"><Sparkles size={16}/><span>La consistencia es la estrategia.</span><b>UN DÍA CADA VEZ.</b></div>
        <section className="backup-panel">
          <div><span className="eyebrow">TUS DATOS · SOLO EN ESTE DISPOSITIVO</span><h2>Copia de seguridad</h2><p>Exporta una copia periódica o importa un archivo para trasladar tus registros al iPhone.</p></div>
          <div className="backup-actions">
            <button className="secondary-button" onClick={exportData}>Exportar JSON ↗</button>
            <label className="secondary-button import-button">Importar JSON ↥<input type="file" accept="application/json,.json" onChange={e => { void importData(e.target.files?.[0]); e.currentTarget.value = ""; }}/></label>
          </div>
        </section>
      </section>}

      {tab === "music" && <section className="page music-page">
        <div className="eyebrow"><span>05 / ESTUDIO MUSICAL</span><span>ÁLBUM · 7 TEMAS</span></div>
        <div className="page-title-row"><div><h1>Haz que <em>suene.</em></h1><p className="muted">Del primer boceto al master final. Cada tema, con su siguiente paso.</p></div><div className="month-progress"><b>{finishedTracks}<small> / {ALBUM_TRACK_COUNT}</small></b><span>TEMAS FINALIZADOS</span></div></div>
        <div className="album-overview">
          <div className="album-disc"><div className="disc-center"><Music2 size={24}/></div></div>
          <div className="album-overview-copy"><span className="hero-kicker">PROYECTO · WINTER ARC</span><h2>El álbum de siete.</h2><p>Avance medio por etapa: <strong>{albumProgress}%</strong></p><div className="progress-track album-progress"><div style={{width: `${albumProgress}%`}}/></div><div className="album-mini-stats"><span><b>{advancedTracks}</b> en fase avanzada</span><span><b>{finishedTracks}</b> finalizados</span></div></div>
        </div>
        <div className="tracklist-header"><div><span className="eyebrow">TRACKLIST</span><h2>Siete piezas. Un proyecto.</h2></div><span className="muted small">LOS CAMBIOS SE GUARDAN AUTOMÁTICAMENTE</span></div>
        <div className="track-list">{tracks.map((track, i) => <article className="track-card" key={track.id}>
          <div className="track-number">{String(track.id).padStart(2,"0")}</div>
          <div className="track-main">
            <input className="track-title-input" value={track.title} aria-label={`Título del tema ${track.id}`} onChange={e => setTracks(prev => prev.map(t => t.id === track.id ? {...t, title: e.target.value} : t))}/>
            <div className="track-stage"><span>ETAPA</span><select value={track.status} onChange={e => setTracks(prev => prev.map(t => t.id === track.id ? {...t, status: e.target.value} : t))}>{trackStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
            <textarea value={track.notes} rows={2} placeholder="Notas, referencias o siguiente acción..." aria-label={`Notas del tema ${track.id}`} onChange={e => setTracks(prev => prev.map(t => t.id === track.id ? {...t, notes: e.target.value} : t))}/>
          </div>
          <div className={`track-progress-ring stage-${trackStatuses.indexOf(track.status)}`}><span>{Math.round(trackStatuses.indexOf(track.status)/(trackStatuses.length-1)*100)}%</span></div>
        </article>)}</div>
        <div className="music-tip"><Sparkles size={16}/><span>Consejo de producción: cada sesión debería dejar un siguiente paso claro para volver a entrar rápido al proyecto.</span></div>
      </section>}

      {tab === "manifesto" && <section className="page">
        <div className="eyebrow"><span>01 / DECLARACIÓN DE INTENCIONES</span><span>WINTER ARC 2026</span></div>
        <div className="manifesto-hero">
          <div className="hero-kicker">13 OCTUBRE — 31 DICIEMBRE</div>
          <h1>CONSTRUYE.<br/><em>NO NEGOCIES.</em></h1>
          <p className="hero-copy">Ochenta días para elevar el estándar. Menos ruido, más intención. Un sistema que convierte las promesas en evidencia.</p>
          <div className="hero-stats">
            <div><span>CAMPAÑA</span><strong>80 <small>DÍAS</small></strong></div>
            <div><span>HÁBITOS</span><strong>07 <small>DIARIOS</small></strong></div>
            <div><span>OBJETIVO</span><strong>07 <small>TEMAS</small></strong></div>
          </div>
        </div>
        <div className="section-heading"><div><span className="eyebrow">LOS CUATRO PILARES</span><h2>Objetivos clave</h2></div><span className="muted small">01 — 04</span></div>
        <div className="pillar-grid">
          <Pillar icon={<Dumbbell/>} number="01" title="Composición corporal" color="sage">
            <div className="metric-pair"><div><span>PUNTO DE PARTIDA</span><b>82,8 <small>kg</small></b><p>23,7% grasa corporal</p></div><div><span>META · 31 DIC</span><b>76–77 <small>kg</small></b><p>Priorizar fuerza y masa muscular</p></div></div>
            <p className="pillar-rule">REGLA DE HIERRO · Sostener las cargas y proteger la masa muscular.</p>
          </Pillar>
          <Pillar icon={<Music2/>} number="02" title="Música & foco" color="amber">
            <div className="big-metric">07 <span>TEMAS</span></div><p>Componer, maquetar y cerrar el álbum antes de terminar el año.</p>
            <button className="inline-action manifesto-music-link" onClick={() => setTab("music")}>Abrir tracklist <ArrowRight size={14}/></button>
          </Pillar>
          <Pillar icon={<BookOpen/>} number="03" title="Mente & cultura" color="blue">
            <ul className="clean-list"><li>Terminar lecturas pendientes en octubre.</li><li>Un libro nuevo en noviembre y diciembre.</li><li>Un plan cultural potente al mes.</li><li>Una ruta en naturaleza al mes.</li></ul>
          </Pillar>
          <Pillar icon={<ShieldCheck/>} number="04" title="Blindaje biológico" color="rust">
            <ul className="clean-list"><li>Evitar aceites de semillas y grasas procesadas según tu plan nutricional.</li><li>Proteger la higiene circadiana.</li><li>Mantener una rutina capilar activa.</li></ul>
          </Pillar>
        </div>
        <div className="closing-line"><Sparkles size={17}/><span>LA CONSISTENCIA ES LA ESTRATEGIA.</span><span className="closing-right">UN DÍA CADA VEZ.</span></div>
      </section>}

      {tab === "daily" && <section className="page">
        <div className="eyebrow"><span>02 / PROTOCOLO DIARIO</span><span>CHECKLIST NOCTURNO</span></div>
        <div className="page-title-row"><div><h1>Ritual <em>diario.</em></h1><p className="muted">Cierra el día. Registra la evidencia. Vuelve mañana.</p></div><div className="day-count"><span>DÍA DE CAMPAÑA</span><b>{String(campaignDay).padStart(2, "0")}<small> / 80</small></b></div></div>
        <div className="date-navigator">
          <button className="icon-button" aria-label="Día anterior" onClick={() => setSelectedDate(d => shiftDate(d, -1))}><ChevronLeft/></button>
          <div className="date-center"><CalendarDays size={17}/><div><b>{dateLabel(selectedDate)}</b><span>{selectedDate < START || selectedDate > END ? "FUERA DEL PERIODO OFICIAL" : "REGISTRO DE CAMPAÑA"}</span></div></div>
          <button className="icon-button" aria-label="Día siguiente" onClick={() => setSelectedDate(d => shiftDate(d, 1))}><ChevronRight/></button>
          <input aria-label="Seleccionar fecha" className="date-input" type="date" min={START} max={END} value={selectedDate} onChange={e => e.target.value && setSelectedDate(e.target.value)}/>
        </div>
        <div className="daily-summary">
          <div><span>HÁBITOS COMPLETADOS</span><strong>{checkedCount}<small> / {habits.length}</small></strong></div>
          <div className="summary-bar"><div style={{ width: `${checkedCount / habits.length * 100}%` }}/></div>
          <b className="summary-percent">{Math.round(checkedCount / habits.length * 100)}%</b>
        </div>
        <section className="daily-weight-card">
          <div className="daily-weight-copy">
            <span className="eyebrow">REGISTRO CORPORAL</span>
            <h2>Peso de hoy</h2>
            <p>Si te pesas, registra el dato en condiciones similares. La tendencia importa más que una medición aislada.</p>
          </div>
          <label className="daily-weight-input">
            <span>KG</span>
            <input
              type="number"
              inputMode="decimal"
              min="30"
              max="300"
              step="0.1"
              placeholder="82,8"
              value={dailyWeights[selectedDate] ?? ""}
              onChange={e => setDailyWeights(prev => {
                const next = { ...prev };
                if (e.target.value.trim() === "") delete next[selectedDate];
                else next[selectedDate] = e.target.value;
                return next;
              })}
              aria-label={`Peso en kg para ${selectedDate}`}
            />
          </label>
          <label className="daily-weight-input bodyfat-input">
            <span>% GRASA</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="70"
              step="0.1"
              placeholder="23,7"
              value={dailyBodyFat[selectedDate] ?? ""}
              onChange={e => setDailyBodyFat(prev => {
                const next = { ...prev };
                if (e.target.value.trim() === "") delete next[selectedDate];
                else next[selectedDate] = e.target.value;
                return next;
              })}
              aria-label={`Porcentaje de grasa corporal para ${selectedDate}`}
            />
          </label>
        </section>
        <div className="habit-list">
          {habits.map((habit, i) => <button key={habit.id} className={`habit-card ${todayChecks[habit.id] ? "is-checked" : ""}`} onClick={() => toggleHabit(habit.id)}>
            <span className={`habit-check ${todayChecks[habit.id] ? "checked" : ""}`}>{todayChecks[habit.id] && <Check size={17}/>}</span>
            <span className="habit-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="habit-content"><span className="habit-group">{habit.group}</span><b>{habit.title}</b><span className="habit-criterion">{habit.criterion}</span></span>
            <span className="habit-status">{todayChecks[habit.id] ? "COMPLETADO" : "MARCAR"}</span>
          </button>)}
        </div>
        <div className="daily-footer"><span><Waves size={16}/> No busques un día perfecto. Busca un día consciente.</span><button className="secondary-button" onClick={() => setSelectedDate(START)}>Volver al inicio <ArrowLeft size={14}/></button></div>
      </section>}

      {tab === "weekly" && <section className="page">
        <div className="eyebrow"><span>03 / AUDITORÍA SEMANAL</span><span>REVISIÓN DEL DOMINGO</span></div>
        <div className="page-title-row"><div><h1>Revisa. <em>Ajusta.</em></h1><p className="muted">Mide tendencias, no un único día.</p></div><div className="week-tag">SEMANA ACTUAL<br/><b>{week.start} → {week.end}</b></div></div>
        <div className="date-navigator compact"><button className="icon-button" onClick={() => setSelectedDate(d => shiftDate(d, -7))}><ChevronLeft/></button><div className="date-center"><CalendarDays size={17}/><div><b>{week.start} — {week.end}</b><span>PERIODO DE AUDITORÍA</span></div></div><button className="icon-button" onClick={() => setSelectedDate(d => shiftDate(d, 7))}><ChevronRight/></button></div>
        <div className="form-grid">
          <Field label="Peso medio semanal (kg)" value={weekData.weight ?? ""} onChange={v => updateWeekly("weight", v)} placeholder="Ej. 81,9" />
          <Field label="Cambio vs. semana anterior (kg)" value={weekData.delta ?? ""} onChange={v => updateWeekly("delta", v)} placeholder="Ej. −0,4" />
          <Field label="HRV medio (ms)" value={weekData.hrv ?? ""} onChange={v => updateWeekly("hrv", v)} placeholder="Ej. 58" />
          <Field label="FC reposo media (bpm)" value={weekData.rhr ?? ""} onChange={v => updateWeekly("rhr", v)} placeholder="Ej. 54" />
        </div>
        <div className="review-card"><h3><Dumbbell size={17}/> Rendimiento en el gimnasio</h3>
          <Choice label="Press banca / incline machine" value={weekData.press ?? ""} options={["Cargas mantenidas", "No mantenidas", "No evaluado"]} onChange={v => updateWeekly("press", v)}/>
          <Choice label="Remo / tracciones" value={weekData.row ?? ""} options={["Cargas mantenidas", "No mantenidas", "No evaluado"]} onChange={v => updateWeekly("row", v)}/>
          <Choice label="Inserción del bíceps" value={weekData.biceps ?? ""} options={["Sin molestias", "Molestia leve", "Molestia importante"]} onChange={v => updateWeekly("biceps", v)}/>
        </div>
        <div className="review-card"><h3><Music2 size={17}/> Avance musical</h3>
          <Field label="Temas trabajados esta semana" value={weekData.tracks ?? ""} onChange={v => updateWeekly("tracks", v)} placeholder="Ej. 01, 03, 07" />
          <Field label="Estado del proyecto" value={weekData.musicState ?? ""} onChange={v => updateWeekly("musicState", v)} placeholder="Maqueta / estructura / mezcla..." />
        </div>
        <div className="review-card"><h3><Target size={17}/> Ajuste táctico para la siguiente semana</h3><textarea value={weekData.adjustment ?? ""} onChange={e => updateWeekly("adjustment", e.target.value)} placeholder="¿Qué mantengo, qué cambio y cuál es la prioridad de la semana?" rows={4}/></div>
        <p className="save-note"><Check size={14}/> Los cambios se guardan automáticamente en este dispositivo.</p>
      </section>}

      {tab === "months" && <section className="page">
        <div className="eyebrow"><span>04 / RETOS MENSUALES</span><span>OBJETIVOS CON FECHA</span></div>
        <div className="page-title-row"><div><h1>El mapa <em>mensual.</em></h1><p className="muted">Una intención por mes. Un resultado que puedas señalar.</p></div><div className="month-progress"><b>{monthDone}<small> / {monthTotal}</small></b><span>RETOS COMPLETADOS</span></div></div>
        <div className="month-tabs">{Object.keys(monthNames).map(m => <button key={m} className={month === m ? "active" : ""} onClick={() => setMonth(m)}>{monthNames[m]}<span>{m === "2026-10" ? "01–31" : m === "2026-11" ? "01–30" : "01–31"}</span></button>)}</div>
        <div className="month-hero"><div className="month-symbol">{month === "2026-10" ? "01" : month === "2026-11" ? "02" : "03"}</div><div><span className="eyebrow">CAPÍTULO {month === "2026-10" ? "I" : month === "2026-11" ? "II" : "III"}</span><h2>{month === "2026-10" ? "Cierra ciclos." : month === "2026-11" ? "Gana profundidad." : "Entrega el resultado."}</h2><p>{month === "2026-10" ? "Ordena lo pendiente y prepara el terreno." : month === "2026-11" ? "Consolida el sistema y acelera la producción." : "Termina lo que empezaste. Sin dejar cabos sueltos."}</p></div></div>
        <div className="month-task-list">{(monthly[month] ?? []).map((task, i) => <div className={`month-task ${task.done ? "done" : ""}`} key={task.id}>
          <button className={`habit-check ${task.done ? "checked" : ""}`} onClick={() => toggleMonthTask(task.id)} aria-label={task.done ? "Marcar pendiente" : "Marcar completado"}>{task.done && <Check size={17}/>}</button>
          <span className="habit-index">{String(i + 1).padStart(2, "0")}</span>
          <div className="month-task-main"><input value={task.label} onChange={e => editMonthTask(task.id, e.target.value)} aria-label="Editar reto mensual"/>{task.detail && <span>{task.detail}</span>}</div>
          <span className="task-status">{task.done ? "HECHO" : "PENDIENTE"}</span>
        </div>)}</div>
        <div className="monthly-footnote"><Leaf size={17}/><span>Programa experiencias que te saquen de la rutina, no solo tareas que puedas tachar.</span></div>
      </section>}

      <footer className="app-footer"><span>WINTER ARC © 2026</span><span>HECHO CON INTENCIÓN <span className="footer-dot">●</span></span></footer>
    </main>

    <nav className="mobile-nav">
      <NavButton active={tab === "dashboard"} icon={<Activity size={18}/>} label="Inicio" onClick={() => setTab("dashboard")} />
      <NavButton active={tab === "manifesto"} icon={<Flag size={18}/>} label="Manifiesto" onClick={() => setTab("manifesto")} />
      <NavButton active={tab === "daily"} icon={<Check size={18}/>} label="Diario" onClick={() => setTab("daily")} />
      <NavButton active={tab === "weekly"} icon={<TrendingUp size={18}/>} label="Semanal" onClick={() => setTab("weekly")} />
      <NavButton active={tab === "months"} icon={<CalendarDays size={18}/>} label="Meses" onClick={() => setTab("months")} />
      <NavButton active={tab === "music"} icon={<Music2 size={18}/>} label="Música" onClick={() => setTab("music")} />
    </nav>
  </div>;
}

function Kpi({ icon, label, value, note, accent }: { icon: React.ReactNode; label: string; value: string; note: string; accent: string }) {
  return <article className={`kpi-card ${accent}`}><div className="kpi-top"><span className="kpi-icon">{icon}</span><span>{label}</span></div><strong>{value}</strong><p>{note}</p></article>;
}
function WeightChart({ points }: { points: { date: string; weight: number }[] }) {
  const width = 320, height = 150, pad = 22;
  const values = points.map(p => p.weight);
  const min = Math.min(...values) - 0.5, max = Math.max(...values) + 0.5;
  const coords = points.map((p, i) => ({ ...p, x: pad + (points.length === 1 ? 0 : i * (width - pad * 2) / (points.length - 1)), y: height - pad - ((p.weight - min) / (max - min || 1)) * (height - pad * 2) }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const last = points[points.length - 1];
  return <div className="weight-chart-wrap"><div className="weight-current"><strong>{last.weight.toLocaleString("es-ES")} <small>kg</small></strong><span>ÚLTIMO REGISTRO</span></div><svg className="weight-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfica de peso semanal"><defs><linearGradient id="weightArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d4a75d" stopOpacity=".25"/><stop offset="100%" stopColor="#d4a75d" stopOpacity="0"/></linearGradient></defs>{[0,1,2].map(i => <line key={i} x1={pad} x2={width-pad} y1={pad+i*(height-pad*2)/2} y2={pad+i*(height-pad*2)/2} stroke="#33332d" strokeDasharray="3 5"/>)}<path d={`${path} L ${coords[coords.length-1].x} ${height-pad} L ${coords[0].x} ${height-pad} Z`} fill="url(#weightArea)"/><path d={path} fill="none" stroke="#d4a75d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{coords.map((p,i)=><g key={p.date}><circle cx={p.x} cy={p.y} r="4" fill="#d4a75d" stroke="#191917" strokeWidth="2"/><text x={p.x} y={Math.max(12,p.y-10)} fill="#d9d3c8" textAnchor={i===0?"start":i===coords.length-1?"end":"middle"} fontSize="9">{p.weight.toLocaleString("es-ES")}</text></g>)}</svg><div className="weight-axis"><span>{points[0].date.slice(5).replace("-","/")}</span><span>{last.date.slice(5).replace("-","/")}</span></div></div>;
}
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}
function Pillar({ icon, number, title, color, children }: { icon: React.ReactNode; number: string; title: string; color: string; children: React.ReactNode }) {
  return <article className={`pillar-card ${color}`}><div className="pillar-head"><span className="pillar-icon">{icon}</span><span className="pillar-number">{number}</span></div><h3>{title}</h3><div className="pillar-body">{children}</div></article>;
}
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></label>;
}
function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <div className="choice-row"><span>{label}</span><div className="choice-options">{options.map(o => <button key={o} className={value === o ? "selected" : ""} onClick={() => onChange(o)}>{o}</button>)}</div></div>;
}

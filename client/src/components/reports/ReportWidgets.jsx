import { reportSelectClass } from './styles';

export function DonutChart({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const stops = [];
  let offset = 0;

  segments.forEach((segment) => {
    const start = offset;
    const end = offset + segment.percent;
    stops.push(`${segment.color} ${start}% ${end}%`);
    offset = end;
  });

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
      <div className="absolute inset-[18px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="text-4xl font-extrabold tracking-tight text-slate-950">{total}</p>
        <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Aufgaben</p>
      </div>
    </div>
  );
}

export function ReportFilterField({ label, value, onChange, children }) {
  return (
    <label className="min-w-[180px] flex-1 space-y-2">
      <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <select value={value} onChange={onChange} className={reportSelectClass}>
        {children}
      </select>
    </label>
  );
}


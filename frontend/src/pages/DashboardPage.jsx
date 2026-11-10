import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { parseError } from '../services/api';
import { LABELS, dateTime, money, monthLabel } from '../services/format';
import { Badge, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = { nueva: '#7aa7d6', en_contacto: '#e0a43a', en_negociacion: '#245f9e', ganada: '#1a7f4b', perdida: '#b42318' };

function Stat({ label, value, tone = 'text-ink', note }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tracking-tight ${tone}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/dashboard/summary').then((r) => setData(r.data)).catch((e) => setError(parseError(e).message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <div className="grid place-items-center py-24"><Spinner /></div>;

  const { totals: t, performance: p } = data;
  const monthly = data.clientsByMonth.map((m) => ({ name: monthLabel(m.month), Clientes: m.count }));
  const byStatus = data.opportunitiesByStatus.map((s) => ({ key: s.status, name: LABELS.oppStatus[s.status], Oportunidades: s.count, value: s.value }));

  return (
    <>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} subtitle={isAdmin ? 'Resumen general de toda la operación comercial.' : 'Resumen de tus clientes, oportunidades y tareas.'} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Clientes registrados" value={t.totalClients} note={`${t.newClients} nuevos en los últimos 30 días`} />
        <Stat label="Oportunidades abiertas" value={t.openOpportunities} note={`${money(p.pipelineValue)} en juego`} />
        <Stat label="Ganadas / perdidas" value={`${t.wonOpportunities} / ${t.lostOpportunities}`} tone="text-brand-700" note={`${p.winRate}% de cierre`} />
        <Stat label="Tareas pendientes" value={t.pendingTasks} tone={t.overdueTasks ? 'text-danger' : 'text-ink'} note={`${t.overdueTasks} vencidas`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Clientes registrados por mes</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dde4e1" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#e8f3f0' }} />
                <Bar dataKey="Clientes" fill="#0f6b5c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Oportunidades por estado</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dde4e1" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#f4f6f5' }} formatter={(v, n, item) => [`${v} (${money(item.payload.value)})`, 'Oportunidades']} />
                <Bar dataKey="Oportunidades" radius={[0, 6, 6, 0]}>
                  {byStatus.map((s) => <Cell key={s.key} fill={STATUS_COLOR[s.key]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Rendimiento comercial</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Valor ganado</dt><dd className="font-bold text-ok">{money(p.wonValue)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Valor en negociación abierta</dt><dd className="font-bold">{money(p.pipelineValue)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Tasa de cierre</dt><dd className="font-bold">{p.winRate}%</dd></div>
          </dl>
          <p className="mt-4 text-xs text-muted">La tasa de cierre se calcula sobre las oportunidades ya ganadas o perdidas.</p>
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Actividad reciente</h2>
          {data.recentActivities.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aún no hay interacciones registradas.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.recentActivities.map((a) => (
                <li key={a._id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.client?.fullName || 'Cliente eliminado'}</p>
                    <p className="truncate text-muted">{a.description}</p>
                  </div>
                  <div className="shrink-0 text-right"><Badge tone="blue" label={LABELS.activityType[a.type]} /><p className="mt-1 text-xs text-muted">{dateTime(a.date)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import api, { parseError } from '../services/api';
import { LABELS, date, dateTime } from '../services/format';
import { useList } from '../hooks/useList';
import { useToast } from '../context/ToastContext';
import ActivityForm from '../components/ActivityForm';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, PageHeader, Pagination, SearchInput, SortHeader, Spinner, inputCls } from '../components/ui';

export default function ActivitiesPage() {
  const toast = useToast();
  const list = useList('/activities', { sort: '-date' });
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { api.get('/clients', { params: { limit: 100, sort: 'fullName' } }).then((r) => setClients(r.data.data)).catch(() => {}); }, []);

  const remove = async () => {
    try { await api.delete(`/activities/${toDelete._id}`); toast.success('Actividad eliminada'); list.reload(); }
    catch (e) { toast.error(parseError(e).message); }
    setToDelete(null);
  };
  const dayStart = (v) => (v ? new Date(`${v}T00:00:00`).toISOString() : '');
  const dayEnd = (v) => (v ? new Date(`${v}T23:59:59`).toISOString() : '');

  return (
    <>
      <PageHeader title="Actividades" subtitle="Historial de llamadas, reuniones y demás interacciones.">
        <Button onClick={() => setForm({})}>Registrar actividad</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput onSearch={(search) => list.setFilters({ search })} placeholder="Buscar en descripción o resultado" />
          <select aria-label="Filtrar por tipo" className={inputCls} value={list.params.type || ''} onChange={(e) => list.setFilters({ type: e.target.value })}>
            <option value="">Todos los tipos</option>{Object.entries(LABELS.activityType).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Filtrar por cliente" className={inputCls} value={list.params.client || ''} onChange={(e) => list.setFilters({ client: e.target.value })}>
            <option value="">Todos los clientes</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}
          </select>
          <input type="date" aria-label="Desde" className={inputCls} onChange={(e) => list.setFilters({ from: dayStart(e.target.value) })} />
          <input type="date" aria-label="Hasta" className={inputCls} onChange={(e) => list.setFilters({ to: dayEnd(e.target.value) })} />
        </div>

        {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <SortHeader field="date" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Fecha</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <SortHeader field="type" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Tipo</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Detalle</th>
                  <th className="px-4 py-3 text-left font-semibold">Responsable</th>
                  <th className="px-4 py-3 text-left font-semibold">Seguimiento</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-line ${list.loading ? 'opacity-50' : ''}`}>
                {list.data.map((a) => (
                  <tr key={a._id} className="align-top hover:bg-paper/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{dateTime(a.date)}</td>
                    <td className="px-4 py-3 font-semibold">{a.client?.fullName || 'Cliente eliminado'}</td>
                    <td className="px-4 py-3"><Badge tone="blue" label={LABELS.activityType[a.type]} /></td>
                    <td className="max-w-xs px-4 py-3"><p>{a.description}</p>{a.result && <p className="text-xs text-muted">Resultado: {a.result}</p>}</td>
                    <td className="px-4 py-3 text-muted">{a.owner?.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{a.nextFollowUp ? <span className="text-amber-ink">{date(a.nextFollowUp)}</span> : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setForm(a)}>Editar</Button>
                      <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setToDelete(a)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.loading && list.data.length === 0 && <div className="py-12 text-center"><Spinner /></div>}
            {!list.loading && list.data.length === 0 && <EmptyState title="No hay actividades para mostrar" text="Registra una llamada, reunión o visita para empezar el historial." action={<Button onClick={() => setForm({})}>Registrar actividad</Button>} />}
          </div>
        )}
        {!list.error && <Pagination page={list.params.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
      </div>

      {form && <ActivityForm activity={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {toDelete && <ConfirmDialog title="Eliminar actividad" message="Se eliminará esta actividad del historial del cliente. Esta acción no se puede deshacer." onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}

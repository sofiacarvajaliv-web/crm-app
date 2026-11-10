import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { parseError } from '../services/api';
import { LABELS, date, toLocalDate } from '../services/format';
import { useList } from '../hooks/useList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, SortHeader, Spinner, inputCls } from '../components/ui';

const EMPTY = { title: '', description: '', client: '', assignedTo: '', dueDate: '', priority: 'media', status: 'pendiente' };
const opts = (obj) => Object.entries(obj).map(([v, l]) => <option key={v} value={v}>{l}</option>);
const isOverdue = (t) => t.status !== 'completada' && new Date(t.dueDate) < new Date();

function TaskForm({ task, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(task ? { ...EMPTY, ...task, client: task.client?._id || '', assignedTo: task.assignedTo?._id || '', dueDate: toLocalDate(task.dueDate), description: task.description || '' } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/clients', { params: { limit: 100, sort: 'fullName' } }).then((r) => setClients(r.data.data)).catch(() => {});
    if (isAdmin) api.get('/users/options').then((r) => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.title.trim().length < 2) e.title = 'Escribe un título';
    if (!form.dueDate) e.dueDate = 'Indica la fecha límite';
    setErrors(e);
    if (Object.keys(e).length) return;
    // La fecha límite vence al final del día elegido.
    const body = { title: form.title.trim(), description: form.description.trim(), client: form.client || null, dueDate: new Date(`${form.dueDate}T23:59:00`).toISOString(), priority: form.priority, status: form.status };
    if (isAdmin && form.assignedTo) body.assignedTo = form.assignedTo;
    setBusy(true);
    try {
      if (task) await api.put(`/tasks/${task._id}`, body); else await api.post('/tasks', body);
      toast.success(task ? 'Cambios guardados' : 'Tarea creada');
      onSaved();
    } catch (err) {
      const p = parseError(err); setErrors(p.fields); toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={task ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" error={errors.title} className="sm:col-span-2"><input className={inputCls} value={form.title} onChange={set('title')} placeholder="Ej. Enviar cotización" /></Field>
        <Field label="Cliente relacionado" hint="Opcional.">
          <select className={inputCls} value={form.client} onChange={set('client')}><option value="">Sin cliente</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select>
        </Field>
        <Field label="Fecha límite" error={errors.dueDate}><input type="date" className={inputCls} value={form.dueDate} onChange={set('dueDate')} /></Field>
        <Field label="Prioridad"><select className={inputCls} value={form.priority} onChange={set('priority')}>{opts(LABELS.priority)}</select></Field>
        <Field label="Estado"><select className={inputCls} value={form.status} onChange={set('status')}>{opts(LABELS.taskStatus)}</select></Field>
        {isAdmin && (
          <Field label="Responsable" hint="Por defecto, tú.">
            <select className={inputCls} value={form.assignedTo} onChange={set('assignedTo')}><option value="">Yo</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select>
          </Field>
        )}
        <Field label="Descripción" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={form.description} onChange={set('description')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{task ? 'Guardar cambios' : 'Crear tarea'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const list = useList('/tasks', { sort: 'dueDate', ...(searchParams.get('vencidas') ? { overdue: 'true' } : {}) });
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Si el enlace de la campana cambia mientras ya estás en Tareas, se aplica el filtro.
  const { setFilters } = list;
  const vencidas = searchParams.get('vencidas') ? 'true' : '';
  useEffect(() => { setFilters({ overdue: vencidas }); }, [vencidas, setFilters]);

  useEffect(() => { if (isAdmin) api.get('/users/options').then((r) => setUsers(r.data)).catch(() => {}); }, [isAdmin]);

  const changeStatus = async (task, status) => {
    try { await api.patch(`/tasks/${task._id}/status`, { status }); toast.success(`Tarea: ${LABELS.taskStatus[status].toLowerCase()}`); list.reload(); }
    catch (e) { toast.error(parseError(e).message); }
  };
  const remove = async () => {
    try { await api.delete(`/tasks/${toDelete._id}`); toast.success('Tarea eliminada'); list.reload(); }
    catch (e) { toast.error(parseError(e).message); }
    setToDelete(null);
  };

  return (
    <>
      <PageHeader title="Tareas" subtitle="Lo que hay que hacer, con responsable y fecha límite.">
        <Button onClick={() => setForm({})}>Nueva tarea</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput onSearch={(search) => list.setFilters({ search })} placeholder="Buscar por título" />
          <select aria-label="Filtrar por estado" className={inputCls} value={list.params.status || ''} onChange={(e) => list.setFilters({ status: e.target.value })}>
            <option value="">Todos los estados</option>{opts(LABELS.taskStatus)}
          </select>
          <select aria-label="Filtrar por prioridad" className={inputCls} value={list.params.priority || ''} onChange={(e) => list.setFilters({ priority: e.target.value })}>
            <option value="">Todas las prioridades</option>{opts(LABELS.priority)}
          </select>
          {isAdmin && (
            <select aria-label="Filtrar por responsable" className={inputCls} value={list.params.assignedTo || ''} onChange={(e) => list.setFilters({ assignedTo: e.target.value })}>
              <option value="">Todos los responsables</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-[#0f6b5c]" checked={list.params.overdue === 'true'} onChange={(e) => list.setFilters({ overdue: e.target.checked ? 'true' : '' })} />
            Solo vencidas
          </label>
        </div>

        {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <SortHeader field="title" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Tarea</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Responsable</th>
                  <SortHeader field="dueDate" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Fecha límite</SortHeader>
                  <SortHeader field="priority" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Prioridad</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-line ${list.loading ? 'opacity-50' : ''}`}>
                {list.data.map((t) => (
                  <tr key={t._id} className="hover:bg-paper/60">
                    <td className="px-4 py-3"><p className={`font-semibold ${t.status === 'completada' ? 'text-muted line-through' : ''}`}>{t.title}</p>{t.description && <p className="max-w-xs truncate text-xs text-muted">{t.description}</p>}</td>
                    <td className="px-4 py-3 text-muted">{t.client?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-muted">{t.assignedTo?.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{date(t.dueDate)} {isOverdue(t) && <Badge tone="red" label="Vencida" />}</td>
                    <td className="px-4 py-3"><Badge value={t.priority} label={LABELS.priority[t.priority]} /></td>
                    <td className="px-4 py-3">
                      <select aria-label={`Estado de ${t.title}`} value={t.status} onChange={(e) => changeStatus(t, e.target.value)} className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold">{opts(LABELS.taskStatus)}</select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setForm(t)}>Editar</Button>
                      <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setToDelete(t)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.loading && list.data.length === 0 && <div className="py-12 text-center"><Spinner /></div>}
            {!list.loading && list.data.length === 0 && <EmptyState title="No hay tareas para mostrar" text="Ajusta los filtros o crea una tarea nueva." action={<Button onClick={() => setForm({})}>Nueva tarea</Button>} />}
          </div>
        )}
        {!list.error && <Pagination page={list.params.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
      </div>

      {form && <TaskForm task={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {toDelete && <ConfirmDialog title="Eliminar tarea" message={`Se eliminará "${toDelete.title}". Esta acción no se puede deshacer.`} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}

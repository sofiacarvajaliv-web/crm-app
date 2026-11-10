import { useEffect, useState } from 'react';
import api, { parseError } from '../services/api';
import { LABELS, date, dateTime } from '../services/format';
import { useList } from '../hooks/useList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, SortHeader, Spinner, inputCls } from '../components/ui';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { fullName: '', idType: 'CC', idNumber: '', email: '', phone: '', address: '', city: '', company: '', clientType: 'persona', status: 'potencial', assignedTo: '', notes: '' };
const opts = (obj) => Object.entries(obj).map(([v, l]) => <option key={v} value={v}>{l}</option>);

function ClientForm({ client, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(client ? { ...EMPTY, ...client, company: client.company?._id || '', assignedTo: client.assignedTo?._id || '' } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/companies', { params: { limit: 100, sort: 'name' } }).then((r) => setCompanies(r.data.data)).catch(() => {});
    if (isAdmin) api.get('/users/options').then((r) => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Escribe el nombre completo';
    if (form.idNumber.trim().length < 3) e.idNumber = 'Mínimo 3 caracteres';
    if (!emailRx.test(form.email)) e.email = 'Ingresa un correo válido';
    if (form.phone.trim().length < 5) e.phone = 'Ingresa un teléfono válido';
    setErrors(e);
    if (Object.keys(e).length) return;

    const body = {
      fullName: form.fullName.trim(), idType: form.idType, idNumber: form.idNumber.trim(), email: form.email.trim(), phone: form.phone.trim(),
      address: form.address?.trim() || '', city: form.city?.trim() || '', company: form.company || null, clientType: form.clientType, status: form.status,
      notes: form.notes?.trim() || '',
    };
    if (isAdmin) body.assignedTo = form.assignedTo || null;
    setBusy(true);
    try {
      if (client) await api.put(`/clients/${client._id}`, body); else await api.post('/clients', body);
      toast.success(client ? 'Cambios guardados' : 'Cliente creado');
      onSaved();
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fields);
      toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={client ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" error={errors.fullName} className="sm:col-span-2"><input className={inputCls} value={form.fullName} onChange={set('fullName')} /></Field>
        <Field label="Tipo de identificación"><select className={inputCls} value={form.idType} onChange={set('idType')}>{opts(LABELS.idType)}</select></Field>
        <Field label="Número de identificación" error={errors.idNumber}><input className={inputCls} value={form.idNumber} onChange={set('idNumber')} /></Field>
        <Field label="Correo electrónico" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
        <Field label="Teléfono" error={errors.phone}><input className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Dirección" error={errors.address}><input className={inputCls} value={form.address || ''} onChange={set('address')} /></Field>
        <Field label="Ciudad" error={errors.city}><input className={inputCls} value={form.city || ''} onChange={set('city')} /></Field>
        <Field label="Empresa" error={errors.company}>
          <select className={inputCls} value={form.company} onChange={set('company')}><option value="">Sin empresa</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Tipo de cliente"><select className={inputCls} value={form.clientType} onChange={set('clientType')}>{opts(LABELS.clientType)}</select></Field>
        <Field label="Estado"><select className={inputCls} value={form.status} onChange={set('status')}>{opts(LABELS.clientStatus)}</select></Field>
        {isAdmin && (
          <Field label="Responsable">
            <select className={inputCls} value={form.assignedTo} onChange={set('assignedTo')}><option value="">Sin asignar</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select>
          </Field>
        )}
        <Field label="Observaciones" error={errors.notes} className="sm:col-span-2"><textarea rows={3} className={inputCls} value={form.notes || ''} onChange={set('notes')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{client ? 'Guardar cambios' : 'Crear cliente'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ClientHistory({ client, onClose }) {
  const [state, setState] = useState({ loading: true, data: [], error: null });
  useEffect(() => {
    api.get(`/clients/${client._id}/activities`, { params: { limit: 50 } })
      .then((r) => setState({ loading: false, data: r.data.data, error: null }))
      .catch((e) => setState({ loading: false, data: [], error: parseError(e).message }));
  }, [client._id]);
  const row = (k, v) => v ? <div><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div> : null;
  return (
    <Modal title={client.fullName} onClose={onClose} wide>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {row('Identificación', `${client.idType} ${client.idNumber}`)}{row('Correo', client.email)}{row('Teléfono', client.phone)}
        {row('Ciudad', client.city)}{row('Empresa', client.company?.name)}{row('Responsable', client.assignedTo?.name)}
        {row('Registrado', date(client.registeredAt))}
      </dl>
      {client.notes && <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-muted">{client.notes}</p>}
      <h3 className="mb-2 mt-6 font-bold">Historial de actividades</h3>
      {state.loading ? <div className="py-8 text-center"><Spinner /></div> : state.error ? <ErrorBox message={state.error} /> : state.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">Este cliente aún no tiene interacciones registradas.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {state.data.map((a) => (
            <li key={a._id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><Badge tone="blue" label={LABELS.activityType[a.type]} /><span className="text-xs text-muted">{dateTime(a.date)} · {a.owner?.name}</span></div>
              <p className="mt-1.5 font-semibold">{a.description}</p>
              {a.result && <p className="text-muted">Resultado: {a.result}</p>}
              {a.nextFollowUp && <p className="text-xs text-amber-ink">Próximo seguimiento: {date(a.nextFollowUp)}</p>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function ClientsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const list = useList('/clients', { sort: '-registeredAt' });
  const [form, setForm] = useState(null);       // null | {} (nuevo) | cliente (editar)
  const [history, setHistory] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const remove = async () => {
    try {
      await api.delete(`/clients/${toDelete._id}`);
      toast.success('Cliente eliminado');
      setToDelete(null);
      list.reload();
    } catch (err) { toast.error(parseError(err).message); setToDelete(null); }
  };

  return (
    <>
      <PageHeader title="Clientes" subtitle="Personas y empresas con las que trabajas.">
        <Button onClick={() => setForm({})}>Nuevo cliente</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <SearchInput onSearch={(search) => list.setFilters({ search })} placeholder="Buscar por nombre, correo o identificación" />
          <select aria-label="Filtrar por tipo" className={`${inputCls} sm:w-44`} value={list.params.clientType || ''} onChange={(e) => list.setFilters({ clientType: e.target.value })}>
            <option value="">Todos los tipos</option>{opts(LABELS.clientType)}
          </select>
          <select aria-label="Filtrar por estado" className={`${inputCls} sm:w-44`} value={list.params.status || ''} onChange={(e) => list.setFilters({ status: e.target.value })}>
            <option value="">Todos los estados</option>{opts(LABELS.clientStatus)}
          </select>
        </div>

        {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <SortHeader field="fullName" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Cliente</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Identificación</th>
                  <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <SortHeader field="status" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Estado</SortHeader>
                  <SortHeader field="registeredAt" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Registro</SortHeader>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-line ${list.loading ? 'opacity-50' : ''}`}>
                {list.data.map((c) => (
                  <tr key={c._id} className="hover:bg-paper/60">
                    <td className="px-4 py-3"><p className="font-semibold">{c.fullName}</p><p className="text-xs text-muted">{c.email}</p></td>
                    <td className="px-4 py-3 text-muted">{c.idType} {c.idNumber}</td>
                    <td className="px-4 py-3 text-muted">{c.company?.name || '—'}</td>
                    <td className="px-4 py-3">{LABELS.clientType[c.clientType]}</td>
                    <td className="px-4 py-3"><Badge value={c.status} label={LABELS.clientStatus[c.status]} /></td>
                    <td className="px-4 py-3 text-muted">{date(c.registeredAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setHistory(c)}>Historial</Button>
                      <Button variant="ghost" onClick={() => setForm(c)}>Editar</Button>
                      {isAdmin && <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setToDelete(c)}>Eliminar</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.loading && list.data.length === 0 && <div className="py-12 text-center"><Spinner /></div>}
            {!list.loading && list.data.length === 0 && (
              <EmptyState title="No hay clientes para mostrar" text="Ajusta la búsqueda o los filtros, o registra tu primer cliente." action={<Button onClick={() => setForm({})}>Nuevo cliente</Button>} />
            )}
          </div>
        )}
        {!list.error && <Pagination page={list.params.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
      </div>

      {form && <ClientForm client={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {history && <ClientHistory client={history} onClose={() => setHistory(null)} />}
      {toDelete && <ConfirmDialog title="Eliminar cliente" message={`Se eliminará a ${toDelete.fullName} junto con su historial de actividades y tareas. Esta acción no se puede deshacer.`} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}

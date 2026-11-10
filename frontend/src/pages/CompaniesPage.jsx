import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../services/api';
import { useList } from '../hooks/useList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, SortHeader, Spinner, inputCls } from '../components/ui';
import { LABELS } from '../services/format';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', taxId: '', sector: '', email: '', phone: '', address: '', city: '', website: '', description: '' };

function CompanyForm({ company, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(company ? { ...EMPTY, ...company } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.name.trim()) e.name = 'Escribe el nombre comercial';
    if (!form.taxId.trim()) e.taxId = 'Escribe el NIT o identificación';
    if (form.email && !emailRx.test(form.email)) e.email = 'Correo inválido';
    if (form.website && !/^https?:\/\//i.test(form.website)) e.website = 'Debe empezar por http:// o https://';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, (form[k] || '').trim()]));
    setBusy(true);
    try {
      if (company) await api.put(`/companies/${company._id}`, body); else await api.post('/companies', body);
      toast.success(company ? 'Cambios guardados' : 'Empresa creada');
      onSaved();
    } catch (err) {
      const p = parseError(err); setErrors(p.fields); toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={company ? 'Editar empresa' : 'Nueva empresa'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre comercial" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} /></Field>
        <Field label="NIT o identificación empresarial" error={errors.taxId}><input className={inputCls} value={form.taxId} onChange={set('taxId')} /></Field>
        <Field label="Sector económico" error={errors.sector}><input className={inputCls} value={form.sector} onChange={set('sector')} placeholder="Ej. Tecnología" /></Field>
        <Field label="Correo" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
        <Field label="Teléfono" error={errors.phone}><input className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Ciudad" error={errors.city}><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
        <Field label="Dirección" error={errors.address}><input className={inputCls} value={form.address} onChange={set('address')} /></Field>
        <Field label="Sitio web" error={errors.website}><input className={inputCls} value={form.website} onChange={set('website')} placeholder="https://" /></Field>
        <Field label="Descripción" error={errors.description} className="sm:col-span-2"><textarea rows={3} className={inputCls} value={form.description} onChange={set('description')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{company ? 'Guardar cambios' : 'Crear empresa'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Contactos = clientes asociados a la empresa. Permite asociar y quitar clientes.
function Contacts({ company, onClose, onChanged }) {
  const toast = useToast();
  const [contacts, setContacts] = useState(null);
  const [error, setError] = useState(null);
  const [available, setAvailable] = useState([]);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, all] = await Promise.all([api.get(`/companies/${company._id}/contacts`), api.get('/clients', { params: { limit: 100, sort: 'fullName' } })]);
      setContacts(c.data.data);
      setAvailable(all.data.data.filter((x) => x.company?._id !== company._id));
      setError(null);
    } catch (e) { setError(parseError(e).message); }
  }, [company._id]);
  useEffect(() => { load(); }, [load]);

  const setCompany = async (clientId, value, okMsg) => {
    setBusy(true);
    try { await api.put(`/clients/${clientId}`, { company: value }); toast.success(okMsg); setPick(''); await load(); onChanged(); }
    catch (e) { toast.error(parseError(e).message); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Contactos de ${company.name}`} onClose={onClose} wide>
      {error ? <ErrorBox message={error} onRetry={load} /> : !contacts ? <div className="py-8 text-center"><Spinner /></div> : (
        <>
          {contacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">Esta empresa aún no tiene contactos. Asocia un cliente existente con el selector de abajo.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {contacts.map((c) => (
                <li key={c._id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div><p className="font-semibold">{c.fullName}</p><p className="text-xs text-muted">{c.email} · {c.phone}</p></div>
                  <div className="flex items-center gap-2">
                    <Badge value={c.status} label={LABELS.clientStatus[c.status]} />
                    <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" disabled={busy} onClick={() => setCompany(c._id, null, 'Contacto desasociado')}>Quitar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <select aria-label="Cliente a asociar" className={inputCls} value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">{available.length ? 'Selecciona un cliente para asociar…' : 'No hay más clientes disponibles'}</option>
              {available.map((c) => <option key={c._id} value={c._id}>{c.fullName}{c.company ? ` (hoy en ${c.company.name})` : ''}</option>)}
            </select>
            <Button disabled={!pick} loading={busy} onClick={() => setCompany(pick, company._id, 'Contacto asociado')}>Asociar</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function CompaniesPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const list = useList('/companies', { sort: 'name' });
  const [form, setForm] = useState(null);
  const [contacts, setContacts] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const remove = async () => {
    try { await api.delete(`/companies/${toDelete._id}`); toast.success('Empresa eliminada'); list.reload(); }
    catch (err) { toast.error(parseError(err).message); }
    setToDelete(null);
  };

  return (
    <>
      <PageHeader title="Empresas" subtitle="Organizaciones y sus contactos.">
        <Button onClick={() => setForm({})}>Nueva empresa</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4"><SearchInput onSearch={(search) => list.setFilters({ search })} placeholder="Buscar por nombre, NIT o correo" /></div>
        {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <SortHeader field="name" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Empresa</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">NIT</th>
                  <SortHeader field="sector" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Sector</SortHeader>
                  <SortHeader field="city" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Ciudad</SortHeader>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-line ${list.loading ? 'opacity-50' : ''}`}>
                {list.data.map((c) => (
                  <tr key={c._id} className="hover:bg-paper/60">
                    <td className="px-4 py-3"><p className="font-semibold">{c.name}</p><p className="text-xs text-muted">{c.email || c.website || ''}</p></td>
                    <td className="px-4 py-3 text-muted">{c.taxId}</td>
                    <td className="px-4 py-3">{c.sector || '—'}</td>
                    <td className="px-4 py-3 text-muted">{c.city || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setContacts(c)}>Contactos</Button>
                      <Button variant="ghost" onClick={() => setForm(c)}>Editar</Button>
                      {isAdmin && <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setToDelete(c)}>Eliminar</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.loading && list.data.length === 0 && <div className="py-12 text-center"><Spinner /></div>}
            {!list.loading && list.data.length === 0 && <EmptyState title="No hay empresas para mostrar" text="Registra la primera empresa y luego asocia clientes como contactos." action={<Button onClick={() => setForm({})}>Nueva empresa</Button>} />}
          </div>
        )}
        {!list.error && <Pagination page={list.params.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
      </div>

      {form && <CompanyForm company={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {contacts && <Contacts company={contacts} onClose={() => setContacts(null)} onChanged={list.reload} />}
      {toDelete && <ConfirmDialog title="Eliminar empresa" message={`Se eliminará ${toDelete.name}. Si tiene contactos u oportunidades asociados, el sistema no lo permitirá. Esta acción no se puede deshacer.`} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}

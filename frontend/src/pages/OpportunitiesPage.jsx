import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../services/api';
import { LABELS, date, money, toInputDate } from '../services/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, ConfirmDialog, ErrorBox, Field, Modal, PageHeader, SearchInput, Spinner, inputCls } from '../components/ui';

const STATUSES = ['nueva', 'en_contacto', 'en_negociacion', 'ganada', 'perdida'];
const COLUMN_TONE = { nueva: 'bg-info', en_contacto: 'bg-amber-ink', en_negociacion: 'bg-brand-600', ganada: 'bg-ok', perdida: 'bg-danger' };
const EMPTY = { title: '', client: '', company: '', owner: '', estimatedValue: '', expectedCloseDate: '', status: 'nueva', description: '' };

function OpportunityForm({ opp, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(opp ? { ...EMPTY, ...opp, client: opp.client?._id || '', company: opp.company?._id || '', owner: opp.owner?._id || '', expectedCloseDate: toInputDate(opp.expectedCloseDate), estimatedValue: opp.estimatedValue ?? '' } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/clients', { params: { limit: 100, sort: 'fullName' } }).then((r) => setClients(r.data.data)).catch(() => {});
    api.get('/companies', { params: { limit: 100, sort: 'name' } }).then((r) => setCompanies(r.data.data)).catch(() => {});
    if (isAdmin) api.get('/users/options').then((r) => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.title.trim().length < 2) e.title = 'Escribe un título';
    if (!form.client) e.client = 'Selecciona un cliente';
    if (form.estimatedValue !== '' && Number(form.estimatedValue) < 0) e.estimatedValue = 'No puede ser negativo';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: form.title.trim(), client: form.client, company: form.company || null,
      estimatedValue: form.estimatedValue === '' ? 0 : Number(form.estimatedValue),
      expectedCloseDate: form.expectedCloseDate || null, status: form.status, description: form.description?.trim() || '',
    };
    if (isAdmin && form.owner) body.owner = form.owner;
    setBusy(true);
    try {
      if (opp) await api.put(`/opportunities/${opp._id}`, body); else await api.post('/opportunities', body);
      toast.success(opp ? 'Cambios guardados' : 'Oportunidad creada');
      onSaved();
    } catch (err) {
      const p = parseError(err); setErrors(p.fields); toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={opp ? 'Editar oportunidad' : 'Nueva oportunidad'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" error={errors.title} className="sm:col-span-2"><input className={inputCls} value={form.title} onChange={set('title')} placeholder="Ej. Contrato anual de transporte" /></Field>
        <Field label="Cliente" error={errors.client}>
          <select className={inputCls} value={form.client} onChange={set('client')}><option value="">Selecciona un cliente…</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select>
        </Field>
        <Field label="Empresa" hint="Si la dejas vacía, se usa la empresa del cliente.">
          <select className={inputCls} value={form.company} onChange={set('company')}><option value="">Sin empresa</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Valor estimado (COP)" error={errors.estimatedValue}><input type="number" min="0" className={inputCls} value={form.estimatedValue} onChange={set('estimatedValue')} /></Field>
        <Field label="Fecha estimada de cierre"><input type="date" className={inputCls} value={form.expectedCloseDate} onChange={set('expectedCloseDate')} /></Field>
        <Field label="Estado"><select className={inputCls} value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s} value={s}>{LABELS.oppStatus[s]}</option>)}</select></Field>
        {isAdmin && (
          <Field label="Responsable" hint="Por defecto, tú.">
            <select className={inputCls} value={form.owner} onChange={set('owner')}><option value="">Yo</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select>
          </Field>
        )}
        <Field label="Descripción" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={form.description || ''} onChange={set('description')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{opp ? 'Guardar cambios' : 'Crear oportunidad'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Card({ opp, onEdit, onDelete, onMove }) {
  return (
    <article draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', opp._id); e.dataTransfer.effectAllowed = 'move'; }}
      className="cursor-grab rounded-lg border border-line bg-white p-3 text-sm shadow-sm active:cursor-grabbing" data-testid="opp-card">
      <p className="font-bold leading-snug">{opp.title}</p>
      <p className="mt-0.5 text-muted">{opp.client?.fullName}{opp.company ? ` · ${opp.company.name}` : ''}</p>
      <p className="mt-2 text-base font-extrabold text-brand-700">{money(opp.estimatedValue)}</p>
      <p className="text-xs text-muted">Cierre: {date(opp.expectedCloseDate)} · {opp.owner?.name}</p>
      <div className="mt-2 flex items-center gap-1">
        <select aria-label={`Mover ${opp.title}`} value={opp.status} onChange={(e) => onMove(opp, e.target.value)} className="min-w-0 flex-1 rounded-md border border-line bg-paper px-1.5 py-1 text-xs font-semibold">
          {STATUSES.map((s) => <option key={s} value={s}>{LABELS.oppStatus[s]}</option>)}
        </select>
        <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => onEdit(opp)}>Editar</Button>
        <Button variant="ghost" className="!px-2 !py-1 text-xs !text-danger hover:!bg-danger-soft" onClick={() => onDelete(opp)}>Eliminar</Button>
      </div>
    </article>
  );
}

export default function OpportunitiesPage() {
  const toast = useToast();
  const [opps, setOpps] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/opportunities', { params: { limit: 100, sort: '-createdAt', search: search || undefined } });
      setOpps(data.data); setTotal(data.total); setError(null);
    } catch (e) { setError(parseError(e).message); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  // Cambio de estado con actualización inmediata; si el servidor falla, se revierte.
  const move = async (opp, status) => {
    if (opp.status === status) return;
    const previous = opps;
    setOpps((list) => list.map((o) => (o._id === opp._id ? { ...o, status } : o)));
    try {
      await api.patch(`/opportunities/${opp._id}/status`, { status });
      toast.success(`Movida a "${LABELS.oppStatus[status]}"`);
    } catch (e) { setOpps(previous); toast.error(parseError(e).message); }
  };

  const onDrop = (e, status) => {
    e.preventDefault(); setOverCol(null);
    const opp = opps.find((o) => o._id === e.dataTransfer.getData('text/plain'));
    if (opp) move(opp, status);
  };

  const remove = async () => {
    try { await api.delete(`/opportunities/${toDelete._id}`); toast.success('Oportunidad eliminada'); load(); }
    catch (e) { toast.error(parseError(e).message); }
    setToDelete(null);
  };

  return (
    <>
      <PageHeader title="Oportunidades" subtitle="Arrastra las tarjetas entre columnas o cambia el estado desde la tarjeta.">
        <Button onClick={() => setForm({})}>Nueva oportunidad</Button>
      </PageHeader>
      <div className="mb-4"><SearchInput onSearch={setSearch} placeholder="Buscar por título" /></div>

      {error ? <ErrorBox message={error} onRetry={load} /> : !opps ? <div className="py-20 text-center"><Spinner /></div> : (
        <>
          {total > opps.length && <p className="mb-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber-ink">Se muestran {opps.length} de {total} oportunidades. Usa la búsqueda para acotar.</p>}
          <div className="flex gap-3 overflow-x-auto pb-3">
            {STATUSES.map((s) => {
              const items = opps.filter((o) => o.status === s);
              const sum = items.reduce((n, o) => n + (o.estimatedValue || 0), 0);
              return (
                <section key={s} aria-label={LABELS.oppStatus[s]} data-column={s}
                  onDragOver={(e) => { e.preventDefault(); setOverCol(s); }} onDragLeave={() => setOverCol(null)} onDrop={(e) => onDrop(e, s)}
                  className={`flex w-72 shrink-0 flex-col rounded-xl border bg-white/60 ${overCol === s ? 'border-brand-500 bg-brand-50' : 'border-line'}`}>
                  <header className="border-b border-line px-3 py-3">
                    <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${COLUMN_TONE[s]}`} /><h2 className="font-bold">{LABELS.oppStatus[s]}</h2><span className="ml-auto rounded-full bg-paper px-2 text-xs font-bold text-muted">{items.length}</span></div>
                    <p className="mt-0.5 text-xs text-muted">{money(sum)}</p>
                  </header>
                  <div className="flex min-h-24 flex-1 flex-col gap-2 p-2.5">
                    {items.map((o) => <Card key={o._id} opp={o} onMove={move} onEdit={setForm} onDelete={setToDelete} />)}
                    {items.length === 0 && <p className="m-auto py-4 text-center text-xs text-muted">Sin oportunidades</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {form && <OpportunityForm opp={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {toDelete && <ConfirmDialog title="Eliminar oportunidad" message={`Se eliminará "${toDelete.title}". Esta acción no se puede deshacer.`} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}

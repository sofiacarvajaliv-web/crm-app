import { useEffect, useState } from 'react';
import api, { parseError } from '../services/api';
import { LABELS, toLocalDate, toLocalDateTime } from '../services/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, Modal, inputCls } from './ui';

// Registro/edición de una actividad. Si viene "presetClient", el cliente queda fijo.
export default function ActivityForm({ activity, presetClient, onClose, onSaved }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(activity
    ? { client: activity.client?._id || '', type: activity.type, date: toLocalDateTime(activity.date), description: activity.description, result: activity.result || '', nextFollowUp: toLocalDate(activity.nextFollowUp), owner: activity.owner?._id || '' }
    : { client: presetClient?._id || '', type: 'llamada', date: toLocalDateTime(), description: '', result: '', nextFollowUp: '', owner: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!presetClient) api.get('/clients', { params: { limit: 100, sort: 'fullName' } }).then((r) => setClients(r.data.data)).catch(() => {});
    if (isAdmin) api.get('/users/options').then((r) => setUsers(r.data)).catch(() => {});
  }, [isAdmin, presetClient]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.client) e.client = 'Selecciona un cliente';
    if (form.description.trim().length < 2) e.description = 'Describe la actividad';
    if (!form.date) e.date = 'Indica la fecha y hora';
    // El seguimiento se guarda al final del día elegido, así "hoy" es válido.
    const follow = form.nextFollowUp ? new Date(`${form.nextFollowUp}T23:59:00`) : null;
    if (follow && form.date && follow < new Date(form.date)) e.nextFollowUp = 'No puede ser anterior a la fecha de la actividad';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      client: form.client, type: form.type, date: new Date(form.date).toISOString(), description: form.description.trim(),
      result: form.result.trim(), nextFollowUp: follow ? follow.toISOString() : null,
    };
    if (isAdmin && form.owner) body.owner = form.owner;
    setBusy(true);
    try {
      if (activity) await api.put(`/activities/${activity._id}`, body); else await api.post('/activities', body);
      toast.success(activity ? 'Cambios guardados' : 'Actividad registrada');
      onSaved();
    } catch (err) {
      const p = parseError(err); setErrors(p.fields); toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={activity ? 'Editar actividad' : 'Registrar actividad'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente" error={errors.client}>
          {presetClient ? <input className={inputCls} value={presetClient.fullName} disabled /> : (
            <select className={inputCls} value={form.client} onChange={set('client')}><option value="">Selecciona un cliente…</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select>
          )}
        </Field>
        <Field label="Tipo de actividad"><select className={inputCls} value={form.type} onChange={set('type')}>{Object.entries(LABELS.activityType).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Fecha y hora" error={errors.date}><input type="datetime-local" className={inputCls} value={form.date} onChange={set('date')} /></Field>
        <Field label="Próximo seguimiento" error={errors.nextFollowUp} hint="Opcional."><input type="date" className={inputCls} value={form.nextFollowUp} onChange={set('nextFollowUp')} /></Field>
        <Field label="Descripción" error={errors.description} className="sm:col-span-2"><textarea rows={2} className={inputCls} value={form.description} onChange={set('description')} /></Field>
        <Field label="Resultado" error={errors.result} className="sm:col-span-2"><input className={inputCls} value={form.result} onChange={set('result')} placeholder="Ej. Pidió cotización" /></Field>
        {isAdmin && (
          <Field label="Responsable" hint="Por defecto, tú."><select className={inputCls} value={form.owner} onChange={set('owner')}><option value="">Yo</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select></Field>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{activity ? 'Guardar cambios' : 'Registrar actividad'}</Button>
        </div>
      </form>
    </Modal>
  );
}

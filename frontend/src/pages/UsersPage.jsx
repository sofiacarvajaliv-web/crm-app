import { useState } from 'react';
import api, { parseError } from '../services/api';
import { LABELS, date } from '../services/format';
import { useList } from '../hooks/useList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, Field, Modal, PageHeader, Pagination, SearchInput, SortHeader, Spinner, inputCls } from '../components/ui';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordError = (v) => (v.length < 8 ? 'Mínimo 8 caracteres' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Debe incluir letras y números' : '');

function UserForm({ target, onClose, onSaved }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const editing = Boolean(target);
  const isSelf = editing && target._id === me._id;
  const [form, setForm] = useState(editing ? { name: target.name, email: target.email, role: target.role, active: target.active, password: '' } : { name: '', email: '', role: 'advisor', active: true, password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Escribe el nombre';
    if (!editing && !emailRx.test(form.email)) e.email = 'Ingresa un correo válido';
    if (!editing || form.password) { const pe = passwordError(form.password); if (pe) e.password = pe; }
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (editing) {
        const body = { name: form.name.trim(), role: form.role, active: form.active };
        if (form.password) body.password = form.password;
        await api.put(`/users/${target._id}`, body);
      } else {
        await api.post('/users', { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      }
      toast.success(editing ? 'Cambios guardados' : 'Usuario creado');
      onSaved();
    } catch (err) {
      const p = parseError(err); setErrors(p.fields); toast.error(p.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nombre completo" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} /></Field>
        <Field label="Correo electrónico" error={errors.email} hint={editing ? 'El correo no se puede cambiar.' : undefined}>
          <input type="email" className={inputCls} value={form.email} onChange={set('email')} disabled={editing} />
        </Field>
        <Field label="Rol" hint={isSelf ? 'No puedes cambiar tu propio rol.' : 'El asesor solo ve y edita sus propios registros.'}>
          <select className={inputCls} value={form.role} onChange={set('role')} disabled={isSelf}>{Object.entries(LABELS.role).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} error={errors.password} hint="Mínimo 8 caracteres, con letras y números.">
          <input type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        {editing && (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-[#0f6b5c]" checked={form.active} disabled={isSelf} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Cuenta activa {isSelf && <span className="font-normal text-muted">(no puedes desactivarte)</span>}
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const list = useList('/users', { sort: 'name' });
  const [form, setForm] = useState(null);
  const [toDeactivate, setToDeactivate] = useState(null);

  const deactivate = async () => {
    try { await api.delete(`/users/${toDeactivate._id}`); toast.success('Usuario desactivado'); list.reload(); }
    catch (e) { toast.error(parseError(e).message); }
    setToDeactivate(null);
  };
  const reactivate = async (u) => {
    try { await api.put(`/users/${u._id}`, { active: true }); toast.success('Usuario reactivado'); list.reload(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Quién puede entrar al sistema y con qué permisos.">
        <Button onClick={() => setForm({})}>Nuevo usuario</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <SearchInput onSearch={(search) => list.setFilters({ search })} placeholder="Buscar por nombre o correo" />
          <select aria-label="Filtrar por rol" className={`${inputCls} sm:w-48`} value={list.params.role || ''} onChange={(e) => list.setFilters({ role: e.target.value })}>
            <option value="">Todos los roles</option>{Object.entries(LABELS.role).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Filtrar por estado" className={`${inputCls} sm:w-44`} value={list.params.active || ''} onChange={(e) => list.setFilters({ active: e.target.value })}>
            <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
          </select>
        </div>

        {list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <SortHeader field="name" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Usuario</SortHeader>
                  <SortHeader field="role" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Rol</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <SortHeader field="createdAt" sort={list.params.sort} onSort={(sort) => list.setFilters({ sort })}>Creado</SortHeader>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-line ${list.loading ? 'opacity-50' : ''}`}>
                {list.data.map((u) => (
                  <tr key={u._id} className="hover:bg-paper/60">
                    <td className="px-4 py-3"><p className="font-semibold">{u.name}{u._id === me._id && <span className="ml-2 text-xs font-normal text-muted">(tú)</span>}</p><p className="text-xs text-muted">{u.email}</p></td>
                    <td className="px-4 py-3"><Badge tone={u.role === 'admin' ? 'blue' : 'gray'} label={LABELS.role[u.role]} /></td>
                    <td className="px-4 py-3"><Badge tone={u.active ? 'green' : 'red'} label={u.active ? 'Activo' : 'Inactivo'} /></td>
                    <td className="px-4 py-3 text-muted">{date(u.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setForm(u)}>Editar</Button>
                      {u._id !== me._id && (u.active
                        ? <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setToDeactivate(u)}>Desactivar</Button>
                        : <Button variant="ghost" onClick={() => reactivate(u)}>Reactivar</Button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.loading && list.data.length === 0 && <div className="py-12 text-center"><Spinner /></div>}
            {!list.loading && list.data.length === 0 && <EmptyState title="No hay usuarios para mostrar" text="Ajusta la búsqueda o los filtros." />}
          </div>
        )}
        {!list.error && <Pagination page={list.params.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
      </div>

      {form && <UserForm target={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
      {toDeactivate && <ConfirmDialog title="Desactivar usuario" confirmLabel="Desactivar" message={`${toDeactivate.name} ya no podrá iniciar sesión. Su historial se conserva y puedes reactivarlo cuando quieras.`} onConfirm={deactivate} onCancel={() => setToDeactivate(null)} />}
    </>
  );
}

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { parseError } from '../services/api';
import { Button, Field, inputCls, Spinner } from '../components/ui';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { user, login, registerFirstAdmin } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/setup-status').then((r) => setNeedsSetup(r.data.needsSetup)).catch((e) => { setNeedsSetup(false); setFormError(parseError(e).message); });
  }, []);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (needsSetup && form.name.trim().length < 2) e.name = 'Escribe tu nombre';
    if (!emailRx.test(form.email)) e.email = 'Ingresa un correo válido';
    if (needsSetup) {
      if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
      else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Debe incluir letras y números';
    } else if (!form.password) e.password = 'Ingresa tu contraseña';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (needsSetup) await registerFirstAdmin({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await login(form.email.trim(), form.password);
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fields);
      setFormError(p.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <span className="text-xl font-extrabold tracking-tight">NexoCRM</span>
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">Cada cliente, cada conversación y cada venta en un solo lugar.</h1>
          <p className="mt-4 max-w-md text-white/65">Registra clientes, da seguimiento a tus oportunidades y mira cómo avanza tu equipo con datos que se actualizan en tiempo real.</p>
        </div>
        <p className="text-sm text-white/40">Proyecto académico · React, Node.js y MongoDB Atlas</p>
      </section>

      <section className="flex items-center justify-center p-6">
        {needsSetup === null ? <Spinner /> : (
          <form onSubmit={submit} noValidate className="w-full max-w-sm space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{needsSetup ? 'Crea el administrador' : 'Inicia sesión'}</h2>
              <p className="mt-1 text-sm text-muted">{needsSetup ? 'Aún no hay usuarios. Esta cuenta tendrá control total del sistema.' : 'Ingresa con tu correo y contraseña.'}</p>
            </div>
            {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{formError}</div>}
            {needsSetup && <Field label="Nombre completo" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} autoComplete="name" /></Field>}
            <Field label="Correo electrónico" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Contraseña" error={errors.password} hint={needsSetup ? 'Mínimo 8 caracteres, con letras y números.' : undefined}>
              <input type="password" className={inputCls} value={form.password} onChange={set('password')} autoComplete={needsSetup ? 'new-password' : 'current-password'} />
            </Field>
            <Button type="submit" loading={busy} className="w-full">{needsSetup ? 'Crear administrador' : 'Entrar'}</Button>
          </form>
        )}
      </section>
    </div>
  );
}

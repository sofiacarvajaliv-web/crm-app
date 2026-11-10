import { useEffect, useState } from 'react';

export const inputCls =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-paper';

const BTN = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-line bg-white text-ink hover:bg-paper',
  danger: 'bg-danger text-white hover:bg-[#8f1b11]',
  ghost: 'text-brand-700 hover:bg-brand-50',
};
export function Button({ variant = 'primary', loading, className = '', children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${className}`}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function Spinner({ small }) {
  return <span role="status" aria-label="Cargando" className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${small ? 'h-4 w-4' : 'h-6 w-6 text-brand-600'}`} />;
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-semibold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

const TONES = {
  green: 'bg-ok-soft text-ok', amber: 'bg-amber-soft text-amber-ink', red: 'bg-danger-soft text-danger',
  blue: 'bg-info-soft text-info', gray: 'bg-paper text-muted ring-1 ring-line',
};
export const TONE_BY_VALUE = {
  activo: 'green', potencial: 'amber', inactivo: 'gray',
  nueva: 'blue', en_contacto: 'amber', en_negociacion: 'blue', ganada: 'green', perdida: 'red',
  pendiente: 'amber', en_progreso: 'blue', completada: 'green', baja: 'gray', media: 'amber', alta: 'red',
};
export function Badge({ value, label, tone }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone || TONE_BY_VALUE[value] || 'gray']}`}>{label ?? value}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-md px-2 py-1 text-xl leading-none text-muted hover:bg-paper">×</button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" loading={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Pagination({ page, totalPages, total, onPage }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm text-muted">
      <span>{total} {total === 1 ? 'registro' : 'registros'}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
        <span>Página {page} de {totalPages}</span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</Button>
      </div>
    </div>
  );
}

// Búsqueda con retardo para no consultar en cada tecla.
export function SearchInput({ onSearch, placeholder = 'Buscar…' }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <input type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${inputCls} sm:max-w-xs`} />;
}

export function SortHeader({ field, sort, onSort, children }) {
  const active = sort === field || sort === `-${field}`;
  const desc = sort === `-${field}`;
  return (
    <th scope="col" className="px-4 py-3 text-left font-semibold">
      <button onClick={() => onSort(sort === field ? `-${field}` : field)} className="inline-flex items-center gap-1 hover:text-ink">
        {children}<span className={active ? 'text-brand-600' : 'text-line'} aria-hidden>{desc ? '▼' : '▲'}</span>
      </button>
    </th>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="m-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      <span>{message}</span>{onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

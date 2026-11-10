import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LABELS } from '../services/format';
import { NAV } from './nav';

const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  building: 'M4 21V4a1 1 0 011-1h9a1 1 0 011 1v17M15 9h4a1 1 0 011 1v11M8 7h3M8 11h3M8 15h3M2 21h20',
  target: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
};
export const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white"><Icon name="target" className="h-4 w-4" /></span>
      <span className="text-lg font-extrabold tracking-tight text-white">NexoCRM</span>
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [totals, setTotals] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => {
    api.get('/dashboard/summary').then((r) => setTotals(r.data.totals)).catch(() => setTotals(null));
  }, [pathname]);
  const overdue = totals?.overdueTasks || 0;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones" aria-expanded={open} className="relative rounded-lg p-2 text-muted hover:bg-paper">
        <Icon name="bell" />
        {overdue > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{overdue}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-white p-4 text-sm shadow-lg">
          <p className="mb-2 font-bold">Pendientes</p>
          {!totals ? <p className="text-muted">No se pudo cargar la información.</p> : (
            <ul className="space-y-1.5 text-muted">
              <li><strong className={overdue ? 'text-danger' : 'text-ink'}>{overdue}</strong> {overdue === 1 ? 'tarea vencida' : 'tareas vencidas'}</li>
              <li><strong className="text-ink">{totals.pendingTasks}</strong> tareas sin completar</li>
              <li><strong className="text-ink">{totals.openOpportunities}</strong> oportunidades abiertas</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenu(false), [pathname]);

  const links = (
    <nav className="flex-1 space-y-1 px-3" aria-label="Principal">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
          <Icon name={n.icon} />{n.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-full">
      <aside className="hidden w-60 shrink-0 flex-col bg-ink lg:flex"><Brand />{links}</aside>
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-ink/50" />
          <aside className="relative flex h-full w-64 flex-col bg-ink" onClick={(e) => e.stopPropagation()}><Brand />{links}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5 sm:px-6">
          <button className="rounded-lg p-2 text-muted hover:bg-paper lg:hidden" aria-label="Abrir menú" onClick={() => setMenu(true)}><Icon name="menu" /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Notifications />
            <div className="ml-1 flex items-center gap-3 border-l border-line pl-3">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted">{LABELS.role[user.role]}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">{user.name.slice(0, 1).toUpperCase()}</span>
              <button onClick={logout} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-paper hover:text-ink">Cerrar sesión</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

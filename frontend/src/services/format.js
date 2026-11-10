export const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
export const date = (d) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short' });
};
// Para <input type="date">
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const LABELS = {
  idType: { CC: 'Cédula', CE: 'Cédula de extranjería', NIT: 'NIT', PAS: 'Pasaporte', TI: 'Tarjeta de identidad', OTRO: 'Otro' },
  clientType: { persona: 'Persona', empresa: 'Empresa', prospecto: 'Prospecto' },
  clientStatus: { activo: 'Activo', inactivo: 'Inactivo', potencial: 'Potencial' },
  oppStatus: { nueva: 'Nueva', en_contacto: 'En contacto', en_negociacion: 'En negociación', ganada: 'Ganada', perdida: 'Perdida' },
  activityType: { llamada: 'Llamada', correo: 'Correo', reunion: 'Reunión', visita: 'Visita', seguimiento: 'Seguimiento', otra: 'Otra' },
  taskStatus: { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' },
  priority: { baja: 'Baja', media: 'Media', alta: 'Alta' },
  role: { admin: 'Administrador', advisor: 'Asesor comercial' },
};

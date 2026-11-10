import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../services/api';

// Listado paginado contra la API: página, orden, búsqueda y filtros; maneja carga y error.
export function useList(path, initial = {}) {
  const [params, setParams] = useState({ page: 1, limit: 10, ...initial });
  const [state, setState] = useState({ data: [], total: 0, totalPages: 1, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    api.get(path, { params: clean })
      .then((r) => { if (!ignore) setState({ data: r.data.data, total: r.data.total, totalPages: r.data.totalPages, loading: false, error: null }); })
      .catch((e) => { if (!ignore) setState((s) => ({ ...s, loading: false, error: parseError(e).message })); });
    return () => { ignore = true; };
  }, [path, params, tick]);

  const setFilters = useCallback((patch) => setParams((p) => ({ ...p, ...patch, page: 1 })), []);
  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), []);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, params, setFilters, setPage, reload };
}

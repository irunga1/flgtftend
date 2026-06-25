import { useMemo, useState } from 'preact/hooks';

const getEstadoStyle = (estado) => {
  const e = String(estado || '').toLowerCase();
  if (e === 'activo') return { bg: '#e6f4ea', color: '#057642' };
  if (e === 'inactivo') return { bg: '#fce8e6', color: '#b24020' };
  if (e === 'completado') return { bg: '#e8f0fe', color: '#0a66c2' };
  return { bg: '#e6f4ea', color: '#057642' };
};

const compare = (a, b, dir) => {
  const mul = dir === 'asc' ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return -1 * mul;
  if (b == null) return 1 * mul;

  // numbers
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * mul;

  // fallback string
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' }) * mul;
};

export function MisProyectosTable({
  proyectos,
  onOpenPropuestas,
  onEdit,
  onDelete,
}) {
  const [sortKey, setSortKey] = useState('titulo');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    const list = Array.isArray(proyectos) ? proyectos.slice() : [];

    list.sort((x, y) => {
      if (sortKey === 'presupuesto') {
        return compare(Number(x.presupuesto ?? 0), Number(y.presupuesto ?? 0), sortDir);
      }
      if (sortKey === 'estado') {
        return compare(String(x.estado ?? ''), String(y.estado ?? ''), sortDir);
      }
      // titulo/default
      return compare(String(x.titulo ?? ''), String(y.titulo ?? ''), sortDir);
    });

    return list;
  }, [proyectos, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const thStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const thActive = {
    background: '#f3f2ef',
  };

  return (
    <div class="table-responsive">
      <table class="table align-middle mb-0" style={{ borderCollapse: 'separate' }}>
        <thead>
          <tr>
            <th
              style={thStyle}
              onClick={() => toggleSort('titulo')}
            >
              <div class="d-flex align-items-center gap-2" style={sortKey === 'titulo' ? thActive : undefined}>
                Título
                {sortKey === 'titulo' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </div>
            </th>
            <th
              style={thStyle}
              onClick={() => toggleSort('presupuesto')}
            >
              <div class="d-flex align-items-center gap-2" style={sortKey === 'presupuesto' ? thActive : undefined}>
                Presupuesto
                {sortKey === 'presupuesto' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </div>
            </th>
            <th
              style={thStyle}
              onClick={() => toggleSort('estado')}
            >
              <div class="d-flex align-items-center gap-2" style={sortKey === 'estado' ? thActive : undefined}>
                Estado
                {sortKey === 'estado' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </div>
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan="4" class="text-center py-4 text-muted">
                No tienes proyectos aún.
              </td>
            </tr>
          ) : (
            sorted.map((p) => {
              const estadoStyle = getEstadoStyle(p.estado);
              return (
                <tr key={p.id_proyecto}>
                  <td>
                    <div class="fw-semibold" style={{ color: '#000000e6' }}>
                      {p.titulo}
                    </div>
                    <div class="text-muted small" style={{ maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.descripcion || ''}
                    </div>
                  </td>
                  <td>
                    <span class="fw-bold" style={{ color: '#0a66c2' }}>
                      Q{Number(p.presupuesto || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span class="badge rounded-pill" style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.color }}>
                      {p.estado || 'activo'}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-2 flex-wrap">
                      <button
                        class="btn btn-sm btn-outline-success"
                        style={{ borderRadius: '8px' }}
                        onClick={() => onOpenPropuestas?.(p)}
                      >
                        👀 Propuestas
                      </button>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: '8px' }}
                        onClick={() => onEdit?.(p)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: '8px' }}
                        onClick={() => onDelete?.(p.id_proyecto)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}


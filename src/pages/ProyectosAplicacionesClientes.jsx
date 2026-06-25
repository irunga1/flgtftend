import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProyectos } from '../services/proyectoService';
import { searchByProyecto } from '../services/freelancerProyectoService';
import { getUserById } from '../services/userService';

function getRoleId(u) {
  if (!u) return null;
  const candidates = [
    u.id_rol,
    u.rol,
    u.idRol,
    u.role,
    u.tipo_usuario,
    u.id_tipo_usuario,
    u.idTipoUsuario,
    u.typeUser,
  ];
  const found = candidates.find((v) => v !== undefined && v !== null && String(v) !== '');
  if (found === undefined) return null;
  const n = Number(found);
  return Number.isFinite(n) ? n : null;
}

function getEstadoBadgeStyle(estadoRaw) {
  const estado = String(estadoRaw || '').toLowerCase();
  if (estado === 'aceptada' || estado === 'aceptado') {
    return { bg: '#e6f4ea', color: '#057642' };
  }
  if (estado === 'rechazada' || estado === 'rechazado') {
    return { bg: '#fce8e6', color: '#b24020' };
  }
  if (estado === 'completada' || estado === 'completado') {
    return { bg: '#e8f0fe', color: '#0a66c2' };
  }
  return { bg: '#e8f0fe', color: '#0a66c2' };
}

function normalizePropuestas(list) {
  return Array.isArray(list) ? list : [];
}

export function ProyectosAplicacionesClientes() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const viewerRoleId = getRoleId(authUser);
  const viewerId = authUser?.id ?? authUser?.id_usuario ?? authUser?.userId ?? null;

  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [porProyecto, setPorProyecto] = useState({});

  const isCliente = Number(viewerRoleId) === 3;

  useEffect(() => {
    if (!isCliente) {
      setLoading(false);
      return;
    }
    if (!viewerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getProyectos();
        const list = Array.isArray(data) ? data : [];

        // Si el backend trae todos, filtramos por id_cliente.
        const filtered = list.filter((p) => {
          const idCliente = p.id_cliente ?? p.idCliente ?? p.cliente_id ?? p.clienteId;
          return idCliente === undefined ? true : String(idCliente) === String(viewerId);
        });

        if (cancelled) return;
        setProyectos(filtered);

        // Cargar aplicaciones por proyecto.
        const entries = await Promise.all(
          filtered.map(async (p) => {
            try {
              const proposals = await searchByProyecto(p.id_proyecto);
              const normalized = normalizePropuestas(proposals);

              const enriched = await Promise.all(
                normalized.map(async (prop) => {
                  try {
                    const freelancer = await getUserById(prop.id_freelancer);
                    return {
                      ...prop,
                      freelancer: Array.isArray(freelancer) ? freelancer[0] : freelancer,
                    };
                  } catch {
                    return prop;
                  }
                })
              );

              return [p.id_proyecto, enriched];
            } catch {
              return [p.id_proyecto, []];
            }
          })
        );

        if (cancelled) return;
        const map = {};
        for (const [k, v] of entries) map[k] = v;
        setPorProyecto(map);
      } catch (e) {
        showToast('Error al cargar proyectos y aplicaciones.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isCliente, viewerId]);

  const proyectosOrdenados = useMemo(() => {
    const copy = [...proyectos];
    copy.sort((a, b) => {
      const ea = String(a.estado || 'activo');
      const eb = String(b.estado || 'activo');
      // activos primero
      const rank = (e) => (e === 'activo' ? 0 : e === 'completado' ? 2 : 1);
      return rank(ea) - rank(eb);
    });
    return copy;
  }, [proyectos]);

  return (
    <Layout>
      <button
        class="btn btn-sm btn-outline-secondary mb-3"
        style={{ borderRadius: '20px' }}
        onClick={() => route('/perfil/' + viewerId)}
      >
        ← Volver
      </button>

      {!isCliente ? (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-2" style={{ color: '#000000e6' }}>
              Aplicaciones de mis proyectos
            </h5>
            <p class="text-muted mb-0 small">Esta sección es solo para clientes (id_rol = 3).</p>
          </div>
        </div>
      ) : loading ? (
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status" />
        </div>
      ) : proyectosOrdenados.length === 0 ? (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4 text-center">
            <div style={{ fontSize: '2rem' }}>📭</div>
            <p class="text-muted mt-2 mb-0">No tienes proyectos aún.</p>
          </div>
        </div>
      ) : (
        <div class="d-flex flex-column gap-4">
          <h5 class="fw-bold" style={{ color: '#000000e6' }}>
            Aplicaciones recibidas
          </h5>
          {proyectosOrdenados.map((p) => {
            const propuestas = porProyecto[p.id_proyecto] || [];

            return (
              <div
                key={p.id_proyecto}
                class="card"
                style={{ border: '1px solid #e0dede', borderRadius: '8px' }}
              >
                <div class="card-body p-4">
                  <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <div
                        class="badge"
                        style={{
                          backgroundColor: '#e8f0fe',
                          color: '#0a66c2',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          textTransform: 'uppercase',
                          letterSpacing: 0.2,
                        }}
                      >
                        {p.estado || 'activo'}
                      </div>
                      <h6 class="fw-bold mt-2 mb-1" style={{ color: '#000000e6' }}>
                        {p.titulo}
                      </h6>
                      <p class="text-muted small mb-0">
                        {p.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div class="text-end">
                      <div class="small text-muted">Presupuesto</div>
                      <div class="fw-bold" style={{ color: '#0a66c2' }}>
                        Q{Number(p.presupuesto || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {propuestas.length === 0 ? (
                    <div class="text-center py-3">
                      <div style={{ fontSize: '1.8rem' }}>📭</div>
                      <div class="text-muted small mt-1">Aún no hay personas que aplicaron.</div>
                    </div>
                  ) : (
                    <div class="table-responsive">
                      <table class="table table-hover align-middle" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th style="width: 38%">Persona</th>
                            <th style="width: 20%">Estado</th>
                            <th style="width: 32%">Propuesta</th>
                            <th style="width: 10%">ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propuestas.map((prop) => {
                            const style = getEstadoBadgeStyle(prop.estado);
                            const freelancer = prop.freelancer;
                            const nombre = freelancer?.nombre || freelancer?.username || null;
                            const email = freelancer?.email || '';
                            return (
                              <tr key={prop.id_freelancer_proyecto || prop.id_freelancer || Math.random()}>
                                <td>
                                  <div class="d-flex align-items-center gap-2">
                                    <div
                                      class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{
                                        width: 34,
                                        height: 34,
                                        backgroundColor: '#e8f0fe',
                                        color: '#0a66c2',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {(nombre?.[0] || 'F').toUpperCase()}
                                    </div>
                                    <div class="min-w-0">
                                      <div class="fw-semibold text-truncate">
                                        {nombre || `Freelancer #${prop.id_freelancer}`}
                                      </div>
                                      {email ? <div class="text-muted small text-truncate">{email}</div> : null}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    class="badge rounded-pill"
                                    style={{
                                      backgroundColor: style.bg,
                                      color: style.color,
                                      fontSize: '0.78rem',
                                    }}
                                  >
                                    {prop.estado || '—'}
                                  </span>
                                </td>
                                <td>
                                  <div
                                    style={{
                                      maxWidth: 520,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={prop.propuesta && String(prop.propuesta).trim() !== '' ? prop.propuesta : 'Sin propuesta'}
                                  >
                                    {prop.propuesta && String(prop.propuesta).trim() !== '' ? prop.propuesta : 'Sin propuesta'}
                                  </div>
                                </td>
                                <td class="text-muted small">{prop.id_freelancer}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}


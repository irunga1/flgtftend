import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyProjectsFreelancer } from '../services/freelancerProyectoService';

import { getProyectoById } from '../services/proyectoService';

function getRoleId(u) {
  if (!u) return null;
  const candidates = [
    u.id_rol, u.rol, u.idRol, u.role,
    u.tipo_usuario, u.id_tipo_usuario, u.idTipoUsuario, u.typeUser,
  ];
  const found = candidates.find((v) => v !== undefined && v !== null && String(v) !== '');
  if (found === undefined) return null;
  const n = Number(found);
  return Number.isFinite(n) ? n : null;
}

export function MisAplicaciones() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const viewerRoleId = getRoleId(authUser);
  const viewerId = authUser?.id ?? authUser?.id_usuario ?? authUser?.userId ?? null;

  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (Number(viewerRoleId) !== 2) {
      setLoading(false);
      return;
    }

    if (!viewerId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [viewerId, viewerRoleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMyProjectsFreelancer(viewerId);
      // Backend ejemplo: { status: 'success', rows: [...] }
      const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];


      // Enriquecer cada aplicación con datos del proyecto
      const enriched = await Promise.all(
        list.map(async (app) => {
          try {
            const p = await getProyectoById(app.id_proyecto);
            return { ...app, proyecto: Array.isArray(p) ? p[0] : p };
          } catch {
            return app;
          }
        })
      );

      setAplicaciones(enriched);
    } catch (e) {
      showToast('Error al cargar tus aplicaciones.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAplicaciones = aplicaciones.filter((app) => {
    if (filterStatus === 'all') return true;
    return String(app.estado).toLowerCase() === filterStatus;
  });

  const getSkills = (app) => {
    return [
      app.skill1,
      app.skill2,
      app.skill3,
      app.skill4,
      app.skill5,
    ].filter((skill) => skill && String(skill).trim() !== '');
  };

  return (
    <Layout>
      <button
        class="btn btn-sm btn-outline-secondary mb-3"
        style={{ borderRadius: '20px' }}
        onClick={() => route('/perfil/' + viewerId)}
      >
        ← Volver
      </button>

      {Number(viewerRoleId) !== 2 ? (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-2" style={{ color: '#000000e6' }}>
              Mis aplicaciones
            </h5>
            <p class="text-muted mb-0 small">Esta sección es solo para freelancers (id_rol = 2).</p>
          </div>
        </div>
      ) : (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3" style={{ color: '#000000e6' }}>
              Mis aplicaciones ({aplicaciones.length})
            </h5>

            <div class="d-flex flex-wrap gap-2 mb-3">
              {['all', 'selected', 'waiting', 'rejected'].map((status) => (
                <button
                  type="button"
                  class={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ borderRadius: '20px', textTransform: 'capitalize' }}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
            </div>

            {loading ? (
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status" />
              </div>
            ) : filteredAplicaciones.length === 0 ? (
              <div class="text-center py-4">
                <div style={{ fontSize: '2rem' }}>📋</div>
                <p class="text-muted mt-2 mb-0">No hay aplicaciones con ese filtro.</p>
              </div>
            ) : (
              <div class="d-flex flex-column gap-3">
                {filteredAplicaciones.map((app) => {
                  const skills = getSkills(app);
                  const title = app.proyecto?.titulo || app.titulo || app.proyecto?.nombre || `Proyecto #${app.id_proyecto}`;
                  const description = app.proyecto?.descripcion || app.descripcion || app.proyecto?.detalles || 'Sin descripción';
                  const clientName = app.nombre || app.proyecto?.nombre || app.proyecto?.cliente_nombre || `Cliente #${app.id_cliente}`;
                  const budget = Number(app.proyecto?.presupuesto || app.presupuesto || 0).toLocaleString();
                  const isHovered = hoveredId === (app.id_freelancer_proyecto ?? app.id_proyecto);

                  return (
                    <div
                      key={app.id_freelancer_proyecto ?? app.id_proyecto}
                      class="d-flex flex-column gap-3 p-3 rounded"
                      style={{
                        backgroundColor:
                          app.estado === 'selected'
                            ? '#fff7e6'
                            : app.estado === 'rejected'
                              ? '#fdecea'
                              : app.estado === 'waiting'
                                ? '#eef4ff'
                                : '#f3f2ef',
                        border: isHovered
                          ? '1px solid rgba(13, 110, 253, 0.45)'
                          : app.estado === 'selected'
                            ? '1px solid #f59e0b'
                            : '1px solid transparent',
                        cursor: 'pointer',
                        boxShadow: isHovered ? '0 16px 30px rgba(15, 23, 42, 0.08)' : 'none',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                        transform: isHovered ? 'translateY(-1px)' : 'none',
                      }}
                      onMouseEnter={() => setHoveredId(app.id_freelancer_proyecto ?? app.id_proyecto)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => route(`/proyectos/${app.id_proyecto}`)}
                    >
                      <div class="d-flex align-items-start gap-3">
                        <div
                          class="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                          style={{ width: 44, height: 44, backgroundColor: '#e8f0fe', fontSize: '1.3rem' }}
                        >
                          💼
                        </div>
                        <div class="flex-grow-1 min-w-0">
                          <div class="fw-semibold" style={{ fontSize: '0.95rem', color: '#0a66c2' }}>
                            {title}
                          </div>
                          <div class="text-muted small mt-1" style={{ whiteSpace: 'pre-line' }}>
                            {description}
                          </div>
                        </div>
                        <div class="text-end flex-shrink-0">
                          <span
                            class="badge rounded-pill d-block mb-2"
                            style={{
                              backgroundColor:
                                app.estado === 'selected'
                                  ? '#fff3c4'
                                  : app.estado === 'waiting'
                                    ? '#e8f0fe'
                                    : app.estado === 'rejected'
                                      ? '#fce8e6'
                                      : '#e8f0fe',
                              color:
                                app.estado === 'selected'
                                  ? '#92400e'
                                  : app.estado === 'waiting'
                                    ? '#0a66c2'
                                    : app.estado === 'rejected'
                                      ? '#b24020'
                                      : '#0a66c2',
                              fontSize: '0.75rem',
                            }}
                          >
                            {app.estado}
                          </span>
                          <div class="small fw-semibold" style={{ color: '#0a66c2', fontWeight: 600 }}>
                            Q{budget}
                          </div>
                        </div>
                      </div>

                      <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mt-2">
                        <div class="small text-muted">Cliente: {clientName}</div>
                        <div class="small text-muted">ID: {app.id_freelancer_proyecto ?? app.id_proyecto}</div>
                      </div>

                      {skills.length > 0 && (
                        <div class="d-flex flex-wrap gap-2 mt-2">
                          {skills.map((skill, index) => (
                            <span
                              key={`${app.id_proyecto}-${index}`}
                              class="badge rounded-pill"
                              style={{ backgroundColor: '#eef2ff', color: '#3730a3', fontSize: '0.75rem' }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

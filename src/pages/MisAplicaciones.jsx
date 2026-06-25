import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAplicaciones } from '../services/aplicarService';
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
      const data = await getAplicaciones(viewerId);
      const list = Array.isArray(data) ? data : [];

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

            {loading ? (
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status" />
              </div>
            ) : aplicaciones.length === 0 ? (
              <div class="text-center py-4">
                <div style={{ fontSize: '2rem' }}>📋</div>
                <p class="text-muted mt-2 mb-0">No has aplicado a ningún proyecto aún.</p>
              </div>
            ) : (
              <div class="d-flex flex-column gap-3">
                {aplicaciones.map((app) => (
                  <div
                    key={app.id_proyecto}
                    class="d-flex align-items-start gap-3 p-3 rounded"
                    style={{ backgroundColor: '#f3f2ef', cursor: 'pointer' }}
                    onClick={() => route(`/proyectos/${app.id_proyecto}`)}
                  >
                    <div
                      class="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 40, height: 40, backgroundColor: '#e8f0fe', fontSize: '1.2rem' }}
                    >
                      💼
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-semibold" style={{ fontSize: '0.9rem', color: '#0a66c2' }}>
                        {app.proyecto?.titulo || `Proyecto #${app.id_proyecto}`}
                      </div>
                      <div class="text-muted small mt-1 text-truncate">
                        {app.proyecto?.descripcion || 'Sin descripción'}
                      </div>
                    </div>
                    <div class="text-end flex-shrink-0">
                      <span
                        class="badge rounded-pill d-block mb-2"
                        style={{
                          backgroundColor:
                            app.estado === 'aceptada'
                              ? '#e6f4ea'
                              : app.estado === 'rechazada'
                              ? '#fce8e6'
                              : '#e8f0fe',
                          color:
                            app.estado === 'aceptada'
                              ? '#057642'
                              : app.estado === 'rechazada'
                              ? '#b24020'
                              : '#0a66c2',
                          fontSize: '0.75rem',
                        }}
                      >
                        {app.estado}
                      </span>
                      <div class="small" style={{ color: '#0a66c2', fontWeight: 600 }}>
                        Q{Number(app.proyecto?.presupuesto || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

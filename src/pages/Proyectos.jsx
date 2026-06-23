import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchFreelancerProyectos } from '../services/freelancerProyectoService';
import { getProyectoById } from '../services/proyectoService';

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

export function Proyectos() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const viewerRoleId = getRoleId(authUser);
  const viewerId = authUser?.id ?? authUser?.id_usuario ?? authUser?.userId ?? null;

  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo consumir /proyectos si id_rol = 3
    if (Number(viewerRoleId) !== 3) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        if (viewerId == null) {
          setProyectos([]);
          return;
        }

        // Endpoint disponible en el proyecto: /freelancer_proyectos/search
        const fpData = await searchFreelancerProyectos({ id_freelancer: viewerId });
        const list = Array.isArray(fpData) ? fpData : [];

        // Enriquecer cada proyecto con su data
        const enriched = await Promise.all(
          list.map(async (fp) => {
            try {
              const p = await getProyectoById(fp.id_proyecto);
              return { ...fp, proyecto: Array.isArray(p) ? p[0] : p };
            } catch {
              return fp;
            }
          })
        );

        setProyectos(enriched);
      } catch (e) {
        showToast('Error al cargar proyectos.', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [viewerId, viewerRoleId]);

  return (
    <Layout>
      <button
        class="btn btn-sm btn-outline-secondary mb-3"
        style={{ borderRadius: '20px' }}
        onClick={() => route('/perfil/' + viewerId)}
      >
        ← Volver
      </button>

      {Number(viewerRoleId) !== 3 ? (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-2" style={{ color: '#000000e6' }}>
              Mis proyecto
            </h5>
            <p class="text-muted mb-0 small">Solo se muestra para clientes (id_rol = 3).</p>
          </div>
        </div>
      ) : (
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3" style={{ color: '#000000e6' }}>
              Mis proyecto ({proyectos.length})
            </h5>

            {loading ? (
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status" />
              </div>
            ) : proyectos.length === 0 ? (
              <div class="text-center py-4">
                <div style={{ fontSize: '2rem' }}>📋</div>
                <p class="text-muted mt-2 mb-0">No tienes proyectos aún.</p>
              </div>
            ) : (
              <div class="d-flex flex-column gap-3">
                {proyectos.map((fp) => (
                  <div
                    key={fp.id_freelancer_proyecto}
                    class="d-flex align-items-start gap-3 p-3 rounded"
                    style={{ backgroundColor: '#f3f2ef', cursor: 'pointer' }}
                    onClick={() => route(`/proyectos/${fp.id_proyecto}`)}
                  >
                    <div
                      class="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 40, height: 40, backgroundColor: '#e8f0fe', fontSize: '1.2rem' }}
                    >
                      💼
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-semibold" style={{ fontSize: '0.9rem', color: '#0a66c2' }}>
                        {fp.proyecto?.titulo || `Proyecto #${fp.id_proyecto}`}
                      </div>
                      <div class="text-muted small mt-1 text-truncate">{fp.propuesta}</div>
                    </div>
                    <span
                      class="badge rounded-pill flex-shrink-0"
                      style={{ backgroundColor: '#e8f0fe', color: '#0a66c2', alignSelf: 'flex-start', fontSize: '0.75rem' }}
                    >
                      {fp.estado}
                    </span>
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


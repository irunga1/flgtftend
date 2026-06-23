import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { getProyectoById } from '../services/proyectoService';
import { searchByProyecto, createFreelancerProyecto } from '../services/freelancerProyectoService';
import { getUserById } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillBadge } from '../components/SkillBadge';


const ESTADO_STYLE = {
  activo:     { bg: '#e6f4ea', color: '#057642' },
  inactivo:   { bg: '#fce8e6', color: '#b24020' },
  completado: { bg: '#e8f0fe', color: '#0a66c2' },
};

export function ProyectoDetalle({ id }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [proyecto,    setProyecto]    = useState(null);
  const [freelancers, setFreelancers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [authError,   setAuthError]   = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [propuesta,   setPropuesta]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!id) { route('/dashboard', true); return; }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setAuthError(false);

    // /proyectos/:id requires auth — load separately so a failure doesn't block freelancers
    try {
      const pData = await getProyectoById(id);
      setProyecto(Array.isArray(pData) ? pData[0] : pData);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(true);
      } else {
        showToast('No se pudo cargar el proyecto.', 'error');
      }
    }

    // /freelancer_proyectos/search has NO auth requirement
    try {
      const fpData = await searchByProyecto(id);
      const enriched = await Promise.all(
        (Array.isArray(fpData) ? fpData : []).map(async (fp) => {
          try {
            const u = await getUserById(fp.id_freelancer);
            return { ...fp, userData: Array.isArray(u) ? u[0] : u };
          } catch {
            return fp;
          }
        })
      );
      setFreelancers(enriched);
    } catch {
      // silently ignore if freelancer list fails
    }

    setLoading(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!propuesta.trim()) { showToast('Escribe tu propuesta antes de enviar.', 'warning'); return; }
    setSubmitting(true);
    try {
      await createFreelancerProyecto({
        id_proyecto:   Number(id),
        id_freelancer: user.id,
        propuesta:     propuesta.trim(),
        estado:        'pendiente',
      });
      showToast('¡Propuesta enviada exitosamente! 🎉', 'success');
      setShowModal(false);
      setPropuesta('');
      loadData();
    } catch {
      showToast('Error al enviar la propuesta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const ec = ESTADO_STYLE[(proyecto?.estado || 'activo').toLowerCase()] || ESTADO_STYLE.activo;

  return (
    <Layout>
      <button
        class="btn btn-sm btn-outline-secondary mb-3"
        style={{ borderRadius: '20px' }}
        onClick={() => route('/dashboard')}
      >
        ← Volver
      </button>

      {/* Auth error banner */}
      {authError && (
        <div
          class="alert d-flex align-items-start gap-2 mb-3"
          style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', color: '#92400e' }}
        >
          <span>⚠️</span>
          <div style={{ fontSize: '0.875rem' }}>
            <strong>Autenticación requerida para ver el proyecto.</strong><br />
            Configura <code>SECRET_KEY</code> en el <code>.env</code> del backend y reinicia el servidor.
          </div>
        </div>
      )}

      {loading ? (
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status" />
          <p class="text-muted mt-2">Cargando proyecto...</p>
        </div>
      ) : !proyecto && !authError ? (
        <div class="text-center py-5">
          <div style={{ fontSize: '2.5rem' }}>❌</div>
          <p class="text-muted mt-2">Proyecto no encontrado.</p>
        </div>
      ) : proyecto ? (
        <>
          {/* Detail card */}
          <div class="card mb-4" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <h4 class="fw-bold mb-0" style={{ color: '#000000e6' }}>{proyecto.titulo}</h4>
                <span class="badge px-3 py-2" style={{ ...ec, borderRadius: '20px', fontSize: '0.83rem' }}>
                  {proyecto.estado || 'activo'}
                </span>
              </div>

              <p class="text-muted mb-4" style={{ lineHeight: 1.7 }}>
                {proyecto.descripcion || 'Sin descripción disponible.'}
              </p>

              <div class="row g-3 mb-4">
                {[
                  { label: 'Presupuesto', value: `Q${Number(proyecto.presupuesto || 0).toLocaleString()}`, color: '#0a66c2' },
                  { label: 'Cliente',     value: proyecto.cliente_nombre || `#${proyecto.id_cliente}`, color: '#333' },
                  { label: 'Interesados', value: freelancers.length,                                       color: '#057642' },
                ].map((item) => (
                  <div class="col-sm-4" key={item.label}>
                    <div class="p-3 rounded text-center" style={{ backgroundColor: '#f3f2ef' }}>
                      <div class="text-muted small">{item.label}</div>
                      <div class="fw-bold fs-5" style={{ color: item.color }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div class="mb-4">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>🔧 Skills</h5>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  {[proyecto.skill1, proyecto.skill2, proyecto.skill3, proyecto.skill4, proyecto.skill5]
                    .filter((s) => s && String(s).trim() !== '')
                    .slice(0, 5)
                    .map((s) => (
                      <SkillBadge key={s} nombre={s} small={false} />
                    ))}
                  {(!proyecto.skill1 && !proyecto.skill2 && !proyecto.skill3 && !proyecto.skill4 && !proyecto.skill5) && (
                    <span class="text-muted">Sin skills registradas.</span>
                  )}
                </div>
              </div>


              <button
                class="btn fw-semibold px-4"
                style={{ backgroundColor: '#0a66c2', color: '#fff', borderRadius: '24px' }}
                onClick={() => setShowModal(true)}
              >
                ✉ Enviar mi propuesta
              </button>
            </div>
          </div>

          {/* Freelancers list */}
          <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
            <div class="card-body p-4">
              <h5 class="fw-bold mb-3" style={{ color: '#000000e6' }}>
                👥 Freelancers interesados ({freelancers.length})
              </h5>
              {freelancers.length === 0 ? (
                <div class="text-center py-4">
                  <div style={{ fontSize: '2rem' }}>🙋</div>
                  <p class="text-muted mt-2 mb-0">Sé el primero en aplicar a este proyecto.</p>
                </div>
              ) : (
                <div class="d-flex flex-column gap-3">
                  {freelancers.map((fp) => (
                    <div
                      key={fp.id_freelancer_proyecto}
                      class="d-flex align-items-start gap-3 p-3 rounded"
                      style={{ backgroundColor: '#f3f2ef' }}
                    >
                      <div
                        class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: '#0a66c2', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}
                      >
                        {fp.userData?.nombre?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-semibold" style={{ fontSize: '0.9rem' }}>
                          {fp.userData?.nombre || `Freelancer #${fp.id_freelancer}`}
                        </div>
                        <div class="text-muted small mb-1">{fp.userData?.email}</div>
                        <div class="small" style={{ color: '#444' }}>{fp.propuesta}</div>
                      </div>
                      <span
                        class="badge rounded-pill flex-shrink-0"
                        style={{ backgroundColor: '#e8f0fe', color: '#0a66c2', alignSelf: 'flex-start' }}
                      >
                        {fp.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Proposal Modal */}
      {showModal && (
        <>
          <div class="modal fade show d-block" tabIndex="-1" role="dialog">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content" style={{ borderRadius: '10px' }}>
                <div class="modal-header" style={{ borderBottom: '1px solid #e0dede' }}>
                  <h5 class="modal-title fw-semibold">Enviar propuesta</h5>
                  <button type="button" class="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <form onSubmit={handleApply}>
                  <div class="modal-body">
                    <p class="text-muted small mb-3">
                      Proyecto: <strong>{proyecto?.titulo}</strong>
                    </p>
                    <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>Tu propuesta</label>
                    <textarea
                      class="form-control"
                      rows={5}
                      placeholder="Describe tu experiencia y por qué eres el candidato ideal..."
                      value={propuesta}
                      onInput={(e) => setPropuesta(e.target.value)}
                      style={{ borderRadius: '6px', resize: 'vertical' }}
                    />
                    <small class="text-muted">{propuesta.length} caracteres</small>
                  </div>
                  <div class="modal-footer" style={{ borderTop: '1px solid #e0dede' }}>
                    <button type="button" class="btn btn-outline-secondary" style={{ borderRadius: '20px' }} onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" class="btn fw-semibold" style={{ backgroundColor: '#0a66c2', color: '#fff', borderRadius: '20px' }} disabled={submitting}>
                      {submitting ? (
                        <span class="d-flex align-items-center gap-2">
                          <span class="spinner-border spinner-border-sm" />Enviando...
                        </span>
                      ) : 'Enviar propuesta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="modal-backdrop fade show" />
        </>
      )}
    </Layout>
  );
}

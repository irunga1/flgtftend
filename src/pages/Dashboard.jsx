import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { ProyectoCard } from '../components/ProyectoCard';
import { FreelancerCard } from '../components/FreelancerCard';
import { SkillBadge } from '../components/SkillBadge';
import { SkillsMultiSelect } from '../components/SkillsMultiSelect';

import { getProyectos } from '../services/proyectoService';
import { searchUsers } from '../services/userService';
import { getSkills } from '../services/skillService';
import { searchUsuarioSkills } from '../services/usuarioSkillService';
import { aplicarProyecto } from '../services/aplicarService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const FILTERS = ['todos', 'activo', 'inactivo', 'completado'];
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getRoleId(u) {
  if (!u) return null;
  const candidates = [
    u.id_rol, u.rol, u.idRol, u.role,
    u.tipo_usuario, u.id_tipo_usuario, u.idTipoUsuario, u.typeUser,
  ];
  const found = candidates.find((v) => v !== undefined && v !== null && String(v) !== '');
  if (found === undefined) return null;
  const s = String(found).toLowerCase();
  if (s === 'freelancer') return 2;
  if (s === 'cliente' || s === 'client') return 3;
  if (s === 'admin' || s === 'administrador') return 1;
  const n = Number(found);
  return Number.isFinite(n) ? n : null;
}

export function Dashboard({ url }) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const viewerRoleId = getRoleId(user);
  const viewerId = user?.id ?? user?.id_usuario ?? user?.userId ?? null;

  const [proyectos, setProyectos] = useState([]);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [freelancerSkillsMap, setFreelancerSkillsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedFreelancerSkills, setSelectedFreelancerSkills] = useState([]);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [propuesta, setPropuesta] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCliente = Number(viewerRoleId) === 3;
  const isFreelancer = Number(viewerRoleId) === 2;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q !== null) setSearch(decodeURIComponent(q));
  }, [url]);

  const loadData = async () => {
    setLoading(true);
    setAuthError(null);

    if (isCliente) {
      try {
        const u = await searchUsers({ id_rol: 2 });
        setUsers(Array.isArray(u) ? u : []);
      } catch {
        setUsers([]);
      }
      try {
        const allSkills = await searchUsuarioSkills();
        const map = {};
        for (const sk of Array.isArray(allSkills) ? allSkills : []) {
          if (!map[sk.id_usuario]) map[sk.id_usuario] = [];
          map[sk.id_usuario].push(sk);
        }
        setFreelancerSkillsMap(map);
      } catch {
        setFreelancerSkillsMap({});
      }
    } else {
      setUsers([]);
    }

    try {
      if (isCliente || isFreelancer) {
        if (viewerId === null) {
          setProyectos([]);
          setSkills([]);
          setUsers([]);
          return;
        }
        const p = await getProyectos();
        setProyectos(Array.isArray(p) ? p : []);
      } else {
        const p = await getProyectos();
        setProyectos(Array.isArray(p) ? p : []);
      }

      if (!isCliente) {
        const s = await getSkills();
        setSkills(Array.isArray(s) ? s : []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(
          `El backend rechazó el token (401). Asegúrate de tener SECRET_KEY configurado en el archivo .env del backend (${BASE_URL}).`
        );
      } else if (!err.response) {
        setAuthError(`No se pudo conectar con el backend. ¿Está corriendo en ${BASE_URL}?`);
      } else {
        showToast('Error al cargar proyectos y skills.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const openProyectoModal = (proyecto) => {
    setSelectedProyecto(proyecto);
    setPropuesta('');
  };

  const closeProyectoModal = () => {
    setSelectedProyecto(null);
    setPropuesta('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!propuesta.trim()) { showToast('Escribe tu propuesta antes de enviar.', 'warning'); return; }
    setSubmitting(true);
    try {
      await aplicarProyecto(viewerId, Number(selectedProyecto.id_proyecto), propuesta.trim());
      showToast('¡Propuesta enviada exitosamente! 🎉', 'success');
      closeProyectoModal();
    } catch (err) {
      const msg = err.response?.data?.desc || 'Error al enviar la propuesta.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = proyectos.filter((p) => {
    const okFilter = filter === 'todos' || (p.estado || 'activo').toLowerCase() === filter;
    const okSearch = !search
      || p.titulo?.toLowerCase().includes(search.toLowerCase())
      || p.descripcion?.toLowerCase().includes(search.toLowerCase());
    const selectedNames = (selectedSkills || []).map((s) => String(s.nombre || '').trim().toLowerCase()).filter(Boolean);
    const okSkill = selectedNames.length === 0
      || [p.skill1, p.skill2, p.skill3, p.skill4, p.skill5]
        .filter((s) => s && String(s).trim() !== '')
        .map((s) => String(s).toLowerCase())
        .some((projSkillName) => selectedNames.includes(projSkillName));
    return okFilter && okSearch && okSkill;
  });

  // Skills únicas de todos los freelancers cargados
  const allFreelancerSkills = Object.values(freelancerSkillsMap).flat().reduce((acc, sk) => {
    if (!acc.some((x) => x.id_skill === sk.id_skill)) acc.push(sk);
    return acc;
  }, []);

  const selectedFreelancerSkillNames = selectedFreelancerSkills.map((s) => String(s.nombre || '').toLowerCase());

  const filteredUsers = selectedFreelancerSkillNames.length === 0
    ? users
    : users.filter((u) => {
        const userSkills = (freelancerSkillsMap[u.id_usuario] || []).map((s) => String(s.nombre || '').toLowerCase());
        return selectedFreelancerSkillNames.every((name) => userSkills.includes(name));
      });

  const stats = [
    { label: 'Proyectos', value: proyectos.length, icon: '💼', color: '#0a66c2' },
    { label: 'Activos', value: proyectos.filter((p) => p.estado === 'activo').length, icon: '✅', color: '#057642' },
    ...(isCliente ? [{ label: 'Freelancers', value: users.length, icon: '👥', color: '#915907' }] : []),
    ...(!isCliente ? [{ label: 'Skills', value: skills.length, icon: '🔧', color: '#6b46c1' }] : []),
  ];

  return (
    <Layout>
      {authError && (
        <div
          class="alert d-flex align-items-start gap-3 mb-4"
          style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', color: '#92400e' }}
          role="alert"
        >
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</span>
          <div class="flex-grow-1">
            <div class="fw-semibold mb-1">Error de autenticación con el backend</div>
            <div style={{ fontSize: '0.875rem' }}>{authError}</div>
          </div>
          <button
            class="btn btn-sm"
            style={{ backgroundColor: '#f59e0b', color: '#fff', borderRadius: '20px', flexShrink: 0 }}
            onClick={loadData}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Accesos rápidos (reemplaza Proyectos activos y Skills) */}
      <div class="card mb-4" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>⚡ Accesos rápidos</h5>
            <div class="d-flex gap-2 flex-wrap">
              {stats.slice(0, 3).map((s) => (
                <div key={s.label} class="d-flex flex-column align-items-center px-2" style={{ minWidth: 72 }}>
                  <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{s.icon}</div>
                  <div class="fw-bold" style={{ color: s.color }}>{s.value}</div>
                  <small class="text-muted" style={{ fontSize: '0.7rem' }}>{s.label}</small>
                </div>
              ))}
            </div>
          </div>

          <div class="row g-2">
            {(
              [
                { icon: '📋', label: 'Todos los proyectos', path: '/dashboard' },
                { icon: '👥', label: 'Freelancers', path: '/dashboard' },
                { icon: '🔧', label: 'Catálogo de skills', path: '/dashboard' },
                ...(isFreelancer ? [{ icon: '📮', label: 'Mis aplicaciones', path: '/mis-aplicaciones' }] : []),
                ...(isCliente ? [
                  { icon: '💼', label: 'Mis proyectos', path: '/proyectos' },
                  { icon: '🧾', label: 'Aplicaciones de mis proyectos', path: '/proyectos-aplicaciones' },
                ] : []),
              ]
            ).map((l) => (
              <div class="col-12 col-sm-6 col-lg-4" key={l.label}>
                <button
                  class="btn btn-outline-primary w-100"
                  style={{ borderRadius: '14px', borderWidth: 1 }}
                  onClick={() => (window.location.href = l.path)}
                >
                  <span style={{ fontSize: '1.05rem' }}>{l.icon}</span>
                  <span class="ms-2" style={{ fontWeight: 600 }}>{l.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Freelancers registrados: solo para clientes, va primero */}
      {isCliente && (
        <div class="card mb-4" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>
                👥 Freelancers registrados ({filteredUsers.length}{filteredUsers.length !== users.length ? `/${users.length}` : ''})
              </h5>
            </div>

            {!loading && allFreelancerSkills.length > 0 && (
              <div class="mb-3" style={{ maxWidth: 400 }}>
                <SkillsMultiSelect
                  allSkills={allFreelancerSkills}
                  selectedSkills={selectedFreelancerSkills}
                  onChange={setSelectedFreelancerSkills}
                  placeholder="Filtrar por skill..."
                />
              </div>
            )}

            {loading ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status" />
                <p class="text-muted mt-2 mb-0">Cargando freelancers...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div class="text-center py-5">
                <div style={{ fontSize: '2.5rem' }}>📭</div>
                <p class="text-muted mt-2 mb-0">
                  {users.length === 0 ? 'No hay freelancers registrados aún.' : 'Ningún freelancer tiene las skills seleccionadas.'}
                </p>
              </div>
            ) : (
              <div class="row g-3">
                {filteredUsers.map((u) => (
                  <div class="col-12 col-md-6 col-xl-4" key={u.id_usuario}>
                    <FreelancerCard user={u} skills={freelancerSkillsMap[u.id_usuario] || []} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects feed */}
      {!isCliente && !isFreelancer ? (
        <div class="card mb-4" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>💼 Proyectos disponibles ({proyectos.length})</h5>
              <div class="d-flex gap-1 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    class={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '20px', fontSize: '0.78rem' }}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div class="d-flex flex-column flex-sm-row align-items-stretch gap-2 mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="🔍 Buscar proyectos por título o descripción..."
                value={search}
                onInput={(e) => setSearch(e.target.value)}
                style={{ borderRadius: '20px', fontSize: '0.875rem' }}
              />
              <div style={{ flex: '1 1 320px' }}>
                <label class="form-label small fw-semibold mb-1">Skills</label>
                <SkillsMultiSelect
                  allSkills={skills}
                  selectedSkills={selectedSkills}
                  disabled={loading || skills.length === 0}
                  onChange={setSelectedSkills}
                  placeholder="Buscar y seleccionar skills..."
                />
              </div>
            </div>

            {loading ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status" />
                <p class="text-muted mt-2 mb-0">Cargando proyectos...</p>
              </div>
            ) : authError && proyectos.length === 0 ? (
              <div class="text-center py-5">
                <div style={{ fontSize: '2.5rem' }}>🔒</div>
                <p class="text-muted mt-2 mb-0">No se pudieron cargar los proyectos (requieren auth).</p>
              </div>
            ) : filtered.length === 0 ? (
              <div class="text-center py-5">
                <div style={{ fontSize: '2.5rem' }}>📭</div>
                <p class="text-muted mt-2 mb-0">No se encontraron proyectos con ese criterio.</p>
              </div>
            ) : (
              <div class="row g-3">
                {filtered.map((p) => (
                  <div class="col-12 col-md-6 col-xl-4" key={p.id_proyecto}>
                    <ProyectoCard proyecto={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="card mb-4" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>
                💼 {isFreelancer ? `Proyectos Publicados (${proyectos.length})` : 'Mis proyectos publicados'}
              </h5>
              <div class="d-flex gap-1 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    class={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '20px', fontSize: '0.78rem' }}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div class="d-flex flex-column flex-sm-row align-items-stretch gap-2 mb-3">
              <input
                type="text"
                class="form-control"
                placeholder={isFreelancer ? '🔍 Buscar en proyectos publicados...' : '🔍 Buscar en tus proyectos aplicados...'}
                value={search}
                onInput={(e) => setSearch(e.target.value)}
                style={{ borderRadius: '20px', fontSize: '0.875rem' }}
              />
              {isFreelancer && (
                <div style={{ flex: '1 1 280px' }}>
                  <SkillsMultiSelect
                    allSkills={skills}
                    selectedSkills={selectedSkills}
                    disabled={loading || skills.length === 0}
                    onChange={setSelectedSkills}
                    placeholder="Filtrar por skill..."
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status" />
                <p class="text-muted mt-2 mb-0">Cargando proyectos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div class="text-center py-5">
                <div style={{ fontSize: '2.5rem' }}>📭</div>
                <p class="text-muted mt-2 mb-0">{isFreelancer ? 'No hay proyectos publicados con ese criterio.' : 'No tienes proyectos aplicados con ese criterio.'}</p>
              </div>
            ) : (
              <div class="row g-3">
                {filtered.map((p) => (
                  <div class="col-12 col-md-6 col-xl-4" key={p.id_proyecto}>
                    <ProyectoCard proyecto={p} onCardClick={isFreelancer ? openProyectoModal : undefined} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalle de proyecto */}
      {selectedProyecto && (() => {
        const ec = { activo: { bg: '#e6f4ea', color: '#057642' }, inactivo: { bg: '#fce8e6', color: '#b24020' }, completado: { bg: '#e8f0fe', color: '#0a66c2' } };
        const estadoStyle = ec[(selectedProyecto.estado || 'activo').toLowerCase()] || ec.activo;
        const proySkills = [selectedProyecto.skill1, selectedProyecto.skill2, selectedProyecto.skill3, selectedProyecto.skill4, selectedProyecto.skill5].filter((s) => s && String(s).trim() !== '');
        return (
          <>
            <div class="modal fade show d-block" tabIndex="-1" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) closeProyectoModal(); }}>
              <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content" style={{ borderRadius: '10px' }}>
                  <div class="modal-header" style={{ borderBottom: '1px solid #e0dede' }}>
                    <div class="d-flex align-items-center gap-3 flex-wrap flex-grow-1 me-3">
                      <h5 class="modal-title fw-bold mb-0" style={{ color: '#000000e6' }}>{selectedProyecto.titulo}</h5>
                      <span class="badge" style={{ ...estadoStyle, borderRadius: '20px', fontSize: '0.75rem', padding: '4px 12px' }}>
                        {selectedProyecto.estado || 'activo'}
                      </span>
                    </div>
                    <button type="button" class="btn-close" onClick={closeProyectoModal} />
                  </div>

                  <div class="modal-body p-4">
                    <pre class="text-muted mb-4" style={{ lineHeight: 1.7 }}>
                      {selectedProyecto.descripcion || 'Sin descripción disponible.'}
                    </pre>

                    <div class="row g-3 mb-4">
                      <div class="col-sm-6">
                        <div class="p-3 rounded text-center" style={{ backgroundColor: '#f3f2ef' }}>
                          <div class="text-muted small">Presupuesto</div>
                          <div class="fw-bold fs-5" style={{ color: '#0a66c2' }}>Q{Number(selectedProyecto.presupuesto || 0).toLocaleString()}</div>
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="p-3 rounded text-center" style={{ backgroundColor: '#f3f2ef' }}>
                          <div class="text-muted small">Cliente</div>
                          <div class="fw-bold fs-5" style={{ color: '#333' }}>{selectedProyecto.cliente_nombre || `#${selectedProyecto.id_cliente}`}</div>
                        </div>
                      </div>
                    </div>

                    {proySkills.length > 0 && (
                      <div class="mb-4">
                        <div class="fw-semibold mb-2" style={{ fontSize: '0.9rem', color: '#555' }}>🔧 Skills requeridas</div>
                        <div class="d-flex flex-wrap gap-2">
                          {proySkills.map((s) => <SkillBadge key={s} nombre={s} small={false} />)}
                        </div>
                      </div>
                    )}

                    {isFreelancer && (
                      <form onSubmit={handleApply}>
                        <div class="mb-1">
                          <label class="form-label fw-semibold" style={{ fontSize: '0.9rem' }}>Propuesta</label>
                          <textarea
                            class="form-control"
                            rows={5}
                            placeholder="Describe tu experiencia y por qué eres el candidato ideal para este proyecto..."
                            value={propuesta}
                            onInput={(e) => setPropuesta(e.target.value)}
                            style={{ borderRadius: '6px', resize: 'vertical' }}
                          />
                          <small class="text-muted">{propuesta.length} caracteres</small>
                        </div>
                      </form>
                    )}
                  </div>

                  <div class="modal-footer" style={{ borderTop: '1px solid #e0dede' }}>
                    <button type="button" class="btn btn-outline-secondary" style={{ borderRadius: '20px' }} onClick={closeProyectoModal}>
                      Cerrar
                    </button>
                    {isFreelancer && (
                      <button
                        type="button"
                        class="btn fw-semibold"
                        style={{ backgroundColor: '#0a66c2', color: '#fff', borderRadius: '20px' }}
                        disabled={submitting}
                        onClick={handleApply}
                      >
                        {submitting ? (
                          <span class="d-flex align-items-center gap-2">
                            <span class="spinner-border spinner-border-sm" />Enviando...
                          </span>
                        ) : '✉ Aplicar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-backdrop fade show" />
          </>
        );
      })()}
    </Layout>
  );
}

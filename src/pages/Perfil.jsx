 import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { getPerfil, updatePerfil } from '../services/perfilService';
import { getUsuarioSkills, deleteUsuarioSkill } from '../services/usuarioSkillService';
import { searchFreelancerProyectos, getMyProjectsClient } from '../services/freelancerProyectoService';
import { getProyectoById, getProyectos } from '../services/proyectoService';

import { getUserById } from '../services/userService';
import { getSkills } from '../services/skillService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillsMultiSelect } from '../components/SkillsMultiSelect';


const COLORS = ['#0a66c2', '#057642', '#b24020', '#915907', '#6b46c1'];

function initials(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

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

function roleLabel(roleId) {
  switch (Number(roleId)) {
    case 1: return 'Admin';
    case 2: return 'Freelancer';
    case 3: return 'Cliente';
    default: return 'Sin rol';
  }
}

export function Perfil({ id }) {
  const { user: authUser, setAuth } = useAuth();
  const { showToast } = useToast();

  const [user,      setUser]      = useState(null);
  const [skills,    setSkills]    = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Profile edit form
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ nombre: '', email: '', descripcion: '', password: '', confirm: '' });
  const [saving,   setSaving]   = useState(false);

  // Skills form
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillBusy,       setSkillBusy]       = useState(false);



  const ownerId = authUser?.id ?? authUser?.id_usuario ?? authUser?.userId ?? null;
  const isOwner = ownerId !== null && String(ownerId) === String(id);


  // authUser (del token/localStorage) puede no traer rol.
  // Por eso, el rol para condicionar UI lo tomaremos desde `user` (cuando esté cargado).
  const roleFromUser = getRoleId(user);
  const viewerRoleId = Number.isFinite(roleFromUser) ? roleFromUser : getRoleId(authUser);


  useEffect(() => {
    if (!id) { route('/dashboard', true); return; }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfilData, usuSkillsData] = await Promise.all([
        getPerfil(id),
        getUsuarioSkills({ id_usuario: id }).catch(() => []),
      ]);

      // User data — fallback to /users/:id if /perfil returns user: null
      let userData = perfilData?.user || null;
      if (!userData) {
        try {
          const u = await getUserById(id);
          userData = Array.isArray(u) ? u[0] : u;
        } catch { /* ignore */ }
      }
      setUser(userData);

      if (userData) {
        setForm((f) => ({
          ...f,
          nombre: userData.nombre || '',
          email: userData.email || '',
          // Backend devuelve "descripcion" dentro de user
          descripcion: userData.descripcion ?? '',
        }));
      }

      // Merge skills with id_usuario_skill from /usuario_skills
      const perfilSkills = Array.isArray(perfilData?.skills) ? perfilData.skills : [];
      const usuSkills    = Array.isArray(usuSkillsData) ? usuSkillsData : [];
      const merged = perfilSkills.map((s) => {
        const match = usuSkills.find((us) => Number(us.id_skill) === Number(s.id_skill));
        return { ...s, id_usuario_skill: match?.id_usuario_skill ?? null };
      });
      setSkills(merged);

      // Skill catalog — requires auth, graceful fail
      try {
        const cat = await getSkills();
        setAllSkills(Array.isArray(cat) ? cat : []);
      } catch { setAllSkills([]); }

      // Projects for Cliente (id_rol === 3): use endpoint that returns the client's own published projects
      if (Number(viewerRoleId) === 3) {
        const data = await getMyProjectsClient(id);
        // Can come as array directly or embedded (items/proyectos).
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.proyectos)
            ? data.proyectos
            : Array.isArray(data?.items)
              ? data.items
              : [];

        const publishedList = normalized
          .map((item) => item?.proyecto || item?.proyectoData || item)
          .filter(Boolean);

        setProyectos(publishedList);
      } else {

        // Default previous behavior for other roles (keep for compatibility)
        const fpData = await searchFreelancerProyectos({ id_freelancer: id });
        const list = Array.isArray(fpData) ? fpData : [];
        const enriched = await Promise.all(
          list.map(async (fp) => {
            try {
              const proj = await getProyectoById(fp.id_proyecto);
              return { ...fp, proyecto: Array.isArray(proj) ? proj[0] : proj };
            } catch {
              return fp;
            }
          })
        );
        setProyectos(enriched);
      }
    } catch {
      showToast('Error al cargar el perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reload only the skills list (after add/remove)
  const reloadSkills = async () => {
    const [perfilData, usuSkillsData] = await Promise.all([
      getPerfil(id),
      getUsuarioSkills({ id_usuario: id }).catch(() => []),
    ]);
    const perfilSkills = Array.isArray(perfilData?.skills) ? perfilData.skills : [];
    const usuSkills    = Array.isArray(usuSkillsData) ? usuSkillsData : [];
    const merged = perfilSkills.map((s) => {
      const match = usuSkills.find((us) => Number(us.id_skill) === Number(s.id_skill));
      return { ...s, id_usuario_skill: match?.id_usuario_skill ?? null };
    });
    setSkills(merged);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) {
      showToast('Las contraseñas no coinciden.', 'warning');
      return;
    }
    if (form.password && form.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id_usuario:     Number(id),
        nombre:         form.nombre.trim(),
        email:          form.email.trim(),
        descripcion:    form.descripcion?.trim() ?? '',
        skillsToAdd:    [],
        skillsToDelete: [],
      };
      if (form.password) payload.password = form.password;

      await updatePerfil(payload);

      // Keep the Navbar name in sync if it's the owner
      if (isOwner) {
        const token = localStorage.getItem('token');
        setAuth({ ...authUser, nombre: payload.nombre, email: payload.email }, token);
      }

      showToast('Perfil actualizado.', 'success');
      setEditing(false);
      setForm((f) => ({ ...f, password: '', confirm: '' }));
      await loadData();
    } catch (err) {
      showToast(`Error al guardar: ${err?.response?.data?.message || err?.message || 'desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkills = async () => {
    if (!selectedSkills?.length) return;
    setSkillBusy(true);
    try {
      const existingIds = new Set((skills || []).map((s) => String(s.id_skill)));
      const toAdd = selectedSkills
        .filter((s) => !existingIds.has(String(s.id_skill)))
        .map((s) => ({ id_skill: Number(s.id_skill) }));

      if (toAdd.length === 0) {
        showToast('No hay skills nuevas para agregar.', 'warning');
        return;
      }

      await updatePerfil({
        id_usuario: Number(id),
        skillsToAdd: toAdd,
        skillsToDelete: [],
      });

      await reloadSkills();

      // Clear selection after save
      setSelectedSkills([]);
      showToast('Skills agregadas.', 'success');
    } catch (err) {
      showToast(`Error al agregar: ${err?.response?.data?.message || err?.message || 'desconocido'}`, 'error');
    } finally {
      setSkillBusy(false);
    }
  };


  const handleRemoveSkill = async (skill) => {
    if (!skill.id_usuario_skill) {
      showToast('No se puede eliminar: id_usuario_skill no encontrado.', 'error');
      return;
    }

    setSkillBusy(true);
    try {
      await deleteUsuarioSkill(skill.id_usuario_skill);
      await reloadSkills();
      showToast('Skill eliminada.', 'success');
    } catch (err) {
      showToast(`Error al eliminar: ${err?.response?.data?.message || err?.message || 'desconocido'}`, 'error');
    } finally {
      setSkillBusy(false);
    }
  };

  const bg = COLORS[(Number(id) || 0) % COLORS.length];

  return (
    <Layout>
      <button
        class="btn btn-sm btn-outline-secondary mb-3"
        style={{ borderRadius: '20px' }}
        onClick={() => route('/dashboard')}
      >

        ← Volver
      </button>

      {loading ? (
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status" />
        </div>
      ) : !user ? (
        <div class="text-center py-5">
          <div style={{ fontSize: '2.5rem' }}>👤</div>
          <p class="text-muted mt-2">Usuario no encontrado.</p>
        </div>
      ) : (
        <>
          {/* ── Profile header card ── */}
          <div class="card mb-3 overflow-hidden" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg, #0a66c2, #0073b1)' }} />
            <div class="card-body pt-0 px-4 pb-4">
              {/* Avatar row */}
              <div class="d-flex align-items-end justify-content-between mb-3">
                <div
                  class="d-flex align-items-center justify-content-center rounded-circle border border-4 border-white flex-shrink-0"
                  style={{ width: 80, height: 80, marginTop: -40, backgroundColor: bg, color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}
                >
                  {initials(user.nombre)}
                </div>
                {isOwner && !editing && (
                  <button
                    class="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: '20px' }}
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Editar perfil
                  </button>
                )}
              </div>

              {editing ? (
                /* ── Edit form ── */
                <form onSubmit={handleSave} autoComplete="off">
                  <div class="row g-3 mb-3">
                    <div class="col-12">
                      <label class="form-label small fw-semibold">Descripción</label>
                      <textarea
                        class="form-control"
                        value={form.descripcion}
                        onInput={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Cuéntanos brevemente sobre ti"
                        style={{ minHeight: 110, resize: 'vertical' }}
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-semibold">Nombre completo</label>
                      <input
                        type="text"
                        class="form-control"
                        value={form.nombre}
                        onInput={(e) => setForm({ ...form, nombre: e.target.value })}
                        required
                        minLength={2}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-semibold">Correo electrónico</label>
                      <input
                        type="email"
                        name="profile_email"
                        autoComplete="email"
                        class="form-control"
                        value={form.email}
                        onInput={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div class="col-12">
                      <hr class="my-1" />
                      <p class="small text-muted mb-2">Cambiar contraseña — deja en blanco para mantener la actual</p>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-semibold">Nueva contraseña</label>
                      <input
                        type="password"
                        name="profile_new_password"
                        class="form-control"
                        value={form.password}
                        onInput={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-semibold">
                        Confirmar contraseña
                        {form.password && form.confirm && form.password !== form.confirm && (
                          <span class="text-danger ms-1 small">✗ no coinciden</span>
                        )}
                        {form.password && form.confirm && form.password === form.confirm && (
                          <span class="text-success ms-1 small">✓</span>
                        )}
                      </label>
                      <input
                        type="password"
                        name="profile_confirm_password"
                        class="form-control"
                        value={form.confirm}
                        onInput={(e) => setForm({ ...form, confirm: e.target.value })}
                        placeholder="Repite la nueva contraseña"
                        disabled={!form.password}
                        autoComplete="new-password"
                        readOnly={!form.password}
                      />
                    </div>
                  </div>
                  <div class="d-flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      style={{ borderRadius: '20px' }}
                      disabled={saving}
                    >
                      {saving ? (
                        <span class="d-flex align-items-center gap-2">
                          <span class="spinner-border spinner-border-sm" />
                          Guardando...
                        </span>
                      ) : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      style={{ borderRadius: '20px' }}
                      disabled={saving}
                      onClick={() => {
                        setEditing(false);
                        setForm({ nombre: user.nombre || '', email: user.email || '', password: '', confirm: '' });
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                /* ── View mode ── */
                <>
                  <h4 class="fw-bold mb-1" style={{ color: '#000000e6' }}>{user.nombre}</h4>

                  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <p class="text-muted mb-0">{user.email}</p>
                    <span
                      class="badge rounded-pill"
                      style={{
                        backgroundColor: '#e8f0fe',
                        color: '#0a66c2',
                        border: '1px solid #0a66c244',
                        fontWeight: 700,
                      }}
                    >
                      {roleLabel(getRoleId(user))}
                    </span>
                  </div>

                  <div class="d-flex gap-4 flex-wrap">
                    <div>
                      <div class="fw-bold" style={{ color: '#0a66c2', fontSize: '1.2rem' }}>
                        {Number(viewerRoleId) === 3 ? proyectos.length : '—'}
                      </div>
                      <small class="text-muted">Mis proyectos</small>
                    </div>

                    <div>
                      <div class="fw-bold" style={{ color: '#057642', fontSize: '1.2rem' }}>
                        {Number(viewerRoleId) === 3
                          ? proyectos.filter((p) => p.estado === 'aceptado').length
                          : '—'}
                      </div>
                      <small class="text-muted">Aceptados</small>
                    </div>

                    <div>
                      <div class="fw-bold" style={{ color: '#6b46c1', fontSize: '1.2rem' }}>{skills.length}</div>
                      <small class="text-muted">Skills</small>
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>

          {/* ── Skills card ── */}
          {Number(viewerRoleId) === 2 && (
            <div class="card mb-3" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
              <div class="card-body p-4">
                <h5 class="fw-bold mb-3" style={{ color: '#000000e6' }}>🔧 Skills ({skills.length})</h5>

                {/* Add skill (solo puede agregar/quitar si es Freelancer (id_rol=2) y además es el owner) */}
                {isOwner && Number(viewerRoleId) === 2 && (

                <div
                  class="d-flex flex-wrap gap-2 align-items-end mb-3 p-3 rounded"
                  style={{ backgroundColor: '#f3f2ef' }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <label class="form-label small fw-semibold mb-1">Skills</label>

                    <SkillsMultiSelect
                      allSkills={allSkills}
                      selectedSkills={selectedSkills}
                      disabled={skillBusy}
                      onChange={setSelectedSkills}
                      placeholder="Buscar skill..."
                    />
                  </div>

                  <button
                    class="btn btn-primary btn-sm px-3"
                    style={{ borderRadius: '20px', flexShrink: 0 }}
                    disabled={skillBusy || selectedSkills.length === 0}
                    onClick={handleAddSkills}
                  >
                    {skillBusy ? '...' : '+ Agregar'}
                  </button>
                </div>
              )}


              {skills.length === 0 ? (
                <p class="text-muted mb-0 small">Sin skills registradas.</p>
              ) : (
                <div class="d-flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <div
                      key={s.id_skill}
                      class="d-flex align-items-center gap-1 rounded-pill px-3 py-1"
                      style={{ backgroundColor: '#e8f0fe', border: '1px solid #0a66c244' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0a66c2' }}>{s.nombre}</span>
                      {isOwner && (
                        <button
                          type="button"
                          class="btn-close ms-1"
                          style={{ width: '0.6rem', height: '0.6rem', fontSize: '0.55rem', opacity: 0.55 }}
                          aria-label="Quitar skill"
                          disabled={skillBusy}
                          onClick={() => handleRemoveSkill(s)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* ── Mis proyecto card ── */}

          {(Number(viewerRoleId) === 3) ? (
            <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
              <div class="card-body p-4">
                <h5 class="fw-bold mb-3" style={{ color: '#000000e6' }}>💼 Mis proyecto ({proyectos.length})</h5>
                {proyectos.length === 0 ? (
                  <div class="text-center py-4">
                    <div style={{ fontSize: '2rem' }}>📋</div>
                    <p class="text-muted mt-2 mb-0">No tienes proyectos aún.</p>
                  </div>
                ) : (
                  <div class="d-flex flex-column gap-3">
                    {proyectos.map((p) => (
                      <div
                        key={p.id_proyecto}
                        class="d-flex align-items-start gap-3 p-3 rounded"
                        style={{ backgroundColor: '#f3f2ef', cursor: 'pointer' }}
                        onClick={() => route(`/proyectos/${p.id_proyecto}`)}
                      >
                        <div
                          class="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                          style={{ width: 40, height: 40, backgroundColor: '#e8f0fe', fontSize: '1.2rem' }}
                        >
                          💼
                        </div>
                        <div class="flex-grow-1 min-w-0">
                          <div class="fw-semibold" style={{ fontSize: '0.9rem', color: '#0a66c2' }}>
                            {p.titulo || `Proyecto #${p.id_proyecto}`}
                          </div>
                          <div class="text-muted small mt-1 text-truncate">{p.descripcion || p.propuesta || ''}</div>
                        </div>
                        <span
                          class="badge rounded-pill flex-shrink-0"
                          style={{ backgroundColor: '#e8f0fe', color: '#0a66c2', alignSelf: 'flex-start', fontSize: '0.75rem' }}
                        >
                          {p.estado || 'activo'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
              <div class="card-body p-4">
                <h5 class="fw-bold mb-2" style={{ color: '#000000e6' }}>💼 Mis proyecto</h5>
                <p class="text-muted mb-0 small">Solo se muestra si tu rol es Cliente (id_rol = 3).</p>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}



import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from '../services/proyectoService';
import {
  searchByProyecto,
  updateFreelancerProyecto,
  getMyProjectsClient,
  selectedFreelancerProyecto,
} from '../services/freelancerProyectoService';

import { getUserById } from '../services/userService';
import { getSkills } from '../services/skillService';
import { SkillsMultiSelect } from '../components/SkillsMultiSelect';
import { MisProyectosTable } from './MisProyectosTable';

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

const ESTADO_OPTIONS = ['abierto', 'inactivo', 'completado'];

export function Proyectos() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const viewerRoleId = getRoleId(authUser);
  const viewerId = authUser?.id ?? authUser?.id_usuario ?? authUser?.userId ?? null;

  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Proyectos + apps del cliente (endpoint myprojectscl)
  const [myProjectsWithApps, setMyProjectsWithApps] = useState([]);
  const [myProjectsLoading, setMyProjectsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    presupuesto: '',
    estado: 'activo',
    // skill1..skill5 deben ser SIEMPRE id_skill
    skill1: '',
    skill2: '',
    skill3: '',
    skill4: '',
    skill5: '',
  });

  const coerceSkillValueToId = (raw) => {
    if (raw === undefined || raw === null || raw === '') return '';

    // si viene como id numérico/string numérica
    const asStr = String(raw).trim();
    if (asStr !== '' && /^\d+$/.test(asStr)) return asStr;

    // si viene como nombre (ej: "Javascript")
    if (allSkills?.length) {
      const found = allSkills.find((s) => String(s?.nombre || '').trim().toLowerCase() === asStr.toLowerCase());
      if (found?.id_skill !== undefined && found?.id_skill !== null) return String(found.id_skill);
    }

    return '';
  };
  const [submitting, setSubmitting] = useState(false);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  
  // Propuestas recibidas
  const [showPropuestasModal, setShowPropuestasModal] = useState(false);
  const [propuestasDelProyecto, setPropuestasDelProyecto] = useState([]);
  const [propuestasLoading, setPropuestasLoading] = useState(false);
  const [selectedProyectoForPropuestas, setSelectedProyectoForPropuestas] = useState(null);

  useEffect(() => {
    if (Number(viewerRoleId) !== 3) {
      setLoading(false);
      return;
    }
    loadData();
  }, [viewerId, viewerRoleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar proyectos + apps del cliente (mixto) para rol 3
      if (Number(viewerRoleId) === 3 && viewerId !== null) {

        setMyProjectsLoading(true);
        try {
          const data = await getMyProjectsClient(viewerId);

          // Endpoint: GET /freelancer_proyectos/myprojectscl?idclient=<id>
          // Puede devolver distintas formas:
          // - array directo
          // - { proyectos: [...] }
          // - { items: [...] }
          // - { data: [...] }
          // - items con { proyecto: {...} } / { proyectoData: {...} }
          // Normalización flexible para soportar:
          // - array directo
          // - wrappers: { proyectos }, { items }, { data: [...] }, { result }
          // - wrappers indexados: { status, data: { "198": {...} } }
          const normalized = Array.isArray(data)
            ? data
            : Array.isArray(data?.proyectos)
              ? data.proyectos
              : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.result)
                  ? data.result
                  : Array.isArray(data?.data)
                    ? data.data
                    // wrapper indexado: { status, data: { "198": {...} } }
                    : data?.data && typeof data.data === 'object'
                      ? Object.values(data.data)
                      // Si el backend devuelve un objeto indexado (ej: {"24": {...}, "25": {...}})
                      : data && typeof data === 'object'
                        ? Object.values(data)
                        : [];

          setMyProjectsWithApps(normalized);

          // CRUD: extraer SOLO el objeto proyecto si viene embebido.
          // El endpoint nuevo puede devolver items con forma:
          // - { proyecto: {...}, freelancers: [...] }
          // - { proyectoData: {...}, freelancers: [...] }
          // - { freelancers: [...] , id_proyecto: ... } (sin embebido)
          const publishedList = Array.isArray(normalized)
            ? normalized
                .map((item) => {
                  if (!item) return null;

                  const proyecto =
                    item.proyecto ||
                    item.proyectoData ||
                    item.proyecto_data ||
                    item.freelancer_proyecto ||
                    item.freelancerProyecto ||
                    item.project ||
                    null;

                  // Si hay proyecto embebido, preservamos también las aplicaciones
                  // que suelen venir como sibling: { proyecto: {...}, freelancers: [...] }.
                  if (proyecto) {
                    return {
                      ...proyecto,
                      freelancers:
                        item.freelancers ??
                        item.freelancer ??
                        item.aplicaciones ??
                        item.propuestas ??
                        item.freelancer_proyectos ??
                        proyecto.freelancers,
                    };
                  }

                  return item;
                })
                .filter(Boolean)
            : [];

          const publishedListNormalized = publishedList.map((p) => {
            const rawEstado = p.estado ?? p.status ?? p.estatus ?? 'activo';
            const s = String(rawEstado).toLowerCase();

            // mapeo corto para que el badge actual siga funcionando
            const estadoNormalizado =
              s === 'abierto' ? 'activo' :
              s === 'publicado' ? 'activo' :
              rawEstado;

            // crucial para el modal:
            // queremos `p.freelancers` como subnodo base para cada row.
            // Múltiples keys posibles en backend.
            const freelancersRaw =
              Array.isArray(p.freelancers) ? p.freelancers :
              Array.isArray(p.freelancer) ? p.freelancer :
              Array.isArray(p.aplicaciones) ? p.aplicaciones :
              Array.isArray(p.propuestas) ? p.propuestas :
              Array.isArray(p.freelancer_proyectos) ? p.freelancer_proyectos :
              [];

            return {
              id_proyecto: p.id_proyecto ?? p.id ?? p.proyecto_id ?? p.projectId,
              titulo: p.titulo ?? p.nombre ?? p.titulo_proyecto,
              descripcion: p.descripcion ?? p.detalles ?? p.detail ?? '',
              presupuesto: p.presupuesto ?? p.monto ?? p.amount ?? 0,

              estado: estadoNormalizado,

              id_cliente: p.id_cliente ?? p.idclient ?? p.idClient ?? p.clientId,
              cliente_nombre: p.cliente_nombre ?? p.clienteNombre ?? p.clientName,

              skill1: p.skill1 ?? p.skill_1 ?? p.skill01 ?? null,
              skill2: p.skill2 ?? p.skill_2 ?? p.skill02 ?? null,
              skill3: p.skill3 ?? p.skill_3 ?? p.skill03 ?? null,
              skill4: p.skill4 ?? p.skill_4 ?? p.skill04 ?? null,
              skill5: p.skill5 ?? p.skill_5 ?? p.skill05 ?? null,

              // Subnodo requerido para el modal
              freelancers: freelancersRaw,
            };
          });

          setProyectos(publishedListNormalized);




        } catch (e) {
          showToast('Error al cargar mis proyectos y aplicaciones.', 'error');
          setMyProjectsWithApps([]);
          // fallback: no romper CRUD
          const data = await getProyectos();
          setProyectos(Array.isArray(data) ? data : []);
        } finally {
          setMyProjectsLoading(false);
        }
      } else {
        const data = await getProyectos();
        setProyectos(Array.isArray(data) ? data : []);
      }

      const skillsData = await getSkills();
      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setAllSkills(Array.isArray(skillsData) ? skillsData : []);

    } catch (e) {
      showToast('Error al cargar proyectos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (proyecto = null) => {
    if (proyecto) {
      const s1 = coerceSkillValueToId(proyecto.skill1);
      const s2 = coerceSkillValueToId(proyecto.skill2);
      const s3 = coerceSkillValueToId(proyecto.skill3);
      const s4 = coerceSkillValueToId(proyecto.skill4);
      const s5 = coerceSkillValueToId(proyecto.skill5);

      setEditingId(proyecto.id_proyecto);
      setForm({
        titulo: proyecto.titulo || '',
        descripcion: proyecto.descripcion || '',
        presupuesto: proyecto.presupuesto || '',
        estado: proyecto.estado || 'activo',
        skill1: s1,
        skill2: s2,
        skill3: s3,
        skill4: s4,
        skill5: s5,
      });

    } else {
      setEditingId(null);
      setForm({
        titulo: '',
        descripcion: '',
        presupuesto: '',
        estado: 'activo',
        skill1: '',
        skill2: '',
        skill3: '',
        skill4: '',
        skill5: '',
      });

    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({
      titulo: '',
      descripcion: '',
      presupuesto: '',
      estado: 'activo',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      showToast('El título es requerido.', 'warning');
      return;
    }
    if (!form.presupuesto) {
      showToast('El presupuesto es requerido.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProyecto(editingId, {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          presupuesto: Number(form.presupuesto),
          estado: form.estado,
          skill1: form.skill1 || null,
          skill2: form.skill2 || null,
          skill3: form.skill3 || null,
          skill4: form.skill4 || null,
          skill5: form.skill5 || null,
        });

        showToast('Proyecto actualizado exitosamente.', 'success');
      } else {
        await createProyecto({
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          presupuesto: Number(form.presupuesto),
          id_cliente: viewerId,
          estado: form.estado,
          skill1: form.skill1 || null,
          skill2: form.skill2 || null,
          skill3: form.skill3 || null,
          skill4: form.skill4 || null,
          skill5: form.skill5 || null,
        });

        showToast('Proyecto creado exitosamente.', 'success');
      }
      closeModal();
      loadData();
    } catch (err) {
      const msg = err.response?.data?.desc || 'Error al guardar el proyecto.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;
    try {
      await deleteProyecto(id);
      showToast('Proyecto eliminado exitosamente.', 'success');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.desc || 'Error al eliminar el proyecto.';
      showToast(msg, 'error');
    }
  };

  const openPropuestasModal = async (proyecto) => {
    setSelectedProyectoForPropuestas(proyecto);
    setPropuestasLoading(true);

    const normalizePropuesta = (raw) => {
      // “Sin propuesta” solo cuando venga null/undefined o string vacío ""
      if (raw === undefined || raw === null) return '';
      if (typeof raw === 'string' && raw.trim() === '') return '';
      return raw;
    };

    const getPropuestaFromItem = (item, fallbackSource = null) => {
      // backend puede enviar el texto con distinta key
      return (
        item?.propuesta ??
        item?.Propuesta ??
        item?.proposal ??
        item?.to_propue ??
        item?.toPropuesta ??
        item?.to_propuesta ??
        item?.texto ??
        item?.texto_propuesta ??
        item?.textoPropuesta ??
        item?.descripcion_propuesta ??
        item?.descripcionPropuesta ??
        fallbackSource?.propuesta ??
        fallbackSource?.Propuesta ??
        fallbackSource?.proposal ??
        fallbackSource?.to_propue ??
        fallbackSource?.toPropuesta ??
        fallbackSource?.to_propuesta ??
        fallbackSource?.texto ??
        fallbackSource?.texto_propuesta ??
        fallbackSource?.textoPropuesta ??
        fallbackSource?.descripcion_propuesta ??
        fallbackSource?.descripcionPropuesta ??
        ''
      );
    };

    try {
      const idProy = proyecto?.id_proyecto;


      // Queremos usar principalmente `proyecto.freelancers` (backend nuevo).
      let list = Array.isArray(proyecto?.freelancers)
        ? proyecto.freelancers
        : null;

      // Fallback: otras llaves posibles SOLO si el backend no embebió `freelancers`.
      if (!list) {
        list =
          Array.isArray(proyecto?.aplicaciones) ? proyecto.aplicaciones :
          Array.isArray(proyecto?.propuestas) ? proyecto.propuestas :
          Array.isArray(proyecto?.freelancer_proyectos) ? proyecto.freelancer_proyectos :
          null;
      }

      // Fallback final (legacy): buscar por proyecto.
      if (!list) {
        const propuestas = await searchByProyecto(idProy);
        list = Array.isArray(propuestas) ? propuestas : [];
      }

      // Normalizar cada “item” para que el modal funcione con:
      // - prop.id_freelancer_proyecto (key)
      // - prop.freelancer.{nombre,email}
      // - prop.estado
      // - prop.propuesta
      const enriched = await Promise.all(
        (Array.isArray(list) ? list : []).map(async (item) => {
          if (!item) return null;

          // Forma A: { id_freelancer_proyecto, freelancer: {...}, estado, propuesta }
          if (item.freelancer) {
            const freelancer = Array.isArray(item.freelancer) ? item.freelancer[0] : item.freelancer;
            return {
              ...item,
              id_freelancer_proyecto: item.id_freelancer_proyecto ?? item.idFreelancerProyecto ?? item.id,
              freelancer,
              estado: item.estado ?? item.status ?? 'waiting',
              propuesta: normalizePropuesta(getPropuestaFromItem(item, proyecto)),
            };
          }

          // Forma B: viene como “freelancer_proyecto” con campos del freelancer mezclados (nombre/email)
          const looksLikeFreelancer =
            item.id_freelancer != null ||
            item.nombre != null ||
            item.email != null;

          if (looksLikeFreelancer) {
            return {
              ...item,
              id_freelancer: item.id_freelancer ?? item.freelancer_id ?? null,
              id_freelancer_proyecto:
                item.id_freelancer_proyecto ?? item.idFreelancerProyecto ?? item.id_freelancer ?? item.id ?? null,
              freelancer: {
                nombre: item.nombre ?? item.name ?? item.full_name ?? '',
                email: item.email ?? item.mail ?? item.username ?? '',
                ...item,
              },
              estado: item.estado ?? item.status ?? 'waiting',
              propuesta: normalizePropuesta(getPropuestaFromItem(item, proyecto)),
            };
          }

          // Forma C: solo trae id_freelancer, recuperar usuario
          if (item.id_freelancer != null) {
            const freelancer = await getUserById(item.id_freelancer);
            const freelancerObj = Array.isArray(freelancer) ? freelancer[0] : freelancer;

            return {
              ...item,
              id_freelancer_proyecto: item.id_freelancer_proyecto ?? item.idFreelancerProyecto ?? item.id,
              freelancer: freelancerObj,
              estado: item.estado ?? item.status ?? 'waiting',
              propuesta: normalizePropuesta(getPropuestaFromItem(item, proyecto)),
            };
          }

          // último recurso: mantener shape original
          return {
            ...item,
            freelancer: item.freelancer ?? { nombre: 'Freelancer', email: '' },
            id_freelancer_proyecto: item.id_freelancer_proyecto ?? item.id ?? null,
            estado: item.estado ?? item.status ?? 'waiting',
            propuesta: normalizePropuesta(getPropuestaFromItem(item, proyecto)),
          };
        })
      );

      setPropuestasDelProyecto(enriched.filter(Boolean));
      setShowPropuestasModal(true);
    } catch (err) {
      showToast('Error al cargar propuestas.', 'error');
    } finally {
      setPropuestasLoading(false);
    }
  };

  const handleActualizarEstadoPropuesta = async (idFreelancerProyecto, nuevoEstado) => {
    try {
      await updateFreelancerProyecto(idFreelancerProyecto, { estado: nuevoEstado });
      showToast(`Propuesta marcada como ${nuevoEstado}.`, 'success');
      if (selectedProyectoForPropuestas) {
        openPropuestasModal(selectedProyectoForPropuestas);
      }
    } catch (err) {
      const msg = err.response?.data?.desc || 'Error al actualizar la propuesta.';
      showToast(msg, 'error');
    }
  };

  const handleAceptarPropuesta = async (idFreelancerProyecto) => {
    try {
      const result = await selectedFreelancerProyecto(idFreelancerProyecto, true);

      // Ejemplo de respuesta:
      // { id_freelancer_proyecto: 1, estado: 'selected' }
      if (result?.estado === 'selected') {
        showToast('positivo', 'success');
      } else {
        const estadoTxt = result?.estado ?? '—';
        showToast(`Resultado: ${estadoTxt}`, 'success');
      }

      if (selectedProyectoForPropuestas) {
        openPropuestasModal(selectedProyectoForPropuestas);
      }
    } catch (err) {
      const msg = err.response?.data?.desc || 'Error al aceptar la propuesta.';
      showToast(msg, 'error');
    }
  };


  const getFreelancerProfileId = (prop) =>
    prop?.id_freelancer ??
    prop?.freelancer?.id_usuario ??
    prop?.freelancer?.id_freelancer ??
    prop?.freelancer?.id ??
    null;

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
              Mis proyectos
            </h5>
            <p class="text-muted mb-0 small">Esta sección es solo para clientes (id_rol = 3).</p>
          </div>
        </div>
      ) : (
        <>
          <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold mb-0" style={{ color: '#000000e6' }}>
                  Mis proyectos publicados ({proyectos.length})
                </h5>
                <button
                  class="btn btn-sm fw-semibold"
                  style={{ backgroundColor: '#0a66c2', color: '#fff', borderRadius: '20px' }}
                  onClick={() => openModal()}
                >
                  + Nuevo Proyecto
                </button>
              </div>

              {loading ? (
                <div class="text-center py-4">
                  <div class="spinner-border text-primary" role="status" />
                </div>
              ) : proyectos.length === 0 ? (
                <div class="text-center py-4">
                  <div style={{ fontSize: '2rem' }}>📋</div>
                  <p class="text-muted mt-2 mb-0">No tienes proyectos aún.</p>
                  <button
                    class="btn btn-sm btn-primary mt-3"
                    style={{ borderRadius: '20px' }}
                    onClick={() => openModal()}
                  >
                    Crear tu primer proyecto
                  </button>
                </div>
              ) : (
                <div>
                  <MisProyectosTable
                    proyectos={proyectos}
                    onOpenPropuestas={(p) => openPropuestasModal(p)}
                    onEdit={(p) => openModal(p)}
                    onDelete={(id) => handleDelete(id)}
                  />
                </div>

              )}

            </div>
          </div>

          {/* Modal Crear/Editar Proyecto */}
          {showModal && (
            <div
              class="modal show"
              style={{ display: 'block', backgroundColor: 'rgba(0,0,0,.5)' }}
              role="dialog"
            >
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title fw-bold">
                      {editingId ? '✏️ Editar proyecto' : '➕ Nuevo proyecto'}
                    </h5>
                    <button
                      type="button"
                      class="btn-close"
                      onClick={closeModal}
                    />
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label small fw-semibold">Título *</label>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Ej: Sitio web para tienda online"
                          value={form.titulo}
                          onInput={(e) =>
                            setForm({ ...form, titulo: e.target.value })
                          }
                          style={{ borderRadius: '6px' }}
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label small fw-semibold">Descripción</label>
                        <textarea
                          class="form-control"
                          rows="4"
                          placeholder="Describe los detalles de tu proyecto..."
                          value={form.descripcion}
                          onInput={(e) =>
                            setForm({ ...form, descripcion: e.target.value })
                          }
                          style={{ borderRadius: '6px', resize: 'vertical' }}
                        />
                      </div>
                      <div class="row g-3">
                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold">
                            Presupuesto (Q) *
                          </label>
                          <input
                            type="number"
                            class="form-control"
                            placeholder="Ej: 5000"
                            value={form.presupuesto}
                            onInput={(e) =>
                              setForm({ ...form, presupuesto: e.target.value })
                            }
                            style={{ borderRadius: '6px' }}
                            min="0"
                          />
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold">Estado</label>
                          <select
                            class="form-control"
                            value={form.estado}
                            onChange={(e) =>
                              setForm({ ...form, estado: e.target.value })
                            }
                            style={{ borderRadius: '6px' }}
                          >
                            {ESTADO_OPTIONS.map((e) => (
                              <option key={e} value={e}>
                                {e.charAt(0).toUpperCase() + e.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div class="mt-3">
                        <label class="form-label small fw-semibold">Skills (skill1 - skill5)</label>
                        <div class="d-grid gap-2">
                          {[1,2,3,4,5].map((idx) => (
                            <select
                              key={idx}
                              class="form-control"
                              value={form[`skill${idx}`]}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  [`skill${idx}`]: e.target.value,
                                })
                              }
                              style={{ borderRadius: '6px' }}
                            >
                              <option value="">— Sin skill —</option>
                              {allSkills.map((s) => (
                                <option key={s.id_skill} value={s.id_skill}>
                                  {s.nombre}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                      </div>

                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        onClick={closeModal}
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        class="btn fw-semibold"
                        style={{ backgroundColor: '#0a66c2', color: '#fff' }}
                        disabled={submitting}
                      >
                        {submitting ? '⏳...' : editingId ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Ver Propuestas */}
          {showPropuestasModal && (
            <div
              class="modal show"
              style={{ display: 'block', backgroundColor: 'rgba(0,0,0,.5)' }}
              role="dialog"
            >
              <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title fw-bold">
                      Propuestas recibidas en: {selectedProyectoForPropuestas?.titulo}
                    </h5>
                    <button
                      type="button"
                      class="btn-close"
                      onClick={() => setShowPropuestasModal(false)}
                    />
                  </div>
                  <div class="modal-body">
              {propuestasLoading ? (
                      <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status" />
                      </div>
                    ) : propuestasDelProyecto.length === 0 ? (
                      <div class="text-center py-4">
                        <div style={{ fontSize: '2rem' }}>📭</div>
                        <p class="text-muted mt-2 mb-0">No hay propuestas aún.</p>
                      </div>
                    ) : (
                      <div class="d-flex flex-column gap-3">
                        {propuestasDelProyecto.map((prop) => {
                          const freelancerProfileId = getFreelancerProfileId(prop);

                          return (
                            <div
                              key={prop.id_freelancer_proyecto}
                              class="border rounded p-3"
                              style={{ backgroundColor: '#f9f9f9', borderColor: '#e0dede' }}
                            >
                            <div class="d-flex align-items-start gap-3 mb-3">
                              <div
                                class="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: 40,
                                  height: 40,
                                  backgroundColor: '#0a66c2',
                                  color: '#fff',
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                }}
                              >
                                {prop.freelancer?.nombre?.[0]?.toUpperCase() || 'F'}
                              </div>
                              <div class="flex-grow-1">
                                <h6 class="mb-0 fw-semibold">
                                  {prop.freelancer?.nombre || `Freelancer #${prop.id_freelancer}`}
                                </h6>
                                <small class="text-muted">
                                  {prop.freelancer?.email}
                                </small>
                                {freelancerProfileId && (
                                  <div class="mt-1">
                                    <button
                                      type="button"
                                      class="btn btn-link btn-sm p-0"
                                      style={{ color: '#0a66c2', textDecoration: 'none', fontSize: '0.8rem' }}
                                      onClick={() => route(`/perfil/${freelancerProfileId}`)}
                                    >
                                      Ver perfil
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span
                                class="badge rounded-pill"
                                style={{
                                  backgroundColor:
                                    prop.estado === 'aceptada'
                                      ? '#e6f4ea'
                                      : prop.estado === 'rechazada'
                                      ? '#fce8e6'
                                      : '#e8f0fe',
                                  color:
                                    prop.estado === 'aceptada'
                                      ? '#057642'
                                      : prop.estado === 'rechazada'
                                      ? '#b24020'
                                      : '#0a66c2',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {prop.estado}
                              </span>
                            </div>
                            <div class="mb-3">
                              <p class="mb-1 small text-muted">Propuesta:</p>
                              <p class="mb-0">{(prop.propuesta ?? prop.Propuesta ?? prop.proposal ?? prop.texto_propuesta ?? prop.textoPropuesta)?.toString?.().trim?.() ? (prop.propuesta ?? prop.Propuesta ?? prop.proposal ?? prop.texto_propuesta ?? prop.textoPropuesta) : 'Sin propuesta'}</p>

                            </div>
                            {prop.estado === 'waiting' || prop.estado === 'pendiente' ? (
                              <div class="d-flex gap-2">
                                <button
                                  class="btn btn-sm btn-success flex-grow-1"
                                  style={{ borderRadius: '6px', fontSize: '0.8rem' }}
onClick={() => handleAceptarPropuesta(prop.id_freelancer_proyecto)}
                                >
                                  ✓ Aceptar
                                </button>

                                <button
                                  class="btn btn-sm btn-danger flex-grow-1"
                                  style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                                  onClick={() => handleActualizarEstadoPropuesta(prop.id_freelancer_proyecto, 'rechazada')}
                                >
                                  ✕ Rechazar
                                </button>
                              </div>
                            ) : (
                              <div class="text-muted small">
                                <em>Propuesta ya fue {prop.estado}.</em>
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div class="modal-footer">
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      onClick={() => setShowPropuestasModal(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

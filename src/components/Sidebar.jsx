import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../context/AuthContext';
import { getSkills } from '../services/skillService';
import { SkillBadge } from './SkillBadge';

export function Sidebar() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    getSkills()
      .then((d) => setSkills(Array.isArray(d) ? d.slice(0, 14) : []))
      .catch(() => {});
  }, []);

  const getRoleId = (u) => {
    if (!u) return null;
    const candidates = [
      u.id_rol, u.rol, u.idRol, u.role,
      u.tipo_usuario, u.id_tipo_usuario, u.idTipoUsuario, u.typeUser,
    ];
    const found = candidates.find((v) => v !== undefined && v !== null && String(v) !== '');
    if (found === undefined) return null;
    const n = Number(found);
    return Number.isFinite(n) ? n : null;
  };

  const roleId = getRoleId(user);
  const isFreelancer = Number(roleId) === 2;
  const isCliente = Number(roleId) === 3;

  const quickLinks = [
    { icon: '📋', label: 'Todos los proyectos', path: '/dashboard' },
    { icon: '👥', label: 'Freelancers',         path: '/dashboard' },
    { icon: '🔧', label: 'Catálogo de skills',  path: '/dashboard' },
    ...(isFreelancer ? [{ icon: '📮', label: 'Mis aplicaciones', path: '/mis-aplicaciones' }] : []),
    ...(isCliente ? [
      { icon: '💼', label: 'Mis proyectos', path: '/proyectos' },
      { icon: '🧾', label: 'Aplicaciones de mis proyectos', path: '/proyectos-aplicaciones' },
    ] : []),
  ];

  return (
    <div class="d-flex flex-column gap-3">
      {/* Mini profile */}
      <div class="card overflow-hidden" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
        <div style={{ height: 56, background: 'linear-gradient(135deg, #0a66c2, #0073b1)' }} />
        <div class="card-body pt-0 text-center px-3 pb-3">
          <div
            class="mx-auto d-flex align-items-center justify-content-center rounded-circle border border-3 border-white"
            style={{
              width: 52, height: 52, marginTop: -26,
              backgroundColor: '#0a66c2', color: '#fff',
              fontSize: '1.1rem', fontWeight: 700,
            }}
          >
            {user?.nombre?.[0]?.toUpperCase() || 'U'}
          </div>
          <h6 class="mt-2 mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>{user?.nombre || 'Usuario'}</h6>
          <small class="text-muted" style={{ fontSize: '0.78rem' }}>{user?.email}</small>
          <div class="mt-2 pt-2 border-top">
            <button
              class="btn btn-outline-primary btn-sm w-100"
              style={{ borderRadius: '20px', fontSize: '0.78rem' }}
              onClick={() => route(`/perfil/${user?.id}`)}
            >
              Ver mi perfil
            </button>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
        <div class="card-body px-3 py-3">
          <h6 class="fw-semibold mb-3" style={{ fontSize: '0.85rem', color: '#000000e6' }}>
            💡 Skills disponibles
          </h6>
          {skills.length === 0 ? (
            <div class="placeholder-glow d-flex flex-wrap gap-2">
              {[60, 80, 50, 90, 70].map((w, i) => (
                <span key={i} class="placeholder rounded-pill" style={{ width: w, height: 22 }} />
              ))}
            </div>
          ) : (
            <div class="d-flex flex-wrap gap-1">
              {skills.map((s) => <SkillBadge key={s.id_skill} nombre={s.nombre} small />)}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '8px' }}>
        <div class="card-body px-3 py-3">
          <h6 class="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: '#000000e6' }}>Accesos rápidos</h6>
          <ul class="list-unstyled mb-0 d-flex flex-column gap-2">
            {quickLinks.map((l) => (
              <li key={l.label}>
                <button
                  class="btn btn-link text-decoration-none p-0"
                  style={{ color: '#0a66c2', fontSize: '0.82rem' }}
                  onClick={() => route(l.path)}
                >
                  {l.icon} {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

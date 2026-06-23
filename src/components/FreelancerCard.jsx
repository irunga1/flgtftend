import { route } from 'preact-router';
import { SkillBadge } from './SkillBadge';

const COLORS = ['#0a66c2', '#057642', '#b24020', '#915907', '#6b46c1'];

function initials(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function FreelancerCard({ user, skills = [] }) {
  const bg = COLORS[(user.id_usuario || 0) % COLORS.length];

  return (
    <div
      class="card h-100"
      style={{ border: '1px solid #e0dede', borderRadius: '8px', cursor: 'pointer', transition: 'box-shadow .2s' }}
      onClick={() => route(`/perfil/${user.id_usuario}`)}
    >
      <div class="card-body text-center pb-2">
        <div
          class="mx-auto d-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: 52, height: 52, backgroundColor: bg, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}
        >
          {initials(user.nombre)}
        </div>
        <h6 class="card-title fw-semibold mb-0" style={{ fontSize: '0.9rem', color: '#000000e6' }}>
          {user.nombre}
        </h6>
        <small class="text-muted" style={{ fontSize: '0.78rem' }}>{user.email}</small>
      </div>

      <div class="card-footer bg-transparent border-top border-light px-3 pb-3 pt-2 d-flex flex-wrap gap-1 justify-content-center">
        {skills.length > 0 ? (
          <>
            {skills.slice(0, 3).map((s) => (
              <SkillBadge key={s.id_skill} nombre={s.nombre} small />
            ))}
            {skills.length > 3 && (
              <small class="text-muted align-self-center">+{skills.length - 3}</small>
            )}
          </>
        ) : (
          <small class="text-muted">sin skills</small>
        )}
      </div>
    </div>
  );
}

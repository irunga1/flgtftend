import { route } from 'preact-router';

import { SkillBadge } from './SkillBadge';

const ESTADO_STYLE = {
  activo:     { bg: '#e6f4ea', color: '#057642' },
  inactivo:   { bg: '#fce8e6', color: '#b24020' },
  completado: { bg: '#e8f0fe', color: '#0a66c2' },
};

export function ProyectoCard({ proyecto, onCardClick }) {
  const estado = (proyecto.estado || 'activo').toLowerCase();
  const style  = ESTADO_STYLE[estado] || ESTADO_STYLE.activo;

  const handleClick = onCardClick
    ? () => onCardClick(proyecto)
    : () => route(`/proyectos/${proyecto.id_proyecto}`);

  const handleBtnClick = (e) => {
    e.stopPropagation();
    if (onCardClick) onCardClick(proyecto);
    else route(`/proyectos/${proyecto.id_proyecto}`);
  };

  return (
    <div
      class="card h-100 proyecto-card"
      onClick={handleClick}
      style={{ cursor: 'pointer', border: '1px solid #e0dede', borderRadius: '8px' }}
    >
      <div class="card-body pb-2">
        <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h6 class="card-title fw-semibold mb-0" style={{ color: '#000000e6', lineHeight: 1.3 }}>
            {proyecto.titulo}
          </h6>
          <span
            class="badge flex-shrink-0"
            style={{ ...style, borderRadius: '20px', fontSize: '0.72rem', padding: '4px 10px' }}
          >
            {proyecto.estado || 'activo'}
          </span>
        </div>

        <p
          class="card-text text-muted small mb-3"
          style={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {proyecto.descripcion || 'Sin descripción disponible.'}
        </p>

        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold" style={{ color: '#0a66c2', fontSize: '1rem' }}>
            Q{Number(proyecto.presupuesto || 0).toLocaleString()}
          </span>
          <small class="text-muted">
            Cliente: {proyecto.cliente_nombre || `#${proyecto.id_cliente}`}
          </small>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-2">
          {[proyecto.skill1, proyecto.skill2, proyecto.skill3, proyecto.skill4, proyecto.skill5]
            .filter((s) => s && String(s).trim() !== '')
            .slice(0, 5)
            .map((s) => (
              <SkillBadge key={s} nombre={s} small={true} />
            ))}
        </div>

      </div>

      <div class="card-footer bg-transparent border-0 pt-1 pb-3 px-3">
        <button
          class="btn btn-sm w-100"
          style={{ backgroundColor: '#0a66c2', color: 'white', borderRadius: '20px' }}
          onClick={handleBtnClick}
        >
          {onCardClick ? 'Ver info →' : 'Ver detalles →'}
        </button>
      </div>
    </div>
  );
}

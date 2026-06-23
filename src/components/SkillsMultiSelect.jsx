import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

/**
 * Multiselect tipo select2 (sin librerías externas)
 * - Autocomplete por nombre
 * - Selección múltiple
 * - UI de chips
 */
export function SkillsMultiSelect({
  allSkills,
  selectedSkills,
  onChange,
  disabled,
  placeholder = 'Buscar skill...',
}) {
  const [skillSearch, setSkillSearch] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedIdSet = useMemo(() => new Set((selectedSkills || []).map((s) => String(s.id_skill))), [selectedSkills]);

  const filtered = useMemo(() => {
    const q = String(skillSearch || '').trim().toLowerCase();
    if (!q) return Array.isArray(allSkills) ? allSkills : [];
    return (Array.isArray(allSkills) ? allSkills : []).filter((s) => String(s.nombre || '').toLowerCase().includes(q));
  }, [allSkills, skillSearch]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleSkill = (skill) => {
    const id = String(skill.id_skill);
    if (selectedIdSet.has(id)) {
      onChange((prev) => prev.filter((s) => String(s.id_skill) !== id));
    } else {
      onChange((prev) => {
        // mantener objetos completos de allSkills
        const next = prev ? [...prev] : [];
        next.push(skill);
        return next;
      });
    }
  };

  return (
    <div ref={rootRef}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          class="form-control form-control-sm"
          value={skillSearch}
          onInput={(e) => {
            setSkillSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{ borderRadius: '10px' }}
          disabled={disabled}
        />

        {open && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: '#fff',
              border: '1px solid #e0dede',
              borderRadius: '10px',
              marginTop: 4,
              maxHeight: 240,
              overflowY: 'auto',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
            }}
          >
            {allSkills?.length === 0 ? (
              <div class="p-2 text-muted small">Requiere autenticación</div>
            ) : filtered.length === 0 ? (
              <div class="p-2 text-muted small">No hay resultados</div>
            ) : (
              filtered.map((s) => {
                const active = selectedIdSet.has(String(s.id_skill));
                return (
                  <button
                    type="button"
                    key={s.id_skill}
                    class="dropdown-item"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: active ? '#e8f0fe' : 'transparent',
                      color: active ? '#0a66c2' : '#212529',
                      padding: '8px 10px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSkill(s)}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8, color: active ? '#0a66c2' : '#94a3b8' }}>
                      {active ? '✓' : '+'}
                    </span>
                    {s.nombre}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedSkills?.length > 0 && (
        <div class="d-flex flex-wrap gap-2 mt-2">
          {selectedSkills.map((s) => (
            <div
              key={s.id_skill}
              class="d-flex align-items-center gap-1 rounded-pill px-3 py-1"
              style={{ backgroundColor: '#e8f0fe', border: '1px solid #0a66c244' }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0a66c2' }}>{s.nombre}</span>
              {!disabled && (
                <button
                  type="button"
                  class="btn-close ms-1"
                  style={{ width: '0.6rem', height: '0.6rem', fontSize: '0.55rem', opacity: 0.55 }}
                  aria-label="Quitar de selección"
                  onClick={() => toggleSkill(s)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


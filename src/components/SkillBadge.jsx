export function SkillBadge({ nombre, small = false }) {
  return (
    <span
      class="badge rounded-pill"
      style={{
        backgroundColor: '#e8f0fe',
        color: '#0a66c2',
        fontSize: small ? '0.7rem' : '0.8rem',
        padding: small ? '3px 8px' : '5px 10px',
        fontWeight: 500,
      }}
    >
      {nombre}
    </span>
  );
}

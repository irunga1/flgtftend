import { route } from 'preact-router';

export function NotFound() {
  return (
    <div
      class="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{ backgroundColor: '#f3f2ef' }}
    >
      <div class="text-center">
        <div style={{ fontSize: '4rem' }}>🔍</div>
        <h1 class="fw-bold mt-2" style={{ color: '#0a66c2', fontSize: '4rem' }}>404</h1>
        <p class="text-muted mb-4">Esta página no existe.</p>
        <button
          class="btn fw-semibold px-4"
          style={{ backgroundColor: '#0a66c2', color: '#fff', borderRadius: '24px' }}
          onClick={() => route('/dashboard')}
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}

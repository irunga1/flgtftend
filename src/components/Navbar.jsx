import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const [navOpen,  setNavOpen]  = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [query,    setQuery]    = useState('');
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = (path) => { setNavOpen(false); route(path); };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setNavOpen(false);
      route(`/dashboard?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const NAV_LINKS = [
    { label: 'Inicio',      icon: '🏠', path: '/dashboard' },
    { label: 'Proyectos',   icon: '💼', path: '/dashboard' },
    { label: 'Freelancers', icon: '👥', path: '/dashboard' },
  ];

  return (
    <nav
      class="navbar navbar-expand-lg bg-white fixed-top"
      style={{ borderBottom: '1px solid #e0dede', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}
    >
      <div class="container-xl">
        {/* Brand */}
        <a
          class="navbar-brand d-flex align-items-center gap-2 text-decoration-none"
          href="/dashboard"
        >
          <div
            class="d-flex align-items-center justify-content-center rounded"
            style={{ width: 34, height: 34, backgroundColor: '#0a66c2' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>FG</span>
          </div>
          <span style={{ color: '#0a66c2', fontWeight: 700, fontSize: '1.1rem' }}>FreelanceGT</span>
        </a>

        {/* Search (md+) */}
        <div class="d-none d-md-flex mx-3 flex-grow-1" style={{ maxWidth: 280 }}>
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-light" style={{ border: '1px solid #dce2e7' }}>🔍</span>
            <input
              type="text"
              class="form-control bg-light"
              placeholder="Buscar proyectos, skills..."
              style={{ border: '1px solid #dce2e7', borderLeft: 'none' }}
              value={query}
              onInput={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          class="navbar-toggler border-0"
          type="button"
          onClick={() => setNavOpen(!navOpen)}
        >
          <span class="navbar-toggler-icon" />
        </button>

        {/* Nav links */}
        <div class={`collapse navbar-collapse ${navOpen ? 'show' : ''}`}>
          <ul class="navbar-nav ms-auto align-items-lg-center gap-1">
            {NAV_LINKS.map((l) => (
              <li class="nav-item" key={l.label}>
                <button
                  class="nav-link btn btn-link d-flex flex-column align-items-center px-3 border-0 bg-transparent"
                  style={{ color: '#666', fontSize: '0.78rem', textDecoration: 'none' }}
                  onClick={() => navigate(l.path)}
                >
                  <span style={{ fontSize: '1rem' }}>{l.icon}</span>
                  <span>{l.label}</span>
                </button>
              </li>
            ))}

            {/* User dropdown */}
            <li class="nav-item ms-1" ref={dropRef} style={{ position: 'relative' }}>
              <button
                class="btn btn-link d-flex align-items-center gap-2 text-decoration-none p-1"
                onClick={() => setDropOpen(!dropOpen)}
              >
                <div
                  class="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 32, height: 32,
                    backgroundColor: '#0a66c2', color: '#fff',
                    fontSize: '0.8rem', fontWeight: 700,
                  }}
                >
                  {user?.nombre?.[0]?.toUpperCase() || 'U'}
                </div>
                <span class="d-none d-lg-inline" style={{ fontSize: '0.85rem', fontWeight: 500, color: '#333' }}>
                  {user?.nombre?.split(' ')[0] || 'Usuario'} ▾
                </span>
              </button>

              {dropOpen && (
                <ul
                  class="dropdown-menu dropdown-menu-end show shadow-sm"
                  style={{ minWidth: 180, borderRadius: '8px', border: '1px solid #e0dede', top: '110%', right: 0 }}
                >
                  <li>
                    <a
                      class="dropdown-item small"
                      href={`/perfil/${user?.id}`}
                      onClick={(e) => { e.preventDefault(); setDropOpen(false); route(`/perfil/${user?.id}`); }}
                    >
                      👤 Mi perfil
                    </a>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <button class="dropdown-item small text-danger" onClick={logout}>
                      🚪 Cerrar sesión
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

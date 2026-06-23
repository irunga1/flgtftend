import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) route('/login', true);
  }, []);

  if (!isAuthenticated()) return null;

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#f3f2ef', minHeight: '100vh', paddingTop: 64 }}>
        <div class="container-xl py-4 px-3 px-lg-4">
          <div class="row g-3">
            {/* Left sidebar — visible on lg+ */}
            <div class="col-lg-3 d-none d-lg-block">
              <div style={{ position: 'sticky', top: 78 }}>
                <Sidebar />
              </div>
            </div>
            {/* Main content */}
            <div class="col-12 col-lg-9">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

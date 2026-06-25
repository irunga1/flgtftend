import Router from 'preact-router';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProyectoDetalle } from './pages/ProyectoDetalle';
import { Perfil } from './pages/Perfil';
import { Proyectos } from './pages/Proyectos';
import { MisAplicaciones } from './pages/MisAplicaciones';
import { ProyectosAplicacionesClientes } from './pages/ProyectosAplicacionesClientes';

import { NotFound } from './pages/NotFound';
import { ToastContainer } from './components/ToastContainer';
import { useAuth } from './context/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    route(isAuthenticated() ? '/dashboard' : '/login', true);
  }, []);
  return null;
}

export function App() {
  return (
    <>
      <Router>
        <Home path="/" />
        <Login path="/login" />
        <Dashboard path="/dashboard" />
        <ProyectoDetalle path="/proyectos/:id" />
        <Proyectos path="/proyectos" />
        <MisAplicaciones path="/mis-aplicaciones" />
        <ProyectosAplicacionesClientes path="/proyectos-aplicaciones" />
        <Perfil path="/perfil/:id" />
        <NotFound default />
      </Router>
      <ToastContainer />
    </>
  );
}

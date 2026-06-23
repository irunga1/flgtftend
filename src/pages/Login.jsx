import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { login, forgotPassword } from '../services/authService';

import { createUser } from '../services/userService';


export function Login() {
  const { setAuth, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Modals
  const [showForgot, setShowForgot] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    email: '',
    descripcion: '',
    password: '',
    id_rol: '2',
  });


  const [registerErrors, setRegisterErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);


  useEffect(() => {
    if (isAuthenticated()) route('/dashboard', true);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'El correo es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Formato de correo inválido.';
    if (!form.password) e.password = 'La contraseña es requerida.';
    else if (form.password.length < 3) e.password = 'Mínimo 3 caracteres.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const data = await login(form.email, form.password);
      if (data.status === 'ok') {
        setAuth(data.user, data.token);
        showToast(`¡Bienvenido, ${data.user.nombre}! 👋`, 'success');
        route('/dashboard', true);
      } else {
        setErrors({ general: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        showToast('Credenciales incorrectas.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.desc || 'No se pudo conectar con el servidor.';
      setErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setRegister = (field) => (e) => setRegisterForm({ ...registerForm, [field]: e.target.value });
  const setForgot = (field) => (e) => setForgotForm({ ...forgotForm, [field]: e.target.value });

  const validateRegister = () => {
    const e = {};
    if (!registerForm.nombre) e.nombre = 'El nombre es requerido.';

    const email = registerForm.email?.trim();
    if (!email) e.email = 'El correo es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Formato de correo inválido.';

    if (!registerForm.password) e.password = 'La contraseña es requerida.';
    else if (registerForm.password.length < 3) e.password = 'Mínimo 3 caracteres.';

    // descripcion es opcional (backend valida si aplica)
    return e;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRegisterErrors(errs); return; }

    setRegisterLoading(true);
    setRegisterErrors({});
    try {
      const data = await createUser(registerForm);
      if (data?.status === 'ok') {
        showToast('Cuenta creada. Inicia sesión para continuar.', 'success');
        setShowRegister(false);
        setRegisterForm({ nombre: '', email: '', password: '', id_rol: '2' });
        setRegisterErrors({});
      } else {
        const msg = data?.desc || data?.message || 'No se pudo crear la cuenta.';
        setRegisterErrors({ general: msg });
        showToast(msg, 'error');
      }

    } catch (err) {
      const msg = err.response?.data?.desc || 'No se pudo conectar con el servidor.';
      setRegisterErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const email = forgotForm.email?.trim();
    const errs = {};
    if (!email) errs.email = 'El correo es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Formato de correo inválido.';

    if (Object.keys(errs).length) { setForgotErrors(errs); return; }

    setForgotLoading(true);
    setForgotErrors({});
    try {
      const data = await forgotPassword(email);
      if (data.status === 'ok') {

        showToast('Reinicio solicitado. Revisa tu correo.', 'success');
        setShowForgot(false);
        setForgotForm({ email: '' });
      } else {
        const msg = data.desc || 'No se pudo solicitar el reinicio de contraseña.';
        setForgotErrors({ general: msg });
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.desc || 'No se pudo conectar con el servidor.';
      setForgotErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      class="min-vh-100 d-flex align-items-center justify-content-center p-3"

      style={{ backgroundColor: '#f3f2ef' }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / Header */}
        <div class="text-center mb-4">
          <div
            class="d-inline-flex align-items-center justify-content-center rounded mb-3"
            style={{ width: 52, height: 52, backgroundColor: '#0a66c2' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem' }}>FG</span>
          </div>
          <h1 style={{ color: '#0a66c2', fontWeight: 700, fontSize: '1.9rem', margin: 0 }}>
            FreelanceGT
          </h1>
          <p class="text-muted mt-1 mb-0" style={{ fontSize: '0.9rem' }}>
            Conecta talento guatemalteco con proyectos
          </p>
        </div>

        {/* Card */}
        <div class="card shadow-sm" style={{ borderRadius: '10px', border: '1px solid #e0dede' }}>
          <div class="card-body p-4">
            <h5 class="fw-semibold mb-4" style={{ color: '#000000e6' }}>Iniciar sesión</h5>

            {errors.general && (
              <div class="alert alert-danger py-2 px-3 mb-3" style={{ borderRadius: '6px', fontSize: '0.875rem' }}>
                {errors.general}
              </div>
            )}

            <div class="d-flex justify-content-between align-items-center mb-3" style={{ gap: 12 }}>
              <button
                type="button"
                class="btn btn-link p-0"
                style={{ color: '#0a66c2', fontSize: '0.9rem', textDecoration: 'none' }}
                onClick={() => { setShowRegister(true); setRegisterErrors({}); }}
              >
                Crear cuenta
              </button>

              <button
                type="button"
                class="btn btn-link p-0"
                style={{ color: '#0a66c2', fontSize: '0.9rem', textDecoration: 'none' }}
                onClick={() => { setShowForgot(true); setForgotErrors({}); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div class="mb-3">

                <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  class={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="tucorreo@ejemplo.com"
                  value={form.email}
                  onInput={set('email')}
                  style={{ borderRadius: '6px' }}
                />
                {errors.email && <div class="invalid-feedback">{errors.email}</div>}
              </div>

              <div class="mb-4">
                <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  class={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onInput={set('password')}
                  style={{ borderRadius: '6px' }}
                />
                {errors.password && <div class="invalid-feedback">{errors.password}</div>}
              </div>

              <button
                type="submit"
                class="btn w-100 fw-semibold"
                disabled={loading}
                style={{
                  backgroundColor: '#0a66c2', color: '#fff',
                  borderRadius: '24px', padding: '10px',
                  fontSize: '0.95rem',
                }}
              >
                {loading ? (
                  <span class="d-flex align-items-center justify-content-center gap-2">
                    <span class="spinner-border spinner-border-sm" role="status" />
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>

        <p class="text-center mt-3 text-muted" style={{ fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} FreelanceGT · Guatemala 🇬🇹
        </p>

        {/* Register Modal */}
        {showRegister && (
          <div
            class="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabindex="-1"
            aria-modal="true"
            role="dialog"
          >
            <div class="modal-dialog" style={{ maxWidth: 520 }}>
              <div class="modal-content" style={{ borderRadius: 12 }}>
                <div class="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                  <h5 class="modal-title fw-semibold" style={{ margin: 0, color: '#0a66c2' }}>
                    Crear cuenta
                  </h5>
                  <button
                    type="button"
                    class="btn-close"
                    aria-label="Cerrar"
                    onClick={() => {
                      setShowRegister(false);
                      setRegisterErrors({});
                    }}
                  />
                </div>

                <div class="modal-body">
                  {registerErrors.general && (
                    <div class="alert alert-danger py-2 px-3" style={{ borderRadius: 6, fontSize: '0.875rem' }}>
                      {registerErrors.general}
                    </div>
                  )}

                  <form onSubmit={handleRegister} noValidate>
                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        class={`form-control ${registerErrors.nombre ? 'is-invalid' : ''}`}
                        placeholder="Tu nombre"
                        value={registerForm.nombre}
                        onInput={setRegister('nombre')}
                        style={{ borderRadius: 6 }}
                      />
                      {registerErrors.nombre && <div class="invalid-feedback">{registerErrors.nombre}</div>}
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        class={`form-control ${registerErrors.email ? 'is-invalid' : ''}`}
                        placeholder="tucorreo@ejemplo.com"
                        value={registerForm.email}
                        onInput={setRegister('email')}
                        style={{ borderRadius: 6 }}
                      />
                      {registerErrors.email && <div class="invalid-feedback">{registerErrors.email}</div>}
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Contraseña
                      </label>
                      <input
                        type="password"
                        class={`form-control ${registerErrors.password ? 'is-invalid' : ''}`}
                        placeholder="Crea una contraseña"
                        value={registerForm.password}
                        onInput={setRegister('password')}
                        style={{ borderRadius: 6 }}
                      />
                      {registerErrors.password && <div class="invalid-feedback">{registerErrors.password}</div>}
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Descripción
                      </label>
                      <textarea
                        class={`form-control ${registerErrors.descripcion ? 'is-invalid' : ''}`}
                        placeholder="Cuéntanos brevemente sobre ti"
                        value={registerForm.descripcion}
                        onInput={(e) => setRegisterForm({ ...registerForm, descripcion: e.target.value })}
                        style={{ borderRadius: 6, minHeight: 92, resize: 'vertical' }}
                      />
                      {registerErrors.descripcion && (
                        <div class="invalid-feedback">{registerErrors.descripcion}</div>
                      )}
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Rol
                      </label>
                      <select
                        class="form-select"
                        value={registerForm.id_rol}
                        onChange={(e) => setRegisterForm({ ...registerForm, id_rol: e.target.value })}
                        style={{ borderRadius: 6 }}
                      >
                        <option value="2">Freelancer</option>
                        <option value="3">Cliente</option>
                      </select>

                    </div>

                    <button
                      type="submit"
                      class="btn w-100 fw-semibold"
                      disabled={registerLoading}
                      style={{
                        backgroundColor: '#0a66c2',
                        color: '#fff',
                        borderRadius: '24px',
                        padding: '10px',
                        fontSize: '0.95rem',
                      }}
                    >
                      {registerLoading ? 'Creando...' : 'Registrarse'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showForgot && (
          <div
            class="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabindex="-1"
            aria-modal="true"
            role="dialog"
          >
            <div class="modal-dialog" style={{ maxWidth: 520 }}>
              <div class="modal-content" style={{ borderRadius: 12 }}>
                <div class="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                  <h5 class="modal-title fw-semibold" style={{ margin: 0, color: '#0a66c2' }}>
                    Reiniciar contraseña
                  </h5>
                  <button
                    type="button"
                    class="btn-close"
                    aria-label="Cerrar"
                    onClick={() => {
                      setShowForgot(false);
                      setForgotErrors({});
                    }}
                  />
                </div>

                <div class="modal-body">
                  {forgotErrors.general && (
                    <div class="alert alert-danger py-2 px-3" style={{ borderRadius: 6, fontSize: '0.875rem' }}>
                      {forgotErrors.general}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} noValidate>
                    <div class="mb-3">
                      <label class="form-label fw-medium" style={{ fontSize: '0.9rem' }}>
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        class={`form-control ${forgotErrors.email ? 'is-invalid' : ''}`}
                        placeholder="tucorreo@ejemplo.com"
                        value={forgotForm.email}
                        onInput={setForgot('email')}
                        style={{ borderRadius: 6 }}
                      />
                      {forgotErrors.email && <div class="invalid-feedback">{forgotErrors.email}</div>}
                    </div>

                    <button
                      type="submit"
                      class="btn w-100 fw-semibold"
                      disabled={forgotLoading}
                      style={{
                        backgroundColor: '#0a66c2',
                        color: '#fff',
                        borderRadius: '24px',
                        padding: '10px',
                        fontSize: '0.95rem',
                      }}
                    >
                      {forgotLoading ? 'Enviando...' : 'Enviar solicitud'}
                    </button>

                    <p class="text-muted mt-3" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
                      Te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


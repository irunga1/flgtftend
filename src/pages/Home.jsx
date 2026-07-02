import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';

import heroPng from '../assets/hero.png';

function ArticleCard({ title, summary, icon, tag }) {
  return (
    <div class="card h-100" style={{ border: '1px solid #e0dede', borderRadius: '12px' }}>
      <div class="card-body p-4">
        <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div class="d-flex align-items-center gap-2">
            <div
              class="d-flex align-items-center justify-content-center rounded"
              style={{ width: 38, height: 38, backgroundColor: '#0a66c2', color: '#fff' }}
            >
              {icon}
            </div>
            <div>
              <div class="fw-bold" style={{ color: '#111' }}>{title}</div>
              {tag && <span class="badge" style={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 600 }}>{tag}</span>}
            </div>
          </div>
        </div>
        <p class="text-muted mb-0" style={{ lineHeight: 1.7 }}>{summary}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div
      class="card h-100"
      style={{ border: '1px solid #e0dede', borderRadius: '12px', backgroundColor: '#fff' }}
    >
      <div class="card-body p-4">
        <div class="d-flex align-items-start gap-3">
          <div
            class="rounded"
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#f3f7ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            {icon}
          </div>
          <div>
            <div class="fw-bold" style={{ color: '#111' }}>{title}</div>
            <p class="text-muted mb-0" style={{ lineHeight: 1.65, fontSize: '0.95rem' }}>{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  // Mantener render simple (pública) sin Layout.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ backgroundColor: '#f3f2ef', minHeight: '100vh' }}>
      {/* Hero */}
      <div class="container-xl py-5 px-3 px-lg-4">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-7">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="badge" style={{ backgroundColor: '#0a66c2', color: '#fff', fontWeight: 700 }}>FreelanceGT</span>
              <span class="text-muted" style={{ fontWeight: 600 }}>
                freelance • desarrollo • oportunidades
              </span>
            </div>

            <h1 class="fw-bold" style={{ color: '#0b1220', lineHeight: 1.15 }}>
              Conecta con proyectos y talento en <span style={{ color: '#0a66c2' }}>freelance</span>.
            </h1>
            <p class="text-muted" style={{ lineHeight: 1.7, fontSize: '1.02rem', maxWidth: 640 }}>
              FreelanceGT es una plataforma para que freelancers y clientes encuentren soluciones digitales.
              Publica, explora y aplica a proyectos relacionados con desarrollo web y más.
            </p>

            <div class="d-flex flex-wrap gap-2 mt-4">
              <button
                class="btn btn-primary"
                style={{ borderRadius: '20px', padding: '10px 18px', fontWeight: 700 }}
                onClick={() => route('/login')}
              >
                Iniciar sesión
              </button>
              <button
                class="btn btn-outline-primary"
                style={{ borderRadius: '20px', padding: '10px 18px', fontWeight: 700 }}
                onClick={() => route('/dashboard')}
              >
                Ver plataforma
              </button>
            </div>

            <div class="row g-3 mt-4">
              <div class="col-12 col-sm-6 col-lg-4">
                <div
                  class="p-3 rounded"
                  style={{ backgroundColor: '#fff', border: '1px solid #e0dede' }}
                >
                  <div style={{ fontSize: '1.3rem' }}>💼</div>
                  <div class="fw-bold">Proyectos reales</div>
                  <div class="text-muted" style={{ fontSize: '0.9rem' }}>para construir y entregar</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-lg-4">
                <div
                  class="p-3 rounded"
                  style={{ backgroundColor: '#fff', border: '1px solid #e0dede' }}
                >
                  <div style={{ fontSize: '1.3rem' }}>🔧</div>
                  <div class="fw-bold">Skills y desarrollo</div>
                  <div class="text-muted" style={{ fontSize: '0.9rem' }}>enfocado a tecnología</div>
                </div>
              </div>
              <div class="col-12 col-lg-4">
                <div
                  class="p-3 rounded"
                  style={{ backgroundColor: '#fff', border: '1px solid #e0dede' }}
                >
                  <div style={{ fontSize: '1.3rem' }}>🧩</div>
                  <div class="fw-bold">Match inteligente</div>
                  <div class="text-muted" style={{ fontSize: '0.9rem' }}>con el perfil adecuado</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-5">
            <div
              class="rounded"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0dede',
                overflow: 'hidden',
              }}
            >
              <img
                src={heroPng}
                alt="FreelanceGT"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div class="p-4">
                <div class="fw-bold" style={{ color: '#111' }}>FreelanceGT, hecho para crecer</div>
                <p class="text-muted mb-0" style={{ lineHeight: 1.65 }}>
                  Explora ideas, crea soluciones y conecta con gente que valora el desarrollo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div class="container-xl pb-5 px-3 px-lg-4">
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '12px' }}>
          <div class="card-body p-4">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <div class="fw-bold" style={{ color: '#111', fontSize: '1.2rem' }}>¿Qué es FreelanceGT?</div>
                <div class="text-muted">Un espacio para freelance y desarrollo</div>
              </div>
              <span class="badge" style={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 700 }}>
                progreso • calidad • colaboración
              </span>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6 col-lg-4">
                <div class="p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div class="fw-bold">✨ Publica y encuentra</div>
                  <div class="text-muted" style={{ lineHeight: 1.65, fontSize: '0.95rem' }}>
                    Clientes publican proyectos y freelancers se presentan con su experiencia.
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-6 col-lg-4">
                <div class="p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div class="fw-bold">🧠 Filtra por skills</div>
                  <div class="text-muted" style={{ lineHeight: 1.65, fontSize: '0.95rem' }}>
                    Enfoca la búsqueda con categorías de desarrollo y tecnologías.
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-12 col-lg-4">
                <div class="p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div class="fw-bold">🚀 Crece con cada entrega</div>
                  <div class="text-muted" style={{ lineHeight: 1.65, fontSize: '0.95rem' }}>
                    Aplica, colabora y mejora continuamente tus resultados como freelancer.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div class="container-xl pb-5 px-3 px-lg-4">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
          <div>
            <div class="fw-bold" style={{ color: '#111', fontSize: '1.25rem' }}>Lo que podrás hacer</div>
            <div class="text-muted">Una experiencia pensada para freelance y desarrollo</div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-12 col-md-6 col-lg-4">
            <FeatureCard
              icon="💼"
              title="Explorar proyectos"
              desc="Encuentra oportunidades alineadas a tu perfil y experiencia en desarrollo."
            />
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <FeatureCard
              icon="🧩"
              title="Aplicar con propuestas"
              desc="Envía tu propuesta y demuestra por qué eres el candidato ideal."
            />
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <FeatureCard
              icon="🔧"
              title="Skills y enfoque técnico"
              desc="Filtra por tecnologías y habilidades para conectar rápido."
            />
          </div>
        </div>
      </div>

      {/* Articles */}
      <div class="container-xl pb-5 px-3 px-lg-4">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
          <div>
            <div class="fw-bold" style={{ color: '#111', fontSize: '1.25rem' }}>Artículos destacados</div>
            <div class="text-muted">Ideas y tips sobre freelance y desarrollo</div>
          </div>
          <span class="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
            Aprende y aplica
          </span>
        </div>

        <div class="row g-3">
          <div class="col-12 col-md-6 col-lg-4">
            <ArticleCard
              icon="📝"
              title="Cómo escribir propuestas que convierten"
              tag="Freelance"
              summary="Estructura tu mensaje, define el alcance y muestra tu valor. Menos relleno, más impacto."
            />
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <ArticleCard
              icon="⚙️"
              title="Checklist de un proyecto de desarrollo"
              tag="Desarrollo"
              summary="Define objetivos, planifica iteraciones, asegura entregables y controla riesgos desde el inicio."
            />
          </div>
          <div class="col-12 col-lg-4">
            <ArticleCard
              icon="📈"
              title="Estrategia para crecer como freelancer"
              tag="Carrera"
              summary="Portafolio, networking y consistencia. Construye reputación con cada entrega y mejora continua."
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div class="container-xl pb-5 px-3 px-lg-4">
        <div class="card" style={{ border: '1px solid #e0dede', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            class="p-4 p-md-5"
            style={{
              background:
                'linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0) 70%)',
            }}
          >
            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
              <div>
                <div class="fw-bold" style={{ color: '#111', fontSize: '1.3rem' }}>
                  Empieza hoy con FreelanceGT
                </div>
                <div class="text-muted" style={{ lineHeight: 1.65 }}>
                  Explora proyectos, conecta con clientes y demuestra tu talento en desarrollo.
                </div>
              </div>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-primary"
                  style={{ borderRadius: '20px', fontWeight: 800 }}
                  onClick={() => route('/login')}
                  disabled={!mounted}
                >
                  Ir a login
                </button>
                <button
                  class="btn btn-outline-primary"
                  style={{ borderRadius: '20px', fontWeight: 800 }}
                  onClick={() => route('/dashboard')}
                >
                  Ir a dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


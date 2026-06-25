# 📋 Recomendaciones Backend - FreelanceGT

## Estado Actual
El backend tiene todos los módulos implementados. Algunos endpoints NO tienen `authJwt` por estar en fase de desarrollo/pruebas.

## ✅ Endpoints que YA tienen authJwt (correcto)
- ✅ GET/POST/PUT/DELETE `/roles/*`
- ✅ POST/PUT/DELETE `/skills/*` (aunque GET/search pueden ser públicos)
- ✅ POST/PUT/DELETE `/proyectos/*`
- ✅ GET `/freelancer_proyectos/` (con auth)

## ⚠️ Endpoints que DEBEN tener authJwt para producción

### Alta Prioridad (Seguridad de datos del usuario)
1. **PUT `/perfil`** - Actualmente SIN authJwt
   - **Riesgo:** Cualquiera puede actualizar el perfil de otros usuarios
   - **Solución:** Agregar authJwt y validar que `id_usuario` del JWT coincida con el del request

2. **GET `/perfil`** - Actualmente SIN authJwt (?)
   - **Consideración:** Si es GET, puede ser público (para ver perfiles)
   - **Recomendación:** Mantener público pero con validación de datos sensibles

3. **POST/PUT/DELETE `/usuario_skills/*`** - Actualmente SIN authJwt
   - **Riesgo:** Pueden modificar skills de otros usuarios
   - **Solución:** Agregar authJwt

### Media Prioridad (Endpoints críticos de negocio)
4. **GET `/proyectos/search`** - SIN authJwt
   - **Consideración:** Está bien que sea público para buscar proyectos
   - **Pero:** `/proyectos/latest20` debería tener acceso controlado

5. **GET `/freelancer_proyectos/myprojectscl`** - SIN authJwt
   - **Riesgo:** Expone proyectos/freelancers sin validación
   - **Solución:** Validar con authJwt o agregar validación de `idclient`

6. **GET `/freelancer_proyectos/myprojectsfl`** - SIN authJwt
   - **Mismo riesgo que arriba**

### Baja Prioridad (Desarrollo)
7. **GET `/users`** - SIN authJwt
   - **Consideración:** Sirve para listar usuarios pero puede exponerse
   - **Recomendación:** Agregar authJwt si es admin-only

## 🔧 Cambios Sugeridos en Código Backend

### 1. Proteger PUT `/perfil`
```javascript
// Antes
router.put('/perfil', (req, res) => { ... })

// Después
router.put('/perfil', authJwt, (req, res) => {
  // Validar que req.user.id_usuario == req.body.id_usuario
  if (Number(req.body.id_usuario) !== Number(req.user.id_usuario)) {
    return res.json({ status: 'error', desc: 'No autorizado' });
  }
  // ... resto del código
})
```

### 2. Proteger POST/PUT/DELETE `/usuario_skills/*`
```javascript
// Agregar authJwt a todas estas rutas
router.post('/usuario_skills', authJwt, (req, res) => { ... })
router.put('/usuario_skills/:id', authJwt, (req, res) => { ... })
router.delete('/usuario_skills/:id', authJwt, (req, res) => { ... })
```

### 3. Validar `/freelancer_proyectos/myprojectscl` y `/myprojectsfl`
```javascript
// Actualmente reciben ?idclient=X sin validación
// Agregar authJwt y validar que el usuario actual sea quien solicita
router.get('/freelancer_proyectos/myprojectscl', authJwt, (req, res) => {
  const { idclient } = req.query;
  // Validar que req.user.id_usuario == idclient O req.user.id_rol == 1 (admin)
  // ... resto del código
})
```

## 📊 Matriz de Cambios Recomendados

| Endpoint | Estado Actual | Cambio | Impacto | Urgencia |
|----------|---------------|--------|--------|----------|
| PUT `/perfil` | Sin auth | Agregar authJwt | Alto | 🔴 Alta |
| POST/PUT/DELETE `/usuario_skills` | Sin auth | Agregar authJwt | Alto | 🔴 Alta |
| GET `/freelancer_proyectos/myprojects*` | Sin auth | Validar usuario | Medio | 🟡 Media |
| GET `/users` | Sin auth | Considerar auth | Bajo | 🟢 Baja |

## ✅ Frontend ya está preparado para:
- ✅ Usar /aplicar/apply para aplicaciones con validación
- ✅ Manejar errores 401 automáticamente
- ✅ Crear/editar/eliminar proyectos con protección JWT
- ✅ Ver y gestionar propuestas recibidas
- ✅ Acceso diferenciado por rol (cliente, freelancer, admin)

## 🚀 Próximos Pasos

### Inmediato
1. Agregar `authJwt` a PUT `/perfil` y POST/PUT/DELETE `/usuario_skills`
2. Testear con Postman todos los endpoints
3. Verificar que los errores 401 se retornan correctamente

### Producción
1. Configurar variables de entorno (`SECRET_KEY`, `NODE_ENV`)
2. Habilitar CORS si es necesario
3. Implementar rate limiting
4. Agregar validación de input en todos los endpoints
5. Implementar logging de auditoría

---

**Nota:** El frontend está completamente funcional y listo. Solo necesita que el backend agregue las protecciones mencionadas para estar completamente seguro.

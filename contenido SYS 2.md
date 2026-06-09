# Vialidades de Tránsito — Documentación Técnica Completa (SYS 2)

---

## 1. ESTRUCTURA DEL PROYECTO

```
Vialidades/
├── server/
│   ├── index.js                         # Servidor Express principal
│   ├── socket.js                        # Configuración Socket.io
│   ├── middleware/
│   │   └── auth.js                      # Middleware JWT + sesión única
│   ├── models/
│   │   ├── User.js
│   │   ├── Report.js
│   │   ├── Notification.js
│   │   ├── Sanction.js
│   │   ├── Suggestion.js
│   │   ├── PendingUser.js
│   │   └── SupportRequest.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── reports.js
│   │   ├── users.js
│   │   ├── notifications.js
│   │   ├── suggestions.js
│   │   ├── supermod.js
│   │   ├── support.js
│   │   └── ai.js
│   └── utils/
│       ├── emailService.js              # Gmail OAuth2 + plantillas HTML
│       └── contentModeration.js        # Sightengine API
├── client/
│   └── src/
│       ├── App.jsx                      # Rutas React Router
│       ├── main.jsx                     # Entry point
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── NotificationList.jsx
│       │   ├── FaceBlurImage.jsx
│       │   ├── FaceBlurVideo.jsx
│       │   ├── MediaGallery.jsx
│       │   ├── ReportDetailModal.jsx
│       │   ├── UserDetailModal.jsx
│       │   ├── ModerationTimeline.jsx
│       │   ├── CreateModeratorModal.jsx
│       │   ├── DraggableMap.jsx
│       │   ├── HeatMapLayer.jsx
│       │   └── TermsModal.jsx
│       └── pages/
│           ├── LandingPage.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── ForgotPassword.jsx
│           ├── ResetPassword.jsx
│           ├── Dashboard.jsx
│           ├── CreateReport.jsx
│           ├── Profile.jsx
│           ├── ModerateReports.jsx
│           ├── SuperModDashboard.jsx
│           ├── SuperModModerators.jsx
│           ├── SuperModReports.jsx
│           ├── SuperModSupport.jsx
│           └── SupportPage.jsx
```

---

## 2. MODELOS DE BASE DE DATOS (MONGOOSE)

### User.js
```
username         String  único, requerido
email            String  único, requerido
password         String  hasheado con bcrypt, requerido
firstName        String  requerido
lastName         String  requerido
birthDate        Date    requerido
gender           String  requerido
phone            String  requerido
cedula           String  único, requerido
birthProvince    String  requerido
isVerified       Boolean default: false
verificationCode String  código 6 dígitos (en PendingUser)
role             String  enum: 'user' | 'moderator' | 'supermoderador' | 'admin'
                         default: 'user'
reputation       Number  rango 0–100, default: 0
sanctions        Number  default: 0  (>= 3 = ban permanente)
avatar           String  URL del avatar en Cloudinary
resetPasswordToken    String  hash del token de reset
resetPasswordExpire   Date    expiración del token
sessionToken     String  para control de sesión única por dispositivo
blockedUntil     Date    para bloqueos temporales
isActive         Boolean default: true
createdAt        Date    default: Date.now
```

### Report.js
```
userId           ObjectId  ref: User, requerido
type             String    enum: Traffic | Accident | Violation | Hazard |
                                  RoadWork | Pothole | Flood | Other
description      String    requerido
location         Object    { lat: Number, lng: Number, address: String }
photos           Array     [{ url, metadata }]  (legacy)
media            Array     [{
                              url: String,
                              type: 'image' | 'video',
                              public_id: String (Cloudinary),
                              metadata: Object (EXIF, dimensiones),
                              faceRegions: [{ top, left, width, height }]
                           }]
carInfo          Object    { brand, model, year, color }
status           String    enum: pending | approved | rejected |
                                  In Process | needs_review
                           default: pending
hiddenByUser     Boolean   default: false
moderatorId      ObjectId  ref: User  (último que moderó)
moderatorInCharge ObjectId ref: User  (quién lo tiene locked actualmente)
moderatorComment String
wasSanctioned    Boolean   default: false
flags            Array     [{ userId: ObjectId, reason: String, createdAt: Date }]
reportNumber     Number    único, secuencial (VTI0001, VTI0002…)
timestamp        Date      default: Date.now
```

### Notification.js
```
userId           ObjectId  ref: User, requerido
type             String    enum: info | success | error | warning
priority         String    enum: normal | urgent
category         String    default: null
message          String    requerido
link             String    URL de destino al hacer click
metadata         Mixed     datos extra
read             Boolean   default: false
relatedReportId  ObjectId  ref: Report
createdAt        Date      default: Date.now
deleted          Boolean   default: false  (soft delete)
```

### Sanction.js
```
userId           ObjectId  ref: User, requerido
reportId         ObjectId  ref: Report, requerido
status           String    enum: active | inactive
expiresAt        Date      null = permanente
createdAt        Date      default: Date.now
```

### Suggestion.js
```
name             String  requerido
email            String  requerido
message          String  requerido
category         String  idea | mejora | bug | otro  default: 'idea'
createdAt        Date    default: Date.now
```

### PendingUser.js  *(TTL: 1 hora)*
```
Mismo schema que User (sin role, reputation, sanctions)
verificationCode String  6 dígitos
createdAt        Date    default: Date.now  expires: 3600s
```
El documento se elimina automáticamente tras 1 hora si no se verifica.

### SupportRequest.js
```
type             String  enum: familiar | unauthorized  requerido
requesterName    String  requerido
requesterEmail   String  requerido
requesterPhone   String
requesterCedula  String
relationship     String  parentesco (solo tipo 'familiar')
victimName       String
reportId         String  número de reporte relacionado
reportDescription String
reason           String  requerido
caseNumber       String  único, formato: VIL-XXXXXXX
status           String  enum: pending | in_review | resolved | rejected
resolvedBy       ObjectId  ref: User
resolvedAt       Date
resolution       String  texto de resolución
createdAt        Date    default: Date.now
```

---

## 3. API ENDPOINTS

### /api/auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/check-duplicates` | No | Verifica duplicados (username, email, cedula, phone) antes del KYC |
| POST | `/register` | No | Crea PendingUser con datos KYC, envía email de verificación de 6 dígitos |
| POST | `/verify` | No | Valida código, crea User definitivo, devuelve JWT |
| POST | `/login` | No | Autentica usuario, verifica sanciones/bloqueo, genera sessionToken único |
| POST | `/google` | No | Login/registro con Google OAuth (credential = Google ID token) |
| POST | `/forgot-password` | No | Genera resetToken (hash SHA256), envía email con enlace, válido 1 hora |
| POST | `/reset-password/:token` | No | Valida token, hashea nueva contraseña, limpia token |
| GET | `/me` | Sí | Devuelve datos del usuario autenticado |
| PATCH | `/profile` | Sí | Actualiza perfil (username, email, nombre, avatar) |
| GET | `/export` | Sí | Exporta todos los datos del usuario como JSON |
| DELETE | `/account` | Sí | Desactiva cuenta (isActive = false) |

### /api/reports

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/check-media` | Sí | Pre-verificación de contenido con Sightengine antes del envío |
| POST | `/` | Sí | Crea reporte con archivos de media, auto-modera con Sightengine |
| GET | `/public` | No | Reportes aprobados para mapa público (LandingPage) |
| GET | `/stats` | Mod | Stats de moderación: pending, approved, rejected, sanctioned, byType, byDay |
| GET | `/` | Sí | Lista reportes filtrados (my=true, status=pending/all) |
| GET | `/:id` | Sí | Detalles de un reporte específico |
| PUT | `/:id/lock` | Mod | Bloquea reporte (status → 'In Process', asigna moderatorInCharge) |
| PUT | `/:id/unlock` | Mod | Desbloquea reporte (status → pending o needs_review) |
| PATCH | `/:id/moderate` | Mod | Aprueba / rechaza / rechaza con sanción |
| POST | `/:id/flag` | Sí | Denuncia un reporte (máx 1 por usuario) |
| DELETE | `/:id/flags` | Mod | Desestima todas las flags, aprueba reporte |
| PATCH | `/:id/hide` | Owner | Oculta reporte (hiddenByUser = true) |
| POST | `/migrate-face-regions` | Admin | Migración: detecta caras en reportes legacy |
| POST | `/migrate-report-numbers` | Admin | Migración: asigna reportNumber secuencial |

### /api/users

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Mod | Lista todos los usuarios |
| GET | `/:id` | Mod | Detalles de un usuario específico |
| PUT | `/promote` | Admin | Promueve usuario a moderador por email |
| POST | `/moderator` | Admin | Crea moderador directamente con formulario |
| PATCH | `/:id/sanctions/reduce` | Mod | Reduce sanciones en 1, +25 rep |
| PATCH | `/:id/sanctions/clear` | Mod | Limpia todas las sanciones, rep = 100, desbloquea |
| PATCH | `/:id/sanctions/add` | Mod | Añade sanción manual |
| PATCH | `/:id/block` | Mod | Bloquea usuario (24h / 48h / 7d / permanent) |
| PATCH | `/:id/unblock` | Mod | Desbloquea usuario |

### /api/notifications

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Sí | Últimas 20 notificaciones del usuario (no eliminadas) |
| PATCH | `/:id/read` | Sí | Marca una notificación como leída |
| PATCH | `/read-all` | Sí | Marca todas como leídas |
| DELETE | `/:id` | Sí | Elimina notificación (soft delete: deleted = true) |

### /api/suggestions

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | No | Envía sugerencia (name, email, message, category) |
| GET | `/` | Mod | Lista todas las sugerencias ordenadas por fecha desc |

### /api/supermod

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/stats` | SuperMod | Stats globales del dashboard de supermoderación |
| GET | `/moderators` | SuperMod | Lista moderadores con sus métricas de actividad |
| POST | `/moderators` | SuperMod | Crea nuevo moderador |
| PATCH | `/moderators/:id/toggle` | SuperMod | Activa / desactiva moderador |
| GET | `/reports` | SuperMod | Reportes aprobados, búsqueda por número de reporte |
| PATCH | `/reports/:id/remove` | SuperMod | Oculta reporte aprobado |

### /api/support

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | No | Crea solicitud de soporte, genera caseNumber VIL-XXXXXXX |
| GET | `/case/:caseNumber` | No | Consulta pública del estado de un caso |
| GET | `/` | SuperMod | Lista solicitudes, filtrable por status |
| PATCH | `/:id` | SuperMod | Actualiza estado y resolución de una solicitud |

### /api/ai

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/identify-vehicle` | Sí | Envía imagen a Groq Llama 3.2 Vision, devuelve brand/model/year/color |

---

## 4. MIDDLEWARE

### auth.js
1. Lee `x-auth-token` del header de la request
2. Verifica y decodifica JWT con `JWT_SECRET`
3. Busca usuario en DB por `decoded.user.id`
4. Valida `isActive === true`
5. **Sesión única**: compara `decoded.user.sessionToken` con `user.sessionToken` en DB
   - Si no coinciden → 401 con `{ sessionOverwritten: true }`
   - El cliente intercepta esto y cierra sesión mostrando el mensaje correspondiente
6. Inyecta `req.user = { id, role, sessionToken }` en la request

---

## 5. SISTEMA DE SOCKETS (Socket.io)

### Conexión y salas

| Evento (cliente → servidor) | Acción |
|-----------------------------|--------|
| `join_moderation` | Socket entra a sala `moderation_room` |
| `join_supermod` | Socket entra a sala `supermod_room` |
| `lock_report` (reportId) | Registra en memoria que este socket tiene el reporte locked |
| `unlock_report` | Libera el lock del reporte |
| `disconnect` | Si tenía lock activo: libera automáticamente el reporte (status → pending, moderatorInCharge → null), emite `report_status_updated` |

### Eventos del servidor

| Evento | Destinatario | Datos | Cuándo se emite |
|--------|-------------|-------|-----------------|
| `new_report` | Todos | Report object | Al crear un reporte aprobado |
| `report_status_updated` | Todos | `{ reportId, status, wasSanctioned }` | Al moderar un reporte |
| `report_flagged` | Todos | `{ reportId, status, flagsCount }` | Cuando un reporte llega a 3 flags |
| `new_notification` | Todos | `{ userId }` | Al crear cualquier notificación |
| `new_support_request` | supermod_room | `{ caseNumber, type, requesterName, createdAt }` | Al crear solicitud de soporte |

### Auto-release en desconexión
Si un moderador cierra el navegador o pierde conexión mientras tiene un reporte bloqueado:
- `disconnect` → se libera el reporte
- Report vuelve a `status: pending`, `moderatorInCharge: null`
- Se notifica al resto de moderadores con `report_status_updated`

---

## 6. FLUJO COMPLETO — PUBLICAR UN REPORTE

```
PASO 1 — El usuario llena el formulario (CreateReport.jsx)
  ├── Selecciona tipo (Traffic, Accident, Flood, etc.)
  ├── Escribe descripción
  ├── Marca ubicación en DraggableMap (click o GPS)
  ├── Sube imágenes/videos (drag & drop)
  └── Opcionalmente: identificación IA de vehículo (/api/ai/identify-vehicle)

PASO 2 — Pre-verificación de contenido
  POST /api/reports/check-media (por cada archivo)
  ├── Sightengine analiza: nudity, violence, gore, offensive
  ├── Si inapropiado → SweetAlert al usuario, bloquea envío
  └── Si OK → continúa

PASO 3 — Envío del reporte
  POST /api/reports  { type, description, lat, lng, address, media[], carInfo }
  
PASO 4 — Servidor: procesamiento
  ├── Verifica que usuario no tenga 3+ sanciones
  ├── Sube archivos a Cloudinary (multer-storage-cloudinary)
  │     Folder: vialidades_reports
  │     Cloudinary detecta caras automáticamente
  ├── Por cada archivo → guarda faceRegions (coordenadas de caras)
  ├── Auto-moderación con Sightengine
  │     ├── Si flagged como inapropiado:
  │     │     ├── Crea Report con status: 'rejected', wasSanctioned: true
  │     │     ├── user.sanctions += 1
  │     │     ├── Bloqueo temporal según contador de sanciones
  │     │     ├── Crea Sanction record
  │     │     ├── Envía contentViolationEmail
  │     │     └── Notificación tipo 'error' al usuario
  │     └── Si OK → continúa
  ├── Crea Report con status: 'approved'
  ├── Genera reportNumber secuencial (VTI0001…)
  └── Retorna reporte creado

PASO 5 — Post-creación
  ├── Socket emite 'new_report' a todos los clientes
  ├── Moderadores ven el reporte en su panel (pending)
  ├── Crea Notification para el usuario: "Tu reporte fue publicado"
  ├── Socket emite 'new_notification' al userId
  └── Envía sendReportPublishedEmail

PASO 6 — Visibilidad
  ├── Aparece en Dashboard (vista Comunidad) para usuarios
  ├── Aparece en el mapa público de LandingPage (HeatMapLayer)
  └── Aparece en ModerateReports.jsx para moderadores
```

---

## 7. FLUJO DE MODERACIÓN DE UN REPORTE

```
ESTADO INICIAL: pending

MODERADOR abre ModerateReports.jsx
  │
  ├── Hace click en reporte
  │     PUT /api/reports/:id/lock
  │     ├── status → 'In Process'
  │     ├── moderatorInCharge = req.user.id
  │     └── Socket emite 'report_status_updated' a todos
  │         (otros moderadores ven que está siendo revisado)
  │
  ├── Revisa contenido (ReportDetailModal)
  │
  └── Toma decisión:

      ┌── APROBAR
      │     PATCH /api/reports/:id/moderate { status: 'approved' }
      │     ├── Aplica blur en imágenes: URL → /upload/e_blur_faces/...
      │     ├── Limpia flags
      │     ├── +10 rep al usuario (o rep = 100 si es su primer reporte)
      │     ├── Crea Notification 'success': "Tu reporte fue aprobado"
      │     ├── Socket emite 'report_status_updated'
      │     ├── Socket emite 'new_notification'
      │     └── Envía sendReportStatusEmail
      │
      ├── RECHAZAR (sin sanción)
      │     PATCH /api/reports/:id/moderate { status: 'rejected' }
      │     ├── -10 rep al usuario
      │     ├── Crea Notification 'error': "Tu reporte fue rechazado"
      │     ├── Socket emite 'report_status_updated'
      │     └── Envía sendReportStatusEmail
      │
      └── RECHAZAR CON SANCIÓN
            PATCH /api/reports/:id/moderate { status: 'rejected', sanctionUser: true }
            ├── wasSanctioned = true
            ├── -25 rep al usuario
            ├── user.sanctions += 1
            ├── Bloqueo según contador:
            │     sanctions = 1 → blockedUntil = +24h
            │     sanctions = 2 → blockedUntil = +48h
            │     sanctions >= 3 → ban permanente
            ├── Crea Sanction record
            ├── Crea Notification 'error' con warning de sanción
            ├── Socket emite 'report_status_updated'
            └── Envía sendContentViolationEmail
```

---

## 8. ESTADOS DE UN REPORTE Y SUS TRANSICIONES

```
pending
  │
  ├─→ In Process       (lock por moderador)
  │       ├─→ approved
  │       ├─→ rejected
  │       └─→ rejected + wasSanctioned
  │
  └─→ (después de 3 flags por comunidad)
        needs_review
            ├─→ approved    (mod desestima flags)
            └─→ rejected / rejected+sanctioned
```

Tabla de estados:

| Estado | Label UI | Color | Descripción |
|--------|----------|-------|-------------|
| `pending` | Pendiente | Amarillo | Esperando revisión |
| `In Process` | En revisión | Morado | Moderador lo tiene locked |
| `needs_review` | Pendiente revisar | Naranja | 3+ flags de comunidad |
| `approved` | Aprobado | Verde | Visible públicamente |
| `rejected` | Rechazado | Rojo | Rechazado sin sanción |
| `rejected` + `wasSanctioned` | Sancionado | Rojo oscuro | Rechazado con sanción |

---

## 9. SISTEMA DE REPUTACIÓN

| Evento | Primer Reporte | Reportes Subsiguientes |
|--------|---------------|------------------------|
| Aprobado | rep = 100 | rep = Math.min(100, rep + 10) |
| Rechazado (sin sanción) | rep = 40 | rep = Math.max(1, rep - 10) |
| Rechazado (con sanción) | rep = 25 | rep = Math.max(1, rep - 25) |
| Sanción reducida (mod) | — | rep += 25 |
| Sanciones limpiadas (mod) | — | rep = 100 |

Rango: **0–100**. Nunca baja de 1 si el usuario ya tiene reputación.

---

## 10. SISTEMA DE SANCIONES

| Sanciones acumuladas | Consecuencia |
|---------------------|--------------|
| 1 | Bloqueo temporal 24 horas |
| 2 | Bloqueo temporal 48 horas |
| 3+ | Ban permanente (no puede iniciar sesión) |

- El bloqueo se verifica en **login** y en **creación de reportes**
- Moderadores pueden: reducir en 1, limpiar todas, añadir manual, bloquear por tiempo
- Durations disponibles para bloqueo manual: `24h`, `48h`, `7d`, `permanent`

---

## 11. SISTEMA DE FLAGS (DENUNCIAS COMUNITARIAS)

```
Usuario hace click en "¿Deseas denunciar este reporte?"
  │
  └── Swal con motivos: Información falsa | Ubicación incorrecta |
      Contenido inapropiado | Duplicado | Spam | Otro
  │
  POST /api/reports/:id/flag { reason }
  │
  ├── Valida: usuario ≠ creador del reporte
  ├── Valida: usuario no lo haya flaggeado ya
  ├── Agrega { userId, reason, createdAt } al array flags
  ├── Si flags.length >= 3:
  │     ├── status → 'needs_review'
  │     ├── Notificación a todos los moderadores (priority: warning)
  │     └── Socket emite 'report_flagged' a todos
  └── Devuelve { flagsCount, status }
```

Cuando un mod desestima:
```
DELETE /api/reports/:id/flags
  ├── report.flags = []
  ├── status → 'approved'
  └── Socket emite 'report_status_updated'
```

---

## 12. SISTEMA DE NOTIFICACIONES

### Cuándo se crean

| Trigger | Tipo | Mensaje |
|---------|------|---------|
| Registro completado | success | "Bienvenido a Vialidades" |
| Reporte publicado (aprobado automáticamente) | success | "Tu reporte de [tipo] fue publicado" |
| Reporte aprobado por mod | success | "Tu reporte fue aprobado" |
| Reporte rechazado sin sanción | error | "Tu reporte fue rechazado" |
| Reporte rechazado con sanción | error | "⚠️ Has sido sancionado" |
| Contenido inapropiado detectado | error | "Contenido inapropiado detectado" |
| 3+ flags en reporte → mods | warning | Notificación a moderadores |
| Nueva solicitud de soporte → supermods | warning | urgent priority |

### Flujo de entrega
1. Servidor crea documento en colección `Notification`
2. Servidor emite `new_notification` vía Socket con `{ userId }`
3. Cliente (`NotificationList.jsx`) detecta evento, hace GET `/api/notifications`
4. Dropdown muestra badge con cantidad de no leídas
5. Al hacer click: marca como leída, si tiene link navega a él

### Características
- Últimas 20 por usuario
- Soft delete (campo `deleted: true`)
- "Marcar todas como leídas"
- Si la notificación tiene `relatedReportId` → navega a `/dashboard?reportId=...`

---

## 13. SISTEMA DE FACE BLUR (DIFUMINADO DE CARAS)

### En el cliente — FaceBlurImage.jsx

1. IntersectionObserver detecta cuando la imagen entra en viewport
2. Carga imagen en elemento `<canvas>` oculto
3. Ejecuta `faceapi.detectAllFaces()` con TinyFaceDetector
4. Por cada cara detectada:
   - Añade padding del 20% del ancho de la cara
   - Divide la región en bloques de 8px
   - Por cada bloque: obtiene el color del pixel central
   - Dibuja el bloque completo con ese color (efecto pixelado)
5. Muestra badge "Rostro protegido" cuando termina

### En Cloudinary — Al aprobar reporte

Al aprobar un reporte, el servidor modifica las URLs de las imágenes:

```
ANTES:  https://res.cloudinary.com/.../upload/v123/imagen.jpg
DESPUÉS: https://res.cloudinary.com/.../upload/e_blur_faces/v123/imagen.jpg
```

Cloudinary aplica el blur automáticamente en CDN para todos los visitantes.

---

## 14. REGISTRO CON KYC (Know Your Customer)

### Pasos del flujo de registro

```
PASO 1 — Datos personales
  ├── username, firstName, lastName
  ├── email, password
  ├── birthDate, gender, phone
  ├── cedula, birthProvince
  └── Aceptar términos y condiciones

  POST /api/auth/check-duplicates
  └── Verifica que username, email, cedula, phone sean únicos

PASO 2 — Captura de cédula (OCR)
  ├── Usuario sube foto de su cédula (frontal)
  ├── Pre-procesamiento con Jimp:
  │     greyscale → contraste +50% → normalize → scale 2x
  ├── OCR con Tesseract.js (idioma: español)
  ├── Extrae texto y busca nombre + cédula
  └── Si no coincide con datos del formulario → rechaza

PASO 3 — Selfie + Face Matching
  ├── Usuario toma selfie en tiempo real (webcam)
  ├── face-api.js compara descriptores faciales selfie vs cédula
  ├── Calcula porcentaje de similitud
  └── Si similitud < 30% → rechaza

PASO 4 — Verificación por email
  ├── POST /api/auth/register envia:
  │     ├── Crea PendingUser (TTL 1 hora)
  │     ├── Genera código de 6 dígitos
  │     └── Envía email con código
  ├── Usuario ingresa código
  └── POST /api/auth/verify
        ├── Crea User definitivo en DB
        ├── Elimina PendingUser
        └── Devuelve JWT + datos de usuario
```

---

## 15. SISTEMA DE AUTENTICACIÓN

### JWT
```
Payload: {
  user: {
    id: ObjectId,
    role: 'user' | 'moderator' | 'supermoderador' | 'admin',
    sessionToken: String (20 bytes aleatorios)
  }
}
Header requerido: x-auth-token: <token>
Expiración: 5 horas
```

### Sesión única por dispositivo
- Al hacer login → genera `sessionToken` nuevo → guarda en `User.sessionToken`
- El JWT incluye ese `sessionToken`
- En cada request, `auth.js` compara el sessionToken del JWT con el de la DB
- Si el usuario inicia sesión en otro dispositivo → nuevo sessionToken en DB → el JWT viejo queda inválido
- El cliente intercepta el 401 con `sessionOverwritten: true` y muestra mensaje + cierra sesión

### Google OAuth
- Cliente envía `credential` (Google ID Token)
- Servidor verifica con Google OAuth2Client
- Si el email ya existe en DB → login normal, devuelve JWT
- Si es nuevo → crea User verificado sin KYC, devuelve JWT

### Roles y permisos

| Rol | Acceso |
|-----|--------|
| user | Dashboard, crear reportes, ver comunidad, denunciar, perfil |
| moderator | Todo lo anterior + panel de moderación, gestión de usuarios |
| admin | Todo lo anterior + promover usuarios, acceso completo |
| supermoderador | Dashboard de supermoderación, gestión de mods, soporte |

---

## 16. SISTEMA DE SOPORTE LEGAL

### Tipos de solicitud
- **familiar**: Familiar de víctima que aparece en reporte (amparo Ley 192-19)
- **unauthorized**: Persona que aparece sin autorización (amparo Ley 172-13)

### Flujo
```
Usuario visita /soporte
  │
  ├── Busca caso por número VIL-XXXXXXX (GET /api/support/case/:caseNumber)
  │
  └── Llena formulario de solicitud
        POST /api/support
        ├── Genera caseNumber único: VIL + 7 chars aleatorios (A-Z 0-9)
        ├── Crea SupportRequest en DB
        ├── Socket emite 'new_support_request' a supermod_room
        └── Muestra popup con número de caso

SuperMod en /supermoderador/soporte
  ├── Ve lista de solicitudes con filtro por status
  ├── Expande para ver detalles
  └── Actualiza estado: pending → in_review → resolved / rejected
        PATCH /api/support/:id { status, resolution }
```

---

## 17. MAPA PÚBLICO Y HEATMAP

### Datos del mapa

El endpoint `/api/reports/public` devuelve solo reportes:
- Con status: `approved`, `In Process`, o `needs_review`
- Con `hiddenByUser: false`
- Campos: `location`, `type`, `description`, `timestamp`, `reportNumber`

### HeatMapLayer.jsx

Cada reporte aprobado aparece como un pin de color según su tipo:

| Tipo | Color |
|------|-------|
| Traffic | Amarillo `#f59e0b` |
| Accident | Rojo `#ef4444` |
| Violation | Índigo `#6366f1` |
| Hazard | Naranja `#f97316` |
| RoadWork | Azul cielo `#0ea5e9` |
| Pothole | Gris cálido `#78716c` |
| Flood | Azul `#0284c7` |
| Other | Gris pizarra `#64748b` |

El popup de cada pin muestra:
- Badge de tipo con ícono y color
- Descripción (máx 3 líneas)
- Dirección
- Fecha
- Número de reporte (si existe)

### Tiempo real
Cuando se aprueba un nuevo reporte, el socket emite `new_report` y el mapa añade el pin sin recargar la página.

---

## 18. GESTIÓN DE SUPERMODERADOR

### Dashboard (`/supermoderador`)
- Total moderadores activos/inactivos
- Total reportes moderados en el sistema
- Reportes publicados vs pendientes
- Total usuarios registrados
- Reportes creados hoy y esta semana
- Breakdown de reportes por tipo
- Stats individuales de cada moderador (aprobados, rechazados, sancionados)

### Moderadores (`/supermoderador/moderadores`)
- Lista de moderadores con métricas
- Toggle activo/inactivo
- Crear nuevo moderador con formulario completo (igual que registro sin KYC)
- Ver historial de acciones

### Reportes (`/supermoderador/reportes`)
- Vista de todos los reportes aprobados
- Búsqueda por número de reporte (VTI0001)
- Opción para ocultar cualquier reporte

---

## 19. SERVICIOS EXTERNOS

### Cloudinary
- Almacena imágenes y videos de reportes y avatares
- Folder `vialidades_reports` para reportes
- Folder `vialidades_avatars` para fotos de perfil
- Metadata con detección de caras
- Transformación `e_blur_faces` al aprobar
- Conversión HEIC → JPG automática

### Gmail OAuth2 (emailService.js)
Emails que se envían:

| Email | Cuándo |
|-------|--------|
| Verificación de cuenta | Al registrarse |
| Reset de contraseña | Al solicitar recuperación |
| Reporte publicado | Al aprobar automáticamente |
| Estado de reporte | Al aprobar/rechazar por moderador |
| Violación de contenido | Al sancionar por contenido inapropiado |

Todos tienen plantillas HTML responsive con branding de Vialidades.

### Sightengine (content moderation)
- Analiza imágenes/videos antes y durante la creación
- Detecta: nudity, violence, gore, offensive, weapons
- Si score > threshold → bloqueo automático

### Tesseract.js (OCR)
- Solo en cliente durante registro
- Extrae texto de foto de cédula
- Valida nombre completo y número de cédula
- Idioma: español

### face-api.js
- Solo en cliente
- TinyFaceDetector (modelo ligero ~3MB)
- Usos:
  1. Registro: comparar selfie vs foto cédula (faceMatchPercentage)
  2. Dashboard: pixelado de caras en imágenes de reportes

### Groq Llama 3.2 Vision (AI)
- Identificación de vehículos en reportes
- Recibe imagen, devuelve: marca, modelo, año, color
- Solo disponible al crear reportes con foto de vehículo

---

## 20. CONFIGURACIÓN DEL SERVIDOR (index.js)

### Middlewares globales
```
cors()
express.json({ limit: '50mb' })
express.urlencoded({ extended: true, limit: '50mb' })
Logging: [HTTP IN] METHOD /ruta
```

### Rutas registradas
```
/api/auth           → routes/auth.js
/api/users          → routes/users.js
/api/reports        → routes/reports.js
/api/notifications  → routes/notifications.js
/api/suggestions    → routes/suggestions.js
/api/ai             → routes/ai.js
/api/supermod       → routes/supermod.js
/api/support        → routes/support.js
```

### Producción
- Sirve el build estático de React desde `/client/dist`
- SPA fallback: cualquier ruta no API → `index.html`

### Base de datos
```
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4  // Fuerza IPv4
})
```

### HTTP + Socket.io
```
const server = http.createServer(app)
socketModule.init(server)
server.listen(PORT, '0.0.0.0')
```

---

## 21. VARIABLES DE ENTORNO

### Servidor (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5000
NODE_ENV=production | development
FRONTEND_URL=https://vialidades.com

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
EMAIL_USER=vialidades.transito@gmail.com

GROQ_API_KEY=
```

### Cliente (.env)
```
VITE_API_URL=http://localhost:5000  (dev)
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
```

---

## 22. STACK TECNOLÓGICO

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| UI | Material-UI (MUI), Lucide React, React Icons |
| Animaciones | Framer Motion |
| Gráficos | Recharts |
| Mapa | Leaflet + React Leaflet |
| Formularios | Estado local con useState |
| HTTP | Axios (con interceptores globales) |
| Real-time | Socket.io client |
| Face detection | face-api.js + TensorFlow.js |
| Backend | Node.js, Express 5 |
| Base de datos | MongoDB + Mongoose 9 |
| Real-time | Socket.io server |
| Autenticación | JWT + Google OAuth2 |
| Archivos | Multer + multer-storage-cloudinary |
| CDN/Media | Cloudinary |
| Emails | Nodemailer + Gmail OAuth2 |
| Moderación IA | Sightengine API |
| OCR | Tesseract.js |
| AI Vision | Groq Llama 3.2 Vision |
| Seguridad | bcrypt, crypto, helmet (optional) |

---

## 23. RUTAS DEL CLIENTE (React Router)

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | LandingPage | Público (redirige si autenticado) |
| `/login` | Login | Público |
| `/register` | Register | Público |
| `/forgot-password` | ForgotPassword | Público |
| `/reset-password/:token` | ResetPassword | Público |
| `/soporte` | SupportPage | Público |
| `/dashboard` | Dashboard | Autenticado |
| `/create-report` | CreateReport | Autenticado |
| `/profile` | Profile | Autenticado |
| `/moderate` | ModerateReports | Moderador/Admin |
| `/supermoderador` | SuperModDashboard | SuperMod/Admin |
| `/supermoderador/moderadores` | SuperModModerators | SuperMod/Admin |
| `/supermoderador/reportes` | SuperModReports | SuperMod/Admin |
| `/supermoderador/soporte` | SuperModSupport | SuperMod/Admin |

---

## 24. FLUJO COMPLETO — REGISTRO DE USUARIO

```
1. Usuario visita /register
2. Llena formulario paso 1 (datos personales)
3. POST /api/auth/check-duplicates → verifica unicidad
4. Captura foto de cédula → OCR Tesseract → valida nombre y número
5. Captura selfie → face-api → compara con foto cédula (>30% match requerido)
6. POST /api/auth/register
   ├── Crea PendingUser en DB (TTL 1 hora)
   ├── Genera código 6 dígitos
   └── Envía email de verificación
7. Usuario ingresa código en pantalla
8. POST /api/auth/verify
   ├── Valida código y expiración
   ├── Crea User definitivo
   ├── Elimina PendingUser
   └── Devuelve JWT
9. AuthContext guarda token en localStorage
10. Interceptores Axios configuran x-auth-token en headers
11. Navigate a /dashboard
```

---

## 25. FLUJO COMPLETO — LOGIN

```
1. Usuario visita /login
2. Introduce email + password (o click "Continuar con Google")

   ── Login tradicional ──
   POST /api/auth/login { email, password }
   ├── Busca user por email
   ├── bcrypt.compare(password, user.password)
   ├── Verifica user.isActive === true
   ├── Verifica user.blockedUntil (si existe y > Date.now → error)
   ├── Verifica user.sanctions < 3 (si >= 3 → ban permanente)
   ├── Genera nuevo sessionToken (20 bytes)
   ├── Guarda sessionToken en user
   └── Devuelve { token, user }

   ── Login con Google ──
   POST /api/auth/google { credential }
   ├── Verifica Google ID token
   ├── Obtiene email/nombre del payload
   ├── Si existe user con ese email → login normal
   ├── Si no existe → crea User nuevo (isVerified: true, sin KYC)
   └── Devuelve { token, user }

3. AuthContext.login() guarda token en localStorage
4. Axios headers configurados automáticamente
5. Navigate según rol:
   ├── supermoderador → /supermoderador
   ├── moderador/admin → /dashboard
   └── user → /dashboard
```

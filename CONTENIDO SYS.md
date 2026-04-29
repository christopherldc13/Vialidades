# CONTENIDO DEL SISTEMA — VIALIDADES DE TRÁNSITO
> Documento técnico para tesis académica  
> Autor del proyecto: Christopher Lantigua De La Cruz  
> Fecha de documentación: Abril 2026

---

## ÍNDICE

1. [Descripción General del Sistema](#1-descripción-general-del-sistema)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Base de Datos — Modelos MongoDB](#5-base-de-datos--modelos-mongodb)
6. [Backend — API REST (Servidor)](#6-backend--api-rest-servidor)
7. [WebSocket — Comunicación en Tiempo Real](#7-websocket--comunicación-en-tiempo-real)
8. [Frontend — Páginas y Componentes](#8-frontend--páginas-y-componentes)
9. [Sistema de Autenticación](#9-sistema-de-autenticación)
10. [Sistema KYC (Verificación de Identidad)](#10-sistema-kyc-verificación-de-identidad)
11. [Sistema de Moderación](#11-sistema-de-moderación)
12. [Sistema de Sanciones](#12-sistema-de-sanciones)
13. [Integraciones Externas](#13-integraciones-externas)
14. [Flujos Principales del Sistema](#14-flujos-principales-del-sistema)
15. [Variables de Entorno y Configuración](#15-variables-de-entorno-y-configuración)

---

## 1. DESCRIPCIÓN GENERAL DEL SISTEMA

**Vialidades de Tránsito** es una plataforma ciudadana digital diseñada para la República Dominicana que permite a los ciudadanos reportar, consultar y monitorear incidentes viales en tiempo real.

### Propósito
- Permitir a ciudadanos verificados reportar incidentes de tránsito (accidentes, tráfico pesado, infracciones, peligros en la vía).
- Ofrecer un sistema de moderación donde moderadores revisan y validan cada reporte.
- Visualizar la densidad de incidentes mediante un mapa de calor geográfico.
- Garantizar la autenticidad de los usuarios mediante verificación biométrica (KYC).

### Roles del Sistema
| Rol | Permisos |
|-----|----------|
| **Usuario** | Crear reportes, ver reportes aprobados, gestionar perfil, recibir notificaciones |
| **Moderador** | Todo lo anterior + revisar/aprobar/rechazar reportes, sancionar usuarios, ver panel de moderación |
| **Administrador** | Todo lo anterior + gestionar usuarios, crear moderadores |

### Contexto Geográfico
- **País:** República Dominicana
- **Cobertura:** Las 32 provincias del país
- **Mapa base:** Leaflet con capas CartoDB (modo oscuro/claro) y vista satélite (ArcGIS)

---

## 2. ARQUITECTURA DEL PROYECTO

El sistema sigue una arquitectura **MERN Stack** (MongoDB, Express, React, Node.js) organizada como **monorepo**:

```
Vialidades/                  ← Raíz del monorepo
├── client/                  ← Aplicación frontend (React + Vite)
├── server/                  ← Aplicación backend (Node.js + Express)
├── package.json             ← Scripts de build para producción
└── .env                     ← Variables de entorno compartidas
```

### Patrón de Comunicación
```
[Usuario] ──── HTTPS ────► [React SPA (Vite)]
                                    │
                           REST API (Axios)
                                    │
                            [Express Server]
                           /        │        \
                    [MongoDB]  [Socket.IO]  [APIs Externas]
                    (Atlas)    (Tiempo Real) (Cloudinary, Google, IA)
```

---

## 3. TECNOLOGÍAS UTILIZADAS

### 3.1 Frontend (Client)

| Tecnología | Versión | Para qué se usa |
|------------|---------|-----------------|
| **React** | 19.2.0 | Framework principal de la interfaz de usuario |
| **Vite** | 7.2.4 | Bundler y servidor de desarrollo con HMR |
| **React Router DOM** | 7.13.0 | Enrutamiento SPA (Single Page Application) |
| **Axios** | 1.13.4 | Cliente HTTP para llamadas a la API REST |
| **Socket.IO Client** | 4.8.3 | Conexión WebSocket para actualizaciones en tiempo real |
| **Framer Motion** | 12.33.0 | Animaciones y transiciones de UI |
| **Material UI (MUI)** | 7.3.9 | Componentes base (ToggleButtonGroup, Skeleton, DatePicker) |
| **Leaflet + React Leaflet** | 1.9.4 / 5.0.0 | Mapas interactivos y geolocalización |
| **Leaflet.heat** | 0.2.0 | Plugin de mapa de calor para visualizar densidad de reportes |
| **@vladmandic/face-api** | 1.7.15 | Reconocimiento facial para KYC (comparar selfie con cédula) |
| **React Webcam** | 7.2.0 | Acceso a cámara web para captura de selfie y cédula |
| **Recharts** | 3.8.1 | Gráficos estadísticos en el dashboard |
| **Lucide React** | 0.563.0 | Librería de íconos SVG |
| **React Icons** | 5.6.0 | Librería adicional de íconos |
| **React Hot Toast** | 2.6.0 | Notificaciones tipo toast |
| **SweetAlert2** | 11.26.22 | Modales de confirmación y alertas estilizadas |
| **@react-oauth/google** | 0.13.4 | Autenticación con Google OAuth 2.0 |
| **DayJS** | 1.11.19 | Manipulación de fechas |

### 3.2 Backend (Server)

| Tecnología | Versión | Para qué se usa |
|------------|---------|-----------------|
| **Node.js** | LTS | Entorno de ejecución JavaScript del servidor |
| **Express** | 5.2.1 | Framework web para definir rutas y middleware |
| **Mongoose** | 9.1.6 | ODM para interactuar con MongoDB (modelos y esquemas) |
| **MongoDB Atlas** | — | Base de datos NoSQL en la nube |
| **Socket.IO** | 4.8.3 | WebSocket para comunicación bidireccional en tiempo real |
| **bcryptjs** | 3.0.3 | Hashing seguro de contraseñas |
| **jsonwebtoken (JWT)** | 9.0.3 | Generación y verificación de tokens de autenticación |
| **Multer** | 1.4.5 | Middleware para recibir archivos multimedia |
| **Cloudinary** | 1.41.3 | Almacenamiento en la nube de imágenes y videos |
| **Tesseract.js** | 7.0.0 | OCR (reconocimiento óptico de caracteres) para leer la cédula |
| **Jimp** | 1.6.0 | Preprocesamiento de imágenes antes del OCR (escala de grises, contraste, normalización) |
| **@google/generative-ai** | 0.24.1 | SDK de Google Gemini AI |
| **groq-sdk** | 1.1.2 | SDK de Groq (LLaMA Vision) para identificación de vehículos |
| **Nodemailer** | 8.0.1 | Envío de correos electrónicos (verificación, reset de contraseña) |
| **Resend** | 1.1.0 | Servicio alternativo de envío de emails |
| **google-auth-library** | 10.6.2 | Verificación de tokens Google OAuth en el servidor |
| **exif-parser** | 0.1.12 | Extracción de metadatos EXIF de imágenes subidas |
| **dotenv** | 17.2.4 | Carga de variables de entorno desde archivos `.env` |
| **cors** | 2.8.6 | Habilitación de solicitudes entre dominios distintos |

---

## 4. ESTRUCTURA DE CARPETAS

### Frontend — `client/src/`

```
client/src/
├── pages/
│   ├── LandingPage.jsx       ← Página pública de inicio con mapa de calor
│   ├── Login.jsx             ← Inicio de sesión (credenciales o Google)
│   ├── Register.jsx          ← Registro con KYC multi-paso
│   ├── ForgotPassword.jsx    ← Solicitar reset de contraseña
│   ├── ResetPassword.jsx     ← Formulario de nueva contraseña
│   ├── Dashboard.jsx         ← Panel principal (usuarios y moderadores)
│   ├── Profile.jsx           ← Perfil y edición de datos del usuario
│   ├── CreateReport.jsx      ← Formulario de reporte con mapa e IA
│   └── ModerateReports.jsx   ← Panel de moderación de reportes
│
├── components/
│   ├── Navbar.jsx            ← Barra de navegación global
│   ├── HeatMapLayer.jsx      ← Capa de mapa de calor (Leaflet)
│   ├── DraggableMap.jsx      ← Mapa interactivo para seleccionar ubicación
│   ├── MediaGallery.jsx      ← Galería de imágenes/videos del reporte
│   ├── NotificationList.jsx  ← Panel desplegable de notificaciones
│   ├── ReportDetailModal.jsx ← Modal con detalles y acciones de moderación
│   ├── UserDetailModal.jsx   ← Modal con detalles del usuario (para moderadores)
│   ├── CreateModeratorModal.jsx ← Modal para crear nuevos moderadores
│   ├── ModerationTimeline.jsx ← Línea de tiempo del proceso de moderación
│   └── TermsModal.jsx        ← Modal de términos y condiciones
│
├── context/
│   ├── AuthContext.jsx       ← Estado global: usuario, login, logout, registro
│   └── ThemeContext.jsx      ← Estado global: tema claro/oscuro
│
├── App.jsx                   ← Componente raíz con React Router
├── main.jsx                  ← Punto de entrada
├── App.css                   ← Estilos globales de la aplicación
└── index.css                 ← Reset CSS base
```

### Backend — `server/`

```
server/
├── routes/
│   ├── auth.js               ← Registro, login, KYC, reset de contraseña
│   ├── reports.js            ← CRUD de reportes, moderación, estadísticas
│   ├── users.js              ← Gestión de usuarios (admin/moderador)
│   ├── notifications.js      ← CRUD de notificaciones del usuario
│   ├── suggestions.js        ← Recepción de sugerencias de la landing page
│   └── ai.js                 ← Identificación de vehículos con IA
│
├── models/
│   ├── User.js               ← Esquema del usuario registrado
│   ├── PendingUser.js        ← Usuario en espera de verificación (TTL 1h)
│   ├── Report.js             ← Esquema de reporte de incidente
│   ├── Notification.js       ← Esquema de notificaciones
│   ├── Sanction.js           ← Esquema de sanciones aplicadas
│   └── Suggestion.js         ← Esquema de sugerencias de la landing
│
├── middleware/
│   └── auth.js               ← Middleware JWT + validación de sesión única
│
├── socket.js                 ← Configuración de Socket.IO
├── index.js                  ← Punto de entrada del servidor
└── create_admin.js           ← Script para crear usuario administrador
```

---

## 5. BASE DE DATOS — MODELOS MONGODB

### 5.1 Colección: `users` — Modelo `User.js`

Almacena los usuarios verificados y activos del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `username` | String (único) | Nombre de usuario público |
| `email` | String (único) | Correo electrónico |
| `password` | String | Contraseña hasheada con bcrypt |
| `firstName` | String | Nombre de pila |
| `lastName` | String | Apellido |
| `birthDate` | Date | Fecha de nacimiento |
| `gender` | String | Género del usuario |
| `phone` | String | Número de teléfono |
| `cedula` | String (único) | Cédula de identidad dominicana |
| `birthProvince` | String | Provincia de nacimiento |
| `isVerified` | Boolean | Si completó la verificación de email |
| `role` | String | `'user'` / `'moderator'` / `'admin'` |
| `reputation` | Number | Puntos de reputación acumulados |
| `sanctions` | Number | Cantidad de sanciones recibidas |
| `avatar` | String | URL de la foto de perfil (Cloudinary) |
| `sessionToken` | String | Token de sesión única (previene múltiples dispositivos) |
| `resetPasswordToken` | String | Token para reset de contraseña |
| `resetPasswordExpire` | Date | Expiración del token de reset (60 min) |
| `createdAt` | Date | Fecha de registro |

### 5.2 Colección: `pendingusers` — Modelo `PendingUser.js`

Almacena usuarios que completaron el KYC pero aún no verificaron su email. Se eliminan automáticamente tras **1 hora** (TTL de MongoDB).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `username` | String | Nombre de usuario |
| `email` | String | Correo electrónico |
| `password` | String | Contraseña hasheada |
| `firstName` | String | Nombre |
| `lastName` | String | Apellido |
| `birthDate` | Date | Fecha de nacimiento |
| `gender` | String | Género |
| `phone` | String | Teléfono |
| `cedula` | String | Cédula de identidad |
| `birthProvince` | String | Provincia |
| `verificationCode` | String | Código de 6 dígitos enviado al email |
| `createdAt` | Date | TTL Index: se elimina automáticamente a los 3600 segundos |

### 5.3 Colección: `reports` — Modelo `Report.js`

Almacena los reportes de incidentes enviados por los usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Usuario que creó el reporte |
| `type` | String | Tipo: `'Traffic'`, `'Accident'`, `'Violation'`, `'Hazard'` |
| `description` | String | Descripción del incidente |
| `location.lat` | Number | Latitud geográfica |
| `location.lng` | Number | Longitud geográfica |
| `location.address` | String | Dirección en texto (geocodificación inversa) |
| `media[]` | Array | Archivos multimedia (imágenes/videos) con URL, tipo y public_id de Cloudinary |
| `photos[]` | Array | Campo legado de fotos con metadata EXIF |
| `carInfo.brand` | String | Marca del vehículo (identificada por IA) |
| `carInfo.model` | String | Modelo del vehículo |
| `carInfo.year` | Number | Año del vehículo |
| `carInfo.color` | String | Color del vehículo |
| `status` | String | `'pending'` / `'approved'` / `'rejected'` / `'In Process'` |
| `moderatorId` | ObjectId (ref: User) | Moderador que tomó la decisión final |
| `moderatorInCharge` | ObjectId (ref: User) | Moderador que lo tiene bloqueado actualmente |
| `moderatorComment` | String | Comentario o motivo de la decisión |
| `wasSanctioned` | Boolean | Si el reporte resultó en sanción al usuario |
| `timestamp` | Date | Fecha de creación del reporte |

### 5.4 Colección: `notifications` — Modelo `Notification.js`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Destinatario de la notificación |
| `type` | String | `'info'` / `'success'` / `'error'` / `'warning'` |
| `message` | String | Texto de la notificación |
| `read` | Boolean | Si fue leída por el usuario |
| `relatedReportId` | ObjectId (ref: Report) | Reporte relacionado (si aplica) |
| `deleted` | Boolean | Soft delete (no elimina el registro físicamente) |
| `createdAt` | Date | Fecha de creación |

### 5.5 Colección: `sanctions` — Modelo `Sanction.js`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | ObjectId (ref: User) | Usuario sancionado |
| `reportId` | ObjectId (ref: Report) | Reporte que originó la sanción |
| `status` | String | `'active'` / `'inactive'` |
| `expiresAt` | Date o null | `null` = sanción permanente; fecha = temporal |
| `createdAt` | Date | Fecha de la sanción |

### 5.6 Colección: `suggestions` — Modelo `Suggestion.js`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | String | Nombre del remitente |
| `email` | String | Correo del remitente |
| `message` | String | Texto de la sugerencia |
| `createdAt` | Date | Fecha de envío |

---

## 6. BACKEND — API REST (SERVIDOR)

### 6.1 Rutas de Autenticación — `/api/auth`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/check-duplicates` | Público | Verifica si username, email, cédula o teléfono ya están registrados |
| POST | `/register` | Público | Registro con KYC (OCR + reconocimiento facial), crea `PendingUser` |
| POST | `/verify` | Público | Verifica código de email y mueve datos a `User` |
| POST | `/login` | Público | Login con email y contraseña, retorna JWT |
| POST | `/google` | Público | Login con token Google OAuth |
| GET | `/me` | Autenticado | Obtiene datos del usuario logueado |
| PATCH | `/profile` | Autenticado | Actualiza datos del perfil y avatar |
| POST | `/forgot-password` | Público | Envía email con link de reset de contraseña |
| POST | `/reset-password/:token` | Público | Actualiza la contraseña usando el token |

### 6.2 Rutas de Reportes — `/api/reports`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/` | Autenticado | Crea un nuevo reporte (hasta 5 archivos multimedia) |
| GET | `/` | Autenticado | Lista reportes (filtrado por status, rol, usuario) |
| GET | `/public` | Público | Reportes aprobados para el mapa de calor de la landing |
| GET | `/stats` | Moderador/Admin | Estadísticas de conteo por status |
| GET | `/:id` | Autenticado | Obtiene un reporte específico |
| PUT | `/:id/lock` | Moderador/Admin | Bloquea el reporte (`In Process`) para revisión exclusiva |
| PUT | `/:id/unlock` | Moderador/Admin | Libera el bloqueo de un reporte |
| PATCH | `/:id/moderate` | Moderador/Admin | Aprueba o rechaza un reporte, aplica sanción opcional |

### 6.3 Rutas de Usuarios — `/api/users`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| GET | `/` | Moderador/Admin | Lista todos los usuarios del sistema |
| PUT | `/promote` | Admin | Promueve a un usuario a rol moderador |
| POST | `/moderator` | Admin | Crea un nuevo moderador directamente |

### 6.4 Rutas de Notificaciones — `/api/notifications`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| GET | `/` | Autenticado | Obtiene las últimas 20 notificaciones del usuario |
| PATCH | `/:id/read` | Autenticado | Marca una notificación como leída |
| PATCH | `/read-all` | Autenticado | Marca todas las notificaciones como leídas |
| DELETE | `/:id` | Autenticado | Soft delete de una notificación |

### 6.5 Rutas de Sugerencias — `/api/suggestions`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/` | Público | Recibe sugerencia desde el formulario de la landing page |

### 6.6 Rutas de Inteligencia Artificial — `/api/ai`

| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/identify-vehicle` | Autenticado | Recibe imagen de vehículo y retorna marca, modelo, año y color usando Groq LLaMA Vision |

### 6.7 Middleware de Autenticación — `server/middleware/auth.js`

Protege las rutas que requieren autenticación:
1. Extrae el token del header `x-auth-token`
2. Verifica la firma del JWT con `JWT_SECRET`
3. Compara el `sessionToken` del JWT con el guardado en la base de datos
4. Si son diferentes → rechaza con 401 (sesión abierta en otro dispositivo)
5. Si son iguales → adjunta `req.user` y continúa

---

## 7. WEBSOCKET — COMUNICACIÓN EN TIEMPO REAL

El sistema usa **Socket.IO** para que los moderadores reciban actualizaciones inmediatas sin recargar la página.

### Archivo: `server/socket.js`

#### Eventos del servidor hacia el cliente

| Evento | Cuándo se emite | Datos enviados |
|--------|-----------------|----------------|
| `new_report` | Usuario crea un reporte | `{ reportId }` |
| `report_status_updated` | Moderador aprueba/rechaza | `{ reportId, status, moderatorName }` |
| `report_unlocked` | Reporte liberado (auto o manual) | `{ reportId }` |

#### Eventos del cliente hacia el servidor

| Evento | Cuándo se emite | Propósito |
|--------|-----------------|-----------|
| `join_moderation` | Moderador entra al panel | Se une a la sala de moderación |
| `lock_report` | Moderador abre un reporte | Registra el bloqueo en memoria (`activeLocks`) |
| `unlock_report` | Moderador cierra sin moderar | Libera el reporte |

#### Lógica de Auto-liberación
Si un moderador cierra el navegador o pierde la conexión mientras tiene un reporte bloqueado (`In Process`), el servidor detecta la desconexión del socket y automáticamente:
- Cambia el status del reporte de `'In Process'` a `'pending'`
- Notifica a todos los demás moderadores conectados

---

## 8. FRONTEND — PÁGINAS Y COMPONENTES

### 8.1 Páginas

#### `LandingPage.jsx` — Página Pública
- Mapa de calor interactivo con los reportes aprobados (Leaflet + leaflet.heat)
- Toggle de vista: Callejero (CartoDB) / Satélite (ArcGIS)
- Sección de características del sistema
- Línea de tiempo del proceso de moderación (`ModerationTimeline`)
- Formulario de sugerencias ciudadanas
- Sección de Reglas y Términos de Uso

#### `Register.jsx` — Registro Multi-paso con KYC
**Paso 1:** Datos personales (nombre, cédula, fecha de nacimiento, género, provincia, teléfono, email, contraseña)  
**Paso 2:** Verificación de duplicados via API  
**Paso 3:** KYC — Captura de cédula con cámara web + OCR en el servidor  
**Paso 4:** KYC — Selfie en tiempo real + comparación facial con foto de cédula  
**Paso 5:** Código de verificación enviado al email  

#### `Login.jsx` — Inicio de Sesión
- Formulario con email y contraseña
- Login con Google (OAuth 2.0)
- Detección de sanciones activas (muestra tiempo restante de bloqueo)
- Redirección automática al dashboard

#### `Dashboard.jsx` — Panel Principal
- Vista **Comunidad**: reportes aprobados de todos los usuarios
- Vista **Mis Reportes**: reportes propios con todos los estados
- Filtros: por tipo de incidente y provincia (selects)
- Filtro de estado (solo en "Mis Reportes"): pendiente, aprobado, rechazado, sancionado
- Estadísticas visuales con Recharts (gráficos de barras y torta)
- Actualización en tiempo real vía WebSocket
- Para moderadores: acceso directo al panel de moderación con reportes pendientes

#### `CreateReport.jsx` — Creación de Reporte
- Mapa interactivo (Leaflet) para seleccionar la ubicación exacta del incidente
- Selección del tipo de incidente
- Descripción en texto libre
- Upload de hasta 5 archivos (imágenes o videos)
- Identificación de vehículo con IA (Groq LLaMA Vision): el usuario sube una foto y el sistema devuelve marca, modelo, año y color automáticamente
- Barra de progreso durante la subida

#### `ModerateReports.jsx` — Panel de Moderación
- Tabs de filtrado por estado: Pendientes, Aprobados, Rechazados, Sancionados, Historial, Usuarios
- En el tab **Historial**: filtros adicionales por tipo y provincia
- Bloqueo exclusivo de reportes (`In Process`) al abrirlos
- Modal de detalles con galería de media, información del reporte y botones de decisión
- Opción de sancionar al usuario al rechazar un reporte
- Lista de usuarios con detalles y estado de verificación

#### `Profile.jsx` — Perfil de Usuario
- Visualización de datos personales
- Edición de perfil (nombre, email, teléfono, provincia)
- Cambio de foto de perfil (Cloudinary)
- Indicador de verificación KYC
- Historial de reputación y sanciones

### 8.2 Componentes Reutilizables

| Componente | Descripción |
|------------|-------------|
| `Navbar.jsx` | Barra superior con navegación, notificaciones, perfil y toggle de tema |
| `HeatMapLayer.jsx` | Capa de calor sobre Leaflet para visualizar densidad de reportes |
| `DraggableMap.jsx` | Mapa interactivo para que el usuario marque la ubicación del incidente |
| `MediaGallery.jsx` | Galería con lightbox para ver imágenes y videos del reporte |
| `NotificationList.jsx` | Panel de notificaciones con marcado de leído y eliminación |
| `ReportDetailModal.jsx` | Modal completo de un reporte con acciones de moderación |
| `UserDetailModal.jsx` | Modal con expediente del usuario (para moderadores) |
| `CreateModeratorModal.jsx` | Formulario modal para crear moderadores (solo admin) |
| `ModerationTimeline.jsx` | Línea de tiempo visual del proceso: Creación → Revisión → Decisión |
| `TermsModal.jsx` | Modal con los términos y condiciones de uso completos |

### 8.3 Contextos (Estado Global)

#### `AuthContext.jsx`
Maneja todo el estado relacionado con la sesión del usuario:
- Carga automática desde `localStorage` al iniciar la app
- Interceptor de Axios global: detecta si la sesión fue iniciada en otro dispositivo y fuerza el logout
- Funciones: `login`, `loginWithGoogle`, `register`, `verifyEmail`, `logout`, `checkRegistrationDuplicates`

#### `ThemeContext.jsx`
Maneja el tema visual del sistema:
- Detecta la preferencia del sistema operativo (`prefers-color-scheme`)
- Persiste la preferencia en `localStorage`
- Aplica la clase `dark` al elemento `<html>` para activar estilos CSS Variables

---

## 9. SISTEMA DE AUTENTICACIÓN

### 9.1 Registro con Verificación de Email

```
Usuario llena formulario
        ↓
POST /api/auth/check-duplicates
(valida que no existan duplicados)
        ↓
POST /api/auth/register
(proceso KYC + guarda PendingUser)
        ↓
Servidor envía código 6 dígitos al email
        ↓
Usuario ingresa código
        ↓
POST /api/auth/verify
(PendingUser → User, genera JWT, loguea automáticamente)
```

### 9.2 Login con Sesión Única

El sistema implementa **sesión de dispositivo único**: cada login genera un `sessionToken` aleatorio que se guarda en la base de datos y también se incluye en el JWT. Si el usuario inicia sesión desde otro dispositivo, el `sessionToken` anterior queda inválido y la sesión anterior se cierra automáticamente.

### 9.3 JWT (JSON Web Token)
- **Expiración:** 5 horas
- **Payload:** `{ id, role, sessionToken }`
- **Header requerido:** `x-auth-token: <token>`
- **Almacenamiento cliente:** `localStorage['token']`

### 9.4 Login con Google OAuth
1. El cliente obtiene un ID Token de Google vía `@react-oauth/google`
2. Lo envía al servidor: `POST /api/auth/google`
3. El servidor verifica el token con `google-auth-library`
4. Busca el usuario por email (debe estar previamente registrado en Vialidades)
5. Genera JWT propio del sistema

### 9.5 Reset de Contraseña
1. Usuario solicita reset: `POST /api/auth/forgot-password`
2. Servidor genera token único hasheado (válido 60 minutos)
3. Envía email con link: `/reset-password/<token>`
4. Usuario establece nueva contraseña: `POST /api/auth/reset-password/:token`
5. Token se invalida tras el uso

---

## 10. SISTEMA KYC (VERIFICACIÓN DE IDENTIDAD)

El KYC (Know Your Customer) es obligatorio para registrarse. El proceso valida que el usuario sea quien dice ser.

### Paso 1 — Captura y OCR de la Cédula

1. El usuario captura su cédula con la cámara web (`react-webcam`)
2. La imagen se envía al servidor junto con los datos del formulario
3. **Preprocesamiento con Jimp:**
   - Conversión a escala de grises
   - Aumento de contraste
   - Normalización de brillo
   - Escalado al doble (mejora precisión del OCR)
4. **OCR con Tesseract.js** en idioma español
5. El servidor extrae el nombre y número de cédula del texto reconocido
6. Valida que el nombre del formulario aparezca en el documento
7. Valida que el número de cédula del formulario coincida con el documento

### Paso 2 — Comparación Facial

1. El usuario se toma una selfie con la cámara web
2. La imagen se envía al servidor junto con la imagen de la cédula
3. **Face-API (`@vladmandic/face-api`)** extrae descriptores faciales de ambas imágenes
4. Se calcula la **distancia euclidiana** entre los descriptores
5. Si la similitud es mayor al **30%** → KYC aprobado
6. Si no hay suficiente similitud → registro rechazado

### Flujo Completo KYC

```
Formulario de registro
        ↓
Cámara web → foto de cédula
        ↓
[Servidor] Jimp: preprocesar imagen
        ↓
[Servidor] Tesseract.js: OCR en español
        ↓
Validar nombre y cédula en documento
        ↓
Cámara web → selfie
        ↓
[Servidor] Face-API: descriptores faciales
        ↓
Comparar selfie vs foto cédula
        ↓
KYC aprobado → crear PendingUser → enviar código email
```

---

## 11. SISTEMA DE MODERACIÓN

### Flujo de Moderación de Reportes

```
Usuario crea reporte (status: 'pending')
        ↓
WebSocket notifica a moderadores
        ↓
Moderador abre reporte → PUT /api/reports/:id/lock
(status: 'In Process', se registra moderatorInCharge)
        ↓
Solo ese moderador puede accionar
        ↓
Decisión: Aprobar o Rechazar
        ↓
PATCH /api/reports/:id/moderate
        ↓
┌─────────────────────────────────┐
│  Aprobado → status: 'approved'  │
│  + Notificación al usuario      │
│  + WebSocket a moderadores      │
└─────────────────────────────────┘
        O
┌────────────────────────────────────────┐
│  Rechazado → status: 'rejected'        │
│  Opción: sanctionUser = true           │
│  → Crea documento Sanction             │
│  → user.sanctions++                    │
│  + Notificación al usuario             │
│  + WebSocket a moderadores             │
└────────────────────────────────────────┘
```

### Prevención de Conflictos (Concurrencia)
- Cuando un moderador abre un reporte pendiente, se marca como `'In Process'` y se guarda el `moderatorInCharge`
- Otros moderadores ven el reporte como "En Revisión por otro Moderador" y no pueden abrirlo
- Si el moderador se desconecta, el socket del servidor auto-libera el reporte

---

## 12. SISTEMA DE SANCIONES

| Sanciones acumuladas | Consecuencia |
|---------------------|--------------|
| 1 sanción | El usuario puede seguir usando la plataforma con restricciones |
| 3 sanciones | No puede crear nuevos reportes |
| Sanción activa (login) | Acceso bloqueado hasta que expire la sanción |
| Sanción permanente (`expiresAt: null`) | Cuenta inhabilitada definitivamente |

Las sanciones se gestionan al rechazar un reporte con la opción `sanctionUser: true`. El sistema:
1. Crea un documento `Sanction` en la colección `sanctions`
2. Incrementa el contador `user.sanctions` en el modelo `User`
3. Envía notificación al usuario
4. Marca el reporte como `wasSanctioned: true`

---

## 13. INTEGRACIONES EXTERNAS

### 13.1 MongoDB Atlas
- Base de datos NoSQL en la nube de MongoDB
- Conexión con `MONGO_URI` (string de conexión Atlas)
- Configuración: timeout 5s, socket timeout 45s, forzado IPv4
- DNS configurado con servidores de Google (8.8.8.8)

### 13.2 Cloudinary
- Almacenamiento de imágenes y videos de los reportes
- También almacena los avatares de usuario
- Integrado con `multer-storage-cloudinary` para procesar uploads directamente
- Retorna URLs públicas y `public_id` para gestión futura

### 13.3 Google OAuth 2.0
- Permite iniciar sesión con cuenta de Google
- Cliente: `@react-oauth/google` (botón de Google en el frontend)
- Servidor: `google-auth-library` verifica el ID Token

### 13.4 Groq — LLaMA Vision (IA para Vehículos)
- Modelo: `meta-llama/llama-4-scout-17b-16e-instruct`
- Recibe imagen de un vehículo y retorna un JSON con: `brand`, `model`, `year`, `color`
- Temperature: 0.1 (respuestas deterministas)
- Se usa en `CreateReport.jsx` para identificar automáticamente el vehículo involucrado

### 13.5 Tesseract.js (OCR)
- Motor de reconocimiento óptico de caracteres
- Configurado en idioma español (`spa`)
- Procesa la imagen preprocesada de la cédula
- Extrae texto para validar nombre y número de documento

### 13.6 @vladmandic/face-api (Reconocimiento Facial)
- Librería de detección y reconocimiento facial basada en TensorFlow
- Extrae descriptores faciales (vectores numéricos) de imágenes
- Calcula distancia euclidiana entre el rostro de la selfie y el de la cédula
- Umbral de similitud: mínimo 30% de coincidencia

### 13.7 Nodemailer / Resend (Emails)
- **Nodemailer:** Envío de emails usando cuenta Gmail con OAuth 2.0
- **Resend:** Servicio alternativo de email transaccional
- Casos de uso: código de verificación de registro, link de reset de contraseña, notificaciones de moderación

### 13.8 Jimp (Procesamiento de Imágenes)
- Preprocesa la imagen de la cédula antes de pasarla al OCR
- Operaciones aplicadas: escala de grises → aumento de contraste → normalización → escalado 2x
- Mejora significativamente la precisión del OCR en imágenes de documentos

---

## 14. FLUJOS PRINCIPALES DEL SISTEMA

### Flujo 1: Registro de Nuevo Usuario
```
1. Usuario accede a /register
2. Completa datos personales (formulario multi-paso)
3. Sistema verifica duplicados (API)
4. Usuario captura foto de su cédula con la cámara
5. Servidor procesa OCR → valida nombre y cédula
6. Usuario se toma una selfie
7. Servidor compara selfie con foto de la cédula
8. Si KYC aprobado: se crea PendingUser y se envía código al email
9. Usuario ingresa el código de 6 dígitos
10. PendingUser se convierte en User → JWT generado → redirige al dashboard
```

### Flujo 2: Creación de Reporte
```
1. Usuario accede a /create-report (debe estar verificado, sin 3+ sanciones)
2. Selecciona el tipo de incidente
3. Describe el incidente en texto
4. Marca la ubicación en el mapa interactivo
5. (Opcional) Sube foto del vehículo → IA identifica marca/modelo/año/color
6. Adjunta hasta 5 archivos multimedia (imágenes o videos)
7. Envía el reporte → guardado con status 'pending'
8. Socket.IO notifica a moderadores en tiempo real
```

### Flujo 3: Moderación de Reporte
```
1. Moderador ve reporte con status 'pending' en su panel
2. Abre el reporte → se bloquea automáticamente (status: 'In Process')
3. Otros moderadores ven el reporte como no disponible
4. Moderador revisa descripción, media, ubicación, datos del vehículo
5. Toma decisión: Aprobar o Rechazar
   - Si rechaza con sanción: usuario recibe sanción acumulativa
6. Reporte cambia de status, se registra comentario del moderador
7. Se crea notificación para el usuario
8. Socket.IO notifica a todos los moderadores del cambio
```

### Flujo 4: Sesión Única por Dispositivo
```
1. Usuario A inicia sesión en Dispositivo 1
   → sessionToken "ABC" guardado en BD y en JWT
2. Usuario A inicia sesión en Dispositivo 2
   → sessionToken "XYZ" guardado en BD (reemplaza "ABC")
3. Próxima request desde Dispositivo 1
   → Middleware detecta sessionToken "ABC" ≠ "XYZ" en BD
   → Rechaza con 401 "Sesión iniciada en otro dispositivo"
   → Frontend fuerza logout en Dispositivo 1
```

---

## 15. VARIABLES DE ENTORNO Y CONFIGURACIÓN

### Variables del Sistema (`.env`)

| Variable | Propósito |
|----------|-----------|
| `MONGO_URI` | String de conexión a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `PORT` | Puerto del servidor (default: 5000) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google (frontend) |
| `GOOGLE_CLIENT_ID` | Client ID de Google (backend) |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google |
| `GOOGLE_REFRESH_TOKEN` | Refresh Token para Gmail API |
| `RESEND_API_KEY` | API Key del servicio Resend (emails) |
| `EMAIL_USER` | Cuenta de email para envío |
| `FRONTEND_URL` | URL del frontend (para links en emails) |
| `GOOGLE_AI_KEY` | API Key de Google Gemini AI |
| `GROQ_API_KEY` | API Key de Groq (LLaMA Vision) |

### Configuración de Vite (`client/vite.config.js`)
- Servidor de desarrollo: **HTTPS en puerto 5173** (SSL básico local)
- Proxy `/api` → `http://localhost:5000` (evita CORS en desarrollo)
- Proxy `/uploads` → `http://localhost:5000`

### Build de Producción
El `package.json` raíz define el proceso de despliegue:
1. `cd client && npm install && npm run build` → genera `client/dist/`
2. `cd server && npm install`
3. Express sirve los archivos estáticos de `client/dist/` en producción
4. Todas las rutas no-API redirigen a `index.html` (SPA routing)

---

*Documento generado para uso académico — Proyecto de Tesis.*  
*Sistema: Vialidades de Tránsito | República Dominicana | 2026*

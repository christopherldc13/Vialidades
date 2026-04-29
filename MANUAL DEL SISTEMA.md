# MANUAL DEL SISTEMA — VIALIDADES DE TRÁNSITO
> Ingeniería en Sistemas de Información  
> Documento técnico para Tesis de Grado  
> Autor: Christopher Lantigua De La Cruz  
> Versión: 1.0 | Abril 2026

---

## ÍNDICE GENERAL

### PARTE I — MANUAL TÉCNICO DE INSTALACIÓN
1. [Requisitos del Sistema](#1-requisitos-del-sistema)
2. [Instalación del Entorno de Desarrollo](#2-instalación-del-entorno-de-desarrollo)
3. [Configuración de Servicios Externos](#3-configuración-de-servicios-externos)
4. [Configuración de Variables de Entorno](#4-configuración-de-variables-de-entorno)
5. [Ejecución del Sistema](#5-ejecución-del-sistema)
6. [Despliegue en Producción](#6-despliegue-en-producción)

### PARTE II — MANUAL DE USUARIO
7. [Introducción al Sistema](#7-introducción-al-sistema)
8. [Acceso al Sistema](#8-acceso-al-sistema)
9. [Registro de Nuevo Usuario](#9-registro-de-nuevo-usuario)
10. [Panel Principal — Dashboard](#10-panel-principal--dashboard)
11. [Crear un Reporte de Incidente](#11-crear-un-reporte-de-incidente)
12. [Gestión de Notificaciones](#12-gestión-de-notificaciones)
13. [Perfil de Usuario](#13-perfil-de-usuario)

### PARTE III — MANUAL DE MODERADOR
14. [Acceso al Panel de Moderación](#14-acceso-al-panel-de-moderación)
15. [Revisión y Moderación de Reportes](#15-revisión-y-moderación-de-reportes)
16. [Gestión del Historial](#16-gestión-del-historial)
17. [Gestión de Usuarios](#17-gestión-de-usuarios)

### PARTE IV — MANUAL DE ADMINISTRADOR
18. [Privilegios del Administrador](#18-privilegios-del-administrador)
19. [Creación de Moderadores](#19-creación-de-moderadores)
20. [Gestión de Roles](#20-gestión-de-roles)
21. [Solución de Problemas Frecuentes](#21-solución-de-problemas-frecuentes)

---

# PARTE I — MANUAL TÉCNICO DE INSTALACIÓN

---

## 1. REQUISITOS DEL SISTEMA

### 1.1 Requisitos de Hardware (Servidor)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| Procesador | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 |
| Memoria RAM | 4 GB | 8 GB o más |
| Almacenamiento | 10 GB libres | 20 GB SSD |
| Conexión a Internet | 10 Mbps | 50 Mbps o más |

### 1.2 Requisitos de Software

| Software | Versión Mínima | Propósito |
|----------|---------------|-----------|
| **Node.js** | 18.x LTS o superior | Entorno de ejecución del servidor y cliente |
| **npm** | 9.x o superior | Gestor de paquetes de Node.js |
| **Git** | 2.x | Control de versiones |
| **Navegador web** | Chrome 110+ / Firefox 110+ / Edge 110+ | Para acceder al sistema |

> **Nota:** MongoDB no se instala localmente. El sistema usa **MongoDB Atlas** (servicio en la nube). Solo se requiere conexión a internet.

### 1.3 Puertos Requeridos

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 5000 | Backend (Express) | API REST y Socket.IO |
| 5173 | Frontend (Vite) | Servidor de desarrollo React |

---

## 2. INSTALACIÓN DEL ENTORNO DE DESARROLLO

### 2.1 Instalación de Node.js

1. Visitar la página oficial: **https://nodejs.org**
2. Descargar la versión **LTS** (Long Term Support)
3. Ejecutar el instalador y seguir los pasos
4. Verificar la instalación abriendo una terminal:

```bash
node --version
# Debe mostrar algo como: v20.x.x

npm --version
# Debe mostrar algo como: 10.x.x
```

### 2.2 Clonar el Repositorio

```bash
# Clonar el proyecto desde GitHub
git clone https://github.com/ChristopherLDC/Vialidades.git

# Ingresar a la carpeta del proyecto
cd Vialidades
```

### 2.3 Instalar Dependencias del Servidor (Backend)

```bash
# Ingresar a la carpeta del servidor
cd server

# Instalar todas las dependencias
npm install

# Regresar a la carpeta raíz
cd ..
```

### 2.4 Instalar Dependencias del Cliente (Frontend)

```bash
# Ingresar a la carpeta del cliente
cd client

# Instalar todas las dependencias
npm install

# Regresar a la carpeta raíz
cd ..
```

### 2.5 Verificar la Instalación

Después de instalar, la estructura de carpetas debe verse así:

```
Vialidades/
├── client/
│   ├── node_modules/     ← Debe existir después de npm install
│   ├── src/
│   └── package.json
├── server/
│   ├── node_modules/     ← Debe existir después de npm install
│   ├── routes/
│   └── package.json
└── .env                  ← Debe crearse manualmente (ver sección 4)
```

---

## 3. CONFIGURACIÓN DE SERVICIOS EXTERNOS

El sistema requiere cuentas en los siguientes servicios. Todos tienen planes gratuitos suficientes para desarrollo.

### 3.1 MongoDB Atlas (Base de Datos)

1. Crear cuenta en **https://www.mongodb.com/atlas**
2. Crear un nuevo proyecto y clúster gratuito (M0 Free Tier)
3. En **Database Access**: crear usuario con contraseña
4. En **Network Access**: añadir IP `0.0.0.0/0` (permite todas las IPs en desarrollo)
5. En **Connect**: seleccionar "Connect your application" y copiar el string de conexión

El string tendrá este formato:
```
mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/<nombreBD>?retryWrites=true&w=majority
```

### 3.2 Cloudinary (Almacenamiento de Imágenes)

1. Crear cuenta en **https://cloudinary.com**
2. Ir al **Dashboard**
3. Copiar los tres valores: `Cloud Name`, `API Key`, `API Secret`

### 3.3 Google OAuth (Autenticación con Google)

1. Ir a **https://console.cloud.google.com**
2. Crear un nuevo proyecto
3. Ir a **APIs & Services → Credentials**
4. Crear credenciales de tipo **OAuth 2.0 Client ID**
5. Tipo de aplicación: **Web Application**
6. Añadir en "Authorized JavaScript origins":
   - `https://localhost:5173`
   - `http://localhost:5173`
7. Añadir en "Authorized redirect URIs":
   - `https://localhost:5173`
8. Copiar el **Client ID** y **Client Secret**

### 3.4 Groq (IA para Identificación de Vehículos)

1. Crear cuenta en **https://console.groq.com**
2. Ir a **API Keys** y generar una nueva clave
3. Copiar la API Key generada

### 3.5 Resend (Servicio de Email)

1. Crear cuenta en **https://resend.com**
2. Ir a **API Keys** y generar una nueva clave
3. Copiar la API Key
4. (Opcional) Verificar un dominio propio para producción

---

## 4. CONFIGURACIÓN DE VARIABLES DE ENTORNO

Crear un archivo llamado **`.env`** en la **carpeta raíz** del proyecto (al mismo nivel que las carpetas `client` y `server`).

```bash
# Ubicación correcta del archivo:
# Vialidades/.env
```

### 4.1 Contenido del archivo `.env`

Copiar el siguiente contenido y reemplazar cada valor con los datos obtenidos en la sección anterior:

```env
# ── BASE DE DATOS ──────────────────────────────────────
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/vialidades?retryWrites=true&w=majority

# ── AUTENTICACIÓN JWT ───────────────────────────────────
JWT_SECRET=coloca_aqui_una_clave_secreta_larga_y_segura

# ── SERVIDOR ────────────────────────────────────────────
PORT=5000

# ── CLOUDINARY (Imágenes) ───────────────────────────────
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ── GOOGLE OAUTH ────────────────────────────────────────
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# ── EMAIL ───────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_USER=tu_correo@gmail.com

# ── INTELIGENCIA ARTIFICIAL ─────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# ── FRONTEND ────────────────────────────────────────────
FRONTEND_URL=https://localhost:5173
```

> **⚠ IMPORTANTE:** Este archivo contiene credenciales privadas. Nunca debe subirse a GitHub. Verificar que `.env` esté en el archivo `.gitignore`.

### 4.2 Variable de Entorno del Cliente

Crear también el archivo **`client/.env`** con el siguiente contenido:

```env
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
```

---

## 5. EJECUCIÓN DEL SISTEMA

### 5.1 Iniciar el Servidor (Backend)

Abrir una **primera terminal** y ejecutar:

```bash
# Desde la carpeta raíz del proyecto
cd server
npm start
```

Si el servidor inició correctamente, verás en la terminal:
```
Server running on port 5000
MongoDB Connected
```

### 5.2 Iniciar el Cliente (Frontend)

Abrir una **segunda terminal** y ejecutar:

```bash
# Desde la carpeta raíz del proyecto
cd client
npm run dev
```

Si el cliente inició correctamente, verás:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   https://localhost:5173/
```

### 5.3 Acceder al Sistema

1. Abrir el navegador web (Chrome o Firefox recomendado)
2. Navegar a: **https://localhost:5173**
3. Si el navegador muestra advertencia de certificado SSL:
   - En Chrome: clic en "Configuración avanzada" → "Continuar a localhost"
   - En Firefox: clic en "Aceptar el riesgo y continuar"

### 5.4 Crear el Usuario Administrador

La primera vez que se ejecuta el sistema, es necesario crear el usuario administrador manualmente:

```bash
# Desde la carpeta server, ejecutar:
cd server
node create_admin.js
```

Esto creará un usuario administrador con las credenciales predefinidas en el script. Iniciar sesión con esas credenciales y cambiar la contraseña desde el perfil.

---

## 6. DESPLIEGUE EN PRODUCCIÓN

### 6.1 Generar el Build del Frontend

```bash
# Desde la carpeta raíz
cd client
npm run build
```

Esto genera la carpeta `client/dist/` con los archivos optimizados para producción.

### 6.2 Configurar el Servidor para Producción

En producción, Express sirve directamente los archivos estáticos del frontend. Establecer la variable de entorno:

```env
NODE_ENV=production
```

### 6.3 Iniciar en Modo Producción

```bash
cd server
npm start
```

El sistema estará disponible en el puerto definido en `PORT` (por defecto 5000).

### 6.4 Variables a Actualizar para Producción

| Variable | Valor en Desarrollo | Valor en Producción |
|----------|--------------------|--------------------|
| `FRONTEND_URL` | `https://localhost:5173` | `https://tudominio.com` |
| `NODE_ENV` | (no definido) | `production` |

---

# PARTE II — MANUAL DE USUARIO

---

## 7. INTRODUCCIÓN AL SISTEMA

**Vialidades de Tránsito** es una plataforma ciudadana digital que permite a los residentes de la República Dominicana reportar y consultar incidentes viales en tiempo real.

### ¿Para qué sirve?

- **Reportar** accidentes, tráfico pesado, infracciones y peligros en las vías
- **Consultar** el estado del tráfico en tu zona a través del mapa de calor
- **Seguir** el estado de tus reportes (pendiente, aprobado, rechazado)
- **Recibir notificaciones** sobre el resultado de tus reportes

### Tipos de Incidentes que se Pueden Reportar

| Tipo | Descripción |
|------|-------------|
| **Tráfico Pesado** | Congestión vehicular significativa |
| **Accidente** | Colisión entre vehículos o con peatones |
| **Infracción** | Vehículo cometiendo una violación de tránsito |
| **Peligro en la Vía** | Obstáculo, bache, señal caída u otro riesgo |

---

## 8. ACCESO AL SISTEMA

### 8.1 Página de Inicio

Al ingresar a la dirección del sistema, se mostrará la **página de inicio (Landing Page)** con:
- Un **mapa de calor** con los reportes aprobados en la República Dominicana
- Información sobre cómo funciona la plataforma
- Botones para **Iniciar Sesión** y **Registrarme** en la barra superior

### 8.2 Iniciar Sesión con Correo y Contraseña

1. Hacer clic en **"Iniciar Sesión"** en la barra de navegación
2. Ingresar el **correo electrónico** y la **contraseña** registrados
3. Hacer clic en **"Iniciar Sesión"**
4. Si los datos son correctos, el sistema redirige al **Dashboard**

### 8.3 Iniciar Sesión con Google

1. En la página de login, hacer clic en el botón **"Continuar con Google"**
2. Seleccionar la cuenta de Google asociada al registro
3. El sistema verificará que el correo esté registrado en Vialidades
4. Si es válido, redirige automáticamente al **Dashboard**

> **Nota:** Para usar el login con Google, la cuenta de Google debe coincidir con el correo con el que te registraste previamente en Vialidades.

### 8.4 Recuperar Contraseña

Si olvidaste tu contraseña:

1. En la página de login, hacer clic en **"¿Olvidaste tu contraseña?"**
2. Ingresar el correo electrónico registrado
3. Hacer clic en **"Enviar enlace de recuperación"**
4. Revisar el correo electrónico (incluyendo la carpeta de spam)
5. Hacer clic en el enlace recibido (válido por **60 minutos**)
6. Ingresar y confirmar la nueva contraseña
7. Hacer clic en **"Restablecer Contraseña"**

---

## 9. REGISTRO DE NUEVO USUARIO

El registro en Vialidades requiere verificación de identidad (KYC) para garantizar que todos los usuarios sean personas reales. El proceso tiene varios pasos.

> **Antes de comenzar, tener a mano:**
> - Cédula de identidad dominicana (física o imagen clara)
> - Acceso a la cámara web del dispositivo
> - Acceso al correo electrónico que vas a registrar

### Paso 1 — Datos Personales

1. Hacer clic en **"Registrarme"** en la barra de navegación
2. Completar todos los campos del formulario:

| Campo | Descripción |
|-------|-------------|
| Nombre | Tu nombre de pila |
| Apellido | Tu apellido |
| Nombre de usuario | Identificador único público (ej: `juan123`) |
| Correo electrónico | Tu email activo |
| Contraseña | Mínimo 8 caracteres |
| Cédula | Número de cédula sin guiones |
| Teléfono | Número de teléfono dominicano |
| Fecha de nacimiento | Seleccionar del calendario |
| Género | Seleccionar de la lista |
| Provincia | Provincia de nacimiento |

3. Hacer clic en **"Continuar"**

> Si algún dato ya está registrado (correo, cédula, usuario), el sistema notificará cuál campo está duplicado.

### Paso 2 — Verificación de Cédula (KYC - Parte 1)

1. El sistema abrirá la cámara web del dispositivo
2. Sostener la **cédula de identidad** frente a la cámara de forma que sea legible
3. Asegurarse de que:
   - La cédula esté bien iluminada
   - No haya reflejos sobre el documento
   - El número y nombre sean visibles claramente
4. Hacer clic en **"Capturar"**
5. El sistema procesará la imagen y verificará que los datos coincidan con el formulario
6. Si hay error, se puede repetir la captura

### Paso 3 — Verificación Facial (KYC - Parte 2)

1. El sistema pedirá una **selfie** para comparar el rostro con la foto de la cédula
2. Colocarse frente a la cámara con buena iluminación
3. Mirar directamente a la cámara
4. Hacer clic en **"Tomar Selfie"**
5. El sistema comparará el rostro con la foto del documento automáticamente

> Si la comparación falla, verificar que haya buena iluminación y que el rostro esté centrado en la cámara.

### Paso 4 — Verificación de Correo Electrónico

1. Después del KYC exitoso, el sistema envía un **código de 6 dígitos** al correo registrado
2. Revisar la bandeja de entrada (y carpeta de spam)
3. Ingresar el código en el campo correspondiente
4. Hacer clic en **"Verificar"**
5. Si el código es correcto, la cuenta queda activa y se redirige al Dashboard

> El código tiene validez de **1 hora**. Si expira, el proceso debe repetirse desde el inicio.

---

## 10. PANEL PRINCIPAL — DASHBOARD

El Dashboard es la pantalla principal del sistema después de iniciar sesión.

### 10.1 Barra de Información Superior

En la parte superior del dashboard se muestra:
- **Foto de perfil** y nombre completo
- **Puntos de reputación**: se ganan al tener reportes aprobados
- **Sanciones activas** (si las hubiera): indicadas con un ícono de advertencia

### 10.2 Vista Comunidad

Muestra los reportes aprobados de todos los usuarios de la plataforma.

**Usar los filtros para encontrar reportes específicos:**
- **Tipo**: filtrar por Tráfico, Accidente, Infracción o Peligro
- **Provincia**: filtrar por cualquiera de las 32 provincias del país

### 10.3 Vista Mis Reportes

Muestra únicamente los reportes que has creado tú.

**Filtros disponibles en "Mis Reportes":**
- **Tipo**: por categoría del incidente
- **Provincia**: por ubicación
- **Estado**: ver solo los pendientes, aprobados, rechazados o sancionados

### 10.4 Estados de un Reporte

| Estado | Significado | Color |
|--------|-------------|-------|
| **Pendiente** | En espera de revisión por un moderador | Amarillo |
| **En Proceso** | Un moderador lo está revisando en este momento | Azul |
| **Aprobado** | Verificado como válido por un moderador | Verde |
| **Rechazado** | No cumple los criterios de la plataforma | Rojo |
| **Sancionado** | Rechazado y generó una sanción al usuario | Rojo oscuro |

---

## 11. CREAR UN REPORTE DE INCIDENTE

### 11.1 Acceder al Formulario de Reporte

- Desde el Dashboard: hacer clic en el botón **"+"** (flotante, esquina inferior derecha)
- O desde el menú de navegación: ícono de **reporte**

> **Requisitos para crear reportes:**
> - Cuenta verificada (haber completado el proceso KYC y email)
> - No tener 3 o más sanciones activas

### 11.2 Completar el Formulario

**Sección 1 — Tipo de Incidente**
1. Seleccionar el tipo que mejor describe la situación:
   - Tráfico Pesado
   - Accidente
   - Infracción
   - Peligro en la Vía

**Sección 2 — Descripción**
1. Escribir una descripción clara del incidente
2. Incluir detalles relevantes: hora aproximada, dirección de circulación, gravedad
3. La descripción debe ser veraz y objetiva

**Sección 3 — Ubicación**
1. El mapa se cargará con la ubicación actual del dispositivo (si se otorgan permisos)
2. Arrastrar el marcador del mapa hasta el lugar exacto del incidente
3. También se puede hacer clic en el mapa para reposicionar el marcador
4. La dirección se obtiene automáticamente

**Sección 4 — Información del Vehículo (Opcional)**

Si el incidente involucra un vehículo:

*Opción A — Identificación Manual:*
- Ingresar manualmente: Marca, Modelo, Año, Color del vehículo

*Opción B — Identificación con Inteligencia Artificial:*
1. Hacer clic en el botón de cámara o subir foto del vehículo
2. El sistema usará IA para identificar automáticamente la marca, modelo, año y color
3. Revisar y corregir los datos si es necesario

**Sección 5 — Evidencia Multimedia**
1. Hacer clic en el área de carga de archivos
2. Seleccionar imágenes o videos del incidente
3. Se pueden adjuntar hasta **5 archivos**
4. Formatos aceptados: JPG, PNG, MP4, MOV
5. Se mostrará una vista previa de los archivos seleccionados

### 11.3 Enviar el Reporte

1. Revisar que toda la información sea correcta
2. Hacer clic en **"Enviar Reporte"**
3. Se mostrará una barra de progreso durante la carga de archivos
4. Al completarse, el sistema confirma el envío y el reporte queda en estado **Pendiente**

---

## 12. GESTIÓN DE NOTIFICACIONES

### 12.1 Ver Notificaciones

- Hacer clic en el **ícono de campana** en la barra de navegación
- Un número rojo indica la cantidad de notificaciones no leídas
- Se abre un panel con la lista de notificaciones ordenadas por fecha

### 12.2 Tipos de Notificaciones

| Tipo | Cuándo se recibe |
|------|------------------|
| ✅ **Éxito (verde)** | Reporte aprobado por un moderador |
| ❌ **Error (rojo)** | Reporte rechazado o sanción recibida |
| ⚠️ **Advertencia (amarillo)** | Aviso de sanción o alerta del sistema |
| ℹ️ **Información (azul)** | Actualizaciones generales del sistema |

### 12.3 Acciones sobre Notificaciones

- **Marcar como leída**: hacer clic sobre la notificación
- **Marcar todas como leídas**: usar el botón en la parte superior del panel
- **Eliminar notificación**: hacer clic en el ícono de papelera de cada elemento

---

## 13. PERFIL DE USUARIO

### 13.1 Acceder al Perfil

Hacer clic en el **ícono de persona** en la barra de navegación superior.

### 13.2 Información del Perfil

La página de perfil muestra:
- Foto de perfil
- Datos personales: nombre, usuario, correo, teléfono, provincia
- Estado de verificación KYC
- Puntos de reputación acumulados
- Historial de sanciones recibidas

### 13.3 Editar Datos del Perfil

1. Hacer clic en el botón **"Editar Perfil"**
2. Modificar los campos deseados:
   - Nombre y apellido
   - Nombre de usuario
   - Correo electrónico
   - Teléfono
   - Provincia de nacimiento
3. Hacer clic en **"Guardar Cambios"**

### 13.4 Cambiar Foto de Perfil

1. En la página de perfil, hacer clic sobre la foto o el **ícono de cámara**
2. Seleccionar una imagen desde el dispositivo (JPG o PNG)
3. La imagen se cargará automáticamente a Cloudinary
4. La nueva foto se mostrará de inmediato

### 13.5 Sistema de Reputación

Los puntos de reputación reflejan la confiabilidad del usuario:

| Situación | Efecto en Reputación |
|-----------|---------------------|
| Reporte aprobado | +10 puntos |
| Reporte rechazado | Sin cambio |
| Reporte sancionado | Puede reducir reputación |

---

# PARTE III — MANUAL DE MODERADOR

---

## 14. ACCESO AL PANEL DE MODERACIÓN

### 14.1 Requisitos

Para acceder al panel de moderación, la cuenta debe tener rol de **Moderador** o **Administrador**. Este rol es asignado por el administrador del sistema.

### 14.2 Navegar al Panel

Desde el Dashboard principal:
1. Hacer clic en el botón **"Panel de Moderación"** (visible solo para moderadores/admin)
2. O navegar directamente a la ruta `/moderate-reports`

El panel se cargará mostrando por defecto los **reportes pendientes**.

### 14.3 Estructura del Panel

La parte superior muestra las **pestañas de filtrado**:

| Pestaña | Contenido |
|---------|-----------|
| **Pendientes** | Reportes nuevos esperando revisión |
| **Aprobados** | Reportes validados como correctos |
| **Rechazados** | Reportes que no cumplieron los criterios |
| **Sancionados** | Reportes que resultaron en sanción al usuario |
| **Historial** | Todos los reportes moderados (con filtros de tipo y provincia) |
| **Usuarios** | Lista de todos los usuarios registrados |

---

## 15. REVISIÓN Y MODERACIÓN DE REPORTES

### 15.1 Revisar un Reporte Pendiente

1. Desde la pestaña **"Pendientes"**, se listan todos los reportes en espera
2. Cada tarjeta muestra: imagen del incidente, tipo, usuario, fecha y descripción
3. Hacer clic en **"Ver Detalles y Moderar"**

> Al abrir un reporte, este se bloquea automáticamente con el estado **"En Proceso"**. Otros moderadores verán el botón como "En Revisión por otro Moderador" y no podrán abrirlo hasta que se libere.

### 15.2 Información en el Modal de Detalles

El modal de moderación muestra:

- **Galería de medios**: imágenes y videos del reporte (navegable)
- **Tipo de incidente** y descripción completa
- **Ubicación**: provincia, ciudad y dirección
- **Datos del vehículo**: marca, modelo, año y color (si se proporcionaron)
- **Usuario**: nombre de usuario y fecha del reporte
- **Metadatos EXIF** de las imágenes (si están disponibles)

### 15.3 Aprobar un Reporte

Si el reporte es verídico y cumple los criterios:

1. Hacer clic en el botón **"Aprobar"** (verde)
2. (Opcional) Agregar un comentario de moderación
3. Confirmar la acción
4. El reporte cambia a estado **Aprobado** y se notifica al usuario

### 15.4 Rechazar un Reporte

Si el reporte no cumple los criterios (información falsa, irrelevante, duplicado, etc.):

1. Hacer clic en el botón **"Rechazar"** (rojo)
2. Ingresar el **motivo del rechazo** en el campo de comentario (obligatorio)
3. Evaluar si el rechazo debe ir acompañado de una sanción al usuario

### 15.5 Rechazar con Sanción al Usuario

Si el reporte contiene información maliciosa, deliberadamente falsa o viola los términos:

1. Al rechazar, activar la opción **"Sancionar al usuario"**
2. Ingresar el motivo detallado de la sanción
3. Confirmar la acción

**Efectos de la sanción:**
- Se crea un registro de sanción en el sistema
- El contador de sanciones del usuario aumenta en 1
- El usuario recibe una notificación explicando la razón
- Si el usuario acumula 3 o más sanciones, no puede crear nuevos reportes

### 15.6 Criterios de Moderación Recomendados

**Aprobar si:**
- La descripción coincide con la evidencia multimedia
- La ubicación es coherente con el tipo de incidente
- La información es precisa y útil para la comunidad

**Rechazar si:**
- Las imágenes no corresponden al incidente descrito
- La ubicación no coincide con la descripción
- El reporte ya fue enviado anteriormente (duplicado)
- La información es vaga o irrelevante

**Rechazar y Sancionar si:**
- El contenido es deliberadamente falso
- Hay intención de perjudicar a terceros
- Se detecta abuso repetido del sistema

---

## 16. GESTIÓN DEL HISTORIAL

### 16.1 Filtros en el Historial

La pestaña **"Historial"** muestra todos los reportes moderados (aprobados, rechazados y sancionados — no incluye pendientes). Están disponibles dos filtros adicionales:

**Filtro por Tipo de Incidente:**
- Todos los tipos
- Tráfico Pesado
- Accidente
- Infracción
- Peligro en la Vía

**Filtro por Provincia:**
- Todas las provincias
- Cualquiera de las 32 provincias de la República Dominicana

### 16.2 Revisar un Reporte del Historial

Hacer clic en **"Ver Detalles"** en cualquier reporte del historial para ver la información completa, el comentario del moderador que tomó la decisión y la fecha de moderación.

---

## 17. GESTIÓN DE USUARIOS

### 17.1 Ver Lista de Usuarios

En la pestaña **"Usuarios"** del panel de moderación se listan todos los usuarios registrados con:
- Foto de perfil y nombre
- Nombre de usuario y correo
- Rol actual (Usuario / Moderador / Administrador)
- Estado de verificación KYC
- Número de sanciones acumuladas

### 17.2 Ver Expediente de un Usuario

Hacer clic en la tarjeta del usuario o en **"Ver Expediente"** para ver:
- Información personal completa
- Historial de reportes del usuario
- Sanciones recibidas con sus motivos
- Puntaje de reputación

---

# PARTE IV — MANUAL DE ADMINISTRADOR

---

## 18. PRIVILEGIOS DEL ADMINISTRADOR

El rol de **Administrador** tiene acceso completo al sistema, incluyendo todas las funciones de moderador más las siguientes:

| Función | Moderador | Administrador |
|---------|-----------|---------------|
| Revisar y moderar reportes | ✅ | ✅ |
| Ver lista de usuarios | ✅ | ✅ |
| Ver expediente de usuarios | ✅ | ✅ |
| Crear nuevos moderadores | ❌ | ✅ |
| Promover usuarios a moderadores | ❌ | ✅ |
| Crear usuario administrador | ❌ | ✅ (vía script) |

---

## 19. CREACIÓN DE MODERADORES

### 19.1 Crear Moderador desde el Panel

El administrador puede crear un nuevo moderador directamente:

1. Ir al Panel de Moderación → pestaña **"Usuarios"**
2. Hacer clic en el botón **"Crear Moderador"** (visible solo para administradores)
3. Completar el formulario con los datos del nuevo moderador:
   - Nombre y apellido
   - Nombre de usuario
   - Correo electrónico
   - Contraseña temporal
   - Cédula y otros datos requeridos
4. Hacer clic en **"Crear Moderador"**

> Los moderadores creados directamente por el administrador **no requieren verificación de email** y tienen acceso inmediato al sistema.

### 19.2 Crear Administrador (Solo vía Terminal)

Por seguridad, los usuarios administradores solo se pueden crear desde el servidor. Ejecutar en la terminal del servidor:

```bash
cd server
node create_admin.js
```

---

## 20. GESTIÓN DE ROLES

### 20.1 Promover Usuario a Moderador

Para promover un usuario regular al rol de moderador:

1. Ir a la pestaña **"Usuarios"** en el panel de moderación
2. Encontrar al usuario que se desea promover
3. Abrir su expediente
4. Hacer clic en **"Promover a Moderador"**
5. Confirmar la acción

> Esta acción no se puede deshacer desde la interfaz. Para revertir un rol se requiere acceso directo a la base de datos.

### 20.2 Consideraciones al Asignar Roles

- Solo asignar el rol de Moderador a personas de confianza dentro de la organización
- Los moderadores tienen acceso a información personal de todos los usuarios del sistema
- Documentar quién es responsable de qué decisiones de moderación

---

## 21. SOLUCIÓN DE PROBLEMAS FRECUENTES

### Problema 1: El servidor no inicia

**Síntoma:** Error al ejecutar `npm start` en la carpeta `server`

**Posibles causas y soluciones:**

| Error en consola | Solución |
|-----------------|----------|
| `MONGO_URI is not defined` | Verificar que el archivo `.env` existe y está en la carpeta raíz |
| `MongoNetworkError` | Verificar la conexión a internet y que la IP está en la lista blanca de Atlas |
| `Port 5000 already in use` | Cerrar otra aplicación que use el puerto 5000 |
| `Cannot find module` | Ejecutar `npm install` en la carpeta `server` |

---

### Problema 2: La página muestra advertencia de SSL

**Síntoma:** El navegador muestra "Tu conexión no es privada" al acceder a `https://localhost:5173`

**Solución:**
- En Chrome: hacer clic en "Configuración avanzada" → "Continuar a localhost (no seguro)"
- En Firefox: hacer clic en "Aceptar el riesgo y continuar"

Esto es normal en entornos de desarrollo local con certificado SSL autofirmado.

---

### Problema 3: El KYC falla repetidamente

**Síntoma:** El sistema no puede leer la cédula o no acepta la selfie

**Soluciones:**
- Asegurarse de que el documento esté bien iluminado, sin reflejos ni sombras
- Limpiar el lente de la cámara
- Sostener la cédula firme y completamente dentro del marco de la cámara
- Para la selfie: ubicarse frente a una fuente de luz (no contraluz)
- Intentar desde otro navegador (Chrome es el más compatible)

---

### Problema 4: No llega el correo de verificación

**Síntoma:** No se recibe el código de 6 dígitos después del registro

**Soluciones:**
1. Revisar la carpeta de **Spam o Correo no deseado**
2. Verificar que el correo ingresado en el formulario sea correcto
3. Esperar hasta 5 minutos (puede haber demora del servidor de email)
4. Si el código expira (más de 1 hora), reiniciar el proceso de registro

---

### Problema 5: Cuenta bloqueada por sanciones

**Síntoma:** Al intentar iniciar sesión, el sistema muestra un mensaje de cuenta suspendida con un contador de tiempo

**Información:**
- El bloqueo es temporal y se levanta automáticamente al vencer el tiempo indicado
- Si la sanción es permanente, contactar al administrador del sistema

---

### Problema 6: El mapa no carga o muestra error

**Síntoma:** El mapa del formulario de reporte aparece en gris o con error

**Soluciones:**
- Verificar la conexión a internet
- Recargar la página (F5)
- Si el navegador solicitó permisos de ubicación y se denegaron:
  1. Hacer clic en el ícono de candado en la barra de direcciones
  2. Ir a Configuración del sitio → Ubicación → Permitir

---

### Problema 7: Error al subir archivos multimedia

**Síntoma:** Los archivos no se cargan o aparece error durante el upload

**Posibles causas:**
- Archivo muy grande: el límite es de **50 MB por archivo**
- Formato no soportado: usar JPG, PNG, MP4 o MOV
- Conexión lenta: esperar a que la barra de progreso complete al 100%

---

### Problema 8: "Sesión iniciada en otro dispositivo"

**Síntoma:** El sistema cierra la sesión automáticamente con este mensaje

**Explicación:** El sistema permite una sola sesión activa por usuario. Si se inicia sesión en otro dispositivo o navegador, la sesión anterior se invalida automáticamente.

**Solución:** Iniciar sesión nuevamente en el dispositivo que se desea usar.

---

## INFORMACIÓN DE CONTACTO Y SOPORTE

Para reportar errores del sistema, solicitar acceso de administrador o cualquier consulta técnica relacionada con la plataforma, contactar al equipo de desarrollo del proyecto.

---

*Manual del Sistema — Vialidades de Tránsito*  
*República Dominicana | Versión 1.0 | Abril 2026*  
*Documento elaborado para Tesis de Grado — Ingeniería en Sistemas de Información*

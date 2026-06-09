# Manual 2 — Vialidades de Tránsito
## Guía Completa de Uso del Sistema

---

## ÍNDICE

1. [¿Qué es Vialidades?](#1-qué-es-vialidades)
2. [Registro de Usuario](#2-registro-de-usuario)
3. [Inicio de Sesión](#3-inicio-de-sesión)
4. [Recuperación de Contraseña](#4-recuperación-de-contraseña)
5. [El Dashboard — Vista General](#5-el-dashboard--vista-general)
6. [Crear un Reporte](#6-crear-un-reporte)
7. [Vista Comunidad](#7-vista-comunidad)
8. [Mis Reportes](#8-mis-reportes)
9. [Denunciar un Reporte](#9-denunciar-un-reporte)
10. [El Perfil de Usuario](#10-el-perfil-de-usuario)
11. [Sistema de Reputación](#11-sistema-de-reputación)
12. [Sistema de Sanciones](#12-sistema-de-sanciones)
13. [Notificaciones](#13-notificaciones)
14. [Mapa Público (Landing Page)](#14-mapa-público-landing-page)
15. [Página de Soporte Legal](#15-página-de-soporte-legal)
16. [Para Moderadores](#16-para-moderadores)
17. [Para Supermoderador](#17-para-supermoderador)
18. [Tema Claro / Oscuro](#18-tema-claro--oscuro)
19. [Seguridad de Sesión](#19-seguridad-de-sesión)
20. [Preguntas Frecuentes](#20-preguntas-frecuentes)

---

## 1. ¿Qué es Vialidades?

Vialidades de Tránsito es una plataforma ciudadana para reportar y monitorear incidentes viales en la República Dominicana. Permite a cualquier ciudadano verificado:

- Publicar reportes de incidentes viales con fotos y/o videos
- Ver reportes de la comunidad en un mapa interactivo
- Denunciar contenido inapropiado o falso
- Hacer seguimiento del estado de sus propios reportes
- Solicitar la eliminación de contenido que viole sus derechos (Ley 192-19 y Ley 172-13)

El sistema funciona 24/7 y cuenta con moderación humana y automática para garantizar que el contenido sea veraz y seguro.

---

## 2. Registro de Usuario

El registro en Vialidades requiere verificación de identidad (KYC) para garantizar que solo ciudadanos reales publiquen contenido. El proceso tiene 4 pasos.

### Paso 1 — Datos Personales

Completa el formulario con:
- **Nombre de usuario** — único en el sistema, sin espacios
- **Nombre y apellido**
- **Correo electrónico** — recibirás un código aquí
- **Contraseña** — mínimo 8 caracteres recomendado
- **Fecha de nacimiento**
- **Género**
- **Teléfono**
- **Cédula de identidad**
- **Provincia de nacimiento**

Haz click en **Aceptar Términos y Condiciones** y luego en **Continuar**.

> El sistema verifica automáticamente que tu nombre de usuario, correo, cédula y teléfono no estén ya registrados antes de continuar.

### Paso 2 — Foto de Cédula (OCR)

1. Toma o sube una foto clara de la **parte frontal** de tu cédula dominicana
2. El sistema procesa la imagen automáticamente con OCR (lectura óptica de caracteres)
3. Extrae tu nombre y número de cédula del documento
4. Los compara con los datos que introdujiste en el Paso 1

**Si no coincide:** El sistema lo rechaza y debes volver a tomar la foto con mejor iluminación y sin reflejos.

**Consejos para la foto de cédula:**
- Buena iluminación, sin flash directo
- Documento plano y sin doblar
- Todos los caracteres deben ser legibles

### Paso 3 — Selfie (Face Matching)

1. Permite el acceso a tu cámara
2. Toma una selfie mirando directamente a la cámara
3. El sistema compara tu rostro con la foto de tu cédula
4. Se requiere al menos **30% de similitud facial** para continuar

**Si es rechazado:**
- Asegúrate de tener buena iluminación frontal
- No uses lentes de sol ni cubiertas
- Mira directamente a la cámara

### Paso 4 — Verificación por Correo

1. El sistema envía un **código de 6 dígitos** a tu correo electrónico
2. El código es válido por **1 hora**
3. Ingresa el código en la pantalla de verificación
4. Si no lo recibes, revisa la carpeta de spam

Al ingresar el código correcto, tu cuenta queda creada y eres redirigido automáticamente al Dashboard.

---

## 3. Inicio de Sesión

### Login tradicional

1. Ve a `/login`
2. Introduce tu **correo electrónico** y **contraseña**
3. Haz click en **Iniciar Sesión**

### Login con Google

1. Haz click en **Continuar con Google**
2. Selecciona tu cuenta de Google
3. Si es tu primera vez, se crea una cuenta automáticamente (sin necesidad de KYC)
4. Si ya tienes cuenta con ese correo, inicia sesión directamente

### Sesión única por dispositivo

Vialidades solo permite **una sesión activa a la vez**. Si inicias sesión desde otro dispositivo o navegador, la sesión anterior queda invalidada automáticamente y verás el mensaje:

> "Tu sesión fue iniciada en otro dispositivo. Por seguridad, esta sesión ha sido cerrada."

---

## 4. Recuperación de Contraseña

1. En la pantalla de login, haz click en **¿Olvidaste tu contraseña?**
2. Introduce tu correo electrónico registrado
3. Recibirás un **enlace de recuperación** válido por **1 hora**
4. Haz click en el enlace del correo
5. Introduce tu nueva contraseña y confírmala
6. Haz click en **Guardar**. Ya puedes iniciar sesión con la nueva contraseña.

> Si no recibes el correo, revisa la carpeta de spam. El enlace es de uso único.

---

## 5. El Dashboard — Vista General

El Dashboard es la página principal al iniciar sesión. Tiene diferentes vistas según tu rol.

### Para usuarios regulares

Al entrar verás:
- **Barra de bienvenida** con tu nombre, avatar y puntos de reputación
- **Toggle de vista**: Comunidad / Mis Reportes
- **Botón flotante "+"** en la esquina inferior derecha para crear un nuevo reporte

### Para moderadores y administradores

Al entrar verás:
- **Banner de moderación** con acceso rápido al panel de moderación
- **Tarjetas de estadísticas**: Pendientes, Aprobados, Rechazados, Sancionados, Publicados
- **Gráficos de analítica**: actividad de los últimos 7 días, distribución por estados, distribución por tipo de incidente
- **Tasa de resolución** (porcentaje de reportes procesados)
- **Bandeja de Feedback de Usuarios** — sugerencias recibidas de la comunidad

---

## 6. Crear un Reporte

Para crear un reporte haz click en el **botón "+" flotante** en el dashboard o navega a `/create-report`.

### Formulario de reporte

**1. Tipo de incidente** — selecciona uno de:

| Tipo | Descripción |
|------|-------------|
| Tráfico Pesado | Congestión vehicular inusual |
| Accidente | Colisión o accidente vial |
| Infracción | Violación de normas de tránsito |
| Peligro en la vía | Obstáculos o situaciones peligrosas |
| Obra en la vía | Trabajos de construcción o reparación |
| Bache peligroso | Hundimiento o daño en el pavimento |
| Inundación | Acumulación de agua en la vía |
| Otro | Cualquier otra situación no listada |

**2. Descripción** — explica el incidente con el mayor detalle posible: qué pasó, cuándo, qué vehículos involucrados, situación actual.

**3. Ubicación** — el mapa se centra automáticamente en tu ubicación GPS:
- Haz click en el mapa para mover el pin
- Arrastra el pin para ajustar la posición exacta
- Usa la barra de búsqueda para buscar una dirección
- Presiona **"Ubícame"** para volver a centrar en tu posición

**4. Archivos multimedia** — sube imágenes o videos:
- Haz click en el área de carga o **arrastra los archivos** directamente
- Formatos soportados: JPG, PNG, HEIC, MP4, MOV, entre otros
- Antes de subir, el sistema **verifica automáticamente** que el contenido no sea inapropiado
- Si el archivo contiene contenido prohibido (violencia extrema, contenido sexual, etc.) será rechazado

**5. Datos del vehículo (opcional)** — si el reporte involucra un vehículo:
- Introduce marca, modelo, año y color manualmente
- O haz click en **"Identificar con IA"** y el sistema analiza la imagen automáticamente

**6. Enviar** — haz click en **Enviar Reporte**. Verás una barra de progreso mientras se suben los archivos.

### ¿Qué pasa después de enviar?

1. El sistema modera el contenido automáticamente
2. Si pasa la moderación → reporte **aprobado** y visible de inmediato
3. Recibes una notificación y un correo de confirmación
4. Si contiene contenido inapropiado → rechazado automáticamente + posible sanción

> Los rostros de personas en las imágenes son difuminados automáticamente al ser publicados.

---

## 7. Vista Comunidad

La vista **Comunidad** muestra todos los reportes aprobados de otros usuarios, organizados por fecha:

- **Reportes de hoy**
- **Reportes de esta semana**
- **Reportes del mes**

### Tarjeta de reporte

Cada tarjeta muestra:
- Fotos o video del incidente (con caras difuminadas)
- **Badge de tipo** con color e ícono (ej: Inundación en azul)
- Descripción del incidente
- Dirección aproximada
- Fecha

### Interacciones disponibles

- **Click en la tarjeta** → abre el modal de detalles completos
- **"¿Deseas denunciar este reporte?"** → botón al final de la tarjeta (ver sección 9)

### Ver más

Si una sección tiene más de 4 reportes, aparece el botón **"Ver más (X más)"** para expandir. Haz click en **"Ver menos ↑"** para contraer.

---

## 8. Mis Reportes

La vista **Mis Reportes** muestra todos tus reportes con sus estados actuales. Incluye filtros en la parte superior:

### Filtros disponibles

| Filtro | Descripción |
|--------|-------------|
| Todos los tipos | Sin filtrar por tipo |
| Traffic, Accident, etc. | Filtra por tipo específico |
| Todas las provincias | Sin filtrar por provincia |
| [Provincia específica] | Filtra por provincia de la dirección |
| Todos los estados | Muestra todo |
| Pendiente | Solo los que esperan revisión |
| Aprobado | Solo los aprobados |
| Rechazado | Solo los rechazados |
| Sancionado | Solo los que resultaron en sanción |
| Rango de fechas | Filtra por fecha de creación |

### Estados de tus reportes

| Estado | Color | Significado |
|--------|-------|-------------|
| Pendiente | Amarillo | Esperando que un moderador lo revise |
| En revisión | Morado | Un moderador está revisándolo ahora mismo |
| Aprobado | Verde | Publicado y visible para la comunidad |
| Rechazado | Rojo | No cumplió con las normas |
| Sancionado | Rojo oscuro | Rechazado y generó una sanción en tu cuenta |
| Pendiente revisar | Naranja | Recibió 3+ denuncias de otros usuarios |

### Opciones en tus reportes

Al hacer click en los **tres puntos (⋮)** en la esquina de cada tarjeta:
- **Ver detalles** → abre el modal completo con toda la información
- **Eliminar reporte** → oculta el reporte de tu lista y del público

> Eliminar un reporte es una acción permanente para ti. El reporte deja de ser visible públicamente.

### Comentario del moderador

Si tu reporte fue rechazado, en la tarjeta aparecerá un bloque con el **motivo** indicado por el moderador. Si fue aprobado, puede aparecer un comentario opcional.

---

## 9. Denunciar un Reporte

Si encuentras un reporte de otro usuario que consideras incorrecto o inapropiado, puedes denunciarlo.

### Cómo denunciar

1. En la vista Comunidad, ve al final de la tarjeta del reporte
2. Haz click en **"¿Deseas denunciar este reporte?"**
3. Selecciona el motivo:

| Motivo | Descripción |
|--------|-------------|
| Información falsa o engañosa | El contenido no corresponde a un incidente real |
| Ubicación incorrecta | La ubicación marcada no es correcta |
| Contenido inapropiado | Imágenes o descripción ofensivas |
| Reporte duplicado | Ya existe otro reporte del mismo incidente |
| Spam o publicidad | No corresponde a un incidente vial |
| Otro | Otro motivo (debes describirlo) |

4. Haz click en **Continuar**

### ¿Qué pasa con tu denuncia?

- Queda registrada en el sistema
- El botón cambia a **"Ya denunciaste este reporte"** (no puedes denunciar el mismo reporte dos veces)
- Cuando un reporte acumula **3 denuncias**, pasa automáticamente a estado "Pendiente revisar" y un moderador lo revisa
- Si el moderador considera las denuncias válidas, el reporte es rechazado
- Si las desestima, el reporte vuelve a estar aprobado

---

## 10. El Perfil de Usuario

Accede a tu perfil desde el menú de la Navbar (tu avatar o nombre → Perfil).

### Información visible

- Foto de perfil (avatar)
- Nombre de usuario
- Nombre completo
- Correo electrónico
- Teléfono
- Provincia de nacimiento
- Fecha de nacimiento
- Reputación actual
- Número de sanciones

### Editar perfil

Haz click en **Editar Perfil** para:
- Cambiar tu nombre de usuario
- Actualizar tu correo electrónico
- Cambiar tu foto de perfil (avatar) — formatos: JPG, PNG
- Actualizar tu número de teléfono

### Exportar mis datos

Haz click en **Exportar datos** para descargar un archivo JSON con toda tu información personal almacenada en Vialidades (conforme con la Ley 172-13).

### Desactivar cuenta

Haz click en **Desactivar cuenta** para deshabilitar tu cuenta. Una vez desactivada, no podrás iniciar sesión. Esta acción es reversible solo contactando al equipo de soporte.

---

## 11. Sistema de Reputación

La reputación es un número del **0 al 100** que refleja tu historial en la plataforma. Se muestra en tu perfil y en el Dashboard.

### Cómo cambia tu reputación

| Evento | Primer reporte | Reportes siguientes |
|--------|---------------|---------------------|
| Reporte aprobado | Sube a 100 | +10 puntos |
| Reporte rechazado (sin sanción) | Baja a 40 | -10 puntos |
| Reporte rechazado con sanción | Baja a 25 | -25 puntos |
| Moderador reduce sanciones | — | +25 puntos |
| Moderador limpia sanciones | — | Vuelve a 100 |

> La reputación nunca baja de 1. Siempre puedes recuperarla publicando reportes válidos.

---

## 12. Sistema de Sanciones

Las sanciones ocurren cuando publicas contenido que viola las normas de la plataforma, ya sea detectado automáticamente o por decisión de un moderador.

### Consecuencias acumulativas

| Sanciones acumuladas | Consecuencia |
|---------------------|--------------|
| 1 sanción | Cuenta bloqueada por **24 horas** |
| 2 sanciones | Cuenta bloqueada por **48 horas** |
| 3+ sanciones | **Bloqueo permanente** (ban) |

### Durante un bloqueo

- No puedes iniciar sesión hasta que expire el tiempo
- Al intentar iniciar sesión, el sistema te indica cuánto tiempo resta
- Recibes un correo electrónico con los detalles de la sanción

### ¿Qué genera una sanción?

- Publicar imágenes con contenido violento o sexual
- Publicar información deliberadamente falsa
- Reincidencia en reportes rechazados por mal contenido

### Apelación

Si consideras que una sanción fue injusta, puedes:
1. Ir a `/soporte`
2. Llenar el formulario de solicitud
3. El equipo de moderación revisará tu caso

---

## 13. Notificaciones

El ícono de **campana** en la Navbar muestra tus notificaciones. El número en rojo indica cuántas no has leído.

### Tipos de notificación

| Tipo | Color | Cuándo aparece |
|------|-------|----------------|
| Éxito | Verde | Reporte aprobado, registro completo |
| Error | Rojo | Reporte rechazado, sanción aplicada |
| Advertencia | Naranja | Denuncia recibida, bloqueo próximo |
| Información | Azul | Actualizaciones generales |

### Cómo funcionan

- Aparecen en tiempo real sin necesidad de recargar la página
- También recibes un **correo electrónico** para las más importantes
- Al hacer click en una notificación → se marca como leída automáticamente
- Si la notificación está relacionada con un reporte → te lleva directamente al reporte
- Puedes marcar todas como leídas con **"Marcar todo como leído"**
- Puedes eliminar notificaciones individualmente con el ícono de basura

---

## 14. Mapa Público (Landing Page)

En la página de inicio (`/`) hay un mapa interactivo visible para todos, incluso sin cuenta.

### Qué muestra el mapa

Todos los reportes **aprobados** de la comunidad aparecen como pins de colores sobre el mapa. Cada color corresponde a un tipo de incidente:

| Color | Tipo |
|-------|------|
| Amarillo | Tráfico Pesado |
| Rojo | Accidente |
| Índigo | Infracción |
| Naranja | Peligro en la vía |
| Azul cielo | Obra en la vía |
| Gris cálido | Bache peligroso |
| Azul | Inundación |
| Gris | Otro |

### El popup de cada pin

Al hacer click en un pin aparece un popup con:
- Badge del tipo de incidente con ícono
- Descripción del reporte (hasta 3 líneas)
- Dirección del incidente
- Fecha de publicación
- Número de reporte (ej: VTI0042)

### Controles del mapa

- **Callejero / Satélite** — botones en la esquina superior derecha para cambiar el tipo de mapa
- **Zoom** — rueda del mouse o gestos en móvil
- **Punto rojo parpadeante** en la esquina inferior derecha indica que el mapa tiene reportes en tiempo real

---

## 15. Página de Soporte Legal

Accede en la Navbar o visitando `/soporte`. No requiere cuenta registrada.

### ¿Cuándo usar esta página?

Cuando tú o un familiar aparezcas en un reporte vial **sin haber dado tu consentimiento**, amparado en:
- **Ley 192-19** — Protección de la imagen de personas
- **Ley 172-13** — Protección de datos personales y derecho al olvido

### Tipos de solicitud

**Solicitud de Familiar**
Para representantes o familiares de víctimas que aparecen en reportes (incluyendo fallecidos o gravemente lesionados).
Campos: nombre completo, correo, teléfono, cédula, parentesco, nombre de la víctima, número o descripción del reporte, motivo.

**Contenido No Autorizado**
Para personas que aparecen directamente en un reporte sin haber autorizado su publicación.
Campos: nombre completo, correo, teléfono, cédula, número o descripción del reporte, motivo.

### Número de caso

Al enviar la solicitud recibirás un **número de caso** en formato `VIL-XXXXXXX`. Guárdalo para hacer seguimiento.

### Consulta de estado

En la misma página puedes buscar tu caso introduciendo el número `VIL-XXXXXXX` en el campo de búsqueda.

### Estados del caso

| Estado | Significado |
|--------|-------------|
| Recibida | Tu solicitud fue registrada |
| En Revisión | El equipo la está procesando |
| Resuelta | La solicitud fue atendida |
| Rechazada | No cumplió los requisitos |

---

## 16. Para Moderadores

Los moderadores tienen acceso al **Panel de Moderación** (`/moderate`), enlazado desde el Dashboard con el botón **"Ir al Panel"**.

### Filtros del panel

| Filtro | Qué muestra |
|--------|-------------|
| Pendientes | Reportes nuevos sin revisar |
| Aprobados | Reportes ya publicados |
| Rechazados | Reportes rechazados |
| Sancionados | Rechazados con sanción |
| Todos | Todo el historial |
| Usuarios | Lista de usuarios registrados |

También puedes filtrar por: tipo de incidente, provincia, rango de fechas y buscar por número de reporte.

### Flujo de moderación

**1. Seleccionar un reporte pendiente**

Al hacer click en una tarjeta de reporte pendiente, el sistema lo bloquea automáticamente para que no sea procesado por otro moderador al mismo tiempo. El estado cambia a **"En revisión"** y aparece tu nombre como moderador en carga.

> Si el reporte ya está siendo revisado por otro moderador, verás un aviso con el nombre del moderador a cargo.

**2. Revisar el contenido**

En el modal de detalles puedes ver:
- Todas las fotos y videos del reporte (sin difuminado para moderadores)
- Descripción, tipo, ubicación y fecha
- Datos del usuario que reportó (nombre, reputación, sanciones)
- Datos del vehículo (si aplica)
- Historial de acciones anteriores sobre el reporte
- Denuncias comunitarias (si las tiene)

**3. Tomar una decisión**

Desde el modal tienes tres opciones:

**Aprobar**
- El reporte se publica en el Dashboard de la comunidad
- Los rostros en las imágenes son difuminados automáticamente
- El usuario recibe +10 puntos de reputación (o 100 si es su primer reporte)
- Se envía notificación y correo al usuario

**Rechazar sin sanción**
- Debes escribir un **motivo** (obligatorio)
- El usuario ve el motivo en su tarjeta de reporte
- El usuario pierde 10 puntos de reputación
- No genera bloqueo ni registro de sanción

**Rechazar con sanción**
- Debes escribir un **motivo**
- El usuario pierde 25 puntos de reputación
- Se incrementa su contador de sanciones
- Se aplica bloqueo temporal según el número de sanciones acumuladas
- Se registra una Sanción en el sistema
- Se envía notificación y correo al usuario

**4. Gestión de denuncias (flags)**

Si un reporte tiene 3 o más denuncias comunitarias (status: "Pendiente revisar"):
- Puedes **desestimar todas las denuncias** → el reporte vuelve a "Aprobado" sin ninguna acción adicional
- Puedes **rechazarlo** (con o sin sanción) → sigue el mismo flujo de moderación normal

### Gestión de usuarios

En el filtro **"Usuarios"** del panel puedes:
- Buscar usuarios por nombre o correo
- Ver detalles de cada usuario (click para abrir UserDetailModal)
- Ver historial de reportes del usuario
- Gestionar sanciones:
  - **Reducir sanciones en 1** (+25 rep)
  - **Limpiar todas las sanciones** (rep = 100)
  - **Añadir sanción manual**
- Bloquear usuario: 24h, 48h, 7 días o permanente
- Desbloquear usuario

### Dashboard con analítica

El Dashboard muestra para moderadores y admins:
- **Tarjetas de stats**: Pendientes, Aprobados, Rechazados, Sancionados, Total publicados
- **Gráfico de área**: reportes de los últimos 7 días
- **Gráfico donut**: distribución por estados
- **Gráfico de barras**: distribución por tipo de incidente
- **Tasa de resolución**: porcentaje de reportes procesados
- **Bandeja de feedback**: sugerencias de usuarios con badge de categoría

---

## 17. Para Supermoderador

El supermoderador tiene acceso exclusivo en `/supermoderador`.

### Dashboard (`/supermoderador`)

Vista de control general de toda la plataforma:
- Total de moderadores (activos e inactivos)
- Total de reportes moderados en el sistema
- Reportes publicados actualmente vs pendientes
- Total de usuarios registrados
- Reportes creados hoy y esta semana
- Breakdown de reportes por tipo de incidente
- **Tabla de moderadores activos** con estadísticas individuales

### Gestión de Moderadores (`/supermoderador/moderadores`)

- Ver lista completa de moderadores con sus métricas
- **Activar / Desactivar** moderadores con el toggle
- **Crear nuevo moderador** con el formulario completo (nombre, apellido, correo, cédula, etc.)
- Ver detalle de reportes procesados por cada moderador

### Reportes Globales (`/supermoderador/reportes`)

- Vista de todos los reportes aprobados del sistema
- Búsqueda por número de reporte (ej: VTI0042)
- Opción para **ocultar cualquier reporte** aprobado si es necesario

### Centro de Soporte (`/supermoderador/soporte`)

- Lista de todas las solicitudes de soporte (formulario de `/soporte`)
- Filtro por estado: pendiente, en revisión, resuelta, rechazada
- Ver detalles completos de cada solicitud
- Actualizar estado y añadir resolución

### Notificaciones urgentes

Cuando llega una nueva solicitud de soporte, el supermoderador recibe una **notificación urgente** en tiempo real.

---

## 18. Tema Claro / Oscuro

Vialidades soporta modo claro y modo oscuro.

### Cómo cambiar

Haz click en el ícono de **luna / sol** en la Navbar.

- El tema se guarda automáticamente en tu navegador
- Se mantiene aunque cierres y vuelvas a abrir la app
- Funciona tanto para usuarios autenticados como para visitantes

---

## 19. Seguridad de Sesión

### Sesión única

Vialidades solo permite **una sesión activa simultánea** por cuenta. Si alguien accede a tu cuenta desde otro dispositivo:

1. La sesión anterior queda invalidada inmediatamente
2. Ves el mensaje: *"Tu sesión fue iniciada en otro dispositivo"*
3. Eres redirigido al login automáticamente

### ¿Qué hacer si no fuiste tú?

1. Ve a `/login` y entra a tu cuenta
2. Cambia tu contraseña desde **Perfil → Editar perfil**
3. Si sospechas que tu cuenta fue comprometida, usa el formulario de soporte en `/soporte`

### Duración de la sesión

Los tokens de sesión tienen una duración de **5 horas**. Al expirar, debes volver a iniciar sesión.

---

## 20. Preguntas Frecuentes

**¿Cuánto tarda en aprobarse mi reporte?**
Los reportes que pasan la moderación automática se aprueban de inmediato. Los que requieren revisión manual dependen del tiempo de respuesta de los moderadores.

**¿Puedo editar un reporte después de publicarlo?**
No. Los reportes no se pueden editar una vez enviados. Si necesitas corregir información, elimina el reporte (ocúltalo) y crea uno nuevo.

**¿Por qué mi foto fue rechazada antes de subir?**
El sistema revisa automáticamente el contenido de cada archivo. Si contiene imágenes violentas, sexuales u otro contenido prohibido, es bloqueado antes de enviarse.

**¿Los datos de mi cédula quedan guardados?**
Los datos de tu cédula se usan solo para verificar tu identidad durante el registro. Las imágenes de documentos no se almacenan en servidores de Vialidades.

**¿Cómo sé que mis reportes son anónimos para el público?**
Los reportes aprobados muestran el tipo, descripción, ubicación y medios. No se muestra tu nombre ni tu información personal a otros usuarios del público. Los moderadores sí pueden ver quién publicó el reporte para fines de moderación.

**¿Las caras en mis fotos son difuminadas?**
Sí. Al ser aprobado un reporte, el sistema aplica automáticamente un efecto de difuminado sobre todos los rostros detectados en las imágenes. Adicionalmente, en la app el difuminado se aplica en tiempo real en el navegador de cada usuario.

**¿Puedo usar Vialidades sin registrarme?**
Puedes ver el mapa público y el contenido de la landing page sin cuenta. Para publicar reportes, ver el dashboard de la comunidad o denunciar contenido, necesitas una cuenta verificada.

**¿Qué pasa con mi cuenta si me sanciono 3 veces?**
Recibes un bloqueo permanente. No podrás iniciar sesión. Puedes solicitar una revisión a través del formulario de soporte en `/soporte`.

**¿Puedo tener varias cuentas?**
No. Crear varias cuentas para evadir sanciones está explícitamente prohibido y puede resultar en el bloqueo de todas las cuentas asociadas.

**¿Cómo solicito que eliminen una imagen mía de un reporte?**
Ve a `/soporte`, selecciona el tipo de solicitud apropiado, completa el formulario y recibirás un número de caso. El equipo revisará tu solicitud amparado en la Ley 192-19 y la Ley 172-13.

**¿Por qué no puedo crear reportes después de una sanción?**
Durante el período de bloqueo no puedes publicar reportes. Una vez que expire el bloqueo, la funcionalidad se restaura automáticamente. Si acumulas 3 sanciones, el bloqueo es permanente.

**¿Qué es el número de reporte (VTI0001)?**
Es un identificador único asignado a cada reporte aprobado. Sirve para hacer referencia a un reporte específico en solicitudes de soporte o consultas con moderadores.

---

*Manual 2 — Vialidades de Tránsito. Versión actualizada al 9 de junio de 2026.*

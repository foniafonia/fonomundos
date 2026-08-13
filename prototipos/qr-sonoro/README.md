# QR Sonoro

Herramienta que convierte cualquier papel o tarjeta en una misión de lenguaje con audio: el profesional crea la misión en el panel web, imprime o proyecta el código QR, y el niño lo escanea con el móvil para escucharla en voz alta.

## Para quién

Logopedas, maestros de PT/AL, orientadores y cualquier profesional de educación o salud que trabaje estimulación del lenguaje oral con niños de 3 a 12 años.

## Cómo se abre

Abre `index.html` en un navegador moderno (Chrome, Safari, Firefox) — no necesita servidor ni instalación. Para el modo niño, abre `mision.html` directamente o a través del QR generado. Funciona en local y en cualquier hosting estático.

## Qué necesita para funcionar

- Navegador con soporte de **Web Speech API** (síntesis de voz) — Chrome y Safari en iOS/Android la tienen por defecto.
- Conexión a internet la primera vez para cargar las fuentes (Google Fonts) y la librería de QR (qrcodejs). Después puede funcionar sin conexión si el navegador cachea los recursos.
- Cámara en el dispositivo del niño para escanear el QR (cualquier app de cámara estándar lo lee).

## Qué NO hace

- **No diagnostica** ningún trastorno del lenguaje ni del habla.
- **No sustituye la valoración ni la intervención de un profesional** de logopedia o educación especial.
- Es una herramienta de apoyo para estructurar y gamificar tareas que el profesional ya tiene diseñadas.
- No guarda datos en ningún servidor: las misiones creadas quedan solo en el localStorage del navegador del profesional.
- No recoge ni transmite datos del niño en ningún momento.
- No tiene gestión de usuarios ni autenticación.

## Lo que está construido

- Panel profesional: creación de misiones con título, área, edad, dificultad, texto, pista y recompensa verbal.
- Generación de QR codificado en URL (sin base de datos: la misión viaja en el hash).
- Descarga del QR como PNG, copia del enlace e impresión.
- Guardado local de misiones creadas (localStorage).
- Biblioteca de 30 misiones base en 6 áreas: fonología, semántica, memoria auditiva, instrucciones, narración oral y conciencia fonológica.
- Modo niño: lectura automática en voz alta (es-ES), botones Repetir, Pista y Misión completada, confeti y recompensa verbal al terminar.
- Diseño mobile-first, sin frameworks ni build step.

## Lo que quedó a medias / no está

- Sin GitHub Pages activo en este repositorio: los archivos funcionan abriéndolos en local o subiéndolos a cualquier hosting estático (Netlify, Vercel, GitHub Pages de otro repo).
- Sin soporte de voz offline: si el dispositivo no tiene voces en español instaladas, el navegador usa la voz por defecto del sistema (puede sonar diferente).
- Sin modo de edición de misiones ya guardadas (se puede borrar y recrear).
- Sin exportación/importación de misiones entre dispositivos.

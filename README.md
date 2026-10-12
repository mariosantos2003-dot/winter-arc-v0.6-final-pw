# WINTER ARC — v0.6 Final

Aplicación personal PWA para el Winter Arc (13 oct — 31 dic 2026).

## Requisitos
- Node.js 20+ recomendado
- npm

## Ejecutar en Windows / VS Code

```powershell
npm install
npm run build
npm run dev
```

Abre la URL local que indique Vite.

## Qué incluye v0.6
- Dashboard con cumplimiento de hábitos, racha y progreso musical de 7 canciones.
- Registro de peso y porcentaje de grasa corporal por fecha.
- Media móvil del peso basada en las mediciones disponibles dentro de los últimos 7 días naturales.
- Comparación con el punto de partida de 82,8 kg y referencia de 76,5 kg.
- Historial de hábitos, auditoría semanal y objetivos mensuales.
- Estudio musical con 7 temas.
- Guardado local y exportación/importación JSON combinada.
- Manifest, iconos de instalación, metadatos Apple y service worker para caché offline.

## Privacidad y almacenamiento
Los datos se guardan en el almacenamiento del navegador de ese dispositivo. No hay backend ni cuenta. Exporta copias JSON con regularidad. Importar una copia combina los registros con los locales; si hay una misma fecha, el dato importado prevalece.

## Instalar en iPhone
La PWA debe servirse desde una URL HTTPS pública para instalarla de forma fiable en iOS. No es necesario pagar Apple Developer.

### Opción sencilla: Netlify Drop
1. Ejecuta `npm run build`.
2. Abre la carpeta `dist` que se genera.
3. Publica su contenido mediante Netlify Drop desde `https://app.netlify.com/drop` (inicia sesión si te lo pide).
4. Abre la URL HTTPS asignada desde Safari en el iPhone.
5. En Safari: Compartir → Añadir a pantalla de inicio → Añadir.
6. Abre el icono instalado y comprueba el funcionamiento online. Después carga la app una vez y prueba el modo avión para validar la caché offline.

No subas la carpeta fuente si solo quieres publicar la aplicación; publica el contenido compilado de `dist`.

### Importar datos desde el PC al iPhone
El almacenamiento local no se comparte entre Windows y iPhone. En la versión que contiene tus datos, usa **Exportar copia JSON**. Transfiere el archivo al iPhone (por AirDrop no es necesario; puedes usar iCloud Drive, OneDrive o guardarlo en Archivos). En la PWA instalada, usa **Importar copia JSON** y selecciona el archivo.

## Limitaciones
- No hay sincronización automática entre dispositivos.
- El service worker precachea la carcasa de la app y guarda los recursos compilados cuando se solicitan. Tras publicar una nueva versión, puede ser necesario cerrar/reabrir la app o recargar para que se active el nuevo caché.
- Las mediciones de peso y grasa son registros personales, no un diagnóstico médico.

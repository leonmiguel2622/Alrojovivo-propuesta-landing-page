# Al Rojo Vivo — Bucaramanga (sitio promocional)

Estático: `index.html` + `css/styles.css` + `js/main.js` + `js/vendor/gsap.min.js` (GSAP local, sin CDN). Ver con `python -m http.server 8000`. `node_modules/` no se despliega.

## Datos ya conectados
WhatsApp/tel 304 5473147, Maps https://maps.app.goo.gl/8ChjERa3VRt12WYe6, Instagram @alrojovivo_bga, menú completo con descripciones, horario Lun cerrado / Mar-Vie 17-23 / Sáb-Dom 17-24, logo y fachada en `img/` (fachada JPG 83KB).

## Fotos (guía)
Estructura: `img/imgplatillos/<categoria>-<plato>.jpg` · 800×800 JPG q72 (~100KB) · `loading="lazy"` + `width/height`.
Patrón por plato: `<div class="ph ph-dish"><img src="img/menu/tacos-birria.jpg" width="800" height="800" alt="Tacos Birria" loading="lazy"></div>`.
Destacados reutilizan la foto del plato (cover se encarga del recorte). El modal muestra la foto solo si existe; si no, mantiene la letra.
Nombres sin tildes ni espacios. Lista completa: pedirla en el chat (“lista de imágenes”).

## Falta para cerrar v1
1. Fotos reales (hero 1200×1500, cards 800×600) → reemplazar bloques `.ph` por `<img loading="lazy">`.
2. Precios de tortas + hora de cierre + días.
3. Facebook/TikTok si existen (botones ya listos en disabled).
4. Logo/colores oficiales.
5. JSON-LD Restaurant cuando confirmes horario/cierre.

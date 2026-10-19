MODELOS AR — uso rápido

AVISO: Modelos AR es, por ahora, una SIMULACIÓN de distintos documentos argentinos.
Los modelos no están avalados por ninguna ley ni organismo oficial y no garantizan validez legal.

PUBLICAR
1. Subí TODO el contenido del zip, respetando las carpetas css/ y js/, a GitHub Pages.
2. Abrí index.html.

USO
1. Elegí un modelo (podés buscarlo con el buscador del inicio).
2. Completá los campos; la vista previa se actualiza sola.
3. Tocá “Descargar / guardar PDF” y en la ventana de impresión elegí “Guardar como PDF”.

ESTRUCTURA
- css/style.css  → estilos de TODAS las páginas (tema claro y oscuro).
- js/app.js      → lógica compartida: validación de DNI/CUIT/fechas, borrador local,
                   tema oscuro, buscador, importes en letras, copiar y PDF.
- *.html         → cada modelo tiene solo su formulario y el texto del documento
                   (la función update() al final del archivo).

PARA AGREGAR UN MODELO NUEVO
Copiá cualquier página de modelo (por ejemplo recibo-dinero.html), cambiá el título,
los campos del formulario y el texto dentro de update(); después sumá una tarjeta en index.html.
Los campos cuyo nombre empieza con "dni", "cuit" o "cuil" se validan solos.
Si dos fechas se llaman desde/hasta, salida/regreso, inicio/fin, inicio/entrega o
emision/vencimiento, se valida que la segunda no sea anterior a la primera.

PRIVACIDAD
Los datos no se envían a ningún servidor. Si la persona activa “Guardar borrador”, se guarda una
copia en su propio navegador (localStorage), que puede borrar cuando quiera.

PENDIENTE
Reemplazá TU-DOMINIO.example en sitemap.xml y robots.txt por tu dominio real
(estos dos archivos todavía no están en el proyecto).

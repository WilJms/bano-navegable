# Baño · Dos diseños, un espacio

Recorrido 3D estático, realizado a partir del encargo versión 2. Diseño 1 (`original`): beige con cromo y espejo rectangular. Diseño 2 (`nuevo`): piedra gris cálida, madera marrón, herrajes negros y espejo circular iluminado. Se comparte la misma habitación, ventana blanca de dos hojas y distribución.

## Usar localmente

Se ha fijado Node **26.5.1** en `.nvmrc`. Con esa versión:

```sh
npm ci
npm run verify
npm run build
npm run preview
```

Abrir `http://127.0.0.1:4173/`. También se sirve `/prueba-bano/` para verificar una subcarpeta. Hay una sola entrada HTML y enlaces `?diseno=original` / `?diseno=nuevo`. La query prevalece sobre la preferencia guardada. Un valor inválido vuelve a Original.

Los modelos y mapas ya están producidos en `public/assets`. El build **no ejecuta Blender ni descarga recursos artísticos**. No requiere la carpeta de autoría. No abrir el HTML con `file://`: la carga de recursos 3D necesita HTTP.

## Controles

- WASD o flechas para caminar; arrastrar sobre el baño para mirar.
- «Caminar con ratón» captura el cursor mediante una acción explícita. Escape lo libera. El arrastre sigue disponible si el navegador rechaza Pointer Lock.
- En pantalla táctil, el control izquierdo desplaza y un segundo dedo sobre la escena orienta la cámara.
- «Abrir mampara» desplaza la hoja hacia la ventana; el paso está junto al tirador. La colisión acompaña la hoja y se impide cerrarla contra el visitante.
- Ambos extremos transversales de la ducha están cerrados con vidrio fijo, incluido el próximo al acceso del baño. La entrada a la ducha se realiza por su hoja corredera del lado del pasillo.
- «Abrir ventana» desliza la hoja izquierda 43,75 cm hacia la derecha en su propia guía; «Cerrar ventana» invierte el recorrido. Vidrio, perfiles, juntas y tirador se mueven juntos. Se conserva la apertura al cambiar entre Diseño 1 y Diseño 2, sin mover la cámara.
- Los botones Diagonal, Acceso y Vanitorio cambian sólo la vista. El botón circular reinicia la posición.
- El diseño conserva posición, orientación, FOV, calidad y apertura. Alta, Equilibrada y Ligera son perfiles de resolución y espejo; Automática puede reducir el coste si detecta una tasa baja sostenida.

## Subir a GitHub Pages

Esta carpeta está preparada localmente. **No se ha creado un repositorio remoto ni se ha publicado una URL.** Los siguientes pasos los realiza el propietario:

1. Crear un repositorio y usar la rama `main`.
2. Subir **el contenido** de `SUBIR_A_GITHUB`, incluyendo `.github/workflows/pages.yml`, `.nvmrc`, `package-lock.json`, `public`, `src`, scripts, tests y especificaciones. No crear una subcarpeta `SUBIR_A_GITHUB` dentro del repositorio.
3. En Settings → Pages → Build and deployment, elegir **GitHub Actions**.
4. Revisar «Validar y publicar el baño» en Actions. El despliegue depende de instalación reproducible, verificaciones, build y pruebas Chromium/Firefox.
5. Abrir la URL que muestre el job de despliegue. Comprobar ambos diseños y recarga. Ese despliegue remoto aún no ha sido probado aquí.

El sitio usa base relativa `./`. No hace falta conocer de antemano el nombre del repositorio. No necesita reescrituras SPA, backend, API, cuentas de visitantes, CDN o hotlinks.

## Pruebas reproducibles

```sh
npm run verify
npm run build
npx --no-install playwright install chromium firefox
npm run test:e2e
```

Para las regresiones específicas de iluminación RGBM y ventana en WebKit:

```sh
npx --no-install playwright install webkit
BANO_WEBKIT=1 npx playwright test --project=webkit
```

La prueba de irradiancia compara todos los bytes del atlas cargado en GPU con el inventario de autoría. `scripts/capture-edge.mjs` conserva los tres ángulos de inspección del borde del repisero en Chromium/WebKit, además de un formato móvil.

Las pruebas levantan un servidor estático estricto. `scripts/capture.mjs` guarda capturas y `scripts/benchmark.mjs` mide una ruta de 61 segundos por diseño tras 10 segundos de calentamiento; ambos esperan el servidor de producción en el puerto 4173. Las capturas y mediciones se guardan fuera de esta carpeta. El modo `?qa=1` habilita controles de diagnóstico usados por las pruebas.

Consultar [arquitectura](docs/ARQUITECTURA.md), [informe de validación](docs/VALIDACION.md) y [procedencia de recursos](ASSET_LICENSES.md). Las dimensiones son hipótesis de reconstrucción, no medidas para construcción o compra de mobiliario.

# Recursos y procedencia

Todos los archivos usados durante la visita se sirven desde esta distribución. No hay referencias originales usadas como fondos, texturas del baño o sustitutos del modelo. No se distribuyen fuentes tipográficas del sistema.

| Recurso | Fuente y autor | Permiso y transformación |
| --- | --- | --- |
| `shared/bano.glb.gz`, `layout.json` | Modelado específico de este encargo; script Blender en autoría separada | Geometría arquitectónica, mobiliario y sanitarios producidos para el proyecto. Incluye las dos fuentes de vegetación detalladas más abajo. Compresión gzip sin pérdida; todos los bytes existen en la distribución. |
| `shared/sky.hdr` | [Kloofendal 48d Partly Cloudy Pure Sky, Poly Haven](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | [CC0](https://polyhaven.com/license), descarga HDR 2K sin modificación. Sólo cielo lejano; las plantas son geometría. |
| `*/wood.jpg`, `shared/wood-normal.jpg` | [Wood Table 001, Poly Haven](https://polyhaven.com/a/wood_table_001); fotografía Dimitrios Savva, procesamiento Rico Cilliers | CC0. Albedo 2K ajustado a los dos tonos de madera; normal OpenGL 2K. No se atribuye una especie de madera. |
| `*/stone.jpg`, `*/stone-rough.jpg`, `*/stone-normal.jpg`, `shared/counter.jpg` | [Marble 01, Poly Haven](https://polyhaven.com/a/marble_01), Rob Tuytel | CC0. Recorte de una losa del albedo 8K, eliminación de juntas de origen, adaptación de tono/contraste y bordes, exportación 2K. Micro-normal y rugosidad derivadas; no se presentan como mediciones físicas del material real. |
| `*/irradiance.png` | Horneado Cycles de esta geometría y los acabados de cada variante | Atlas específico por diseño, sin albedo, codificación lineal RGBM64. UV y proceso en documentación técnica. |
| Follaje de macetas en `bano.glb.gz` | [Potted Plant 04, Poly Haven](https://polyhaven.com/a/potted_plant_04), James Ray Cock | CC0. Se conserva la planta modelada y sus mapas PBR 2K; se integra en macetas claras propias, con UV de irradiancia adicional. |
| Helechos exteriores en `bano.glb.gz` | [Fern 02, Poly Haven](https://polyhaven.com/a/fern_02), Rico Cilliers (modelado), Rob Tuytel (escaneo) | CC0. Cuatro siluetas 3D, instancias a distintas profundidades; albedo, normal, rugosidad y máscara de recorte 2K incorporados al GLB. |
| `shared/fabric.jpg`, `shared/fabric-normal.jpg` | Textura de trama producida por el script de autoría | Procedural offline; albedo y normal 1K, trama tejida a escala local. |
| Iconos de la interfaz | Trazos SVG específicos del visor | Incluidos en el HTML; sin fuentes de iconos externas. |

Three.js (incluidos los addons del renderer) se distribuye bajo MIT. Vite, TypeScript y Playwright son dependencias de desarrollo fijadas en el lockfile y conservan sus respectivas licencias en los paquetes oficiales. No se utiliza Draco, Meshopt ni Basis; por ello no existen decodificadores JS/WASM externos obligatorios.

Las imágenes O1/O2/N1/N2 proporcionadas por el usuario se conservaron en la carpeta de referencias del encargo, fuera de la web publicable. Se usan únicamente para reconstrucción y comparación.

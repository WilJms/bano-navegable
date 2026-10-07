# Validación de la entrega local

Resultado: **57 PASS, 0 FAIL y 1 NO PROBADO** en los 58 casos del contrato. El caso opcional Modo Foto no se ofrece. Los límites de dispositivo se registran aparte y no se convierten en aprobaciones de hardware ausente.

## Build y funcionamiento

Instalación y build desde una copia independiente de `SUBIR_A_GITHUB`: código de salida 0. macOS negó por sandbox la lectura de todo el directorio original, incluida autoría, y se comprobó esa denegación antes de ejecutar `npm ci`, `npm run verify` y `npm run build`. No hubo descargas de modelos ni horneados durante esos comandos.

Pruebas de navegador: 37 aprobadas y 1 omitida. La omisión corresponde al protocolo multitáctil de Chromium en Firefox. También pasaron 8 pruebas geométricas, la comparación de anclajes con el contrato y el inventario SHA-256.

Se sirvió el build independiente con HTTP estático estricto en `/` y `/prueba-bano/`, incluyendo `index.html`, recarga y queries. Se bloquearon solicitudes externas: ambas variantes cargaron localmente. Se verificaron fallos 503 de recursos exclusivos, reintento, cancelación, última solicitud prevalente, ausencia de almacenamiento, conservación de pose/FOV/calidad/apertura, colisiones, entrada a ducha, Pointer Lock aceptado y rechazado, Escape, pantalla completa y recuperación del contexto gráfico. Las capturas finales no registraron errores ni avisos de shader.

## Rendimiento medido

MacBook Air Mac14,2 · Apple M2, GPU de 8 núcleos · 16 GB · macOS 26.6.2. Chromium 153.0.8010.12 con ANGLE Metal, ventana real; resolución 1920×1080, DPR 1, perfil Equilibrado. Ruta repetible de 61 segundos tras 10 segundos de calentamiento por diseño. No es SwiftShader ni un resultado de CI.

| Diseño | FPS medios | Mediana ms | P95 ms | P99 ms | Máximo ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| original | 60.0 | 16.7 | 17.5 | 17.6 | 17.7 |
| nuevo | 60.0 | 16.7 | 16.8 | 17.7 | 17.8 |

Carga fría local de Original: 1282 ms; primera carga diferida de Nuevo: 461 ms; cambio Nuevo desde caché: 3 ms. Incluye preparación de materiales y sonda. Es HTTP local sin limitar ancho de banda, no una promesa de tiempos en Internet.

Tras veinte cambios con perfiles: geometrías 55 → 55, texturas GPU 31 → 30; un bucle de render. La disminución corresponde a targets inactivos liberados al cambiar resolución. Se mantienen dos variantes en caché.

Recursos compartidos: 25.13 MiB. Original exclusivo: 11.18 MiB. Nuevo exclusivo: 12.52 MiB. Primera variante Original: 36.31 MiB, más aproximadamente 0,63 MiB de JS/CSS/HTML sin compresión HTTP. Se supera la orientación inicial de 15–30 MB para conservar modelo detallado, mapas 2K y atlas 4K. La segunda variante reutiliza íntegramente geometría y recursos comunes.

## Revisión visual y límites

Se capturaron las cuatro proporciones de referencia, frontal de ambos repiseros, lavabo, sanitario, dos traslaciones junto a ventana, espejo oblicuo, vidrio desde la ducha y formatos móvil vertical/horizontal. Consultar COMPARACION_REFERENCIAS.md y el índice visual en la carpeta separada de evidencias.

Atlas: 79080 triángulos; 0 componentes UV fuera de [0,1]; 0 muestras interiores solapadas en raster 2048². El muestreo no prueba de forma exhaustiva triángulos menores que un píxel.

Las dimensiones son aproximadas. El vidrio usa transparencia fina con Fresnel; el especular PBR del interior usa una sonda local aproximada, mientras el espejo principal sí responde a la cámara. La calidad Ligera reduce nitidez y resolución, sin retirar objetos. No se ofrece Modo Foto con trazado de caminos.

**No probado:** FPS de Safari, teléfonos físicos iPhone/Android, FPS móviles reales, agotamiento físico de memoria GPU, GitHub Actions remoto y despliegue público. La emulación táctil no se presenta como prueba en un teléfono. No se creó ni publicó un repositorio remoto.

## Registro por caso

| ID | Caso | Estado |
| --- | --- | --- |
| VIS-01 | Dos diseños 3D reales | PASS |
| VIS-02 | Distribución común | PASS |
| VIS-03 | Una sola ventana blanca de dos hojas | PASS |
| VIS-04 | Hueco y exterior con profundidad | PASS |
| VIS-05 | Exterior oblicuo | PASS |
| VIS-06 | Dos repiseros y vanitorio central | PASS |
| VIS-07 | Lados de muebles sin inversión | PASS |
| VIS-08 | Puertas inferiores sólo donde corresponden | PASS |
| VIS-09 | Inodoro fuera de ducha | PASS |
| VIS-10 | Baldas y accesorios sobre sanitario | PASS |
| VIS-11 | Tipología completa de ducha | PASS |
| VIS-12 | Vanitorio y lavabo detallados | PASS |
| VIS-13 | Materiales del original | PASS |
| VIS-14 | Materiales del nuevo | PASS |
| VIS-15 | Reflejo real del espejo | PASS |
| VIS-16 | Contorno reflectante y halo nuevos | PASS |
| VIS-17 | Vidrios superpuestos | PASS |
| VIS-18 | Luz correspondiente a la variante | PASS |
| VIS-19 | Sol y ventana coherentes | PASS |
| VIS-20 | Cuatro comparaciones de referencia | PASS |
| VIS-21 | Encuentros y color | PASS |
| VIS-22 | Acceso y profundidad adyacente | PASS |
| VAR-01 | Cambio sin mover cámara | PASS |
| VAR-02 | Conservar calidad e interacciones | PASS |
| VAR-03 | Sin mezcla parcial de diseños | PASS |
| VAR-04 | Solicitudes rápidas | PASS |
| VAR-05 | Fallo de recurso diferido | PASS |
| VAR-06 | Reintento tras fallo | PASS |
| VAR-07 | Independencia de recursos compartidos | PASS |
| VAR-08 | Enlace directo de diseño | PASS |
| VAR-09 | Vistas independientes de diseño | PASS |
| VAR-10 | Sin dependencia de almacenamiento | PASS |
| NAV-01 | Paseo humano cómodo | PASS |
| NAV-02 | Colisión con obstáculos | PASS |
| NAV-03 | Esquinas y grandes deltas | PASS |
| NAV-04 | Entrada válida a ducha | PASS |
| NAV-05 | Pointer Lock y alternativa | PASS |
| NAV-06 | Pérdida de foco | PASS |
| NAV-07 | Táctil funcional | PASS |
| NAV-08 | Poses seguras de vistas y reset | PASS |
| NAV-09 | Interfaz accesible mínima | PASS |
| DEP-01 | Build desde copia limpia | PASS |
| DEP-02 | Ruta raíz y prefijo | PASS |
| DEP-03 | Assets presentes y tipos correctos | PASS |
| DEP-04 | Sin servicios externos de runtime | PASS |
| DEP-05 | Consola y shaders | PASS |
| DEP-06 | Carpeta limpia y documentación | PASS |
| DEP-07 | Workflow coherente | PASS |
| DEP-08 | Licencias y procedencia | PASS |
| DEP-09 | No declarar publicación inexistente | PASS |
| PER-01 | Medición por diseño | PASS |
| PER-02 | Perfiles independientes | PASS |
| PER-03 | Veinte cambios sin fugas | PASS |
| PER-04 | Carga inicial y diferida | PASS |
| PER-05 | Pérdida de contexto y visibilidad | PASS |
| PER-06 | Compatibilidad delimitada | PASS |
| OPT-01 | Modo Foto si se ofrece | NO_PROBADO |
| OPT-02 | Extras terminados o ausentes | PASS |

## Ajuste posterior de ventana y muebles

Se reconstruyó el muro de fondo con 36 cm de espesor y se retranqueó el marco blanco para dejar 25 cm útiles de repisa dentro del hueco. La auditoría de los vértices del GLB confirma que el alféizar acaba al ras de la cara interior del muro (tolerancia de exportación inferior a 0,001 mm). Ambos repiseros miden 44 cm y dejan 3,5 cm libres a cada lado de la encimera. Las posiciones y sus colisiones se actualizan juntas; la iluminación se volvió a calcular por separado para los dos diseños.

El flujo revisado fue: cargar Nuevo → inspeccionar la ventana desde ambos lados → vista frontal y detalle de la separación → cambiar a Original conservando pose. Capturas 1440×960, frontal 1360×1156 y formatos táctiles 390×844 y 844×390. Identidad de página, escena visible, ausencia de overlay de error, consola, controles y capturas: PASS.

El Browser plugin y su skill no estaban disponibles; se usó el Playwright instalado y el navegador integrado mediante CUA. Los casos funcionales aprobados incluyen la matriz de ocho rutas/diseños, con recarga, en Chromium y Firefox. El caso multitáctil específico de Chromium se omite en Firefox. Comandos: npm ci, npm run verify, npm run build, npm run test:e2e, scripts/capture.mjs, scripts/measure-load.mjs y scripts/benchmark.mjs.


## Cierre de ducha, nombres e interacción de ventana

Los dos extremos transversales de la ducha están cerrados con paños de vidrio de las mismas dimensiones y perfiles compatibles. El nuevo vidrio junto al acceso tiene colisión propia: no se puede atravesar, incluso al abrir la corredera del pasillo. Se contrastó con la anotación del usuario conservada en evidencias/referencia-cierre-ducha.png.

Los selectores muestran únicamente Diseño 1 y Diseño 2. Conservan sus muestras, dimensiones, distribución y estilo. Los identificadores internos original/nuevo y sus URL permanecen compatibles.

La hoja izquierda de la ventana se desliza 43,75 cm hacia la derecha en su propia guía; sus cuatro perfiles, dos juntas, tirador y vidrio se desplazan juntos. El botón permite invertir el movimiento, funciona con teclado y en los formatos móviles comprobados, y no cambia la cámara. La apertura se conserva al cambiar de diseño y tras recuperar un contexto gráfico perdido. El espejo refleja el movimiento y la sonda PBR se renueva al terminar. La iluminación indirecta sigue horneada; no se recalcula todo el transporte de luz para cada estado intermedio.

| Requisito de la revisión | Resultado | Evidencia |
| --- | --- | --- |
| Extremo de ducha cerrado como el opuesto | PASS | Verificación de dimensiones del GLB, ocho pruebas geométricas y capturas ducha-extremo-acceso/ducha-esquina-superior |
| Sólo Diseño 1 y Diseño 2 en los botones | PASS | window.spec.ts en ambos navegadores y ventana-abierta-interfaz.png |
| Apertura, cierre y conservación de la ventana | PASS | window.spec.ts y device.spec.ts en ambos navegadores; capturas ventana-abierta por diseño |

Las mediciones de rendimiento de la ruta se realizan con la ventana cerrada. Las 34 capturas finales de escena/interfaz no registraron errores de JavaScript ni avisos de shader. La evidencia de móvil sigue siendo emulación, no un teléfono físico.

El detalle de evidencia y limitaciones por caso está en RESULTADOS_ACEPTACION.json. Las especificaciones originales conservan sus estados iniciales; ese contrato no se sobrescribió. Los logs de iteraciones previas se conservan separados y no sustituyen la ejecución final.

## Borde de los repiseros y precisión en Safari

La franja dentada junto al espejo tenía una causa geométrica: el fondo y el lateral ocupaban el mismo plano exterior. Se reconstruyeron las uniones entre paneles de ambos repiseros y se hornearon de nuevo los dos diseños. El muestreo del GLB pasó de 134.010 posiciones con dos superficies por lateral a cero, con separación de muestras de 0,5 mm. No prueba intersecciones menores que ese paso.

La captura del usuario también reveló pérdida de precisión en la iluminación de Safari. En WebKit 26.6, ImageBitmap alteró las 32 muestras RGBM de control; HTMLImageElement conservó las 32, con el mismo archivo. El cargador usa esa segunda vía para irradiancia. La regresión comprueba el SHA-256 de todos los bytes RGBA realmente cargados en GPU contra el manifiesto de autoría para ambos atlas 4096², en Chromium, Firefox y WebKit.

Safari nativo en este Mac se revisó visualmente con ambos diseños y el control de ventana. WebKit automatizado comprobó las texturas y los tres flujos de ventana, incluidos formatos 390×844 y 844×390. Las capturas específicas del borde usan 1440×900 y tres ángulos por diseño. Esta revisión no equivale a probar un iPhone ni a medir FPS de Safari.

Evidencia: borde-mueble/antes, borde-mueble/despues, borde-mueble/encuentros-final.json, borde-mueble/validacion.json y pruebas/e2e-webkit-borde.json. Browser plugin no disponible; se empleó Playwright y Safari mediante CUA.


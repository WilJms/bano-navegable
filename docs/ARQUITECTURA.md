# Autoría, render y contrato

## Geometría compartida

La semilla `especificaciones/scene-spec.json` gobierna ancho 2,45 m, largo 3,30 m, altura 2,55 m, abertura de ventana, ambos repiseros, vanitorio, ducha y sanitario. Son hipótesis ajustables, no medidas de obra. `shared/layout.json` es la transformación ejecutada del contrato: contiene anclajes, tamaños, mecanismo y cámaras que consume el navegador para colisiones y vistas.

Convención web: metros, +Y arriba, +X a la derecha al entrar, -Z hacia la ventana. Los helpers de autoría aceptan exactamente esas coordenadas. Conversión Blender: `(x, y, z) → (x, -z, y)`; la exportación glTF con Y arriba revierte esa rotación. No se cambia escala ni se refleja la planta. El fichero GLB contiene la geometría completa y los dos contornos de espejo; el atlas y las colisiones son comunes. Las piezas estáticas se consolidan por material para reducir llamadas de dibujo. Los IDs semánticos principales se conservan como anclajes en el manifiesto espacial.

El repisero frontal izquierdo está en Z=-0,535 y tiene puertas inferiores hasta aproximadamente la mitad. El derecho está en Z=-2,765 y es abierto. Ambos miden 44 cm de ancho. Sus fondos y baldas encajan entre los laterales de 24 mm, con 1 mm total de holgura; las baldas se retranquean 2 mm respecto al frente. No hay caras exteriores coincidentes entre fondo y lateral, que antes causaban una franja dentada junto al espejo. El módulo central se apoya sobre la pared X negativa. El sanitario mira hacia -X y queda completamente detrás del retorno de ducha en Z=-2,15. La ventana original tiene vano de 0,95×1,35 m, alféizar a 0,95 m, dos hojas blancas en pistas distintas, sellos, jambas y vidrio. Es una interpretación de corredera, no una identificación comercial.

El exterior tiene palmeras modeladas y helechos de escaneo con máscara de recorte, distribuidos en tres dimensiones. Tiene follaje repartidos entre Z=-4,5 y Z=-12 m más un cielo lejano HDR. La puerta abierta da a un tramo modelado de estancia. Los elementos se mantienen idénticos en cualquier cámara; no hay geometría escondida por encuadre.

## Iluminación y color

Blender 5.2.1 Cycles produce un atlas de irradiancia independiente para Original y Nuevo. La pasada DIFFUSE conserva luz directa e indirecta y excluye el albedo. El original tiene espejo rectangular sin emisor; el nuevo tiene su propio contorno y anillo cálido que participa en la transferencia de luz hacia la pared. Se mantienen sol y hueco de ventana. Las hojas móviles y vidrios se excluyen de la sombra estática para evitar sombras falsas adheridas al suelo.

`Surface` es el primer UV de materiales y `Irradiance` es el segundo, empaquetado sin reutilización intencional. En glTF se exportan como `TEXCOORD_0` y `TEXCOORD_1`; en Three el lightmap usa `channel=1`/`uv1`. La conversión offline guarda filas PNG de arriba hacia abajo, correspondientes a V invertido de glTF, y el loader usa `flipY=false`.

El PNG de irradiancia se decodifica con `HTMLImageElement`, `NoColorSpace` y `premultiplyAlpha=false`. La ruta `ImageBitmap` de WebKit probada cuantizaba el RGB con alfa bajo, incluso solicitando `premultiplyAlpha: 'none'`; producía bandas y manchas en iluminación y reflejos. La prueba `lightmaps.spec.ts` lee los 67.108.864 bytes del atlas realmente cargado en la GPU y compara su SHA-256 con los píxeles RGBA de autoría para cada diseño. Las otras texturas mantienen su carga mediante ImageBitmap. [Three documenta el tratamiento específico de alpha en ImageBitmap](https://threejs.org/docs/pages/ImageBitmapLoader.html).

Los mapas se filtran offline mediante el nodo Denoise de Blender y se codifican en RGBM64, sin gamma: `rgb_lineal = RGB × A × 64`. Los mapas de albedo se interpretan como sRGB, normales/rugosidad/irradiancia como datos lineales, y el HDR como Linear-sRGB. Cycles entrega radiancia difusa a albedo unidad; el shader la convierte a irradiancia con π para compensar el BRDF Lambert 1/π. El halo añade una aproximación analítica de irradiancia radial sobre la pared del vanitorio: sigue el centro/radio del emisor y el albedo real de la piedra, sin teñir toda la imagen. El emisor y el horneado propio ya aportan transporte indirecto; esta contribución local refuerza el detalle de alta frecuencia que pierde el atlas. Sólo existe en Nuevo y también entra en las capturas reflejadas. Los perfiles y accesorios blancos pequeños (ventana, cerco, macetas y boquillas) se iluminan dinámicamente para evitar contaminación entre islas UV diminutas.

El shader anula la contribución difusa dinámica y de entorno en superficies horneadas para no duplicar luz. El especular sigue respondiendo a cámara mediante PBR y una sonda local del interior por variante. La salida usa ACES y sRGB con exposición común 0,90; el cambio de diseño no modifica la exposición.

No se usa un HDR exterior indiscriminadamente como reflejo de los metales del baño: una CubeCamera captura el interior ya iluminado y PMREM lo filtra. Se excluyen espejo y transparencias de esa captura para evitar realimentación. Esa sonda conserva una aproximación estática de los objetos; el espejo principal siempre se renderiza desde la cámara actual.

## Espejo y vidrio

WebGLRenderer/WebGL 2 y Reflector de la misma versión Three **0.186.1**. La geometría importada del espejo se transforma a su plano local; el reflector redondo sólo cubre su círculo. Un único reflector es visible por variante, con recursión excluida. El reflector conserva el color lineal de la escena con reflectancia 0,965; no aplica una mezcla overlay coloreada. Su MSAA usa 4/2/0 muestras por perfil. Su resolución cambia con calidad sin congelar el reflejo al mover la cámara.

El vidrio utiliza una aproximación controlada de superficie fina: Fresnel angular, especular de entorno, transparencia suave, caras dobles y escritura de profundidad desactivada. Se conserva la geometría de 8 mm y el orden transparente estable. Se evita refracción en pantalla, que no resuelve con fidelidad capas transparentes delante de un espejo planar. No es una simulación volumétrica de refracción; se verifica visualmente en paños superpuestos, vistas oblicuas y ante espejo. La hoja corre sobre el paño fijo; su desplazamiento y collider usan el mismo estado escalar.

## Estado y navegación

Una aplicación y un bucle de render. Al cambiar diseño se recuperan cinco recursos exclusivos, se validan, se preparan materiales y se aplica síncronamente el conjunto con su reflector y sonda antes de actualizar la etiqueta. La imagen anterior permanece visible durante la descarga. AbortController e identificador de operación cancelan solicitudes antiguas; prevalece la última selección. El fallo conserva la variante utilizable y muestra Reintentar. Los dos conjuntos de texturas se mantienen en una caché acotada.

El visitante es un círculo de radio 0,145 m, a 1,62 m del suelo; el plato añade 0,062 m con transición corta. La velocidad es 0,82 m/s, con delta limitado y subpasos de hasta 0,025 m. Las cámaras públicas usan un corte breve a una pose comprobada; no interpolan a través de muros. La cámara frontal puede estar dentro de la ducha y conserva el vidrio visible. Las teclas y contactos activos se liberan al perder foco, abrir controles o cancelar punteros.

Alta limita DPR a 1,7 y espejo a 1024; Equilibrada a 1,15/768; Ligera a 0,8/384. Ningún perfil elimina muebles, exterior o sanitarios. Automática comienza en Alta para escritorio y Ligera para entrada táctil. Puede bajar de Alta a Equilibrada y después Ligera tras ocho segundos de lentitud sostenida por nivel. Las mediciones guardan tiempos RAF **sin truncar**; sólo se limita el delta usado para movimiento.

## Fuentes técnicas

- [Three Reflector](https://threejs.org/docs/pages/Reflector.html), [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html).
- [Blender 5 compositor migration](https://developer.blender.org/docs/release_notes/5.0/migration/compositor_migration/) y [File Output](https://docs.blender.org/manual/en/5.0/compositing/types/output/file_output.html).
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Los SHAs del workflow se resolvieron contra tags públicos de `actions/*` el 6 de octubre de 2026, sin credenciales ni configuración de remotos. La existencia del workflow no certifica un despliegue remoto.

El GLB se entrega comprimido con gzip y se descomprime con `DecompressionStream` nativo antes de GLTFLoader. No necesita un decodificador externo ni una descarga durante build. Las imágenes PBR de plantas viajan embebidas; el resto se enlaza desde el inventario local.

El jardín recibe sombras solares PCF de 2048 píxeles, calculadas una vez mientras la geometría permanece fija y regeneradas si se restaura el contexto. Sólo las superficies exteriores participan en ese mapa; el interior mantiene sus atlas propios y no duplica esa luz difusa.

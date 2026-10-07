# Comparación con las imágenes del encargo

Las capturas son del build servido por HTTP con Chromium y GPU Metal; no son renders de Blender ni imágenes de referencia pegadas. El índice visual separado `evidencias/comparacion.html` coloca las cuatro referencias junto a sus capturas sin transformar los píxeles. Las cámaras se ajustan de manera común y no deforman la habitación entre diseños.

| Referencia | Captura web | Revisión |
| --- | --- | --- |
| O1, diagonal, 1360×1156 | original-diagonal.png, 1360×1156 | Ventana de dos hojas blanca; vanitorio a izquierda; ducha a derecha; sanitario detrás de la ducha; baldas, dos macetas y toallas. Arena, cromo y madera cálida. |
| O2, acceso, 518×435 | original-acceso.png, 1036×870 | Mismo sentido de vista: ducha izquierda y vanitorio derecha. Espejo rectangular sin halo; puerta real abierta con profundidad de estancia al fondo. |
| N1, diagonal, 512×435 | nuevo-diagonal.png, 1024×870 | Misma habitación con piedra gris cálida de veta distinta, metal negro y espejo circular. Se conserva la ventana O1 por instrucción expresa. |
| N2, acceso, 518×435 | nuevo-acceso.png, 1036×870 | Piedra gris, mampara negra fina, cerámica blanca y contorno circular con halo. Reflejo del baño activo, incluidos objetos fuera de la vista directa. |

Las dos vistas frontales adicionales prueban los repiseros completos: cerrado abajo hacia el acceso, abierto hacia la ventana. Las vistas próximas de lavabo, sanitario, ventana, vidrio desde la ducha y espejo oblicuo están identificadas en `capture-log.json` con posición, orientación, lente, resolución y diseño.

Tras la aclaración del usuario, ambos repiseros pasan de 38 a 44 cm y dejan 3,5 cm libres a cada extremo de la encimera. La ventana blanca se retranquea 25 cm dentro del muro y la repisa inferior queda enrasada, sin barra saliente. Son ajustes explícitos compartidos por ambos diseños; la iluminación de cada variante se vuelve a hornear con esta geometría.

## Diferencias y aproximaciones declaradas

- La ventana estrecha oscura del diseño nuevo está descartada deliberadamente. Ambas variantes usan el vano original blanco. La distribución y dos muebles laterales siguen las aclaraciones del usuario aunque una perspectiva de referencia no permita verlos completos.
- Las medidas, el diámetro circular del espejo nuevo, la corredera de la mampara y el ángulo abierto de la puerta son reconstrucciones, no mediciones de los objetos reales. El ancho del paso se documenta en DIMENSIONES.md.
- Se usan muestras fotográficas de piedra y madera con escala métrica; no se afirma que reproduzcan la pieza comercial exacta. La vegetación incorpora plantas escaneadas y palmeras modeladas; su reparto exterior está diseñado para proporcionar profundidad y paralaje, no para copiar una fotografía plana.
- La puerta abre hacia la estancia contigua desde el lado derecho al entrar y se ve a la izquierda al mirar hacia el acceso, siguiendo O2/N2. Su ángulo abierto se reconstruye próximo a 90°; la hoja completa tiene paneles y manilla.
- Luz indirecta y sombras estáticas se hornean por diseño. El espejo se actualiza con la cámara. El vidrio es una aproximación transparente de superficie fina con Fresnel; no se presenta como refracción volumétrica exacta. El perfil Ligero sacrifica nitidez de reflejo y resolución, conservando todos los objetos.

Las imágenes sirven para evaluar el parecido visual; las pruebas geométricas y de navegación verifican que el espacio subyacente sea coherente. No se promete equivalencia fotográfica exacta ni dimensiones aptas para ejecutar una obra.

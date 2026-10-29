# Lecciones (leer antes de cada video, escribir después de cada comentario)

Reglas aprendidas con videos reales de producto. Cada skill las da por sabidas.
Cuando quien encarga el video comente algo, anótalo al final con fecha, formato, lo que dijo y lo que cambió.
Si un comentario se vuelve regla, súbelo a esta lista.

## Historia y contenido
1. **Nada de «presentación de PowerPoint».** Ventanas con títulos encima no bastan. Mejor una historia (un día en la vida del cliente) o el producto como objeto.
2. **Cada toma cuenta un flujo completo:** buscar → seleccionar → resultado visible. El resultado se ve a pantalla completa; el zoom solo donde aporta.
3. **El sistema se ve lleno, como en producción:** cifras creíbles, KPIs en positivo, sin «cliente prueba» ni tablas vacías. Se siembran datos de demo **en local**, nunca contra producción.
4. **Lo que se dice coincide con lo que se ve:** horas, nombres y cifras.
5. **Cada cifra del problema lleva fuente y está verificada.** No decir «lo hace solo» si una persona aprueba.
6. **El producto se llama como lo vende quien encarga el video.** Si la app interna dice otro nombre, se renombra **en la grabación** (`RENOMBRAR` de toma.py), nunca en la app.
7. Nada de nombres de clientes reales en pantalla sin permiso.
8. Si piden vertical y horizontal, se entregan los dos.

## Legibilidad
9. Una tarjeta con datos se lee **completa y casi de frente** (giro ≤ 6°), encuadrada al 65–80 % del ancho. El macro va solo como pasada breve.
10. **Profundidad de campo casi nula (apertura ≤ 16) en todo lo que tenga texto.** El desenfoque bonito no sirve si no se lee.
11. En las tomas, la cámara nunca se acerca a menos de ~1450 u: que se vea el contexto.
12. Aunque el brief pida «sobrio», se mantiene el lenguaje de objeto: piezas reales a 3× flotando en 3D, una palabra gigante por momento, brillo en la pieza clave y cámara viva. Una pantalla entera plana con cámara lejana se ve «de baja calidad» aunque el bitrate esté bien.
13. Una palabra blanca sobre tarjetas blancas desaparece: ponle halo (`O.halo`).

## Sonido
14. **Efectos solo en 3–5 momentos clave** (el primer dato, el logo, el cierre). Un whoosh en cada corte cansa. Los cortes normales van secos, solo con la música.
15. La voz la elige quien encarga el video. Si suena mal, no se prueba otra al azar: se pregunta.
16. Al cambiar de voz, las escenas se re-acomodan solas (`linea.py` mide cada frase).
17. Mezcla final a −14 LUFS, picos ≤ −1.5 dBTP y la música bajo la voz (sidechain).

## Costos y seguridad
18. Generar con IA cuesta créditos (tomas de video, imágenes): **estima y pide OK antes.**
19. Las llaves (TTS, generadores) entran por stdin o variable de entorno. **Nunca se escriben en archivos.**
20. El render 3D pesado va a una máquina con memoria y **por tramos**.

## Historial
<!-- AAAA-MM-DD · formato · «lo que dijo» → qué cambiamos -->

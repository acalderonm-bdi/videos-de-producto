# Recetas de los cinco formatos

Todos parten de la app en local con datos «de producción» y terminan en H.264 a −14 LUFS.

## 1 · Promo de venta (16:9, ~60 s)
**Estructura:** gancho → dolor (hojas de cálculo, caos) → revelación de la marca → una escena de 6 s por módulo (tablero, clientes,
operación, agenda, finanzas…) → **mercado** («para quién es»: que quede claro) → CTA.
**Cómo:** una toma limpia por módulo; cada escena es `K.feature({name, num, tag, head, sub, side, shots:[{file, pos, scale, ry}], chips:[{text, pos, dot}], zooms:[{file, rect, pos}]})`:
ventana de navegador inclinada en 3D + titular + subtítulo + chips con cifras + lupa sobre un dato. FilmCraft une con transiciones
(renderiza cada escena con +0.5 s de cola y usa `align:"start"`).
**Riesgo:** si todo son ventanas con títulos se siente «PowerPoint». Para redes, mejor 4 o 5.

## 2 · Reel con cámara que sigue al cursor (9:16, ~50 s)
**Estructura:** gancho → marca → 6–7 módulos de ~5 s → mercado → CTA.
**Cómo:** tomas con `toma.py` → `camara.py` (modo `auto`: el cursor suavizado y un zoom en cada clic) → `VS.demo(CAM, num, etiqueta, línea1, línea2)`:
la pantalla en un panel redondeado, la flecha del cursor como hija de la toma (tamaño constante en pantalla), una onda en cada clic,
un chip con lo que se teclea y un titular arriba.

## 3 · Reel de marca (9:16, ~55 s)
Igual que el 2, con identidad más fuerte, usando todas las apps:
- **PhotoCraft:** placa de fondo (nubes + gradiente + destello: `filter.render.clouds`, `lensFlare`, `gradientMap`); quitar fondos con
  `select.colorRange #000` + `edit.clear`.
- **DesignCraft:** letras grandes condensadas con contorno y sombra → PNG transparentes que entran de golpe.
- **SoundCraft:** música propia (`componer.py`) con golpes en los cortes clave.
- Logo animado: piezas del logo que llegan desde fuera y se arman.

## 4 · Un día en… (9:16, ~60 s) ★
**Idea:** una historia por horas (6:00 → 22:00). Cada bloque = 4 beats de b-roll real del lugar + la interfaz resolviendo **ese** momento.
**Bloques típicos:** apertura (tablero) · llega un cliente (buscar → seleccionar → «aprobado») · se llena un cupo · una reserva ·
hora pico (finanzas) · cierre del día (reportes). Gancho «Un día en un <negocio> / que ya no vive en hojas de cálculo», cierre con frase + CTA.
**Cómo:**
- b-roll con un generador de video por IA (5 s, 9:16, 1080p). **Cuesta créditos: estima y pide OK.**
- Tomas con el flujo COMPLETO y `t.mark('resultado')`; `camara.py` en modo `tramos` (acelera lo aburrido, acerca al buscar, abre a
  pantalla completa en el resultado; `"FULL"`).
- Reloj grande + narración tipo subtítulo; el overlay con alfa se exporta en WebM VP9 (ProRes 4444 llena el disco).
- Voz por línea del guion (`voz.py`). **La hora que dice la voz = la del reloj en pantalla.**

## 5 · Producto como objeto (16:9 y 9:16, ~37 s, 120 BPM) ★
**Idea:** sin personas ni créditos. La interfaz se desarma en capas 3D flotantes, macro sobre tarjetas y botones, profundidad de campo,
una palabra gigante a la vez, cámara cinematográfica, cortes secos al compás.
**Escenas (`objeto.jsx` → `O.ORDEN`):** `tablero` (las KPI despegan del plano, 7 s) · `accion` (macro del resultado + botón que se
presiona con pulso, 5 s) · `detalle` (macro sobre un dato, 4.5 s) · `plano` (tabla/agenda acostada, cámara a ras, 4.5 s) ·
`abanico` (3 tarjetas, el foco viaja, 5 s) · `constelacion` (todo flota, la cámara sale hacia atrás, 5.5 s) · `marca` (logo + CTA, 5.5 s).
**Cómo:** `piezas.py` → `construir.sh <video> objeto H` y `... V` → revisar cuadros en ambos aspectos → render por tramos →
música con `componer.py` (cortes en los beats de `O.ORDEN`).

# Biblioteca de Áreas: mejoras para la página web del ICAP

Respaldo de la sección **Áreas de Especialización** del brochure tal como
quedó con el librero y el libro abierto (commit `e26898d` de ICAP-vCard), para
llevar estas mejoras a la versión "Biblioteca" de la página web
(`paginaWeb-ICAP/biblioteca.html`, `js/biblioteca/libros.js`,
`css/biblioteca/libros.css`).

## Archivos

| Archivo | Qué es |
|---|---|
| `SpecializationAreas.librero.jsx` | La sección con **librero + libro abierto** (React). Es la versión completa. |
| `biblioteca.librero.css` | Todos los estilos `.bib-*` (librero, lomos, libro, hoja que gira, esquina, cinta) + `bookContentIn`. |
| `SpecializationAreas.fichero-libro.jsx` | Variante intermedia: **tarjetas celestes + el mismo libro** (sus estilos `.ficha-area` están en `src/styles/global.css` del brochure). |
| `etiquetas.con-descripciones.js` | Las 14 áreas con `desc` en español e inglés (las mismas descripciones de la página web, más la traducción). |

Fuente que usa el libro: **Source Serif 4** (Google Fonts, pesos 400 y 600, e itálica 400).

## Mejoras respecto de la página web actual

**Librero**
- Dos repisas de 2 × 2 nichos con los 14 libros repartidos entre libros de relleno con el isotipo del ICAP.
- Alturas y anchos de los lomos en `rem`, así crecen con el texto en pantallas grandes.
- En celular el librero se achica (`--escala`) y se esconden los libros de relleno de los nichos llenos, para que entren las áreas.
- Nombres cortos en el lomo cuando el nombre completo no cabe ("Seguridad alimentaria", "Ambiente y clima").

**Libros de relleno como botón** (reemplazan la placa)
- Con el mouse encima **no saltan**: el isotipo brilla y crece un poco (`drop-shadow` blanco + celeste).
- Al tocarlos, los de relleno se apagan y **las 14 áreas saltan una tras otra** (90 ms entre cada una).

**Libro abierto**
- Página izquierda (portadilla) y derecha (descripción con letra capitular, proyectos recientes con año y enlace "Ver proyectos relacionados").
- **Copias invisibles** del contenido de las 14 áreas apiladas en la misma celda de grid: la página toma siempre el alto de la más larga y no salta al cambiar.
- **Hoja que gira** al cambiar de área: hacia adelante gira la hoja derecha y hacia atrás la izquierda, según el orden.
- **Pasar páginas tocándolas**, como libro digital: la hoja izquierda va al área anterior y la derecha a la siguiente, dando la vuelta al llegar al final. En celular (una sola hoja) el tercio izquierdo va hacia atrás y el resto hacia adelante. Los botones y enlaces de la página no pasan la hoja.
- **Esquina que se levanta** con el mouse encima (`.bib-pasable::after`), como invitando a dar vuelta la página; en pantallas táctiles queda un poco levantada siempre.
- Cinta marcador del color del área colgando bajo el libro.
- **Auto-avance** cada 7 s, que se pausa con el mouse encima y se detiene con la primera elección. Sin auto-avance con `prefers-reduced-motion`.
- En celular el libro abre de una sola página y el contenido nuevo entra en cascada (`.bib-aparece`).

## Cómo llevarlo a la página web (vanilla JS)

La lógica es independiente de React; las piezas principales:

1. **Saltar** (`saltar` en el .jsx): agregar la clase `bib-saltando` al botón, con `--demora` opcional, y quitarla a los `750 ms + demora`. Si ya la tiene, no hacer nada (eso deja la estela).
2. **Resaltar** (`resaltar`): clase `resaltando` en el librero + `saltar(libro, i * 90)` para cada área.
3. **Cambiar de área** (`cambiar(i, adelante)`): guardar el área anterior, pintar la nueva debajo y, encima, la "hoja que gira" con la página vieja en el frente y la nueva en el dorso (ver el bloque `giro` del .jsx). Quitar la hoja en `animationend`.
4. **Pasar** (`pasar(±1)`) en el clic de cada hoja, con `(actual + paso + 14) % 14` y `adelante = paso > 0`.
5. El alto fijo de la página derecha: renderizar las 14 páginas con `visibility: hidden` en la misma celda (`grid-area: 1 / 1`) y la visible encima.

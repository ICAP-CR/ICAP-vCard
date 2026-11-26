import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import EscudoICAP from './EscudoICAP';
import { tituloDe } from '../data/proyectosData';

/**
 * Archivero de Áreas de Especialización (SpecializationAreas.jsx; estilos
 * .cat-* en global.css), con la paleta y las tipografías del brochure.
 *
 * El área elegida es una ficha de archivo blanca que sale de un cajón
 * navy, con el escudo del ICAP como marca de agua. Arriba, una fila de
 * pestañas ordenadas como en un archivero: las dos áreas anteriores a la
 * izquierda, la actual al centro (con su color y su nombre) y las dos
 * siguientes a la derecha. Al pasar de área la fila entera se corre un
 * lugar, así se ve que van rotando en orden.
 *
 * - Al cambiar de área la ficha vieja se hunde en el cajón hacia un lado y
 *   la nueva se descubre: el nombre aparece con un barrido de izquierda a
 *   derecha y el resto del contenido entra escalonado (.cat-contenido.revela).
 * - La marca de agua vive en la capa que no cambia con el área, así sólo
 *   se anima la primera vez que se entra a la sección.
 * - Con el mouse encima la ficha se inclina un poco siguiendo el puntero.
 * - Se puede arrastrar (o deslizar con el dedo) hacia los lados: a la
 *   izquierda pasa a la siguiente y a la derecha a la anterior. También
 *   con los botones del cajón, con ← → o tocando las pestañas.
 * - Para que la página no salte, la ficha lleva copias invisibles de las
 *   14 apiladas en la misma celda: toma siempre el alto de la más larga.
 * - Con prefers-reduced-motion no hay inclinación ni animaciones.
 */

const UMBRAL_ARRASTRE = 8;
const UMBRAL_PASAR = 80;

const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pestañas visibles: cuántos lugares antes (-) o después (+) del área
// actual está cada una. La posición sale del lugar, no del área, así al
// pasar de área cada pestaña se corre un lugar (transición en el CSS).
const LUGARES = [-2, -1, 0, 1, 2];

const numero = (i) => String(i + 1).padStart(2, '0');

/**
 * El contenido de una ficha. `estatica`: sin animación y sin botones
 * alcanzables con Tab (las copias invisibles y la ficha que se va).
 */
function Ficha({ area, i, total, recientes, lang, tA, onNavigate, estatica }) {
  const nombre = area[lang === 'en' ? 'en' : 'es'];
  const desc = area.desc[lang === 'en' ? 'en' : 'es'];
  const tab = estatica ? -1 : undefined;

  return (
    <div className={`cat-contenido ${estatica ? '' : 'revela'}`}>
      <div className="cat-cabecera">
        <span>{tA.catalogHeader}</span>
        <span>
          AT · {numero(i)}/{total}
        </span>
      </div>

      <h3 className="cat-titulo">{nombre}</h3>

      <p className="cat-desc">{desc}</p>

      <div className="cat-recientes">
        <span className="cat-rotulo">{tA.latest}</span>
        <ol>
          {recientes.map((p, k) => (
            <li key={p.id} title={tituloDe(p, lang)} style={{ '--k': k }}>
              <span>{tituloDe(p, lang)}</span>
              <span>{p.desde.slice(0, 4)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="cat-pie">
        <button type="button" tabIndex={tab} className="cat-enlace" onClick={() => onNavigate?.('proyectos', { etiqueta: area.id })}>
          {tA.seeRelated}
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

export default function FichaCatalogo({ areas, actual, adelante, recientes, lang, tA, onNavigate, onCambiar }) {
  const total = areas.length;
  const area = areas[actual];

  // La ficha que se va: se dibuja encima un momento y se hunde en el cajón.
  // `desde` es dónde quedó si se la venía arrastrando.
  const [salida, setSalida] = useState(null);
  const anteriorRef = useRef(actual);
  const arrastreFinalRef = useRef(0);
  const salidaNRef = useRef(0);
  useEffect(() => {
    const de = anteriorRef.current;
    if (de === actual) return;
    anteriorRef.current = actual;
    salidaNRef.current += 1;
    const n = salidaNRef.current;
    const desde = arrastreFinalRef.current;
    arrastreFinalRef.current = 0;
    if (sinMovimiento()) return;
    // Se agenda para el próximo cuadro: el cambio de `actual` ya pintó la
    // ficha nueva y la vieja se superpone encima mientras se va.
    const id = requestAnimationFrame(() => setSalida({ i: de, adelante, desde, n }));
    return () => cancelAnimationFrame(id);
  }, [actual, adelante]);

  // --- Inclinación y arrastre de la ficha --------------------------------
  const movRef = useRef(null);
  const gestoRef = useRef(null); // { id, x0, y0, arrastrando, tipo }
  const tocoArrastreRef = useRef(false);

  const aplicar = (transform, transicion) => {
    const el = movRef.current;
    if (!el) return;
    el.style.transition = transicion || '';
    el.style.transform = transform;
  };

  const inclinar = (e) => {
    const el = movRef.current;
    if (!el || sinMovimiento()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    aplicar(`rotateX(${(0.5 - py) * 4}deg) rotateY(${(px - 0.5) * 6}deg)`, 'transform 160ms ease-out');
  };

  const alPresionar = (e) => {
    if (e.button !== 0) return;
    gestoRef.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, arrastrando: false, tipo: e.pointerType };
  };

  const alMover = (e) => {
    const g = gestoRef.current;
    if (!g || g.id !== e.pointerId) {
      if (e.pointerType === 'mouse') inclinar(e);
      return;
    }
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.arrastrando) {
      if (Math.abs(dx) < UMBRAL_ARRASTRE || Math.abs(dx) < Math.abs(dy)) return;
      g.arrastrando = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      movRef.current?.classList.add('arrastrando');
    }
    g.dx = dx;
    aplicar(`translateX(${dx}px) rotate(${dx / 22}deg)`, 'none');
  };

  const alSoltar = (e) => {
    const g = gestoRef.current;
    if (!g || g.id !== e.pointerId) return;
    gestoRef.current = null;
    if (!g.arrastrando) return;
    movRef.current?.classList.remove('arrastrando');
    tocoArrastreRef.current = true;
    setTimeout(() => {
      tocoArrastreRef.current = false;
    }, 0);
    const dx = g.dx || 0;
    if (Math.abs(dx) > UMBRAL_PASAR) {
      // A la izquierda, la siguiente; a la derecha, la anterior.
      arrastreFinalRef.current = dx;
      aplicar('', 'none');
      onCambiar(dx < 0 ? (actual + 1) % total : (actual - 1 + total) % total, dx < 0);
    } else {
      aplicar('', 'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1)');
    }
  };

  const alSalir = () => {
    if (!gestoRef.current) aplicar('', 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)');
  };

  // El clic que llega al soltar un arrastre no activa botones de la ficha.
  const alClicCaptura = (e) => {
    if (tocoArrastreRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const pasar = (paso) => onCambiar((actual + paso + total) % total, paso > 0);

  const alTeclado = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      pasar(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pasar(-1);
    }
  };


  return (
    <div className="cat" onKeyDown={alTeclado}>
      <div className="cat-escena">
        {/* Pestañas en orden: anteriores a la izquierda, la actual al
            centro y siguientes a la derecha. La `key` es el área, así cada
            pestaña se desliza a su nuevo lugar cuando se pasa de área. */}
        <div className="cat-pestanas">
          {LUGARES.map((lugar) => {
            const j = (actual + lugar + total) % total;
            const a = areas[j];
            const Icon = a.icon;
            const nombreArea = a[lang === 'en' ? 'en' : 'es'];
            return (
              <button
                key={a.id}
                type="button"
                data-lugar={lugar}
                tabIndex={lugar === 0 ? -1 : undefined}
                aria-current={lugar === 0 ? 'true' : undefined}
                className={`cat-pestana ${lugar === 0 ? 'actual' : ''}`}
                style={{ '--c': a.color, '--t': a.text }}
                onClick={() => lugar !== 0 && onCambiar(j, lugar > 0)}
                title={nombreArea}
              >
                <Icon />
                {lugar === 0 ? <span className="cat-pestana-nombre">{nombreArea}</span> : <span>{numero(j)}</span>}
              </button>
            );
          })}
        </div>

        {/* La ficha actual (con las copias invisibles que le dan el alto) */}
        <div className="cat-pila">
          {/* Dos fichas de atrás, asomando apenas */}
          <div className="cat-ficha cat-atras cat-atras-1" aria-hidden="true" />
          <div className="cat-ficha cat-atras cat-atras-2" aria-hidden="true" />

          {areas.map((a, j) => (
            <div key={a.id} aria-hidden="true" className="cat-ficha cat-fantasma" style={{ '--c': a.color }}>
              <Ficha area={a} i={j} total={total} recientes={recientes[j]} lang={lang} tA={tA} estatica />
            </div>
          ))}

          <div
            className="cat-mov"
            ref={movRef}
            onPointerDown={alPresionar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            onPointerLeave={alSalir}
            onClickCapture={alClicCaptura}
          >
            {/* Marca de agua: el escudo del ICAP sobre la hoja. Está fuera de
                la ficha (que se remonta con cada área), así su aparición se
                ve sólo la primera vez que se entra a la sección. */}
            <EscudoICAP tono="navy" plano className="cat-marca dark:hidden" />
            <EscudoICAP tono="white" plano className="cat-marca hidden dark:block" />
            <div
              key={`${area.id}-${lang}`}
              className={`cat-ficha cat-activa ${sinMovimiento() ? '' : 'entra'}`}
              style={{ '--c': area.color }}
              aria-live="polite"
            >
              <span aria-hidden="true" className="cat-brillo" />
              <Ficha
                area={area}
                i={actual}
                total={total}
                recientes={recientes[actual]}
                lang={lang}
                tA={tA}
                onNavigate={onNavigate}
              />
            </div>
          </div>

          {/* La que se va, hundiéndose en el cajón hacia un lado */}
          {salida && (
            <div
              key={salida.n}
              aria-hidden="true"
              className={`cat-ficha cat-sale ${salida.adelante ? 'izq' : 'der'}`}
              style={{ '--desde': `${salida.desde}px`, '--giro': `${salida.desde / 22}deg`, '--c': areas[salida.i].color }}
              onAnimationEnd={(e) => e.target === e.currentTarget && setSalida((s) => (s?.n === salida.n ? null : s))}
            >
              <Ficha area={areas[salida.i]} i={salida.i} total={total} recientes={recientes[salida.i]} lang={lang} tA={tA} estatica />
            </div>
          )}
        </div>

        {/* Frente del cajón: etiqueta con el número y botones para pasar */}
        <div className="cat-cajon">
          <button type="button" className="cat-perilla" onClick={() => pasar(-1)} aria-label={tA.pagePrev} title={tA.pagePrev}>
            <ChevronLeft />
          </button>
          <div className="cat-placa">
            <span>{tA.drawerLabel}</span>
            <strong>
              {numero(actual)} / {total}
            </strong>
          </div>
          <button type="button" className="cat-perilla" onClick={() => pasar(1)} aria-label={tA.pageNext} title={tA.pageNext}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <p className="cat-pista">{tA.swipeHint}</p>
    </div>
  );
}

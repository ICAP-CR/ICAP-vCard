import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import KickerBadge from '../components/KickerBadge';
import { ETIQUETAS } from '../data/etiquetas';
import { PROYECTOS_AT, tituloDe } from '../data/proyectosData';
import icapLogoMark from '../assets/icap-logo-mark.png';

/**
 * Áreas de Especialización como biblioteca, en la línea de la versión
 * "Biblioteca" de la página web (estilos .bib-* en global.css):
 *
 * - Un librero navy de 2 × 2 nichos con un libro por cada una de las 14
 *   etiquetas de etiquetas.js, repartidos entre libros de relleno con el
 *   isotipo del ICAP.
 * - Al pasar el mouse cada libro da un saltito completo; pasar rápido por
 *   varios deja una estela (ver saltar). La placa del ICAP, al pie del
 *   librero, apaga los de relleno y hace saltar las 14 áreas una tras
 *   otra, para que se vea dónde está cada una.
 * - El área elegida queda un poco afuera del estante y se lee en un libro
 *   abierto de papel: a la izquierda la portadilla, a la derecha la
 *   descripción y sus proyectos más recientes (todas las áreas tienen al
 *   menos uno en proyectosData.js). Al cambiar de área se da vuelta una
 *   hoja (hacia adelante o hacia atrás según el orden).
 * - Las hojas también se pasan tocándolas, como un libro digital: la
 *   izquierda lleva al área anterior y la derecha a la siguiente (ver
 *   pasar).
 * - Debajo de lg el libro abre de una sola página y el contenido nuevo
 *   sólo aparece de a poco.
 * - La página derecha lleva copias invisibles del contenido de las 14
 *   áreas apiladas en la misma celda, así toma siempre el alto de la más
 *   larga y la página no salta al cambiar.
 * - Sin interacción, cada 7s se abre la siguiente; se pausa con el mouse
 *   encima y se detiene tras la primera elección del usuario. Con
 *   prefers-reduced-motion no hay auto-avance.
 */
const AREAS = ETIQUETAS;

// La que queda abierta al entrar.
const DEFAULT_AREA_ID = 'politica';
const DEFAULT_AREA_INDEX = Math.max(0, AREAS.findIndex((a) => a.id === DEFAULT_AREA_ID));

const AUTO_MS = 7000;
const SALTO_MS = 750; // igual que la animación bibSalto
const PASO_MS = 90; // entre un libro y el siguiente al tocar la placa

// Los cuatro nichos: hacia qué lado se acomodan sus libros y cuáles
// lleva (índice del área o 'r' para uno de relleno).
const NICHOS = [
  { lado: 'justify-start', cosas: [0, 1, 'r', 2, 3] },
  { lado: 'justify-end', cosas: ['r', 4, 5, 6] },
  { lado: 'justify-center', cosas: [7, 8, 9, 'r'] },
  { lado: 'justify-end', cosas: [10, 'r', 11, 12, 13] }
];

// Alturas y anchos fijos pero desparejos, como en un estante de verdad.
const desparejo = (n) => Math.sin(n * 12.9898) * 0.5 + 0.5;
// En rem (no px) para que crezcan junto con el texto en pantallas grandes.
const rem = (n) => `${n.toFixed(2)}rem`;
const altoLibro = (i) => rem(9.6 + desparejo(i) * 2.2);
const anchoLibro = (i) => rem(2.3 + desparejo(i + 20) * 0.45);

// Los de relleno van en tonos navy y celeste del ICAP, más angostos.
const RELLENO = ['#003366', '#5E87AE', '#0B4F8A', '#9FC6E8', '#1D4D7A', '#7FA6C9'];
const tintaSobre = (hex) => {
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#2B1A00' : '#fff';
};

// Los tres proyectos más recientes de un área.
const recientesDe = (id) =>
  PROYECTOS_AT.filter((p) => p.etiquetas.includes(id))
    .sort((a, b) => b.desde.localeCompare(a.desde))
    .slice(0, 3);

export default function SpecializationAreas({ onNavigate }) {
  const { t, lang } = useLanguage();
  const tA = t.specializationAreas;
  const nombre = (e) => e[lang === 'en' ? 'en' : 'es'];
  const recientes = useMemo(() => AREAS.map((e) => recientesDe(e.id)), []);

  const [abierta, setAbierta] = useState(DEFAULT_AREA_INDEX);
  // Hoja que se está dando vuelta: de qué área a cuál y hacia dónde. `n`
  // la distingue de la anterior si se cambia otra vez a medio giro.
  const [giro, setGiro] = useState(null);
  const pausadoRef = useRef(false);
  const eligioRef = useRef(false);
  const abiertaRef = useRef(abierta);
  const giroNRef = useRef(0);

  // `adelante`: hacia dónde gira la hoja. Por defecto según el orden, pero
  // al pasar de página (de la 14 a la 1 o al revés) se indica a mano.
  const cambiar = (i, adelante = i > abiertaRef.current) => {
    const de = abiertaRef.current;
    if (i === de) return;
    abiertaRef.current = i;
    giroNRef.current += 1;
    setGiro({ de, a: i, adelante, n: giroNRef.current });
    setAbierta(i);
  };

  const elegir = (i) => {
    eligioRef.current = true;
    cambiar(i);
  };

  // Pasar de página como en un libro digital: la hoja izquierda lleva al
  // área anterior y la derecha a la siguiente (dando la vuelta al llegar
  // al final). Debajo de lg hay una sola hoja: tocar su tercio izquierdo
  // va hacia atrás y el resto hacia adelante. Los botones y enlaces de la
  // página siguen haciendo lo suyo.
  const pasar = (paso) => {
    eligioRef.current = true;
    cambiar((abiertaRef.current + paso + AREAS.length) % AREAS.length, paso > 0);
  };
  const izqRef = useRef(null);
  const tocarDerecha = (e) => {
    if (e.target.closest('button, a')) return;
    const sinHojaIzq = izqRef.current && getComputedStyle(izqRef.current).display === 'none';
    if (sinHojaIzq) {
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX - r.left < r.width / 3) return pasar(-1);
    }
    pasar(1);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => {
      if (pausadoRef.current || eligioRef.current) return;
      cambiar((abiertaRef.current + 1) % AREAS.length, true);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, []);

  // Salto de un libro al pasar el mouse. Si ya está saltando termina su
  // salto, así pasar rápido por varios deja una estela. Se maneja directo
  // en el DOM (clase bib-saltando) para no re-renderizar.
  const saltar = (el, demora = 0) => {
    if (!el || el.classList.contains('bib-saltando')) return;
    el.style.setProperty('--demora', `${demora}ms`);
    el.classList.add('bib-saltando');
    setTimeout(() => el.classList.remove('bib-saltando'), demora + SALTO_MS);
  };

  // La placa: los de relleno se apagan y las áreas saltan una por una, en
  // orden, para que se vea dónde está cada una.
  const libreroRef = useRef(null);
  const resaltarRef = useRef(null);
  const resaltar = () => {
    const librero = libreroRef.current;
    if (!librero) return;
    clearTimeout(resaltarRef.current);
    librero.classList.add('resaltando');
    librero.querySelectorAll('.bib-libro-btn').forEach((b) => saltar(b, Number(b.dataset.i) * PASO_MS));
    resaltarRef.current = setTimeout(
      () => librero.classList.remove('resaltando'),
      AREAS.length * PASO_MS + SALTO_MS + 400
    );
  };
  useEffect(() => () => clearTimeout(resaltarRef.current), []);

  const terminarGiro = (n) => setGiro((g) => (g?.n === n ? null : g));

  // --- Páginas del libro ---------------------------------------------
  const paginaIzq = (i) => {
    const a = AREAS[i];
    const Icon = a.icon;
    return (
      <>
        <img className="bib-agua" src={icapLogoMark} alt="" aria-hidden="true" draggable={false} />
        <small>{tA.bookKicker}</small>
        <span className="bib-filete" />
        <strong>{nombre(a)}</strong>
        <Icon strokeWidth={1.25} />
        <em>
          {tA.institute[0]}
          <br />
          {tA.institute[1]}
        </em>
      </>
    );
  };

  // `activa`: sólo la página visible tiene botones alcanzables con Tab.
  const paginaDer = (i, activa) => {
    const a = AREAS[i];
    const tab = activa ? undefined : -1;
    return (
      <>
        <span className="bib-cabecera">{tA.bookHeader}</span>
        <h3>{nombre(a)}</h3>
        <p className="bib-capitular">{a.desc[lang === 'en' ? 'en' : 'es']}</p>
        <div>
          <h4>{tA.latest}</h4>
          <ul className="bib-recientes">
            {recientes[i].map((p) => (
              <li key={p.id} title={tituloDe(p, lang)}>
                <span>{tituloDe(p, lang)}</span>
                <span>{p.desde.slice(0, 4)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-5">
          <button
            type="button"
            tabIndex={tab}
            className="bib-enlace"
            onClick={() => onNavigate?.('proyectos', { etiqueta: a.id })}
          >
            {tA.seeRelated}
            <ArrowRight />
          </button>
        </div>
      </>
    );
  };

  const colorDe = (i) => ({ '--c': AREAS[i].color });

  let rellenos = 0;

  return (
    <section className="bib pt-[var(--docencia-gap)] pb-12 sm:pb-16 bg-[#D6E9F7] dark:bg-[#001F3D] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mb-1 sm:mb-1.5">
            <KickerBadge variant="glow">{tA.kicker}</KickerBadge>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#003366] dark:text-[#9FC6E8] tracking-tight">
            {tA.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 max-w-md mx-auto">{tA.subtitle}</p>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-8 lg:gap-12 items-center"
          onMouseEnter={() => {
            pausadoRef.current = true;
          }}
          onMouseLeave={() => {
            pausadoRef.current = false;
          }}
        >
          {/* LIBRERO */}
          <div className="w-full max-w-[560px] mx-auto lg:max-w-none">
            <div ref={libreroRef} className="bib-librero">
              {NICHOS.map((nicho, n) => (
                <div key={n} className={`bib-nicho ${nicho.lado}`}>
                  {nicho.cosas.map((cosa) => {
                    if (cosa === 'r') {
                      const k = rellenos++;
                      const color = RELLENO[k % RELLENO.length];
                      const claro = tintaSobre(color) !== '#fff';
                      return (
                        <span
                          key={`r${k}`}
                          aria-hidden="true"
                          className={`bib-relleno ${claro ? 'claro' : ''}`}
                          style={{
                            '--c': color,
                            '--tinta': tintaSobre(color),
                            '--ancho': rem(1.35 + desparejo(k + 40) * 0.3),
                            '--alto': rem(8.8 + desparejo(k + 7) * 2.6)
                          }}
                        >
                          <span className="bib-lomo">
                            <span className="bib-lomo-banda" />
                            <img src={icapLogoMark} alt="" draggable={false} />
                            <span className="bib-lomo-banda" />
                          </span>
                        </span>
                      );
                    }
                    const a = AREAS[cosa];
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className="bib-libro-btn"
                        data-i={cosa}
                        aria-pressed={cosa === abierta}
                        aria-label={nombre(a)}
                        title={nombre(a)}
                        onMouseEnter={(e) => saltar(e.currentTarget)}
                        onClick={() => elegir(cosa)}
                        style={{
                          '--c': a.color,
                          '--tinta': a.text,
                          '--ancho': anchoLibro(cosa),
                          '--alto': altoLibro(cosa)
                        }}
                      >
                        <span className="bib-lomo">
                          <span className="bib-lomo-banda" />
                          <span className="bib-lomo-titulo">{a.lomo ? nombre(a.lomo) : nombre(a)}</span>
                          <Icon strokeWidth={1.6} />
                          <span className="bib-lomo-banda" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-7">
              <button type="button" className="bib-placa" onClick={resaltar} aria-label={tA.plaqueAria}>
                <img src={icapLogoMark} alt="" draggable={false} />
                <span>{tA.plaqueTitle}</span>
                <small>{tA.plaqueCount(AREAS.length)}</small>
              </button>
            </div>
          </div>

          {/* LIBRO ABIERTO */}
          <div className="w-full max-w-[560px] lg:max-w-[680px] mx-auto">
            <div className="bib-libro" style={colorDe(abierta)} aria-live="polite">
              <div
                ref={izqRef}
                className="bib-cara-izq bib-pagina-izq bib-pasable atras"
                title={tA.pagePrev}
                onClick={() => pasar(-1)}
              >
                {paginaIzq(abierta)}
              </div>
              <div
                className="bib-cara-der bib-pagina-der bib-pasable adelante grid grid-cols-[minmax(0,1fr)]"
                title={tA.pageNext}
                onClick={tocarDerecha}
              >
                {/* Copias invisibles: dan el alto del área más larga */}
                {AREAS.map((a, i) => (
                  <div key={a.id} aria-hidden="true" className="invisible [grid-area:1/1] flex flex-col">
                    {paginaDer(i, false)}
                  </div>
                ))}
                <div key={abierta} className="bib-aparece [grid-area:1/1] flex flex-col">
                  {paginaDer(abierta, true)}
                </div>
              </div>
              <span className="bib-cinta" aria-hidden="true" />

              {/* La hoja que gira y, debajo de ella, la página vieja del lado
                  que todavía no se tapa (sólo desde lg, ver global.css). */}
              {giro && (
                <div key={giro.n} aria-hidden="true">
                  {giro.adelante ? (
                    <>
                      <div className="bib-hoja-fija izq bib-cara-izq" style={colorDe(giro.de)}>
                        {paginaIzq(giro.de)}
                      </div>
                      <div className="bib-hoja adelante" onAnimationEnd={(e) => e.target === e.currentTarget && terminarGiro(giro.n)}>
                        <div className="bib-hoja-frente bib-cara-der flex flex-col" style={colorDe(giro.de)}>
                          {paginaDer(giro.de, false)}
                        </div>
                        <div className="bib-hoja-dorso bib-cara-izq" style={colorDe(giro.a)}>
                          {paginaIzq(giro.a)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bib-hoja-fija der bib-cara-der flex flex-col" style={colorDe(giro.de)}>
                        {paginaDer(giro.de, false)}
                      </div>
                      <div className="bib-hoja atras" onAnimationEnd={(e) => e.target === e.currentTarget && terminarGiro(giro.n)}>
                        <div className="bib-hoja-frente bib-cara-izq" style={colorDe(giro.de)}>
                          {paginaIzq(giro.de)}
                        </div>
                        <div className="bib-hoja-dorso bib-cara-der flex flex-col" style={colorDe(giro.a)}>
                          {paginaDer(giro.a, false)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

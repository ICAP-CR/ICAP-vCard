import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import KickerBadge from '../components/KickerBadge';
import EscudoICAP from '../components/EscudoICAP';
import FichaCatalogo from '../components/FichaCatalogo';
import { ETIQUETAS } from '../data/etiquetas';
import { PROYECTOS_AT } from '../data/proyectosData';

/**
 * Áreas de Especialización: un fichero de tarjetas + una ficha de
 * catálogo vintage (FichaCatalogo.jsx).
 *
 * - Una tarjeta celeste por cada una de las 14 etiquetas de etiquetas.js
 *   (degradado, escudo de agua, círculo con el color del área, rayita de
 *   luz en la elegida; estilos .ficha-area en global.css): en dos columnas
 *   al lado de la ficha desde lg; debajo de lg, en una tira que se desliza
 *   de lado encima de la ficha (la elegida se centra sola).
 * - Al pasar el mouse cada tarjeta da un saltito suave; pasar rápido por
 *   varias deja una estela (ver saltar).
 * - El área elegida se lee en la ficha de catálogo, que sale de un cajón,
 *   se escribe a máquina y se sella. Ver FichaCatalogo.jsx para cómo se
 *   pasa de una a otra (arrastrar, perillas, pestañas, teclado).
 * - Sin interacción, cada 7s se abre la siguiente; se pausa con el mouse
 *   encima y se detiene tras la primera elección del usuario. Con
 *   prefers-reduced-motion no hay auto-avance.
 *
 * La versión anterior (librero + libro abierto) quedó guardada en
 * _respaldos/biblioteca-areas/ para la página web.
 */
const AREAS = ETIQUETAS;

// La que queda abierta al entrar.
const DEFAULT_AREA_ID = 'politica';
const DEFAULT_AREA_INDEX = Math.max(0, AREAS.findIndex((a) => a.id === DEFAULT_AREA_ID));

const AUTO_MS = 7000;
const SALTO_MS = 600; // igual que la animación fichaSalto

// Mismo celeste institucional de las tarjetas de antes: degradado + brillo
// radial arriba-izquierda. Junto con el box-shadow de .ficha-area da la
// ilusión 3D.
const CARD_BACKGROUND =
  'radial-gradient(65% 70% at 14% -8%, rgba(255,255,255,0.4), transparent 42%), ' +
  'linear-gradient(160deg, #0090DD 0%, #0068AE 48%, #013A63 100%)';

/**
 * Rayita de luz celeste con puntas de flecha + estela difuminada (la misma
 * técnica que KickerBadge variant="glow"), bajo el nombre de la tarjeta
 * elegida.
 */
function CardLightStreak() {
  return (
    <span aria-hidden="true" className="relative block h-[6px] w-[70%] kicker-light-sweep pointer-events-none">
      <span className="absolute inset-0 blur-[3px] opacity-80 bg-[linear-gradient(90deg,transparent,rgba(79,178,242,0.55)_18%,#5cc9ff_40%,#7dd3fc_50%,#5cc9ff_60%,rgba(79,178,242,0.55)_82%,transparent)]" />
      <span className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-[2px] bg-[linear-gradient(90deg,#4FB2F2,#7dd3fc_42%,#ffffff_50%,#7dd3fc_58%,#4FB2F2)] [clip-path:polygon(0%_50%,16%_0%,84%_0%,100%_50%,84%_100%,16%_100%)]" />
    </span>
  );
}

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

  // `adelante`: hacia qué lado se va la ficha vieja. Por defecto según el
  // orden, pero al pasar de la 14 a la 1 (o al revés) se indica a mano.
  const [vista, setVista] = useState({ abierta: DEFAULT_AREA_INDEX, adelante: true });
  const abierta = vista.abierta;
  const pausadoRef = useRef(false);
  const eligioRef = useRef(false);
  const abiertaRef = useRef(abierta);

  const cambiar = (i, adelante = i > abiertaRef.current) => {
    if (i === abiertaRef.current) return;
    abiertaRef.current = i;
    setVista({ abierta: i, adelante });
  };

  const elegir = (i, adelante) => {
    eligioRef.current = true;
    cambiar(i, adelante);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => {
      if (pausadoRef.current || eligioRef.current) return;
      cambiar((abiertaRef.current + 1) % AREAS.length, true);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, []);

  // Saltito de una tarjeta al pasar el mouse. Si ya está saltando termina
  // su salto, así pasar rápido por varias deja una estela. Se maneja
  // directo en el DOM (clase ficha-salta) para no re-renderizar.
  const saltar = (el) => {
    if (!el || el.classList.contains('ficha-salta')) return;
    el.classList.add('ficha-salta');
    setTimeout(() => el.classList.remove('ficha-salta'), SALTO_MS);
  };

  // En la tira de celular, la tarjeta elegida (a mano o por el auto-avance)
  // se centra sola. Sólo se mueve la tira de lado, nunca la página.
  const ficheroRef = useRef(null);
  useEffect(() => {
    const tira = ficheroRef.current;
    if (!tira || tira.scrollWidth <= tira.clientWidth + 1) return;
    const ficha = tira.querySelector(`[data-i="${abierta}"]`);
    if (!ficha) return;
    const destino = ficha.offsetLeft - (tira.clientWidth - ficha.offsetWidth) / 2;
    tira.scrollTo({ left: Math.max(0, destino), behavior: 'smooth' });
  }, [abierta]);

  return (
    <section className="pt-[var(--docencia-gap)] pb-12 sm:pb-16 bg-[#D6E9F7] dark:bg-[#001F3D] relative overflow-hidden">
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
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-12 items-center"
          onMouseEnter={() => {
            pausadoRef.current = true;
          }}
          onMouseLeave={() => {
            pausadoRef.current = false;
          }}
        >
          {/* FICHERO: una tarjeta por área. Debajo de lg es una tira que se
              desliza de lado (con margen negativo para llegar al borde de
              la pantalla); desde lg, dos columnas al lado de la ficha. */}
          <div
            ref={ficheroRef}
            className="-mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 lg:py-0 flex lg:grid lg:grid-cols-2 gap-2.5 lg:gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {AREAS.map((a, i) => {
              const Icon = a.icon;
              const activa = i === abierta;
              return (
                <button
                  key={a.id}
                  type="button"
                  data-i={i}
                  aria-pressed={activa}
                  onMouseEnter={(e) => saltar(e.currentTarget)}
                  onClick={() => elegir(i)}
                  className="ficha-area group relative shrink-0 w-[11.5rem] lg:w-auto h-[4.4rem] snap-center rounded-2xl overflow-hidden text-left text-white flex items-center gap-3 pl-3 pr-2.5 cursor-pointer"
                  style={{ background: CARD_BACKGROUND }}
                >
                  {/* Marca de agua: el escudo blanco, apenas insinuado */}
                  <EscudoICAP
                    tono="white"
                    className="absolute -right-5 top-1/2 w-24 -translate-y-1/2 rotate-[-8deg] opacity-[0.12] pointer-events-none"
                  />
                  {/* Hairline superior, el toque de "borde pulido" */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  />
                  <span className="relative shrink-0">
                    {activa && (
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1.5 rounded-full bg-[#BFE6FF]/40 blur-md kicker-glow-halo pointer-events-none"
                      />
                    )}
                    <span
                      className="relative w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center shadow-md"
                      style={{ backgroundColor: a.color, color: a.text }}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                  </span>
                  <span className="relative min-w-0 flex-1 flex flex-col gap-1">
                    <span className="font-heading font-extrabold text-[0.8rem] leading-tight line-clamp-2">{nombre(a)}</span>
                    {activa && <CardLightStreak />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* FICHA DE CATÁLOGO */}
          <div className="w-full max-w-[560px] lg:max-w-[600px] mx-auto">
            <FichaCatalogo
              areas={AREAS}
              actual={abierta}
              adelante={vista.adelante}
              recientes={recientes}
              lang={lang}
              tA={tA}
              onNavigate={onNavigate}
              onCambiar={elegir}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

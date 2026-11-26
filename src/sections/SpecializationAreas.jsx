import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import KickerBadge from '../components/KickerBadge';
import FichaCatalogo from '../components/FichaCatalogo';
import { ETIQUETAS } from '../data/etiquetas';
import { PROYECTOS_AT } from '../data/proyectosData';

/**
 * Áreas de Especialización: un índice de archivo vertical + la ficha del
 * archivero (FichaCatalogo.jsx). Estilos .arch-* y .cat-* en global.css.
 *
 * - El índice es una columna angosta de cápsulas navy con letra blanca,
 *   una por cada una de las 14 etiquetas de etiquetas.js: el número en
 *   gris pegado a la izquierda, el nombre al centro y el ícono pintado del
 *   color del área, en un circulito blanco pegado a la derecha. La elegida se pone en el azul del
 *   ICAP y se sale un poco hacia la ficha. Al pasar el mouse cada cápsula
 *   se alarga un poco hacia la ficha y vuelve; el movimiento se completa
 *   aunque el mouse ya se haya ido, así pasar rápido por varias deja una
 *   estela (ver estela). Debajo de lg el índice es una tira horizontal que se
 *   desliza de lado encima de la ficha (la elegida se centra sola).
 * - El área elegida se lee en la ficha del archivero. Ver FichaCatalogo.jsx
 *   para cómo se pasa de una a otra (arrastrar, botones, pestañas,
 *   teclado).
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
const ESTELA_MS = 650; // igual que la animación archEstela

const numero = (i) => String(i + 1).padStart(2, '0');

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

  // Estela al pasar el mouse: la cápsula se alarga y vuelve. Si ya se está
  // moviendo, termina su movimiento; así, pasar rápido por varias deja una
  // estela. Se maneja directo en el DOM para no re-renderizar.
  const estela = (el) => {
    if (!el || el.classList.contains('arch-estela')) return;
    el.classList.add('arch-estela');
    setTimeout(() => el.classList.remove('arch-estela'), ESTELA_MS);
  };

  // En la tira de celular, la cápsula elegida (a mano o por el auto-avance)
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
          className="grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] gap-6 lg:gap-10 lg:items-stretch"
          onMouseEnter={() => {
            pausadoRef.current = true;
          }}
          onMouseLeave={() => {
            pausadoRef.current = false;
          }}
        >
          {/* ÍNDICE: una carpeta por área. Desde lg es un archivador vertical;
              debajo de lg, una tira que se desliza de lado (con margen
              negativo para llegar al borde de la pantalla). */}
          <div className="-mx-4 sm:-mx-6 lg:mx-0">
            <nav className="arch" aria-label={tA.indexLabel}>
              <div className="arch-cabecera" aria-hidden="true">
                <span>{tA.indexLabel}</span>
                <span>{AREAS.length}</span>
              </div>
              <div ref={ficheroRef} className="arch-lista">
                {AREAS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      data-i={i}
                      aria-pressed={i === abierta}
                      onMouseEnter={(e) => estela(e.currentTarget)}
                      onClick={() => elegir(i)}
                      className="arch-carpeta"
                      style={{ '--c': a.color }}
                    >
                      <span className="arch-num">{numero(i)}</span>
                      <span className="arch-nombre">{nombre(a)}</span>
                      <span className="arch-logo" aria-hidden="true">
                        <Icon className="arch-icono" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* FICHA DEL ARCHIVERO: desde lg toma el alto de la columna de áreas
              (.cat se estira), así índice y ficha se leen como una sola pieza. */}
          <div className="w-full max-w-[560px] lg:max-w-none mx-auto">
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

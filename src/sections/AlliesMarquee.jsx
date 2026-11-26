import { useEffect, useRef, useState } from 'react';
import { Info, X, ArrowRight, ChevronRight } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import KickerBadge from '../components/KickerBadge';
import { getEtiqueta, nombreEtiqueta } from '../data/etiquetas';
import { SOCIOS, proyectosDeSocio, tituloDe } from '../data/proyectosData';
import { useLanguage } from '../i18n/LanguageContext';
import sicaLogo from '../assets/allies/sica.png';
import bidLogo from '../assets/allies/bid.png';
import flacsoLogo from '../assets/allies/flacso.png';
import aecidLogo from '../assets/allies/aecid.png';
import ospescaLogo from '../assets/allies/ospesca.png';
import cenpromypeLogo from '../assets/allies/cenpromype.png';
import crieLogo from '../assets/allies/crie.png';
import gizLogo from '../assets/allies/giz.png';
import bancoMundialLogo from '../assets/allies/banco-mundial.png';
import pnudLogo from '../assets/allies/pnud.png';
import unescoLogo from '../assets/allies/unesco.png';
import unicefLogo from '../assets/allies/unicef.png';
import oitLogo from '../assets/allies/oit.png';
import iicaLogo from '../assets/allies/iica.png';
import uicnLogo from '../assets/allies/uicn.png';
import oimLogo from '../assets/allies/oim.png';

/**
 * Organismos aliados del ICAP: los organismos internacionales y del SICA
 * que figuran como clientes en la base de proyectos con evidencia
 * (SOCIOS / proyectosDeSocio() en proyectosData.js). Nombre y descripción
 * salen de translations.js (allies.items) y el logo de src/assets/allies
 * (recortados al contenido y en cuadrado de 256 px). Si a alguno le falta
 * el logo, se muestran sus siglas.
 *
 * Van ordenados por cantidad de proyectos, con el SICA siempre primero.
 */
const LOGOS = {
  sica: sicaLogo,
  bid: bidLogo,
  flacso: flacsoLogo,
  aecid: aecidLogo,
  ospesca: ospescaLogo,
  cenpromype: cenpromypeLogo,
  crie: crieLogo,
  giz: gizLogo,
  'banco-mundial': bancoMundialLogo,
  pnud: pnudLogo,
  unesco: unescoLogo,
  unicef: unicefLogo,
  oit: oitLogo,
  iica: iicaLogo,
  uicn: uicnLogo,
  oim: oimLogo
};

// Tira: velocidad del avance solo (px por ms, hacia la izquierda) y cuánto
// hay que mover el puntero para que cuente como arrastre y no como clic.
const VELOCIDAD = 0.045;
const UMBRAL_ARRASTRE = 6;

const ALLIES = SOCIOS.map((id) => ({ id, logo: LOGOS[id] || null, n: proyectosDeSocio(id).length }))
  .filter((a) => a.n > 0)
  .sort((a, b) => (a.id === 'sica' ? -1 : b.id === 'sica' ? 1 : b.n - a.n));

function AllyIconBadge({ ally, size = 'w-8 h-8', textSize = 'text-xs' }) {
  if (ally.logo) {
    return (
      <div className={`${size} rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0`}>
        <img src={ally.logo} alt={ally.name} draggable={false} className="w-full h-full object-contain p-1" />
      </div>
    );
  }
  // Sin logo: las siglas en navy sobre blanco, como si fuera el logo. Las
  // siglas largas (CENPROMYPE) van más chicas para que quepan.
  const sigla = ally.name.split(' ')[0];
  return (
    <div
      className={`${size} rounded-lg bg-white text-[#003366] flex items-center justify-center font-heading font-extrabold tracking-tight leading-none shrink-0 ${
        sigla.length > 5 ? 'text-[0.45rem]' : textSize
      }`}
    >
      {sigla}
    </div>
  );
}

function AllyDetailBody({ ally, onNavigate }) {
  const { t, lang } = useLanguage();
  const proyectos = proyectosDeSocio(ally.id);

  if (!proyectos.length) {
    return <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{t.allies.noProjectRecord}</p>;
  }

  // Etiquetas de todos sus proyectos, de la más frecuente a la menos.
  const conteo = {};
  proyectos.forEach((p) => p.etiquetas.forEach((id) => (conteo[id] = (conteo[id] || 0) + 1)));
  const etiquetas = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]);

  return (
    <div className="space-y-5">
      <div>
        <span className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
          {t.allies.relatedProjects} · {proyectos.length}
        </span>
        <ul className="space-y-2">
          {proyectos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onNavigate?.('proyectos', { proyecto: p.id })}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-[#0077C8]/40 transition-colors flex items-start gap-3 group"
              >
                <span className="flex gap-1 mt-1 shrink-0">
                  {p.etiquetas.map((id) => (
                    <span key={id} className="w-2 h-2 rounded-full" style={{ backgroundColor: getEtiqueta(id).color }} />
                  ))}
                </span>
                <span className="text-xs text-slate-800 dark:text-slate-100 leading-snug flex-1 line-clamp-3">{tituloDe(p, lang)}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0077C8] shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <span className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
          {t.allies.projectAreasLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {etiquetas.map((id) => {
            const e = getEtiqueta(id);
            const Icon = e.icon;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold shadow-sm"
                style={{ backgroundColor: e.color, color: e.text }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {nombreEtiqueta(id, lang)}
              </span>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate?.('proyectos', { socio: ally.id })}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0077C8] text-white font-heading font-bold text-xs sm:text-sm shadow hover:bg-[#005FA3] transition-colors"
      >
        {t.allies.seeAll(proyectos.length)}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AlliesMarquee({ onNavigate }) {
  const { t } = useLanguage();
  // Mismos datos (id, logo) con el nombre y la etiqueta traducidos según
  // el idioma activo, tomados de translations.js por id.
  const alliesT = ALLIES.map((a) => ({
    ...a,
    ...t.allies.items[a.id],
    proyectos: proyectosDeSocio(a.id)
  }));
  const sectionRef = useRef(null);
  const isDesktopRef = useRef(false);
  const [selected, setSelected] = useState(null);
  const [bubblePos, setBubblePos] = useState(null);
  const [viewportH, setViewportH] = useState(0);

  // Mismo patrón que RegionalMap.jsx: medir el ancho contra el documento
  // dueño de la sección (no contra `window` global), para que funcione
  // igual dentro del iframe de "Vista Móvil".
  useEffect(() => {
    const el = sectionRef.current;
    const doc = el?.ownerDocument;
    if (!doc) return undefined;

    const checkWidth = () => {
      isDesktopRef.current = doc.documentElement.clientWidth >= 1024; // breakpoint `lg` de Tailwind
      setViewportH(doc.documentElement.clientHeight);
    };
    checkWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(checkWidth);
      ro.observe(doc.documentElement);
      return () => ro.disconnect();
    }
    const view = doc.defaultView;
    view?.addEventListener('resize', checkWidth);
    return () => view?.removeEventListener('resize', checkWidth);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    if (!selected) return undefined;
    const doc = sectionRef.current?.ownerDocument;
    if (!doc) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeDetail();
    };
    doc.addEventListener('keydown', onKey);
    return () => doc.removeEventListener('keydown', onKey);
  }, [selected]);

  const handleSelect = (ally, event) => {
    if (isDesktopRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const doc = sectionRef.current?.ownerDocument;
      const vw = doc?.documentElement.clientWidth || rect.right;
      const vh = doc?.documentElement.clientHeight || rect.bottom;
      const BUBBLE_WIDTH = 340;
      const PADDING = 16;
      let left = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2;
      left = Math.max(PADDING, Math.min(left, vw - BUBBLE_WIDTH - PADDING));
      const spaceBelow = vh - rect.bottom;
      const openUpward = spaceBelow < 300;
      const top = openUpward ? rect.top - 12 : rect.bottom + 12;
      setBubblePos({ left, top, openUpward, width: BUBBLE_WIDTH });
    } else {
      setBubblePos(null);
    }
    setSelected(ally);
  };

  const closeDetail = () => {
    setSelected(null);
    setBubblePos(null);
  };

  const showBubble = Boolean(selected && isDesktopRef.current && bubblePos);
  const showSheet = Boolean(selected && !isDesktopRef.current);

  // --- Tira que avanza sola y se puede jalar ----------------------------
  // El desplazamiento lo lleva JS (no una animación CSS) para poder
  // arrastrarla: se agarra con el mouse o el dedo y se suelta con un poco
  // de inercia. La tira está duplicada; al pasar media tira se vuelve al
  // principio sin que se note. Se detiene con el mouse encima, mientras
  // la ficha de un socio está abierta y con prefers-reduced-motion (que
  // igual deja arrastrar).
  const pistaRef = useRef(null);
  const offsetRef = useRef(0);
  const inerciaRef = useRef(0); // px/ms que quedan después de soltar
  const encimaRef = useRef(false);
  const abiertaRef = useRef(false);
  const arrastreRef = useRef(null); // { id, x0, offset0, movido, ultX, ultT, vel }
  const fueArrastreRef = useRef(false);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    abiertaRef.current = Boolean(selected);
  }, [selected]);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return undefined;
    const view = pista.ownerDocument.defaultView;
    const sinMovimiento = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let antes = view.performance.now();
    const cuadro = (ahora) => {
      const dt = Math.min(64, ahora - antes);
      antes = ahora;
      const mitad = pista.scrollWidth / 2;
      if (!arrastreRef.current && mitad > 0) {
        let paso = 0;
        if (Math.abs(inerciaRef.current) > 0.01) {
          paso = inerciaRef.current * dt;
          inerciaRef.current *= 0.95 ** (dt / 16);
        } else if (!sinMovimiento && !encimaRef.current && !abiertaRef.current) {
          paso = -VELOCIDAD * dt;
        }
        offsetRef.current += paso;
      }
      if (mitad > 0) {
        while (offsetRef.current <= -mitad) offsetRef.current += mitad;
        while (offsetRef.current > 0) offsetRef.current -= mitad;
      }
      pista.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      raf = view.requestAnimationFrame(cuadro);
    };
    raf = view.requestAnimationFrame(cuadro);
    return () => view.cancelAnimationFrame(raf);
  }, []);

  const alPresionar = (e) => {
    if (e.button !== 0) return;
    inerciaRef.current = 0;
    arrastreRef.current = { id: e.pointerId, x0: e.clientX, offset0: offsetRef.current, movido: false, ultX: e.clientX, ultT: e.timeStamp, vel: 0 };
  };
  const alMover = (e) => {
    const a = arrastreRef.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x0;
    // Recién al pasar el umbral es arrastre: así un clic normal sigue
    // abriendo la ficha del socio. La captura del puntero se toma ahí y
    // no antes, porque capturar desde el inicio mandaría el clic a la
    // pista en vez de a la tarjeta.
    if (!a.movido && Math.abs(dx) > UMBRAL_ARRASTRE) {
      a.movido = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setArrastrando(true);
    }
    if (!a.movido) return;
    offsetRef.current = a.offset0 + dx;
    const dt = e.timeStamp - a.ultT;
    if (dt > 0) a.vel = 0.8 * ((e.clientX - a.ultX) / dt) + 0.2 * a.vel;
    a.ultX = e.clientX;
    a.ultT = e.timeStamp;
  };
  const alSoltar = (e) => {
    const a = arrastreRef.current;
    if (!a || a.id !== e.pointerId) return;
    arrastreRef.current = null;
    if (a.movido) {
      // El clic que el navegador dispara al soltar llega enseguida; si no
      // llega (no siempre lo hay tras un arrastre), la marca se borra sola
      // para no comerse el próximo clic de verdad.
      fueArrastreRef.current = true;
      setTimeout(() => {
        fueArrastreRef.current = false;
      }, 0);
      inerciaRef.current = Math.max(-3, Math.min(3, a.vel));
      setArrastrando(false);
    }
  };
  // El clic que llega justo después de un arrastre no abre la ficha.
  const alClicCaptura = (e) => {
    if (fueArrastreRef.current) {
      fueArrastreRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <section ref={sectionRef} className="py-12 bg-gradient-to-br from-[#003366] via-[#0B5A96] to-[#0077C8] text-white overflow-hidden border-y border-white/5 relative">
      <div className="max-w-4xl mx-auto px-6 mb-8 text-center">
        {/* Píldora KickerBadge con `onDark`: el fondo de esta sección es siempre
            este degradado oscuro, sin importar el tema. */}
        <div className="mb-1.5 sm:mb-2 flex justify-center">
          <KickerBadge variant="glow" onDark>
            {t.allies.kicker}
          </KickerBadge>
        </div>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          {t.allies.title}
        </h2>
        <p className="text-[0.6875rem] sm:text-xs text-[#D6E9F7] mt-1.5">
          {t.allies.subtitle}
        </p>
      </div>

      {/* Infinite scrolling track */}
      <div className="relative w-full overflow-hidden flex items-center py-2">
        {/* Gradient fades at borders */}
        <div className="absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-[#003366] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-[#0077C8] to-transparent z-10 pointer-events-none" />

        {/* touch-action pan-y: en el celular el gesto vertical sigue
            bajando la página y el horizontal jala la tira. */}
        <div
          ref={pistaRef}
          className={`tira-aliados flex items-center select-none touch-pan-y ${arrastrando ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onClickCapture={alClicCaptura}
          onMouseEnter={() => {
            encimaRef.current = true;
          }}
          onMouseLeave={() => {
            encimaRef.current = false;
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {[...alliesT, ...alliesT].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleSelect(item, e)}
              className={`flex items-center gap-3.5 px-7 py-4.5 mr-5 rounded-2xl bg-white/10 border border-white/20 hover:border-white/50 hover:bg-white/20 transition-[background-color,border-color] min-w-[240px] sm:min-w-[290px] shrink-0 group text-left ${
                arrastrando ? 'cursor-grabbing' : 'cursor-pointer'
              }`}
            >
              <AllyIconBadge ally={item} size="w-11 h-11" textSize="text-sm" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-heading font-bold text-base text-white group-hover:text-white transition-colors">
                  {item.name}
                </span>
                <span className="text-xs text-[#D6E9F7]/80 line-clamp-1 leading-snug">
                  {item.label}
                </span>
                {item.proyectos.length > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[0.625rem] font-semibold text-white/85">
                    <span className="flex gap-0.5">
                      {[...new Set(item.proyectos.flatMap((p) => p.etiquetas))].slice(0, 5).map((id) => (
                        <span key={id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEtiqueta(id).color }} />
                      ))}
                    </span>
                    {t.specializationAreas.projectsSuffix(item.proyectos.length)}
                  </span>
                )}
              </div>
              <Info className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Ficha en bottom sheet: celular y tablet */}
      <BottomSheet
        isOpen={showSheet}
        onClose={closeDetail}
        title={selected?.name}
        subtitle={t.allies.modalSubtitle}
        icon={selected && <AllyIconBadge ally={selected} size="w-8 h-8" textSize="text-xs" />}
      >
        {selected && <AllyDetailBody ally={selected} onNavigate={onNavigate} />}
      </BottomSheet>

      {/* Ficha en burbuja anclada a la tarjeta: escritorio */}
      {showBubble && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeDetail} aria-hidden="true" />
          <div
            className="fixed z-50 bg-white dark:bg-[#0B2340] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 animate-fade-in"
            style={{
              left: bubblePos.left,
              width: bubblePos.width,
              ...(bubblePos.openUpward
                ? { bottom: viewportH - bubblePos.top }
                : { top: bubblePos.top })
            }}
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <AllyIconBadge ally={selected} size="w-8 h-8" textSize="text-xs" />
                </div>
                <div className="min-w-0">
                  <span className="text-[0.625rem] font-mono-code font-bold uppercase tracking-wider text-[#0077C8] block">
                    {t.allies.modalSubtitle}
                  </span>
                  <h4 className="font-heading font-extrabold text-base text-[#003366] dark:text-[#9FC6E8] leading-tight truncate">
                    {selected.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="p-1.5 -mr-1 -mt-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                title={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto overscroll-contain">
              <AllyDetailBody ally={selected} onNavigate={onNavigate} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

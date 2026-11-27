import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Briefcase, Handshake, Globe2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import KickerBadge from '../components/KickerBadge';
import AlliancesSheet from './AlliancesSheet';
import { PROYECTOS_AT, totalAliados, paisesAtendidos } from '../data/proyectosData';

/**
 * Cuenta de 0 hasta `value` con una curva ease-out (arranca rápido, frena
 * suave al llegar al total) y expone además el progreso 0-1 de esa misma
 * animación, para poder sincronizar el anillo de progreso del ícono con
 * el número sin manejar dos relojes distintos.
 */
function useCountUp(value, start, duration) {
  const [display, setDisplay] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!start) return undefined;

    const startTime = performance.now();

    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(value * eased));
      setProgress(eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [start, value, duration]);

  return { display, progress };
}

const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Misma duración de conteo para las 3 tarjetas: así el "pop" final de
// los 3 números aterriza exacto al mismo tiempo.
const STAT_COUNT_DURATION = 2900;

// Tendencia de ejemplo (5 barras ascendentes) para el mini gráfico de cada
// tarjeta: no son datos reales, es solo el gesto visual de "va en aumento".
const CHART_BAR_HEIGHTS = [34, 50, 64, 80, 100];

function MiniGrowthChart({ start, hex, duration }) {
  // Reparte el gráfico entre las 5 barras, una después de otra, y termina
  // medio segundo antes que el conteo del número, para que no aterricen
  // calcadas.
  const chartDuration = Math.max(duration - 500, 600);
  const segment = chartDuration / CHART_BAR_HEIGHTS.length;

  return (
    <div className="flex items-end justify-center gap-[3px] h-6 mt-2.5" aria-hidden="true">
      {CHART_BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[5px] rounded-full transition-[height]"
          style={{
            height: start ? `${h}%` : '10%',
            backgroundColor: hex,
            opacity: 0.3 + (h / 100) * 0.55,
            transitionDuration: `${segment}ms`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: start ? `${i * segment}ms` : '0ms'
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, sublabel, color, hex, visible, start, duration, enterDelay, popTick, onClick }) {
  const { display, progress } = useCountUp(value, start, duration);
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    // Toda la tarjeta es un botón (lleva a su sección o abre las Alianzas).
    // La entrada (fade + subida) va en este botón y el hover en la capa de
    // adentro, para que la demora de entrada no frene el hover.
    <button
      type="button"
      onClick={onClick}
      aria-label={`${value} ${label} ${sublabel}`}
      className={`group block w-full text-center rounded-2xl transition-[opacity,transform] duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: visible ? `${enterDelay}ms` : '0ms' }}
    >
    <div className="relative h-full bg-white/10 sm:bg-white/5 backdrop-blur-[2px] rounded-2xl p-3 sm:p-4 flex flex-col items-center border border-white/15 sm:border-white/10 transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/20 group-hover:bg-white/15 group-hover:border-white/40 group-active:scale-[0.97]">
      {/* Flechita en la esquina: avisa que la tarjeta se puede tocar. */}
      <ArrowUpRight
        aria-hidden="true"
        className="absolute top-2 right-2 w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
      />
      {/* Ícono con anillo de progreso: se llena en sincronía con el conteo */}
      <div className="relative w-10 h-10 mb-2">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r={RING_RADIUS} fill="none" strokeWidth="3" className="stroke-white/15" />
          <circle
            cx="20"
            cy="20"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            className={color}
            style={{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* La primera vez cuenta de 0 al total (el "pop" espera al conteo). Las
          siguientes veces que la sección aparece, el número ya está en su valor
          final y sólo repite el "pop". `key={popTick}` fuerza que la animación
          vuelva a reproducirse. */}
      <div
        key={popTick}
        className={`font-heading font-extrabold text-3xl sm:text-5xl ${color} leading-none mb-1 tracking-tight tabular-nums ${
          start ? 'animate-stat-pop' : ''
        }`}
        style={start ? { animationDelay: popTick === 0 ? `${duration}ms` : '0ms' } : undefined}
      >
        {display}
      </div>
      <div className="font-heading font-bold text-xs sm:text-sm text-white leading-tight">{label}</div>
      <div className="text-[0.625rem] sm:text-xs text-[#D6E9F7]/80 mt-0.5">{sublabel}</div>

      {/* Mini gráfico de barras: crece apenas arranca la animación, como
          adelanto visual antes de que el número empiece a subir. */}
      <MiniGrowthChart start={start} hex={hex} duration={duration} />
    </div>
    </button>
  );
}

export default function StatsSection({ onNavigate = () => {} }) {
  const { t } = useLanguage();
  // La sección va siempre sobre el mismo degradado azul del Hero (es su
  // continuación, ver Brochure.jsx), en los dos temas: números en blanco y
  // celeste.
  const blancoHex = '#FFFFFF';
  const [alianzasOpen, setAlianzasOpen] = useState(false);
  const stats = [
    {
      id: 'proyectos',
      // Las tres cifras salen de la base de proyectos con evidencia
      // (proyectosData.js), así siempre coinciden con Proyectos y Presencia.
      value: PROYECTOS_AT.length,
      color: 'text-white',
      hex: blancoHex,
      icon: Briefcase,
      onClick: () => onNavigate('proyectos')
    },
    {
      id: 'clientes',
      value: totalAliados,
      color: 'text-[#7dd3fc]',
      hex: '#7dd3fc',
      icon: Handshake,
      // Abre la ventana de Alianzas estratégicas (antes la sección de
      // Organismos y Socios debajo de las Cifras).
      onClick: () => setAlianzasOpen(true)
    },
    {
      id: 'paises',
      value: paisesAtendidos,
      color: 'text-white',
      hex: blancoHex,
      icon: Globe2,
      onClick: () => onNavigate('presencia')
    }
  ];

  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false); // aparece la tarjeta (fade + subida), cada vez
  const [started, setStarted] = useState(false); // arranca el conteo — solo la primera vez, nunca se resetea
  const [popTick, setPopTick] = useState(0); // de la segunda vez en adelante, solo repite el "boop" final
  const hasCountedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    // El IntersectionObserver sale del `window` dueño del documento de `el`
    // (no del global): dentro del iframe de "Vista Móvil" el observer de
    // afuera no puede observar nodos del documento de adentro.
    const view = el.ownerDocument?.defaultView;
    const IO = view?.IntersectionObserver;
    let delayId;

    if (!IO) {
      // Sin soporte disponible: arrancamos directo en vez de dejar los
      // números en 0 para siempre.
      setVisible(true);
      setStarted(true);
      hasCountedRef.current = true;
      return undefined;
    }

    const observer = new IO(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (!hasCountedRef.current) {
              // Primera vez: conteo completo con medio segundo de respiro antes de
              // arrancar, para que la sección aparezca primero.
              delayId = setTimeout(() => {
                setStarted(true);
                hasCountedRef.current = true;
              }, 500);
            } else {
              // Ya contó una vez: sólo repite el "pop" final del número.
              setPopTick((n) => n + 1);
            }
          } else {
            // Sale de pantalla: la tarjeta se resetea (fade + subida) para volver a
            // aparecer, pero el conteo ya hecho no se toca.
            if (delayId) clearTimeout(delayId);
            setVisible(false);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (delayId) clearTimeout(delayId);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative px-4 sm:px-6 pt-6 pb-12 sm:pt-10 sm:pb-16 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-1 sm:mb-1.5">
          <KickerBadge variant="glow" onDark>{t.stats.kicker}</KickerBadge>
        </div>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
          {t.stats.title}
        </h2>
        <div className="inline-block px-2.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[#D6E9F7] text-[0.5625rem] sm:text-[0.625rem] font-mono-code font-bold tracking-wider uppercase mb-8">
          {t.stats.badge}
        </div>

        {/* 3-Column Mobile & Desktop Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-lg sm:max-w-3xl mx-auto">
          {stats.map((item, idx) => (
            <StatCard
              key={idx}
              icon={item.icon}
              value={item.value}
              label={t.stats.items[item.id].label}
              sublabel={t.stats.items[item.id].sublabel}
              color={item.color}
              hex={item.hex}
              visible={visible}
              start={started}
              popTick={popTick}
              // Misma duración para las 3 tarjetas: el "pop" final de los 3 números
              // (y sus anillos/gráficos) aterriza al mismo tiempo. Sólo la entrada
              // (enterDelay) va escalonada.
              duration={STAT_COUNT_DURATION}
              enterDelay={idx * 120}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>

      <AlliancesSheet isOpen={alianzasOpen} onClose={() => setAlianzasOpen(false)} onNavigate={onNavigate} />
    </section>
  );
}

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
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
 * Ventana de Alianzas estratégicas (antes la sección "Organismos y Socios
 * de Cooperación" debajo de las Cifras). Se abre desde la tarjeta de
 * Aliados de StatsSection.jsx: muestra la cuadrícula de organismos y, al
 * tocar uno, su ficha con los proyectos en la misma hoja (con botón para
 * volver a la lista).
 *
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

export default function AlliancesSheet({ isOpen, onClose, onNavigate }) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);
  // Mismos datos (id, logo) con el nombre y la etiqueta traducidos según
  // el idioma activo, tomados de translations.js por id.
  const alliesT = ALLIES.map((a) => ({
    ...a,
    ...t.allies.items[a.id],
    proyectos: proyectosDeSocio(a.id)
  }));
  const selected = alliesT.find((a) => a.id === selectedId) || null;

  const cerrar = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={cerrar}
      title={selected ? selected.name : t.allies.title}
      subtitle={selected ? t.allies.modalSubtitle : t.allies.kicker}
      icon={selected && <AllyIconBadge ally={selected} size="w-8 h-8" textSize="text-xs" />}
      maxWidth="max-w-2xl"
    >
      {selected ? (
        <div key={selected.id} className="animate-fade-in">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#0077C8] hover:text-[#005FA3] dark:hover:text-[#7dd3fc] transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            {t.allies.back}
          </button>
          {selected.label && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 -mt-1">{selected.label}</p>
          )}
          <AllyDetailBody ally={selected} onNavigate={onNavigate} />
        </div>
      ) : (
        <div className="animate-fade-in">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">{t.allies.subtitle}</p>
          {/* Todas las tarjetas miden lo mismo. Hover chiquito: sube un
              poquito, crece apenas y se marca el borde. */}
          <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
            {alliesT.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="w-full h-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-left group transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md hover:border-[#0077C8]/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077C8]"
                >
                  <span className="rounded-lg ring-1 ring-slate-200 dark:ring-white/10 shrink-0">
                    <AllyIconBadge ally={item} size="w-11 h-11" textSize="text-sm" />
                  </span>
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="font-heading font-bold text-sm text-[#003366] dark:text-white truncate">{item.name}</span>
                    <span className="text-[0.6875rem] text-slate-500 dark:text-slate-300 line-clamp-2 leading-snug" title={item.label}>
                      {item.label}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-[0.625rem] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex gap-0.5">
                        {[...new Set(item.proyectos.flatMap((p) => p.etiquetas))].slice(0, 5).map((id) => (
                          <span key={id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEtiqueta(id).color }} />
                        ))}
                      </span>
                      {t.specializationAreas.projectsSuffix(item.proyectos.length)}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-white/30 group-hover:text-[#0077C8] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BottomSheet>
  );
}

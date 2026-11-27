import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Hero from './sections/Hero';
import MissionVision from './sections/MissionVision';
import ValuesWheel from './sections/ValuesWheel';
import StatsSection from './sections/StatsSection';
import SpecializationAreas from './sections/SpecializationAreas';
import AuthoritiesSection from './sections/AuthoritiesSection';
import RegionalMap from './sections/RegionalMap';
import ProyectosAT from './sections/ProyectosAT';
import ContactSection from './sections/ContactSection';
import DocenciaMision from './sections/DocenciaMision';
import DocenciaImpacto from './sections/DocenciaImpacto';
import DocenciaInvestigacion from './sections/DocenciaInvestigacion';
import DocenciaPublicaciones from './sections/DocenciaPublicaciones';
import DocenciaAreasWheel from './sections/DocenciaAreasWheel';
import BottomSheet from './components/BottomSheet';
import {
  Globe2,
  Award,
  History,
  Building2,
  ExternalLink,
  Smartphone,
  Monitor,
  Globe,
  Sun,
  Moon,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { defaultContact } from './components/VCardDownload';
import { PAGES, DOCENCIA_PAGES } from './data/navigation';
import { useLanguage } from './i18n/LanguageContext';
import { useTheme } from './theme/ThemeContext';
import icapLogoMark from './assets/icap-logo-mark.png';

// Links de entrada (p. ej. desde la página oficial del ICAP):
//   <base>            → arranca en Asistencia Técnica (el Hero principal)
//   <base>docencia/   → arranca en Docencia
// Es el mismo brochure con el switch de siempre: sólo cambia el
// departamento inicial. En el build, vite.config.js copia index.html a
// docencia/index.html para que GitHub Pages sirva esa ruta.
const BASE = import.meta.env.BASE_URL; // '/ICAP-vCard/'
const DOCENCIA_PATH = `${BASE}docencia/`;
// Secciones que se ajustan a la pantalla sin scroll (ver "Ajuste a
// pantalla" dentro del componente).
const FIT_PAGES = new Set([
  'mision',
  'valores',
  'autoridades',
  'areas',
  'presencia',
  'contacto',
  'docenciaImpacto',
  'docenciaInvestigacion'
]);
const FIT_MIN_WIDTH = 768;
// Piso del achicado: por debajo de esto la letra se ve demasiado chica y es
// preferible el tamaño normal con scroll.
const FIT_MIN_ZOOM = 0.85;

const startsInDocencia = () => /\/docencia\/?$/.test(window.location.pathname);

export default function Brochure({
  contact = defaultContact,
  viewMode = 'full',
  onSetViewMode = () => {}
}) {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [activePage, setActivePage] = useState('inicio');
  const mainRef = useRef(null);

  // --- Departamento activo: Asistencia Técnica / Docencia --------------
  // Comparten Hero, Autoridades y Contacto (mismos ids en PAGES y
  // DOCENCIA_PAGES); el resto de subsecciones son propias de cada uno.
  const [activeDept, setActiveDept] = useState(() => (startsInDocencia() ? 'docencia' : 'at'));
  const activePages = activeDept === 'at' ? PAGES : DOCENCIA_PAGES;

  // Al cambiar de departamento siempre se vuelve al inicio del Hero (el
  // scroll lo resetea el efecto de abajo, que también escucha activeDept).
  const switchDept = (dept) => {
    if (dept === activeDept) return;
    setActiveDept(dept);
    setFiltroProyectos(null);
    setActivePage('inicio');
    // La dirección del navegador acompaña al switch, así recargar o
    // compartir el link abre en el departamento que se está viendo. Va
    // después de descartar el historial de "volver" (que retrocede en el
    // history), para que el cambio de dirección quede en la entrada final.
    olvidarHistorial(() => {
      try {
        const path = dept === 'docencia' ? DOCENCIA_PATH : BASE;
        if (window.location.pathname !== path) {
          window.history.replaceState(null, '', path + window.location.search + window.location.hash);
        }
      } catch {
        // Sin acceso al history: el switch funciona igual.
      }
    });
  };

  // --- Menú de configuración (engranaje): vista, idioma y tema ---------
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  // `filtro` sólo lo usa Proyectos: las secciones de Áreas, Presencia y
  // Socios mandan ahí con la etiqueta, el país o el socio ya elegido (ver
  // ProyectosAT.jsx). Navegar desde el menú lo deja vacío.
  const [filtroProyectos, setFiltroProyectos] = useState(null);
  // `estadoPagina`: lo que una sección necesita para quedar como estaba al
  // volver atrás (p. ej. el área abierta en Áreas). Sólo lo pone volver.
  const [estadoPagina, setEstadoPagina] = useState(null);
  const goToPage = (id, filtro = null) => {
    setFiltroProyectos(filtro);
    setEstadoPagina(null);
    setActivePage(id);
  };

  // --- Volver atrás ------------------------------------------------------
  // Cuando se llega a una sección tocando algo del contenido (una tarjeta
  // de Cifras, un área, un país, un socio) y no el menú, se guarda de dónde
  // se venía (sección, filtro y scroll) para poder volver: en la compu con
  // la flechita de arriba a la izquierda y en celulares y tablets
  // deslizando desde el borde izquierdo. Cada paso también se apunta en el
  // history del navegador, así el botón "atrás" del navegador o del
  // teléfono hace lo mismo en vez de sacarlo a uno de la página. Navegar
  // con el menú (o cambiar de departamento) descarta el historial.
  const historialRef = useRef([]); // [{ page, filtro, scroll, estado }]
  const [volverA, setVolverA] = useState(null); // sección a la que se vuelve
  const restaurarScrollRef = useRef(null);
  const popIgnoradoRef = useRef(null); // { despues } mientras se descarta el history

  // `estado`: lo que la sección de origen quiere recuperar al volver.
  const irDesdeContenido = (id, filtro = null, estado = null) => {
    historialRef.current.push({ page: activePage, filtro: filtroProyectos, scroll: mainRef.current?.scrollTop || 0, estado });
    setVolverA(activePage);
    try {
      window.history.pushState({ icapVolver: historialRef.current.length }, '');
    } catch {
      // Sin history: la flechita y el deslizar funcionan igual (ver volver).
    }
    goToPage(id, filtro);
  };

  const aplicarVolver = () => {
    const anterior = historialRef.current.pop();
    if (!anterior) return;
    const pila = historialRef.current;
    setVolverA(pila.length ? pila[pila.length - 1].page : null);
    restaurarScrollRef.current = anterior.scroll;
    setFiltroProyectos(anterior.filtro);
    setEstadoPagina(anterior.estado || null);
    setActivePage(anterior.page);
  };

  const volver = () => {
    if (!historialRef.current.length) return;
    try {
      window.history.back(); // el popstate de abajo llama a aplicarVolver
    } catch {
      aplicarVolver();
    }
  };

  // Descarta el historial y saca del history del navegador los pasos que
  // se habían apuntado. `despues` corre cuando el navegador terminó de
  // retroceder (o enseguida, si no había nada que descartar).
  const olvidarHistorial = (despues = () => {}) => {
    const n = historialRef.current.length;
    historialRef.current = [];
    setVolverA(null);
    if (!n) {
      despues();
      return;
    }
    popIgnoradoRef.current = { despues };
    try {
      window.history.go(-n);
    } catch {
      popIgnoradoRef.current = null;
      despues();
    }
  };

  useEffect(() => {
    const onPop = () => {
      if (popIgnoradoRef.current) {
        const { despues } = popIgnoradoRef.current;
        popIgnoradoRef.current = null;
        despues();
        return;
      }
      aplicarVolver();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Navegar con el menú (inferior o del encabezado).
  const irDesdeMenu = (id) => {
    olvidarHistorial();
    goToPage(id);
  };

  // Deslizar desde el borde izquierdo hacia la derecha = volver (pantallas
  // táctiles). `arrastreVolver` (0-1) mueve la flecha que va asomando.
  const BORDE_VOLVER = 28; // px desde el borde izquierdo donde arranca el gesto
  const DISTANCIA_VOLVER = 80; // px que hay que deslizar para volver
  const gestoRef = useRef(null);
  const [arrastreVolver, setArrastreVolver] = useState(0);

  const alTocarInicio = (e) => {
    if (!volverA || e.touches.length !== 1) return;
    const toque = e.touches[0];
    if (toque.clientX > BORDE_VOLVER) return;
    gestoRef.current = { x0: toque.clientX, y0: toque.clientY, dx: 0, horizontal: null };
  };
  const alTocarMover = (e) => {
    const g = gestoRef.current;
    if (!g) return;
    const toque = e.touches[0];
    const dx = toque.clientX - g.x0;
    const dy = toque.clientY - g.y0;
    if (g.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      g.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!g.horizontal) {
        gestoRef.current = null; // era un scroll vertical
        return;
      }
    }
    if (!g.horizontal) return;
    g.dx = Math.max(0, dx);
    setArrastreVolver(Math.min(1, g.dx / DISTANCIA_VOLVER));
  };
  const alTocarFin = () => {
    const g = gestoRef.current;
    gestoRef.current = null;
    setArrastreVolver(0);
    if (g?.horizontal && g.dx >= DISTANCIA_VOLVER) volver();
  };

  // Al cambiar de sección se arranca arriba, salvo al volver atrás: ahí se
  // regresa al mismo punto del scroll donde se estaba.
  useEffect(() => {
    const top = restaurarScrollRef.current ?? 0;
    restaurarScrollRef.current = null;
    if (mainRef.current) {
      mainRef.current.scrollTo({ top, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    }
  }, [activePage, activeDept]);

  // Alto visible del <main> (entre el header y el menú inferior) en la
  // variable --main-h: el Hero la usa para ocupar justo una pantalla, sea
  // cual sea el dispositivo (también dentro del iframe de Vista Móvil).
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const update = () => main.style.setProperty('--main-h', `${main.clientHeight}px`);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(main);
    return () => ro.disconnect();
  }, []);

  // --- Ajuste a pantalla ------------------------------------------------
  // En pantallas de tablet grande o compu (≥ 768px de ancho), las secciones
  // que "casi" caben se achican con `zoom` para verse completas sin scroll,
  // como si se alejara el zoom del navegador. Si haría falta achicar más
  // de FIT_MIN_ZOOM se deja el tamaño normal y el scroll de siempre.
  // Inicio, Proyectos y las secciones con animaciones atadas al scroll
  // (Formación, Publicaciones, Áreas+Comunidad) quedan fuera a propósito.
  const pageRef = useRef(null);
  const fitPage = FIT_PAGES.has(activePage);

  useLayoutEffect(() => {
    const main = mainRef.current;
    const page = pageRef.current;
    if (!main || !page) return undefined;
    if (!fitPage) {
      page.style.zoom = '';
      return undefined;
    }

    let frame = 0;
    const fit = () => {
      page.style.zoom = '';
      const available = main.clientHeight;
      if (main.clientWidth < FIT_MIN_WIDTH) return;
      let z = 1;
      // Al achicar, el contenido gana ancho y puede reacomodarse (quedar
      // más bajo), así que se afina en un par de pasadas.
      for (let i = 0; i < 3; i += 1) {
        const h = page.getBoundingClientRect().height;
        if (h <= available + 1) break;
        z = Math.max(FIT_MIN_ZOOM, (z * available) / h);
        page.style.zoom = String(z);
        if (z === FIT_MIN_ZOOM) break;
      }
      if (page.getBoundingClientRect().height > available + 1) page.style.zoom = '';
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    // Fuentes e imágenes pueden cambiar el alto después del primer render.
    const late = setTimeout(schedule, 400);
    if (document.fonts?.ready) document.fonts.ready.then(schedule).catch(() => {});
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(late);
      window.removeEventListener('resize', schedule);
    };
  }, [activePage, activeDept, fitPage, lang]);

  // --- Esfera animada del menú inferior --------------------------------
  // Un solo "blob" que se mide contra el botón activo y se traslada hasta
  // él con una curva de resorte.
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [orb, setOrb] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [orbReady, setOrbReady] = useState(false);

  // --- Llamado de atención del menú inferior ----------------------------
  // En el celular el menú de abajo pasaba desapercibido: al entrar a la
  // página da un saltito y los íconos brincan en ola (.nav-llamado en
  // global.css, sólo < 768px). Se quita al terminar para que no se repita
  // con los botones nuevos al cambiar de departamento.
  const [navLlamado, setNavLlamado] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setNavLlamado(false), 3200);
    return () => clearTimeout(id);
  }, []);

  const measureOrb = () => {
    const nav = navRef.current;
    const btn = itemRefs.current[activePage];
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setOrb({
      left: btnRect.left - navRect.left,
      top: btnRect.top - navRect.top,
      width: btnRect.width,
      height: btnRect.height
    });
  };

  useLayoutEffect(() => {
    measureOrb();
    if (!orbReady) {
      // Coloca la esfera de una vez en su sitio antes de activar la
      // transición, para que no "viaje" desde la esquina en el montaje.
      const id = requestAnimationFrame(() => setOrbReady(true));
      return () => cancelAnimationFrame(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, activePages]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measureOrb());
    ro.observe(nav);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Menú sólo con íconos ----------------------------------------------
  // Si algún nombre no cabe en el ancho de su botón (pantallas angostas o
  // nombres largos en inglés), se esconden todos los nombres y quedan sólo
  // los íconos. Los nombres siguen en el DOM (sr-only) para lectores de
  // pantalla, y scrollWidth da su ancho natural igual, así se puede volver
  // a medir al agrandar la pantalla.
  const labelRefs = useRef({});
  const [soloIconos, setSoloIconos] = useState(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const medir = () => {
      const noCabe = activePages.some(({ id }) => {
        const btn = itemRefs.current[id];
        const label = labelRefs.current[id];
        return btn && label && label.scrollWidth + 6 > btn.clientWidth;
      });
      setSoloIconos(noCabe);
    };
    medir();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(medir);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activePages, lang]);

  const renderPage = () => {
    switch (activePage) {
      case 'inicio':
        return (
          <>
            {/* En AT el Hero (`continuo`, sin fondo propio) y las Cifras
                comparten un solo degradado, para que se lean como una sola
                sección larga y no como dos. */}
            {activeDept === 'at' ? (
              <div className="bg-[linear-gradient(165deg,#003366_0%,#0B5A96_30%,#0077C8_56%,#0B5A96_80%,#003366_100%)]">
                <Hero dept={activeDept} continuo />
                <StatsSection onNavigate={irDesdeContenido} />
              </div>
            ) : (
              <Hero dept={activeDept} />
            )}
            {/* Debajo del Hero: AT muestra Cifras (sus tarjetas llevan a
                Proyectos, Presencia y la ventana de Alianzas); Docencia, el
                texto de Formación sin el carrusel de cards (showCards en
                DocenciaMision.jsx). */}
            {activeDept !== 'at' && <DocenciaMision showCards={false} />}
          </>
        );
      case 'mision':
        return <MissionVision />;
      case 'valores':
        return <ValuesWheel />;
      case 'autoridades':
        return <AuthoritiesSection dept={activeDept} />;
      case 'areas':
        return <SpecializationAreas onNavigate={irDesdeContenido} estadoInicial={estadoPagina} />;
      case 'presencia':
        return <RegionalMap onNavigate={irDesdeContenido} />;
      case 'proyectos':
        return <ProyectosAT filtroInicial={filtroProyectos} />;
      case 'contacto':
        return <ContactSection id="propuesta1-contact" contact={contact} dept={activeDept} />;
      // --- Subsecciones propias de Docencia ---------------------------
      // "Formación" va sin la intro, que ya está bajo el Hero (showIntro).
      case 'docenciaMision':
        return <DocenciaMision showIntro={false} />;
      case 'docenciaImpacto':
        return <DocenciaImpacto />;
      case 'docenciaInvestigacion':
        return <DocenciaInvestigacion />;
      case 'docenciaPublicaciones':
        return <DocenciaPublicaciones />;
      // "Áreas" incluye también el cierre de "Comunidad" (DocenciaAreasWheel.jsx).
      case 'docenciaAreas':
        return <DocenciaAreasWheel />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full h-dvh bg-[#D6E9F7] dark:bg-[#001F3D] text-slate-900 dark:text-white font-sans relative flex flex-col overflow-hidden ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Sticky Utility Navbar */}
      <header className="shrink-0 z-40 bg-gradient-to-br from-[#003366]/95 via-[#0B5A96]/95 to-[#0077C8]/95 dark:bg-none dark:bg-[#003366]/95 backdrop-blur-md border-b border-white/10 px-3 min-[380px]:px-4 sm:px-6 py-3 flex items-center gap-2 shadow-sm">
        <button
          onClick={() => irDesdeMenu('inicio')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          title={t.header.home}
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 ring-1 ring-white/40 shadow-sm transition-transform group-hover:scale-105">
            <img
              src={icapLogoMark}
              alt="Isotipo ICAP"
              className="w-[68%] h-[68%] object-contain"
              draggable={false}
            />
          </div>
          {/* En celulares muy angostos (< 380px) la palabra se esconde y queda
              el isotipo, para que el engranaje no se salga por la derecha. */}
          <span className="font-heading font-extrabold text-white text-sm sm:text-base tracking-wider max-[379px]:hidden">
            ICAP
          </span>
          <span className="hidden sm:inline-block text-[0.6875rem] font-mono-code text-[#9FC6E8] border-l border-white/20 pl-2 ml-1">
            {t.header.subtitle}
          </span>
        </button>

        {/* Selector de departamento en desktop (md+). En móvil va en su propia
            fila, debajo del header. */}
        <div className="hidden md:flex flex-1 justify-center px-2">
          <div className="flex items-center bg-black/30 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => switchDept('at')}
              aria-pressed={activeDept === 'at'}
              className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold tracking-wide whitespace-nowrap transition-all ${
                activeDept === 'at'
                  ? 'bg-[#0077C8] text-white shadow'
                  : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
              }`}
            >
              {t.header.deptAT}
            </button>
            <button
              onClick={() => switchDept('docencia')}
              aria-pressed={activeDept === 'docencia'}
              className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold tracking-wide whitespace-nowrap transition-all ${
                activeDept === 'docencia'
                  ? 'bg-[#0077C8] text-white shadow'
                  : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
              }`}
            >
              {t.header.deptDocencia}
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setAboutModalOpen(true)}
            className="text-xs font-heading font-semibold text-[#EAF3FB] hover:text-white whitespace-nowrap px-2 min-[380px]:px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.header.about}
          </button>
          <button
            onClick={() => irDesdeMenu('contacto')}
            className="h-8 whitespace-nowrap px-3 min-[380px]:px-3.5 sm:px-4 rounded-xl bg-black/30 hover:bg-white/10 border border-white/10 text-white font-heading font-bold text-xs tracking-wider uppercase shadow transition-all active:scale-95 shrink-0"
          >
            {t.header.contact}
          </button>

          {/* Engranaje de configuración: último control a la derecha. */}
          <div className="relative shrink-0" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((prev) => !prev)}
              title={t.header.settings}
              aria-expanded={settingsOpen}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 shrink-0 transition-all cursor-pointer ${
                settingsOpen
                  ? 'bg-[#0077C8] text-white'
                  : 'bg-black/30 hover:bg-white/10 text-[#9FC6E8] hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-xl bg-[#00203E] border border-white/10 shadow-2xl p-3 animate-fade-in">
                {/* Vista */}
                <div className="mb-3">
                  <span className="block text-[0.625rem] font-mono-code font-bold uppercase tracking-wider text-[#9FC6E8]/70 mb-1.5">
                    {t.header.settingsView}
                  </span>
                  <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => onSetViewMode('full')}
                      aria-pressed={viewMode === 'full'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        viewMode === 'full'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      {t.header.viewFullShort}
                    </button>
                    <button
                      onClick={() => onSetViewMode('mobile')}
                      aria-pressed={viewMode === 'mobile'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        viewMode === 'mobile'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {t.header.viewMobileShort}
                    </button>
                  </div>
                </div>

                {/* Idioma */}
                <div className="mb-3">
                  <span className="block text-[0.625rem] font-mono-code font-bold uppercase tracking-wider text-[#9FC6E8]/70 mb-1.5">
                    {t.header.settingsLanguage}
                  </span>
                  <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setLang('es')}
                      aria-pressed={lang === 'es'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        lang === 'es'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      ES
                    </button>
                    <button
                      onClick={() => setLang('en')}
                      aria-pressed={lang === 'en'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        lang === 'en'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      EN
                    </button>
                  </div>
                </div>

                {/* Tema */}
                <div>
                  <span className="block text-[0.625rem] font-mono-code font-bold uppercase tracking-wider text-[#9FC6E8]/70 mb-1.5">
                    {t.header.settingsTheme}
                  </span>
                  <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setTheme('light')}
                      aria-pressed={theme === 'light'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        theme === 'light'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      {t.header.themeLight}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      aria-pressed={theme === 'dark'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6875rem] font-heading font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-[#0077C8] text-white shadow'
                          : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      {t.header.themeDark}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Selector de departamento en móvil: fila propia bajo el header, con
          el mismo degradado. */}
      <div className="md:hidden shrink-0 z-30 bg-gradient-to-br from-[#003366]/95 via-[#0B5A96]/95 to-[#0077C8]/95 dark:bg-none dark:bg-[#003366]/95 border-b border-white/10 px-3 py-2">
        <div className="flex items-center bg-black/30 p-0.5 rounded-xl border border-white/10 w-full">
          <button
            onClick={() => switchDept('at')}
            aria-pressed={activeDept === 'at'}
            className={`flex-1 py-1.5 rounded-lg text-[0.6875rem] sm:text-xs font-heading font-bold tracking-wide transition-all ${
              activeDept === 'at'
                ? 'bg-[#0077C8] text-white shadow'
                : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
            }`}
          >
            {t.header.deptAT}
          </button>
          <button
            onClick={() => switchDept('docencia')}
            aria-pressed={activeDept === 'docencia'}
            className={`flex-1 py-1.5 rounded-lg text-[0.6875rem] sm:text-xs font-heading font-bold tracking-wide transition-all ${
              activeDept === 'docencia'
                ? 'bg-[#0077C8] text-white shadow'
                : 'text-[#9FC6E8] hover:text-white hover:bg-white/10'
            }`}
          >
            {t.header.deptDocencia}
          </button>
        </div>
      </div>

      {/* Active Page */}
      <div
        className="relative flex-1 min-h-0 flex flex-col"
        onTouchStart={alTocarInicio}
        onTouchMove={alTocarMover}
        onTouchEnd={alTocarFin}
        onTouchCancel={alTocarFin}
      >
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div ref={pageRef} key={`${activeDept}-${activePage}`} className="animate-page-in">
            {renderPage()}
          </div>
        </main>

        {/* Volver con mouse (compu): flechita arriba a la izquierda, debajo
            del encabezado. Sólo se muestra con mouse (.volver-boton en
            global.css); en pantallas táctiles se vuelve deslizando. */}
        {volverA && (
          <button
            type="button"
            key={volverA}
            onClick={volver}
            title={`${t.common.back}: ${t.nav[volverA]}`}
            className="volver-boton hidden absolute top-3 left-3 sm:top-4 sm:left-4 z-20 items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full bg-white/95 dark:bg-[#003366]/95 backdrop-blur-md border border-slate-200 dark:border-white/15 shadow-lg shadow-black/15 text-[#003366] dark:text-white text-xs font-heading font-bold group hover:border-[#0077C8]/50 transition-colors animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 text-[#0077C8] dark:text-[#7dd3fc] transition-transform group-hover:-translate-x-0.5" />
            <span>
              {t.common.back}
              <span className="font-semibold text-slate-500 dark:text-[#9FC6E8]"> · {t.nav[volverA]}</span>
            </span>
          </button>
        )}

        {/* Volver táctil: una flecha asoma un momento en el borde izquierdo
            al llegar a la sección, para enseñar el gesto, y sigue al dedo
            mientras se desliza (.volver-borde en global.css). */}
        {volverA && (
          <div aria-hidden="true" className="volver-borde pointer-events-none absolute left-0 top-1/2 z-20 -translate-y-1/2">
            <div
              key={volverA}
              className={arrastreVolver ? 'volver-arrastre' : 'volver-asomo'}
              style={
                arrastreVolver
                  ? { transform: `translateX(${-36 + arrastreVolver * 52}px)`, opacity: 0.35 + arrastreVolver * 0.65 }
                  : undefined
              }
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-black/20 border transition-colors ${
                  arrastreVolver >= 1
                    ? 'bg-[#0077C8] border-[#0077C8] text-white'
                    : 'bg-white/95 dark:bg-[#003366]/95 border-slate-200 dark:border-white/15 text-[#0077C8] dark:text-[#7dd3fc]'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom App Navigation */}
      <nav
        ref={navRef}
        className={`${navLlamado ? 'nav-llamado ' : ''}shrink-0 z-30 bg-white dark:bg-[#003366]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_16px_rgba(0,51,102,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-stretch justify-between relative`}
      >
        {/* Esfera animada del menú: un wrapper de posición (transición de
            traslado) que envuelve el halo pulsante y la esfera principal,
            para que ambos viajen juntos hacia el botón activo. */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none z-0"
          style={{
            left: 0,
            top: 0,
            width: orb.width,
            height: orb.height,
            transform: `translate(${orb.left}px, ${orb.top}px)`,
            transition: orbReady
              ? 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease'
              : 'none'
          }}
        >
          {/* Halo suave, le da profundidad y un ligero pulso */}
          <div
            className="absolute inset-0 rounded-full blur-md animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, #0077C8 0%, rgba(0,119,200,0) 72%)' }}
          />
          {/* Esfera principal */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 28%, #4FB2F2 0%, #0077C8 55%, #003366 100%)',
              boxShadow: '0 8px 18px -3px rgba(0,51,102,0.5), inset 0 1px 3px rgba(255,255,255,0.4)'
            }}
          />
        </div>
        {activePages.map((page, i) => {
          const Icon = page.icon;
          const active = activePage === page.id;
          return (
            <button
              key={page.id}
              ref={(el) => {
                itemRefs.current[page.id] = el;
              }}
              onClick={() => irDesdeMenu(page.id)}
              title={soloIconos ? t.nav[page.id] : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors relative z-10 ${
                soloIconos ? 'py-2.5' : 'py-1.5'
              }`}
            >
              <Icon
                style={{ '--i': i }}
                className={`nav-llamado-item w-[19px] h-[19px] transition-all duration-300 ${
                  active ? 'text-white scale-110' : 'text-slate-400'
                }`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                ref={(el) => {
                  labelRefs.current[page.id] = el;
                }}
                className={`text-[0.5625rem] font-heading tracking-wide whitespace-nowrap transition-colors duration-300 ${
                  active ? 'text-white font-bold' : 'text-slate-400 font-semibold'
                } ${soloIconos ? 'sr-only' : ''}`}
              >
                {t.nav[page.id]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* About ICAP Bottom Sheet for Mobile & Modal for Desktop */}
      <BottomSheet
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title={t.aboutModal.title}
        subtitle={t.aboutModal.subtitle}
        icon={
          <div className="w-8 h-8 rounded-lg bg-[#003366] text-[#0077C8] flex items-center justify-center font-heading font-extrabold text-xs">
            SICA
          </div>
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
          {/* Frase institucional (antes en el Hero) */}
          <p className="pl-3 border-l-[3px] border-[#0077C8] font-heading font-semibold text-sm sm:text-base text-[#003366] dark:text-[#9FC6E8] leading-snug">
            {t.aboutModal.tagline}
          </p>
          <p>
            {t.aboutModal.intro}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 my-4">
            {[History, Award, Globe2, Building2].map((Icon, i) => {
              const card = t.aboutModal.cards[i];
              return (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-start gap-3">
                  <Icon className="w-5 h-5 text-[#0077C8] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-bold text-xs uppercase text-slate-800 dark:text-[#9FC6E8] mb-0.5">
                      {card.title}
                    </h4>
                    <p className="text-[0.6875rem] sm:text-xs text-slate-700 dark:text-slate-300">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p>
            {t.aboutModal.outro}
          </p>

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href="https://icap.ac.cr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0077C8] hover:text-[#0077C8] transition-colors uppercase font-heading"
            >
              <span>{t.aboutModal.visitLink}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setAboutModalOpen(false)}
              className="w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-[#003366] hover:bg-[#001F3D] text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow"
            >
              {t.aboutModal.close}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

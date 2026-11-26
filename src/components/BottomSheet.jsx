import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

const bloquearScroll = (body, bloquear) => {
  body.style.overflow = bloquear ? 'hidden' : '';
};

/**
 * Reusable Mobile Bottom Sheet & Desktop Modal component
 *
 * Se dibuja con un portal directo en el <body> del documento (el del
 * iframe en "Vista Móvil"), no dentro de la página: adentro quedaba por
 * debajo del encabezado y del menú inferior, que lo tapaban y hacían que
 * pareciera una página más en vez de una hoja encima de todo. Como el
 * portal queda fuera del contenedor que lleva la clase `dark`, la hoja la
 * repite según el tema.
 */
export default function BottomSheet({ isOpen, onClose, title, subtitle, icon, children, maxWidth = 'max-w-lg' }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  // Ancla invisible que siempre se renderiza, para saber en qué documento
  // está la sección (ventana grande o iframe) y abrir el portal ahí.
  const anclaRef = useRef(null);
  const [destino, setDestino] = useState(null);

  useLayoutEffect(() => {
    setDestino(anclaRef.current?.ownerDocument?.body || null);
  }, []);

  // Mientras está abierta, el fondo no scrollea.
  useEffect(() => {
    const body = anclaRef.current?.ownerDocument?.body;
    if (!body) return undefined;
    bloquearScroll(body, isOpen);
    return () => bloquearScroll(body, false);
  }, [isOpen]);

  const hoja = (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4 font-sans text-slate-900 dark:text-white">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sheet / Modal Container */}
        <div
          className={`relative z-10 w-full ${maxWidth} bg-white dark:bg-[#0B2340] rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[88dvh] sm:max-h-[90dvh] overflow-hidden animate-slide-up pb-[env(safe-area-inset-bottom)]`}
        >
          {/* Mobile Grab Handle */}
          <div className="pt-3 pb-1 flex justify-center sm:hidden cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 sm:pt-6 flex items-start justify-between border-b border-slate-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {subtitle && (
                  <span className="text-[0.625rem] sm:text-xs font-mono-code font-bold uppercase tracking-wider text-[#0077C8] block">
                    {subtitle}
                  </span>
                )}
                {title && (
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#003366] dark:text-[#9FC6E8] leading-tight">
                    {title}
                  </h3>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title={t.common.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto overscroll-contain flex-1">{children}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span ref={anclaRef} hidden />
      {isOpen && destino && createPortal(hoja, destino)}
    </>
  );
}

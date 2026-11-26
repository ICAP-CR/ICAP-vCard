import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'icap-vcard-lang';

/**
 * Lee el idioma guardado en localStorage (igual que el tema en
 * ThemeContext.jsx), así no vuelve al español al recargar la página. Si el
 * storage no está disponible, arranca en español.
 */
function getInitialLang() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // localStorage no disponible: seguimos con el valor por defecto.
  }
  return 'es';
}

/**
 * Idioma activo (es/en). Se monta una sola vez en App.jsx y también
 * llega al iframe de "Vista Móvil" a través del createPortal de
 * DeviceFrame.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Si no se puede guardar, el idioma vuelve al español en la próxima
      // visita; no es un error que deba interrumpir nada.
    }
  }, [lang]);

  const value = useMemo(() => {
    const toggleLang = () => setLang((prev) => (prev === 'es' ? 'en' : 'es'));
    return {
      lang,
      setLang,
      toggleLang,
      t: translations[lang]
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook de acceso: `const { lang, toggleLang, t } = useLanguage();`
 * Si por lo que sea se usa fuera del Provider (no debería pasar en
 * este proyecto), cae de vuelta al español en vez de tronar.
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { lang: 'es', setLang: () => {}, toggleLang: () => {}, t: translations.es };
  }
  return ctx;
}

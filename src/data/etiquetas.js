import {
  Store,
  Building2,
  TrendingUp,
  Landmark,
  Scale,
  Zap,
  Users,
  Leaf,
  Bus,
  Wheat,
  Stethoscope,
  Cpu,
  HeartHandshake,
  Globe,
  Tag
} from 'lucide-react';

/**
 * Las 14 etiquetas temáticas con que se clasifican los proyectos de
 * Asistencia Técnica (docs/Clasificacion_proyectos_ICAP.pdf, a partir del
 * Brochure Institucional 2026). Son también las Áreas de Especialización
 * (SpecializationAreas.jsx), así que esta es la fuente única de nombre,
 * color e ícono para Proyectos, Áreas, Presencia y Socios.
 *
 * El orden es el de la matriz del PDF. `text` es el color de texto que se
 * lee bien encima de `color` (para las cápsulas activas). `desc` es el texto
 * de la página del libro en Áreas (el mismo de la página web, biblioteca).
 */
export const ETIQUETAS = [
  { id: 'mipymes', color: '#F59E0B', text: '#2B1A00', icon: Store, es: 'MiPYMES', en: 'MSMEs',
    desc: { es: 'Programas, fondos e instrumentos para que las micro, pequeñas y medianas empresas crezcan y se formalicen.', en: 'Programs, funds and instruments that help micro, small and medium-sized enterprises grow and formalize.' } },
  { id: 'infraestructura', color: '#EA7A3B', text: '#FFFFFF', icon: Building2, es: 'Infraestructura', en: 'Infrastructure',
    desc: { es: 'Estudios y evaluación de obras públicas, puertos y servicios que sostienen el desarrollo de los territorios.', en: 'Studies and evaluation of public works, ports and services that sustain the development of each territory.' } },
  { id: 'economia', color: '#0E8C8A', text: '#FFFFFF', icon: TrendingUp, es: 'Economía y comercio', en: 'Economy and trade',
    desc: { es: 'Análisis económicos, pronósticos y cadenas de valor para decisiones públicas mejor informadas.', en: 'Economic analysis, forecasts and value chains for better-informed public decisions.' } },
  { id: 'politica', color: '#2563EB', text: '#FFFFFF', icon: Landmark, es: 'Política pública', en: 'Public policy',
    desc: { es: 'Diseño, regulación y evaluación de políticas públicas basadas en evidencia.', en: 'Design, regulation and evaluation of evidence-based public policy.' } },
  { id: 'genero', color: '#C64FB8', text: '#FFFFFF', icon: Scale, es: 'Igualdad y equidad de género', en: 'Gender equality and equity',
    desc: { es: 'Enfoque de igualdad en las instituciones, las políticas y los programas que llegan a la ciudadanía.', en: 'An equality lens for the institutions, policies and programs that reach citizens.' } },
  { id: 'energia', color: '#EAB308', text: '#2B2000', icon: Zap, es: 'Energía', en: 'Energy',
    desc: { es: 'Regulación, planificación y políticas del sector energético para una transición responsable.', en: 'Regulation, planning and policy for the energy sector and a responsible transition.' } },
  { id: 'transformacion', color: '#16337A', text: '#FFFFFF', icon: Users, es: 'Transformación organizacional', en: 'Organizational transformation',
    desc: { es: 'Planes estratégicos, rediseño de procesos y formación que dejan capacidades instaladas en las instituciones.', en: 'Strategic plans, process redesign and training that leave lasting capacity in institutions.' } },
  { id: 'ambiente', color: '#2FA84F', text: '#FFFFFF', icon: Leaf, es: 'Ambiente y cambio climático', en: 'Environment and climate change',
    desc: { es: 'Compras públicas sostenibles, gestión del riesgo y acción climática desde lo público.', en: 'Sustainable public procurement, risk management and climate action from the public sector.' } },
  { id: 'transporte', color: '#7C3AED', text: '#FFFFFF', icon: Bus, es: 'Transporte y movilidad', en: 'Transport and mobility',
    desc: { es: 'Modelos tarifarios, seguridad vial y planificación de la movilidad.', en: 'Fare models, road safety and mobility planning.' } },
  { id: 'alimentaria', color: '#A0612A', text: '#FFFFFF', icon: Wheat, es: 'Seguridad alimentaria y nutricional', en: 'Food and nutrition security',
    desc: { es: 'Desarrollo rural, nutrición y encadenamientos productivos para territorios más resilientes.', en: 'Rural development, nutrition and productive linkages for more resilient territories.' } },
  { id: 'salud', color: '#0EA5E9', text: '#FFFFFF', icon: Stethoscope, es: 'Salud', en: 'Health',
    desc: { es: 'Gestión de servicios de salud, planificación sanitaria y protección social.', en: 'Health services management, health planning and social protection.' } },
  { id: 'tecnologia', color: '#0F5D78', text: '#FFFFFF', icon: Cpu, es: 'Tecnología', en: 'Technology',
    desc: { es: 'Herramientas digitales y de visualización de datos para gestionar mejor lo público.', en: 'Digital and data-visualization tools for better public management.' } },
  { id: 'derechos', color: '#E11D48', text: '#FFFFFF', icon: HeartHandshake, es: 'Derechos humanos', en: 'Human rights',
    desc: { es: 'Niñez, adolescencia y poblaciones vulnerables en el centro de la acción institucional.', en: 'Children, adolescents and vulnerable populations at the center of institutional action.' } },
  { id: 'cooperacion', color: '#0070C0', text: '#FFFFFF', icon: Globe, es: 'Cooperación internacional', en: 'International cooperation',
    desc: { es: 'Proyectos con organismos internacionales y de integración regional.', en: 'Projects with international and regional integration organizations.' } }
];

const POR_ID = Object.fromEntries(ETIQUETAS.map((e) => [e.id, e]));

export const getEtiqueta = (id) =>
  POR_ID[id] || { id, color: '#64748B', text: '#FFFFFF', icon: Tag, es: id, en: id };

export const nombreEtiqueta = (id, lang) => getEtiqueta(id)[lang === 'en' ? 'en' : 'es'];

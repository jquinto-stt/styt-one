/**
 * Datos de demostración (ficticios) para las pantallas visuales de ST&T One.
 *
 * Personas, cuentas y proyectos salen del README de la iniciativa. Los textos de
 * políticas son de muestra: no representan políticas reales de ST&T.
 * Se sustituirán por datos del backend en los slices funcionales.
 */

export type Role = "Colaborador" | "Líder de proyecto" | "Administrador";

export interface DemoUser {
  login: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  area: string;
}

export const demoUsers: DemoUser[] = [
  { login: "colaborador", name: "Ana Torres", initials: "AT", email: "ana.torres@demo.stt", role: "Colaborador", area: "Desarrollo" },
  { login: "lider", name: "Luis Vega", initials: "LV", email: "luis.vega@demo.stt", role: "Líder de proyecto", area: "Proyectos" },
  { login: "admin", name: "Sara Mora", initials: "SM", email: "sara.mora@demo.stt", role: "Administrador", area: "Operaciones" },
];

export interface DemoProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: string;
  updated: string | null;
  members: string[];
}

export const demoProjects: DemoProject[] = [
  {
    id: "atlas",
    name: "Atlas",
    description: "Proyecto de muestra para la demostración. Su ficha es el documento fuente del proyecto.",
    owner: "Luis Vega",
    status: "En ejecución",
    updated: "2026-10-30",
    members: ["Ana Torres", "Luis Vega"],
  },
  {
    id: "faro",
    name: "Faro",
    description: "Proyecto de muestra con acceso restringido a sus miembros.",
    owner: "Luis Vega",
    status: "En planeación",
    updated: null,
    members: ["Luis Vega"],
  },
];

export interface DemoPolicy {
  topic: string;
  title: string;
  section: string;
  version: number;
  current: boolean;
  category: string;
  updated: string;
  summary: string;
}

export const demoPolicies: DemoPolicy[] = [
  {
    topic: "vacaciones",
    title: "Política de vacaciones",
    section: "Solicitud de vacaciones",
    version: 3,
    current: true,
    category: "Talento humano",
    updated: "2026-09-15",
    summary: "Texto de muestra: pasos para solicitar vacaciones y quién las aprueba.",
  },
  {
    topic: "viaticos",
    title: "Política de viáticos",
    section: "Reembolso de gastos de viaje",
    version: 1,
    current: false,
    category: "Finanzas",
    updated: "2024-02-01",
    summary: "Texto de muestra: documento sin vigencia, se muestra con aviso.",
  },
  {
    topic: "trabajo-remoto",
    title: "Lineamientos de trabajo remoto",
    section: "Disponibilidad y herramientas",
    version: 2,
    current: true,
    category: "Talento humano",
    updated: "2026-06-03",
    summary: "Texto de muestra: horarios de disponibilidad y herramientas autorizadas.",
  },
  {
    topic: "seguridad",
    title: "Uso seguro de la información",
    section: "Clasificación de documentos",
    version: 4,
    current: true,
    category: "Seguridad",
    updated: "2026-08-20",
    summary: "Texto de muestra: cómo clasificar y compartir documentos internos.",
  },
];

export const policyCategories = ["Todas", "Talento humano", "Finanzas", "Seguridad"];

export interface DemoHistoryItem {
  question: string;
  preview: string;
  date: string;
  folder: string;
}

export const demoHistory: DemoHistoryItem[] = [
  { question: "¿Cómo pido vacaciones?", preview: "Respuesta con referencia a «Política de vacaciones · Solicitud de vacaciones».", date: "22 nov 2026", folder: "Talento humano" },
  { question: "¿En qué proyectos participo?", preview: "Participas en Atlas como colaboradora.", date: "21 nov 2026", folder: "Proyectos" },
  { question: "¿Qué datos hay en mi perfil?", preview: "Nombre, correo corporativo, rol y área.", date: "20 nov 2026", folder: "Mi información" },
  { question: "¿Cómo se reembolsan los viáticos?", preview: "La política encontrada no está vigente; se muestra con aviso.", date: "18 nov 2026", folder: "Talento humano" },
  { question: "Resume el estado documentado de Atlas", preview: "Resumen basado solo en la ficha del proyecto, sin cifras inventadas.", date: "17 nov 2026", folder: "Proyectos" },
];

export const demoFolders = [
  { name: "Talento humano", count: 2 },
  { name: "Proyectos", count: 2 },
  { name: "Mi información", count: 1 },
];

export interface DemoIntegration {
  name: string;
  description: string;
  category: "Fuentes" | "Herramientas";
  status: "Conectada" | "Disponible" | "Próximamente";
  initials: string;
}

export const demoIntegrations: DemoIntegration[] = [
  { name: "Políticas corporativas", description: "Documentos versionados y autorizados de ST&T.", category: "Fuentes", status: "Conectada", initials: "PC" },
  { name: "Fichas de proyecto", description: "Catálogo de proyectos con responsable, estado y documentos.", category: "Fuentes", status: "Conectada", initials: "FP" },
  { name: "Perfil del colaborador", description: "Campos mínimos autorizados del usuario autenticado.", category: "Fuentes", status: "Conectada", initials: "PE" },
  { name: "Repositorios de código", description: "Pendiente de validar qué significa «repositorio de proyectos».", category: "Herramientas", status: "Próximamente", initials: "RC" },
  { name: "Gestión de proyectos", description: "Conector futuro con la herramienta de seguimiento de ST&T.", category: "Herramientas", status: "Próximamente", initials: "GP" },
  { name: "Solicitudes con aprobación", description: "Flujos con confirmación humana (evolución posterior al MVP).", category: "Herramientas", status: "Próximamente", initials: "SA" },
];

export const demoHelpTopics = [
  { title: "¿Qué es ST&T One?", description: "Qué puede responder el asistente y de dónde salen sus respuestas." },
  { title: "Fuentes y referencias", description: "Cómo verificar la sección exacta de cada respuesta." },
  { title: "Permisos", description: "Por qué solo ves tu perfil y tus proyectos autorizados." },
  { title: "Sin evidencia", description: "Qué significa cuando el asistente no encuentra información." },
];

export const demoHelpArticles = [
  { title: "Privacidad y seguridad", description: "Cómo se protegen tus datos en la demostración." },
  { title: "Buenas preguntas", description: "Ejemplos de consultas que el asistente entiende." },
  { title: "Problemas frecuentes", description: "Errores de conexión y cómo reintentar." },
];

export const demoArchivedChats = [
  { title: "Procedimiento de vacaciones", date: "02 nov 2026" },
  { title: "Estado de Atlas", date: "28 oct 2026" },
  { title: "Datos de mi perfil", date: "15 oct 2026" },
];

export const demoConnectedApps = [
  { name: "Políticas corporativas", description: "Lectura de documentos autorizados.", enabled: true },
  { name: "Fichas de proyecto", description: "Lectura de proyectos en los que participas.", enabled: true },
  { name: "Perfil del colaborador", description: "Lectura de tus campos de perfil autorizados.", enabled: true },
];

export const chatSuggestions = [
  { label: "Vacaciones", question: "¿Cómo pido vacaciones?" },
  { label: "Mi perfil", question: "¿Qué datos hay en mi perfil?" },
  { label: "Mis proyectos", question: "¿En qué proyectos participo?" },
  { label: "Estado de proyecto", question: "Resume el estado de mi proyecto" },
];

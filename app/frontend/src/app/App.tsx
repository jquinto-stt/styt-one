import { Routes, Route, Navigate } from "react-router";
import { AppShell } from "@/app/AppShell";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { ErrorPage } from "@/pages/ErrorPage";
import { HomePage } from "@/pages/HomePage";
import { ConversationPage } from "@/pages/ConversationPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { PolicySourcePage } from "@/pages/PolicySourcePage";
import { LibraryPage } from "@/pages/LibraryPage";
import { FoldersPage } from "@/pages/FoldersPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { HelpPage } from "@/pages/HelpPage";
import { AdminPage } from "@/pages/AdminPage";
import { SettingsLayout } from "@/pages/settings/SettingsLayout";
import { AccountSettingsPage } from "@/pages/settings/AccountSettingsPage";
import { AppearanceSettingsPage } from "@/pages/settings/AppearanceSettingsPage";
import { PersonalizationSettingsPage } from "@/pages/settings/PersonalizationSettingsPage";
import { SpeechSettingsPage } from "@/pages/settings/SpeechSettingsPage";
import { ArchivedChatsSettingsPage } from "@/pages/settings/ArchivedChatsSettingsPage";
import { ConnectedAppsSettingsPage } from "@/pages/settings/ConnectedAppsSettingsPage";

/**
 * Rutas de ST&T One (pantallas visuales con datos ficticios).
 *
 * - Con shell (barra lateral + header): el asistente y sus secciones.
 * - Standalone: bienvenida, acceso y páginas de error.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/conversacion" element={<ConversationPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/proyectos" element={<ProjectsPage />} />
        <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
        <Route path="/politicas/:topic" element={<PolicySourcePage />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="/carpetas" element={<FoldersPage />} />
        <Route path="/integraciones" element={<IntegrationsPage />} />
        <Route path="/ayuda" element={<HelpPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/ajustes" element={<SettingsLayout />}>
          <Route index element={<Navigate to="cuenta" replace />} />
          <Route path="cuenta" element={<AccountSettingsPage />} />
          <Route path="apariencia" element={<AppearanceSettingsPage />} />
          <Route path="personalizacion" element={<PersonalizationSettingsPage />} />
          <Route path="voz" element={<SpeechSettingsPage />} />
          <Route path="archivados" element={<ArchivedChatsSettingsPage />} />
          <Route path="apps" element={<ConnectedAppsSettingsPage />} />
        </Route>
      </Route>

      <Route path="/bienvenida" element={<LandingPage />} />
      <Route path="/acceso" element={<LoginPage />} />
      <Route
        path="/sin-acceso"
        element={<ErrorPage code="403" title="No tienes acceso a este recurso" message="El proyecto solicitado solo está disponible para sus miembros." />}
      />
      <Route path="*" element={<ErrorPage code="404" title="Página no encontrada" message="La dirección no existe o fue movida." />} />
    </Routes>
  );
}

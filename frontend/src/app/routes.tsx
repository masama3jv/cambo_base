import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerInvitationPage from "./pages/PlayerInvitationPage";
import CapitaDashboard from "./pages/capita/CapitaDashboard";
import CapitaDocuments from "./pages/capita/CapitaDocuments";
import CapitaInscription from "./pages/capita/CapitaInscription";
import CapitaTeam from "./pages/capita/CapitaTeam";
import CapitaCalendar from "./pages/capita/CapitaCalendar";
import CapitaStatistics from "./pages/capita/CapitaStatistics";
import CapitaNotifications from "./pages/capita/CapitaNotifications";
import JugadorDashboard from "./pages/jugador/JugadorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInscriptions from "./pages/admin/AdminInscriptions";
import AdminConfigurator from "./pages/admin/AdminConfigurator";
import AdminCalendarGenerator from "./pages/admin/AdminCalendarGenerator";
import ArbitreMatches from "./pages/arbitre/ArbitreMatches";
import ArbitreMatchSheet from "./pages/arbitre/ArbitreMatchSheet";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/invite/:token",
    Component: PlayerInvitationPage,
  },
  {
    path: "/dashboard",
    Component: CapitaDashboard,
  },
  {
    path: "/team",
    Component: CapitaTeam,
  },
  {
    path: "/calendar",
    Component: CapitaCalendar,
  },
  {
    path: "/stats",
    Component: CapitaStatistics,
  },
  {
    path: "/notifications",
    Component: CapitaNotifications,
  },
  {
    path: "/documents",
    Component: CapitaDocuments,
  },
  {
    path: "/inscription",
    Component: CapitaInscription,
  },
  {
    path: "/jugador/dashboard",
    Component: JugadorDashboard,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/admin/inscriptions",
    Component: AdminInscriptions,
  },
  {
    path: "/admin/configurator",
    Component: AdminConfigurator,
  },
  {
    path: "/admin/calendar",
    Component: AdminCalendarGenerator,
  },
  {
    path: "/arbitre/partits",
    Component: ArbitreMatches,
  },
  {
    path: "/arbitre/match/:matchId",
    Component: ArbitreMatchSheet,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);

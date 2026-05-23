import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import JugadorCalendar from "./pages/jugador/JugadorCalendar";
import JugadorStats from "./pages/jugador/JugadorStats";
import JugadorProfile from "./pages/jugador/JugadorProfile";
import JugadorTeam from "./pages/jugador/JugadorTeam";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInscriptions from "./pages/admin/AdminInscriptions";
import AdminConfigurator from "./pages/admin/AdminConfigurator";
import AdminReferees from "./pages/admin/AdminReferees";
import AdminVenues from "./pages/admin/AdminVenues";
import ArbitreTournaments from "./pages/arbitre/ArbitreTournaments";
import ArbitreMatches from "./pages/arbitre/ArbitreMatches";
import ArbitreMatchSheet from "./pages/arbitre/ArbitreMatchSheet";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  // Public routes
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/invite/:token", Component: PlayerInvitationPage },

  // Capita routes
  {
    path: "/dashboard",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaDashboard /></ProtectedRoute>,
  },
  {
    path: "/team",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaTeam /></ProtectedRoute>,
  },
  {
    path: "/calendar",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaCalendar /></ProtectedRoute>,
  },
  {
    path: "/stats",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaStatistics /></ProtectedRoute>,
  },
  {
    path: "/notifications",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaNotifications /></ProtectedRoute>,
  },
  {
    path: "/documents",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaDocuments /></ProtectedRoute>,
  },
  {
    path: "/inscription",
    element: <ProtectedRoute allowedRoles={['capita']}><CapitaInscription /></ProtectedRoute>,
  },

  // Jugador routes
  {
    path: "/jugador/dashboard",
    element: <ProtectedRoute allowedRoles={['jugador']}><JugadorDashboard /></ProtectedRoute>,
  },
  {
    path: "/jugador/calendar",
    element: <ProtectedRoute allowedRoles={['jugador']}><JugadorCalendar /></ProtectedRoute>,
  },
  {
    path: "/jugador/stats",
    element: <ProtectedRoute allowedRoles={['jugador']}><JugadorStats /></ProtectedRoute>,
  },
  {
    path: "/jugador/profile",
    element: <ProtectedRoute allowedRoles={['jugador']}><JugadorProfile /></ProtectedRoute>,
  },
  {
    path: "/jugador/team",
    element: <ProtectedRoute allowedRoles={['jugador']}><JugadorTeam /></ProtectedRoute>,
  },

  // Admin routes
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: "/admin/inscriptions",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminInscriptions /></ProtectedRoute>,
  },
  {
    path: "/admin/configurator",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminConfigurator /></ProtectedRoute>,
  },
  {
    path: "/admin/calendar",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminConfigurator /></ProtectedRoute>,
  },
  {
    path: "/admin/venues",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminVenues /></ProtectedRoute>,
  },
  {
    path: "/admin/referees",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminReferees /></ProtectedRoute>,
  },

  // Arbitre routes
  {
    path: "/arbitre/partits",
    element: <ProtectedRoute allowedRoles={['arbitre']}><ArbitreTournaments /></ProtectedRoute>,
  },
  {
    path: "/arbitre/partits/:tournamentId",
    element: <ProtectedRoute allowedRoles={['arbitre']}><ArbitreMatches /></ProtectedRoute>,
  },
  {
    path: "/arbitre/match/:matchId",
    element: <ProtectedRoute allowedRoles={['arbitre']}><ArbitreMatchSheet /></ProtectedRoute>,
  },

  // 404
  { path: "*", Component: NotFoundPage },
]);

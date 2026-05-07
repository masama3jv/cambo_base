import { Link, useLocation } from 'react-router';
import { Home, Users, FileText, ClipboardList, Calendar, BarChart3, Bell, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  role: 'capita' | 'jugador' | 'admin' | 'arbitre';
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();

  const capitaLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/team', label: 'El meu equip', icon: Users },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/inscription', label: 'Inscripció', icon: ClipboardList },
    { path: '/calendar', label: 'Calendari', icon: Calendar },
    { path: '/stats', label: 'Estadístiques', icon: BarChart3 },
    { path: '/notifications', label: 'Notificacions', icon: Bell },
  ];

  const jugadorLinks = [
    { path: '/jugador/dashboard', label: 'Dashboard', icon: Home },
    { path: '/jugador/calendar', label: 'Calendari', icon: Calendar },
    { path: '/jugador/stats', label: 'Estadístiques', icon: BarChart3 },
    { path: '/jugador/profile', label: 'El meu perfil', icon: Users },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: Home },
    { path: '/admin/inscriptions', label: 'Inscripcions', icon: ClipboardList },
    { path: '/admin/venues', label: 'Sedes', icon: Settings },
    { path: '/admin/configurator', label: 'Configurador', icon: Settings },
    { path: '/admin/calendar', label: 'Calendari', icon: Calendar },
    { path: '/admin/referees', label: 'Àrbitres', icon: Users },
  ];

  const arbitreLinks = [
    { path: '/arbitre/partits', label: 'Els meus partits', icon: ClipboardList },
  ];

  const links = role === 'capita' ? capitaLinks :
                role === 'jugador' ? jugadorLinks :
                role === 'admin' ? adminLinks :
                arbitreLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#D3D1C7] border-r-[0.5px] h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-[24px] font-medium text-[#D85A30]">CampoBase</h2>
      </div>
      <nav className="flex-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#FAECE7] text-[#D85A30]'
                  : 'text-[#5F5E5A] hover:bg-[#F1EFE8]'
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-[#D3D1C7] border-t-[0.5px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D85A30] rounded-full flex items-center justify-center text-white font-medium">
            JD
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-medium text-[#2C2C2A]">Joan Doe</p>
            <p className="text-[13px] text-[#5F5E5A] capitalize">{role}</p>
          </div>
          <button className="text-[#5F5E5A] hover:text-[#D85A30]">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

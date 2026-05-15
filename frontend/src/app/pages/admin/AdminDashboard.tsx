import { Link } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PendingTeam {
  id: string;
  team: string;
  captain: string;
  players: number;
  sport: string;
}

interface DashboardStats {
  totalTeams: number;
  pendingValidations: number;
  scheduledMatches: number;
  activeCourts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    pendingValidations: 0,
    scheduledMatches: 0,
    activeCourts: 0,
  });
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // API call to fetch admin dashboard data
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setStats(data.stats || {
              totalTeams: 0,
              pendingValidations: 0,
              scheduledMatches: 0,
              activeCourts: 0,
            });
            setPendingTeams(data.pendingTeams || []);
          } else {
            console.error('Invalid response from server');
          }
        } else if (response.status !== 404) {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">Error: {error}</p>
              <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Admin Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard label="Equips inscrits" value={stats.totalTeams.toString()} subtitle="3 esports" />
            <MetricCard label="Pendents validació" value={stats.pendingValidations.toString()} subtitle="Requereixen revisió" />
            <MetricCard label="Partits programats" value={stats.scheduledMatches.toString()} subtitle="Pròximes 2 setmanes" />
            <MetricCard label="Pistes actives" value={stats.activeCourts.toString()} subtitle="2 instal·lacions" />
          </div>

          {/* Pending Validations Alert */}
          {stats.pendingValidations > 0 && (
            <Card className="mb-8 border-l-4 border-l-[#854F0B]">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-[#854F0B] mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-[#854F0B] mb-2">Validacions pendents</h3>
                  <p className="text-[#5F5E5A] mb-4">
                    Hi ha {stats.pendingValidations} equips pendents de validació de documents
                  </p>
                  <Link to="/admin/inscriptions">
                    <Button variant="secondary">Revisar inscripcions</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Pending Teams Table */}
          <Card>
            <h3 className="mb-6">Equips pendents de validació</h3>
            {pendingTeams.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha equips pendents de validació</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D3D1C7]">
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Equip
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Esport
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Capità
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Jugadors
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Estat
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                        Acció
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTeams.map((team) => (
                      <tr key={team.id} className="border-b border-[#D3D1C7] last:border-0">
                        <td className="py-4 px-4 font-medium text-[#2C2C2A]">{team.team}</td>
                        <td className="py-4 px-4">
                          <Badge variant="info">{team.sport}</Badge>
                        </td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.captain}</td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.players}</td>
                        <td className="py-4 px-4">
                          <Badge variant="pending">Pendent validació</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Link to="/admin/inscriptions">
                            <Button variant="secondary">Revisar</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
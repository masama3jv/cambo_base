import { Link } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';

interface DashboardStats {
  totalTeams: number;
  pendingValidations: number;
  pendingDocuments: number;
  activeTournaments: number;
  totalUsers: number;
  scheduledMatches: number;
  activeCourts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0, pendingValidations: 0, pendingDocuments: 0,
    activeTournaments: 0, totalUsers: 0, scheduledMatches: 0, activeCourts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalTeams: data.totalTeams || 0,
            pendingValidations: data.pendingValidations || 0,
            pendingDocuments: data.pendingDocuments || 0,
            activeTournaments: data.activeTournaments || 0,
            totalUsers: data.totalUsers || 0,
            scheduledMatches: data.scheduledMatches || 0,
            activeCourts: data.activeCourts || 0,
          });
        } else {
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

          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard label="Equips inscrits" value={stats.totalTeams} subtitle="Total al sistema" />
            <MetricCard label="Pendents validació" value={stats.pendingValidations} subtitle="Requereixen revisió" />
            <MetricCard label="Documents pendents" value={stats.pendingDocuments} subtitle="Per revisar" />
            <MetricCard label="Torneigs actius" value={stats.activeTournaments} subtitle="En curs" />
            <MetricCard label="Usuaris totals" value={stats.totalUsers} subtitle="Totes les roles" />
            <MetricCard label="Partits programats" value={stats.scheduledMatches} subtitle="Totals" />
            <MetricCard label="Pistes actives" value={stats.activeCourts} subtitle="Instal·lacions" />
          </div>

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
        </div>
      </main>
    </div>
  );
}
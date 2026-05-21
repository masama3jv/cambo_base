import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useState, useEffect } from 'react';

interface DashboardStats {
  nextMatchDate: string | null;
  nextMatchTime: string | null;
  nextMatchCourt: string | null;
  classificationPosition: string | null;
  pendingDocuments: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
}

interface InscriptionStep {
  label: string;
  active: boolean;
  completed: boolean;
}

export default function CapitaDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    nextMatchDate: null,
    nextMatchTime: null,
    nextMatchCourt: null,
    classificationPosition: null,
    pendingDocuments: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
  });
  const [inscriptionSteps, setInscriptionSteps] = useState<InscriptionStep[]>([
    { label: 'Pendent docs', active: false, completed: false },
    { label: 'Pendent pagament', active: false, completed: false },
    { label: 'Pendent validació', active: false, completed: false },
    { label: 'Inscrit', active: false, completed: false },
    { label: 'Actiu', active: false, completed: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setStats(data.stats || stats);
            setInscriptionSteps(data.inscriptionSteps || inscriptionSteps);
          } else {
            console.error('Invalid response from server');
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        // Keep the default empty state on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
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
        <Sidebar role="capita" />
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
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard 
              label="Proper partit" 
              value={stats.nextMatchDate ? stats.nextMatchDate : '-'} 
              subtitle={stats.nextMatchTime && stats.nextMatchCourt ? `${stats.nextMatchTime} · ${stats.nextMatchCourt}` : 'Sense partits programats'} 
            />
            <MetricCard 
              label="Posició classificació" 
              value={stats.classificationPosition || '-'} 
              subtitle="Grupo" 
            />
            <MetricCard 
              label="Documents pendents" 
              value={stats.pendingDocuments.toString()} 
              subtitle={stats.pendingDocuments > 0 ? `Puja els documents` : 'Tots completats'} 
            />
            <MetricCard 
              label="Partits jugats" 
              value={stats.matchesPlayed.toString()} 
              subtitle={stats.matchesPlayed > 0 ? `${stats.wins}V · ${stats.draws}E · ${stats.losses}D` : '0V · 0E · 0D'} 
            />
          </div>

          {/* Inscription Status */}
          <Card className="mb-8">
            <h3 className="mb-6">Estat de la inscripció</h3>
            <div className="flex items-center justify-between gap-4">
              {inscriptionSteps.map((step, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full h-2 rounded-full ${
                      step.completed
                        ? 'bg-[#3B6D11]'
                        : step.active
                        ? 'bg-[#D85A30]'
                        : 'bg-[#D3D1C7]'
                    }`}
                  />
                  <p
                    className={`text-[12px] font-medium text-center ${
                      step.active ? 'text-[#D85A30]' : 'text-[#5F5E5A]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

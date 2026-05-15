import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card, MetricCard } from '../../components/Card';
import { BarChart3 } from 'lucide-react';

interface Statistics {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export default function CapitaStatistics() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        // API call to get statistics would go here
        const response = await fetch('/api/team/statistics');
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStats(data.statistics || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading statistics');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
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
          <div className="max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">Error: {error}</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!stats || stats.matchesPlayed === 0) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="mb-8">Estadístiques</h1>
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 size={32} className="text-[#D85A30]" />
              </div>
              <h3 className="mb-2">Les estadístiques estaran disponibles</h3>
              <p className="text-[#5F5E5A]">
                Un cop comencin els partits, veuràs les estadístiques del teu equip aquí
              </p>
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
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-8">Estadístiques</h1>
          
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard 
              label="Partits jugats" 
              value={stats.matchesPlayed.toString()} 
            />
            <MetricCard 
              label="Victoria / Empat / Derrota" 
              value={`${stats.wins} / ${stats.draws} / ${stats.losses}`}
            />
            <MetricCard 
              label="Gols a favor" 
              value={stats.goalsFor.toString()} 
            />
            <MetricCard 
              label="Gols en contra" 
              value={stats.goalsAgainst.toString()} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

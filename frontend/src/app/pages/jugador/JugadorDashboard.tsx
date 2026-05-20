import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UpcomingMatch {
  id: string;
  date: string;
  time: string;
  court: string;
  opponent: string;
  status: 'confirmed' | 'pending';
}

interface RecentMatch {
  id: string;
  date: string;
  opponent: string;
  result: string;
  won: boolean | null;
}

interface PersonalStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
}

export default function JugadorDashboard() {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats>({
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    yellowCards: 0,
    redCards: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/jugador/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (!data.team) {
            setError('No estàs en cap equip. Espera que un capità t\'hi afegeixi.');
          } else {
            setUpcomingMatches(data.upcomingMatches || []);
            setRecentMatches(data.recentMatches || []);
            setPersonalStats(data.personalStats || {
              goals: 0, assists: 0, matchesPlayed: 0, yellowCards: 0, redCards: 0,
            });
          }
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
        <Sidebar role="jugador" />
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
        <Sidebar role="jugador" />
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

  const nextMatchDate = upcomingMatches.length > 0 ? upcomingMatches[0].date : '-';
  const nextMatchTime = upcomingMatches.length > 0 ? `${upcomingMatches[0].time} · ${upcomingMatches[0].court}` : 'Sense partits';

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <MetricCard label="Partits jugats" value={personalStats.matchesPlayed.toString()} subtitle="Temporada 2026" />
            <MetricCard label="Proper partit" value={nextMatchDate} subtitle={nextMatchTime} />
            <MetricCard
              label="Estadístiques"
              value={`${personalStats.goals}G / ${personalStats.assists}A`}
              subtitle="Gols i assistències"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Upcoming Matches */}
            <Card>
              <h3 className="mb-6">Pròxims partits</h3>
              {upcomingMatches.length === 0 ? (
                <p className="text-center text-[#5F5E5A] py-8">No hi ha partits programats</p>
              ) : (
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="p-4 bg-[#F1EFE8] rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-[#2C2C2A]">vs {match.opponent}</p>
                          <p className="text-[13px] text-[#5F5E5A]">
                            {match.date} · {match.time}
                          </p>
                          <p className="text-[13px] text-[#5F5E5A]">{match.court}</p>
                        </div>
                        <Badge variant={match.status === 'confirmed' ? 'approved' : 'pending'}>
                          {match.status === 'confirmed' ? 'Confirmat' : 'Pendent'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Personal Stats */}
            <Card>
              <h3 className="mb-6">Estadístiques personals</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#D85A30]">{personalStats.goals}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Gols</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#D85A30]">{personalStats.assists}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Assistències</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#854F0B]">{personalStats.yellowCards}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Targetes grogues</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#A32D2D]">{personalStats.redCards}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Targetes vermelles</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Match Results */}
          <Card>
            <h3 className="mb-6">Resultats recents</h3>
            {recentMatches.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha resultats registrats</p>
            ) : (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="p-4 bg-[#F1EFE8] rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2C2C2A]">vs {match.opponent}</p>
                      <p className="text-[13px] text-[#5F5E5A]">{match.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[22px] font-medium text-[#2C2C2A]">{match.result}</p>
                      <Badge
                        variant={
                          match.won === true ? 'approved' : match.won === false ? 'rejected' : 'pending'
                        }
                      >
                        {match.won === true ? 'Victòria' : match.won === false ? 'Derrota' : 'Empat'}
                      </Badge>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <FileText size={16} />
                        Veure acta
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}


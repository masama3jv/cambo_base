import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { BarChart3, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';

interface StatsData {
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
}

interface MatchHistoryItem {
  date: string;
  opponent: string;
  result: string;
  won: boolean | null;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface StatsResponse {
  team: { id: number; name: string; sport: string } | null;
  totalMatches: number;
  personalStats: StatsData;
  matchHistory: MatchHistoryItem[];
}

export default function JugadorStats() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/jugador/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setData(await response.json());
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8"><p className="text-[#5F5E5A]">Carregant...</p></main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8">
          <Card className="p-6 text-center"><p className="text-[#A32D2D]">{error}</p></Card>
        </main>
      </div>
    );
  }

  if (!data || !data.team) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8">
          <Card className="text-center py-12">
            <p className="text-[#5F5E5A]">No estàs en cap equip.</p>
          </Card>
        </main>
      </div>
    );
  }

  const stats = data.personalStats;

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-2">Estadístiques</h1>
          <p className="text-[#5F5E5A] mb-8">{data.team.name}</p>

          <div className="grid grid-cols-5 gap-4 mb-8">
            <Card className="text-center p-6">
              <p className="text-[32px] font-medium text-[#D85A30]">{stats.matchesPlayed}</p>
              <p className="text-[13px] text-[#5F5E5A]">Partits jugats</p>
            </Card>
            <Card className="text-center p-6">
              <p className="text-[32px] font-medium text-[#D85A30]">{stats.goals}</p>
              <p className="text-[13px] text-[#5F5E5A]">Gols</p>
            </Card>
            <Card className="text-center p-6">
              <p className="text-[32px] font-medium text-[#D85A30]">{stats.assists}</p>
              <p className="text-[13px] text-[#5F5E5A]">Assistències</p>
            </Card>
            <Card className="text-center p-6">
              <p className="text-[32px] font-medium text-[#854F0B]">{stats.yellowCards}</p>
              <p className="text-[13px] text-[#5F5E5A]">Targetes grogues</p>
            </Card>
            <Card className="text-center p-6">
              <p className="text-[32px] font-medium text-[#A32D2D]">{stats.redCards}</p>
              <p className="text-[13px] text-[#5F5E5A]">Targetes vermelles</p>
            </Card>
          </div>

          <Card>
            <h3 className="mb-6">Historial de partits</h3>
            {data.matchHistory.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha partits disputats</p>
            ) : (
              <div className="space-y-3">
                {data.matchHistory.map((m, i) => (
                  <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2C2C2A]">vs {m.opponent}</p>
                      <p className="text-[13px] text-[#5F5E5A]">
                        {new Date(m.date).toLocaleDateString('ca-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[13px] text-[#5F5E5A]">Gols</p>
                        <p className="font-medium">{m.goals}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] text-[#5F5E5A]">Grogues</p>
                        <p className="font-medium">{m.yellowCards}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] text-[#5F5E5A]">Vermelles</p>
                        <p className="font-medium">{m.redCards}</p>
                      </div>
                      <p className="text-[22px] font-medium text-[#2C2C2A] mx-4">{m.result}</p>
                      <Badge variant={m.won === true ? 'approved' : m.won === false ? 'rejected' : 'pending'}>
                        {m.won === true ? 'Victòria' : m.won === false ? 'Derrota' : 'Empat'}
                      </Badge>
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

import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Match {
  id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  court_name: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  arbitre_name: string;
}

export default function JugadorCalendar() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'finished'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/jugador/matches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setMatches(await response.json());
        } else {
          throw new Error('Failed to fetch matches');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading matches');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const filtered = matches.filter(m => {
    if (filter === 'pending') return m.status === 'pendent' || m.status === 'en_curs';
    if (filter === 'finished') return m.status === 'finalitzat';
    return true;
  });

  const badgeVariant = (status: string) => {
    if (status === 'finalitzat') return 'approved';
    if (status === 'en_curs') return 'info';
    return 'pending';
  };
  const statusLabel = (status: string) => {
    if (status === 'finalitzat') return 'Finalitzat';
    if (status === 'en_curs') return 'En curs';
    return 'Pendent';
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1>Calendari</h1>
            <div className="flex gap-2">
              {(['all', 'pending', 'finished'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    filter === f ? 'bg-[#2C2C2A] text-white' : 'bg-white text-[#5F5E5A] hover:bg-[#E8E6DC]'
                  }`}>
                  {f === 'all' ? 'Tots' : f === 'pending' ? 'Pendents' : 'Finalitzats'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <p className="text-[#5F5E5A]">Carregant...</p>
          ) : error ? (
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">{error}</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar size={32} className="text-[#D85A30]" />
              </div>
              <h3 className="mb-2">No hi ha partits</h3>
              <p className="text-[#5F5E5A]">Els teus partits apareixeran aquí un cop programats</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map(m => (
                <Card key={m.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-[#2C2C2A] mb-1">
                        {m.home_team_name} vs {m.away_team_name}
                      </p>
                      <p className="text-[13px] text-[#5F5E5A]">
                        {new Date(m.match_date).toLocaleDateString('ca-ES', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {m.court_name && (
                        <p className="text-[13px] text-[#5F5E5A]">Pista: {m.court_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {m.status === 'finalitzat' && m.home_score != null && (
                        <p className="text-[22px] font-medium text-[#2C2C2A]">
                          {m.home_score} - {m.away_score}
                        </p>
                      )}
                      <Badge variant={badgeVariant(m.status)}>{statusLabel(m.status)}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Plus, Minus, CheckCircle } from 'lucide-react';

type Sport = 'futsal' | 'basketball' | 'padel';

interface Incident {
  minute: number;
  type: string;
  player?: string;
  team: string;
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  sport: Sport;
  date: string;
  time: string;
  court: string;
}

export default function ArbitreMatches() {
  const [match, setMatch] = useState<Match | null>(null);
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchClosed, setMatchClosed] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentMinute, setCurrentMinute] = useState(1);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/arbitre/match');
        if (response.ok) {
          const data = await response.json();
          setMatch(data.match);
        } else if (response.status === 404) {
          setError('No hi ha cap partit assignat');
        } else {
          throw new Error('Failed to fetch match');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading match');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatch();
  }, []);

  const addGoal = (team: 'A' | 'B') => {
    if (team === 'A') setScoreA(scoreA + 1);
    else setScoreB(scoreB + 1);
    setIncidents([
      { minute: currentMinute, type: 'Gol', team: team === 'A' ? match!.teamA : match!.teamB },
      ...incidents,
    ]);
  };

  const addCard = (team: 'A' | 'B', type: 'yellow' | 'red') => {
    setIncidents([
      {
        minute: currentMinute,
        type: type === 'yellow' ? 'Targeta groga' : 'Targeta vermella',
        team: team === 'A' ? match!.teamA : match!.teamB,
        player: 'Jugador #10',
      },
      ...incidents,
    ]);
  };

  const handleCloseMatch = () => {
    setMatchClosed(true);
    setShowCloseConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <Card className="text-center">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <Card className="text-center">
            <p className="text-[#A32D2D] mb-4">{error || 'Error carregant el partit'}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>Reintentar</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (matchClosed) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <Card className="text-center">
            <div className="w-20 h-20 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#3B6D11]" />
            </div>
            <h2 className="mb-4">Acta tancada</h2>
            <p className="text-[#5F5E5A] mb-2">PDF generat correctament</p>
            <p className="text-[#5F5E5A] mb-8">
              Resultat final: {match.teamA} {scoreA} - {scoreB} {match.teamB}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>Tornar als partits</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!matchStarted) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-[#D85A30] mb-4">CampoBase</h2>
              <Badge variant="info">{match.sport === 'futsal' ? 'Futbol Sala' : match.sport}</Badge>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Partit</p>
                <p className="font-medium text-[#2C2C2A]">{match.teamA}</p>
                <p className="text-[#5F5E5A]">vs</p>
                <p className="font-medium text-[#2C2C2A]">{match.teamB}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Data i hora</p>
                <p className="text-[#2C2C2A]">{match.date} · {match.time}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Pista</p>
                <p className="text-[#2C2C2A]">{match.court}</p>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => setMatchStarted(true)}>
              Començar partit
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] p-4">
      <div className="w-full max-w-[390px] mx-auto space-y-4">
        <Card>
          <div className="text-center mb-4">
            <Badge variant="info">{match.sport === 'futsal' ? 'Futbol Sala' : match.sport}</Badge>
          </div>
          <div className="text-center text-[13px] text-[#5F5E5A]">
            <p>{match.date} · {match.time}</p>
            <p>{match.court}</p>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <p className="text-[15px] font-medium text-[#2C2C2A] mb-2">{match.teamA}</p>
              <p className="text-[48px] font-medium text-[#D85A30]">{scoreA}</p>
            </div>
            <div className="text-center">
              <p className="text-[24px] text-[#5F5E5A]">-</p>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-[#2C2C2A] mb-2">{match.teamB}</p>
              <p className="text-[48px] font-medium text-[#D85A30]">{scoreB}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#5F5E5A]">Minut actual</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentMinute(Math.max(1, currentMinute - 1))} className="w-8 h-8 rounded-lg bg-[#F1EFE8] flex items-center justify-center">
                <Minus size={16} />
              </button>
              <p className="text-[24px] font-medium text-[#D85A30] w-12 text-center">{currentMinute}</p>
              <button onClick={() => setCurrentMinute(currentMinute + 1)} className="w-8 h-8 rounded-lg bg-[#F1EFE8] flex items-center justify-center">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </Card>

        {match.sport === 'futsal' && (
          <Card>
            <h3 className="mb-4">Incidents</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-2">Gols</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="primary" onClick={() => addGoal('A')} className="w-full">+1 Gol {match.teamA.split(' ')[0]}</Button>
                  <Button variant="primary" onClick={() => addGoal('B')} className="w-full">+1 Gol {match.teamB.split(' ')[0]}</Button>
                </div>
              </div>
              <div>
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-2">Targetes</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Button variant="secondary" onClick={() => addCard('A', 'yellow')} className="w-full bg-[#FAEEDA] border-[#854F0B] text-[#854F0B]">Groga {match.teamA.split(' ')[0]}</Button>
                    <Button variant="secondary" onClick={() => addCard('A', 'red')} className="w-full bg-[#FCEBEB] border-[#A32D2D] text-[#A32D2D]">Vermella {match.teamA.split(' ')[0]}</Button>
                  </div>
                  <div className="space-y-2">
                    <Button variant="secondary" onClick={() => addCard('B', 'yellow')} className="w-full bg-[#FAEEDA] border-[#854F0B] text-[#854F0B]">Groga {match.teamB.split(' ')[0]}</Button>
                    <Button variant="secondary" onClick={() => addCard('B', 'red')} className="w-full bg-[#FCEBEB] border-[#A32D2D] text-[#A32D2D]">Vermella {match.teamB.split(' ')[0]}</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="mb-4">Darrers incidents</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="text-[13px] text-[#5F5E5A] text-center py-4">Encara no hi ha incidents registrats</p>
            ) : (
              incidents.slice(0, 5).map((incident, i) => (
                <div key={i} className="p-3 bg-[#F1EFE8] rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#2C2C2A]">Min {incident.minute}: {incident.type}</p>
                    <p className="text-[12px] text-[#5F5E5A]">{incident.team} {incident.player && `· ${incident.player}`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Button variant="secondary" className="w-full" onClick={() => setShowCloseConfirm(true)}>
          Tancar acta
        </Button>
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-[350px] w-full">
            <h3 className="mb-4">Confirmar tancament</h3>
            <p className="text-[#5F5E5A] mb-6">Estàs segur que vols tancar l'acta? Aquesta acció no es pot desfer.</p>
            <div className="space-y-2">
              <Button variant="primary" className="w-full" onClick={handleCloseMatch}>Sí, tancar acta</Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowCloseConfirm(false)}>Cancel·lar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface Match {
  id: number;
  home_team_name: string;
  away_team_name: string;
  sport: string;
  match_date: string;
  court_name: string;
  status: string;
  sheet_id?: number;
  sheet_status?: string;
}

export default function ArbitreMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/arbitre/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (err) {
      setError('Error carregant partits');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'pendent': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendent' },
      'en_curs': { color: 'bg-blue-100 text-blue-800', label: 'En curs' },
      'finalitzat': { color: 'bg-green-100 text-green-800', label: 'Finalitzat' },
      'cancel·lat': { color: 'bg-red-100 text-red-800', label: 'Cancel·lat' }
    };
    const stat = statusMap[status] || statusMap['pendent'];
    return stat;
  };

  const getSheetStatusColor = (sheetStatus?: string) => {
    if (!sheetStatus) return 'text-gray-400';
    if (sheetStatus === 'tancat') return 'text-green-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#D85A30] mb-8">Els meus partits</h1>
          <div className="text-center py-12 text-gray-600">Carregant partits...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#D85A30] mb-8">Els meus partits</h1>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D85A30] mb-2">Els meus partits</h1>
        <p className="text-gray-600 mb-8">Total: {matches.length} partits</p>

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No hi ha cap partit assignat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const statusInfo = getStatusBadge(match.status);
              const sheetStatusColor = getSheetStatusColor(match.sheet_status);

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {match.sheet_status && (
                          <span className={`flex items-center gap-1 text-xs font-semibold ${sheetStatusColor}`}>
                            {match.sheet_status === 'tancat' ? (
                              <>
                                <CheckCircle size={14} />
                                Acta tancada
                              </>
                            ) : (
                              <>
                                <Edit3 size={14} />
                                Acta en curs
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Teams */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                        {match.home_team_name} <span className="text-[#D85A30]">vs</span> {match.away_team_name}
                      </h3>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#D85A30]" />
                          {new Date(match.match_date).toLocaleDateString('ca-ES')} -{' '}
                          {new Date(match.match_date).toLocaleTimeString('ca-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#D85A30]" />
                          {match.court_name || 'Pista no assignada'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D85A30] font-semibold">Sport:</span>
                          <span className="capitalize">{match.sport || 'futsal'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2">
                      {match.status !== 'pendent' && (
                        <Link
                          to={`/arbitre/match/${match.id}`}
                          className="flex-1 sm:flex-none px-6 py-3 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                        >
                          <Edit3 size={18} />
                          <span>Acta</span>
                        </Link>
                      )}
                      {match.status === 'pendent' && (
                        <button
                          disabled
                          className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold text-sm cursor-not-allowed"
                        >
                          Pendent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
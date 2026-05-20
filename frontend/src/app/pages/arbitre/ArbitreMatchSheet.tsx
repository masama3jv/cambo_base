import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Undo2, Download, Lock } from 'lucide-react';

interface Incident {
  type: string;
  minute: number;
  playerName: string;
  teamId: number;
  timestamp: string;
  points?: number;
}

interface MatchSheetData {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  sport: 'futsal' | 'basket' | 'padel';
  homeScore: number;
  awayScore: number;
  status: 'actiu' | 'tancat';
  incidents: Incident[];
  startTime: string;
}

interface MatchInfo {
  match: any;
  homePlayers: any[];
  awayPlayers: any[];
}

export default function ArbitreMatchSheet() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [sheetData, setSheetData] = useState<MatchSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [minute, setMinute] = useState(0);
  const [message, setMessage] = useState('');
  const [finalizingMatch, setFinalizingMatch] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchMatchData();
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch match');

      const data = await response.json();
      setMatchInfo(data);

      // Fetch sheet data
      const sheetResponse = await fetch(`/api/arbitre/match/${matchId}/sheet`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (sheetResponse.ok) {
        const sheetData = await sheetResponse.json();
        setSheetData(sheetData);
      }

      setLoading(false);
    } catch (err) {
      setError('Error carregant dades del partit');
      setLoading(false);
    }
  };

  const recordIncident = async (action: string, points?: number) => {
    if (!sheetData || !selectedPlayer || !selectedTeam) {
      setMessage('Selecciona jugador i equip');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}/sheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          data: {
            playerName: selectedPlayer,
            teamId: selectedTeam,
            minute,
            points
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSheetData(prev => prev ? {
          ...prev,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          incidents: [...(prev.incidents || [])]
        } : null);
        setMessage(`${action} registrat`);
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      setError('Error registrant incident');
    }
  };

  const undoLastIncident = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}/sheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'undo',
          data: {}
        })
      });

      if (response.ok) {
        await fetchMatchData();
        setMessage('Últim incident desfet');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      setError('Error desfent incident');
    }
  };

  const finalizeMatch = async () => {
    if (!window.confirm('Estàs segur que vols tancar l\'acta? No es podrà modificar més tard.')) {
      return;
    }

    setFinalizingMatch(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSheetData(prev => prev ? { ...prev, status: 'tancat' } : null);
        setMessage('Acta tancada correctament');
      }
    } catch (err) {
      setError('Error tancant acta');
    } finally {
      setFinalizingMatch(false);
    }
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `acta_${matchId}.pdf`;
        a.click();
      }
    } catch (err) {
      setError('Error generant PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Carregant...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!matchInfo || !sheetData) return <div className="p-4 text-center">Error carregant dades</div>;

  const sport = sheetData.sport || 'futsal';
  const isTeamA = (id: number) => id === sheetData.homeTeamId;
  const getTeamName = (id: number) => isTeamA(id) ? matchInfo.match.home_team_name : matchInfo.match.away_team_name;
  const getPlayers = (id: number) => isTeamA(id) ? matchInfo.homePlayers : matchInfo.awayPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#D85A30] text-center">
            Acta de Partit
          </h1>
          <p className="text-center text-gray-600 text-sm">Match ID: {matchId}</p>
        </div>

        {/* Score Board */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-sm text-gray-600 mb-2">{matchInfo.match.home_team_name}</p>
              <p className="text-4xl sm:text-5xl font-bold text-[#D85A30]">
                {sheetData.homeScore}
              </p>
            </div>
            <div className="px-4 text-center">
              <p className="text-2xl font-bold text-gray-400">-</p>
              <p className="text-xs text-gray-500 uppercase mt-1">{sport}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm text-gray-600 mb-2">{matchInfo.match.away_team_name}</p>
              <p className="text-4xl sm:text-5xl font-bold text-[#D85A30]">
                {sheetData.awayScore}
              </p>
            </div>
          </div>
        </div>

        {/* Sport-Specific Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Registrar Incident</h2>

          {/* Team Selection */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">Equip</label>
            <div className="flex gap-2">
              {[sheetData.homeTeamId, sheetData.awayTeamId].map((teamId) => (
                <button
                  key={teamId}
                  onClick={() => setSelectedTeam(teamId)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    selectedTeam === teamId
                      ? 'bg-[#D85A30] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getTeamName(teamId)}
                </button>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          {selectedTeam && (
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-2">Jugador</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecciona jugador</option>
                {getPlayers(selectedTeam).map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Minute Input */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">Minut</label>
            <input
              type="number"
              min="0"
              max="90"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Sport-Specific Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sport === 'futsal' && (
              <>
                <button
                  onClick={() => recordIncident('goal')}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  ⚽ Gol
                </button>
                <button
                  onClick={() => recordIncident('yellow_card')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  🟨 Taronja
                </button>
                <button
                  onClick={() => recordIncident('red_card')}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  🟥 Vermella
                </button>
                <button
                  onClick={() => recordIncident('timeout')}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  ⏱️ Time-out
                </button>
              </>
            )}
            {sport === 'basket' && (
              <>
                <button
                  onClick={() => recordIncident('1pt', 1)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  1️⃣ Punt
                </button>
                <button
                  onClick={() => recordIncident('2pt', 2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  2️⃣ Puntada
                </button>
                <button
                  onClick={() => recordIncident('foul')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  🚫 Falta
                </button>
                <button
                  onClick={() => recordIncident('timeout')}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  ⏱️ T.O.
                </button>
              </>
            )}
            {sport === 'padel' && (
              <>
                <button
                  onClick={() => recordIncident('set_score')}
                  className="col-span-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  📊 Set
                </button>
                <button
                  onClick={() => recordIncident('injury')}
                  className="col-span-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  🩹 Lesió
                </button>
              </>
            )}
          </div>
        </div>

        {/* Incidents Log */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Incidents ({sheetData.incidents.length})</h3>
          {sheetData.incidents.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Cap incident registrat</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sheetData.incidents.map((incident, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>
                    <span className="font-semibold">[{incident.minute}']</span>{' '}
                    <span className="text-gray-700">{incident.playerName}</span> - {incident.type}
                  </span>
                  {sheetData.status === 'actiu' && (
                    <button
                      onClick={undoLastIncident}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <button
            onClick={undoLastIncident}
            disabled={sheetData.incidents.length === 0 || sheetData.status === 'tancat'}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold"
          >
            <Undo2 size={20} />
            Desfer
          </button>
          <button
            onClick={generatePDF}
            disabled={generatingPDF || sheetData.status === 'actiu'}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold"
          >
            <Download size={20} />
            PDF
          </button>
        </div>

        {/* Close Match Button */}
        <button
          onClick={finalizeMatch}
          disabled={finalizingMatch || sheetData.status === 'tancat'}
          className={`w-full py-4 px-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition ${
            sheetData.status === 'tancat'
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#D85A30] hover:bg-[#C24620] text-white'
          }`}
        >
          {sheetData.status === 'tancat' ? (
            <>
              <Lock size={20} />
              Acta Tancada
            </>
          ) : (
            'Tancar Acta'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

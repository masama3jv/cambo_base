import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Undo2, Download, Lock, X } from 'lucide-react';

interface Incident {
  type: string;
  minute?: number;
  playerName?: string;
  teamId?: number;
  timestamp: string;
  points?: number;
  set_number?: number;
  home_score?: number;
  away_score?: number;
}

interface MatchSheetData {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  sport: 'futsal' | 'basquet3x3' | 'padel';
  homeScore: number;
  awayScore: number;
  status: 'actiu' | 'tancat' | 'immutable';
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
  
  // States for Incident Recording
  const [minute, setMinute] = useState(0);
  const [message, setMessage] = useState('');
  const [finalizingMatch, setFinalizingMatch] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sport Specific States
  const [selectedHomePlayer, setSelectedHomePlayer] = useState<string>('');
  const [selectedAwayPlayer, setSelectedAwayPlayer] = useState<string>('');
  const [padelHomeScore, setPadelHomeScore] = useState(0);
  const [padelAwayScore, setPadelAwayScore] = useState(0);

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

  const recordIncident = async (action: string, teamId: number, playerName?: string, points?: number, extraData?: any) => {
    if (action !== 'set_result' && !playerName) {
      setMessage('Selecciona un jugador abans de registrar');
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
            playerName,
            teamId,
            minute,
            points,
            ...extraData
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSheetData(prev => prev ? {
          ...prev,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          incidents: [...(prev.incidents || [])] // Quick trigger to re-render, we re-fetch below ideally
        } : null);
        
        await fetchMatchData(); // Ensure we get the fresh accurate list
        
        setMessage(`${action === 'set_result' ? 'Set' : action} registrat`);
        setTimeout(() => setMessage(''), 2000);
        
        // Reset player selection to encourage clean slate per action
        setSelectedHomePlayer('');
        setSelectedAwayPlayer('');
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
    setFinalizingMatch(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/arbitre/match/${matchId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSheetData(prev => prev ? { ...prev, status: 'immutable' } : null);
        setMessage('Acta tancada correctament');
      }
    } catch (err) {
      setError('Error tancant acta');
    } finally {
      setFinalizingMatch(false);
      setShowConfirmModal(false);
    }
  };

  const downloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/match-sheets/${matchId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `acta_${matchId}.pdf`;
        a.click();
      } else {
        setError("No s'ha pogut descarregar el PDF");
      }
    } catch (err) {
      setError('Error descarregant PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Carregant...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!matchInfo || !sheetData) return <div className="p-4 text-center">Error carregant dades</div>;

  const sport = sheetData.sport || 'futsal';
  const isClosed = sheetData.status === 'tancat' || sheetData.status === 'immutable';

  // Format incidents for display
  const renderIncidentString = (incident: Incident, index: number) => {
    if (incident.type === 'set_result') {
      return `${index + 1}. 📊 Set ${incident.set_number}: ${matchInfo.match.home_team_name} ${incident.home_score} - ${incident.away_score} ${matchInfo.match.away_team_name}`;
    } else {
      const teamName = incident.teamId === sheetData.homeTeamId ? matchInfo.match.home_team_name : matchInfo.match.away_team_name;
      const iconMap: any = {
        goal: '⚽', yellow_card: '🟨', red_card: '🟥',
        '1pt': '1️⃣', '2pt': '2️⃣', foul: '🚫', timeout: '⏱️', injury: '🩹'
      };
      const icon = iconMap[incident.type] || '';
      return `${index + 1}. [${incident.minute}'] ${icon} ${incident.playerName} (${teamName}) - ${incident.type}`;
    }
  };

  // ---------------------------------------------------------------------------
  // ACTA TANCADA SCREEN
  // ---------------------------------------------------------------------------
  if (isClosed) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] mb-2">Acta Tancada</h1>
          <p className="text-[#5F5E5A] mb-8">
            El partit {matchInfo.match.home_team_name} vs {matchInfo.match.away_team_name} s'ha registrat correctament i no es pot modificar.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={downloadPDF}
              disabled={generatingPDF}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold transition"
            >
              <Download size={20} />
              {generatingPDF ? 'Descarregant...' : 'Descarregar PDF'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
            >
              Tornar al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ACTIVE MATCH SHEET SCREEN
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-2 sm:p-4">
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#D85A30] text-center">
            Acta de Partit
          </h1>
          <p className="text-center text-gray-600 text-sm">ID: {matchId} · {sport.toUpperCase()}</p>
        </div>

        {/* Score Board */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">{matchInfo.match.home_team_name}</p>
              <p className="text-5xl font-bold text-[#D85A30]">{sheetData.homeScore}</p>
            </div>
            <div className="px-4 text-center">
              <p className="text-3xl font-bold text-gray-300">-</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">{matchInfo.match.away_team_name}</p>
              <p className="text-5xl font-bold text-[#D85A30]">{sheetData.awayScore}</p>
            </div>
          </div>
        </div>

        {/* Universal Controls: Minute Input */}
        {sport !== 'padel' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
             <label className="text-sm font-bold text-gray-700 block mb-2 text-center">Minut Actual del Partit</label>
             <input
               type="number" min="0" max="120"
               value={minute}
               onChange={(e) => setMinute(parseInt(e.target.value))}
               className="w-full max-w-[150px] mx-auto block px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:border-[#D85A30] outline-none"
             />
          </div>
        )}

        {/* Sport-Specific Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          {sport === 'padel' ? (
            // -------------------- PADEL UI --------------------
            <div className="space-y-6">
              <h2 className="font-bold text-gray-800 text-center border-b pb-2">Registrar Nou Set</h2>
              <div className="flex items-center justify-between gap-6 max-w-sm mx-auto">
                <div className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2 truncate">{matchInfo.match.home_team_name}</p>
                  <input 
                    type="number" min="0" max="7" 
                    value={padelHomeScore} 
                    onChange={(e) => setPadelHomeScore(parseInt(e.target.value))}
                    className="w-full text-center py-4 border-2 rounded-xl text-3xl font-bold"
                  />
                </div>
                <div className="text-gray-300 font-bold text-2xl">-</div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2 truncate">{matchInfo.match.away_team_name}</p>
                  <input 
                    type="number" min="0" max="7" 
                    value={padelAwayScore} 
                    onChange={(e) => setPadelAwayScore(parseInt(e.target.value))}
                    className="w-full text-center py-4 border-2 rounded-xl text-3xl font-bold"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const setNum = sheetData.incidents.filter(i => i.type === 'set_result').length + 1;
                  recordIncident('set_result', sheetData.homeTeamId, undefined, undefined, {
                    set_number: setNum,
                    home_score: padelHomeScore,
                    away_score: padelAwayScore
                  });
                  setPadelHomeScore(0);
                  setPadelAwayScore(0);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-sm"
              >
                Afegir Set {sheetData.incidents.filter(i => i.type === 'set_result').length + 1}
              </button>
            </div>
          ) : (
            // -------------------- FUTSAL / BASKET 2-COLUMN UI --------------------
            <div className="grid grid-cols-2 gap-4">
              
              {/* HOME TEAM COLUMN */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h3 className="font-bold text-sm text-center mb-3 text-gray-800 truncate">{matchInfo.match.home_team_name}</h3>
                
                <select
                  value={selectedHomePlayer}
                  onChange={(e) => setSelectedHomePlayer(e.target.value)}
                  className="w-full px-2 py-3 border border-gray-300 rounded-lg text-sm mb-4 bg-white font-medium"
                >
                  <option value="">-- Jugador --</option>
                  {matchInfo.homePlayers.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>

                <div className="space-y-2">
                  {sport === 'futsal' && (
                    <>
                      <button onClick={() => recordIncident('goal', sheetData.homeTeamId, selectedHomePlayer)} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded shadow-sm font-bold text-sm">⚽ Gol</button>
                      <button onClick={() => recordIncident('yellow_card', sheetData.homeTeamId, selectedHomePlayer)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded shadow-sm font-bold text-sm">🟨 Taronja</button>
                      <button onClick={() => recordIncident('red_card', sheetData.homeTeamId, selectedHomePlayer)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded shadow-sm font-bold text-sm">🟥 Vermella</button>
                    </>
                  )}
                  {sport === 'basquet3x3' && (
                    <>
                      <button onClick={() => recordIncident('1pt', sheetData.homeTeamId, selectedHomePlayer, 1)} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">1️⃣ Punt</button>
                      <button onClick={() => recordIncident('2pt', sheetData.homeTeamId, selectedHomePlayer, 2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded shadow-sm font-bold text-sm">2️⃣ Punts</button>
                      <button onClick={() => recordIncident('foul', sheetData.homeTeamId, selectedHomePlayer)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded shadow-sm font-bold text-sm">🚫 Falta</button>
                    </>
                  )}
                </div>
              </div>

              {/* AWAY TEAM COLUMN */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h3 className="font-bold text-sm text-center mb-3 text-gray-800 truncate">{matchInfo.match.away_team_name}</h3>
                
                <select
                  value={selectedAwayPlayer}
                  onChange={(e) => setSelectedAwayPlayer(e.target.value)}
                  className="w-full px-2 py-3 border border-gray-300 rounded-lg text-sm mb-4 bg-white font-medium"
                >
                  <option value="">-- Jugador --</option>
                  {matchInfo.awayPlayers.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>

                <div className="space-y-2">
                  {sport === 'futsal' && (
                    <>
                      <button onClick={() => recordIncident('goal', sheetData.awayTeamId, selectedAwayPlayer)} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded shadow-sm font-bold text-sm">⚽ Gol</button>
                      <button onClick={() => recordIncident('yellow_card', sheetData.awayTeamId, selectedAwayPlayer)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded shadow-sm font-bold text-sm">🟨 Taronja</button>
                      <button onClick={() => recordIncident('red_card', sheetData.awayTeamId, selectedAwayPlayer)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded shadow-sm font-bold text-sm">🟥 Vermella</button>
                    </>
                  )}
                  {sport === 'basquet3x3' && (
                    <>
                      <button onClick={() => recordIncident('1pt', sheetData.awayTeamId, selectedAwayPlayer, 1)} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">1️⃣ Punt</button>
                      <button onClick={() => recordIncident('2pt', sheetData.awayTeamId, selectedAwayPlayer, 2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded shadow-sm font-bold text-sm">2️⃣ Punts</button>
                      <button onClick={() => recordIncident('foul', sheetData.awayTeamId, selectedAwayPlayer)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded shadow-sm font-bold text-sm">🚫 Falta</button>
                    </>
                  )}
                </div>
              </div>

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
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Incidents Log */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="font-semibold text-gray-800">Registre ({sheetData.incidents.length})</h3>
            <button
              onClick={undoLastIncident}
              disabled={sheetData.incidents.length === 0}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 disabled:text-gray-300 font-medium"
            >
              <Undo2 size={16} />
              Desfer últim
            </button>
          </div>
          
          {sheetData.incidents.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Cap incident registrat</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {[...sheetData.incidents].reverse().map((incident, idx) => (
                <div key={idx} className="text-sm p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  {renderIncidentString(incident, sheetData.incidents.length - 1 - idx)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar for Tancar Acta */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-4 px-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#D85A30] hover:bg-[#C24620] text-white shadow-md transition"
          >
            Tancar Acta
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Tancar Acta?</h2>
            <p className="text-center text-gray-600 mb-8">
              Aquesta acció és irreversible. L'acta es tancarà permanentment i es generarà el PDF oficial.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold"
                disabled={finalizingMatch}
              >
                Cancel·lar
              </button>
              <button 
                onClick={finalizeMatch}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex justify-center items-center"
                disabled={finalizingMatch}
              >
                {finalizingMatch ? 'Tancant...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

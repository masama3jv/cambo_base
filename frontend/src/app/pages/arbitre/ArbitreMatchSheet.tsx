import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AlertCircle, CheckCircle, Undo2, Download, X, RefreshCw, Plus, Minus } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Incident {
  type: string;
  minute?: number;
  playerName?: string;
  playerOut?: string;
  playerIn?: string;
  teamId?: number;
  timestamp: string;
  points?: number;
  set_number?: number;
  home_score?: number;
  away_score?: number;
}

interface Lineups {
  homeTeam: { starting: string[]; substitutes: string[] };
  awayTeam: { starting: string[]; substitutes: string[] };
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
  lineups?: Lineups;
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

  const [minute, setMinute] = useState(0);
  const [message, setMessage] = useState('');
  const [finalizingMatch, setFinalizingMatch] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [selectedHomePlayer, setSelectedHomePlayer] = useState<string>('');
  const [selectedAwayPlayer, setSelectedAwayPlayer] = useState<string>('');

  const [padelHomeScore, setPadelHomeScore] = useState(0);
  const [padelAwayScore, setPadelAwayScore] = useState(0);

  const [showLineupConfig, setShowLineupConfig] = useState(false);
  const [homeStarting, setHomeStarting] = useState<string[]>([]);
  const [awayStarting, setAwayStarting] = useState<string[]>([]);
  const [editingLineupTeam, setEditingLineupTeam] = useState<'home' | 'away' | null>(null);
  const [lineupPlayerPool, setLineupPlayerPool] = useState<string[]>([]);
  const [lineupSelectedStarting, setLineupSelectedStarting] = useState<string[]>([]);

  const [showSubModal, setShowSubModal] = useState(false);
  const [subTeamId, setSubTeamId] = useState<number>(0);
  const [subPlayerIn, setSubPlayerIn] = useState('');
  const [subPlayerOut, setSubPlayerOut] = useState('');

  useEffect(() => {
    fetchMatchData();
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch match');

      const data = await response.json();
      setMatchInfo(data);

      const sheetResponse = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}/sheet`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (sheetResponse.ok) {
        const sd = await sheetResponse.json();
        setSheetData(sd);
        const homeStart = sd.lineups?.homeTeam?.starting;
        const awayStart = sd.lineups?.awayTeam?.starting;
        if (homeStart) setHomeStarting(homeStart);
        if (awayStart) setAwayStarting(awayStart);
      }

      setLoading(false);
    } catch (err) {
      setError('Error carregant dades del partit');
      setLoading(false);
    }
  };

  const saveLineups = async (lineups: Lineups) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}/sheet`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_lineups', data: { lineups } })
      });
      if (response.ok) {
        setSheetData(prev => prev ? { ...prev, lineups } : null);
        setShowLineupConfig(false);
        setMessage('Alineacions guardades');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      setError('Error guardant alineacions');
    }
  };

  const openLineupEditor = (team: 'home' | 'away') => {
    const allPlayers = team === 'home'
      ? (matchInfo?.homePlayers.map(p => (p as any).name) || [])
      : (matchInfo?.awayPlayers.map(p => (p as any).name) || []);
    const currentStarting = team === 'home' ? homeStarting : awayStarting;

    setEditingLineupTeam(team);
    setLineupPlayerPool(allPlayers);
    setLineupSelectedStarting(currentStarting.filter(n => allPlayers.includes(n)));
    setShowLineupConfig(true);
  };

  const toggleStartingPlayer = (name: string) => {
    setLineupSelectedStarting(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const confirmLineup = () => {
    if (!editingLineupTeam || !matchInfo) return;

    const allPlayers = editingLineupTeam === 'home'
      ? matchInfo.homePlayers.map(p => (p as any).name)
      : matchInfo.awayPlayers.map(p => (p as any).name);
    const substitutes = allPlayers.filter(n => !lineupSelectedStarting.includes(n));

    const newHomeStarting = editingLineupTeam === 'home' ? lineupSelectedStarting : homeStarting;
    const newAwayStarting = editingLineupTeam === 'away' ? lineupSelectedStarting : awayStarting;

    const currentHomeSubs = sheetData?.lineups?.homeTeam.substitutes || matchInfo.homePlayers.map(p => (p as any).name).filter(n => !homeStarting.includes(n));
    const currentAwaySubs = sheetData?.lineups?.awayTeam.substitutes || matchInfo.awayPlayers.map(p => (p as any).name).filter(n => !awayStarting.includes(n));

    const newHomeSubs = editingLineupTeam === 'home' ? substitutes : currentHomeSubs;
    const newAwaySubs = editingLineupTeam === 'away' ? substitutes : currentAwaySubs;

    const lineups: Lineups = {
      homeTeam: { starting: newHomeStarting, substitutes: newHomeSubs },
      awayTeam: { starting: newAwayStarting, substitutes: newAwaySubs }
    };

    setHomeStarting(newHomeStarting);
    setAwayStarting(newAwayStarting);
    saveLineups(lineups);
    setShowLineupConfig(false);
  };

  const openSubModal = (teamId: number) => {
    const isHome = teamId === sheetData?.homeTeamId;
    const starting = isHome ? homeStarting : awayStarting;
    const allPlayers = isHome
      ? (matchInfo?.homePlayers.map((p: any) => p.name) || [])
      : (matchInfo?.awayPlayers.map((p: any) => p.name) || []);
    const subs = isHome
      ? (sheetData?.lineups?.homeTeam.substitutes || allPlayers.filter(n => !homeStarting.includes(n)))
      : (sheetData?.lineups?.awayTeam.substitutes || allPlayers.filter(n => !awayStarting.includes(n)));

    setSubTeamId(teamId);
    setSubPlayerOut(starting[0] || '');
    setSubPlayerIn(subs[0] || '');
    setShowSubModal(true);
  };

  const handleSubstitution = async () => {
    if (!subPlayerOut || !subPlayerIn) {
      setMessage('Selecciona jugador sortint i entrant');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    await recordIncident('substitution', subTeamId, undefined, undefined, {
      playerOut: subPlayerOut,
      playerIn: subPlayerIn
    });
    setShowSubModal(false);
  };

  const recordIncident = async (action: string, teamId: number, playerName?: string, points?: number, extraData?: any) => {
    if (!['set_result', 'substitution', 'timeout', 'save_lineups'].includes(action) && !playerName && !extraData?.playerIn) {
      setError('Selecciona un jugador al desplegable abans de registrar');
      return;
    }
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}/sheet`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { playerName, teamId, minute, points, ...extraData } })
      });

      if (response.ok) {
        const result = await response.json();
        // Optimistic score update from POST response
        setSheetData(prev => prev ? { ...prev, homeScore: result.homeScore, awayScore: result.awayScore } : null);
        // Full sync (incidents log, lineups, etc.)
        await fetchMatchData();
        setMessage(action === 'set_result' ? 'Set registrat' : action === 'substitution' ? 'Canvi registrat' : action + ' registrat');
        setTimeout(() => setMessage(''), 3000);
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
      const response = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}/sheet`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo', data: {} })
      });
      if (response.ok) {
        await fetchMatchData();
        setMessage('Ultim incident desfet');
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
      const response = await fetch(`${API_BASE_URL}/arbitre/match/${matchId}/close`, {
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
      const response = await fetch(`${API_BASE_URL}/match-sheets/${matchId}/pdf`, {
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
  const hasLineups = sheetData.lineups && homeStarting.length > 0 && awayStarting.length > 0;

  const renderIncidentString = (incident: Incident, index: number) => {
    const teamName = incident.teamId === sheetData.homeTeamId
      ? matchInfo.match.home_team_name : matchInfo.match.away_team_name;

    if (incident.type === 'set_result') {
      return `${index + 1}. Set ${incident.set_number}: ${matchInfo.match.home_team_name} ${incident.home_score} - ${incident.away_score} ${matchInfo.match.away_team_name}`;
    }
    if (incident.type === 'substitution') {
      return `${index + 1}. [${incident.minute}'] ${incident.playerOut} -> ${incident.playerIn} (${teamName})`;
    }
    const iconMap: Record<string, string> = {
      goal: 'G', yellow_card: 'YC', red_card: 'RC',
      '1pt': '1PT', '2pt': '2PT', foul: 'F',
      timeout: 'TO', injury: 'INJ'
    };
    const icon = iconMap[incident.type] || incident.type;
    const name = incident.playerName || '';
    return `${index + 1}. [${incident.minute}'] ${icon} ${name} (${teamName})`;
  };

  // Closed sheet
  if (isClosed) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] mb-2">Acta Tancada</h1>
          <p className="text-[#5F5E5A] mb-8">
            {matchInfo.match.home_team_name} vs {matchInfo.match.away_team_name}
          </p>
          <p className="text-4xl font-bold text-[#D85A30] mb-8">{sheetData.homeScore} - {sheetData.awayScore}</p>
          <div className="space-y-4">
            <button onClick={downloadPDF} disabled={generatingPDF}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold transition">
              <Download size={20} /> {generatingPDF ? 'Descarregant...' : 'Descarregar PDF'}
            </button>
            <button onClick={() => navigate('/arbitre/partits')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition">
              Tornar als partits
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lineup config modal
  if (showLineupConfig && editingLineupTeam) {
    const teamLabel = editingLineupTeam === 'home' ? matchInfo.match.home_team_name : matchInfo.match.away_team_name;
    return (
      <div className="min-h-screen bg-[#F1EFE8] p-4">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-center">Alinacio - {teamLabel}</h2>
          <p className="text-sm text-[#5F5E5A] text-center mb-6">Selecciona els jugadors titulars (els demes seran suplents)</p>

          <div className="space-y-2 mb-6">
            {lineupPlayerPool.map(name => (
              <label key={name}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${lineupSelectedStarting.includes(name) ? 'bg-[#FAECE7] border-[#D85A30]' : 'bg-white border-[#D3D1C7] hover:bg-[#F1EFE8]'}`}>
                <span className="font-medium text-[#2C2C2A]">{name}</span>
                <button onClick={() => toggleStartingPlayer(name)}
                  className={`p-1.5 rounded-full transition ${lineupSelectedStarting.includes(name) ? 'bg-[#D85A30] text-white' : 'bg-[#F1EFE8] text-[#5F5E5A]'}`}>
                  {lineupSelectedStarting.includes(name) ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              </label>
            ))}
          </div>

          <p className="text-sm text-[#5F5E5A] mb-4">
            Titulars: {lineupSelectedStarting.length} | Suplents: {lineupPlayerPool.length - lineupSelectedStarting.length}
          </p>

          <div className="flex gap-3">
            <button onClick={() => setShowLineupConfig(false)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold">
              Cancel·lar
            </button>
            <button onClick={confirmLineup}
              className="flex-1 py-3 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold">
              Guardar alinacio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Substitution modal
  const renderSubModal = () => {
    if (!showSubModal) return null;
    const isHome = subTeamId === sheetData.homeTeamId;
    const starting = isHome ? homeStarting : awayStarting;
    const subs = isHome
      ? (sheetData.lineups?.homeTeam.substitutes || [])
      : (sheetData.lineups?.awayTeam.substitutes || []);

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold mb-4 text-center">Registrar canvi</h3>

          <label className="text-[12px] font-medium uppercase tracking-wider text-[#2C2C2A] mb-1 block">Jugador sortint</label>
          <select value={subPlayerOut} onChange={e => setSubPlayerOut(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#D3D1C7] rounded-lg mb-4 bg-white">
            <option value="">-- Selecciona --</option>
            {starting.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <label className="text-[12px] font-medium uppercase tracking-wider text-[#2C2C2A] mb-1 block">Jugador entrant</label>
          <select value={subPlayerIn} onChange={e => setSubPlayerIn(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#D3D1C7] rounded-lg mb-6 bg-white">
            <option value="">-- Selecciona --</option>
            {subs.filter(n => n !== subPlayerOut).map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <div className="flex gap-3">
            <button onClick={() => setShowSubModal(false)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold">Cancel·lar</button>
            <button onClick={handleSubstitution}
              className="flex-1 py-3 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold">Confirmar canvi</button>
          </div>
        </div>
      </div>
    );
  };

  // Active match view
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-2 sm:p-4">
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#D85A30] text-center">Acta de Partit</h1>
          <p className="text-center text-gray-600 text-sm">{matchInfo.match.home_team_name} vs {matchInfo.match.away_team_name} - {sport.toUpperCase()}</p>
        </div>

        {/* Lineup section */}
        {!hasLineups ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4 text-center">
            <h2 className="font-bold text-lg mb-2">Alineacions pendents</h2>
            <p className="text-[#5F5E5A] mb-4">Configura les alineacions abans de comencar el partit</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => openLineupEditor('home')}
                className="px-6 py-3 bg-[#FAECE7] text-[#D85A30] border border-[#D85A30] rounded-lg font-semibold hover:bg-[#F5DDD3] transition">
                {matchInfo.match.home_team_name}
              </button>
              <button onClick={() => openLineupEditor('away')}
                className="px-6 py-3 bg-[#FAECE7] text-[#D85A30] border border-[#D85A30] rounded-lg font-semibold hover:bg-[#F5DDD3] transition">
                {matchInfo.match.away_team_name}
              </button>
            </div>
            <p className="text-xs text-[#5F5E5A] mt-3">Titulars: {homeStarting.length} - {awayStarting.length}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Alineacions</h3>
              <button onClick={() => openLineupEditor('home')} className="text-xs text-[#D85A30] hover:underline">
                <RefreshCw size={14} className="inline mr-1" />Editar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-[#D85A30] mb-1">{matchInfo.match.home_team_name}</p>
                <p className="text-[#5F5E5A]">Titulars: {homeStarting.length} | Suplents: {sheetData.lineups?.homeTeam.substitutes.length || 0}</p>
              </div>
              <div>
                <p className="font-medium text-[#D85A30] mb-1">{matchInfo.match.away_team_name}</p>
                <p className="text-[#5F5E5A]">Titulars: {awayStarting.length} | Suplents: {sheetData.lineups?.awayTeam.substitutes.length || 0}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Minute Input */}
        {sport !== 'padel' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <label className="text-sm font-bold text-gray-700 block mb-2 text-center">Minut Actual</label>
            <input type="number" min="0" max={(matchInfo.match.match_duration_minutes || 40) + 10}
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
              className="w-full max-w-[150px] mx-auto block px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:border-[#D85A30] outline-none" />
            <p className="text-xs text-gray-400 text-center mt-1">Durada del partit: {matchInfo.match.match_duration_minutes || 40} min</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          {sport === 'padel' ? (
            <div className="space-y-6">
              <h2 className="font-bold text-gray-800 text-center border-b pb-2">Registrar Set</h2>
              <div className="flex items-center justify-between gap-6 max-w-sm mx-auto">
                <div className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">{matchInfo.match.home_team_name}</p>
                  <input type="number" min="0" max="7" value={padelHomeScore}
                    onChange={(e) => setPadelHomeScore(parseInt(e.target.value) || 0)}
                    className="w-full text-center py-4 border-2 rounded-xl text-3xl font-bold" />
                  <p className="text-[10px] text-gray-400 mt-1">Jocs</p>
                </div>
                <div className="text-gray-300 font-bold text-2xl">-</div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">{matchInfo.match.away_team_name}</p>
                  <input type="number" min="0" max="7" value={padelAwayScore}
                    onChange={(e) => setPadelAwayScore(parseInt(e.target.value) || 0)}
                    className="w-full text-center py-4 border-2 rounded-xl text-3xl font-bold" />
                  <p className="text-[10px] text-gray-400 mt-1">Jocs</p>
                </div>
              </div>
              <button onClick={() => {
                const setNum = sheetData.incidents.filter(i => i.type === 'set_result').length + 1;
                recordIncident('set_result', sheetData.homeTeamId, undefined, undefined, {
                  set_number: setNum, home_score: padelHomeScore, away_score: padelAwayScore
                });
                setPadelHomeScore(0); setPadelAwayScore(0);
              }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-sm">
                Afegir Set {sheetData.incidents.filter(i => i.type === 'set_result').length + 1}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* HOME TEAM */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h3 className="font-bold text-sm text-center mb-3 text-gray-800 truncate">{matchInfo.match.home_team_name}</h3>
                <select value={selectedHomePlayer} onChange={(e) => setSelectedHomePlayer(e.target.value)}
                  className="w-full px-2 py-3 border border-gray-300 rounded-lg text-sm mb-4 bg-white font-medium">
                  <option value="">-- Jugador --</option>
                  {(hasLineups ? homeStarting : matchInfo.homePlayers.map((p: any) => p.name)).map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div className="space-y-2">
                  {sport === 'futsal' && (
                    <>
                      <button onClick={() => recordIncident('goal', sheetData.homeTeamId, selectedHomePlayer)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded shadow-sm font-bold text-sm">Gol</button>
                      <button onClick={() => recordIncident('yellow_card', sheetData.homeTeamId, selectedHomePlayer)}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded shadow-sm font-bold text-sm">Groc</button>
                      <button onClick={() => recordIncident('red_card', sheetData.homeTeamId, selectedHomePlayer)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded shadow-sm font-bold text-sm">Vermell</button>
                      <button onClick={() => openSubModal(sheetData.homeTeamId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">Canvi</button>
                      <button onClick={() => recordIncident('injury', sheetData.homeTeamId, selectedHomePlayer)}
                        className="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded shadow-sm font-bold text-sm">Lesio</button>
                      <button onClick={() => recordIncident('timeout', sheetData.homeTeamId)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded shadow-sm font-bold text-sm">Timeout</button>
                    </>
                  )}
                  {sport === 'basquet3x3' && (
                    <>
                      <button onClick={() => recordIncident('1pt', sheetData.homeTeamId, selectedHomePlayer, 1)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">1 Punt</button>
                      <button onClick={() => recordIncident('2pt', sheetData.homeTeamId, selectedHomePlayer, 2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded shadow-sm font-bold text-sm">2 Punts</button>
                      <button onClick={() => recordIncident('foul', sheetData.homeTeamId, selectedHomePlayer)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded shadow-sm font-bold text-sm">Falta</button>
                      <button onClick={() => openSubModal(sheetData.homeTeamId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">Canvi</button>
                    </>
                  )}
                </div>
              </div>

              {/* AWAY TEAM */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h3 className="font-bold text-sm text-center mb-3 text-gray-800 truncate">{matchInfo.match.away_team_name}</h3>
                <select value={selectedAwayPlayer} onChange={(e) => setSelectedAwayPlayer(e.target.value)}
                  className="w-full px-2 py-3 border border-gray-300 rounded-lg text-sm mb-4 bg-white font-medium">
                  <option value="">-- Jugador --</option>
                  {(hasLineups ? awayStarting : matchInfo.awayPlayers.map((p: any) => p.name)).map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div className="space-y-2">
                  {sport === 'futsal' && (
                    <>
                      <button onClick={() => recordIncident('goal', sheetData.awayTeamId, selectedAwayPlayer)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded shadow-sm font-bold text-sm">Gol</button>
                      <button onClick={() => recordIncident('yellow_card', sheetData.awayTeamId, selectedAwayPlayer)}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded shadow-sm font-bold text-sm">Groc</button>
                      <button onClick={() => recordIncident('red_card', sheetData.awayTeamId, selectedAwayPlayer)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded shadow-sm font-bold text-sm">Vermell</button>
                      <button onClick={() => openSubModal(sheetData.awayTeamId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">Canvi</button>
                      <button onClick={() => recordIncident('injury', sheetData.awayTeamId, selectedAwayPlayer)}
                        className="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded shadow-sm font-bold text-sm">Lesio</button>
                      <button onClick={() => recordIncident('timeout', sheetData.awayTeamId)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded shadow-sm font-bold text-sm">Timeout</button>
                    </>
                  )}
                  {sport === 'basquet3x3' && (
                    <>
                      <button onClick={() => recordIncident('1pt', sheetData.awayTeamId, selectedAwayPlayer, 1)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">1 Punt</button>
                      <button onClick={() => recordIncident('2pt', sheetData.awayTeamId, selectedAwayPlayer, 2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded shadow-sm font-bold text-sm">2 Punts</button>
                      <button onClick={() => recordIncident('foul', sheetData.awayTeamId, selectedAwayPlayer)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded shadow-sm font-bold text-sm">Falta</button>
                      <button onClick={() => openSubModal(sheetData.awayTeamId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded shadow-sm font-bold text-sm">Canvi</button>
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
            <CheckCircle size={18} /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Incidents Log */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="font-semibold text-gray-800">Registre ({sheetData.incidents.length})</h3>
            <button onClick={undoLastIncident} disabled={sheetData.incidents.length === 0}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 disabled:text-gray-300 font-medium">
              <Undo2 size={16} /> Desfer ultim
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

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button onClick={() => setShowConfirmModal(true)}
            disabled={!hasLineups}
            className="flex-1 py-4 px-4 rounded-xl font-bold text-lg bg-[#D85A30] hover:bg-[#C24620] text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
            Tancar Acta
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Tancar Acta?</h2>
            <p className="text-center text-gray-600 mb-8">
              Aquesta accio es irreversible. L'acta es tancara permanentment i es generara el PDF oficial.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold"
                disabled={finalizingMatch}>Cancel·lar</button>
              <button onClick={finalizeMatch}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex justify-center items-center"
                disabled={finalizingMatch}>
                {finalizingMatch ? 'Tancant...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderSubModal()}
    </div>
  );
}
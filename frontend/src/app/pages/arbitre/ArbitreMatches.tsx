import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Edit3, Clock, MapPin, AlertCircle, CheckCircle, Download, Lock, ArrowLeft, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [tournamentName, setTournamentName] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = tournamentId
        ? `${API_BASE_URL}/arbitre/matches?tournamentId=${tournamentId}`
        : `${API_BASE_URL}/arbitre/matches`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);

      // Try to get tournament name from first match's tournament
      if (data.length > 0 && tournamentId) {
        const tRes = await fetch(`${API_BASE_URL}/arbitre/tournaments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tRes.ok) {
          const tournaments = await tRes.json();
          const t = tournaments.find((t: any) => t.id === parseInt(tournamentId));
          if (t) setTournamentName(t.name);
        }
      }
      setLoading(false);
    } catch (err) {
      setError('Error carregant partits');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (matchId: number) => {
    try {
      setDownloading(matchId);
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
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'pendent': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendent' },
      'en_curs': { color: 'bg-blue-100 text-blue-800', label: 'En curs' },
      'finalitzat': { color: 'bg-green-100 text-green-800', label: 'Finalitzat' },
      'cancel·lat': { color: 'bg-red-100 text-red-800', label: 'Cancel·lat' }
    };
    return statusMap[status] || statusMap['pendent'];
  };

  const getSheetBadge = (sheetStatus?: string) => {
    if (!sheetStatus) return { color: 'bg-gray-100 text-gray-500', icon: null, label: 'Sense acta' };
    if (sheetStatus === 'actiu') return { color: 'bg-blue-100 text-blue-700', icon: Edit3, label: 'Acta oberta' };
    if (sheetStatus === 'tancat') return { color: 'bg-amber-100 text-amber-700', icon: Lock, label: 'Acta tancada' };
    if (sheetStatus === 'immutable') return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Acta finalitzada' };
    return { color: 'bg-gray-100 text-gray-500', icon: null, label: sheetStatus };
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
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {tournamentId && (
              <button onClick={() => navigate('/arbitre/partits')} className="flex items-center gap-2 text-[#5F5E5A] hover:text-[#D85A30] mb-4 transition-colors">
                <ArrowLeft size={18} /> Tots els torneigs
              </button>
            )}
            <h1 className="text-3xl font-bold text-[#D85A30] mb-2">
              {tournamentName || 'Els meus partits'}
            </h1>
            <p className="text-gray-600">Total: {matches.length} partits</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={18} /> Tancar sessió
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No hi ha cap partit assignat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const statusInfo = getStatusBadge(match.status);
              const sheetBadge = getSheetBadge(match.sheet_status);
              const SheetIcon = sheetBadge.icon;

              return (
                <div key={match.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${sheetBadge.color}`}>
                          {SheetIcon && <SheetIcon size={14} />}
                          {sheetBadge.label}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                        {match.home_team_name} <span className="text-[#D85A30]">vs</span> {match.away_team_name}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#D85A30]" />
                          {new Date(match.match_date).toLocaleDateString('ca-ES')} -{' '}
                          {new Date(match.match_date).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#D85A30]" />
                          {match.court_name || 'Pista no assignada'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D85A30] font-semibold">Esport:</span>
                          <span className="capitalize">{match.sport || 'futsal'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {match.sheet_status === 'immutable' ? (
                        <button onClick={() => handleDownloadPDF(match.id)} disabled={downloading === match.id}
                          className="flex-1 sm:flex-none px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
                          <Download size={18} />
                          {downloading === match.id ? 'Descarregant...' : 'PDF'}
                        </button>
                      ) : (
                        <Link to={`/arbitre/match/${match.id}`}
                          className="flex-1 sm:flex-none px-6 py-3 bg-[#D85A30] hover:bg-[#C24620] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition">
                          <Edit3 size={18} />
                          <span>Acta</span>
                        </Link>
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

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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Trophy, ChevronDown, ChevronRight, MapPin, Clock, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Tournament {
  id: number;
  name: string;
  sport: string;
  format: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  total_matches: number;
  completed_matches: number;
  court_count: number;
}

interface Match {
  id: number;
  home_team_name: string;
  away_team_name: string;
  court_name: string;
  match_date: string;
  status: string;
  home_score?: number;
  away_score?: number;
}

const sportLabels: Record<string, string> = { futsal: 'Futbol Sala', basquet3x3: 'Bàsquet 3x3', padel: 'Pàdel' };
const formatLabels: Record<string, string> = { lliga: 'Lliga', grups: 'Grups', eliminatoria: 'Eliminatòria', mixt: 'Mixt' };

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    finalitzat: 'bg-green-100 text-green-800',
    en_curs: 'bg-yellow-100 text-yellow-800',
    pendent: 'bg-gray-100 text-gray-600',
    cancel·lat: 'bg-red-100 text-red-800',
  };
  return variants[status] || 'bg-gray-100 text-gray-600';
}

export default function AdminCalendar() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [matchData, setMatchData] = useState<Record<number, Match[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/admin/tournaments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        setTournaments(await res.json());
      } catch {
        setError('Error carregant torneigs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (!matchData[id]) {
      setLoadingMatches(prev => ({ ...prev, [id]: true }));
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/admin/tournaments/${id}/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMatchData(prev => ({ ...prev, [id]: data }));
        }
      } catch {
        // ignore
      } finally {
        setLoadingMatches(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
        <div className="max-w-4xl mx-auto pt-8 text-center text-gray-600">Carregant calendaris...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D85A30] mb-2">Calendaris</h1>
        <p className="text-gray-600 mb-8">Tots els torneigs i els seus partits</p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 mb-6">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">No hi ha torneigs creats</p>
            <button onClick={() => navigate('/admin/configurator')}
              className="px-6 py-3 bg-[#D85A30] text-white rounded-lg hover:bg-[#c04f2a] transition">
              Crear primer torneig
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => (
              <div key={t.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button onClick={() => toggleExpand(t.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-[#FAECE7]/30 transition text-left">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                      <span className="text-sm px-3 py-0.5 bg-[#FAECE7] text-[#D85A30] rounded-full font-medium">
                        {sportLabels[t.sport] || t.sport}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Trophy size={14} /> {formatLabels[t.format] || t.format}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} />{t.start_date ? new Date(t.start_date).toLocaleDateString('ca-ES') : '?'} - {t.end_date ? new Date(t.end_date).toLocaleDateString('ca-ES') : '?'}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} />{t.court_count} pistes</span>
                      <span>{t.completed_matches}/{t.total_matches} partits</span>
                    </div>
                  </div>
                  {expandedId === t.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                </button>

                {expandedId === t.id && (
                  <div className="border-t border-gray-100">
                    {loadingMatches[t.id] ? (
                      <div className="p-8 text-center text-gray-400"><Loader className="inline animate-spin mr-2" size={18} />Carregant partits...</div>
                    ) : matchData[t.id]?.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No hi ha partits en aquest torneig</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {matchData[t.id]?.map((m: Match) => (
                          <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {m.home_team_name} vs {m.away_team_name}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <Clock size={14} />{new Date(m.match_date).toLocaleString('ca-ES')}
                                {m.court_name && <><span>·</span><MapPin size={14} />{m.court_name}</>}
                              </div>
                              {m.status === 'finalitzat' && m.home_score !== undefined && (
                                <div className="text-sm mt-1 font-medium text-gray-600">
                                  {m.home_score} - {m.away_score}
                                </div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(m.status)}`}>
                              {m.status === 'finalitzat' ? 'Finalitzat' : m.status === 'en_curs' ? 'En curs' : m.status === 'pendent' ? 'Pendent' : m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

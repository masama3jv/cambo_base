import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Trophy, ChevronRight, AlertCircle, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Tournament {
  id: number;
  name: string;
  sport: string;
  start_date: string;
  end_date: string;
  status: string;
  match_count: number;
  completed_count: number;
}

const sportLabels: Record<string, string> = { futsal: 'Futbol Sala', basquet3x3: 'Bàsquet 3x3', padel: 'Pàdel' };

export default function ArbitreTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/arbitre/tournaments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        setTournaments(await res.json());
      } catch {
        setError('Error carregant els torneigs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
        <div className="max-w-3xl mx-auto pt-8 text-center text-gray-600">Carregant torneigs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAECE7] to-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D85A30] mb-2">Els meus torneigs</h1>
            <p className="text-gray-600">Selecciona un torneig per veure els partits assignats</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={18} /> Tancar sessió
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 mb-6">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No tens cap torneig assignat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => (
              <div key={t.id} onClick={() => navigate(`/arbitre/partits/${t.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="px-3 py-1 bg-[#FAECE7] text-[#D85A30] rounded-full font-medium">
                        {sportLabels[t.sport] || t.sport}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(t.start_date).toLocaleDateString('ca-ES')} - {new Date(t.end_date).toLocaleDateString('ca-ES')}
                      </span>
                      <span className="text-gray-500">
                        {t.completed_count}/{t.match_count} partits jugats
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

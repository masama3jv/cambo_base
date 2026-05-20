import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Team {
  id: number;
  name: string;
  sport: string;
  status: string;
}

export default function JugadorProfile() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<{ id: number; name: string; email: string; dorsal: number | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        const dashRes = await fetch('/api/jugador/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!dashRes.ok) throw new Error('Failed to load profile');
        const dashData = await dashRes.json();

        if (!dashData.team) {
          setError('No estàs en cap equip.');
          return;
        }

        setTeam(dashData.team);

        const playersRes = await fetch(`/api/teams/${dashData.team.id}/players`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (playersRes.ok) setPlayers(await playersRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'actiu': case 'inscrit': return 'approved';
      case 'pendent_docs': case 'pendent_pagament': case 'pendent_validacio': return 'pending';
      default: return 'pending';
    }
  };
  const statusLabel = (status: string) => {
    switch (status) {
      case 'actiu': return 'Actiu';
      case 'inscrit': return 'Inscrit';
      case 'pendent_docs': return 'Pendent documents';
      case 'pendent_pagament': return 'Pendent pagament';
      case 'pendent_validacio': return 'Pendent validació';
      default: return status;
    }
  };
  const sportLabel = (s: string) => {
    if (s === 'futsal') return 'Futbol Sala';
    if (s === 'basquet3x3') return 'Bàsquet 3x3';
    if (s === 'padel') return 'Pàdel';
    return s;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8"><p className="text-[#5F5E5A]">Carregant...</p></main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8">
          <Card className="p-6 text-center"><p className="text-[#5F5E5A]">{error}</p></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-8">El meu perfil</h1>

          {team && (
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Card>
                <h3 className="mb-4">Equip</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[13px] text-[#5F5E5A]">Nom</p>
                    <p className="font-medium">{team.name}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#5F5E5A]">Esport</p>
                    <p className="font-medium">{sportLabel(team.sport)}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#5F5E5A]">Estat</p>
                    <Badge variant={statusColor(team.status)}>{statusLabel(team.status)}</Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="mb-4">Informació</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[13px] text-[#5F5E5A]">Esport</p>
                    <p className="font-medium">{sportLabel(team.sport)}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#5F5E5A]">Rol</p>
                    <p className="font-medium">Jugador</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Card>
            <h3 className="mb-6">Jugadors de l'equip</h3>
            {players.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha jugadors</p>
            ) : (
              <div className="space-y-3">
                {players.map(p => (
                  <div key={p.id} className="p-3 bg-[#F1EFE8] rounded-lg flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#E8E6DC] rounded-full flex items-center justify-center">
                      <Users size={18} className="text-[#5F5E5A]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2C2C2A]">{p.name}</p>
                      <p className="text-[13px] text-[#5F5E5A]">
                        Dorsal: {p.dorsal || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

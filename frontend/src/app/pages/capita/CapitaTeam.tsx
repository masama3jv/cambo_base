import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { UserPlus, Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  dniStatus: 'approved' | 'pending' | 'rejected';
  insuranceStatus: 'approved' | 'pending' | 'rejected';
}

export default function CapitaTeam() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        setIsLoading(true);
        // API call to get team players would go here
        // For now, simulate empty state for new teams
        const response = await fetch('/api/team/players');
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading players');
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamPlayers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">Error: {error}</p>
              <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="mb-8">El meu equip</h1>
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-[#D85A30]" />
              </div>
              <h3 className="mb-2">Encara no has afegit cap jugador al teu equip</h3>
              <p className="text-[#5F5E5A] mb-6">
                Comença a formar el teu equip convidant els jugadors
              </p>
              <Button variant="primary" className="flex items-center gap-2 mx-auto">
                <UserPlus size={18} />
                Convidar jugador
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1>El meu equip</h1>
            <Button variant="primary" className="flex items-center gap-2">
              <UserPlus size={18} />
              Convidar jugador
            </Button>
          </div>

          <div className="space-y-4">
            {players.map((player) => (
              <Card key={player.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#2C2C2A] mb-3">{player.name}</p>
                    <div className="flex gap-2">
                      <Badge variant={player.dniStatus}>
                        DNI: {player.dniStatus === 'approved' ? 'Aprovat' : player.dniStatus === 'pending' ? 'Pendent' : 'Rebutjat'}
                      </Badge>
                      <Badge variant={player.insuranceStatus}>
                        Assegurança: {player.insuranceStatus === 'approved' ? 'Aprovat' : player.insuranceStatus === 'pending' ? 'Pendent' : 'Rebutjat'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

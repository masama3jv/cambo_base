import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { UserPlus, Users, X, CheckCircle } from 'lucide-react';
import { Input } from '../../components/Input';

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
  
  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setInviteStatus('loading');
    try {
      // API call to send invitation would go here
      // const response = await fetch('/api/team/invite', { method: 'POST', body: JSON.stringify({ email: inviteEmail }) });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      setInviteStatus('success');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteStatus('idle');
        setInviteEmail('');
      }, 2000);
    } catch (err) {
      setInviteStatus('error');
    }
  };

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
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setPlayers(data.players || []);
        } else {
          throw new Error('Invalid response from server');
        }
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
              <Button variant="primary" className="flex items-center gap-2 mx-auto" onClick={() => setIsInviteModalOpen(true)}>
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
            <Button variant="primary" className="flex items-center gap-2" onClick={() => setIsInviteModalOpen(true)}>
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

        {/* Invite Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md relative">
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteStatus('idle');
                  setInviteEmail('');
                }}
                className="absolute right-4 top-4 text-[#5F5E5A] hover:text-[#2C2C2A]"
              >
                <X size={20} />
              </button>
              
              <h3 className="mb-2">Convidar un jugador</h3>
              <p className="text-[#5F5E5A] mb-6 text-[14px]">
                Enviarem un correu electrònic amb un enllaç perquè el jugador s'uneixi al teu equip.
              </p>

              {inviteStatus === 'success' ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="text-[#3B6D11] mx-auto mb-4" />
                  <p className="font-medium text-[#2C2C2A]">Invitació enviada correctament!</p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <Input
                    label="Correu electrònic del jugador"
                    type="email"
                    placeholder="jugador@exemple.cat"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    disabled={inviteStatus === 'loading'}
                  />
                  {inviteStatus === 'error' && (
                    <p className="text-[#A32D2D] text-[13px]">Hi ha hagut un error en enviar la invitació.</p>
                  )}
                  <div className="flex justify-end gap-3 mt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsInviteModalOpen(false)}
                      disabled={inviteStatus === 'loading'}
                    >
                      Cancel·lar
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={inviteStatus === 'loading'}
                    >
                      {inviteStatus === 'loading' ? 'Enviant...' : 'Enviar invitació'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

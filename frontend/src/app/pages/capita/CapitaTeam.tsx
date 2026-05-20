import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { UserPlus, Users, X, CheckCircle, Trophy, Plus } from 'lucide-react';
import { Input } from '../../components/Input';

interface Player {
  id: string;
  name: string;
  dniStatus: 'approved' | 'pending' | 'rejected';
  insuranceStatus: 'approved' | 'pending' | 'rejected';
}

export default function CapitaTeam() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [team, setTeam] = useState<any | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create team states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('futsal');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !teamId) return;
    
    setInviteStatus('loading');
    setInviteError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${teamId}/invite-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setInviteError(data.error || 'Error en enviar la invitació');
        setInviteStatus('error');
        return;
      }
      
      setInviteStatus('success');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteStatus('idle');
        setInviteEmail('');
        setInviteError(null);
        // Refresh players list
        window.location.reload();
      }, 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error en enviar la invitació');
      setInviteStatus('error');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreatingTeam(true);
    setCreateTeamError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTeamName, sport: newTeamSport })
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateTeamError(data.error || 'Error al crear l\'equip');
        return;
      }

      window.location.reload();
    } catch (err) {
      setCreateTeamError(err instanceof Error ? err.message : 'Error al crear l\'equip');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        // Get team info first
        const teamResponse = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!teamResponse.ok) {
          // If 401 or similar, show error
          if (teamResponse.status === 401) {
            throw new Error('Unauthorized');
          }
          // Otherwise, assume no team exists (200 with empty array is expected)
        }
        
        const teams = await teamResponse.json();
        if (teams && teams.length > 0) {
          setTeam(teams[0]);
          setTeamId(teams[0].id);
          
          // Get team players
          const playersResponse = await fetch(`/api/teams/${teams[0].id}/players`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (playersResponse.ok) {
            const playersData = await playersResponse.json();
            setPlayers(playersData || []);
          }
        } else {
          setTeam(null);
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

  if (!team) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Card className="p-8">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={32} className="text-[#D85A30]" />
              </div>
              <h2 className="text-center mb-2">Crea el teu equip</h2>
              <p className="text-[#5F5E5A] text-center mb-8 text-[14px]">
                Com a capità, primer has de crear el teu equip per poder inscriure'l als tornejos i convidar els teus jugadors.
              </p>
              
              <form onSubmit={handleCreateTeam} className="space-y-6">
                <Input
                  label="Nom de l'equip"
                  type="text"
                  placeholder="Ex. Els Cracks de CampoBase"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  disabled={isCreatingTeam}
                />
                
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-medium uppercase tracking-wider text-[#2C2C2A]">
                    Esport
                  </label>
                  <select
                    value={newTeamSport}
                    onChange={(e) => setNewTeamSport(e.target.value)}
                    className="h-9 px-3 py-2 bg-white border-[0.5px] border-[#D3D1C7] rounded-lg text-[15px] focus:outline-none focus:border-[#D85A30] transition-colors w-full"
                    disabled={isCreatingTeam}
                  >
                    <option value="futsal">Futbol Sala</option>
                    <option value="basquet3x3">Bàsquet 3x3</option>
                    <option value="padel">Pàdel</option>
                  </select>
                </div>

                {createTeamError && (
                  <p className="text-[#A32D2D] text-[13px] text-center">{createTeamError}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isCreatingTeam}
                >
                  <Plus size={18} />
                  {isCreatingTeam ? 'Creant equip...' : 'Crear Equip'}
                </Button>
              </form>
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
                  {inviteError && (
                    <p className="text-[#A32D2D] text-[13px]">{inviteError}</p>
                  )}
                  <div className="flex justify-end gap-3 mt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setIsInviteModalOpen(false);
                        setInviteStatus('idle');
                        setInviteEmail('');
                        setInviteError(null);
                      }}
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

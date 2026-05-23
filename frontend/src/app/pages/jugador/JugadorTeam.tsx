import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { API_BASE_URL } from '../../services/api';
import { Users, FileText, Shield } from 'lucide-react';

interface PlayerDoc {
  document_type: string;
  status: string;
  rejection_reason?: string;
}

interface Player {
  id: number;
  name: string;
  email: string;
  dorsal?: number;
  position?: string;
  documents: PlayerDoc[];
}

interface Team {
  id: number;
  name: string;
  sport: string;
  status: string;
  invite_code?: string;
}

const DOC_LABELS: Record<string, string> = { dni: 'DNI', asseguranca: 'Assegurança', image_rights: 'Dret d\'imatge' };
const DOC_ORDER = ['dni', 'asseguranca', 'image_rights'];

export default function JugadorTeam() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Get the jugador's team
        const teamRes = await fetch(`${API_BASE_URL}/teams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!teamRes.ok) throw new Error('No team found');
        const teams = await teamRes.json();
        const t = Array.isArray(teams) ? teams[0] : teams;
        if (!t) throw new Error('No team found');
        setTeam(t);

        // Get players with document status
        const playersRes = await fetch(`${API_BASE_URL}/admin/inscriptions/${t.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (playersRes.ok) {
          const data = await playersRes.json();
          const enriched = (data.players || []).map((p: Player) => ({
            ...p,
            documents: DOC_ORDER.map(type => {
              const existing = (p.documents || []).find((d: PlayerDoc) => d.document_type === type);
              return existing || { document_type: type, status: 'no_uploaded' };
            })
          }));
          setPlayers(enriched);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading team');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const docBadge = (status: string) => {
    const map: Record<string, { label: string; variant: string }> = {
      aprovat: { label: 'Acceptat', variant: 'approved' },
      rebutjat: { label: 'Denegat', variant: 'rejected' },
      pendent: { label: 'Pendent de validar', variant: 'pending' },
      no_uploaded: { label: 'No pujat', variant: 'pending' },
    };
    const m = map[status] || { label: status, variant: 'pending' };
    return <Badge variant={m.variant as any}>{m.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8"><p className="text-[#5F5E5A]">Carregant...</p></main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="jugador" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-md text-center p-8">
            <Users size={48} className="mx-auto text-[#5F5E5A] mb-4" />
            <p className="text-[#5F5E5A]">{error || 'No estàs assignat a cap equip.'}</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">El meu equip</h1>

          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2C2C2A]">{team.name}</h3>
                <Badge variant="info">{team.sport}</Badge>
                <span className={`ml-2 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                  team.status === 'actiu' ? 'bg-purple-100 text-purple-800' :
                  team.status === 'inscrit' ? 'bg-green-100 text-green-800' :
                  team.status === 'pendent_pagament' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {team.status === 'pendent_docs' ? 'Pendent documents' :
                   team.status === 'pendent_pagament' ? 'Pendent pagament' :
                   team.status === 'inscrit' ? 'Inscrit' :
                   team.status === 'actiu' ? 'Actiu' : team.status}
                </span>
              </div>
            </div>
          </Card>

          <h2 className="text-lg font-bold text-[#2C2C2A] mb-4 flex items-center gap-2">
            <Users size={20} /> Plantilla ({players.length} jugadors)
          </h2>

          <div className="space-y-4">
            {players.map(player => (
              <Card key={player.id}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#D85A30] font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#2C2C2A]">{player.name}</p>
                    <p className="text-[13px] text-[#5F5E5A]">{player.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {player.documents.map(doc => (
                    <div key={doc.document_type} className="flex items-center justify-between p-3 bg-[#F1EFE8] rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#5F5E5A]" />
                        <span className="text-[13px] text-[#2C2C2A]">{DOC_LABELS[doc.document_type]}</span>
                      </div>
                      {docBadge(doc.status)}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

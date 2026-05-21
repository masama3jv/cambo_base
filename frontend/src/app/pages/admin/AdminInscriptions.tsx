import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { API_BASE_URL } from '../../services/api';

interface TeamInscription {
  id: string;
  name: string;
  sport: string;
  captain: string;
  status: string;
  playerCount: number;
  approvedDocs: number;
  totalDocs: number;
}

export default function AdminInscriptions() {
  const [teams, setTeams] = useState<TeamInscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInscriptions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      } else {
        throw new Error('Failed to fetch inscriptions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading inscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInscriptions(); }, []);

  const handleApprove = async (teamId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions/${teamId}/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
      } else {
        alert('Error al aprovar la inscripció');
      }
    } catch (err) {
      alert('Error al aprovar la inscripció');
    }
  };

  const handleReject = async (teamId: string) => {
    if (!confirm('Segur que vols rebutjar aquesta inscripció?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions/${teamId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
      } else {
        alert('Error al rebutjar la inscripció');
      }
    } catch (err) {
      alert('Error al rebutjar la inscripció');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8"><p className="text-[#5F5E5A]">Carregant...</p></main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <Card className="p-6 text-center">
            <p className="text-[#A32D2D]">Error: {error}</p>
            <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-2">Validació d'inscripcions</h1>
          <p className="text-[#5F5E5A] mb-8">Revisa i valida els equips inscrits</p>

          <Card>
            {teams.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha inscripcions pendents de validació</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D3D1C7]">
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Equip</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Esport</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Capità</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Jugadors</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Docs</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Estat</th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.id} className="border-b border-[#D3D1C7] last:border-0">
                        <td className="py-4 px-4 font-medium text-[#2C2C2A]">{team.name}</td>
                        <td className="py-4 px-4"><Badge variant="info">{team.sport}</Badge></td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.captain}</td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.playerCount}</td>
                        <td className="py-4 px-4">
                          <Badge variant={team.approvedDocs === team.totalDocs && team.totalDocs > 0 ? 'approved' : 'pending'}>
                            {team.approvedDocs}/{team.totalDocs}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="pending">Pendent</Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="primary" className="mr-2" onClick={() => handleApprove(team.id)}>
                            Aprovar
                          </Button>
                          <Button variant="ghost" onClick={() => handleReject(team.id)}>
                            Rebutjar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { API_BASE_URL } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

interface PlayerDoc {
  id?: number;
  type: string;
  status: string;
  rejection_reason?: string;
}

interface Player {
  id: number;
  name: string;
  email: string;
  documents: PlayerDoc[];
}

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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ playerId: number; docType: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const DOC_LABELS: Record<string, string> = { dni: 'DNI', asseguranca: 'Assegurança', image_rights: 'Dret d\'imatge' };
  const DOC_ORDER = ['dni', 'asseguranca', 'image_rights'];

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

  const fetchTeamDetail = async (teamId: string) => {
    setLoadingDetail(true);
    setSelectedTeamId(teamId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.team);
        // Normalize: ensure each player has 3 doc slots
        const enriched = data.players.map((p: Player) => ({
          ...p,
          documents: DOC_ORDER.map(type => {
            const existing = (p.documents || []).find((d: PlayerDoc) => d.type === type);
            return existing || { type, status: 'no_uploaded', rejection_reason: undefined };
          })
        }));
        setPlayers(enriched);
      }
    } catch {
      setError('Error loading team details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApproveDoc = async (playerId: number, docType: string) => {
    try {
      const token = localStorage.getItem('token');
      const doc = players.find(p => p.id === playerId)?.documents.find(d => d.type === docType);
      if (!doc?.id) return;
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions/${selectedTeamId}/approve-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentId: doc.id }),
      });
      if (response.ok) {
        fetchTeamDetail(selectedTeamId!);
        fetchInscriptions();
      } else {
        const err = await response.json();
        alert(err.error || 'Error');
      }
    } catch {
      alert('Error approving document');
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const doc = players.find(p => p.id === rejectModal.playerId)?.documents.find(d => d.type === rejectModal.docType);
      if (!doc?.id) return;
      const response = await fetch(`${API_BASE_URL}/admin/inscriptions/${selectedTeamId}/reject-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentId: doc.id, reason: rejectReason }),
      });
      if (response.ok) {
        setRejectModal(null);
        setRejectReason('');
        fetchTeamDetail(selectedTeamId!);
        fetchInscriptions();
      } else {
        const err = await response.json();
        alert(err.error || 'Error');
      }
    } catch {
      alert('Error rejecting document');
    }
  };

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

  const statusColor = (status: string) => {
    const map: Record<string, string> = { pendent_docs: 'bg-yellow-100 text-yellow-800', pendent_pagament: 'bg-blue-100 text-blue-800', inscrit: 'bg-green-100 text-green-800', actiu: 'bg-purple-100 text-purple-800' };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  // Detail view
  if (selectedTeamId) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <button onClick={() => { setSelectedTeamId(null); setPlayers([]); setTeamInfo(null); }} className="flex items-center gap-2 text-[#5F5E5A] hover:text-[#D85A30] mb-6 transition-colors">
              <ArrowLeft size={18} /> Tornar a la llista
            </button>

            {loadingDetail ? (
              <p className="text-[#5F5E5A]">Carregant...</p>
            ) : (
              <>
                <h1 className="mb-2">{teamInfo?.name || 'Equip'}</h1>
                <p className="text-[#5F5E5A] mb-8">Revisa els documents de cada jugador</p>

                {players.map(player => (
                  <Card key={player.id} className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#D85A30] font-bold text-lg">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium text-[#2C2C2A]">{player.name}</h3>
                          <p className="text-[13px] text-[#5F5E5A]">{player.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {player.documents.map(doc => (
                        <div key={doc.type} className="flex items-center justify-between p-4 bg-[#F1EFE8] rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-[#5F5E5A]" />
                            <div>
                              <p className="font-medium text-[#2C2C2A]">{DOC_LABELS[doc.type] || doc.type}</p>
                              <div className="mt-1">{docBadge(doc.status)}</div>
                              {doc.rejection_reason && (
                                <p className="text-[12px] text-[#A32D2D] mt-1">Motiu: {doc.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {doc.status !== 'aprovat' && doc.id && (
                              <Button variant="primary" className="text-sm px-3 py-1.5" onClick={() => handleApproveDoc(player.id, doc.type)}>
                                <CheckCircle size={16} className="mr-1" /> Aprovar
                              </Button>
                            )}
                            {doc.status !== 'rebutjat' && doc.id && (
                              <Button variant="ghost" className="text-sm px-3 py-1.5 text-red-600" onClick={() => setRejectModal({ playerId: player.id, docType: doc.type })}>
                                <XCircle size={16} className="mr-1" /> Denegar
                              </Button>
                            )}
                            {!doc.id && (
                              <p className="text-[13px] text-[#5F5E5A] italic self-center">Sense document</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </main>

        {/* Reject modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Denegar document</h3>
              <p className="text-[#5F5E5A] mb-4 text-sm">Introdueix el motiu pel qual es denega aquest document:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#D3D1C7] rounded-lg mb-4 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#D85A30]"
                placeholder="Motiu de la denegació..."
              />
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel·lar</Button>
                <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleRejectDoc} disabled={!rejectReason.trim()}>Denegar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
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
          <p className="text-[#5F5E5A] mb-8">Revisa i valida els documents de cada equip</p>

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
                      <tr key={team.id} className="border-b border-[#D3D1C7] last:border-0 hover:bg-[#F9F8F4] cursor-pointer" onClick={() => fetchTeamDetail(team.id)}>
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
                          <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${statusColor(team.status)}`}>
                            {team.status === 'pendent_docs' ? 'Pendent docs' : team.status === 'pendent_pagament' ? 'Pendent pagament' : team.status === 'pendent_validacio' ? 'Pendent validació' : team.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="primary" className="text-sm" onClick={(e) => { e.stopPropagation(); fetchTeamDetail(team.id); }}>
                            <FileText size={16} className="mr-1" /> Revisar
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

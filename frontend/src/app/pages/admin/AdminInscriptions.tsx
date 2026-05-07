import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface Player {
  name: string;
  dni: { status: 'approved' | 'pending' | 'rejected'; fileName: string };
  insurance: { status: 'approved' | 'pending' | 'rejected'; fileName: string };
}

interface Team {
  id: number;
  name: string;
  sport: string;
  captain: string;
  players: Player[];
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminInscriptions() {
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 1,
      name: 'FC Barcelona',
      sport: 'Futsal',
      captain: 'Joan Garcia',
      status: 'pending',
      players: [
        {
          name: 'Joan Garcia',
          dni: { status: 'pending', fileName: 'dni_joan.pdf' },
          insurance: { status: 'pending', fileName: 'insurance_joan.pdf' },
        },
        {
          name: 'Marc López',
          dni: { status: 'pending', fileName: 'dni_marc.pdf' },
          insurance: { status: 'pending', fileName: 'insurance_marc.pdf' },
        },
      ],
    },
    {
      id: 2,
      name: 'Real Madrid CF',
      sport: 'Bàsquet 3x3',
      captain: 'Sergio Ramos',
      status: 'pending',
      players: [
        {
          name: 'Sergio Ramos',
          dni: { status: 'pending', fileName: 'dni_sergio.pdf' },
          insurance: { status: 'pending', fileName: 'insurance_sergio.pdf' },
        },
      ],
    },
  ]);

  const handleApproveDocument = (teamId: number, playerName: string, docType: 'dni' | 'insurance') => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          players: team.players.map((player) => {
            if (player.name !== playerName) return player;
            return {
              ...player,
              [docType]: { ...player[docType], status: 'approved' as const },
            };
          }),
        };
      })
    );
  };

  const handleRejectDocument = (teamId: number, playerName: string, docType: 'dni' | 'insurance') => {
    if (!rejectReason.trim()) return;
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          players: team.players.map((player) => {
            if (player.name !== playerName) return player;
            return {
              ...player,
              [docType]: { ...player[docType], status: 'rejected' as const },
            };
          }),
        };
      })
    );
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-2">Validació d'inscripcions</h1>
          <p className="text-[#5F5E5A] mb-8">
            Revisa i valida els documents dels equips inscrits
          </p>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D3D1C7]">
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider w-12">
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Equip
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Esport
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Capità
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Nº Jugadors
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Estat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <>
                      <tr
                        key={team.id}
                        className="border-b border-[#D3D1C7] cursor-pointer hover:bg-[#F1EFE8]"
                        onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      >
                        <td className="py-4 px-4">
                          {expandedTeam === team.id ? (
                            <ChevronDown size={20} className="text-[#5F5E5A]" />
                          ) : (
                            <ChevronRight size={20} className="text-[#5F5E5A]" />
                          )}
                        </td>
                        <td className="py-4 px-4 font-medium text-[#2C2C2A]">{team.name}</td>
                        <td className="py-4 px-4">
                          <Badge variant="info">{team.sport}</Badge>
                        </td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.captain}</td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{team.players.length}</td>
                        <td className="py-4 px-4">
                          <Badge variant={team.status}>{team.status === 'pending' ? 'Pendent validació' : team.status === 'approved' ? 'Aprovat' : 'Rebutjat'}</Badge>
                        </td>
                      </tr>
                      {expandedTeam === team.id && (
                        <tr>
                          <td colSpan={6} className="p-6 bg-[#F1EFE8]">
                            <div className="space-y-4">
                              {team.players.map((player, i) => (
                                <Card key={i}>
                                  <h4 className="mb-4">{player.name}</h4>
                                  <div className="grid grid-cols-2 gap-6">
                                    {/* DNI */}
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <label className="text-[12px] font-medium uppercase tracking-wider">
                                          DNI
                                        </label>
                                        <Badge variant={player.dni.status}>
                                          {player.dni.status === 'approved' ? 'Aprovat' : player.dni.status === 'pending' ? 'Pendent' : 'Rebutjat'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mb-3">
                                        <FileText size={20} className="text-[#5F5E5A]" />
                                        <p className="text-[13px] text-[#2C2C2A]">{player.dni.fileName}</p>
                                      </div>
                                      {player.dni.status === 'pending' && (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="primary"
                                            onClick={() => handleApproveDocument(team.id, player.name, 'dni')}
                                          >
                                            Aprovar
                                          </Button>
                                          <Button variant="ghost" onClick={() => setShowRejectModal(true)}>
                                            Rebutjar
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Insurance */}
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <label className="text-[12px] font-medium uppercase tracking-wider">
                                          Assegurança mèdica
                                        </label>
                                        <Badge variant={player.insurance.status}>
                                          {player.insurance.status === 'approved' ? 'Aprovat' : player.insurance.status === 'pending' ? 'Pendent' : 'Rebutjat'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mb-3">
                                        <FileText size={20} className="text-[#5F5E5A]" />
                                        <p className="text-[13px] text-[#2C2C2A]">{player.insurance.fileName}</p>
                                      </div>
                                      {player.insurance.status === 'pending' && (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="primary"
                                            onClick={() => handleApproveDocument(team.id, player.name, 'insurance')}
                                          >
                                            Aprovar
                                          </Button>
                                          <Button variant="ghost" onClick={() => setShowRejectModal(true)}>
                                            Rebutjar
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
          <Card className="max-w-md w-full">
            <h3 className="mb-4">Rebutjar document</h3>
            <Input
              label="Motiu del rebuig"
              placeholder="Explica per què es rebutja el document..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-6"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel·lar
              </Button>
              <Button variant="primary" onClick={() => handleRejectDocument(0, '', 'dni')}>
                Confirmar rebuig
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

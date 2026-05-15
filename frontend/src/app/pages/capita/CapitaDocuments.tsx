import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

interface PlayerDocument {
  playerId: string;
  name: string;
  dni: { uploaded: boolean; status: 'approved' | 'pending' | 'rejected'; fileName: string };
  insurance: { uploaded: boolean; status: 'approved' | 'pending' | 'rejected'; fileName: string; rejectionReason?: string };
}

export default function CapitaDocuments() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerDocuments = async () => {
      try {
        setIsLoading(true);
        // API call to get player documents would go here
        const response = await fetch('/api/team/documents');
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch documents');
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setPlayers(data.players || []);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading documents');
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerDocuments();
  }, []);

  const allDocsUploaded = players.length > 0 && players.every(
    (p) => p.dni.uploaded && p.insurance.uploaded
  );

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

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-2">Documents</h1>
          <p className="text-[#5F5E5A] mb-8">
            Puja els documents de DNI i assegurança mèdica de tots els jugadors de l'equip
          </p>

          <div className="space-y-6">
            {players.map((player) => (
              <Card key={player.playerId}>
                <h3 className="mb-6">{player.name}</h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* DNI Upload */}
                  <div>
                    <label className="block mb-3">DNI</label>
                    <div className="border-2 border-dashed border-[#D3D1C7] rounded-lg p-6 text-center">
                      {player.dni.uploaded ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle size={20} className="text-[#3B6D11]" />
                            <p className="text-[13px] text-[#2C2C2A]">{player.dni.fileName}</p>
                          </div>
                          <Badge variant={player.dni.status}>
                            {player.dni.status === 'approved'
                              ? 'Aprovat'
                              : player.dni.status === 'pending'
                              ? 'Pendent validació'
                              : 'Rebutjat'}
                          </Badge>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload size={32} className="mx-auto text-[#5F5E5A]" />
                          <Button variant="secondary">Pujar DNI</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insurance Upload */}
                  <div>
                    <label className="block mb-3">Assegurança mèdica</label>
                    <div className="border-2 border-dashed border-[#D3D1C7] rounded-lg p-6 text-center">
                      {player.insurance.uploaded ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            {player.insurance.status === 'rejected' ? (
                              <XCircle size={20} className="text-[#A32D2D]" />
                            ) : (
                              <CheckCircle size={20} className="text-[#3B6D11]" />
                            )}
                            <p className="text-[13px] text-[#2C2C2A]">{player.insurance.fileName}</p>
                          </div>
                          <Badge variant={player.insurance.status}>
                            {player.insurance.status === 'approved'
                              ? 'Aprovat'
                              : player.insurance.status === 'pending'
                              ? 'Pendent validació'
                              : 'Rebutjat'}
                          </Badge>
                          {player.insurance.status === 'rejected' && (
                            <div className="text-left">
                              <p className="text-[13px] text-[#A32D2D] mb-2">
                                {player.insurance.rejectionReason}
                              </p>
                              <Button variant="primary" className="w-full">
                                Tornar a pujar
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload size={32} className="mx-auto text-[#5F5E5A]" />
                          <Button variant="secondary">Pujar assegurança</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              variant="primary"
              disabled={!allDocsUploaded}
              onClick={() => navigate('/inscription')}
            >
              Continuar a inscripció
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

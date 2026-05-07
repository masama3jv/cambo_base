import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

export default function CapitaDocuments() {
  const navigate = useNavigate();
  const [players] = useState([
    {
      name: 'Joan Garcia',
      dni: { uploaded: true, status: 'approved' as const, fileName: 'dni_joan.pdf' },
      insurance: { uploaded: true, status: 'approved' as const, fileName: 'asseguranca_joan.pdf' },
    },
    {
      name: 'Marc López',
      dni: { uploaded: true, status: 'approved' as const, fileName: 'dni_marc.pdf' },
      insurance: { uploaded: true, status: 'approved' as const, fileName: 'asseguranca_marc.pdf' },
    },
    {
      name: 'Pau Martí',
      dni: { uploaded: true, status: 'pending' as const, fileName: 'dni_pau.pdf' },
      insurance: { uploaded: true, status: 'pending' as const, fileName: 'asseguranca_pau.pdf' },
    },
    {
      name: 'David Soler',
      dni: { uploaded: true, status: 'approved' as const, fileName: 'dni_david.pdf' },
      insurance: {
        uploaded: true,
        status: 'rejected' as const,
        fileName: 'asseguranca_david.pdf',
        rejectionReason: 'El document està caducat. Si us plau, puja una assegurança vàlida.',
      },
    },
  ]);

  const allDocsUploaded = players.every(
    (p) => p.dni.uploaded && p.insurance.uploaded
  );

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
            {players.map((player, i) => (
              <Card key={i}>
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

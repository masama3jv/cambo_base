import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import DocumentUploadZone from '../../components/DocumentUploadZone';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Document {
  id: number;
  user_id: number;
  name: string;
  document_type: string;
  status: 'pendent' | 'aprovat' | 'rebutjat';
  rejection_reason?: string;
  file_path?: string;
}

export default function CapitaDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noTeam, setNoTeam] = useState(false);
  const [noPlayers, setNoPlayers] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<{ userId: number; documentType: 'dni' | 'asseguranca' | 'image_rights' } | null>(null);

  const DOC_LABELS: Record<string, string> = {
    dni: 'DNI',
    asseguranca: 'Assegurança mèdica',
    image_rights: 'Drets d\'imatge',
  };

  const fetchPlayerDocuments = async (tid?: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/team/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied');
        }
      }
      
      const data = await response.json();
      
      if (data.noTeam) {
        setNoTeam(true);
        setDocuments([]);
      } else if (data.noPlayers) {
        setNoPlayers(true);
        setDocuments([]);
      } else {
        const docs: Document[] = data.documents || [];
        // Use players from API response, or fetch them as fallback
        let players: { id: number; name: string }[] = data.players || [];
        if (players.length === 0 && tid) {
          try {
            const pRes = await fetch(`${API_BASE_URL}/team/players?teamId=${tid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (pRes.ok) players = await pRes.json();
          } catch { /* ignore */ }
        }
        const allTypes = ['dni', 'asseguranca', 'image_rights'];
        const uploadedByUser: Record<number, Set<string>> = {};
        docs.forEach(d => {
          if (!uploadedByUser[d.user_id]) uploadedByUser[d.user_id] = new Set();
          uploadedByUser[d.user_id].add(d.document_type);
        });
        const filled = [...docs];
        players.forEach(p => {
          const existing = uploadedByUser[p.id] || new Set();
          allTypes.forEach(t => {
            if (!existing.has(t)) {
              filled.push({
                id: -(p.id * 10 + allTypes.indexOf(t)),
                user_id: p.id,
                name: p.name,
                document_type: t,
                status: 'pendent',
                rejection_reason: undefined,
                file_path: undefined,
                created_at: null,
              });
            }
          });
        });
        setDocuments(filled);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error loading documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        const teamRes = await fetch(`${API_BASE_URL}/teams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const teamData = await teamRes.json();
        if (teamData && Array.isArray(teamData) && teamData.length > 0) {
          const tid = teamData[0].id;
          setTeamId(tid);
          await fetchPlayerDocuments(tid);
        } else {
          await fetchPlayerDocuments();
        }
      } catch (err) {
        console.error('Error initializing:', err);
      }
    };
    init();
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

  if (noTeam) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-[#FFF4E6] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-[#D85A30]" />
            </div>
            <h2 className="mb-4">Primer has de crear un equip</h2>
            <p className="text-[#5F5E5A] mb-6">
              Crea un equip a la secció "El meu equip" per poder pujar documents.
            </p>
            <Button variant="primary" onClick={() => navigate('/team')}>
              Crear equip
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  if (noPlayers) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-[#FFF4E6] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-[#D85A30]" />
            </div>
            <h2 className="mb-4">Afegeix jugadors abans de pujar documents</h2>
            <p className="text-[#5F5E5A] mb-6">
              Invita jugadors al teu equip per poder pujar els seus documents.
            </p>
            <Button variant="primary" onClick={() => navigate('/team')}>
              Gestionar equip
            </Button>
          </Card>
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
            Estat de la documentació de tots els jugadors
          </p>

          {documents.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-[#3B6D11]" />
              </div>
              <h3 className="mb-2">No hi ha documents</h3>
              <p className="text-[#5F5E5A]">
                Els documents dels jugadors apareixeran aquí quan se subixin.
              </p>
            </Card>
          ) : (
            <>
              <div className="space-y-6">
                {Object.entries(
                  documents.reduce((acc: any, doc: Document) => {
                    if (!acc[doc.user_id]) {
                      acc[doc.user_id] = { name: doc.name, documents: [] };
                    }
                    acc[doc.user_id].documents.push(doc);
                    return acc;
                  }, {})
                ).map(([playerId, playerData]: any) => (
                  <Card key={playerId}>
                    <h3 className="mb-6">{playerData.name}</h3>
                    <div className="space-y-4">
                      {playerData.documents.map((doc: Document) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-[#F9F7F3] rounded-lg">
                          <div className="flex items-center gap-3">
                            {doc.status === 'aprovat' ? (
                              <CheckCircle size={20} className="text-[#3B6D11]" />
                            ) : doc.status === 'rebutjat' ? (
                              <XCircle size={20} className="text-[#A32D2D]" />
                            ) : (
                              <div className="w-5 h-5 bg-[#FFB84D] rounded-full" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-[#2C2C2A] capitalize">
                                {DOC_LABELS[doc.document_type] || doc.document_type}
                              </p>
                              {doc.rejection_reason && (
                                <p className="text-[12px] text-[#A32D2D]">Motiu: {doc.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                doc.status === 'aprovat'
                                  ? 'success'
                                  : doc.status === 'rebutjat'
                                  ? 'error'
                                  : 'pending'
                              }
                            >
                              {doc.status === 'aprovat'
                                ? 'Aprovat'
                                : doc.status === 'rebutjat'
                                ? 'Rebutjat'
                                : 'Pendent'}
                            </Badge>
                            <Button 
                              variant="secondary" 
                              onClick={() => teamId && setShowUploadModal({ userId: parseInt(playerId), documentType: doc.document_type as any })}
                              className="text-xs"
                            >
                              {doc.file_path ? 'Actualizar' : 'Pujar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              {documents.every((d) => d.status === 'aprovat') && (
                <div className="mt-8 flex justify-end">
                  <Button variant="primary" onClick={() => navigate('/inscription')}>
                    Continuar a inscripció
                  </Button>
                </div>
              )}

              {!documents.every((d) => d.status === 'aprovat') && (
                <Card className="mt-8 bg-[#FFF4E6] border border-[#FFB84D]">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-[#D85A30] flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-[#D85A30] mb-2">Documentació incompleta</p>
                      <p className="text-[13px] text-[#D85A30]">
                        Tots els documents han de ser aprovats per poder procedir amb la inscripció.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Upload Modal */}
              {showUploadModal && teamId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="max-w-md w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h2>Pujar document</h2>
                      <button 
                        onClick={() => setShowUploadModal(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <DocumentUploadZone 
                      userId={showUploadModal.userId}
                      teamId={teamId}
                      documentType={showUploadModal.documentType}
                      onUploadSuccess={() => {
                        setShowUploadModal(null);
                        fetchPlayerDocuments();
                      }}
                    />
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

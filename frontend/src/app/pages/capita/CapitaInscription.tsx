import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';

interface InscriptionData {
  teamName: string;
  sport: string;
  players: string[];
  amount: number;
  status: string;
  documentsReady: boolean;
}

export default function CapitaInscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<InscriptionData | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInscriptionData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/team/inscription-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTeamData(data.teamData);
          const teamRes = await fetch(`${API_BASE_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (teamRes.ok) {
            const teamData2 = await teamRes.json();
            if (Array.isArray(teamData2) && teamData2.length > 0) {
              setTeamId(teamData2[0].id);
            }
          }
        } else {
          setError('No hi ha equip creat. Crea un equip primer.');
        }
      } catch (err) {
        setError('Error carregant les dades de inscripció');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInscriptionData();
  }, []);

  const handleSimulatePayment = async () => {
    if (!teamId) return;
    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/team/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teamId, amount: teamData?.amount || 150 }),
      });
      if (response.ok) {
        setPaymentComplete(true);
      } else {
        const err = await response.json();
        setError(err.error || 'Error en processar el pagament');
      }
    } catch (err) {
      setError('Error en processar el pagament');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !teamData) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-[#FFE8E8] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-[#A32D2D]" />
            </div>
            <p className="text-[#A32D2D] mb-4">{error}</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/team')}>
              Anar a Gestio d'equip
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#3B6D11]" />
            </div>
            <h2 className="mb-4">Inscripció completada!</h2>
            <Badge variant="pending">Inscrit al torneig</Badge>
            <p className="text-[#5F5E5A] mt-6 mb-8">
          Quan l'administrador publiqui el calendari, veuràs els partits a la secció Calendari.
            </p>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Tornar al dashboard
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl text-center">
            <p className="text-[#5F5E5A] mb-4">No hi ha dades disponibles</p>
            <Button variant="primary" onClick={() => window.location.reload()}>Reintentar</Button>
          </Card>
        </main>
      </div>
    );
  }

  const canPay = teamData.documentsReady && teamData.status === 'pendent_pagament';
  const isInscrit = teamData.status === 'inscrit' || teamData.status === 'actiu';

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Inscripció i pagament</h1>
          <p className="text-[#5F5E5A] mb-8">
            Revisa les dades de l'equip i completa el pagament per finalitzar la inscripció
          </p>

          {error && (
            <Card className="mb-6 bg-[#FFE8E8] border border-[#FF6B6B]">
              <p className="text-[#A32D2D]">{error}</p>
            </Card>
          )}

          {!teamData.documentsReady && (
            <Card className="mb-6 bg-[#FFF4E6] border border-[#FFB84D]">
              <p className="text-[#D85A30]">Falta documentació. Tots els documents (DNI, assegurança i drets d'imatge) han d'estar aprovats per l'administrador.</p>
            </Card>
          )}

          {isInscrit && (
            <Card className="mb-6 bg-[#EAF3DE] border border-[#3B6D11]">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-[#3B6D11]" />
                <p className="text-[#3B6D11]">L'equip ja està inscrit al torneig.</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <h3 className="mb-6">Resum de l'equip</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Nom de l'equip</p>
                  <p className="font-medium text-[#2C2C2A]">{teamData.teamName || '-'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Esport</p>
                  <Badge variant="info">{teamData.sport || '-'}</Badge>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Nombre de jugadors</p>
                  <p className="font-medium text-[#2C2C2A]">{teamData.players?.length || 0}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-2">Jugadors</p>
                  <div className="space-y-2">
                    {teamData.players && teamData.players.length > 0 ? (
                      teamData.players.map((player, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-[#3B6D11]" />
                          <p className="text-[13px] text-[#2C2C2A]">{player}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-[#5F5E5A]">Cap jugador</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#D3D1C7]">
                <h3 className="mb-4">Estat dels documents</h3>
                <div className="space-y-2">
                  {teamData.documentsReady ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#3B6D11]" />
                        <p className="text-[13px] text-[#2C2C2A]">Tots els documents obligatoris aprovats</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-[13px] text-[#A32D2D]">Documentació incompleta</p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-6">Pagament</h3>
              <div className="mb-6 p-4 bg-[#FAECE7] rounded-lg">
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Import total</p>
                <p className="text-[32px] font-medium text-[#D85A30]">{teamData.amount}€</p>
              </div>

              {teamId && canPay && (
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleSimulatePayment}
                  disabled={processing}
                >
                  <CreditCard size={18} />
                  {processing ? 'Processant...' : `Pagar ${teamData.amount}€`}
                </Button>
              )}

              {!canPay && !isInscrit && (
                <Card className="bg-[#FFF4E6] border border-[#FFB84D]">
                  <p className="text-[13px] text-[#5F5E5A]">
                    {teamData.status === 'pendent_docs'
                      ? 'Esperant que l\'administrador validi els documents.'
                      : teamData.status === 'pendent_validacio'
                      ? 'Esperant validació de l\'administrador.'
                      : 'Els documents han d\'estar aprovats per poder pagar.'}
                  </p>
                </Card>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
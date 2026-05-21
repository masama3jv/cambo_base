import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
const stripePromise = loadStripe(stripeKey);

interface InscriptionData {
  teamName: string;
  sport: string;
  players: string[];
  amount: number;
  status: string;
  documentsReady: boolean;
}

function PaymentForm({ amount, teamId, onSuccess, onError }: { amount: number; teamId: number; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');

      const intentRes = await fetch(`${API_BASE_URL}/team/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teamId, amount }),
      });

      if (!intentRes.ok) {
        const err = await intentRes.json();
        throw new Error(err.error || 'Failed to create payment');
      }

      const { clientSecret, paymentIntentId } = await intentRes.json();

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      const processRes = await fetch(`${API_BASE_URL}/team/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teamId, amount, paymentIntentId }),
      });

      if (processRes.ok) {
        onSuccess();
      } else {
        const err = await processRes.json();
        throw new Error(err.error || 'Failed to confirm payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment error');
      onError(err.message || 'Payment error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMsg && <p className="text-[13px] text-[#A32D2D]">{errorMsg}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={!stripe || processing}>
        {processing ? 'Processant...' : `Pagar ${amount}€`}
      </Button>
    </form>
  );
}

export default function CapitaInscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<InscriptionData | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);

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
          // Get team ID from the inscription or separate call
          if (data.inscription?.team_id) {
            setTeamId(data.inscription.team_id);
          } else {
            // Fetch team ID
            const teamRes = await fetch(`${API_BASE_URL}/teams`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (teamRes.ok) {
              const teamData2 = await teamRes.json();
              if (Array.isArray(teamData2) && teamData2.length > 0) {
                setTeamId(teamData2[0].id);
              } else if (teamData2.id) {
                setTeamId(teamData2.id);
              }
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
            <h2 className="mb-4">Inscripcio completada!</h2>
            <Badge variant="pending">Pendent de validacio per l'administrador</Badge>
            <p className="text-[#5F5E5A] mt-6 mb-8">
              Rebras una notificacio quan l'administrador validi la teva inscripcio.
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

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Inscripcio i pagament</h1>
          <p className="text-[#5F5E5A] mb-8">
            Revisa les dades de l'equip i completa el pagament per finalitzar la inscripcio
          </p>

          {error && (
            <Card className="mb-6 bg-[#FFE8E8] border border-[#FF6B6B]">
              <p className="text-[#A32D2D]">{error}</p>
            </Card>
          )}

          {!teamData.documentsReady && (
            <Card className="mb-6 bg-[#FFF4E6] border border-[#FFB84D]">
              <p className="text-[#D85A30]">Falta documentacio. Puja tots els documents requerits (DNI i asseguranca) per continuar.</p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Summary */}
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
                        <p className="text-[13px] text-[#2C2C2A]">Tots els DNI pujats</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#3B6D11]" />
                        <p className="text-[13px] text-[#2C2C2A]">Totes les assegurances pujades</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-[13px] text-[#A32D2D]">Documentacio incompleta</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card>
              <h3 className="mb-6">Pagament</h3>
              <div className="mb-6 p-4 bg-[#FAECE7] rounded-lg">
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">Import total</p>
                <p className="text-[32px] font-medium text-[#D85A30]">{teamData.amount}€</p>
              </div>

              {teamId ? (
                <Elements stripe={stripePromise} options={{
                  appearance: { theme: 'stripe', variables: { colorPrimary: '#D85A30' } },
                  mode: 'payment',
                  currency: 'eur',
                  amount: Math.round(teamData.amount * 100),
                } as any}>
                  <PaymentForm
                    amount={teamData.amount}
                    teamId={teamId}
                    onSuccess={() => setPaymentComplete(true)}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              ) : (
                <p className="text-[13px] text-[#5F5E5A]">Carregant dades de pagament...</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
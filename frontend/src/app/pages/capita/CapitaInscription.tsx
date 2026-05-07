import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CheckCircle } from 'lucide-react';

export default function CapitaInscription() {
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
  });

  const teamData = {
    name: 'FC Barcelona',
    sport: 'Futbol Sala',
    players: ['Joan Garcia', 'Marc López', 'Pau Martí', 'David Soler'],
    amount: 120,
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentComplete(true);
  };

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
            <Badge variant="pending">Pendent de validació per l'administrador</Badge>
            <p className="text-[#5F5E5A] mt-6 mb-8">
              Rebràs una notificació quan l'administrador validi la teva inscripció.
            </p>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Tornar al dashboard
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
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Inscripció i pagament</h1>
          <p className="text-[#5F5E5A] mb-8">
            Revisa les dades de l'equip i completa el pagament per finalitzar la inscripció
          </p>

          <div className="grid grid-cols-2 gap-6">
            {/* Summary */}
            <Card>
              <h3 className="mb-6">Resum de l'equip</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">
                    Nom de l'equip
                  </p>
                  <p className="font-medium text-[#2C2C2A]">{teamData.name}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">
                    Esport
                  </p>
                  <Badge variant="info">{teamData.sport}</Badge>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">
                    Nombre de jugadors
                  </p>
                  <p className="font-medium text-[#2C2C2A]">{teamData.players.length}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-2">
                    Jugadors
                  </p>
                  <div className="space-y-2">
                    {teamData.players.map((player, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#3B6D11]" />
                        <p className="text-[13px] text-[#2C2C2A]">{player}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#D3D1C7]">
                <h3 className="mb-4">Estat dels documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#3B6D11]" />
                    <p className="text-[13px] text-[#2C2C2A]">Tots els DNI pujats</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#3B6D11]" />
                    <p className="text-[13px] text-[#2C2C2A]">Totes les assegurances pujades</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card>
              <h3 className="mb-6">Pagament</h3>
              <div className="mb-6 p-4 bg-[#FAECE7] rounded-lg">
                <p className="text-[12px] text-[#5F5E5A] uppercase tracking-wider mb-1">
                  Import total
                </p>
                <p className="text-[32px] font-medium text-[#D85A30]">{teamData.amount}€</p>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                <Input
                  type="text"
                  label="Número de targeta"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Data de caducitat"
                    placeholder="MM/AA"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    required
                  />
                  <Input
                    type="text"
                    label="CVV"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full">
                  Confirmar i pagar
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

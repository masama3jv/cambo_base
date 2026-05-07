import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function PlayerInvitationPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  // Mock data - in real app, this comes from API based on token
  const invitationData = {
    email: 'jugador@exemple.cat',
    teamName: 'FC Barcelona',
    captainName: 'Joan Garcia',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock registration - in real app, this calls API
    navigate('/jugador/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-[#D85A30] mb-2">CampoBase</h2>
          <h3 className="mb-4">Unir-me a l'equip</h3>
          <div className="flex justify-center mb-4">
            <Badge variant="info">Invitació de {invitationData.captainName}</Badge>
          </div>
          <p className="text-[15px] text-[#5F5E5A]">
            Has estat convidat a unir-te a <strong>{invitationData.teamName}</strong>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email"
            value={invitationData.email}
            disabled
            className="bg-[#F1EFE8]"
          />
          <Input
            type="text"
            label="Nom complet"
            placeholder="Marc López"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            type="password"
            label="Contrasenya"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            type="password"
            label="Confirmar contrasenya"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" variant="primary" className="w-full">
            Unir-me a l'equip
          </Button>
        </form>
      </Card>
    </div>
  );
}

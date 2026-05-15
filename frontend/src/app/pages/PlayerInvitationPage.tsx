import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface InvitationInfo {
  email: string;
  teamName: string;
  captainName: string;
}

export default function PlayerInvitationPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [invitationData, setInvitationData] = useState<InvitationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setIsLoading(true);
        // API call to validate invitation token and get invitation details
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          throw new Error('Invitació inválida o caducada');
        }
        const data = await response.json();
        setInvitationData(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading invitation');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    } else {
      setError('Token inválid');
      setIsLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les contrasenyes no coincideixen');
      return;
    }

    try {
      // API call to register player with invitation token
      const response = await fetch('/api/auth/register-invited-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          token,
        }),
      });

      if (response.ok) {
        navigate('/jugador/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Error en el registre');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registre');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
        <Card className="w-full max-w-md text-center">
          <p className="text-[#5F5E5A]">Carregant invitació...</p>
        </Card>
      </div>
    );
  }

  if (error || !invitationData) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
        <Card className="w-full max-w-md text-center">
          <p className="text-[#A32D2D] mb-4">{error || 'Invitació inválida'}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Tornar a l'inici
          </Button>
        </Card>
      </div>
    );
  }

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
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
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

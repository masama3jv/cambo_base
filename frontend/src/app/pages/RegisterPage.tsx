import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading } = useAuth();
  
  const invitationToken = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  // Load invitation details if token provided
  useEffect(() => {
    if (invitationToken) {
      loadInvitationDetails();
    }
  }, [invitationToken]);

  const loadInvitationDetails = async () => {
    try {
      setLoadingInvitation(true);
      const response = await fetch(`${API_BASE_URL}/public/invitations/${invitationToken}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error loading invitation');
        return;
      }

      const data = await response.json();
      setInvitationData(data);
      
      // Pre-fill email from invitation
      setFormData(prev => ({ ...prev, email: data.email }));
    } catch (err) {
      setError('Error loading invitation');
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Les contrasenyes no coincideixen');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contrasenya ha de tenir mínim 6 caràcters');
      return;
    }

    try {
      if (invitationToken) {
        // Register with invitation
        const response = await fetch(`${API_BASE_URL}/auth/register-invited`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            invitationToken
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Registration failed');
        }

        const data = await response.json();
        
        // Save token
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', 'jugador');

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        // Normal registration (new capita)
        await register(formData.name, formData.email, formData.password, formData.confirmPassword);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registre');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-[#D85A30] mb-2">CampoBase</h2>
          <h3 className="mb-4">
            {invitationToken ? 'Registra\'t amb invitació' : 'Crear compte'}
          </h3>
          
          {invitationToken && invitationData && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-left">
              <p className="text-sm text-blue-900">
                ✓ Invitat a unir-te a <strong>{invitationData.teamName}</strong> {invitationData.sport === 'futsal' ? '⚽' : invitationData.sport === 'basquet' ? '🏀' : '🎾'}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Per: <strong>{invitationData.capitaName}</strong>
              </p>
            </div>
          )}
          
          {!invitationToken && (
            <div className="flex justify-center">
              <Badge variant="info">Se t'assignarà el rol de Capità</Badge>
            </div>
          )}
        </div>

        {loadingInvitation ? (
          <div className="text-center py-8">
            <p className="text-[#5F5E5A]">Carregant dades de la invitació...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <Input
              type="text"
              label="Nom complet"
              placeholder="Joan Garcia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
            
            <Input
              type="email"
              label="Email"
              placeholder="correu@exemple.cat"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading || !!invitationToken}
            />
            
            <Input
              type="password"
              label="Contrasenya"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
            
            <Input
              type="password"
              label="Confirmar contrasenya"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
            />
            
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creant compte...' : 'Crear compte'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-[13px] text-[#5F5E5A]">
            Ja tens compte?{' '}
            <Link to="/login" className="text-[#D85A30] hover:underline">
              Inicia sessió
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

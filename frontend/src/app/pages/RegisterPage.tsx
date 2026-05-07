import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

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
      await register(formData.name, formData.email, formData.password, formData.confirmPassword);
      // Redirect based on role (new users are sempre capita)
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registre');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-[#D85A30] mb-2">CampoBase</h2>
          <h3 className="mb-4">Crear compte</h3>
          <div className="flex justify-center">
            <Badge variant="info">Se t'assignarà el rol de Capità</Badge>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
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
            disabled={isLoading}
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

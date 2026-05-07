import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Redirect based on role
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'arbitre') {
        navigate('/arbitre/partits');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en l\'accés');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-[#D85A30] mb-2">CampoBase</h2>
          <h3>Iniciar sessió</h3>
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
            placeholder="correu@exemple.cat"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            label="Contrasenya"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? 'Accedint...' : 'Iniciar sessió'}
          </Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <p className="text-[13px] text-[#5F5E5A]">
            Encara no tens compte?{' '}
            <Link to="/register" className="text-[#D85A30] hover:underline">
              Registra't
            </Link>
          </p>
          <Link to="/forgot-password" className="text-[13px] text-[#D85A30] hover:underline block">
            Has oblidat la contrasenya?
          </Link>
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { UserPlus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Referee {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export default function AdminReferees() {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchReferees = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users?role=arbitre`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReferees(data);
      } else {
        throw new Error('Failed to fetch referees');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading referees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReferees(); }, []);

  const handleAddReferee = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/invite-referee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      if (response.ok) {
        const data = await response.json();
        setReferees(prev => [...prev, { id: data.id, name: data.name, email: data.email, email_verified: true, created_at: new Date().toISOString() }]);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
      } else {
        const errData = await response.json();
        alert(errData.error || 'Error al crear l\'àrbitre');
      }
    } catch (err) {
      alert('Error al crear l\'àrbitre');
    }
  };

  const handleDeleteReferee = async (id: number) => {
    if (!confirm('Segur que vols eliminar aquest àrbitre?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setReferees(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Error al eliminar l\'àrbitre');
      }
    } catch (err) {
      alert('Error al eliminar l\'àrbitre');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8"><p className="text-[#5F5E5A]">Carregant...</p></main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <Card className="p-6 text-center">
            <p className="text-[#A32D2D]">Error: {error}</p>
            <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="mb-2">Gestió d'Àrbitres</h1>
              <p className="text-[#5F5E5A]">Afegeix i gestiona els àrbitres del sistema</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={18} className="mr-2 inline" /> Afegir àrbitre
            </Button>
          </div>

          <Card>
            {referees.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha àrbitres registrats</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D3D1C7]">
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Nom</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Verificat</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Creat</th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referees.map((ref) => (
                      <tr key={ref.id} className="border-b border-[#D3D1C7] last:border-0">
                        <td className="py-4 px-4 font-medium text-[#2C2C2A]">{ref.name}</td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{ref.email}</td>
                        <td className="py-4 px-4">
                          <Badge variant={ref.email_verified ? 'approved' : 'pending'}>
                            {ref.email_verified ? 'Sí' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{new Date(ref.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" onClick={() => handleDeleteReferee(ref.id)}>
                            <Trash2 size={16} className="text-[#A32D2D]" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
          <Card className="max-w-md w-full">
            <h3 className="mb-6">Afegir àrbitre</h3>
            <Input label="Nom complet" placeholder="Nom de l'àrbitre" value={newName} onChange={(e) => setNewName(e.target.value)} className="mb-4" />
            <Input label="Email" type="email" placeholder="Email de l'àrbitre" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mb-6" />
            <p className="text-[12px] text-[#5F5E5A] mb-6">La contrasenya per defecte serà: <strong>referee123</strong></p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel·lar</Button>
              <Button variant="primary" onClick={handleAddReferee}>Crear àrbitre</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
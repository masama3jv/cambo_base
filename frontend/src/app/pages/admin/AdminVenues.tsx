import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Venue {
  id: number;
  name: string;
  location: string;
  tournament_name: string | null;
  created_at: string;
}

export default function AdminVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const fetchVenues = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/venues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      } else {
        throw new Error('Failed to fetch venues');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading venues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVenues(); }, []);

  const openAddModal = () => {
    setEditingVenue(null);
    setFormName('');
    setFormLocation('');
    setShowAddModal(true);
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    setFormName(venue.name);
    setFormLocation(venue.location || '');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (editingVenue) {
        const response = await fetch(`${API_BASE_URL}/admin/venues/${editingVenue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: formName, location: formLocation }),
        });
        if (response.ok) {
          setVenues(prev => prev.map(v => v.id === editingVenue.id ? { ...v, name: formName, location: formLocation } : v));
        } else {
          alert('Error al actualitzar la seu');
          return;
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/admin/venues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: formName, location: formLocation }),
        });
        if (response.ok) {
          const data = await response.json();
          setVenues(prev => [...prev, { id: data.id, name: data.name, location: data.location, tournament_name: null, created_at: new Date().toISOString() }]);
        } else {
          alert('Error al crear la seu');
          return;
        }
      }
      setShowAddModal(false);
    } catch (err) {
      alert('Error al guardar la seu');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Segur que vols eliminar aquesta seu?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/venues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVenues(prev => prev.filter(v => v.id !== id));
      } else {
        alert('Error al eliminar la seu');
      }
    } catch (err) {
      alert('Error al eliminar la seu');
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
              <h1 className="mb-2">Seus / Pistes</h1>
              <p className="text-[#5F5E5A]">Gestiona les seus i pistes del Campo Base</p>
            </div>
            <Button variant="primary" onClick={openAddModal}>
              <Plus size={18} className="mr-2 inline" /> Afegir seu
            </Button>
          </div>

          <Card>
            {venues.length === 0 ? (
              <p className="text-center text-[#5F5E5A] py-8">No hi ha seus registrades</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D3D1C7]">
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Nom</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Ubicació</th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Torneig</th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => (
                      <tr key={venue.id} className="border-b border-[#D3D1C7] last:border-0">
                        <td className="py-4 px-4 font-medium text-[#2C2C2A]">{venue.name}</td>
                        <td className="py-4 px-4 text-[#5F5E5A]">{venue.location || '-'}</td>
                        <td className="py-4 px-4">
                          {venue.tournament_name ? <Badge variant="info">{venue.tournament_name}</Badge> : <span className="text-[#5F5E5A]">-</span>}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" className="mr-2" onClick={() => openEditModal(venue)}>
                            <Edit3 size={16} />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(venue.id)}>
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
            <h3 className="mb-6">{editingVenue ? 'Editar seu' : 'Afegir seu'}</h3>
            <Input label="Nom de la seu" placeholder="Ex: Pista Central" value={formName} onChange={(e) => setFormName(e.target.value)} className="mb-4" />
            <Input label="Ubicació" placeholder="Ex: Poliesportiu Municipal" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="mb-6" />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel·lar</Button>
              <Button variant="primary" onClick={handleSave}>{editingVenue ? 'Guardar' : 'Crear'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
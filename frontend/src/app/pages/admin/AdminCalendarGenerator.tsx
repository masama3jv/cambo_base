import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface CalendarFormData {
  format: 'round_robin' | 'groups' | 'elimination' | 'mixed';
  startDate: string;
  endDate: string;
  matchDurationMinutes: number;
  breakMinutes: number;
  courts: string[];
  matchesPerDay: number;
}

export default function AdminCalendarGenerator() {
  const [formData, setFormData] = useState<CalendarFormData>({
    format: 'round_robin',
    startDate: '',
    endDate: '',
    matchDurationMinutes: 40,
    breakMinutes: 5,
    courts: ['Pista 1', 'Pista 2'],
    matchesPerDay: 4
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [newCourt, setNewCourt] = useState('');

  const handleAddCourt = () => {
    if (newCourt.trim()) {
      setFormData({ ...formData, courts: [...formData.courts, newCourt] });
      setNewCourt('');
    }
  };

  const handleRemoveCourt = (index: number) => {
    setFormData({ ...formData, courts: formData.courts.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona les dates d\'inici i fi');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('La data de fi ha de ser posterior a la d\'inici');
      return;
    }

    if (formData.courts.length === 0) {
      setError('Afegeix almenys una pista');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/generate-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          format: formData.format,
          startDate: formData.startDate,
          endDate: formData.endDate,
          matchDurationMinutes: formData.matchDurationMinutes,
          breakMinutes: formData.breakMinutes,
          courts: formData.courts,
          matchesPerDay: formData.matchesPerDay
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar el calendari');
      }

      const data = await response.json();
      setSuccess(data);

      setFormData({
        format: 'round_robin', startDate: '', endDate: '',
        matchDurationMinutes: 40, breakMinutes: 5,
        courts: ['Pista 1', 'Pista 2'], matchesPerDay: 4
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el calendari');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabels: Record<string, string> = {
    round_robin: 'Lliga (Tots contra Tots)',
    groups: 'Grups',
    elimination: 'Eliminatòria',
    mixed: 'Mixt (Grups + Eliminatòria)'
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Generar Calendari</h1>
          <p className="text-[#5F5E5A] mb-8">
            Configura el format i els detalls del torneig per generar automàticament el calendari de partits
          </p>

          {success && (
            <Card className="mb-6 bg-green-50 border border-green-200 p-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-900 mb-2">Calendari generat amb èxit!</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>✓ ID del Torneig: <code className="bg-white px-2 py-1 rounded">{success.tournamentId}</code></li>
                    <li>✓ Equips: {success.teamsCount}</li>
                    <li>✓ Partits: {success.matchesCount}</li>
                    <li>✓ Pistes: {success.courtsCount}</li>
                    <li>✓ Format: {formatLabels[success.format] || success.format}</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format del Torneig</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D85A30]"
                >
                  <option value="round_robin">Lliga (Tots contra Tots)</option>
                  <option value="groups">Grups</option>
                  <option value="elimination">Eliminatòria</option>
                  <option value="mixed">Mixt (Grups + Eliminatòria)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.format === 'round_robin' && 'Cada equip juga contra tots els altres una vegada'}
                  {formData.format === 'groups' && 'Els equips es divideixen en grups. Cada equip juga contra els del seu grup'}
                  {formData.format === 'elimination' && 'Format d\'eliminació directa. Els perdedors queden fora'}
                  {formData.format === 'mixed' && 'Primera fase en grups, després es juga eliminatòria'}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data d\'Inici</label>
                  <Input type="date" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Fi</label>
                  <Input type="date" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durada del Partit (minuts)</label>
                  <Input type="number" value={formData.matchDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, matchDurationMinutes: parseInt(e.target.value) || 0 })}
                    min="15" max="120" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descans entre Partits (minuts)</label>
                  <Input type="number" value={formData.breakMinutes}
                    onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                    min="0" max="30" required />
                </div>
              </div>

              {/* Partits per dia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màxim de Partits per Dia</label>
                <Input type="number" value={formData.matchesPerDay}
                  onChange={(e) => setFormData({ ...formData, matchesPerDay: parseInt(e.target.value) || 1 })}
                  min="1" max="10" required />
              </div>

              {/* Pistes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Pistes Disponibles</label>
                <div className="space-y-2 mb-4">
                  {formData.courts.map((court, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-700">{court}</span>
                      <button type="button" onClick={() => handleRemoveCourt(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="text" placeholder="Nom de la pista (ex: Pista 1)" value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCourt(); } }} />
                  <Button type="button" variant="secondary" onClick={handleAddCourt}>Afegir</Button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" /> Generant calendari...
                    </span>
                  ) : 'Generar Calendari'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Info */}
          <Card className="mt-6 bg-blue-50 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Informació</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• L'algoritme calcula automàticament els horaris per evitar conflictes</li>
              <li>• Assegura que no hi hagi equips jugant simultàniament</li>
              <li>• Es respecten les limitacions de pistes disponibles</li>
              <li>• Si no hi ha suficients franges horàries, obtindràs un error</li>
              <li>• Els partits es distribueixen al llarg del període definit</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
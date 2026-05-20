import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

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
    courts: ['Court 1', 'Court 2'],
    matchesPerDay: 4
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [newCourt, setNewCourt] = useState('');

  const handleAddCourt = () => {
    if (newCourt.trim()) {
      setFormData({
        ...formData,
        courts: [...formData.courts, newCourt]
      });
      setNewCourt('');
    }
  };

  const handleRemoveCourt = (index: number) => {
    setFormData({
      ...formData,
      courts: formData.courts.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona fechas de inicio y fin');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }

    if (formData.courts.length === 0) {
      setError('Agregat almenys una pista');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        throw new Error(data.error || 'Error generating calendar');
      }

      const data = await response.json();
      setSuccess(data);

      // Reset form
      setFormData({
        format: 'round_robin',
        startDate: '',
        endDate: '',
        matchDurationMinutes: 40,
        breakMinutes: 5,
        courts: ['Court 1', 'Court 2'],
        matchesPerDay: 4
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabels = {
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
          <h1 className="mb-2">Generar Calendario</h1>
          <p className="text-[#5F5E5A] mb-8">
            Configura el formato y los detalles del torneo para generar automáticamente el calendario de partidos
          </p>

          {success && (
            <Card className="mb-6 bg-green-50 border border-green-200 p-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-900 mb-2">¡Calendario generado exitosamente!</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>✓ Torneo ID: <code className="bg-white px-2 py-1 rounded">{success.tournamentId}</code></li>
                    <li>✓ Equipos: {success.teamsCount}</li>
                    <li>✓ Partidos: {success.matchesCount}</li>
                    <li>✓ Pistas: {success.courtsCount}</li>
                    <li>✓ Formato: {formatLabels[success.format as keyof typeof formatLabels]}</li>
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

              {/* Formato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato del Torneo
                </label>
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
                  {formData.format === 'round_robin' && 'Cada equipo juega contra todos los demás una vez'}
                  {formData.format === 'groups' && 'Los equipos se dividen en grupos. Cada equipo juega contra los de su grupo'}
                  {formData.format === 'elimination' && 'Formato de eliminación directa. Los perdedores quedan fuera'}
                  {formData.format === 'mixed' && 'Primera fase en grupos, después se juega eliminatoria'}
                </p>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Duración de partidos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración del Partido (minutos)
                  </label>
                  <Input
                    type="number"
                    value={formData.matchDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, matchDurationMinutes: parseInt(e.target.value) })}
                    min="15"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descanso entre Partidos (minutos)
                  </label>
                  <Input
                    type="number"
                    value={formData.breakMinutes}
                    onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) })}
                    min="0"
                    max="30"
                    required
                  />
                </div>
              </div>

              {/* Partidos por día */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Partidos por Día
                </label>
                <Input
                  type="number"
                  value={formData.matchesPerDay}
                  onChange={(e) => setFormData({ ...formData, matchesPerDay: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  required
                />
              </div>

              {/* Pistas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pistas Disponibles
                </label>
                
                <div className="space-y-2 mb-4">
                  {formData.courts.map((court, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-700">{court}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourt(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nombre de la pista (ej: Pista 1)"
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCourt();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddCourt}
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Generando calendario...
                    </span>
                  ) : (
                    'Generar Calendario'
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Información */}
          <Card className="mt-6 bg-blue-50 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ Información</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El algoritmo calcula automáticamente los horarios para evitar conflictos</li>
              <li>• Se asegura de que no haya equipos jugando simultáneamente</li>
              <li>• Se respetan las limitaciones de pistas disponibles</li>
              <li>• Si no hay suficientes slots, obtendrás un error</li>
              <li>• Los partidos se distribuyen a lo largo del período definido</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

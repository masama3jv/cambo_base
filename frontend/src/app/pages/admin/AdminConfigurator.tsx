import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { API_BASE_URL } from '../../services/api';

export default function AdminConfigurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { number: 1, label: 'Instal·lacions' },
    { number: 2, label: 'Estructura' },
    { number: 3, label: 'Puntuació' },
    { number: 4, label: 'Temps' },
  ];

  const formatMap: Record<string, string> = {
    lliga: 'round_robin', grups: 'groups', eliminatria: 'elimination', mixt: 'mixed'
  };

  const [formData, setFormData] = useState({
    tournamentName: '',
    sport: 'futsal',
    numCourts: 2,
    courts: [{ name: 'Pista 1' as string, location: 'Pavellò A' as string }, { name: 'Pista 2' as string, location: 'Pavellò A' as string }],
    format: 'mixt' as string,
    teamsPerGroup: 4,
    winPoints: 3, drawPoints: 1, lossPoints: 0,
    tiebreaker: 'goal_difference' as string,
    matchDuration: 40, breakBetween: 5,
    startDate: '', endDate: '', matchesPerDay: 4,
  });

  const handleGenerate = async () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona les dates d\'inici i fi (pas 4)');
      return;
    }
    if (formData.courts.length === 0) {
      setError('Afegeix almenys una pista');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/generate-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tournamentName: formData.tournamentName || `Torneig-${Date.now()}`,
          sport: formData.sport,
          format: formatMap[formData.format] || formData.format,
          startDate: formData.startDate,
          endDate: formData.endDate,
          matchDurationMinutes: formData.matchDuration,
          breakMinutes: formData.breakBetween,
          courts: formData.courts.map(c => c.name),
          matchesPerDay: formData.matchesPerDay,
          winPoints: formData.winPoints,
          drawPoints: formData.drawPoints,
          lossPoints: formData.lossPoints,
          tiebreaker: formData.tiebreaker,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error generant el calendari');
      }

      const data = await response.json();
      setSuccess(data);
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Error generant el calendari');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabels: Record<string, string> = {
    lliga: 'Lliga', grups: 'Grups', eliminatria: 'Eliminatòria', mixt: 'Mixt'
  };

  if (success && currentStep === 5) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-8">Calendari generat!</h1>
            <Card className="bg-green-50 border border-green-200 p-6 mb-6">
              <ul className="space-y-2 text-green-800">
                <li>✓ ID Torneig: <code className="bg-white px-2 py-0.5 rounded">{success.tournamentId}</code></li>
                <li>✓ Equips: {success.teamsCount}</li>
                <li>✓ Partits: {success.matchesCount}</li>
                <li>✓ Pistes: {success.courtsCount}</li>
                <li>✓ Format: {formatLabels[formData.format] || formData.format}</li>
              </ul>
            </Card>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => { setSuccess(null); setCurrentStep(1); }}>Tornar a configurar</Button>
              <Button variant="primary" onClick={() => setCurrentStep(5)}>Veure al calendari</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Configurador de torneig</h1>
          <p className="text-[#5F5E5A] mb-8">Configura els paràmetres del torneig en 4 passos</p>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium mb-2 ${currentStep >= step.number ? 'bg-[#D85A30] text-white' : 'bg-[#D3D1C7] text-[#5F5E5A]'}`}>
                    {step.number}
                  </div>
                  <p className={`text-[13px] ${currentStep >= step.number ? 'text-[#D85A30] font-medium' : 'text-[#5F5E5A]'}`}>{step.label}</p>
                </div>
                {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-4 ${currentStep > step.number ? 'bg-[#D85A30]' : 'bg-[#D3D1C7]'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <Card className="mb-4 bg-[#FFE8E8] border border-[#FF6B6B]">
              <p className="text-[#A32D2D]">{error}</p>
            </Card>
          )}

          <Card>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div>
                <h3 className="mb-6">Informació del torneig</h3>
                <div className="space-y-4 mb-8">
                  <Input label="Nom del torneig" value={formData.tournamentName}
                    onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })} placeholder="Ex: Lliga d'estiu 2026" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Esport</label>
                    <select value={formData.sport} onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D85A30]">
                      <option value="futsal">Futbol Sala</option>
                      <option value="basquet3x3">Bàsquet 3x3</option>
                      <option value="padel">Pàdel</option>
                    </select>
                  </div>
                </div>
                <h3 className="mb-6">Instal·lacions</h3>
                <div className="space-y-6">
                  <Input type="number" label="Nombre de pistes" value={formData.numCourts}
                    onChange={(e) => setFormData({ ...formData, numCourts: parseInt(e.target.value) || 0 })} />
                  {formData.courts.map((court, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-[#F1EFE8] rounded-lg">
                      <Input label={`Nom pista ${i + 1}`} value={court.name}
                        onChange={(e) => { const c = [...formData.courts]; c[i].name = e.target.value; setFormData({ ...formData, courts: c }); }} />
                      <Input label="Ubicació" value={court.location}
                        onChange={(e) => { const c = [...formData.courts]; c[i].location = e.target.value; setFormData({ ...formData, courts: c }); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div>
                <h3 className="mb-6">Estructura del torneig</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block mb-3">Format del torneig</label>
                    <div className="flex gap-3">
                      {['lliga', 'grups', 'eliminatria', 'mixt'].map((fmt) => (
                        <button key={fmt} onClick={() => setFormData({ ...formData, format: fmt })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${formData.format === fmt ? 'border-[#D85A30] bg-[#FAECE7] text-[#D85A30]' : 'border-[#D3D1C7] text-[#5F5E5A] hover:bg-[#F1EFE8]'}`}>
                          {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(formData.format === 'grups' || formData.format === 'mixt') && (
                    <Input type="number" label="Nombre d'equips per grup" value={formData.teamsPerGroup}
                      onChange={(e) => setFormData({ ...formData, teamsPerGroup: parseInt(e.target.value) || 0 })} />
                  )}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div>
                <h3 className="mb-6">Sistema de puntuació</h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <Input type="number" label="Punts per victòria" value={formData.winPoints}
                    onChange={(e) => setFormData({ ...formData, winPoints: parseInt(e.target.value) || 0 })} />
                  <Input type="number" label="Punts per empat" value={formData.drawPoints}
                    onChange={(e) => setFormData({ ...formData, drawPoints: parseInt(e.target.value) || 0 })} />
                  <Input type="number" label="Punts per derrota" value={formData.lossPoints}
                    onChange={(e) => setFormData({ ...formData, lossPoints: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Criteri de desempat</label>
                  <select value={formData.tiebreaker} onChange={(e) => setFormData({ ...formData, tiebreaker: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D85A30]">
                    <option value="goal_difference">Diferència de gols/punts</option>
                    <option value="head_to_head">Enfrontament directe</option>
                    <option value="goals_for">Més gols/punts a favor</option>
                    <option value="goals_against">Menys gols/punts en contra</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {currentStep === 4 && (
              <div>
                <h3 className="mb-6">Configuració de temps i dates</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <Input type="date" label="Data d'inici" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                  <Input type="date" label="Data de fi" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <Input type="number" label="Durada del partit (minuts)" value={formData.matchDuration}
                    onChange={(e) => setFormData({ ...formData, matchDuration: parseInt(e.target.value) || 0 })} />
                  <Input type="number" label="Pausa entre partits (minuts)" value={formData.breakBetween}
                    onChange={(e) => setFormData({ ...formData, breakBetween: parseInt(e.target.value) || 0 })} />
                </div>
                <Input type="number" label="Màxim de partits per dia" value={formData.matchesPerDay}
                  onChange={(e) => setFormData({ ...formData, matchesPerDay: parseInt(e.target.value) || 0 })} />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#D3D1C7]">
              <Button variant="ghost" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}>Anterior</Button>
              {currentStep < 4 ? (
                <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>Següent</Button>
              ) : (
                <Button variant="primary" onClick={handleGenerate} disabled={isLoading}>
                  {isLoading ? 'Generant...' : 'Generar calendari'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
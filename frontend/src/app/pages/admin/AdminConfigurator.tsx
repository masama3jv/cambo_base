import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';

export default function AdminConfigurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { number: 1, label: 'Instal·lacions' },
    { number: 2, label: 'Estructura' },
    { number: 3, label: 'Puntuació' },
    { number: 4, label: 'Temps' },
  ];

  const [formData, setFormData] = useState({
    // Step 1
    numCourts: 2,
    courts: [
      { name: 'Pista 1', location: 'Pavellò A' },
      { name: 'Pista 2', location: 'Pavellò A' },
    ],
    // Step 2
    format: 'mixt',
    teamsPerGroup: 4,
    // Step 3
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    // Step 4
    matchDuration: 40,
    breakBetween: 15,
  });

  const handleGenerateCalendar = () => {
    setShowPreview(true);
  };

  if (showPreview) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="mb-8">Previsualització del calendari</h1>
            <Card className="mb-6">
              <h3 className="mb-6">Calendari generat</h3>
              <div className="space-y-4">
                {[
                  { date: '10 Maig 2026', time: '18:00', court: 'Pista 1', teams: 'FC Barcelona vs Real Madrid', referee: 'Joan Pérez' },
                  { date: '10 Maig 2026', time: '19:00', court: 'Pista 2', teams: 'Valencia vs Sevilla', referee: 'Marc García' },
                  { date: '11 Maig 2026', time: '10:00', court: 'Pista 1', teams: 'Athletic vs Atlético', referee: 'Pau López' },
                  { date: '11 Maig 2026', time: '11:00', court: 'Pista 2', teams: 'Real Sociedad vs Betis', referee: 'David Martí' },
                ].map((match, i) => (
                  <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-[12px] text-[#5F5E5A] mb-1">DATA I HORA</p>
                      <p className="text-[13px] font-medium text-[#2C2C2A]">{match.date}</p>
                      <p className="text-[13px] text-[#5F5E5A]">{match.time}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#5F5E5A] mb-1">PISTA</p>
                      <p className="text-[13px] font-medium text-[#2C2C2A]">{match.court}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[12px] text-[#5F5E5A] mb-1">PARTIT</p>
                      <p className="text-[13px] font-medium text-[#2C2C2A]">{match.teams}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#5F5E5A] mb-1">ÀRBITRE</p>
                      <p className="text-[13px] font-medium text-[#2C2C2A]">{match.referee}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="flex gap-4 justify-end">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                Tornar a editar
              </Button>
              <Button variant="primary">Publicar calendari</Button>
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
          <p className="text-[#5F5E5A] mb-8">
            Configura els paràmetres del torneig en 4 passos
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-medium mb-2 ${
                      currentStep >= step.number
                        ? 'bg-[#D85A30] text-white'
                        : 'bg-[#D3D1C7] text-[#5F5E5A]'
                    }`}
                  >
                    {step.number}
                  </div>
                  <p
                    className={`text-[13px] ${
                      currentStep >= step.number ? 'text-[#D85A30] font-medium' : 'text-[#5F5E5A]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 ${
                      currentStep > step.number ? 'bg-[#D85A30]' : 'bg-[#D3D1C7]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card>
            {/* Step 1: Instal·lacions */}
            {currentStep === 1 && (
              <div>
                <h3 className="mb-6">Instal·lacions</h3>
                <div className="space-y-6">
                  <Input
                    type="number"
                    label="Nombre de pistes"
                    value={formData.numCourts}
                    onChange={(e) => setFormData({ ...formData, numCourts: parseInt(e.target.value) })}
                  />
                  {formData.courts.map((court, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-[#F1EFE8] rounded-lg">
                      <Input
                        label={`Nom pista ${i + 1}`}
                        value={court.name}
                        onChange={(e) => {
                          const newCourts = [...formData.courts];
                          newCourts[i].name = e.target.value;
                          setFormData({ ...formData, courts: newCourts });
                        }}
                      />
                      <Input
                        label="Ubicació"
                        value={court.location}
                        onChange={(e) => {
                          const newCourts = [...formData.courts];
                          newCourts[i].location = e.target.value;
                          setFormData({ ...formData, courts: newCourts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Estructura */}
            {currentStep === 2 && (
              <div>
                <h3 className="mb-6">Estructura del torneig</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block mb-3">Format del torneig</label>
                    <div className="flex gap-3">
                      {['grups', 'lliga', 'eliminatoria', 'mixt'].map((format) => (
                        <button
                          key={format}
                          onClick={() => setFormData({ ...formData, format })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            formData.format === format
                              ? 'border-[#D85A30] bg-[#FAECE7] text-[#D85A30]'
                              : 'border-[#D3D1C7] text-[#5F5E5A] hover:bg-[#F1EFE8]'
                          }`}
                        >
                          {format.charAt(0).toUpperCase() + format.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(formData.format === 'grups' || formData.format === 'mixt') && (
                    <Input
                      type="number"
                      label="Nombre d'equips per grup"
                      value={formData.teamsPerGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, teamsPerGroup: parseInt(e.target.value) })
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Puntuació */}
            {currentStep === 3 && (
              <div>
                <h3 className="mb-6">Sistema de puntuació</h3>
                <div className="grid grid-cols-3 gap-6">
                  <Input
                    type="number"
                    label="Punts per victòria"
                    value={formData.winPoints}
                    onChange={(e) => setFormData({ ...formData, winPoints: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    label="Punts per empat"
                    value={formData.drawPoints}
                    onChange={(e) => setFormData({ ...formData, drawPoints: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    label="Punts per derrota"
                    value={formData.lossPoints}
                    onChange={(e) => setFormData({ ...formData, lossPoints: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Temps */}
            {currentStep === 4 && (
              <div>
                <h3 className="mb-6">Configuració de temps</h3>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Durada del partit (minuts)"
                    value={formData.matchDuration}
                    onChange={(e) =>
                      setFormData({ ...formData, matchDuration: parseInt(e.target.value) })
                    }
                  />
                  <Input
                    type="number"
                    label="Pausa entre partits (minuts)"
                    value={formData.breakBetween}
                    onChange={(e) =>
                      setFormData({ ...formData, breakBetween: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#D3D1C7]">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              {currentStep < 4 ? (
                <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Següent
                </Button>
              ) : (
                <Button variant="primary" onClick={handleGenerateCalendar}>
                  Generar calendari
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

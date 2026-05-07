import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { UserPlus } from 'lucide-react';

export default function CapitaDashboard() {
  const inscriptionSteps = [
    { label: 'Pendent docs', active: false, completed: true },
    { label: 'Pendent pagament', active: false, completed: true },
    { label: 'Pendent validació', active: true, completed: false },
    { label: 'Inscrit', active: false, completed: false },
    { label: 'Actiu', active: false, completed: false },
  ];

  const upcomingMatches = [
    {
      date: '10 Maig 2026',
      time: '18:00',
      court: 'Pista 1',
      opponent: 'Real Madrid CF',
      status: 'confirmed' as const,
    },
    {
      date: '17 Maig 2026',
      time: '20:00',
      court: 'Pista 2',
      opponent: 'Valencia CF',
      status: 'confirmed' as const,
    },
    {
      date: '24 Maig 2026',
      time: '19:00',
      court: 'Pista 1',
      opponent: 'Atlètic de Madrid',
      status: 'pending' as const,
    },
  ];

  const teamPlayers = [
    { name: 'Joan Garcia', dniStatus: 'approved' as const, insuranceStatus: 'approved' as const },
    { name: 'Marc López', dniStatus: 'approved' as const, insuranceStatus: 'approved' as const },
    { name: 'Pau Martí', dniStatus: 'pending' as const, insuranceStatus: 'pending' as const },
    { name: 'David Soler', dniStatus: 'approved' as const, insuranceStatus: 'rejected' as const },
  ];

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard label="Proper partit" value="10 Maig" subtitle="18:00 · Pista 1" />
            <MetricCard label="Posició classificació" value="3è" subtitle="Grup A" />
            <MetricCard label="Documents pendents" value="2" subtitle="Rebutjat: 1" />
            <MetricCard label="Partits jugats" value="8" subtitle="5V · 2E · 1D" />
          </div>

          {/* Inscription Status */}
          <Card className="mb-8">
            <h3 className="mb-6">Estat de la inscripció</h3>
            <div className="flex items-center justify-between gap-4">
              {inscriptionSteps.map((step, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full h-2 rounded-full ${
                      step.completed
                        ? 'bg-[#3B6D11]'
                        : step.active
                        ? 'bg-[#D85A30]'
                        : 'bg-[#D3D1C7]'
                    }`}
                  />
                  <p
                    className={`text-[12px] font-medium text-center ${
                      step.active ? 'text-[#D85A30]' : 'text-[#5F5E5A]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Upcoming Matches */}
            <Card>
              <h3 className="mb-6">Pròxims partits</h3>
              <div className="space-y-4">
                {upcomingMatches.map((match, i) => (
                  <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-[#2C2C2A]">vs {match.opponent}</p>
                        <p className="text-[13px] text-[#5F5E5A]">
                          {match.date} · {match.time}
                        </p>
                        <p className="text-[13px] text-[#5F5E5A]">{match.court}</p>
                      </div>
                      <Badge variant={match.status === 'confirmed' ? 'approved' : 'pending'}>
                        {match.status === 'confirmed' ? 'Confirmat' : 'Pendent'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Team Panel */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3>El meu equip</h3>
                <Button variant="secondary" className="flex items-center gap-2">
                  <UserPlus size={16} />
                  Convidar jugador
                </Button>
              </div>
              <div className="space-y-3">
                {teamPlayers.map((player, i) => (
                  <div key={i} className="p-3 bg-[#F1EFE8] rounded-lg">
                    <p className="font-medium text-[#2C2C2A] mb-2">{player.name}</p>
                    <div className="flex gap-2">
                      <Badge variant={player.dniStatus}>
                        DNI: {player.dniStatus === 'approved' ? 'Aprovat' : player.dniStatus === 'pending' ? 'Pendent' : 'Rebutjat'}
                      </Badge>
                      <Badge variant={player.insuranceStatus}>
                        Assegurança: {player.insuranceStatus === 'approved' ? 'Aprovat' : player.insuranceStatus === 'pending' ? 'Pendent' : 'Rebutjat'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

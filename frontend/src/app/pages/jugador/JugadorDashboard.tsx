import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { FileText } from 'lucide-react';

export default function JugadorDashboard() {
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

  const recentMatches = [
    {
      date: '3 Maig 2026',
      opponent: 'Sevilla FC',
      result: '5-3',
      won: true,
    },
    {
      date: '26 Abril 2026',
      opponent: 'Athletic Club',
      result: '2-2',
      won: null,
    },
    {
      date: '19 Abril 2026',
      opponent: 'Real Sociedad',
      result: '1-4',
      won: false,
    },
  ];

  const personalStats = {
    goals: 12,
    assists: 8,
    matchesPlayed: 8,
    yellowCards: 2,
    redCards: 0,
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="jugador" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <MetricCard label="Partits jugats" value={personalStats.matchesPlayed} subtitle="Temporada 2026" />
            <MetricCard label="Proper partit" value="10 Maig" subtitle="18:00 · Pista 1" />
            <MetricCard
              label="Estadístiques"
              value={`${personalStats.goals}G / ${personalStats.assists}A`}
              subtitle="Gols i assistències"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
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

            {/* Personal Stats */}
            <Card>
              <h3 className="mb-6">Estadístiques personals</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#D85A30]">{personalStats.goals}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Gols</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#D85A30]">{personalStats.assists}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Assistències</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#854F0B]">{personalStats.yellowCards}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Targetes grogues</p>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-lg text-center">
                  <p className="text-[32px] font-medium text-[#A32D2D]">{personalStats.redCards}</p>
                  <p className="text-[13px] text-[#5F5E5A]">Targetes vermelles</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Match Results */}
          <Card>
            <h3 className="mb-6">Resultats recents</h3>
            <div className="space-y-4">
              {recentMatches.map((match, i) => (
                <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2C2C2A]">vs {match.opponent}</p>
                    <p className="text-[13px] text-[#5F5E5A]">{match.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[22px] font-medium text-[#2C2C2A]">{match.result}</p>
                    <Badge
                      variant={
                        match.won === true ? 'approved' : match.won === false ? 'rejected' : 'pending'
                      }
                    >
                      {match.won === true ? 'Victòria' : match.won === false ? 'Derrota' : 'Empat'}
                    </Badge>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <FileText size={16} />
                      Veure acta
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

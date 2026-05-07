import { Link } from 'react-router';
import { Sidebar } from '../../components/Sidebar';
import { MetricCard, Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const pendingValidations = [
    { team: 'FC Barcelona', captain: 'Joan Garcia', players: 4, sport: 'Futsal' },
    { team: 'Real Madrid CF', captain: 'Sergio Ramos', players: 5, sport: 'Bàsquet 3x3' },
    { team: 'Valencia CF', captain: 'David Silva', players: 4, sport: 'Futsal' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Admin Dashboard</h1>

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard label="Equips inscrits" value="24" subtitle="3 esports" />
            <MetricCard label="Pendents validació" value="3" subtitle="Requereixen revisió" />
            <MetricCard label="Partits programats" value="48" subtitle="Pròximes 2 setmanes" />
            <MetricCard label="Pistes actives" value="6" subtitle="2 instal·lacions" />
          </div>

          {/* Pending Validations Alert */}
          <Card className="mb-8 border-l-4 border-l-[#854F0B]">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-[#854F0B] mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-[#854F0B] mb-2">Validacions pendents</h3>
                <p className="text-[#5F5E5A] mb-4">
                  Hi ha {pendingValidations.length} equips pendents de validació de documents
                </p>
                <Link to="/admin/inscriptions">
                  <Button variant="secondary">Revisar inscripcions</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Pending Teams Table */}
          <Card>
            <h3 className="mb-6">Equips pendents de validació</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D3D1C7]">
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Equip
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Esport
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Capità
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Jugadors
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Estat
                    </th>
                    <th className="text-left py-3 px-4 text-[12px] font-medium text-[#5F5E5A] uppercase tracking-wider">
                      Acció
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidations.map((team, i) => (
                    <tr key={i} className="border-b border-[#D3D1C7] last:border-0">
                      <td className="py-4 px-4 font-medium text-[#2C2C2A]">{team.team}</td>
                      <td className="py-4 px-4">
                        <Badge variant="info">{team.sport}</Badge>
                      </td>
                      <td className="py-4 px-4 text-[#5F5E5A]">{team.captain}</td>
                      <td className="py-4 px-4 text-[#5F5E5A]">{team.players}</td>
                      <td className="py-4 px-4">
                        <Badge variant="pending">Pendent validació</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Link to="/admin/inscriptions">
                          <Button variant="secondary">Revisar</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

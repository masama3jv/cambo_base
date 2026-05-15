import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Calendar as CalendarIcon } from 'lucide-react';

interface Match {
  id: string;
  date: string;
  time: string;
  opponent: string;
  court: string;
  status: 'confirmed' | 'pending' | 'played';
}

export default function CapitaCalendar() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        // API call to get matches would go here
        const response = await fetch('/api/team/matches');
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch matches');
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setMatches(data.matches || []);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">Error: {error}</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="mb-8">Calendari</h1>
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon size={32} className="text-[#D85A30]" />
              </div>
              <h3 className="mb-2">No hi ha partits programats encara</h3>
              <p className="text-[#5F5E5A]">
                Els partits apareixeran aquí un cop es generi el calendari del torneig
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-8">Calendari</h1>
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#2C2C2A] mb-1">vs {match.opponent}</p>
                    <p className="text-[13px] text-[#5F5E5A]">
                      {match.date} · {match.time}
                    </p>
                    <p className="text-[13px] text-[#5F5E5A]">{match.court}</p>
                  </div>
                  <Badge variant={match.status === 'confirmed' ? 'approved' : match.status === 'played' ? 'info' : 'pending'}>
                    {match.status === 'confirmed' ? 'Confirmat' : match.status === 'played' ? 'Jugat' : 'Pendent'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

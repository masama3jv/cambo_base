import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { CheckCircle, Calendar, FileCheck, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="flex flex-col items-center text-center gap-8">
          <Badge variant="info">Gestió de tornejos esportius</Badge>
          <h1 className="max-w-4xl">
            Gestiona tornejos esportius de forma{' '}
            <span className="text-[#D85A30]">professional</span>
          </h1>
          <p className="text-[18px] text-[#5F5E5A] max-w-2xl">
            Plataforma completa per a la gestió d'inscripcions, validació documental, calendaris i actes de partit en temps real
          </p>
          <div className="flex gap-4">
            <Link to="/register">
              <Button variant="primary">Inscriu el teu equip</Button>
            </Link>
            <Button variant="secondary">Veure com funciona</Button>
          </div>
        </div>
      </section>

      {/* Sports Strip */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="flex justify-center gap-6">
          <Badge variant="info">Futbol Sala</Badge>
          <Badge variant="info">Bàsquet 3x3</Badge>
          <Badge variant="info">Pàdel</Badge>
        </div>
      </section>

      {/* Public Calendar/Results Section */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-center mb-12">Pròxims Partits i Resultats</h2>
        <div className="grid grid-cols-2 gap-8">
          <Card>
            <h3 className="mb-6">Pròxims Partits</h3>
            <div className="space-y-4">
              {[
                { teams: 'FC Barcelona vs Real Madrid', date: 'Dissabte 10 Maig, 18:00', court: 'Pista 1' },
                { teams: 'Valencia vs Sevilla', date: 'Diumenge 11 Maig, 10:00', court: 'Pista 2' },
                { teams: 'Athletic vs Atlético', date: 'Diumenge 11 Maig, 12:00', court: 'Pista 1' },
              ].map((match, i) => (
                <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg">
                  <p className="font-medium text-[#2C2C2A] mb-1">{match.teams}</p>
                  <p className="text-[13px] text-[#5F5E5A]">{match.date} · {match.court}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-6">Resultats Recents</h3>
            <div className="space-y-4">
              {[
                { teams: 'FC Barcelona 5 - 3 Real Madrid', date: 'Dilluns 5 Maig' },
                { teams: 'Valencia 2 - 2 Sevilla', date: 'Diumenge 4 Maig' },
                { teams: 'Athletic 4 - 1 Atlético', date: 'Dissabte 3 Maig' },
              ].map((result, i) => (
                <div key={i} className="p-4 bg-[#F1EFE8] rounded-lg">
                  <p className="font-medium text-[#2C2C2A] mb-1">{result.teams}</p>
                  <p className="text-[13px] text-[#5F5E5A]">{result.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-center mb-12">Característiques</h2>
        <div className="grid grid-cols-4 gap-6">
          <Card className="text-center">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="mb-2">Inscripcions digitals</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Inscriu el teu equip en minuts amb formularis digitals
            </p>
          </Card>
          <Card className="text-center">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileCheck className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="mb-2">Validació documental</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Puja i valida documents de forma segura i automàtica
            </p>
          </Card>
          <Card className="text-center">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="mb-2">Calendaris automàtics</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Generació automàtica de calendaris segons disponibilitat
            </p>
          </Card>
          <Card className="text-center">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="mb-2">Actes en temps real</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Els àrbitres registren incidents des del mòbil
            </p>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section id="com-funciona" className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-center mb-12">Com funciona</h2>
        <div className="grid grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Registra\'t', desc: 'Crea un compte com a capità d\'equip' },
            { step: '2', title: 'Puja documents', desc: 'Puja DNI i assegurança de cada jugador' },
            { step: '3', title: 'Paga la inscripció', desc: 'Completa el pagament de forma segura' },
            { step: '4', title: 'Juga!', desc: 'Rep el calendari i comença a competir' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-[#D85A30] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-[24px] font-medium">
                {item.step}
              </div>
              <h3 className="mb-2">{item.title}</h3>
              <p className="text-[13px] text-[#5F5E5A]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-center mb-12">Rols d'usuari</h2>
        <div className="grid grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-[#D85A30]">
            <h3 className="text-[#D85A30] mb-2">Capità</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Crea i gestiona el teu equip, inscriu-te als tornejos
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#185FA5]">
            <h3 className="text-[#185FA5] mb-2">Jugador</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Consulta calendari, partits i estadístiques personals
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#3B6D11]">
            <h3 className="text-[#3B6D11] mb-2">Administrador</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Control complet del torneig i validació de documents
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#854F0B]">
            <h3 className="text-[#854F0B] mb-2">Àrbitre</h3>
            <p className="text-[13px] text-[#5F5E5A]">
              Registra incidents i tanca actes des del mòbil
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-[#2C2C2A] py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-white mb-6">Comença ara mateix</h2>
          <Link to="/register">
            <Button variant="primary">Inscriu l'equip ara</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D3D1C7] border-t-[0.5px] py-8">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-[13px] text-[#5F5E5A]">
            © 2026 CampoBase. Tots els drets reservats.
          </p>
        </div>
      </footer>
    </div>
  );
}

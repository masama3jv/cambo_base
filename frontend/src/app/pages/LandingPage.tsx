import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { CheckCircle, Calendar, FileCheck, Clock, Trophy, Mail, Phone, MapPin, Users, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Match {
  teams: string;
  date: string;
  court: string;
}

interface Result {
  teams: string;
  date: string;
}

export default function LandingPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoadingTournament, setIsLoadingTournament] = useState(true);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setIsLoadingTournament(true);
        const response = await fetch('/api/public/matches');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setMatches(data.upcomingMatches || []);
            setResults(data.results || []);
          }
        }
      } catch (err) {
        console.error('Error loading tournament data:', err);
        setMatches([]);
        setResults([]);
      } finally {
        setIsLoadingTournament(false);
      }
    };

    fetchTournamentData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAECE7] via-[#FFFDFB] to-[#F1EFE8] text-[#2C2C2A] selection:bg-[#D85A30] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-6 sm:gap-8 z-10">
            <Badge variant="info" className="px-3 py-1 text-sm bg-white border border-[#D3D1C7]/50 shadow-sm text-[#D85A30]">
              ✨ Gestió de tornejos esportius de nova generació
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[#2C2C2A]">
              Gestiona tornejos esportius de forma{' '}
              <span className="bg-gradient-to-r from-[#D85A30] to-[#E37A56] bg-clip-text text-transparent">
                professional
              </span>
            </h1>
            <p className="text-[16px] sm:text-[18px] text-[#5F5E5A] max-w-xl leading-relaxed">
              La plataforma premium per a la gestió integral d'inscripcions, validació documental segura, calendaris automatitzats i actes digitalitzades en temps real.
            </p>
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-md shadow-[#D85A30]/10 hover:shadow-lg hover:shadow-[#D85A30]/20 transition-all duration-300">
                  Inscriu el teu equip
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#com-funciona" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center">
                  Saber-ne més
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Right */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            {/* Soft Ambient Light Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D85A30]/10 to-[#EAF3DE]/10 rounded-3xl filter blur-3xl -z-10" />
            
            <div className="w-full max-w-[450px] aspect-square rounded-2xl border border-white/50 bg-white/20 backdrop-blur-md p-4 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-rotate-1">
              <img 
                src="http://localhost:3002/uploads/campobase_hero_banner.png" 
                alt="CampoBase Sports Platform Illustration"
                className="w-full h-full object-cover rounded-xl shadow-inner bg-slate-900/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sports / Tournaments Section */}
      <section id="tornejos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D3D1C7]/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-4">🏆 Les Nostres Lligues</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#2C2C2A]">
            Inscriu el teu equip al torneig actiu
          </h2>
          <p className="text-[#5F5E5A]">
            Selecciona la modalitat que més t'agradi. Formats competitius, sistemes homologats i premis per als millors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Futsal Card */}
          <div className="group rounded-2xl border-[1px] border-[#D3D1C7]/50 bg-gradient-to-br from-[#FFFBF9] to-[#FFF4F0] p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#D85A30]/30 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FAECE7] text-[#D85A30] flex items-center justify-center mb-6 font-bold text-xl shadow-inner">
                ⚽
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2C2C2A] group-hover:text-[#D85A30] transition-colors">Futbol Sala</h3>
              <p className="text-sm text-[#5F5E5A] mb-6 leading-relaxed">
                Lliga de futbol sala 5 contra 5. Pista de parquet reglamentària, partits de 40 minuts cronometrats i àrbitres oficials.
              </p>
              <div className="space-y-2 mb-8 text-[13px] text-[#5F5E5A]">
                <p className="flex items-center gap-2">🟢 <span className="font-semibold">Categories:</span> Masculí, Femení i Mixt</p>
                <p className="flex items-center gap-2">⏱️ <span className="font-semibold">Format:</span> Lliga Regular + Play-offs</p>
                <p className="flex items-center gap-2">📍 <span className="font-semibold">Pista:</span> Pavelló CampoBase</p>
              </div>
            </div>
            <Link to="/register">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                Inscriure Equip
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Basket Card */}
          <div className="group rounded-2xl border-[1px] border-[#D3D1C7]/50 bg-gradient-to-br from-[#F5FAFD] to-[#E9F3F9] p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#185FA5]/30 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#E6EFF6] text-[#185FA5] flex items-center justify-center mb-6 font-bold text-xl shadow-inner">
                🏀
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2C2C2A] group-hover:text-[#185FA5] transition-colors">Bàsquet 3x3</h3>
              <p className="text-sm text-[#5F5E5A] mb-6 leading-relaxed">
                Format olímpic d'alta intensitat a mitja pista. 10 minuts de joc ràpid, possessió de 12 segons i ambient esportiu premium.
              </p>
              <div className="space-y-2 mb-8 text-[13px] text-[#5F5E5A]">
                <p className="flex items-center gap-2">🟢 <span className="font-semibold">Categories:</span> Sub-18, Senior i Veterans</p>
                <p className="flex items-center gap-2">⏱️ <span className="font-semibold">Format:</span> Fase de Grups + Eliminatòries</p>
                <p className="flex items-center gap-2">📍 <span className="font-semibold">Pista:</span> Pistes Exteriors CampoBase</p>
              </div>
            </div>
            <Link to="/register">
              <Button variant="primary" className="w-full bg-[#185FA5] hover:bg-[#124980] flex items-center justify-center gap-2">
                Inscriure Equip
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Padel Card */}
          <div className="group rounded-2xl border-[1px] border-[#D3D1C7]/50 bg-gradient-to-br from-[#F7FCF5] to-[#EEF7EB] p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#3B6D11]/30 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EBF5E6] text-[#3B6D11] flex items-center justify-center mb-6 font-bold text-xl shadow-inner">
                🎾
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2C2C2A] group-hover:text-[#3B6D11] transition-colors">Pàdel per Parelles</h3>
              <p className="text-sm text-[#5F5E5A] mb-6 leading-relaxed">
                Lliga de pàdel en format parelles. Partits a 3 sets complets amb punt d'or. Quadre d'iniciació, intermedi i avançat.
              </p>
              <div className="space-y-2 mb-8 text-[13px] text-[#5F5E5A]">
                <p className="flex items-center gap-2">🟢 <span className="font-semibold">Categories:</span> 1a, 2a i 3a Divisió</p>
                <p className="flex items-center gap-2">⏱️ <span className="font-semibold">Format:</span> Lliga Round-Robin</p>
                <p className="flex items-center gap-2">📍 <span className="font-semibold">Pistes:</span> 6 Pistes Panoràmiques</p>
              </div>
            </div>
            <Link to="/register">
              <Button variant="primary" className="w-full bg-[#3B6D11] hover:bg-[#2C520D] flex items-center justify-center gap-2">
                Inscriure Equip
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Calendar/Results Section - Only show if there's data */}
      {!isLoadingTournament && (matches.length > 0 || results.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="info" className="mb-4">📅 Actualitat</Badge>
            <h2 className="text-3xl font-bold text-[#2C2C2A]">Pròxims Partits i Resultats</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {matches.length > 0 && (
              <Card className="p-6 bg-white border border-[#D3D1C7]/30 shadow-md">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#2C2C2A]">
                  <Clock className="text-[#D85A30]" size={20} />
                  Pròxims Partits
                </h3>
                <div className="space-y-4">
                  {matches.slice(0, 3).map((match, i) => (
                    <div key={i} className="p-4 bg-[#F1EFE8]/50 rounded-xl hover:bg-[#F1EFE8] transition-colors">
                      <p className="font-bold text-[#2C2C2A] text-[15px] mb-1">{match.teams}</p>
                      <p className="text-[13px] text-[#5F5E5A]">{match.date} · {match.court}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {results.length > 0 && (
              <Card className="p-6 bg-white border border-[#D3D1C7]/30 shadow-md">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#2C2C2A]">
                  <Trophy className="text-[#185FA5]" size={20} />
                  Resultats Recents
                </h3>
                <div className="space-y-4">
                  {results.slice(0, 3).map((result, i) => (
                    <div key={i} className="p-4 bg-[#F1EFE8]/50 rounded-xl hover:bg-[#F1EFE8] transition-colors">
                      <p className="font-bold text-[#2C2C2A] text-[15px] mb-1">{result.teams}</p>
                      <p className="text-[13px] text-[#5F5E5A]">{result.date}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D3D1C7]/30 bg-white/40 rounded-3xl backdrop-blur-sm mb-20 shadow-inner">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-4">⚡ Tot en Un</Badge>
          <h2 className="text-3xl font-bold text-[#2C2C2A]">Plataforma Automatitzada</h2>
          <p className="text-[#5F5E5A] mt-2">Tecnologia avançada dissenyada per estalviar temps i oferir un servei impecable.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-white border border-[#D3D1C7]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="font-bold text-[16px] mb-2 text-[#2C2C2A]">Inscripcions digitals</h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Registra el teu equip i la teva plantilla digitalment en pocs minuts.
            </p>
          </Card>
          
          <Card className="text-center p-6 bg-white border border-[#D3D1C7]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileCheck className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="font-bold text-[16px] mb-2 text-[#2C2C2A]">Validació documental</h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Pujada segura i validació automàtica del DNI i de les assegurances.
            </p>
          </Card>

          <Card className="text-center p-6 bg-white border border-[#D3D1C7]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="font-bold text-[16px] mb-2 text-[#2C2C2A]">Calendaris intel·ligents</h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Algoritmes que generen dates de joc evitant conflictes de calendari.
            </p>
          </Card>

          <Card className="text-center p-6 bg-white border border-[#D3D1C7]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-[#FAECE7] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Clock className="text-[#D85A30]" size={24} />
            </div>
            <h3 className="font-bold text-[16px] mb-2 text-[#2C2C2A]">Actes en temps real</h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Els àrbitres anoten incidents al mòbil per a una actualització instantània.
            </p>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section id="com-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D3D1C7]/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-4">⚙️ El Procés</Badge>
          <h2 className="text-3xl font-bold text-[#2C2C2A]">Com Funciona?</h2>
          <p className="text-[#5F5E5A] mt-2">D'un compte buit a competir a la pista en 4 senzills passos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {[
            { step: '1', title: "Crea el teu compte", desc: "Registra't com a capità a la plataforma." },
            { step: '2', title: "Configura l'equip", desc: "Introdueix les dades bàsiques de l'equip i convida jugadors." },
            { step: '3', title: "Puja i valida docs", desc: "S'adjunten els DNI i assegurances a cada jugador convidat." },
            { step: '4', title: "Pagament i a jugar!", desc: "Completa el pagament i comença la lliga segons calendari." },
          ].map((item, index) => (
            <div key={item.step} className="text-center group relative flex flex-col items-center">
              <div className="w-16 h-16 bg-[#D85A30] text-white rounded-full flex items-center justify-center mb-6 text-[22px] font-bold shadow-lg shadow-[#D85A30]/10 transition-transform duration-300 group-hover:scale-110">
                {item.step}
              </div>
              <h3 className="font-bold text-[16px] mb-2 text-[#2C2C2A]">{item.title}</h3>
              <p className="text-[13px] text-[#5F5E5A] leading-relaxed max-w-[200px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D3D1C7]/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-4">👥 Rols Dinàmics</Badge>
          <h2 className="text-3xl font-bold text-[#2C2C2A]">Espais de Treball a Mida</h2>
          <p className="text-[#5F5E5A] mt-2">Interfícies especialitzades per a cada tipus de participant.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-[#D85A30] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#D85A30] font-bold text-[16px] mb-2 flex items-center gap-2">
              ⚽ Capità
            </h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Gestiona fitxatges, puja documentació, tramita pagaments i rep actualitzacions de l'estat d'inscripció.
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#185FA5] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#185FA5] font-bold text-[16px] mb-2 flex items-center gap-2">
              🏀 Jugador
            </h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Consulta resultats, classificacions en temps real, l'agenda personal de partits i les teves estadístiques.
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#3B6D11] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#3B6D11] font-bold text-[16px] mb-2 flex items-center gap-2">
              🛡️ Administrador
            </h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Valida equips, gestiona l'aprovació documental, resol incidències i organitza divisions de lliga de forma centralitzada.
            </p>
          </Card>
          <Card className="border-l-4 border-l-[#854F0B] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#854F0B] font-bold text-[16px] mb-2 flex items-center gap-2">
              ⏱️ Àrbitre
            </h3>
            <p className="text-[13px] text-[#5F5E5A] leading-relaxed">
              Controla partits des de qualsevol dispositiu mòbil, registra gols, targetes, punts i tanca i genera l'acta PDF oficial a l'instant.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#D85A30] to-[#E37A56] py-16 sm:py-20 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight">Comença a competir avui mateix</h2>
          <p className="text-[16px] sm:text-[18px] text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
            Inscriu el teu club o grup d'amics a les millors lligues de la ciutat. Registre fàcil, segur i 100% online.
          </p>
          <Link to="/register">
            <Button variant="primary" className="!bg-white !text-[#D85A30] hover:!bg-neutral-100 hover:!text-[#993C1D] shadow-lg flex items-center gap-2 mx-auto">
              Inscriu l'equip ara
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Premium Footer & Contact Section */}
      <footer id="contacte" className="bg-[#2C2C2A] text-white border-t border-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Footer Col 1 - Brand info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#D85A30]">CampoBase</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                El programari líder en automatització de tornejos esportius amateurs i professionals de futbol sala, bàsquet 3x3 i pàdel.
              </p>
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#D85A30] transition-colors cursor-pointer">🌐</span>
                <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#D85A30] transition-colors cursor-pointer">📸</span>
                <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#D85A30] transition-colors cursor-pointer">🐦</span>
              </div>
            </div>

            {/* Footer Col 2 - Quick Links */}
            <div>
              <h4 className="text-[15px] font-semibold uppercase tracking-wider mb-6 text-neutral-300">Modalitats</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="#tornejos" className="hover:text-[#D85A30] transition-colors">Lliga de Futbol Sala</a></li>
                <li><a href="#tornejos" className="hover:text-[#D85A30] transition-colors">Torneig de Bàsquet 3x3</a></li>
                <li><a href="#tornejos" className="hover:text-[#D85A30] transition-colors">Circuit de Pàdel per Parelles</a></li>
              </ul>
            </div>

            {/* Footer Col 3 - Navigation */}
            <div>
              <h4 className="text-[15px] font-semibold uppercase tracking-wider mb-6 text-neutral-300">Plataforma</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="#com-funciona" className="hover:text-[#D85A30] transition-colors">Com funciona</a></li>
                <li><Link to="/login" className="hover:text-[#D85A30] transition-colors">Accés Participants</Link></li>
                <li><Link to="/register" className="hover:text-[#D85A30] transition-colors">Inscripcions</Link></li>
              </ul>
            </div>

            {/* Footer Col 4 - Contact info */}
            <div className="space-y-4">
              <h4 className="text-[15px] font-semibold uppercase tracking-wider mb-6 text-neutral-300">Contacte (Test)</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li className="flex items-start gap-2">
                  <Mail size={16} className="text-[#D85A30] mt-0.5" />
                  <span>info@campobase.cat</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone size={16} className="text-[#D85A30] mt-0.5" />
                  <span>+34 93 123 4567</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-[#D85A30] mt-0.5" />
                  <span>Passeig de Gràcia, 100, Barcelona</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between text-[13px] text-neutral-500 gap-4">
            <p>© 2026 CampoBase. Tots els drets reservats. Projecte dissenyat per a la gestió professional de clubs.</p>
            <div className="flex gap-6">
              <span className="hover:underline cursor-pointer">Avís legal</span>
              <span className="hover:underline cursor-pointer">Política de privacitat</span>
              <span className="hover:underline cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

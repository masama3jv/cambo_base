import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#D3D1C7] sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-[24px] font-semibold text-[#D85A30] hover:opacity-90 transition-opacity">
              CampoBase
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#tornejos" className="text-[#2C2C2A] hover:text-[#D85A30] font-medium transition-colors text-[14px]">
              Tornejos
            </a>
            <a href="/#com-funciona" className="text-[#2C2C2A] hover:text-[#D85A30] font-medium transition-colors text-[14px]">
              Com funciona
            </a>
            <a href="/#contacte" className="text-[#2C2C2A] hover:text-[#D85A30] font-medium transition-colors text-[14px]">
              Contacte
            </a>
            <Link to="/login">
              <Button variant="primary">Accedir</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#5F5E5A] hover:text-[#D85A30] hover:bg-[#FAECE7] transition-colors focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-[#D3D1C7]/30 bg-white px-4 py-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="/#tornejos"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-[15px] font-medium text-[#2C2C2A] hover:text-[#D85A30] hover:bg-[#FAECE7] transition-all"
          >
            Tornejos
          </a>
          <a
            href="/#com-funciona"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-[15px] font-medium text-[#2C2C2A] hover:text-[#D85A30] hover:bg-[#FAECE7] transition-all"
          >
            Com funciona
          </a>
          <a
            href="/#contacte"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-[15px] font-medium text-[#2C2C2A] hover:text-[#D85A30] hover:bg-[#FAECE7] transition-all"
          >
            Contacte
          </a>
          <div className="pt-2">
            <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full">
              <Button variant="primary" className="w-full">Accedir</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

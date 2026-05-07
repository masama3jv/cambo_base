import { Link } from 'react-router';
import { Button } from './Button';

export function Navbar() {
  return (
    <nav className="bg-white border-b border-[#D3D1C7] border-b-[0.5px]">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-[24px] font-medium text-[#D85A30]">
          CampoBase
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/#tornejos" className="text-[#2C2C2A] hover:text-[#D85A30] transition-colors">
            Tornejos
          </Link>
          <Link to="/#com-funciona" className="text-[#2C2C2A] hover:text-[#D85A30] transition-colors">
            Com funciona
          </Link>
          <Link to="/#contacte" className="text-[#2C2C2A] hover:text-[#D85A30] transition-colors">
            Contacte
          </Link>
          <Link to="/login">
            <Button variant="primary">Accedir</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

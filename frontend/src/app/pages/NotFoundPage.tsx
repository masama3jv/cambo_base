import { Link } from 'react-router';
import { Button } from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-[#D85A30] mb-4">404</h1>
        <h2 className="mb-4">Pàgina no trobada</h2>
        <p className="text-[#5F5E5A] mb-8">
          La pàgina que busques no existeix o no tens permís per accedir-hi.
        </p>
        <Link to="/">
          <Button variant="primary">Tornar a l'inici</Button>
        </Link>
      </div>
    </div>
  );
}

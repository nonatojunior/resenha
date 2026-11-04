import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="logo" to="/" aria-label="Resenha Secreta — página inicial">
      <span className="logo__mark" aria-hidden="true">
        <Sparkles size={20} />
      </span>
      <span className="logo__text">
        <strong>Resenha</strong>
        <em>Secreta</em>
        {compact ? null : <small>Quem é quem no grupo?</small>}
      </span>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { LoaderCircle, TriangleAlert, Ghost } from 'lucide-react';
import { LinkButton } from './Button';

export function LoadingState({ message = 'Preparando a resenha…' }: { message?: string }) {
  return (
    <div className="feedback-state" role="status" aria-live="polite">
      <LoaderCircle className="spin feedback-state__icon" size={34} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export function ErrorState({
  title = 'Deu ruim, mas dá para resolver.',
  message,
  onRetry,
  showHome = true,
}: ErrorStateProps) {
  return (
    <div className="feedback-state feedback-state--error">
      <TriangleAlert className="feedback-state__icon" size={34} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="feedback-state__actions">
        {onRetry ? (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Tentar de novo
          </button>
        ) : null}
        {showHome ? (
          <LinkButton to="/" variant="secondary">
            Voltar ao início
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="feedback-state feedback-state--empty">
      <Ghost className="feedback-state__icon" size={34} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      <Link className="text-link" to="/">
        Voltar ao início
      </Link>
    </div>
  );
}

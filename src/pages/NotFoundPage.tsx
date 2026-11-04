import { Link } from 'react-router-dom';
import { ArrowRight, Ghost, Home, KeyRound, Sparkles } from 'lucide-react';
import { LinkButton } from '../components/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <div className="page page--not-found">
      <div className="container not-found">
        <div className="not-found__visual" aria-hidden="true">
          <span>4</span>
          <span className="not-found__ghost">
            <Ghost size={72} />
          </span>
          <span>4</span>
        </div>

        <span className="eyebrow">
          <Sparkles size={16} aria-hidden="true" /> Link perdido no rolê
        </span>
        <h1>Essa página não entrou na resenha</h1>
        <p>
          O endereço pode estar incompleto, a sala pode ter sido excluída ou alguém digitou o
          link com a mão molhada. Nenhum voto foi perdido por causa disso.
        </p>

        <div className="not-found__actions">
          <LinkButton to="/" size="lg" icon={<Home size={19} aria-hidden="true" />}>
            Voltar ao início
          </LinkButton>
          <LinkButton
            to="/entrar"
            variant="secondary"
            size="lg"
            icon={<KeyRound size={19} aria-hidden="true" />}
          >
            Entrar com código
          </LinkButton>
        </div>

        <p className="not-found__hint">
          Tem um convite? Confira o código de 6 caracteres.{' '}
          <Link className="text-link" to="/criar">
            Ou crie sua própria resenha <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  );
}
